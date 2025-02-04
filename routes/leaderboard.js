const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticate } = require('../middleware/auth');
const Leaderboard = require('../models/Leaderboard');
const User = require('../models/User');
const AISpaceCoach = require('../services/AISpaceCoach');

// Main leaderboard page render with AI insights
router.get('/', authenticate, async (req, res) => {
    try {
        const [globalStats, userStats, aiReadiness] = await Promise.all([
            Leaderboard.aggregate([
                { $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    totalCredits: { $sum: '$score' },
                    averageLevel: { $avg: '$level' }
                }}
            ]),
            req.user ? Leaderboard.findOne({ userId: req.user._id }) : null,
            // Get AI space readiness assessment
            AISpaceCoach.calculateSpaceReadiness({
                trainingHistory: req.user?.trainingHistory || [],
                assessmentScores: req.user?.assessmentScores || []
            })
        ]);

        res.render('leaderboard', {
            title: 'SharedStars Leaderboard',
            user: req.user,
            stats: {
                activeCadets: globalStats[0]?.totalUsers || 0,
                totalCredits: Math.floor(globalStats[0]?.totalCredits || 0),
                activeMissions: await User.countDocuments({ 'missions.active': true }),
                successRate: '94%',
                spaceReadiness: aiReadiness
            }
        });

        // Track user engagement with AI Coach
        if (req.user) {
            await AISpaceCoach.trackProgress(req.user._id, {
                type: 'LEADERBOARD_VIEW',
                timestamp: new Date()
            });
        }
    } catch (error) {
        console.error('Error rendering leaderboard:', error);
        res.status(500).render('error', { error: 'Failed to load leaderboard' });
    }
});

// Your existing state rankings with AI insights
router.get('/state/:stateCode', authenticate, async (req, res) => {
    try {
        const { stateCode } = req.params;
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 10), 50);

        if (!stateCode || stateCode.length !== 2) {
            return res.status(400).json({ error: 'Invalid state code' });
        }

        const [stateRankings, aiSuggestions] = await Promise.all([
            Leaderboard.find({ 
                state: stateCode.toUpperCase(),
                category: 'state',
            })
            .sort({ score: -1 })
            .populate('userId', 'username avatar level')
            .skip((page - 1) * limit)
            .limit(limit),

            // Get AI coaching insights for state performance
            req.user ? AISpaceCoach.generateCoachingSuggestions({
                userId: req.user._id,
                stateCode: stateCode,
                rankingContext: 'state'
            }) : null
        ]);

        const totalCount = await Leaderboard.countDocuments({ 
            state: stateCode.toUpperCase(), 
            category: 'state' 
        });

        res.json({
            rankings: stateRankings,
            aiInsights: aiSuggestions,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalEntries: totalCount,
                entriesPerPage: limit,
            }
        });
    } catch (error) {
        console.error(`State leaderboard error:`, error);
        res.status(500).json({ error: 'Failed to fetch state rankings' });
    }
});

// Your existing local rankings with AI performance analysis
router.get('/local', authenticate, async (req, res) => {
    try {
        const { latitude, longitude, radius = 50 } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({ error: 'Location required' });
        }

        const parsedLat = parseFloat(latitude);
        const parsedLng = parseFloat(longitude);

        if (isNaN(parsedLat) || isNaN(parsedLng)) {
            return res.status(400).json({ error: 'Invalid coordinates' });
        }

        const [users, aiAnalysis] = await Promise.all([
            User.find({
                location: {
                    $near: {
                        $geometry: { 
                            type: 'Point', 
                            coordinates: [parsedLng, parsedLat] 
                        },
                        $maxDistance: radius * 1000,
                    },
                },
            }).select('_id'),

            // Get AI analysis of local competition
            req.user ? AISpaceCoach.generateCoachingSuggestions({
                userId: req.user._id,
                location: { latitude: parsedLat, longitude: parsedLng },
                rankingContext: 'local'
            }) : null
        ]);

        if (!users.length) {
            return res.json({ 
                rankings: [], 
                message: 'No users in range',
                aiInsights: aiAnalysis
            });
        }

        const userIds = users.map(user => user._id);
        const rankings = await Leaderboard.find({
            userId: { $in: userIds },
            category: 'global',
        })
        .sort({ score: -1 })
        .populate('userId', 'username avatar level')
        .limit(100);

        res.json({ 
            rankings,
            aiInsights: aiAnalysis 
        });
    } catch (error) {
        console.error('Local rankings error:', error);
        res.status(500).json({ error: 'Failed to fetch local rankings' });
    }
});

