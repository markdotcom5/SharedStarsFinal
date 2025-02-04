// services/GuidanceOverlayService.js
const EventEmitter = require('events');
const User = require('../models/User');

class GuidanceOverlayService extends EventEmitter {
    constructor() {
        super();
        this.activeOverlays = new Map();
    }

    async initializeOverlay(userId) {
        try {
            const overlayState = {
                activeElements: [],
                currentHighlight: null,
                pathVisualization: [],
                confidenceIndicators: {},
                nextActionPointer: null,
                visualCues: [],
                lastUpdate: new Date()
            };

            this.activeOverlays.set(userId, overlayState);
            return overlayState;
        } catch (error) {
            console.error('Overlay Initialization Error:', error);
            throw error;
        }
    }

    async updateOverlay(userId, updates) {
        try {
            const overlay = this.activeOverlays.get(userId);
            if (!overlay) throw new Error('No active overlay found');

            // Update overlay state
            Object.assign(overlay, {
                ...updates,
                lastUpdate: new Date()
            });

            // Emit update event for real-time sync
            this.emit('overlayUpdate', {
                userId,
                type: 'OVERLAY_UPDATE',
                state: overlay
            });

            return overlay;
        } catch (error) {
            console.error('Overlay Update Error:', error);
            throw error;
        }
    }

    async highlightElement(userId, elementId, type) {
        try {
            const overlay = this.activeOverlays.get(userId);
            if (!overlay) throw new Error('No active overlay found');

            overlay.currentHighlight = {
                elementId,
                type,
                timestamp: new Date()
            };

            this.emit('overlayUpdate', {
                userId,
                type: 'HIGHLIGHT_UPDATE',
                highlight: overlay.currentHighlight
            });

            return overlay;
        } catch (error) {
            console.error('Highlight Update Error:', error);
            throw error;
        }
    }

    async showNextAction(userId, action) {
        try {
            const overlay = this.activeOverlays.get(userId);
            if (!overlay) throw new Error('No active overlay found');

            overlay.nextActionPointer = {
                action,
                visualCue: this.generateVisualCue(action),
                timestamp: new Date()
            };

            this.emit('overlayUpdate', {
                userId,
                type: 'NEXT_ACTION_UPDATE',
                action: overlay.nextActionPointer
            });

            return overlay;
        } catch (error) {
            console.error('Next Action Update Error:', error);
            throw error;
        }
    }

    generateVisualCue(action) {
        // Generate appropriate visual cue based on action type
        return {
            type: 'pointer',  // or 'highlight', 'arrow', etc.
            direction: 'up',
            color: '#3B82F6',
            animation: 'pulse'
        };
    }

    async updateConfidence(userId, confidenceData) {
        try {
            const overlay = this.activeOverlays.get(userId);
            if (!overlay) throw new Error('No active overlay found');

            overlay.confidenceIndicators = {
                ...confidenceData,
                timestamp: new Date()
            };

            this.emit('overlayUpdate', {
                userId,
                type: 'CONFIDENCE_UPDATE',
                confidence: overlay.confidenceIndicators
            });

            return overlay;
        } catch (error) {
            console.error('Confidence Update Error:', error);
            throw error;
        }
    }

    async clearOverlay(userId) {
        try {
            const overlay = this.activeOverlays.get(userId);
            if (!overlay) return;

            overlay.activeElements = [];
            overlay.currentHighlight = null;
            overlay.nextActionPointer = null;
            overlay.lastUpdate = new Date();

            this.emit('overlayUpdate', {
                userId,
                type: 'OVERLAY_CLEAR',
                state: overlay
            });

            return overlay;
        } catch (error) {
            console.error('Overlay Clear Error:', error);
            throw error;
        }
    }

    getOverlayState(userId) {
        const overlay = this.activeOverlays.get(userId);
        if (!overlay) throw new Error('No active overlay found');
        return overlay;
    }
}

module.exports = new GuidanceOverlayService();