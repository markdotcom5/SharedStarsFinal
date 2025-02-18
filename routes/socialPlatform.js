// routes/socialPlatform.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const SocialPlatformIntegrator = require('../services/SocialPlatformIntegrator');

// ✅ Standard Social Announcements
const shareEvent = async (req, res, eventType) => {
    try {
        const result = await SocialPlatformIntegrator.shareEvent(eventType, {
            user: req.user,
            details: { ...req.body, id: req.params.id },
        });
        res.json(result);
    } catch (error) {
        console.error(`❌ Error announcing ${eventType}:`, error);
        res.status(500).json({ error: `Failed to announce ${eventType}` });
    }
};

// ✅ Traditional Social Sharing Routes
router.post('/announce/join', authenticate, (req, res) => shareEvent(req, res, 'newJoin'));
router.post('/announce/certification/:id', authenticate, (req, res) =>
    shareEvent(req, res, 'certification')
);
router.post('/announce/mission/:id', authenticate, (req, res) =>
    shareEvent(req, res, 'missionComplete')
);
router.post('/announce/module/:id', authenticate, (req, res) =>
    shareEvent(req, res, 'moduleComplete')
);
router.post('/announce/team/:id', authenticate, (req, res) =>
    shareEvent(req, res, 'teamFormation')
);
router.post('/announce/leaderboard/:id', authenticate, (req, res) =>
    shareEvent(req, res, 'leaderboardUpdate')
);
router.post('/announce/milestone/:id', authenticate, (req, res) =>
    shareEvent(req, res, 'milestone')
);
router.post('/announce/achievement/:id', authenticate, (req, res) =>
    shareEvent(req, res, 'achievement')
);

// ✅ Standard Sharing to Social Media Platforms
const socialPlatforms = [
    'facebook',
    'xcom',
    'linkedin',
    'tiktok',
    'telegram',
    'instagram',
    'youtube',
];

router.post('/share/:platform/:id', authenticate, async (req, res) => {
    const { platform, id } = req.params;
    if (!socialPlatforms.includes(platform)) {
        return res.status(400).json({ error: 'Invalid social media platform' });
    }
    try {
        const result = await SocialPlatformIntegrator.shareEvent(platform, {
            user: req.user,
            details: { ...req.body, id },
        });
        res.json(result);
    } catch (error) {
        console.error(`❌ Error sharing on ${platform}:`, error);
        res.status(500).json({ error: `Failed to share on ${platform}` });
    }
});

module.exports = router;
