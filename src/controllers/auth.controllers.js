import { asyncHandler } from "../utils/async-handler.js";
import { userRegistrationValidator } from "../validators/index.js";

const registerUser = asyncHandler(async (req, res) => {
    userRegistrationValidator(body);
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
