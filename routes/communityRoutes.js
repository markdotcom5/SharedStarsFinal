const express = require('express');
const router = express.Router();
const WebSocket = require('ws');
const Joi = require('joi');
const { authenticate } = require('../middleware/authenticate');

// Update these imports to match your exact file names:
const StudyGroup = require('../models/studyGroup');
const Challenge = require('../models/challenge');
const PeerMatch = require('../models/peerMatch');
const Discussion = require('../models/discussion');
const User = require('../models/User');

// WebSocket setup
const wss = new WebSocket.Server({ noServer: true });
const clients = new Map();

// Validation Schemas
const studyGroupSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string(),
    type: Joi.string().valid('training', 'certification', 'mission', 'general').required(),
    capacity: Joi.number().min(2).max(50),
    module: Joi.string()
});

const sessionSchema = Joi.object({
    type: Joi.string().valid('study', 'practice', 'assessment', 'mission').required(),
    module: Joi.string().required(),
    scheduledStart: Joi.date().required()
});

// WebSocket Connection Handling
wss.on('connection', (ws, req) => {
    const userId = req.userId;
    clients.set(userId, ws);

    ws.on('close', () => {
        clients.delete(userId);
    });
});

// Notification Utility
function notifyUsers(userIds, data) {
    userIds.forEach(userId => {
        const ws = clients.get(userId.toString());
        if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    });
}

// Community Hub Dashboard
router.get('/', authenticate, async (req, res) => {
    try {
        const userId = req.user._id;
        
        const communityData = {
            studyGroups: await StudyGroup.find({ 
                'participants.user': userId 
            }).populate('participants.user'),
            
            challenges: await Challenge.find({
                $or: [
                    { 'participants.user': userId },
                    { type: 'global' }
                ],
                status: 'active'
            }),
            
            peerMatches: await PeerMatch.findMatchesForUser(userId),
            
            discussions: await Discussion.find()
                .sort({ createdAt: -1 })
                .limit(10)
                .populate('author'),
            
            userProgress: {
                badges: req.user.achievements,
                credits: req.user.credits,
                currentRank: req.user.leaderboardRank
            }
        };

        res.json(communityData);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching community hub data', 
            error: error.message 
        });
    }
});

// Create Study Group
router.post('/groups', authenticate, async (req, res) => {
    try {
        // Validate input
        const { error } = studyGroupSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        // Create study group
        const newStudyGroup = new StudyGroup({
            name: req.body.name,
            description: req.body.description,
            type: req.body.type,
            capacity: req.body.capacity,
            participants: [{
                user: req.user._id,
                role: 'creator'
            }]
        });

        await newStudyGroup.save();

        // Notify relevant users
        notifyUsers([req.user._id], {
            type: 'GROUP_CREATED',
            group: newStudyGroup
        });

        res.status(201).json(newStudyGroup);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error creating study group', 
            error: error.message 
        });
    }
});

// Join Study Group
router.post('/groups/:groupId/join', authenticate, async (req, res) => {
    try {
        const studyGroup = await StudyGroup.findById(req.params.groupId);
        
        if (!studyGroup) {
            return res.status(404).json({ message: 'Study group not found' });
        }

        if (studyGroup.participants.length >= studyGroup.capacity) {
            return res.status(400).json({ message: 'Study group is full' });
        }

        studyGroup.participants.push({
            user: req.user._id,
            role: 'member'
        });

        await studyGroup.save();

        // Notify group members
        notifyUsers(
            studyGroup.participants.map(p => p.user), 
            {
                type: 'NEW_MEMBER_JOINED',
                group: studyGroup,
                newMember: req.user
            }
        );

        res.json(studyGroup);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error joining study group', 
            error: error.message 
        });
    }
});

// Peer Matching Routes
router.get('/peers/matches', authenticate, async (req, res) => {
    try {
        const matches = await PeerMatch.findMatchesForUser(req.user._id);
        res.json({ success: true, matches });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Challenges Routes
router.post('/challenges', authenticate, async (req, res) => {
    try {
        const challenge = new Challenge({
            ...req.body,
            participants: [{
                user: req.user._id,
                progress: 0,
                role: 'creator'
            }]
        });

        await challenge.save();

        // Notify potential participants
        notifyUsers([req.user._id], {
            type: 'CHALLENGE_CREATED',
            challenge
        });

        res.json({ success: true, challenge });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Discussion Routes
router.post('/discussions', authenticate, async (req, res) => {
    try {
        const discussion = new Discussion({
            ...req.body,
            author: req.user._id
        });

        await discussion.save();

        // Notify community
        notifyUsers([req.user._id], {
            type: 'NEW_DISCUSSION',
            discussion
        });

        res.json({ success: true, discussion });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// WebSocket upgrade handler
const upgradeConnection = (server) => {
    server.on('upgrade', (request, socket, head) => {
        // Implement proper WebSocket authentication
        const userId = authenticateWebSocket(request);
        if (!userId) {
            socket.destroy();
            return;
        }

        request.userId = userId;
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    });
};

module.exports = router;
