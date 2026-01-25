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
    ];
};

const usereLoginValidator = () => {
    return [
        body("email")
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Email is not valid"),

        body("password").notEmpty().withMessage("Password cannot be empty"),
    ];
};

export { userRegistrationValidator };
