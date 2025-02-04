// services/ServiceIntegrator.js
const EventEmitter = require('events');
const AISpaceCoach = require('./AISpaceCoach');
const AIGuidanceSystem = require('./AIGuidanceSystem');
const aiGuidance = require('./aiGuidance');
const aiAssistant = require('./aiAssistant');
const User = require('../models/User');  // Add this as the first new line after your existing requires

class ServiceIntegrator extends EventEmitter {
    constructor() {
        super();
        this.services = {
            coach: AISpaceCoach,
            guidance: AIGuidanceSystem,
            realTime: aiGuidance,
            assistant: aiAssistant
        };

        // Simplified to just two modes like early Tesla FSD
        this.MODES = {
            MANUAL: 'manual',     // User drives their own learning
            FSD: 'fsd'           // AI takes the wheel
        };

        // Track active guidance sessions
        this.activeSessions = new Map();

        // Engagement metrics
        this.engagementMetrics = new Map();
    }

    async initializeSession(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) throw new Error('User not found');

            const sessionState = {
                userId,
                mode: this.MODES.MANUAL,  // Start in manual by default
                currentPath: null,
                confidence: 0,
                nextAction: null,
                visualState: {
                    highlightedElements: [],
                    nextSteps: [],
                    currentFocus: null
                },
                lastUpdate: new Date()
            };

            this.activeSessions.set(userId, sessionState);

            // Initialize engagement metrics
            this.engagementMetrics.set(userId, {
                totalTimeInFSD: 0,
                totalActionsCompleted: 0,
                fsdEngagements: 0
            });

            return sessionState;
        } catch (error) {
            console.error('Session Initialization Error:', error);
            throw error;
        }
    }

    async toggleFSDMode(userId) {
        try {
            const session = this.activeSessions.get(userId);
            if (!session) throw new Error('No active session found');

            // Toggle between Manual and FSD
            const newMode = session.mode === this.MODES.MANUAL ? 
                this.MODES.FSD : this.MODES.MANUAL;

            // Update session state
            session.mode = newMode;
            await User.findByIdAndUpdate(userId, {
                'aiGuidance.mode': newMode,
                'aiGuidance.lastModeChange': new Date()
            });

            // Track FSD engagement
            if (newMode === this.MODES.FSD) {
                const metrics = this.engagementMetrics.get(userId);
                metrics.fsdEngagements += 1;

                const guidance = await this.calculateNextAction(userId);
                session.nextAction = guidance.nextAction;
                session.confidence = guidance.confidence;
                this.startMonitoring(userId);
            } else {
                this.stopMonitoring(userId);
            }

            // Emit state change for real-time updates
            this.emit('modeChange', {
                userId,
                mode: newMode,
                state: session
            });

            return session;
        } catch (error) {
            console.error('Mode Toggle Error:', error);
            throw error;
        }
    }

    async processUserAction(userId, action, context) {
        try {
            const session = this.activeSessions.get(userId);
            if (!session) throw new Error('No active session found');

            // Track action completion in metrics
            const metrics = this.engagementMetrics.get(userId);
            metrics.totalActionsCompleted += 1;

            // Handle based on mode
            if (session.mode === this.MODES.FSD) {
                // Full FSD mode - AI takes control
                const [guidance, coaching] = await Promise.all([
                    this.services.realTime.processRealTimeAction(userId, action),
                    this.services.coach.generateCoachingSuggestions(context)
                ]);

                // Calculate next actions and confidence
                const nextAction = await this.calculateNextAction(userId);

                // Update session state
                session.nextAction = nextAction.action;
                session.confidence = nextAction.confidence;
                session.lastUpdate = new Date();

                // Emit update for real-time guidance
                this.emit('guidanceUpdate', {
                    userId,
                    guidance,
                    coaching,
                    nextAction
                });

                return {
                    guidance,
                    coaching,
                    nextAction,
                    mode: 'fsd'
                };
            } else {
                // Manual mode with basic assistance
                const coaching = await this.services.coach.provideProblemSolvingScenario(
                    action.module,
                    context.skillLevel
                );

                return {
                    coaching,
                    mode: 'manual'
                };
            }
        } catch (error) {
            console.error('Action Processing Error:', error);
            throw error;
        }
    }

    async calculateNextAction(userId) {
        try {
            const user = await User.findById(userId)
                .select('trainingProgress aiGuidance certifications achievements');

            // Get comprehensive analysis from all services
            const [certProgress, achievements] = await Promise.all([
                this.services.assistant.analyzeCertificationProgress(user.certifications),
                this.services.assistant.analyzeAchievementProgress(user.achievements)
            ]);

            // Generate optimal next action and confidence score
            const guidance = await this.services.realTime.processRealTimeAction(userId, {
                type: 'next_action_calculation',
                progress: user.trainingProgress,
                certifications: certProgress,
                achievements
            });

            return {
                action: guidance.nextSteps[0],
                confidence: this.calculateConfidence(guidance, certProgress, achievements),
                fullPath: guidance.nextSteps
            };
        } catch (error) {
            console.error('Next Action Calculation Error:', error);
            throw error;
        }
    }

    calculateConfidence(guidance, certProgress, achievements) {
        // Weighted scoring for confidence
        const certWeight = certProgress.completed / certProgress.total * 50; // 50% weight
        const progressWeight = guidance.progress / 100 * 30; // 30% weight
        const achievementWeight = achievements.length * 20; // 20% weight

        return Math.min(certWeight + progressWeight + achievementWeight, 100); // Cap at 100%
    }

    startMonitoring(userId) {
        const session = this.activeSessions.get(userId);
        if (!session) return;

        const startTime = Date.now();

        // Update every 3 seconds in FSD mode
        const interval = setInterval(async () => {
            if (session.mode === this.MODES.FSD) {
                const nextAction = await this.calculateNextAction(userId);

                // Emit update if action changed
                if (nextAction.action !== session.nextAction) {
                    session.nextAction = nextAction.action;
                    session.confidence = nextAction.confidence;

                    this.emit('actionUpdate', {
                        userId,
                        nextAction
                    });
                }

                // Update total time spent in FSD mode
                const metrics = this.engagementMetrics.get(userId);
                metrics.totalTimeInFSD += (Date.now() - startTime) / 1000; // In seconds
            }
        }, 3000);

        session.monitoringInterval = interval;
    }

    stopMonitoring(userId) {
        const session = this.activeSessions.get(userId);
        if (session?.monitoringInterval) {
            clearInterval(session.monitoringInterval);
            session.monitoringInterval = null;
        }
    }

    getUserState(userId) {
        const session = this.activeSessions.get(userId);
        if (!session) return null;

        return {
            mode: session.mode,
            nextAction: session.nextAction,
            confidence: session.confidence,
            lastUpdate: session.lastUpdate
        };
    }

    getEngagementMetrics(userId) {
        return this.engagementMetrics.get(userId) || null;
    }

    async generateTrainingPlan(userId) {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        return {
            plan: [
                { step: 'Complete Module 1', dueDate: '2025-02-01' },
                { step: 'Earn Badge 2', dueDate: '2025-02-15' }
            ],
            confidence: 90
        };
    }

    async updateUserProgress(userId, progressData) {
        // Update user progress
    }

    async getDailyRecommendations(userId) {
        // Return daily recommendations
    }
}module.exports.initializeSession = async (userId) => {
    try {
        // Simulate session initialization
        console.log(`Initializing session for user ${userId}`);
        return { sessionId: `session_${userId}`, initialized: true };
    } catch (error) {
        console.error("Error initializing session:", error);
        throw error;
    }
};

module.exports = new ServiceIntegrator();
