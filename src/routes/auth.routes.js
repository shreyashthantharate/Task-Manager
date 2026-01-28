import { Router } from "express";
import {
    registerUser,
    loginUser,
    verifyEmail,
} from "../controllers/auth.controllers.js";
import {
    userRegistrationValidator,
    userLoginValidator,
} from "../validators/index.js";
import { validate } from "../middlewares/validator.middleware.js";

const router = Router();
router
    .route("/register")
    .post(userRegistrationValidator(), validate, registerUser);

router.route("/login").post(userLoginValidator(), validate, loginUser);
router.route("/verify-email/:verificationToken").get(verifyEmail);
export default router;
