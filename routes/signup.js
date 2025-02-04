const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

/** ==========================
 *  🔹 User Signup Route (`/join-now`)
 *  ========================== **/
router.post('/join-now', async (req, res) => {
    console.log('🚀 Signup endpoint hit');
    
    try {
        const { name, email, password } = req.body;

        // 🔹 Validate Request Data
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Name, email, and password are required to sign up.'
            });
        }

        // 🔹 Check for Existing User
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'This email is already registered. Ready to continue your journey to space?'
            });
        }

        // 🔹 Hash Password for Security
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 🔹 Create New User with AI Guidance
        const newUser = new User({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            aiGuidance: {
                mode: 'full_guidance',
                activatedAt: new Date(),
                personalizedSettings: {
                    pacePreference: 'balanced',
                    adaptiveUI: true
                },
                context: {
                    currentPhase: 'onboarding',
                    nextActions: ['complete_profile']
                }
            },
            settings: {
                notifications: {
                    aiSuggestions: true
                },
                aiPreferences: {
                    automationLevel: 'maximum',
                    interactionStyle: 'proactive',
                    dataCollection: 'comprehensive'
                }
            }
        });

        await newUser.save();

        // 🔹 Generate Secure JWT Token
        const token = jwt.sign(
            {
                userId: newUser._id,
                email: newUser.email,
                aiGuidance: newUser.aiGuidance.mode
            },
            process.env.JWT_SECRET || 'default_secret_key',
            { expiresIn: '7d' }
        );

        // 🔹 Respond with Success
        res.status(201).json({
            success: true,
            message: 'Welcome aboard! Your AI guide is ready to start your journey to space.',
            data: {
                user: {
                    id: newUser._id,
                    name: newUser.name,
                    email: newUser.email,
                    aiGuidanceMode: newUser.aiGuidance.mode
                },
                token
            }
        });

    } catch (error) {
        console.error('❌ Signup Error Details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });

        res.status(500).json({
            success: false,
            error: 'Houston, we have a problem. Please try again.'
        });
    }
}); 

module.exports = router;
