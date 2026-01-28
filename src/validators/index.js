import { body } from "express-validator";

const userRegistrationValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Email is invlaid"),

        body("username")
            .trim()
            .notEmpty()
            .withMessage("username is required")
            .isLength({ min: 3 })
            .withMessage("Username should be atleast 3 character")
            .isLength({ max: 13 })
            .withMessage("Username cannot exceed 13 character"),

        body("password")
            .notEmpty()
            .withMessage("Password is required")
            .isLength({ min: 6 })
            .withMessage("Password should be at least 6 character long")
            .isLength({ max: 20 })
            .withMessage("Password cannot exceed 20 character"),

        // body("role")
        //     .optional()
        //     .isIn(["user", "admin"])
        //     .withMessage("Role must be either user or admin"),

        body("fullName")
            .optional()
            .trim()
            .notEmpty()
            .withMessage("Full name is required"),
    ];
};

const userLoginValidator = () => {
    return [
        body("email")
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Email is not valid"),

        body("username").notEmpty().withMessage("Username is required").trim(),

        body("password").notEmpty().withMessage("Password cannot be empty"),
    ];
};

export { userRegistrationValidator, userLoginValidator };
