// middleware/websocket.js
const AISpaceCoach = require('../services/AISpaceCoach');

function setupWebSocket(wss) {
    wss.on('connection', (ws) => {
        console.log('Client connected');

        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message);
                
                switch(data.type) {
                    case 'track_progress':
                        const progress = await AISpaceCoach.trackProgress(
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
                        
                        ws.send(JSON.stringify({
                            type: 'coaching_suggestions',
                            suggestions
                        }));
                        break;

                    case 'start_assessment':
                        const assessment = await AISpaceCoach.getInitialAssessment();
                        
                        ws.send(JSON.stringify({
                            type: 'assessment_questions',
                            assessment
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

        AISpaceCoach.on('achievement-unlocked', (data) => {
            ws.send(JSON.stringify({
                type: 'achievement_unlocked',
                data
            }));
        });
    });
}

module.exports = { setupWebSocket };