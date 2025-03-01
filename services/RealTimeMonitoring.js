const User = require('../models/User');
const { EventEmitter } = require('events');
const UserProgress = require('../models/UserProgress');

class RealTimeMonitoring extends EventEmitter {
    constructor() {
        super();
        this.activeSessions = new Map(); // Tracks active monitoring sessions
        this.metricsCache = new Map(); // Stores latest metrics
        this.alerts = new Set(); // Tracks raised alerts
        this.thresholds = this.initializeThresholds(); // Safety, performance, and progress thresholds

        console.log("✅ Real-Time Monitoring System Initialized");
    }

    /**
     * Initialize monitoring thresholds for safety, performance, and progress
     */
    initializeThresholds() {
        return {
            safety: { critical: 0.8, warning: 0.6, acceptable: 0.4 },
            performance: { excellent: 0.9, good: 0.7, needsImprovement: 0.5 },
            progress: { onTrack: 0.8, behind: 0.6, significantly: 0.4 }
        };
    }

    /**
     * Start monitoring a session
     * @param {string} sessionId - Unique session identifier
     * @param {object} initialData - Initial session data
     */
    startMonitoring(sessionId, initialData = {}) {
        if (this.activeSessions.has(sessionId)) {
            console.warn(`⚠️ Monitoring already active for session ${sessionId}`);
            return;
        }

        this.activeSessions.set(sessionId, {
            id: sessionId,
            startTime: new Date(),
            metrics: { ...initialData },
            alerts: new Set(),
            status: "active"
        });

        console.log(`✅ Started real-time monitoring for session: ${sessionId}`);

        // Start real-time metric analysis every second
        this.monitorSession(sessionId);
    }

    /**
     * Capture real-time metrics and analyze them
     * @param {string} sessionId - Session being monitored
     * @param {object} metrics - New metrics to track
     */
    gatherMetrics(sessionId, metrics) {
        if (!this.activeSessions.has(sessionId)) {
            console.warn(`⚠️ No active monitoring session found for ${sessionId}`);
            return;
        }

        const sessionData = this.activeSessions.get(sessionId);
        sessionData.metrics = { ...sessionData.metrics, ...metrics };

        // Store updated metrics in cache
        this.metricsCache.set(sessionId, sessionData.metrics);

        console.log(`📡 Updated real-time metrics for session: ${sessionId}`);

        // Analyze the metrics and determine if AI intervention is needed
        this.analyzeMetrics(sessionId, sessionData.metrics);

        // Emit updated metrics
        this.emit('metricsUpdated', { sessionId, metrics: sessionData.metrics });

        return sessionData.metrics;
    }

    /**
     * Analyze session metrics and determine if alerts or AI assistance is needed
     * @param {string} sessionId - Unique session identifier
     * @param {object} metrics - Current session metrics
     */
    analyzeMetrics(sessionId, metrics) {
        let session = this.activeSessions.get(sessionId);
        let needsGuidance = false;

        // Analyze safety, performance, and progress
        const analysis = {
            safety: this.evaluateThresholds(metrics.safety, this.thresholds.safety),
            performance: this.evaluateThresholds(metrics.performance, this.thresholds.performance),
            progress: this.evaluateThresholds(metrics.progress, this.thresholds.progress)
        };

        // Determine if AI guidance is needed
        if (analysis.safety === "critical" || analysis.performance === "needsImprovement" || analysis.progress === "significantly") {
            needsGuidance = true;
        }

        // Raise alerts if necessary
        if (analysis.safety === "critical") this.raiseAlert(sessionId, "SAFETY", "🚨 Critical safety issue detected!");
        if (analysis.performance === "needsImprovement") this.raiseAlert(sessionId, "PERFORMANCE", "⚠️ Performance below acceptable threshold.");
        if (analysis.progress === "significantly") this.raiseAlert(sessionId, "PROGRESS", "⚠️ Trainee progress significantly behind schedule.");

        // Request AI guidance if needed
        if (needsGuidance) {
            this.requestAIGuidance(sessionId, analysis);
        }

        // Update session status
        session.status = needsGuidance ? "needsGuidance" : "active";
    }

    /**
     * Request AI guidance from AIGuidanceSystem based on session analysis
     * @param {string} sessionId - Unique session identifier
     * @param {object} analysis - Evaluated analysis of safety, performance, and progress
     */
    async requestAIGuidance(sessionId, analysis) {
        try {
            const guidance = await AIGuidanceSystem.provideGuidance(sessionId, analysis);
            console.log(`🤖 AI Guidance Received for session ${sessionId}:`, guidance);

            // Apply AI recommendations
            this.emit('guidanceApplied', { sessionId, guidance });
        } catch (error) {
            console.error("❌ AI Guidance Request Error:", error);
        }
    }

    /**
     * Evaluate metrics against thresholds
     * @param {number} value - Current metric value
     * @param {object} threshold - Threshold object containing levels
     * @returns {string} - Status category (e.g., "critical", "warning", "acceptable")
     */
    evaluateThresholds(value, threshold) {
        if (value >= threshold.critical) return "critical";
        if (value >= threshold.warning) return "warning";
        return "acceptable";
    }

    /**
     * Raise an alert for a session
     * @param {string} sessionId - Unique session identifier
     * @param {string} type - Alert type (e.g., "SAFETY", "PERFORMANCE", "PROGRESS")
     * @param {string} message - Alert message
     */
    raiseAlert(sessionId, type, message) {
        const alert = {
            sessionId,
            type,
            message,
            timestamp: new Date(),
            acknowledged: false
        };

        this.alerts.add(alert);
        this.emit('alert', alert);
        console.warn(`🚨 ALERT [${type}] for session ${sessionId}: ${message}`);
    }

    /**
     * Stop monitoring a session
     * @param {string} sessionId - Unique session identifier
     */
    stopMonitoring(sessionId) {
        if (!this.activeSessions.has(sessionId)) {
            console.warn(`⚠️ No active monitoring session found for ${sessionId}`);
            return;
        }

        this.activeSessions.delete(sessionId);
        this.metricsCache.delete(sessionId);

        console.log(`🛑 Stopped real-time monitoring for session: ${sessionId}`);
    }

    /**
     * Cleanup inactive sessions
     * @param {number} timeout - Time in milliseconds before removing inactive sessions
     */
    cleanupInactiveSessions(timeout = 60000) {
        const now = Date.now();
        for (const [sessionId, session] of this.activeSessions.entries()) {
            if (now - session.startTime.getTime() > timeout) {
                this.stopMonitoring(sessionId);
            }
        }
    }
}

module.exports = new RealTimeMonitoring();
