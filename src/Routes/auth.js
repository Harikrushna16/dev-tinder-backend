const express = require("express");
const authRouter = express.Router();
const User = require("../models/user");
const validator = require("validator");
const bcrypt = require("bcrypt");
const { validateSignUpData } = require("../utils/validation");
const { sendVerificationEmail } = require("../utils/email");
const crypto = require("crypto");

authRouter.post("/signup", async (req, res) => {
    try {
        const validationResult = validateSignUpData(req);
        if (!validationResult.isValid) {
            return res.status(400).json({ message: validationResult.message });
        }

        const { firstName, lastName, email, password, bio, age, gender, skills, profilePicture } = req.body;
        const userExists = await User.findOne({ email: email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        
        // Generate Verification Token
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const user = new User({ 
            firstName, 
            lastName, 
            email, 
            password: passwordHash, 
            bio, 
            age, 
            gender, 
            skills, 
            profilePicture,
            verificationToken,
            verificationTokenExpires
        });

        const savedUser = await user.save();
        
        // Send Verification Email
        await sendVerificationEmail(savedUser.email, verificationToken);

        res.status(201).json({ message: "User registered successfully. Please check your email to verify your account." });
    } catch (error) {
        res.status(400).json({ message: "User registration failed", error });
    }
});

authRouter.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const isEmailValid = validator.isEmail(email);
        if (!isEmailValid) {
            return res.status(400).json({ message: "Invalid email" });
        }
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!user.isVerified) {
            return res.status(401).json({ message: "Please verify your email before logging in. Check your inbox." });
        }
        const isPasswordValid = await user.comparePassword(password);
        if (isPasswordValid) {
            const token = user.generateToken();
            res.cookie("token", token, {
                httpOnly: true,
                secure: false, // Changed from true to false: since you're using HTTP, secure must be false
                sameSite: "strict", // can also be "lax" based on your needs
                expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            });
            res.status(200).json({ message: "User logged in successfully", data: user });
        } else {
            res.status(400).json({ message: "Invalid credentials" });
        }
    } catch (error) {
        res.status(400).json({ message: "Login failed", error });
    }
});

authRouter.get("/verify/:token", async (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    try {
        const { token } = req.params;

        const user = await User.findOne({
            verificationToken: token,
            verificationTokenExpires: { $gt: Date.now() }, // Token must not be expired
        });

        if (!user) {
            return res.redirect(`${frontendUrl}/verify?status=error&message=Verification+link+is+invalid+or+has+expired`);
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;

        await user.save();

        res.redirect(`${frontendUrl}/verify?status=success&message=Email+verified+successfully`);
    } catch (error) {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        res.redirect(`${frontendUrl}/verify?status=error&message=Email+verification+failed`);
    }
});

authRouter.post("/logout", (req, res) => {
    try {
        res.clearCookie("token");
        res.status(200).json({ message: "User logged out successfully" });
    } catch (error) {
        res.status(400).json({ message: "Logout failed", error });
    }
});

module.exports = authRouter;