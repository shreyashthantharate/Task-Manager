import { Router } from "express";
import {
    registerUser,
    loginUser,
    verifyEmail,
    logoutUser,
    resendVerificationEmail,
} from "../controllers/auth.controllers.js";
import {
    userRegistrationValidator,
    userLoginValidator,
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
export default router;
