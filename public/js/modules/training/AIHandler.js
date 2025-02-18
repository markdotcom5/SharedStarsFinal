// public/js/modules/training/AIHandler.js

class AIHandler {
    constructor() {
        this.ws = null;
        this.aiState = {
            initialized: false,
            mode: null,
            sessionId: null,
            learnerProfile: null,
        };
        this.eventHandlers = new Map();
        this.performanceHistory = [];
        this.adaptiveEngine = new SpaceTrainingFSD();
    }

    async initialize(userId, mode = 'full_guidance') {
        try {
            await this.setupLearnerProfile(userId);
            await this.setupWebSocket();
            await this.initializeAI(mode);
            return true;
        } catch (error) {
            console.error('AI Initialization error:', error);
            return false;
        }
    }

    async setupLearnerProfile(userId) {
        const response = await fetch(`/api/training/learner-profile/${userId}`);
        this.learnerProfile = await response.json();
    }

    async setupWebSocket() {
        const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onmessage = this.handleWebSocketMessage.bind(this);
        this.ws.onerror = this.handleWebSocketError.bind(this);

        return new Promise((resolve, reject) => {
            this.ws.onopen = () => resolve();
            this.ws.onerror = () => reject(new Error('WebSocket connection failed'));
        });
    }

    async handleBiometricWarning(violations) {
        const analysis = await this.analyzeBiometricData(violations);
        const guidance = this.generateBiometricGuidance(analysis);

        this.emit('guidance', guidance);

        if (analysis.requiresIntervention) {
            await this.requestAIIntervention(analysis);
        }
    }

    async analyzeBiometricData(violations) {
        const historicalData = this.performanceHistory.slice(-10);
        const response = await fetch('/api/ai/analyze-biometrics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                violations,
                historicalData,
                learnerProfile: this.learnerProfile,
            }),
        });

        return await response.json();
    }

    generateBiometricGuidance(analysis) {
        const guidance = {
            immediate: [],
            shortTerm: [],
            longTerm: [],
        };

        // Immediate actions
        if (analysis.stressLevel > 7) {
            guidance.immediate.push("Take deep breaths. Let's pause for a moment.");
        }

        // Short-term adjustments
        if (analysis.fatigue > 0.6) {
            guidance.shortTerm.push('Consider taking a 15-minute break.');
        }

        // Long-term recommendations
        if (analysis.patterns.highStressFrequency > 0.3) {
            guidance.longTerm.push("Let's work on stress management techniques.");
        }

        return guidance;
    }

    async requestAIIntervention(analysis) {
        const intervention = await this.adaptiveEngine.generateIntervention(analysis);

        this.emit('intervention', intervention);

        if (intervention.type === 'break') {
            this.pauseTraining();
        } else if (intervention.type === 'adjust') {
            this.adjustDifficulty(intervention.adjustments);
        }
    }

    handleWebSocketMessage(event) {
        try {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case 'AI_GUIDANCE':
                    this.processAIGuidance(data.guidance);
                    break;
                case 'BIOMETRIC_ALERT':
                    this.processBiometricAlert(data.alert);
                    break;
                case 'PERFORMANCE_UPDATE':
                    this.updatePerformanceHistory(data.performance);
                    break;
                case 'CERTIFICATION_PROGRESS':
                    this.updateCertificationProgress(data.progress);
                    break;
            }
        } catch (error) {
            console.error('WebSocket message processing error:', error);
        }
    }

    async processAIGuidance(guidance) {
        // Update UI
        this.emit('guidance', guidance);

        // Record for analysis
        this.performanceHistory.push({
            timestamp: Date.now(),
            guidance,
            context: this.getCurrentContext(),
        });

        // Check for patterns
        await this.analyzeGuidancePatterns();
    }

    processBiometricAlert(alert) {
        this.emit('biometricAlert', alert);

        if (alert.severity === 'high') {
            this.requestImmediateIntervention(alert);
        }
    }

    getCurrentContext() {
        return {
            moduleProgress: this.learnerProfile.moduleProgress,
            recentPerformance: this.performanceHistory.slice(-5),
            currentDifficulty: this.adaptiveEngine.currentState,
        };
    }

    async analyzeGuidancePatterns() {
        if (this.performanceHistory.length < 10) return;

        const patterns = await this.adaptiveEngine.analyzePatterns(
            this.performanceHistory.slice(-10)
        );

        if (patterns.requiresAdjustment) {
            await this.adjustTrainingPath(patterns.recommendations);
        }
    }

    // Event handling system
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }
        this.eventHandlers.get(event).add(handler);
    }

    off(event, handler) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.delete(handler);
        }
    }

    emit(event, data) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.forEach((handler) => handler(data));
        }
    }
}

export default new AIHandler();
