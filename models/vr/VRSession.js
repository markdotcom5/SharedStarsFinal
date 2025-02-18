// models/vr/VRSession.js
const mongoose = require('mongoose');

const VRSessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        deviceType: {
            type: String,
            enum: ['quest', 'quest_pro'],
            required: true,
        },
        scenario: {
            type: String,
            required: true,
        },
        startTime: {
            type: Date,
            default: Date.now,
        },
        endTime: Date,
        metrics: {
            performance: {
                accuracy: Number,
                completionTime: Number,
                objectives: [String],
            },
            biometrics: {
                heartRate: [Number],
                stressLevel: [Number],
                fatigue: Number,
            },
            technical: {
                frameRate: Number,
                latency: Number,
                trackingQuality: Number,
            },
        },
        props: [
            {
                type: String,
                calibration: {
                    status: String,
                    accuracy: Number,
                },
                usage: {
                    duration: Number,
                    interactions: Number,
                },
            },
        ],
        environmentalEffects: [
            {
                type: String,
                intensity: Number,
                duration: Number,
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model('VRSession', VRSessionSchema);
