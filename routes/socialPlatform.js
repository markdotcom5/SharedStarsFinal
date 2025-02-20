// routes/socialPlatform.js
const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authenticate");
const SocialPlatformIntegrator = require("../services/SocialPlatformIntegrator");
const { google } = require("googleapis");
require("dotenv").config(); // Ensure environment variables are loaded

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

// ✅ Google OAuth Client Setup
const oauth2Client = new google.auth.OAuth2(
    OAUTH_TOKENS.google.client_id,
    OAUTH_TOKENS.google.client_secret,
    OAUTH_TOKENS.google.redirect_uri
);

// ✅ Refresh Google OAuth Token
async function refreshGoogleToken() {
    try {
        oauth2Client.setCredentials({ refresh_token: OAUTH_TOKENS.google.refresh_token });
        const { credentials } = await oauth2Client.refreshAccessToken();
        console.log("✅ Google Token Refreshed:", credentials.access_token);
        return credentials.access_token;
    } catch (error) {
        console.error("❌ Google Token Refresh Failed:", error);
        return null;
    }
}

// ✅ Standard Social Announcements
const shareEvent = async (req, res, eventType) => {
    try {
        const result = await SocialPlatformIntegrator.shareEvent(eventType, {
            user: req.user,
            details: { ...req.body, id: req.params.id }
        });
        res.json(result);
    } catch (error) {
        console.error(`❌ Error announcing ${eventType}:`, error);
        res.status(500).json({ error: `Failed to announce ${eventType}` });
    }
};

// ✅ Traditional Social Sharing Routes
router.post("/announce/join", authenticate, (req, res) => shareEvent(req, res, "newJoin"));
router.post("/announce/certification/:id", authenticate, (req, res) => shareEvent(req, res, "certification"));
router.post("/announce/mission/:id", authenticate, (req, res) => shareEvent(req, res, "missionComplete"));
router.post("/announce/module/:id", authenticate, (req, res) => shareEvent(req, res, "moduleComplete"));
router.post("/announce/team/:id", authenticate, (req, res) => shareEvent(req, res, "teamFormation"));
router.post("/announce/leaderboard/:id", authenticate, (req, res) => shareEvent(req, res, "leaderboardUpdate"));
router.post("/announce/milestone/:id", authenticate, (req, res) => shareEvent(req, res, "milestone"));
router.post("/announce/achievement/:id", authenticate, (req, res) => shareEvent(req, res, "achievement"));

// ✅ Standard Sharing to Social Media Platforms
const socialPlatforms = ["facebook", "xcom", "linkedin", "tiktok", "telegram", "instagram", "youtube"];
router.get("/auth/google", (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: ["https://www.googleapis.com/auth/youtube.upload"], // YouTube Upload Scope
    });
    res.redirect(authUrl);
});
// Add at the top of your socialPlatform.js
router.get('/test', (req, res) => {
    console.log("Social platform route hit!");
    res.json({ message: "Social platform routes working" });
});
// Google OAuth Callback Route
router.get("/auth/google/callback", async (req, res) => {
    try {
        const { tokens } = await oauth2Client.getToken(req.query.code);
        oauth2Client.setCredentials(tokens);
        console.log("✅ Google OAuth Tokens:", tokens);

        // Store the refresh token for future use
        res.send("Google authentication successful! You can now upload videos.");
    } catch (error) {
        console.error("❌ Google OAuth Failed:", error);
        res.status(500).send("Authentication failed.");
    }
});

router.post("/share/video", authenticate, SocialPlatformIntegrator.mediaProcessor.single('media'), async (req, res) => {
    try {
        const { platform } = req.body;
        const filePath = req.file.path;

        if (!["youtube", "tiktok"].includes(platform)) {
            return res.status(400).json({ error: "Invalid platform. Choose YouTube or TikTok." });
        }

        console.log(`🔄 Uploading video to ${platform}...`);

        // Upload Video
        const result = await SocialPlatformIntegrator.uploadVideo(platform, {
            user: req.user,
            filePath,
            title: req.body.title || "SharedStars Video",
            description: req.body.description || "Uploaded via API"
        });

        console.log("✅ Video Uploaded:", result);

        // Cross-post the video link
        const shareResults = [];
        const socialPlatforms = req.body.platforms || [];

        for (const sharePlatform of socialPlatforms) {
            const shareResult = await SocialPlatformIntegrator.shareEvent(sharePlatform, {
                user: req.user,
                text: `Check out my new video: ${result.videoURL}`,
                media: null
            });
            shareResults.push({ platform: sharePlatform, result: shareResult });
        }

        res.json({ success: true, videoURL: result.videoURL, shared: shareResults });
    } catch (error) {
        console.error("❌ Error Uploading & Sharing Video:", error);
        res.status(500).json({ error: "Failed to upload & share video" });
    }
});


