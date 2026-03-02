const express = require("express");
const authRouter = express.Router();
const User = require("../models/user");
const validator = require("validator");
const bcrypt = require("bcrypt");
const { validateSignUpData } = require("../utils/validation");

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
        const user = new User({ firstName, lastName, email, password: passwordHash, bio, age, gender, skills, profilePicture });

        const savedUser = await user.save();
        const token = savedUser.generateToken();
        res.cookie("token", token, {
            httpOnly: true,
            secure: false, // Changed from true to false: since you're using HTTP, secure must be false
            sameSite: "strict", // can also be "lax" based on your needs
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
        res.status(201).json({ message: "User registered successfully", data: savedUser });
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

authRouter.post("/logout", (req, res) => {
    try {
        res.clearCookie("token");
        res.status(200).json({ message: "User logged out successfully" });
    } catch (error) {
        res.status(400).json({ message: "Logout failed", error });
    }
});

module.exports = authRouter;