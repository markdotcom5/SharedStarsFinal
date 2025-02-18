const EventEmitter = require('events');
const { OpenAI } = require('openai');
const User = require('../models/User');

class AIWebController extends EventEmitter {
    constructor() {
        super(); // ✅ Enables event-based communication

        this.currentState = 'idle';
        this.userPreferences = null;
        this.navigationHistory = [];
        this.interactionQueue = [];
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    async takeControl(userId) {
        try {
            console.log(`🎮 AI Web Controller taking control for user: ${userId}`);

            const user = await User.findById(userId).lean();
            if (!user) throw new Error(`User with ID ${userId} not found.`);

            this.userPreferences = user.aiGuidance?.personalizedSettings || {};
            await Promise.all([this.initializeOverlay(), this.startGuidedNavigation()]);

            this.monitorUserBehavior();

            // ✅ Emit event for integrations
            this.emit('ai-control-started', { userId, preferences: this.userPreferences });
        } catch (error) {
            console.error('❌ AI Control Error:', error);
            await this.fallbackToManualMode();
        }
    }

    async initializeOverlay() {
        try {
            console.log('🛠️ Initializing AI guidance overlay...');
            return {
                create: () => {
                    console.log('✅ Overlay created.');
                },
                position: () => {
                    console.log('✅ Overlay positioned.');
                },
            };
        } catch (error) {
            console.error('❌ Error initializing overlay:', error);
            throw error;
        }
    }

    async startGuidedNavigation() {
        try {
            console.log('🚀 Starting guided navigation...');
            const navigation = await this.guidedNavigation();
            await this.executeNavigationSequence(navigation);
        } catch (error) {
            console.error('❌ Error in guided navigation:', error);
            throw error;
        }
    }

    async monitorUserBehavior() {
        try {
            console.log('📊 Monitoring user behavior...');
            // Implement behavior tracking logic here
        } catch (error) {
            console.error('❌ Error monitoring user behavior:', error);
        }
    }

    async fallbackToManualMode() {
        console.log('🔄 Switching to manual mode...');
        this.currentState = 'manual';

        // ✅ Emit event to notify other services
        this.emit('manual-mode-activated', { state: this.currentState });
    }

    async executeAction(action) {
        try {
            console.log(`🎬 Executing action: ${action}`);

            await this.validateAction(action);
            this.interactionQueue.push(action);
            const result = await this.processAction(action);

            console.log(`✅ Action executed successfully: ${action}`);

            // ✅ Emit event to notify listeners
            this.emit('action-executed', { action, result });

            return result;
        } catch (error) {
            console.error('❌ Action Execution Error:', error);
            return null;
        }
    }

    async parseAIResponse(completion) {
        try {
            console.log('🤖 Parsing AI response...');
            return {
                action: completion.choices[0]?.message?.content || 'No response',
                confidence: completion.choices[0]?.finish_reason === 'stop' ? 1 : 0.5,
            };
        } catch (error) {
            console.error('❌ Error parsing AI response:', error);
            return { action: 'error', confidence: 0 };
        }
    }
}

module.exports = new AIWebController();
