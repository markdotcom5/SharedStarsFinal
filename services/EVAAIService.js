// services/EVAAIService.js
const OpenAI = require('openai');
const EventEmitter = require('events');

class EVAAIService extends EventEmitter {
    constructor() {
        super();
        this.openai = new OpenAI(process.env.OPENAI_API_KEY);
        this.initialized = false;
        this.initialize();
    }

    async initialize() {
        try {
            console.log('🚀 Initializing EVA AI Service');
            this.initialized = true;
            console.log('✅ EVA AI Service Initialized');
        } catch (error) {
            console.error('❌ EVA AI Service Initialization Error:', error);
            throw error;
        }
    }

    async generateProcedureGuidance(procedure, userLevel) {
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are an advanced EVA training assistant specializing in spacewalk procedures and safety protocols.',
                    },
                    {
                        role: 'user',
                        content: `Generate step-by-step guidance for ${procedure} suitable for a ${userLevel} trainee. Include safety checkpoints and common mistakes to avoid.`,
                    },
                ],
                temperature: 0.7,
                max_tokens: 1000,
            });

            // Emit guidance generated event
            this.emit('guidance-generated', {
                procedure,
                userLevel,
                guidance: response.choices[0].message.content,
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error('Error generating EVA guidance:', error);
            throw error;
        }
    }

    async evaluatePerformance(sessionData) {
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are an EVA performance evaluation expert. Analyze the training session data and provide detailed feedback.',
                    },
                    {
                        role: 'user',
                        content: `Analyze this EVA session performance data and provide specific feedback: ${JSON.stringify(sessionData)}`,
                    },
                ],
                temperature: 0.7,
                max_tokens: 1000,
            });

            // Emit performance analyzed event
            this.emit('performance-analyzed', {
                sessionData,
                analysis: response.choices[0].message.content,
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error('Error evaluating EVA performance:', error);
            throw error;
        }
    }

    async generateEmergencyScenario(difficulty) {
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are an EVA emergency scenario generator. Create realistic but challenging situations for astronaut training.',
                    },
                    {
                        role: 'user',
                        content: `Generate a detailed ${difficulty} emergency scenario for EVA training. Include initial conditions, complications, and success criteria.`,
                    },
                ],
                temperature: 0.8,
                max_tokens: 1000,
            });

            // Emit scenario generated event
            this.emit('scenario-generated', {
                difficulty,
                scenario: response.choices[0].message.content,
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error('Error generating emergency scenario:', error);
            throw error;
        }
    }

    // Real-time monitoring methods
    async monitorVitalSigns(metrics) {
        try {
            if (metrics.oxygenLevel < 90 || metrics.suitPressure < 3.5 || metrics.heartRate > 100) {
                this.emit('vital-signs-alert', {
                    metrics,
                    timestamp: new Date(),
                    recommendations: this.getEmergencyProcedures('vitals_warning'),
                });
            }
        } catch (error) {
            console.error('Error monitoring vital signs:', error);
            throw error;
        }
    }

    getEmergencyProcedures(emergency) {
        const procedures = {
            vitals_warning: [
                'Check oxygen supply system',
                'Verify suit pressure integrity',
                'Monitor heart rate trends',
                'Consider activity reduction',
            ],
            critical_alert: [
                'Initiate emergency return protocol',
                'Contact mission control immediately',
                'Switch to backup life support if needed',
            ],
        };

        return procedures[emergency] || ['Follow standard emergency protocols'];
    }
}

module.exports = new EVAAIService();
