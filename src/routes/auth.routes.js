import { Router } from "express";
import {
    registerUser,
    loginUser,
    verifyEmail,
    logoutUser,
    resendVerificationEmail,
    refreshAccessToken,
    forgotPasswordRequest,
} from "../controllers/auth.controllers.js";
import {
    userRegistrationValidator,
    userLoginValidator,
    userForgotPasswordValidator,
} from "../validators/index.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validator.middleware.js";

const router = Router();
router
    .route("/register")
    .post(userRegistrationValidator(), validate, registerUser);

router.route("/login").post(userLoginValidator(), validate, loginUser);
router.route("/verify-email/:verificationToken").get(verifyEmail);
router.route("/logout").post(verifyJWT, logoutUser);
router
    .route("/resend-verification-email")
    .post(verifyJWT, resendVerificationEmail);

router
    .route("/forgot-password")
    .post(userForgotPasswordValidator(), validate, forgotPasswordRequest);

router.route("/refresh-token").post(refreshAccessToken);
export default router;
