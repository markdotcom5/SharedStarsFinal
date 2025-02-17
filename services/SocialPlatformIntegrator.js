const SocialMediaAPIs = require('./socialMedia/APIIntegrations');
const AnnouncementTemplates = require('./socialMedia/AnnouncementTemplates');
const axios = require("axios");
// services/SocialPlatformIntegrator.js
const EventEmitter = require('events');

class SocialPlatformIntegrator extends EventEmitter {
    constructor() {
        super();
        this.platforms = {
            facebook: {
                share: this.facebookShare.bind(this),
                announce: this.facebookAnnounce.bind(this)
            },
            xcom: {  // Changed from Twitter to X.com
                share: this.xcomShare.bind(this),
                announce: this.xcomAnnounce.bind(this)
            },
            linkedin: {
                share: this.linkedinShare.bind(this),
                announce: this.linkedinAnnounce.bind(this)
            },
            tiktok: {
                share: this.tiktokShare.bind(this),
                announce: this.tiktokAnnounce.bind(this)
            },
            telegram: {
                share: this.telegramShare.bind(this),
                announce: this.telegramAnnounce.bind(this)
            },
            instagram: {
                share: this.instagramShare.bind(this),
                announce: this.instagramAnnounce.bind(this)
            },
            youtube: {
                share: this.youtubeShare.bind(this),
                announce: this.youtubeAnnounce.bind(this)
            }
        };
    }

    // ✅ Core Sharing Method (Handles All Social Platforms)
    async shareEvent(platform, data) {
        try {
            if (!this.platforms[platform]) {
                throw new Error(`Invalid platform: ${platform}`);
            }

            if (!this.platforms[platform].announce) {
                throw new Error(`Announce method not available for: ${platform}`);
            }

            const announcement = await this.platforms[platform].announce(data.user, data.details);
            await this.shareToAllPlatforms('announce', announcement);

            this.emit('event-shared', {
                platform,
                data,
                announcement,
                timestamp: new Date()
            });

            console.log(`📢 Event Shared on ${platform} for ${data.user.name}`);
            return { success: true, announcement };
        } catch (error) {
            console.error(`❌ Error sharing event on ${platform}:`, error);
            throw error;
        }
    }

    // ✅ Social Platform API Placeholder Functions
    async facebookShare(content) { console.log('📘 Facebook Share:', content); }
    async facebookAnnounce(user, details) { console.log('📘 Facebook Announce:', user, details); }

    async xcomShare(content) { console.log('🐦 X.com Share:', content); }
    async xcomAnnounce(user, details) { console.log('🐦 X.com Announce:', user, details); }

    async linkedinShare(content, userAccessToken) {
        try {
            const linkedInAPI = "https://api.linkedin.com/v2/ugcPosts";
    
            const payload = {
                author: "urn:li:person:" + userAccessToken, // If posting as a user
                lifecycleState: "PUBLISHED",
                specificContent: {
                    "com.linkedin.ugc.ShareContent": {
                        shareCommentary: {
                            text: content,
                        },
                        shareMediaCategory: "NONE",
                    },
                },
                visibility: {
                    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
                },
            };
    
            const response = await axios.post(linkedInAPI, payload, {
                headers: {
                    "Authorization": `Bearer ${userAccessToken}`,
                    "X-Restli-Protocol-Version": "2.0.0",
                    "Content-Type": "application/json",
                },
            });
    
            console.log("✅ Successfully posted to LinkedIn:", response.data);
            return { success: true, response: response.data };
        } catch (error) {
            console.error("❌ Error posting to LinkedIn:", error.response ? error.response.data : error.message);
            throw error;
        }
    }
        async linkedinAnnounce(user, details) { console.log('🔗 LinkedIn Announce:', user, details); }

    async tiktokShare(content) { console.log('🎵 TikTok Share:', content); }
    async tiktokAnnounce(user, details) { console.log('🎵 TikTok Announce:', user, details); }

    async telegramShare(content) { console.log('✈️ Telegram Share:', content); }
    async telegramAnnounce(user, details) { console.log('✈️ Telegram Announce:', user, details); }

    async instagramShare(content) { console.log('📸 Instagram Share:', content); }
    async instagramAnnounce(user, details) { console.log('📸 Instagram Announce:', user, details); }

    async youtubeShare(content) { console.log('🎥 YouTube Share:', content); }
    async youtubeAnnounce(user, details) { console.log('🎥 YouTube Announce:', user, details); }

    // ✅ Helper Method to Share Across All Platforms
    async shareToAllPlatforms(action, content) {
        try {
            const sharePromises = Object.entries(this.platforms).map(async ([platform, methods]) => {
                if (methods[action] && typeof methods[action] === 'function') {
                    return methods[action](content);
                }
            });

            await Promise.all(sharePromises);
            console.log("✅ Shared across all platforms.");
        } catch (error) {
            console.error("❌ Error sharing to platforms:", error);
        }
    }
}

module.exports = new SocialPlatformIntegrator();
