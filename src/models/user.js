const validator = require("validator");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        index: true,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: validator.isEmail,
            message: "Please provide a valid email"
        }
    },
    password: {
        type: String,
        required: true,
        minLength: 8,
        validate: {
            validator: validator.isStrongPassword,
            message: "Please provide a strong password"
        }
    },
    age: {
        type: Number,
        min: 18,
        max: 100,
    },
    gender: {
        type: String,
        enum: {
            values: ["male", "female", "other"],
            message: "{VALUE} is not a valid gender"
        },
    },
    bio: {
        type: String,
        default: "This is a default Bio of users",
    },
    skills: {
        type: [String],
        validate: {
            validator: function (value) {
                return value.length <= 4;
            },
            message: "You can add maximum 4 skills only."
        }
    },
    profilePicture: {
        type: String,
        default: "https://www.vhv.rs/dpng/d/256-2569650_men-profile-icon-png-image-free-download-searchpng.png",
        validate: {
            validator: validator.isURL,
            message: "Please provide a valid URL"
        }
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    verificationToken: {
        type: String,
    },
    verificationTokenExpires: {
        type: Date,
    },
},
    {
        timestamps: true,
    }
);

userSchema.index({ firstName: 1, lastName: 1 });

userSchema.methods.generateToken = function () {
    return jwt.sign({ id: this._id }, "Dev@Tinder$16", { expiresIn: "7d" });
}

userSchema.methods.comparePassword = function (userInputPassword) {
    return bcrypt.compare(userInputPassword, this.password);
}

const User = mongoose.model("User", userSchema);

module.exports = User;