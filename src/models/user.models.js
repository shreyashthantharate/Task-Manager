import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
    {
        avatar: {
            type: {
                url: String,
                localpath: String,
            },
            default: {
                url: `https://cdn-icons-png.flaticon.com/512/4333/4333609.png`,
                localpath: "",
            },
        },
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullname: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: [true, "password is required"],
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        forgotPasswordToken: {
            type: String,
        },
        forgotPasswordExpiry: {
            type: Date,
        },
        refreshToken: {
            type: String,
        },
        emailVerificationToken: {
            type: String,
        },
        emailVerificationExpiry: {
            type: Date,
        },
    },
    { timestamps: true },
);

export const User = mongoose.Aggregate("User", userSchema);
