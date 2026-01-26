import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendMail = async (options) => {
    const mailGenerator = new Mailgen({
        theme: "default",
        product: {
            // Appears in header & footer of e-mails
            name: "Task Manager",
            link: "https://mailgen.js/",
        },
    });

    // Generate an HTML email with the provided contents
    var emailHTML = mailGenerator.generate(options.mailGenContent);

    // Generate the plaintext version of the e-mail (for clients that do not support HTML)
    var emailText = mailGenerator.generatePlaintext(options.mailGenContent);

    const transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_HOST,
        port: process.env.MAILTRAP_PORT,
        secure: false, // Use true for port 465, false for port 587
        auth: {
            user: process.env.MAILTRAP_USERNAME,
            pass: process.env.MAILTRAP_PASSWORD,
        },
    });

    const mail = {
        from: process.env.MAILTRAP_SENDEREMAIL,
        to: options.email,
        subject: options.subject,
        text: emailText, // Plain-text version of the message
        html: emailHTML, // HTML version of the message
    };

    try {
        await transporter.sendMail(mail);
    } catch (error) {
        console.error("Email failed", error);
    }
};

const emailVerificationMailGenContent = (username, verificationUrl) => {
    return {
        body: {
            name: username,
            intro: "Welcome to App! We're very excited to have you on board.",
            action: {
                instructions: "To get started with our App, please click here:",
                button: {
                    color: "#22BC66", // Optional action button color
                    text: "Verify your email",
                    link: verificationUrl,
                },
            },
            outro: "Need help, or have questions? Just reply to this email, we'd love to help.",
        },
    };
};

const forgotPasswordMailGenContent = (username, passwordResetUrl) => {
    return {
        body: {
            name: username,
            intro: "We got a request to change your password.",
            action: {
                instructions: "To change your password click the button",
                button: {
                    color: "#22BC66", // Optional action button color
                    text: "Reset Password",
                    link: passwordResetUrl,
                },
            },
            outro: "Need help, or have questions? Just reply to this email, we'd love to help.",
        },
    };
};
