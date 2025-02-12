const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
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
        console.log("Received signup data:", req.body);
        // Destructure the correct fields that match what's being sent
        const { name, email, password } = req.body;  // Changed from username to name

        let user = await User.findOne({ email: email.trim().toLowerCase() });
        if (user) {
            return res.status(400).json({ error: "User already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Create new user with the correct fields
        user = new User({
            name,  // Use name directly, not username
            email: email.trim().toLowerCase(),
            password: hashedPassword
        });

        await user.save();

        // In auth.js and signup.js, standardize all token generations to:
          const token = jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.status(201).json({ message: "User created", token, user: user.toObject() });
    } catch (error) {
        console.error("Signup Error:", error.message);
        res.status(500).json({ error: "Server error" });
    }
});
// =======================
// Login Route
router.post("/login", async (req, res) => {
    try {
        console.log("🔍 Received login request:", req.body);

        const email = req.body.email.trim().toLowerCase();
        const user = await User.findOne({ email });

        console.log("✅ Found User:", user ? user.email : "No user found");

        if (!user) {
            console.error("🚨 User not found in database.");
            return res.status(400).json({ error: "Invalid email or password" });
        }

        console.log("🔑 Stored Hashed Password:", user.password);
        console.log("🔑 Entered Password:", req.body.password);

        const isMatch = await bcrypt.compare(String(req.body.password), String(user.password));
        console.log("🔍 Password Match Result:", isMatch);

        if (!isMatch) {
            console.error("🚨 Password does NOT match.");
            return res.status(400).json({ error: "Invalid email or password" });
        }

        // In auth.js and signup.js, standardize all token generations to:
const token = jwt.sign(
    { userId: user._id.toString() },  // Always convert _id to string
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
);

        res.json({
            success: true,
            token,
            user: {
                id: user._id.toString(),
                email: user.email,
                name: user.name
            }
        });
    } catch (error) {
        console.error("🚨 Login Error:", error.message);
        res.status(500).json({ error: "An unexpected error occurred. Please try again." });
    }
});

// Register Route
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ error: "User already exists" });
        }

        // Create new user
        user = new User({
            name,
            email,
            password
        });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        // In auth.js and signup.js, standardize all token generations to:
const token = jwt.sign(
    { userId: user._id.toString() },  // Always convert _id to string
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
);

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name
            }
        });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Registration failed", details: error.message });
    }
});

// Get Current User
router.get("/me", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(user);
    } catch (error) {
        console.error("Auth error:", error);
        res.status(401).json({ error: "Invalid token" });
    }
});

// =======================
// Logout Route
router.post("/logout", (req, res) => {
    res.clearCookie('token');
    res.json({ success: true, message: "Logged out successfully" });
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

        // In auth.js and signup.js, standardize all token generations to:
        const token = jwt.sign({ userId: adminUser._id.toString() }, process.env.JWT_SECRET, { expiresIn: "7d" });

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
