const { openai, OpenAI } = require('./openaiService');
const User = require("../models/User.js");
const TrainingSession = require("../models/TrainingSession.js");
const Intervention = require("../models/Intervention.js");
const Achievement = require("../models/Achievement.js");
const { EventEmitter } = require('events'); 

// Helper function to fetch user progress - moved outside the class
const fetchUserProgress = async (userId) => {
  try {
    const response = await fetch(`/api/stella/user-progress?userId=${userId}`, {
      method: 'GET',
      credentials: 'include'
    });
    return await response.json();
  } catch (error) {
    console.error("❌ Error fetching user progress:", error);
    return null;
  }
};

class AIGuidanceSystem extends EventEmitter {
    constructor() {
        super(); // ✅ Enables event-based communication

        // ✅ Initialize OpenAI Client
        this.openai = openai;

        // ✅ Default AI Model
        this.defaultModel = "gpt-4-turbo";

        // ✅ AI Personality Traits
        this.aiPersonality = {
            name: "STELLA",
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
            const user = await User.findById(userId).lean();
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

            return JSON.parse(response.choices[0]?.message?.content || "{}");
        } catch (error) {
            console.error("❌ Error generating space scenario:", error);
            throw error;
        }
    }

    // ✅ Handle Training Interventions
    async handleIntervention(userId, moduleId, triggerType) {
        try {
            const [userProgress, intervention] = await Promise.all([
                UserProgress.findOne({ userId }),
                this.createIntervention(userId, moduleId, triggerType)
            ]);

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
    
    // ✅ Intervention handlers (added to fix missing methods)
    async handleTimeBasedIntervention(intervention, userProgress) {
        // Implementation for time-based interventions
        intervention.guidance = {
            message: "You've been working for a while. Consider taking a short break.",
            type: "TIME_SUGGESTION",
            urgency: "LOW"
        };
        intervention.status = "DELIVERED";
        await intervention.save();
        return intervention;
    }
    
    async handleErrorBasedIntervention(intervention, userProgress) {
        // Implementation for error-based interventions
        intervention.guidance = {
            message: "I've noticed some challenges. Let's approach this differently.",
            type: "ERROR_CORRECTION",
            urgency: "MEDIUM"
        };
        intervention.status = "DELIVERED";
        await intervention.save();
        return intervention;
    }
    
    async handleConfidenceIntervention(intervention, userProgress) {
        // Implementation for confidence-based interventions
        intervention.guidance = {
            message: "You're making great progress! Keep up the good work.",
            type: "CONFIDENCE_BOOST",
            urgency: "LOW"
        };
        intervention.status = "DELIVERED";
        await intervention.save();
        return intervention;
    }
    
    async handleProgressIntervention(intervention, userProgress) {
        // Implementation for progress-based interventions
        intervention.guidance = {
            message: "Let's adjust your training to challenge you appropriately.",
            type: "PROGRESS_ADJUSTMENT",
            urgency: "MEDIUM"
        };
        intervention.status = "DELIVERED";
        await intervention.save();
        return intervention;
    }
    
    // ✅ Added missing achievement triggers method
    async checkAchievementTriggers(userId, intervention) {
        try {
            // Check if this intervention triggers any achievements
            const achievementTriggered = await Achievement.findOne({
                triggerType: intervention.triggerType,
                moduleId: intervention.moduleId
            });
            
            if (achievementTriggered) {
                // Emit achievement event
                this.emit('achievement-triggered', {
                    userId,
                    achievementId: achievementTriggered._id,
                    timestamp: new Date()
                });
            }
        } catch (error) {
            console.error('❌ Error checking achievement triggers:', error);
        }
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

            return JSON.parse(response.choices[0]?.message?.content || "{}");
        } catch (error) {
            console.error('❌ Error simulating emergency:', error);
            throw error;
        }
    }

    // ✅ Virtual Mentoring
    async provideVirtualMentoring(userId) {
        try {
            const [user, sessions] = await Promise.all([
                User.findById(userId),
                TrainingSession.find({ userId })
            ]);

            const recentChallenges = sessions[0]?.aiGuidance?.challenges || [];

            const response = await this.openai.chat.completions.create({
                model: this.defaultModel,
                messages: [
                    { role: "system", content: `As STELLA, provide mentoring combining ${this.aiPersonality.traits.join(', ')} traits.` },
                    { role: "user", content: `Address challenges: ${JSON.stringify(recentChallenges)}. Include insights, astronaut experiences, psychological support, and technical advice.` }
                ]
            });

            return JSON.parse(response.choices[0]?.message?.content || "{}");
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

            return JSON.parse(response.choices[0]?.message?.content || "{}");
        } catch (error) {
            console.error('❌ Error generating mission simulation:', error);
            throw error;
        }
    }

    // ✅ Utility Functions
    determineMissionType(progress) {
        const missionTypes = ['orbital_insertion', 'lunar_landing', 'mars_approach', 'deep_space_exploration', 'space_station_docking'];
        return missionTypes[Math.floor((progress.overallScore || 0) / 20)] || missionTypes[0];
    }

    calculateUserLevel(progress) {
        return ['rookie', 'intermediate', 'advanced', 'expert', 'mission-ready'][Math.floor((progress.overallScore || 0) / 20)] || 'rookie';
    }
}

module.exports = new AIGuidanceSystem();