// Your existing global rankings with enhanced AI features
router.get('/global', authenticate, async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 10), 50);
        const filter = req.query.filter || 'global';
        const timeRange = req.query.timeRange || 'allTime';
        const search = req.query.search?.trim();

        let query = { category: filter };

        if (timeRange !== 'allTime') {
            const ranges = { 
                today: 1, 
                thisWeek: 7, 
                thisMonth: 30 
            };
            const days = ranges[timeRange] || 0;
            if (days) {
                query.lastUpdated = { 
                    $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) 
                };
            }
        }

        if (search) {
            const userIds = await User.find({ 
                username: { $regex: search, $options: 'i' } 
            }).distinct('_id');
            query.userId = { $in: userIds };
        }

        const [rankings, totalCount, aiAnalysis] = await Promise.all([
            Leaderboard.aggregate([
                { $match: query },
                { $sort: { score: -1 } },
                { $lookup: { 
                    from: 'users', 
                    localField: 'userId', 
                    foreignField: '_id', 
                    as: 'user' 
                }},
                { $unwind: '$user' },
                { $skip: (page - 1) * limit },
                { $limit: limit }
            ]),
            Leaderboard.countDocuments(query),
            // Get AI insights on global rankings
            req.user ? AISpaceCoach.generateCoachingSuggestions({
                userId: req.user._id,
                rankingContext: 'global',
                timeRange: timeRange
            }) : null
        ]);

        // Track this view with AI coach
        if (req.user) {
            await AISpaceCoach.trackProgress(req.user._id, {
                type: 'GLOBAL_RANKINGS_VIEW',
                timeRange: timeRange,
                filter: filter
            });
        }

        res.json({
            rankings,
            aiInsights: aiAnalysis,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalEntries: totalCount,
                entriesPerPage: limit
            }
        });
    } catch (error) {
        console.error('Global rankings error:', error);
        res.status(500).json({ error: 'Failed to fetch global rankings' });
    }
});

// Track achievements and progress
router.post('/track-progress', authenticate, async (req, res) => {
    try {
        const progress = await AISpaceCoach.trackProgress(req.user._id, req.body);
        
        const [achievements, suggestions] = await Promise.all([
            AISpaceCoach.checkAchievements(req.user._id),
            AISpaceCoach.generateCoachingSuggestions({
                userId: req.user._id,
                recentProgress: progress
            })
        ]);

        res.json({
            success: true,
            progress,
            achievements,
            suggestions
        });
    } catch (error) {
        console.error('Progress tracking error:', error);
        res.status(500).json({ error: 'Error tracking progress' });
    }
});

// Quick Stats with AI insights
router.get('/stats', authenticate, async (req, res) => {
    try {
        const [stats, aiAnalysis] = await Promise.all([
            Leaderboard.aggregate([
                {
                    $group: {
                        _id: null,
                        totalUsers: { $sum: 1 },
                        totalCredits: { $sum: '$score' },
                        activeUsers: { 
                            $sum: { 
                                $cond: [
                                    { $gt: ['$lastActivity', new Date(Date.now() - 24 * 60 * 60 * 1000)] },
                                    1,
                                    0
                                ]
                            }
                        },
                        averageScore: { $avg: '$score' }
                    }
                }
            ]),
            req.user ? AISpaceCoach.calculateSpaceReadiness({
                userId: req.user._id,
                context: 'stats'
            }) : null
        ]);

        res.json({
            stats: stats[0] || {
                totalUsers: 0,
                totalCredits: 0,
                activeUsers: 0,
                averageScore: 0
            },
            aiInsights: aiAnalysis
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

module.exports = router;