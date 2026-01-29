import { asyncHandler } from "../utils/async-handler.js";
import { User } from "../models/user.models.js";
import ApiError from "../utils/api-error.js";
import ApiResponse from "../utils/api-response.js";
import { sendMail, emailVerificationMailGenContent } from "../utils/mail.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save();
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating access token",
        );
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { email, password, username, role } = req.body;

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    console.log(`Existing User is: ${existingUser}`);

    if (existingUser) {
        throw new ApiError(
            401,
            "User with email or username already exists",
            [],
        );
    }
    const user = await User.create({
        email,
        password,
        username,
        isEmailVerified: false,
    });

    const { unHashedToken, hashedToken, tokenExpiry } =
        user.generateTemporaryToken();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;

    await user.save();
    console.log("user is: ", user);
    console.log("unhashed token", unHashedToken);

    await sendMail({
        email: user?.email,
        subject: "Please verify your email",
        mailGenContent: emailVerificationMailGenContent(
            user?.username,
            `${process.env.CORS_ORIGIN}/api/v1/users/verify-email/${unHashedToken}`,

            // user.username,
            // `${req.protocol}://${req.get(
            //     "host",
            // )}/api/v1/users/verify-email/${unHashedToken}`,
            // `${process.env.CORS_ORIGIN}/api/v1/users/verify-email/${unHashedToken}`,
        ),
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
    );

    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went wrong while registering the user",
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { user: createdUser },
                "Users registered successfully and verification email has been sent on your email.",
            ),
        );
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    if (!email && !username) {
        throw new ApiError(400, "Username or email is required");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        user._id,
    );

    // get the user document ignoring the password and refreshToken field
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
    );

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    };
    console.log(`access token is: ${accessToken}`);
    console.log(`refresh token is: ${refreshToken}`);

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser, accessToken, refreshToken }, // send access and refresh token in response if client decides to save them by themselves
                "User logged in successfully",
            ),
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        { $set: { refreshToken: "" } },
        { new: true },
    );
    const option = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    };

    return res
        .status(200)
        .clearCookie("accessToken", option)
        .clearCookie("refreshToken", option)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const verifyEmail = asyncHandler(async (req, res) => {
    const { verificationToken } = req.params;

    if (!verificationToken) {
        throw new ApiError(400, "Verification token is missing");
    }

    // generate hash from a token that we received from the client
    let hashedToken = crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex");

    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: { $gt: Date.now() },
    });

    if (!user) {
        throw new ApiError(404, "Token is invalid or expired");
    }

    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    user.isEmailVerified = true;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { isEmailVerified: true },
                "Email is verified successfully",
            ),
        );
});

// This controller is called when user is logged in and he has snackbar that your email is not verified
// In case he did not get the email or the email verification token is expired
// he will be able to resend the token while he is logged in
const resendVerificationEmail = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new ApiError(404, "User does not exist", []);
    }

    if (user.isEmailVerified) {
        throw new ApiError(400, "Email is already verified");
    }

    const { unHashedToken, hashedToken, tokenExpiry } =
        user.generateTemporaryToken();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;
    await user.save({ validateBeforeSave: false });

    await sendMail({
        email: user?.email,
        subject: "Please verify your email",
        mailGenContent: emailVerificationMailGenContent(
            // user?.username,
            // `${process.env.CORS_ORIGIN}/api/v1/users/verify-email/${unHashedToken}`,

            user.username,
            `${req.protocol}://${req.get(
                "host",
            )}/api/v1/users/verify-email/${unHashedToken}`,
            // `${process.env.CORS_ORIGIN}/api/v1/users/verify-email/${unHashedToken}`,
        ),
    });
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Mail has been send to your mail ID."));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incommingRefreshToken =
        req.cookies?.refreshToken || req.body.refreshToken;

    if (!incommingRefreshToken) {
        throw new ApiError(400, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(
            incommingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        );

        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        // check if incoming refresh token is same as the refresh token attached in the user document
        // This shows that the refresh token is used or not
        // Once it is used, we are replacing it with new refresh token below
        if (incommingRefreshToken !== user?.refreshToken) {
            // If token is valid but is used already
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
        };

        const { accessToken, refreshToken: newRefreshToken } =
            await generateAccessAndRefreshTokens(user._id);

        user.refreshToken = newRefreshToken;
        await user.save({ validateBeforeSave: false });

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token has been refreshed successfully",
                ),
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

const forgotPasswordRequest = asyncHandler(async (req, res) => {});

const changeCurrentPassword = asyncHandler(async (req, res) => {});

const getCurrentUser = asyncHandler(async (req, res) => {});

export {
    registerUser,
    loginUser,
    logoutUser,
    verifyEmail,
    resendVerificationEmail,
    refreshAccessToken,
    forgotPasswordRequest,
    changeCurrentPassword,
    getCurrentUser,
};
