const { TwitterApi } = require('twitter-api-v2');
const TelegramBot = require('node-telegram-bot-api');
const { google } = require('googleapis');
const { EventEmitter } = require('events');
const axios = require('axios');
const multer = require('multer');
const sharp = require('sharp');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

// Custom Error Classes
class SocialMediaError extends Error {
    constructor(message, platform, code) {
        super(message);
        this.name = 'SocialMediaError';
        this.platform = platform;
        this.code = code;
        this.timestamp = new Date();
    }
}

class RateLimitError extends SocialMediaError {
    constructor(platform, resetTime) {
        super(`Rate limit exceeded for ${platform}`, platform, 'RATE_LIMIT');
        this.resetTime = resetTime;
    }
}

class MediaProcessingError extends SocialMediaError {
    constructor(message, platform) {
        super(message, platform, 'MEDIA_PROCESSING');
    }
}

class SocialPlatformIntegrator extends EventEmitter {
    constructor() {
        super();
        this.initializeAPIClients();
        this.initializeRateLimiters();
        this.mediaProcessor = this.initializeMediaProcessor();
        this.setupPlatforms();
    }

    initializeRateLimiters() {
        this.rateLimiters = {
            youtube: {
                tokens: 100,
                refillRate: 100,
                refillTime: 24 * 60 * 60 * 1000, // 24 hours
                lastRefill: Date.now()
            },
            tiktok: {
                tokens: 300,
                refillRate: 300,
                refillTime: 60 * 60 * 1000 // 1 hour
            },
            instagram: {
                tokens: 200,
                refillRate: 200,
                refillTime: 60 * 60 * 1000 // 1 hour
            },
            facebook: {
                tokens: 200,
                refillRate: 200,
                refillTime: 60 * 60 * 1000 // 1 hour
            },
            xcom: {
                tokens: 300,
                refillRate: 300,
                refillTime: 15 * 60 * 1000 // 15 minutes
            },
            linkedin: {
                tokens: 100,
                refillRate: 100,
                refillTime: 60 * 60 * 1000 // 1 hour
            }
        };
    }

    setupPlatforms() {
        this.platforms = {
            youtube: {
                share: this.youtubeShare.bind(this),
                announce: this.youtubeAnnounce.bind(this)
            },
            tiktok: {
                share: this.tiktokShare.bind(this),
                announce: this.tiktokAnnounce.bind(this)
            },
            instagram: {
                share: this.instagramShare.bind(this),
                announce: this.instagramAnnounce.bind(this)
            },
            facebook: {
                share: this.facebookShare.bind(this),
                announce: this.facebookAnnounce.bind(this)
            },
            xcom: {
                share: this.xcomShare.bind(this),
                announce: this.xcomAnnounce.bind(this)
            },
            linkedin: {
                share: this.linkedinShare.bind(this),
                announce: this.linkedinAnnounce.bind(this)
            }
        };
    }

    initializeAPIClients() {
        try {
            // YouTube setup
            this.youtube = google.youtube({
                version: 'v3',
                auth: process.env.YOUTUBE_API_KEY
            });

            // Twitter setup
            this.twitterClient = new TwitterApi({
                appKey: process.env.TWITTER_API_KEY,
                appSecret: process.env.TWITTER_API_SECRET,
                accessToken: process.env.TWITTER_ACCESS_TOKEN,
                accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
            });

            console.log('✅ Social Media API Clients Initialized');
        } catch (error) {
            console.error('❌ Error initializing API clients:', error);
            throw error;
        }
    }

    initializeMediaProcessor() {
        const storage = multer.diskStorage({
            destination: function (req, file, cb) {
                cb(null, "uploads/"); // ✅ Save files in "uploads" directory
            },
            filename: function (req, file, cb) {
                cb(null, Date.now() + "-" + file.originalname); // ✅ Ensure unique filenames
            }
        });
    
        console.log("🚀 Multer Initialized - Max File Size:", 500 * 1024 * 1024);
    
        return multer({
            storage,
            limits: { fileSize: 500 * 1024 * 1024 }, // ✅ Increased file size limit to 500MB
            fileFilter: (req, file, cb) => {
                if (!file) {
                    return cb(new Error("No file uploaded"), false);
                }
                const allowedTypes = ["video/mp4", "video/quicktime"];
                if (!allowedTypes.includes(file.mimetype)) {
                    return cb(new MediaProcessingError("Invalid file type", req.params.platform), false);
                }
                cb(null, true);
            }
        });
    }
    

    async youtubeShare(content) {
        try {
            const response = await this.youtube.videos.insert({
                part: 'snippet,status',
                requestBody: {
                    snippet: {
                        title: content.title || 'SharedStars Training Video',
                        description: content.description || 'Training session recording',
                        tags: content.tags || ['SharedStars', 'Space Training']
                    },
                    status: {
                        privacyStatus: content.private ? 'private' : 'public'
                    }
                },
                media: {
                    body: fs.createReadStream(content.media.path)
                }
            });

            console.log('✅ YouTube upload successful:', response.data);
            return response.data;
        } catch (error) {
            throw new SocialMediaError(error.message, 'youtube', error.code);
        }
    }

    // Share methods placeholder implementations
    async tiktokShare(content) { console.log('TikTok share:', content); }
    async instagramShare(content) { console.log('Instagram share:', content); }
    async facebookShare(content) { console.log('Facebook share:', content); }
    async xcomShare(content) { console.log('X.com share:', content); }
    async linkedinShare(content) { console.log('LinkedIn share:', content); }

    // Announce methods
    async youtubeAnnounce(content) { return this.youtubeShare(content); }
    async tiktokAnnounce(content) { return this.tiktokShare(content); }
    async instagramAnnounce(content) { return this.instagramShare(content); }
    async facebookAnnounce(content) { return this.facebookShare(content); }
    async xcomAnnounce(content) { return this.xcomShare(content); }
    async linkedinAnnounce(content) { return this.linkedinShare(content); }

    getUploadMiddleware() {
        return this.mediaProcessor.single('media');
    }
}

module.exports = new SocialPlatformIntegrator();