const express = require("express");
const router = express.Router();
const { google } = require("googleapis");
require("dotenv").config();

// Update to use GOOGLE_ prefixed credentials to match your .env
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,         // Changed from YOUTUBE_CLIENT_ID
    process.env.GOOGLE_CLIENT_SECRET,     // Changed from YOUTUBE_CLIENT_SECRET
    process.env.GOOGLE_REDIRECT_URI       // Changed from YOUTUBE_REDIRECT_URI
);

// Add debug logging
router.use((req, res, next) => {
    console.log('🔍 Auth Route Hit:', {
        path: req.path,
        fullUrl: `${req.protocol}://${req.get('host')}${req.originalUrl}`
    });
    next();
});

router.get("/google", (req, res) => {
    console.log("OAuth credentials check:", {
        clientId: process.env.GOOGLE_CLIENT_ID ? "✓ Set" : "✗ Missing",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ? "✓ Set" : "✗ Missing",
        redirectUri: process.env.GOOGLE_REDIRECT_URI
    });
    
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: ["https://www.googleapis.com/auth/youtube.upload"],
        prompt: "consent"
    });
    
    console.log("Generated auth URL:", authUrl);
    res.redirect(authUrl);
});

router.get("/google/callback", async (req, res) => {
    try {
        const { tokens } = await oauth2Client.getToken(req.query.code);
        console.log("✅ OAuth tokens received");
        
        // Update to use GOOGLE_ prefix
        res.send(`
            <h1>Authentication Successful!</h1>
            <p>Add this refresh token to your .env file:</p>
            <pre>GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}</pre>
            <p>Then restart your server.</p>
        `);
    } catch (error) {
        console.error("❌ Google OAuth Failed:", error);
        res.status(500).send("Authentication failed: " + error.message);
    }
});

module.exports = router;