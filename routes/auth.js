const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Import User model
const router = express.Router();

// =======================
// Authenticate Middleware
// =======================
const authenticate = async (req, res, next) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ error: "Authentication required" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        req.user = user; // Attach user object to request
        next();
    } catch (error) {
        console.error("Authentication failed:", error.message);
        return res.status(401).json({ error: "Authentication failed" });
    }
};

// =======================
// Signup Route
// =======================
router.post("/signup", async (req, res) => {
    try {
        const { username, email, password, spaceReadinessScore, division } = req.body;

        let user = await User.findOne({ email: email.trim().toLowerCase() });
        if (user) {
            return res.status(400).json({ error: "User already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
        user = new User({
            username,
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            spaceReadinessScore,
            division
        });

        await user.save();

        // Generate JWT Token
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.status(201).json({ message: "User created", token, user: user.toObject() });
    } catch (error) {
        console.error("Signup Error:", error.message);
        res.status(500).json({ error: "Server error" });
    }
});

// =======================
// Login Route
// =======================
router.post("/login", async (req, res) => {
    try {
        console.log("🔍 Received login request:", req.body);

        const email = req.body.email.trim().toLowerCase();
        const user = await User.findOne({ email });

        console.log("✅ Found User:", user ? "Yes" : "No");

        if (!user) {
            console.error("🚨 User not found in database.");
            return res.status(400).json({ error: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(req.body.password, user.password);
        console.log("🔍 Password Match Result:", isMatch);

        if (!isMatch) {
            console.error("🚨 Password does NOT match.");
            return res.status(400).json({ error: "Invalid email or password" });
        }

        const token = jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id.toString(),
                email: user.email,
                name: user.username
            }
        });
    } catch (error) {
        console.error("🚨 Login Error:", error.message);
        res.status(500).json({ error: "An unexpected error occurred. Please try again." });
    }
});

// =======================
// Logout Route
// =======================
router.post("/logout", (req, res) => {
    res.status(200).json({ message: "Logout successful" });
});

// =======================
// Password Reset Route
// =======================
router.post("/reset-password", async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        console.log("Reset attempt for email:", email);

        const user = await User.findOne({ email: email.trim().toLowerCase() });
        console.log("User found:", !!user);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        console.log("Password hashed successfully");

        await User.updateOne({ email }, { $set: { password: hashedPassword } });

        res.json({ message: "Password reset successful" });
    } catch (error) {
        console.error("Detailed Reset Error:", error);
        res.status(500).json({ error: "Password reset failed", details: error.message });
    }
});

// =======================
// Admin Creation Route
// =======================
router.post("/create-admin", async (req, res) => {
    try {
        const { adminSecret } = req.body;

        if (adminSecret !== process.env.ADMIN_SECRET) {
            return res.status(403).json({ error: "Invalid admin secret" });
        }

        const existingAdmin = await User.findOne({ email: "admin@steltrek.com" });
        if (existingAdmin) {
            return res.status(400).json({
                error: "Admin already exists",
                message: "Use the login route with this email to get an auth token",
            });
        }

        const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
        const adminUser = new User({
            email: "admin@steltrek.com",
            password: hashedPassword,
            roles: ["admin", "user"],
        });

        await adminUser.save();

        const token = jwt.sign({ userId: adminUser._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.status(201).json({
            message: "Admin created successfully",
            token,
            credentials: { email: "admin@steltrek.com" },
        });
    } catch (error) {
        console.error("Admin Creation Error:", error.message);
        res.status(500).json({ error: "An unexpected error occurred. Please try again." });
    }
});

module.exports = router;
