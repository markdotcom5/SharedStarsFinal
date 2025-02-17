const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate'); // Import your authenticate middleware
const ServiceIntegrator = require('../services/ServiceIntegrator');
const SocialPlatformIntegrator = require('../services/SocialPlatformIntegrator');

router.get('/social/:platform', async (req, res) => {
    try {
        const { platform } = req.params;
        console.log(`🔍 Testing ${platform} Integration...`);

        // Verify platform is supported
        if (!SocialPlatformIntegrator.platforms[platform]) {
            return res.status(400).json({
                success: false,
                error: `Platform ${platform} not supported`
            });
        }

        // Test data
        const testData = {
            user: {
                name: 'Test User',
                id: 'test_user'
            },
            details: {
                type: 'test',
                message: `Testing ${platform} integration`,
                timestamp: new Date().toISOString()
            }
        };

        // Test sharing
        const result = await SocialPlatformIntegrator.shareEvent(platform, testData);

        console.log(`✅ ${platform} test successful:`, result);
        res.json({
            success: true,
            platform,
            result,
            apiStatus: getApiStatus(platform)
        });

    } catch (error) {
        console.error(`❌ ${req.params.platform} Test Error:`, error);
        res.status(500).json({
            success: false,
            platform: req.params.platform,
            error: error.message,
            apiStatus: getApiStatus(req.params.platform)
        });
    }
});

// Test all configured platforms
router.get('/social/test-all', async (req, res) => {
    try {
        console.log('🔍 Testing All Social Platforms...');

        const results = {};
        const errors = {};

        // Test each platform
        for (const platform of Object.keys(SocialPlatformIntegrator.platforms)) {
            try {
                const testData = {
                    user: {
                        name: 'Test User',
                        id: 'test_user'
                    },
                    details: {
                        type: 'test',
                        message: `Testing ${platform} integration`,
                        timestamp: new Date().toISOString()
                    }
                };

                const result = await SocialPlatformIntegrator.shareEvent(platform, testData);
                results[platform] = result;
                console.log(`✅ ${platform} test successful`);
            } catch (error) {
                errors[platform] = error.message;
                console.error(`❌ ${platform} test failed:`, error);
            }
        }

        res.json({
            success: true,
            results,
            errors,
            platformStatus: getAllPlatformStatus()
        });

    } catch (error) {
        console.error('❌ All Platforms Test Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Helper function to get API status for a platform
function getApiStatus(platform) {
    const statusMap = {
        youtube: {
            apiKey: process.env.YOUTUBE_API_KEY ? 'Configured' : 'Missing',
            channelId: process.env.YOUTUBE_CHANNEL_ID ? 'Configured' : 'Missing'
        },
        facebook: {
            apiKey: process.env.FACEBOOK_API_KEY ? 'Configured' : 'Missing',
            appId: process.env.FACEBOOK_APP_ID ? 'Configured' : 'Missing'
        },
        xcom: {
            apiKey: process.env.TWITTER_API_KEY ? 'Configured' : 'Missing',
            accessToken: process.env.TWITTER_ACCESS_TOKEN ? 'Configured' : 'Missing'
        },
        linkedin: {
            apiKey: process.env.LINKEDIN_API_KEY ? 'Configured' : 'Missing',
            clientId: process.env.LINKEDIN_CLIENT_ID ? 'Configured' : 'Missing'
        },
        tiktok: {
            apiKey: process.env.TIKTOK_API_KEY ? 'Configured' : 'Missing',
            clientKey: process.env.TIKTOK_CLIENT_KEY ? 'Configured' : 'Missing'
        },
        telegram: {
            botToken: process.env.TELEGRAM_BOT_TOKEN ? 'Configured' : 'Missing'
        },
        instagram: {
            apiKey: process.env.INSTAGRAM_API_KEY ? 'Configured' : 'Missing',
            clientId: process.env.INSTAGRAM_CLIENT_ID ? 'Configured' : 'Missing'
        }
    };

    return statusMap[platform] || { error: 'Platform not configured' };
}

// Helper function to get status for all platforms
function getAllPlatformStatus() {
    const platforms = Object.keys(SocialPlatformIntegrator.platforms);
    const status = {};
    
    platforms.forEach(platform => {
        status[platform] = getApiStatus(platform);
    });

    return status;
}
// Define a test protected route
router.get('/protected', authenticate, (req, res) => {
    res.json({
        message: 'You are authenticated!',
        user: req.user, // Should be set by the authenticate middleware
    });
});

module.exports = router;
