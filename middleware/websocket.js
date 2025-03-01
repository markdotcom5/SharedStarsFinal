const AISpaceCoach = require('../services/AISpaceCoach.js');
const STELLAIntegration = require('../services/stella-integration.js');

function setupWebSocket(wss) {
    wss.on('connection', (ws) => {
        console.log('Client connected');

        // Initialize CreditSystem with WebSocket
        const creditSystem = new CreditSystem(wss);

        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message);

                switch(data.type) {
                    case 'track_progress':
                        const progress = await AISpaceCoach.trackProgress(
                            data.userId,
                            data.progressData
                        );
                        
                        // Update credits based on progress
                        await creditSystem.updateCreditsForProgress(
                            data.userId, 
                            data.progressData
                        );

                        ws.send(JSON.stringify({
                            type: 'progress_update',
                            progress
                        }));
                        break;

                    case 'request_coaching':
                        const suggestions = await AISpaceCoach.generateCoachingSuggestions(
                            data.userProfile
                        );
                        const translatedSuggestions = await AISpaceCoach.translateResponse(suggestions, data.language || 'en');

                        ws.send(JSON.stringify({
                            type: 'coaching_suggestions',
                            suggestions: translatedSuggestions
                        }));
                        break;

                    case 'start_assessment':
                        const assessment = await AISpaceCoach.getInitialAssessment();
                        const translatedAssessment = await AISpaceCoach.translateAssessment(assessment, data.language || 'en');

                        ws.send(JSON.stringify({
                            type: 'assessment_questions',
                            assessment: translatedAssessment
                        }));
                        break;

                    case 'request_credit_update':
                        const credits = await creditSystem.calculateUserCredits(data.userId);
                        ws.send(JSON.stringify({
                            type: 'credit_update',
                            credits
                        }));
                        break;

                    case 'request_timeline':
                        const timeline = await creditSystem.calculateTimeToLaunch(data.userId);
                        ws.send(JSON.stringify({
                            type: 'timeline_update',
                            timeline
                        }));
                        break;

                    case 'STELLA_GUIDANCE':
                        const guidance = await AISpaceCoach.generateAdvancedCoachingSuggestions(data.userProfile);
                        const translatedGuidance = await AISpaceCoach.translateResponse(guidance, data.language || 'en');

                        ws.send(JSON.stringify({
                            type: 'STELLA_GUIDANCE_RESPONSE',
                            guidance: translatedGuidance
                        }));
                        break;

                    case 'STELLA_INTERVENTION':
                        const intervention = await AISpaceCoach.analyzeRealTimePerformance(data.userId, data.requestData);
                        const adjustedCredits = await creditSystem.updateCreditsForProgress(data.userId, { type: 'performance_intervention', value: intervention.score });

                        ws.send(JSON.stringify({
                            type: 'STELLA_INTERVENTION_RESPONSE',
                            intervention,
                            adjustedCredits
                        }));
                        break;
                }
            } catch (error) {
                console.error('WebSocket message error:', error);
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Error processing request'
                }));
            }
        });

        // Listen for AI Coach events
        AISpaceCoach.on('progress-update', (data) => {
            ws.send(JSON.stringify({
                type: 'progress_update',
                data
            }));
        });

        AISpaceCoach.on('achievement-unlocked', async (data) => {
            await creditSystem.updateCreditsForProgress(data.userId, {
                type: 'achievement',
                achievementId: data.achievement._id
            });

            ws.send(JSON.stringify({
                type: 'achievement_unlocked',
                data
            }));
        });

        // Listen for Credit System events
        creditSystem.on('creditsUpdated', (data) => {
            ws.send(JSON.stringify({
                type: 'credit_update',
                data
            }));
        });

        creditSystem.on('timelineUpdated', (data) => {
            ws.send(JSON.stringify({
                type: 'timeline_update',
                data
            }));
        });
    });
}
module.exports = { setupWebSocket };

const CreditSystem = require('../services/CreditSystem');
