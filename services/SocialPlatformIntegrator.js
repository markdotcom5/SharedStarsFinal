const { TwitterApi } = require('twitter-api-v2');
const TelegramBot = require('node-telegram-bot-api');
const EventEmitter = require('events');
const axios = require('axios');
const multer = require('multer');
const sharp = require('sharp');
const rateLimit = require('express-rate-limit');

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
        this.setupDefaultMethods();
        this.setupPlatforms();
    }

    setupDefaultMethods() {
        // Create placeholder methods for any missing social functions
        this.facebookShare = this.facebookShare || function(content, options) {
            console.log('Facebook share not implemented');
            return Promise.resolve({success: false, message: 'Not implemented'});
        };
        
        this.facebookAnnounce = this.facebookAnnounce || function(content, options) {
            console.log('Facebook announce not implemented');
            return Promise.resolve({success: false, message: 'Not implemented'});
        };
        
        this.xcomShare = this.xcomShare || function(content, options) {
            console.log('X/Twitter share not implemented');
            return Promise.resolve({success: false, message: 'Not implemented'});
        };
        
        this.xcomAnnounce = this.xcomAnnounce || function(content, options) {
            console.log('X/Twitter announce not implemented');
            return Promise.resolve({success: false, message: 'Not implemented'});
        };
        
        this.linkedinShare = this.linkedinShare || function() {
            console.log('LinkedIn share not implemented');
            return Promise.resolve({success: false, message: 'Not implemented'});
        };
        
        this.linkedinAnnounce = this.linkedinAnnounce || function() {
            console.log('LinkedIn announce not implemented');
            return Promise.resolve({success: false, message: 'Not implemented'});
        };
        
        this.tiktokShare = this.tiktokShare || function() {
            console.log('TikTok share not implemented');
            return Promise.resolve({success: false, message: 'Not implemented'});
        };
        
        this.tiktokAnnounce = this.tiktokAnnounce || function() {
            console.log('TikTok announce not implemented');
            return Promise.resolve({success: false, message: 'Not implemented'});
        };
        
        this.telegramShare = this.telegramShare || function() {
            console.log('Telegram share not implemented');
            return Promise.resolve({success: false, message: 'Not implemented'});
        };
        
        this.telegramAnnounce = this.telegramAnnounce || function() {
            console.log('Telegram announce not implemented');
            return Promise.resolve({success: false, message: 'Not implemented'});
        };
        
        this.instagramShare = this.instagramShare || function() {
            console.log('Instagram share not implemented');
            return Promise.resolve({success: false, message: 'Not implemented'});
        };
        
        this.instagramAnnounce = this.instagramAnnounce || function() {
            console.log('Instagram announce not implemented');
            return Promise.resolve({success: false, message: 'Not implemented'});
        };
        
        this.youtubeShare = this.youtubeShare || function() {
            console.log('YouTube share not implemented');
            return Promise.resolve({success: false, message: 'Not implemented'});
        };
        
        this.youtubeAnnounce = this.youtubeAnnounce || function() {
            console.log('YouTube announce not implemented');
            return Promise.resolve({success: false, message: 'Not implemented'});
        };
    }

    setupPlatforms() {
        this.platforms = {
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

    // ====== Initialization Methods ======
    initializeAPIClients() {
        try {
            this.twitterClient = new TwitterApi({
                appKey: process.env.TWITTER_API_KEY,
                appSecret: process.env.TWITTER_API_SECRET,
                accessToken: process.env.TWITTER_ACCESS_TOKEN,
                accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
            });
            
            this.telegramBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
            
            console.log('✅ Social Media API Clients Initialized');
        } catch (error) {
            console.error('❌ Error initializing API clients:', error);
            throw error;
        }
    }

    initializeRateLimiters() {
        this.rateLimiters = {
            twitter: this.createRateLimiter(300, 15),
            telegram: this.createRateLimiter(30, 1),
            linkedin: this.createRateLimiter(100, 60),
            instagram: this.createRateLimiter(200, 60),
            facebook: this.createRateLimiter(200, 60),
            youtube: this.createRateLimiter(100, 60),
            tiktok: this.createRateLimiter(300, 60)
        };
    }

    createRateLimiter(max, windowMinutes) {
        return {
            count: 0,
            max,
            windowStart: Date.now(),
            windowMinutes,
            async checkLimit() {
                const now = Date.now();
                if (now - this.windowStart > windowMinutes * 60 * 1000) {
                    this.count = 0;
                    this.windowStart = now;
                }
                if (this.count >= this.max) {
                    throw new RateLimitError(this.platform, this.windowStart + (windowMinutes * 60 * 1000));
                }
                this.count++;
                return true;
            }
        };
    }

    initializeMediaProcessor() {
        const storage = multer.memoryStorage();
        return multer({
            storage,
            limits: { fileSize: 10 * 1024 * 1024 },
            fileFilter: (req, file, cb) => {
                const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
                if (!allowedTypes.includes(file.mimetype)) {
                    cb(new MediaProcessingError('Invalid file type', req.params.platform), false);
                }
                cb(null, true);
            }
        });
    }

    // ====== Media Processing Methods ======
    async processMedia(file, platform) {
        try {
            if (!file) return null;
            switch (platform) {
                case 'xcom':
                    return await this.processTwitterMedia(file);
                case 'linkedin':
                    return await this.processLinkedInMedia(file);
                case 'telegram':
                    return await this.processTelegramMedia(file);
                default:
                    return await this.processDefaultMedia(file);
            }
        } catch (error) {
            throw new MediaProcessingError(error.message, platform);
        }
    }

    async processTwitterMedia(file) {
        return await sharp(file.buffer)
            .resize(1200, 675, { fit: 'inside' })
            .jpeg({ quality: 85 })
            .toBuffer();
    }

    async processTelegramMedia(file) {
        return await sharp(file.buffer)
            .resize(1280, 720, { fit: 'inside' })
            .jpeg({ quality: 85 })
            .toBuffer();
    }

    async processDefaultMedia(file) {
        return await sharp(file.buffer)
            .resize(1200, 1200, { fit: 'inside' })
            .jpeg({ quality: 85 })
            .toBuffer();
    }

    // ====== Platform-Specific Share Methods ======
    async xcomShare(content) {
        try {
            await this.rateLimiters.twitter.checkLimit();
            let mediaIds = [];

            if (content.media) {
                const processedMedia = await this.processTwitterMedia(content.media);
                mediaIds = [await this.twitterClient.v1.uploadMedia(processedMedia)];
            }

            const tweet = await this.twitterClient.v2.tweet({
                text: content.text?.substring(0, 280),
                media: mediaIds.length ? { media_ids: mediaIds } : undefined
            });

            console.log('✅ X.com share successful:', tweet);
            return tweet;
        } catch (error) {
            throw new SocialMediaError(error.message, 'xcom', error.code);
        }
    }

    async telegramShare(content) {
        try {
            await this.rateLimiters.telegram.checkLimit();
            
            if (content.media) {
                const processedMedia = await this.processTelegramMedia(content.media);
                return await this.telegramBot.sendPhoto(
                    process.env.TELEGRAM_CHAT_ID,
                    processedMedia,
                    { caption: content.text }
                );
            }

            return await this.telegramBot.sendMessage(
                process.env.TELEGRAM_CHAT_ID,
                content.text,
                { parse_mode: 'HTML' }
            );
        } catch (error) {
            throw new SocialMediaError(error.message, 'telegram', error.code);
        }
    }

    async linkedinShare(content) {
        try {
            await this.rateLimiters.linkedin.checkLimit();
            
            const response = await axios.post(
                `https://api.linkedin.com/v2/ugcPosts`,
                {
                    author: `urn:li:organization:${process.env.LINKEDIN_ORG_ID}`,
                    lifecycleState: 'PUBLISHED',
                    specificContent: {
                        'com.linkedin.ugc.ShareContent': {
                            shareCommentary: {
                                text: content.text
                            },
                            shareMediaCategory: content.media ? 'IMAGE' : 'NONE'
                        }
                    },
                    visibility: {
                        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('✅ LinkedIn share successful:', response.data);
            return response.data;
        } catch (error) {
            throw new SocialMediaError(error.message, 'linkedin', error.response?.status);
        }
    }

    // ====== Core Sharing Method ======
    async shareEvent(platform, data) {
        try {
            if (!this.platforms[platform]) {
                throw new Error(`Invalid platform: ${platform}`);
            }

            await this.rateLimiters[platform]?.checkLimit();

            let processedMedia = null;
            if (data.media) {
                processedMedia = await this.processMedia(data.media, platform);
            }

            const formattedContent = await this.formatContentForPlatform(platform, {
                ...data,
                media: processedMedia
            });

            const result = await this.retryOperation(
                () => this.platforms[platform].share(formattedContent),
                3,
                1000
            );

            await this.logShareSuccess(platform, result);

            this.emit('event-shared', {
                platform,
                data: formattedContent,
                result,
                timestamp: new Date()
            });

            return { success: true, result };
        } catch (error) {
            await this.handleShareError(error, platform);
            throw this.transformError(error, platform);
        }
    }

    // ====== Helper Methods ======
    async retryOperation(operation, maxAttempts, delay) {
        let lastError;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                if (attempt === maxAttempts) break;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw lastError;
    }

    async handleShareError(error, platform) {
        console.error(`Error sharing to ${platform}:`, {
            platform,
            error: error.message,
            timestamp: new Date(),
            stack: error.stack
        });

        this.emit('share-error', {
            platform,
            error: error.message,
            timestamp: new Date()
        });
    }

    transformError(error, platform) {
        return new SocialMediaError(
            error.message,
            platform,
            error.code || 'UNKNOWN'
        );
    }

    async formatContentForPlatform(platform, data) {
        switch (platform) {
            case 'xcom':
                return {
                    text: data.text?.substring(0, 280),
                    media: data.media
                };
            case 'telegram':
                return {
                    text: this.formatTelegramText(data.text),
                    media: data.media
                };
            default:
                return data;
        }
    }

    formatTelegramText(text) {
        return text?.replace(/&/g, '&amp;')
                   .replace(/</g, '&lt;')
                   .replace(/>/g, '&gt;') || '';
    }
}

module.exports = new SocialPlatformIntegrator();