// services/AIGuidanceSystem.js
const OpenAI = require("openai");
const User = require("../models/User");
const TrainingSession = require("../models/TrainingSession");
const Intervention = require("../models/Intervention");
const UserProgress = require("../models/UserProgress");
const Achievement = require("../models/Achievement");

class AIGuidanceSystem {
    constructor() {
        // ✅ Initialize OpenAI Client
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        // ✅ Default AI Model
        this.defaultModel = "gpt-4-turbo";

        // ✅ AI Personality Traits
        this.aiPersonality = {
            name: "STELLA", // Space Training Enhanced Learning Liaison Assistant
            traits: ["encouraging", "detail-oriented", "safety-conscious"],
            experienceLevel: "veteran astronaut",
            specialties: ["crisis management", "psychological support", "technical guidance"]
        };

        // ✅ Simulation Scenarios
        this.simulationScenarios = {
            emergencyResponses: [
                "oxygen_system_failure",
                "micrometeoroid_impact",
                "solar_flare_warning",
                "communication_loss",
                "pressure_leak"
            ],
            spaceOperations: [
                "docking_procedure",
                "spacewalk_preparation",
                "equipment_maintenance",
                "navigation_challenge",
                "resource_management"
            ]
        };

        // ✅ Intervention Types
        this.interventionTypes = {
            TIME_BASED: this.handleTimeBasedIntervention,
            ERROR_BASED: this.handleErrorBasedIntervention,
            CONFIDENCE_BASED: this.handleConfidenceIntervention,
            PROGRESS_BASED: this.handleProgressIntervention
        };
    }

    // ✅ Generate Space Training Scenario
    async generateSpaceScenario(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) throw new Error(`User with ID ${userId} not found.`);

            const userLevel = this.calculateUserLevel(user.trainingProgress);

            const response = await this.openai.chat.completions.create({
                model: this.defaultModel,
                messages: [
                    { role: "system", content: `You are STELLA, an AI space training coach with ${this.aiPersonality.experienceLevel} experience.` },
                    { role: "user", content: `Generate a space scenario for a ${userLevel} trainee. Include: Situation, Conditions, Critical Decisions, Success Criteria, and Learning Objectives.` }
                ],
                temperature: 0.7
            });

            const scenario = response.choices[0]?.message?.content;
            if (!scenario) throw new Error("Empty response from OpenAI.");

            return JSON.parse(scenario);
        } catch (error) {
            console.error("❌ Error generating space scenario:", error);
            throw error;
        }
    }

    // ✅ Handle Training Interventions
    async handleIntervention(userId, moduleId, triggerType) {
        try {
            const userProgress = await UserProgress.findOne({ userId });
            const intervention = await this.createIntervention(userId, moduleId, triggerType);

            if (this.interventionTypes[triggerType]) {
                await this.interventionTypes[triggerType](intervention, userProgress);
            }

            await this.checkAchievementTriggers(userId, intervention);
            return intervention;
        } catch (error) {
            console.error('❌ Error handling intervention:', error);
            throw error;
        }
    }

    async createIntervention(userId, moduleId, triggerType) {
        return await Intervention.create({
            userId,
            moduleId,
            triggerType,
            status: 'PENDING',
            duration: { started: new Date() }
        });
    }

    // ✅ Emergency Response Simulation
    async simulateEmergencyResponse(userId, scenarioType) {
        try {
            const scenario = this.simulationScenarios.emergencyResponses.includes(scenarioType)
                ? scenarioType
                : "oxygen_system_failure";

            const response = await this.openai.chat.completions.create({
                model: this.defaultModel,
                messages: [
                    { role: "system", content: "Simulate a critical space emergency scenario requiring immediate response." },
                    { role: "user", content: `Create emergency scenario: ${scenario}. Include warning signs, system readings, crew status, resources, and time constraints.` }
                ]
            });

            return {
                scenario: JSON.parse(response.choices[0]?.message?.content || '{}'),
                timeLimit: 300, 
                criticalPoints: ['immediate_actions', 'crew_safety', 'system_stabilization']
            };
        } catch (error) {
            console.error('❌ Error simulating emergency:', error);
            throw error;
        }
    }

    // ✅ Virtual Mentoring
    async provideVirtualMentoring(userId) {
        try {
            const user = await User.findById(userId);
            const sessions = await TrainingSession.find({ userId });
            const recentChallenges = sessions[0]?.aiGuidance?.challenges || [];

            const response = await this.openai.chat.completions.create({
                model: this.defaultModel,
                messages: [
                    { role: "system", content: `As STELLA, provide mentoring combining ${this.aiPersonality.traits.join(', ')} traits.` },
                    { role: "user", content: `Address challenges: ${JSON.stringify(recentChallenges)}. Include insights, astronaut experiences, psychological support, and technical advice.` }
                ]
            });

            return {
                mentoring: JSON.parse(response.choices[0]?.message?.content || '{}'),
                nextSession: new Date(Date.now() + 86400000)
            };
        } catch (error) {
            console.error('❌ Error providing mentoring:', error);
            throw error;
        }
    }

    // ✅ Generate Mission Simulation
    async generateMissionSimulation(userId) {
        try {
            const user = await User.findById(userId);
            const missionType = this.determineMissionType(user.trainingProgress);

            const response = await this.openai.chat.completions.create({
                model: this.defaultModel,
                messages: [
                    { role: "system", content: "Generate a complete space mission simulation with multiple phases." },
                    { role: "user", content: `Create ${missionType} mission simulation. Include launch sequence, objectives, challenges, and success criteria.` }
                ]
            });

            const simulation = JSON.parse(response.choices[0]?.message?.content || '{}');

            await TrainingSession.findOneAndUpdate(
                { userId, status: 'in-progress' },
                { $push: { 'missions': { type: missionType, simulation, startedAt: new Date() } } }
            );

            return simulation;
        } catch (error) {
            console.error('❌ Error generating mission simulation:', error);
            throw error;
        }
    }

    // ✅ Provide Psychological Support
    async providePsychologicalSupport(userId) {
        try {
            const user = await User.findById(userId);
            const recentSessions = await TrainingSession.find({ userId }).sort({ createdAt: -1 }).limit(5);
            const stressIndicators = this.analyzeStressIndicators(recentSessions);

            const response = await this.openai.chat.completions.create({
                model: this.defaultModel,
                messages: [
                    { role: "system", content: "Provide space psychology support focusing on mental resilience." },
                    { role: "user", content: `Generate psychological support response. Stress indicators: ${JSON.stringify(stressIndicators)}.` }
                ]
            });

            return JSON.parse(response.choices[0]?.message?.content || '{}');
        } catch (error) {
            console.error('❌ Error providing psychological support:', error);
            throw error;
        }
    }

    // ✅ Utility Functions
    determineMissionType(progress) {
        const missionTypes = ['orbital_insertion', 'lunar_landing', 'mars_approach', 'deep_space_exploration', 'space_station_docking'];
        return missionTypes[Math.floor((progress.overallScore || 0) / 20)] || missionTypes[0];
    }

    analyzeStressIndicators(sessions) {
        return sessions.map(session => ({
            date: session.createdAt,
            performanceVariation: session.metrics?.performanceVariation || 0,
            responseTime: session.metrics?.averageResponseTime || 0,
            errorRate: session.metrics?.errorRate || 0
        }));
    }

    calculateUserLevel(progress) {
        return ['rookie', 'intermediate', 'advanced', 'expert', 'mission-ready'][Math.floor((progress.overallScore || 0) / 20)] || 'rookie';
    }
}

module.exports = new AIGuidanceSystem();
