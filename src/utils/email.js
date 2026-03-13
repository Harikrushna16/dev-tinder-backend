const nodemailer = require("nodemailer");

// Create a test account or use your own SMTP credentials
// For testing, ethereal email creates a temporary mailbox
const sendVerificationEmail = async (email, token) => {
    try {
        let transporter;

        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            // Use real SMTP credentials (using Gmail by default here)
            transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
        } else {
            // Generate test SMTP service account from ethereal.email
            // Only needed if you don't have a real mail account for testing
            let testAccount = await nodemailer.createTestAccount();

            // create reusable transporter object using the default SMTP transport
            transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: testAccount.user, // generated ethereal user
                    pass: testAccount.pass, // generated ethereal password
                },
            });
        }

        const verificationLink = `http://localhost:${process.env.PORT}/api/auth/verify/${token}`;

        // send mail with defined transport object
        let info = await transporter.sendMail({
            from: '"DevTinder 👻" <no-reply@devtinder.com>', // sender address
            to: email, // list of receivers
            subject: "Verify Your Email - DevTinder", // Subject line
            text: `Please verify your email by clicking the following link: ${verificationLink}`, // plain text body
            html: `<p>Please verify your email by clicking the following link:</p>
                   <a href="${verificationLink}">Verify Email</a>`, // html body
        });

        console.log("Message sent: %s", info.messageId);
        // Preview only available when sending through an Ethereal account
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Failed to send verification email");
    }
};

module.exports = { sendVerificationEmail };
