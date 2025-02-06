// public/js/modules/training/AIHandler.js

class AIHandler {
  constructor() {
      this.ws = null;
      this.aiStatus = {
          initialized: false,
          currentMode: null,
          sessionId: null,
          lastGuidance: null
      };
      this.eventHandlers = new Map();
      this.biometricData = {
          heartRate: 0,
          oxygenLevel: 100,
          stressLevel: 1
      };
  }

  /**
   * Initializes the AI session and WebSocket connection.
   * @param {string} userId - The current user's ID.
   * @param {string} [mode='full_guidance'] - The desired AI mode.
   */
  async initialize(userId, mode = 'full_guidance') {
      try {
          this.setupWebSocket();
          
          const response = await fetch('/api/ai/ai-guidance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ mode, userId })
          });
          
          const data = await response.json();
          if (data.success) {
              this.aiStatus.initialized = true;
              this.aiStatus.currentMode = mode;
              this.aiStatus.sessionId = data.sessionId;
              this.updateAIStatusDisplay();
              this.emit('initialized', this.aiStatus);
              return data;
          } else {
              throw new Error('AI initialization failed: ' + JSON.stringify(data));
          }
      } catch (error) {
          console.error('AI Initialization error:', error);
          this.handleError(error);
      }
  }

  /**
   * Sets up the WebSocket connection to receive real-time AI updates.
   */
  setupWebSocket() {
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onmessage = (event) => {
          try {
              const data = JSON.parse(event.data);
              switch (data.type) {
                  case 'AI_GUIDANCE':
                      this.handleAIGuidance(data.guidance);
                      break;
                  case 'ACHIEVEMENT_UNLOCKED':
                      this.handleAchievement(data.achievement);
                      break;
                  case 'PROGRESS_UPDATE':
                      this.handleProgressUpdate(data.progress);
                      break;
                  case 'BIOMETRIC_UPDATE':
                      this.handleBiometricUpdate(data.biometricData);
                      break;
                  default:
                      console.warn('Unhandled WebSocket event type:', data.type);
              }
          } catch (err) {
              console.error('Error processing WebSocket message:', err);
          }
      };

      this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.handleError(error);
      };
  }

  /**
   * Updates the UI element displaying AI status.
   */
  updateAIStatusDisplay() {
      const aiStatusElement = document.getElementById('ai-status');
      if (aiStatusElement) {
          aiStatusElement.innerHTML = `
              <div class="flex items-center space-x-2">
                  <span class="w-2 h-2 rounded-full ${this.aiStatus.initialized ? 'bg-green-500' : 'bg-red-500'}"></span>
                  <span class="text-sm text-gray-300">AI Coach: ${this.aiStatus.initialized ? 'Active' : 'Inactive'}</span>
              </div>
          `;
      }
  }

  /**
   * Handles the display of AI guidance messages.
   * @param {string} guidance - The guidance message.
   */
  handleAIGuidance(guidance) {
      const guidanceElement = document.getElementById('ai-guidance');
      if (guidanceElement) {
          guidanceElement.innerHTML = `
              <div class="bg-blue-900/30 rounded-xl p-4 border border-blue-500/20">
                  <h3 class="text-lg font-semibold text-blue-400 mb-2">AI Coach Insights</h3>
                  <p class="text-gray-300">${guidance}</p>
              </div>
          `;
      }
  }

  /**
   * Handles achievement notifications received via WebSocket.
   * @param {Object} achievement - The achievement data.
   */
  handleAchievement(achievement) {
      if (window.AchievementDisplay) {
          window.AchievementDisplay.showAchievement(achievement);
      }
  }

  /**
   * Handles progress update notifications.
   * @param {number} progress - The updated progress value.
   */
  handleProgressUpdate(progress) {
      if (window.ProgressTracker) {
          window.ProgressTracker.updateProgress(progress);
      }
  }

  /**
   * Handles real-time biometric updates.
   * @param {Object} biometricData - Updated biometric readings.
   */
  handleBiometricUpdate(biometricData) {
      this.biometricData = biometricData;
      console.log('Biometric Update:', biometricData);
      
      if (biometricData.stressLevel > 7) {
          this.requestGuidance({ issue: 'High stress detected', suggestion: 'Take a short break' });
      }
  }

  /**
   * Centralized error handler.
   * @param {Error} error - The error object.
   */
  handleError(error) {
      console.error('AI Handler Error:', error);
  }

  // --- Event Emitter Methods ---
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
          handlers.forEach(handler => handler(data));
      }
  }
}

// Export a singleton instance
export default new AIHandler();
