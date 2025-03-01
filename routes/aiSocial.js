// routes/aiSocial.js
const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authenticate");
const { AIServiceIntegrator: AISocialIntegrator } = require("../services/CoreAIServices");

// ✅ AI-Enhanced Achievement Sharing
router.post("/achievement/:id/share", authenticate, async (req, res) => {
    try {
        const userAccessToken = req.user.linkedinAccessToken;  // Ensure user has a token
        if (!userAccessToken) {
            return res.status(401).json({ error: "Missing LinkedIn Access Token" });
        }

        const result = await AISocialIntegrator.handleAchievement(req.user._id, req.params.id, userAccessToken);
        res.json(result);
    } catch (error) {
        console.error("❌ Error sharing AI-enhanced achievement:", error);
        res.status(500).json({ error: "Failed to share AI-enhanced achievement" });
    }
});


// ✅ AI-Enhanced Mission Sharing
router.post("/mission/:id/share", authenticate, async (req, res) => {
    try {
        const result = await AISocialIntegrator.handleMissionComplete(req.user._id, req.params.id);
        res.json(result);
    } catch (error) {
        console.error("❌ Error sharing AI-enhanced mission:", error);
        res.status(500).json({ error: "Failed to share AI-enhanced mission" });
    }
});

// ✅ AI-Enhanced Certification Sharing
router.post("/certification/:id/share", authenticate, async (req, res) => {
    try {
        const result = await AISocialIntegrator.handleCertification(req.user._id, req.params.id);
        res.json(result);
    } catch (error) {
        console.error("❌ Error sharing AI-enhanced certification:", error);
        res.status(500).json({ error: "Failed to share AI-enhanced certification" });
    }
});

module.exports = router;
