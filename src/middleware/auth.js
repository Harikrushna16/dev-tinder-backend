const jwt = require("jsonwebtoken");
const User = require("../models/user");

const userAuth = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            res.status(401).json({ message: "invalid token, login again...!!!" });
        }
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const { id } = decodedToken;
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        req.user = user;
        next();
    } catch (error) {
        res.status(400).json({ message: "Failed to fetch user profile", error });
    }
}

module.exports = { userAuth };