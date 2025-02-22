const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authenticate");
const socialPlatform = require("../services/SocialPlatformIntegrator");
const { google } = require("googleapis");
const fs = require('fs');
require("dotenv").config();

// Request logging middleware
router.use((req, res, next) => {
    console.log('🔍 Social Platform Route Hit:', {
        method: req.method,
        path: req.path,
        headers: req.headers
    });
    next();
});

// Load OAuth Tokens Securely
const OAUTH_TOKENS = {
    google: {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    },
    facebook: process.env.FACEBOOK_ACCESS_TOKEN,
    linkedin: process.env.LINKEDIN_ACCESS_TOKEN,
    tiktok: process.env.TIKTOK_ACCESS_TOKEN,
    instagram: process.env.INSTAGRAM_ACCESS_TOKEN,
    twitter: {
        access_token: process.env.TWITTER_ACCESS_TOKEN,
        access_secret: process.env.TWITTER_ACCESS_SECRET
    }
};

// Google OAuth Client Setup
const oauth2Client = new google.auth.OAuth2(
    OAUTH_TOKENS.google.client_id,
    OAUTH_TOKENS.google.client_secret,
    OAUTH_TOKENS.google.redirect_uri
);

// Set credentials if refresh token exists
if (OAUTH_TOKENS.google.refresh_token) {
    oauth2Client.setCredentials({
        refresh_token: OAUTH_TOKENS.google.refresh_token
    });
}

// Refresh Google OAuth Token
async function refreshGoogleToken() {
    try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        console.log("✅ Google Token Refreshed:", credentials.access_token);
        return credentials.access_token;
    } catch (error) {
        console.error("❌ Google Token Refresh Failed:", error);
        return null;
    }
}

// Standard Social Announcements helper
const shareEvent = async (req, res, eventType) => {
    try {
        const result = await socialPlatform.shareEvent(eventType, {
            user: req.user,
            details: { ...req.body, id: req.params.id }
        });
        res.json(result);
    } catch (error) {
        console.error(`❌ Error announcing ${eventType}:`, error);
        res.status(500).json({ error: `Failed to announce ${eventType}` });
    }
};

// Traditional announcement routes
router.post("/announce/join", authenticate, (req, res) => shareEvent(req, res, "newJoin"));
router.post("/announce/certification/:id", authenticate, (req, res) => shareEvent(req, res, "certification"));

// ✅ FIXED: Video Upload Route - No duplicates, correct middleware
router.post("/share/video", 
    authenticate,
    socialPlatform.getUploadMiddleware(),
    async (req, res) => {
        console.log("🚀 Incoming Video Upload Request");
        console.log("🔍 Headers:", req.headers);
        console.log("🔍 Body:", req.body);
        console.log("🔍 File:", req.file);

        try {
            const { platform } = req.body;
            
            if (!req.file) {
                console.log("❌ No video file uploaded");
                return res.status(400).json({ error: "No video file uploaded" });
            }
            
            const filePath = req.file.path;
            console.log(`🔄 Uploading video to ${platform}...`, {
                filePath,
                title: req.body.title,
                platform
            });

            if (!["youtube", "tiktok"].includes(platform)) {
                console.log("❌ Invalid platform");
                return res.status(400).json({ error: "Invalid platform. Choose YouTube or TikTok." });
            }

            const result = await socialPlatform.platforms[platform].share({
                title: req.body.title || "SharedStars Video",
                description: req.body.description || "Uploaded via API",
                media: { path: filePath },
                private: req.body.private === 'true'
            });

            console.log("✅ Video Uploaded Successfully:", result);
            res.json({ success: true, videoURL: result.videoURL, videoId: result.videoId });

        } catch (error) {
            console.error("❌ Error Uploading Video:", error);
            res.status(500).json({ error: "Failed to upload video", message: error.message });
        }
    }
);


// Google OAuth routes
router.get("/auth/google", (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: ["https://www.googleapis.com/auth/youtube.upload"],
        prompt: "consent" // Forces refresh token every time
    });
    res.redirect(authUrl);
});

// Test Route
router.get('/test', (req, res) => {
    console.log("Social platform route hit!");
    res.json({ message: "Social platform routes working" });
});
// In your /auth/google route
router.get("/auth/google", (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: ["https://www.googleapis.com/auth/youtube.upload"],
        prompt: "consent"
    });
    console.log("🔍 Generated Auth URL:", authUrl); // Add this line
    res.redirect(authUrl);
});
// Google OAuth Callback Route
router.get("/auth/google/callback", async (req, res) => {
    try {
        const { tokens } = await oauth2Client.getToken(req.query.code);
        oauth2Client.setCredentials(tokens);
        console.log("✅ Google OAuth Tokens:", tokens);

        // Display the refresh token so it can be saved
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

// ✅ FIXED: Platform-specific share route with proper middleware
router.post("/share/:platform", 
    authenticate,
    socialPlatform.getUploadMiddleware(), // Fixed: Only call middleware once
    async (req, res) => {
        try {
            let token = null;
            if (req.params.platform === "youtube") {
                token = await refreshGoogleToken();
                if (!token) {
                    return res.status(500).json({ error: "Google token refresh failed" });
                }
            }

            const result = await socialPlatform.shareEvent(
                req.params.platform, 
                {
                    text: req.body.text,
                    media: req.file,
                    details: req.body,
                    accessToken: token // Pass updated token if needed
                }
            );
            res.json(result);
        } catch (error) {
            if (error.name === 'RateLimitError') {
                res.status(429).json({
                    error: error.message,
                    resetTime: error.resetTime
                });
            } else if (error.name === 'MediaProcessingError') {
                res.status(400).json({
                    error: error.message
                });
            } else {
                res.status(500).json({
                    error: 'Internal server error',
                    message: error.message
                });
            }
        }
    });

module.exports = router;