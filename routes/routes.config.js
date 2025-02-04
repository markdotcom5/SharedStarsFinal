const API_ROUTES = {
    training: {
        start: '/api/ai/training/start-assessment',
        submit: '/api/ai/training/submit-answer',
        complete: '/api/ai/training/assessment/:sessionId/complete'
    }
};

module.exports = API_ROUTES;