router.post("/share/:platform/:id", authenticate, async (req, res) => {
    const { platform, id } = req.params;
    if (!socialPlatforms.includes(platform)) {
        return res.status(400).json({ error: "Invalid social media platform" });
    }
    try {
        const result = await SocialPlatformIntegrator.shareEvent(platform, {
            user: req.user,
            details: { ...req.body, id }
        });
        res.json(result);
    } catch (error) {
        console.error(`❌ Error sharing on ${platform}:`, error);
        res.status(500).json({ error: `Failed to share on ${platform}` });
    }
});
router.post("/share/youtube", authenticate, async (req, res) => {
    try {
        // Refresh Google Token
        const accessToken = await refreshGoogleToken();
        if (!accessToken) {
            return res.status(500).json({ error: "Google token refresh failed" });
        }

        // Upload Video to YouTube
        const youtube = google.youtube({ version: "v3", auth: oauth2Client });
        const response = await youtube.videos.insert({
            part: "snippet,status",
            requestBody: {
                snippet: {
                    title: req.body.title || "SharedStars Video",
                    description: req.body.description || "Uploaded via API",
                },
                status: { privacyStatus: "public" }
            },
            media: { body: require("fs").createReadStream(req.file.path) }
        });

        console.log("✅ Video Uploaded:", response.data);
        
        // Get YouTube Video URL
        const youtubeURL = `https://www.youtube.com/watch?v=${response.data.id}`;

        // Share on Other Platforms
        const platforms = req.body.platforms || []; // List of platforms to share on
        const shareResults = [];

        for (const platform of platforms) {
            const result = await SocialPlatformIntegrator.shareEvent(platform, {
                user: req.user,
                text: `Check out my new video on YouTube: ${youtubeURL}`,
                media: null // No need to attach media, just link
            });
            shareResults.push({ platform, result });
        }

        res.json({ youtubeURL, shared: shareResults });
    } catch (error) {
        console.error("❌ Error Uploading & Sharing:", error);
        res.status(500).json({ error: "Failed to upload & share video" });
    }
});
router.post("/share/xcom", authenticate, async (req, res) => {
    try {
        const text = req.body.text;
        if (!text) {
            return res.status(400).json({ error: "Tweet content is required." });
        }

        // Post on X.com
        const tweetResult = await SocialPlatformIntegrator.shareEvent("xcom", {
            user: req.user,
            text
        });

        console.log("✅ Tweet Posted:", tweetResult);
        
        // Share Tweet on Other Platforms
        const platforms = req.body.platforms || []; // List of platforms to share on
        const shareResults = [];

        for (const platform of platforms) {
            const result = await SocialPlatformIntegrator.shareEvent(platform, {
                user: req.user,
                text: `I just tweeted: "${text}"! Check it out!`,
                media: null
            });
            shareResults.push({ platform, result });
        }

        res.json({ tweetResult, shared: shareResults });
    } catch (error) {
        console.error("❌ Error Posting Tweet & Sharing:", error);
        res.status(500).json({ error: "Failed to post & share tweet." });
    }
});

// ✅ Secure Media Sharing with OAuth Token Handling
router.post("/share/:platform", 
    authenticate,
    SocialPlatformIntegrator.mediaProcessor.single('media'),
    async (req, res) => {
        try {
            let token = null;
            if (req.params.platform === "youtube") {
                token = await refreshGoogleToken();
                if (!token) {
                    return res.status(500).json({ error: "Google token refresh failed" });
                }
            }

            const result = await SocialPlatformIntegrator.shareEvent(
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
            if (error instanceof RateLimitError) {
                res.status(429).json({
                    error: error.message,
                    resetTime: error.resetTime
                });
            } else if (error instanceof MediaProcessingError) {
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
    }
);

module.exports = router;
