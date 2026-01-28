import { asyncHandler } from "../utils/async-handler.js";
import { User } from "../models/user.models.js";
import ApiError from "../utils/api-error.js";
import ApiResponse from "../utils/api-response.js";
import { sendMail, emailVerificationMailGenContent } from "../utils/mail.js";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);

        const accessTOken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save();
        return { accessTOken, refreshToken };
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

const logoutUser = asyncHandler(async (req, res) => {});

const verifyEmail = asyncHandler(async (req, res) => {});

const resendVerificationEmail = asyncHandler(async (req, res) => {});

const refreshAccessToken = asyncHandler(async (req, res) => {});

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
