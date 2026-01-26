import { asyncHandler } from "../utils/async-handler.js";
import User from "../models/user.models.js";
import ApiError from "../utils/api-error.js";
import ApiResponse from "../utils/api-response.js";

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

    await sendEmail({
        email: user?.email,
        subject: "Please verify your email",
        mailgenContent: emailVerificationMailgenContent(
            user.username,
            `${req.protocol}://${req.get(
                "host",
            )}/api/v1/users/verify-email/${unHashedToken}`,
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

const loginUser = asyncHandler(async (req, res) => {});

const logoutUser = asyncHandler(async (req, res) => {});

const verifyEmail = asyncHandler(async (req, res) => {});

const resendVerificationEmail = asyncHandler(async (req, res) => {});

const refreshAccessToken = asyncHandler(async (req, res) => {});

const forgotPasswordRequest = asyncHandler(async (req, res) => {});

const changeCurrentPassword = asyncHandler(async (req, res) => {});

const getCurrentUser = asyncHandler(async (req, res) => {});

export { registerUser };
