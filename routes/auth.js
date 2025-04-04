const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();
const CLIENT_ID = "78o2w7lzi4ex8m";
const CLIENT_SECRET = "WPL_AP1.d4V8I5a0ODdg8Sb7.+bUAig==";
const REDIRECT_URI = "http://localhost:3000/api/auth/linkedin/callback";
const axios = require("axios");
const emailService = require("../services/emailService");
const config = require("../config");

// This function should just be defined, not executed
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

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

        // Generate OTP
        const otp = generateOTP();
        console.log("Generated OTP for", email, ":", otp); // Added logging
        const otpExpires = Date.now() + 5 * 60 * 1000; // OTP expires in 5 minutes
        
        // Create new user with the correct fields
        user = new User({
            name,  // Use name directly, not username
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            isVerified: false,
            otp,
            otpExpires
        });

        await user.save();

        // ✅ Send OTP Email with better logging
        try {
            console.log("Attempting to send OTP email to:", email);
            await emailService.sendOTPEmail(email, otp);
            console.log("OTP email sent successfully");
        } catch (emailError) {
            console.error("Failed to send OTP email:", emailError);
            // Continue with the response even if email fails
        }

        res.status(201).json({ message: "OTP sent. Redirecting to verification page." });
    } catch (error) {
        console.error("Signup Error:", error.message);
        res.status(500).json({ error: "Server error" });
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
// Add this to your auth.js file
router.post("/verify-otp", async (req, res) => {
    try {
      const { email, otp } = req.body;
      
      const user = await User.findOne({ 
        email: email.trim().toLowerCase(),
        otp: otp,
        otpExpires: { $gt: Date.now() }
      });
      
      if (!user) {
        return res.status(400).json({ success: false, error: "Invalid or expired OTP" });
      }
      
      // Mark user as verified
      user.isVerified = true;
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();
      
      // Generate token for auto-login after verification
      const token = jwt.sign(
        { userId: user._id.toString() },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      
      res.json({ 
        success: true, 
        message: "Email verified successfully",
        token,
        redirectUrl: '/mission-control'
      });
      
    } catch (error) {
      console.error('❌ Error verifying OTP:', error);
      res.status(500).json({ success: false, error: "Failed to verify email" });
    }
  });
router.get("/linkedin/callback", async (req, res) => {
    const authorizationCode = req.query.code;

    if (!authorizationCode) {
        return res.status(400).json({ error: "Authorization code is missing" });
    }

    // Load LinkedIn OAuth credentials from environment variables
    const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
    const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
    const REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI;

    // Ensure environment variables are set
    if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
        console.error("❌ Missing LinkedIn OAuth environment variables!");
        return res.status(500).json({ error: "Server misconfiguration: LinkedIn OAuth credentials missing" });
    }

    try {
        const response = await axios.post(
            "https://www.linkedin.com/oauth/v2/accessToken",
            new URLSearchParams({
                grant_type: "authorization_code",
                code: authorizationCode,
                redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
                client_id: process.env.LINKEDIN_CLIENT_ID,
                client_secret: process.env.LINKEDIN_CLIENT_SECRET
            }),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );        

        const accessToken = response.data.access_token;
        console.log("✅ LinkedIn Access Token retrieved successfully");

        // Return the token securely (remove logging for production)
        res.json({ access_token: accessToken });

    } catch (error) {
        console.error("❌ Error exchanging code for token:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to exchange authorization code for access token" });
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
// Password Reset Request Route
// =======================
router.post("/reset-request", async (req, res) => {
    try {
        const { email } = req.body;
        console.log("Reset request received for:", email);

        // Trim and lowercase the email
        const sanitizedEmail = email.trim().toLowerCase();

        // Check if user exists
        const user = await User.findOne({ email: sanitizedEmail });
        console.log("User found:", !!user);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Generate JWT reset token (valid for 1 hour)
        const token = jwt.sign({ email: sanitizedEmail }, process.env.JWT_SECRET, { expiresIn: "1h" });

        // Create reset link with the JWT token
        const resetLink = `${config.baseUrl}/change-password.html?token=${token}`;

        // Send reset email
        await emailService.sendResetPasswordEmail(sanitizedEmail, resetLink);
        console.log("Reset email sent successfully to:", sanitizedEmail);

        res.json({ message: "Password reset link sent to your email." });

    } catch (error) {
        console.error("Error in password reset request:", error);
        res.status(500).json({ error: "Failed to process password reset request", details: error.message });
    }
});


// =======================
// Password Reset Route
// =======================
// router.post("/reset-password", async (req, res) => {
//     try {
//         const { email, newPassword } = req.body;
//         console.log("Reset attempt for email:", email);

//         console.log("EMAILLLLL::::", email);

//         const user = await User.findOne({ email: email });
//         console.log("User found:", !!user);

//         if (!user) {
//             return res.status(404).json({ error: "User notttttt found" });
//         }

//         const hashedPassword = await bcrypt.hash(newPassword, 12);
//         console.log("Password hashed successfully");

//         await User.updateOne({ email }, { $set: { password: hashedPassword } });

//         res.json({ message: "Password reset successful" });
//     } catch (error) {
//         console.error("Detailed Reset Error:", error);
//         res.status(500).json({ error: "Password reset failed", details: error.message });
//     }
// });

router.post("/reset-password", async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        console.log("Reset attempt with token:", token);

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const email = decoded.email;
        console.log("Decoded email from token:", email);

        // Check if user exists
        const user = await User.findOne({ email });
        console.log("User found:", !!user);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        console.log("Password hashed successfully");

        // Update password in the database
        await User.updateOne({ email }, { $set: { password: hashedPassword } });

        res.json({ message: "Password reset successful" });
    } catch (error) {
        console.error("🚨 Error in resetPassword:", error);
        res.status(400).json({ error: "Invalid or expired reset token" });
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
