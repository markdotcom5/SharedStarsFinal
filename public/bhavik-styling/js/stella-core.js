/**
 * STELLA Core - Space Training Enhancement and Learning Logic Assistant
 * Advanced AI functionality for the SharedStars training platform
 * 
 * Version 2.0 - Enhanced with better space training guidance and robust fallbacks
 */

// Only define the class if it doesn't already exist
if (!window.StellaCore) {
  window.StellaCore = class StellaCore {
    /**
     * Initialize STELLA AI core functionality
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
      this.options = {
        statusSelector: '#stella-status',
        messageSelector: '#stella-status-message',
        guidanceSelector: '#stella-guidance',
        modalSelector: '#stella-help-modal',
        conversationSelector: '.stella-conversation',
        inputSelector: '#stella-question',
        sendButtonSelector: '#send-to-stella',
        expandButtonSelector: '#expand-stella',
        missionSelector: '#mission-progress-bar',
        countdownSelector: '#space-countdown',
        debugMode: false,
        mockApi: true, // Use mock responses until backend is ready
        ...options
      };
      
      this.connected = false;
      this.currentModuleType = document.querySelector('[data-module]')?.dataset.module || 'physical';
      this.currentMission = document.querySelector('[data-mission]')?.dataset.mission || 'core-balance';
      
      // Default space metrics
      this.sessionMetrics = {
        heartRate: 0,
        o2Saturation: 98,
        focusScore: 75,
        progressPercentage: 0,
        balance: 65,
        coreStability: 70,
        endurance: 60,
        formQuality: 75,
        vestibularAdaptation: 60,
        missionProgress: 0
      };
      
      // Track guidance history
      this.guidanceHistory = [];
      
      // Track user questions for learning
      this.userQuestions = [];
      
      // Track offline mode status
      this.offlineMode = false;
      
      // Initialize STELLA
      this.initialize();
      
      // Log initialization in debug mode
      if (this.options.debugMode) {
        console.log('STELLA Core initialized with options:', this.options);
      }
    }
    
    /**
     * Initialize STELLA components
     */
    initialize() {
      // Initialize UI elements
      this.statusElement = document.querySelector(this.options.statusSelector);
      this.messageElement = document.querySelector(this.options.messageSelector);
      this.guidanceElement = document.querySelector(this.options.guidanceSelector);
      this.modalElement = document.querySelector(this.options.modalSelector);
      this.conversationElement = document.querySelector(this.options.conversationSelector);
      this.inputElement = document.querySelector(this.options.inputSelector);
      this.sendButton = document.querySelector(this.options.sendButtonSelector);
      this.expandButton = document.querySelector(this.options.expandButtonSelector);
      this.missionProgressElement = document.querySelector(this.options.missionSelector);
      this.countdownElement = document.querySelector(this.options.countdownSelector);
      
      // Load user questions from localStorage
      this._loadUserQuestions();
      
      // Set up event listeners
      this._setupEventListeners();
      
      // Set initial status
      this._updateStatus('connecting');
      
      // Connect to backend
      this._connectToBackend()
        .then(() => {
          this._updateStatus('connected');
          this._fetchUserInfo();
          
          // Initialize with a welcome message
          this._showWelcomeMessage();
        })
        .catch(error => {
          console.error('Failed to connect to STELLA backend:', error);
          this._updateStatus('error');
          this.offlineMode = true;
          
          // Still show welcome message in offline mode
          this._showWelcomeMessage();
        });
        
      // Register global STELLA instance
      window.STELLA = this;
      
      // Listen for training events
      document.addEventListener('mission-progress-update', (e) => this._handleMissionProgressUpdate(e.detail));
      document.addEventListener('exercise-completed', (e) => this._handleExerciseCompleted(e.detail));
      document.addEventListener('session-started', (e) => this._handleSessionStarted(e.detail));
      document.addEventListener('session-completed', (e) => this._handleSessionCompleted(e.detail));
    }
    
    /**
     * Get guidance for current activity
     * @param {String} activity - Activity type (e.g., 'endurance', 'balance')
     * @param {Object} metrics - Current metrics
     * @returns {Promise<Object>} Guidance data
     */
    async getGuidance(activity, metrics = {}) {
      try {
        // Log request in debug mode
        if (this.options.debugMode) {
          console.log(`Getting guidance for ${activity} with metrics:`, metrics);
        }
        
        // Merge current session metrics with provided metrics
        const combinedMetrics = {
          ...this.sessionMetrics,
          ...metrics
        };
        
        // Update stored metrics
        this.sessionMetrics = combinedMetrics;
        
        // For MVP or offline mode, use mock guidance
        if (this.options.mockApi !== false || this.offlineMode) {
          return this._getMockGuidance(activity, combinedMetrics);
        }
        
        // Add retry logic for API calls
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts) {
          try {
            // Call backend API for guidance
            const response = await fetch('/api/ai/guidance', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                activity,
                metrics: combinedMetrics,
                module: this.currentModuleType,
                mission: this.currentMission
              })
            });
            
            if (!response.ok) {
              throw new Error(`Failed to get guidance: ${response.status}`);
            }
            
            const guidance = await response.json();
            
            // Store guidance in history
            this._addToGuidanceHistory(activity, guidance);
            
            // Update UI with guidance
            this._updateGuidance(guidance);
            
            // Dispatch guidance event
            this._dispatchGuidanceEvent(guidance);
            
            return guidance;
          } catch (error) {
            attempts++;
            if (attempts >= maxAttempts) {
              throw error;
            }
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          }
        }
      } catch (error) {
        console.error('Error getting STELLA guidance:', error);
        this.offlineMode = true;
        
        // Fallback guidance
        const fallbackGuidance = {
          message: 'I\'m currently operating in offline mode. Focus on maintaining proper form and steady breathing during your exercises.',
          actionItems: ['Monitor your breathing', 'Maintain proper posture', 'Stay hydrated'],
          source: 'fallback'
        };
        
        this._updateGuidance(fallbackGuidance);
        this._dispatchGuidanceEvent(fallbackGuidance);
        
        return fallbackGuidance;
      }
    }
    
    /**
     * Ask STELLA a specific question
     * @param {String} question - User's question
     * @returns {Promise<String>} STELLA's response
     */
    async askQuestion(question) {
      if (!question || !question.trim()) {
        return null;
      }
      
      // Track question for analysis
      this._trackUserQuestion(question);
      
      try {
        // Add user question to conversation UI
        this._addMessageToConversation(question, 'user');
        
        // Update status to show we're processing
        this._updateStatus('busy');
        
        // For MVP or offline mode, use mock responses
        if (this.options.mockApi !== false || this.offlineMode) {
          // Add a small delay to simulate processing
          await new Promise(resolve => setTimeout(resolve, 800));
          
          const response = this._getMockResponse(question);
          this._updateStatus('connected');
          return response;
        }
        
        // Real API call with retry logic
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts) {
          try {
            const response = await fetch('/api/ai/ask', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ 
                question,
                context: {
                  module: this.currentModuleType,
                  mission: this.currentMission,
                  metrics: this.sessionMetrics
                }
              })
            });
            
            if (!response.ok) {
              throw new Error(`Failed to get response: ${response.status}`);
            }
            
            const { answer } = await response.json();
            
            // Add STELLA's response to conversation UI
            this._addMessageToConversation(answer, 'stella');
            
            // Update status back to connected
            this._updateStatus('connected');
            
            return answer;
          } catch (error) {
            attempts++;
            if (attempts >= maxAttempts) {
              throw error;
            }
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          }
        }
      } catch (error) {
        console.error('Error asking STELLA:', error);
        this.offlineMode = true;
        this._updateStatus('error');
        
        // Fallback response
        const fallbackResponse = "I'm currently operating in offline mode, but I can still assist with your training. Let's focus on your current mission objectives while my connection is restored.";
        this._addMessageToConversation(fallbackResponse, 'stella');
        
        return fallbackResponse;
      }
    }
    
    /**
     * Update current session metrics
     * @param {Object} metrics - Updated metrics
     */
    updateMetrics(metrics) {
      if (!metrics) return;
      
      // Log in debug mode
      if (this.options.debugMode) {
        console.log('Updating STELLA metrics:', metrics);
      }
      
      // Update stored metrics
      this.sessionMetrics = {
        ...this.sessionMetrics,
        ...metrics
      };
      
      // Update mission progress if provided
      if (metrics.missionProgress !== undefined && this.missionProgressElement) {
        this.missionProgressElement.style.width = `${metrics.missionProgress}%`;
      }
      
      // Update countdown if provided
      if (metrics.countdown !== undefined && this.countdownElement) {
        this.countdownElement.textContent = `${metrics.countdown} Days`;
      }
      
      // Dispatch metrics update event
      this._dispatchMetricsEvent(this.sessionMetrics);
      
      // Trigger guidance update based on new metrics if significant changes
      if (this._shouldTriggerGuidance(metrics)) {
        this.getGuidance('metrics-update', this.sessionMetrics);
      }
    }
    
    /**
     * Determine if a guidance update should be triggered based on metric changes
     * @private
     * @param {Object} newMetrics - The updated metrics
     * @returns {Boolean} Whether guidance should be triggered
     */
    _shouldTriggerGuidance(newMetrics) {
      // Trigger on significant heart rate change
      if (newMetrics.heartRate && Math.abs(newMetrics.heartRate - (this.sessionMetrics.heartRate || 0)) > 15) {
        return true;
      }
      
      // Trigger on significant form quality change
      if (newMetrics.formQuality && Math.abs(newMetrics.formQuality - (this.sessionMetrics.formQuality || 0)) > 10) {
        return true;
      }
      
      // Trigger on mission progress milestones
      if (newMetrics.missionProgress && 
          Math.floor(newMetrics.missionProgress / 25) > 
          Math.floor((this.sessionMetrics.missionProgress || 0) / 25)) {
        return true;
      }
      
      return false;
    }
    
    /**
     * Show the STELLA help modal
     */
    showModal() {
      if (this.modalElement) {
        this.modalElement.classList.remove('hidden');
      }
    }
    
    /**
     * Hide the STELLA help modal
     */
    hideModal() {
      if (this.modalElement) {
        this.modalElement.classList.add('hidden');
      }
    }
    
    /**
     * Get personalized recommendations based on user data
     * @param {Object} userData - User data for personalization
     * @returns {Object} Personalized recommendations
     */
    getPersonalizedRecommendations(userData = {}) {
      // Combined user data with session metrics
      const combinedData = {
        ...this.sessionMetrics,
        ...userData
      };
      
      return {
        focusAreas: [
          'Vestibular adaptation training',
          'Upper body strength for EVA readiness',
          'Core stability for microgravity adaptation'
        ],
        nextModules: [
          { id: 'vestibular-04', name: 'Advanced Vestibular Training', priority: 'high' },
          { id: 'strength-07', name: 'EVA-Specific Strength Development', priority: 'medium' },
          { id: 'core-05', name: 'Microgravity Core Stabilization', priority: 'medium' }
        ],
        nutritionTips: [
          'Increase calcium intake to support bone density',
          'Optimize protein timing around resistance training',
          'Ensure adequate hydration for vestibular sessions'
        ],
        recoveryStrategies: [
          'Contrast therapy post-session',
          'Vestibular reset exercises before sleep',
          'Full recovery day post Module 3.2'
        ]
      };
    }
    
    /**
     * Analyze a training session
     * @param {Object} sessionData - Training session data
     * @returns {Object} Session analysis
     */
    analyzeTrainingSession(sessionData = {}) {
      const strengthScore = (sessionData.formQuality || 70) * 0.4 + (sessionData.intensity || 65) * 0.6;
      const enduranceScore = (sessionData.heartRateControl || 75) * 0.5 + (sessionData.durationPercentage || 80) * 0.5;
      const balanceScore = (sessionData.stabilityMetrics || 65) * 0.7 + (sessionData.adaptationRate || 60) * 0.3;
    
      return {
        overallScore: Math.round((strengthScore + enduranceScore + balanceScore) / 3),
        strengths: [
          strengthScore > 75 ? 'Excellent form maintenance' : null,
          enduranceScore > 75 ? 'Strong cardiovascular performance' : null,
          balanceScore > 75 ? 'Superior vestibular adaptation' : null
        ].filter(Boolean),
        improvementAreas: [
          strengthScore < 70 ? 'Focus on consistent form during fatigue' : null,
          enduranceScore < 70 ? 'Work on heart rate recovery between intervals' : null,
          balanceScore < 70 ? 'Increase duration of vestibular challenges' : null
        ].filter(Boolean),
        recommendations: [
          'Increase hydration during similar future sessions',
          'Consider adding 5 minutes to your cool-down protocol',
          strengthScore < enduranceScore ? 'Prioritize resistance training in next session' : 'Maintain training balance'
        ]
      };
    }
    
    /**
     * Handle mission progress updates
     * @private
     * @param {Object} detail - Progress update details
     */
    _handleMissionProgressUpdate(detail) {
      if (!detail) return;
      
      // Log in debug mode
      if (this.options.debugMode) {
        console.log('Mission progress update:', detail);
      }
      
      // Update metrics
      this.updateMetrics({
        missionProgress: detail.progress || 0
      });
      
      // If significant progress milestone, provide guidance
      if (detail.progress && (detail.progress === 25 || detail.progress === 50 || detail.progress === 75 || detail.progress === 100)) {
        this.getGuidance('progress-milestone', {
          progress: detail.progress,
          milestone: Math.floor(detail.progress / 25)
        });
      }
    }
    
    /**
     * Handle exercise completed events
     * @private
     * @param {Object} detail - Exercise details
     */
    _handleExerciseCompleted(detail) {
      if (!detail) return;
      
      // Log in debug mode
      if (this.options.debugMode) {
        console.log('Exercise completed:', detail);
      }
      
      // Get exercise-specific guidance
      this.getGuidance('exercise-completed', {
        exerciseId: detail.id,
        duration: detail.duration,
        performance: detail.performance || 'good'
      });
    }
    
    /**
     * Handle session started events
     * @private
     * @param {Object} detail - Session details
     */
    _handleSessionStarted(detail) {
      if (!detail) return;
      
      // Log in debug mode
      if (this.options.debugMode) {
        console.log('Session started:', detail);
      }
      
      // Get session start guidance
      this.getGuidance('session-start', {
        sessionId: detail.id,
        sessionType: detail.type
      });
    }
    
    /**
     * Handle session completed events
     * @private
     * @param {Object} detail - Session details
     */
    _handleSessionCompleted(detail) {
      if (!detail) return;
      
      // Log in debug mode
      if (this.options.debugMode) {
        console.log('Session completed:', detail);
      }
      
      // Get session end guidance
      this.getGuidance('session-end', {
        sessionId: detail.id,
        sessionDuration: detail.duration,
        sessionEffectiveness: detail.effectiveness || 85,
        exercisesCompleted: detail.exercisesCompleted || []
      });
    }
    
    /**
     * Show welcome message based on context
     * @private
     */
    _showWelcomeMessage() {
      // Determine context-appropriate welcome message
      let welcomeMessage;
      
      switch (this.currentModuleType) {
        case 'physical':
          welcomeMessage = "Welcome to your Physical Training module. I'm STELLA, your space training AI assistant. I'll guide you through exercises that prepare your body for the unique challenges of microgravity environments.";
          break;
        case 'technical':
          welcomeMessage = "Welcome to Technical Training. I'll assist you in mastering the critical technical skills required for spacecraft operations and emergency procedures.";
          break;
        case 'mental':
          welcomeMessage = "Welcome to Mental Fitness training. I'll guide you through cognitive exercises designed to enhance your decision-making, stress management, and mental resilience in space.";
          break;
        default:
          welcomeMessage = "Welcome to SharedStars Academy. I'm STELLA, your AI training assistant. I'll guide your preparation for space through personalized training and real-time feedback.";
      }
      
      // Only show if guidance element exists
      if (this.guidanceElement) {
        this._updateGuidance({
          message: welcomeMessage,
          actionItems: [
            "Complete your initial assessment",
            "Follow the training sequence for optimal results",
            "Ask me questions anytime during your training"
          ]
        });
      }
    }
    
    /**
     * PRIVATE: Set up event listeners
     * @private
     */
    _setupEventListeners() {
      // Send button click
      if (this.sendButton && this.inputElement) {
        this.sendButton.addEventListener('click', () => {
          const question = this.inputElement.value.trim();
          if (question) {
            this.askQuestion(question);
            this.inputElement.value = '';
          }
        });
      }
      
      // Input enter key
      if (this.inputElement) {
        this.inputElement.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            const question = this.inputElement.value.trim();
            if (question) {
              this.askQuestion(question);
              this.inputElement.value = '';
            }
          }
        });
      }
      
      // Modal close button
      const closeModalButton = document.getElementById('close-stella-modal');
      if (closeModalButton) {
        closeModalButton.addEventListener('click', () => {
          this.hideModal();
        });
      }
      
      // Help button
      const helpButton = document.getElementById('ai-help-button');
      if (helpButton) {
        helpButton.addEventListener('click', () => {
          this.showModal();
        });
      }
      
      // Expand button
      if (this.expandButton) {
        this.expandButton.addEventListener('click', () => {
          const stellaInterface = document.getElementById('stella-interface');
          if (stellaInterface) {
            stellaInterface.classList.toggle('expanded');
            
            // Toggle button icon between expand and collapse
            this.expandButton.innerHTML = stellaInterface.classList.contains('expanded')
              ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>'
              : '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"/></svg>';
          }
        });
      }
      
      // Quick guidance buttons
      document.querySelectorAll('[data-stella-guidance]').forEach(btn => {
        btn.addEventListener('click', () => {
          const guidanceType = btn.dataset.stellaGuidance;
          if (guidanceType) {
            this.getGuidance(guidanceType);
          }
        });
      });
    }
    
    /**
     * PRIVATE: Connect to STELLA backend
     * @private
     */
    async _connectToBackend() {
      // For MVP, just simulate connection
      if (this.options.mockApi !== false) {
        return new Promise(resolve => {
          setTimeout(() => {
            this.connected = true;
            resolve(true);
          }, 1000);
        });
      }
      
      // Real connection logic
      try {
        const response = await fetch('/api/ai/status');
        if (!response.ok) {
          throw new Error(`Failed to connect: ${response.status}`);
        }
        
        const { status } = await response.json();
        this.connected = status === 'online';
        
        return this.connected;
      } catch (error) {
        console.error('Error connecting to STELLA backend:', error);
        this.connected = false;
        throw error;
      }
    }
    
    /**
     * PRIVATE: Fetch user information
     * @private
     */
    async _fetchUserInfo() {
      // For MVP, mock this
      if (this.options.mockApi !== false) {
        return {
          level: 'beginner',
          progress: 25,
          strengths: ['dedication', 'consistency'],
          weaknesses: ['balance', 'core stability']
        };
      }
      
      try {
        const response = await fetch('/api/user/profile');
        if (!response.ok) {
          throw new Error(`Failed to fetch user info: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error fetching user info:', error);
        return null;
      }
    }
    
    /**
     * PRIVATE: Update STELLA status indicator
     * @private
     */
    _updateStatus(status) {
      if (!this.statusElement) return;
      
      // Remove all status classes
      this.statusElement.classList.remove('bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-blue-500');
      
      // Add appropriate class and update animation
      switch (status) {
        case 'connected':
          this.statusElement.classList.add('bg-green-500');
          if (this.messageElement) {
            this.messageElement.innerHTML = 'STELLA: <span class="text-blue-400">Online and ready</span>';
          }
          break;
        case 'connecting':
          this.statusElement.classList.add('bg-blue-500');
          if (this.messageElement) {
            this.messageElement.innerHTML = 'STELLA: <span class="text-blue-400">Connecting...</span>';
          }
          break;
        case 'busy':
          this.statusElement.classList.add('bg-yellow-500');
          if (this.messageElement) {
            this.messageElement.innerHTML = 'STELLA: <span class="text-yellow-400">Processing...</span>';
          }
          break;
        case 'error':
          this.statusElement.classList.add('bg-red-500');
          if (this.messageElement) {
            this.messageElement.innerHTML = this.offlineMode 
              ? 'STELLA: <span class="text-red-400">Offline mode</span>'
              : 'STELLA: <span class="text-red-400">Connection error</span>';
          }
          break;
        default:
          this.statusElement.classList.add('bg-blue-500');
          if (this.messageElement) {
            this.messageElement.innerHTML = 'STELLA: <span class="text-blue-400">Standing by</span>';
          }
          break;
      }
    }
    
    /**
     * PRIVATE: Update guidance display
     * @private
     */
    _updateGuidance(guidance) {
      if (!this.guidanceElement) return;
      
      if (guidance && guidance.message) {
        const actionItemsHtml = guidance.actionItems && guidance.actionItems.length
          ? `<ul class="mt-2 space-y-1 list-disc list-inside">
              ${guidance.actionItems.map(item => `<li class="text-xs text-blue-200">• ${item}</li>`).join('')}
            </ul>`
          : '';
        
        this.guidanceElement.innerHTML = `
          <div class="bg-blue-500/10 rounded-lg p-3">
            <p class="text-sm text-blue-300">${guidance.message}</p>
            ${actionItemsHtml}
          </div>
        `;
      } else {
        this.guidanceElement.innerHTML = `
          <div class="bg-blue-500/10 rounded-lg p-3">
            <p class="text-sm text-blue-300">I'm monitoring your activity and will provide guidance as you train.</p>
          </div>
        `;
      }
    }
    
    /**
     * PRIVATE: Add message to conversation
     * @private
     */
    _addMessageToConversation(message, sender) {
      if (!this.conversationElement) return;
      
      const messageClass = sender === 'user'
        ? 'text-right'
        : '';
      
      const bubbleClass = sender === 'user'
        ? 'bg-blue-600 ml-auto'
        : 'bg-gray-700';
      
      this.conversationElement.innerHTML += `
        <div class="mb-2 ${messageClass}">
          <div class="inline-block ${bubbleClass} px-3 py-2 rounded-lg max-w-xs">
            ${message}
          </div>
        </div>
      `;
      
      // Scroll to bottom
      this.conversationElement.scrollTop = this.conversationElement.scrollHeight;
    }
    
    /**
     * PRIVATE: Add guidance to history
     * @private
     */
    _addToGuidanceHistory(activity, guidance) {
      this.guidanceHistory.push({
        timestamp: new Date().toISOString(),
        activity,
        guidance
      });
      
      // Keep history limited to most recent 50 items
      if (this.guidanceHistory.length > 50) {
        this.guidanceHistory = this.guidanceHistory.slice(-50);
      }
    }
    
    /**
     * PRIVATE: Load user questions from localStorage
     * @private
     */
    _loadUserQuestions() {
      if (window.localStorage) {
        try {
          const storedQuestions = localStorage.getItem('stella_user_questions');
          if (storedQuestions) {
            this.userQuestions = JSON.parse(storedQuestions);
          }
        } catch (error) {
          console.warn('Error loading user questions:', error);
          this.userQuestions = [];
        }
      }
    }
    
    /**
     * PRIVATE: Dispatch a guidance event
     * @private
     */
    _dispatchGuidanceEvent(guidance) {
      const event = new CustomEvent('stella-guidance', { 
        detail: { guidance }
      });
      document.dispatchEvent(event);
    }
    
    /**
     * PRIVATE: Dispatch a metrics update event
     * @private
     */
    _dispatchMetricsEvent(metrics) {
      const event = new CustomEvent('stella-metrics-update', { 
        detail: { metrics }
      });
      document.dispatchEvent(event);
    }
    
    /**
     * PRIVATE: Track user questions to improve STELLA's responses
     * @param {String} question - User's question
     * @private
     */
    _trackUserQuestion(question) {
      // Store in memory
      this.userQuestions.push({
        question,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 50 questions in memory
      if (this.userQuestions.length > 50) {
        this.userQuestions = this.userQuestions.slice(-50);
      }
      
      // Store in localStorage if available
      if (window.localStorage) {
        try {
          localStorage.setItem('stella_user_questions', JSON.stringify(this.userQuestions));
        } catch (error) {
          console.warn('Error storing user question:', error);
        }
      }
      
      // In a real implementation, would also send to backend for learning
      if (!this.offlineMode && !this.options.mockApi) {
        // Attempt to send to backend but don't await response
        fetch('/api/ai/track-question', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ question })
        }).catch(err => {
          // Silently fail - this is non-critical
          if (this.options.debugMode) {
            console.warn('Failed to send question to learning system:', err);
          }
        });
      }
    }
    /**
     * PRIVATE: Get mock guidance based on activity type
     * @private
     * @param {String} activity - Type of activity
     * @param {Object} metrics - Current metrics data
     * @returns {Object} Guidance object with message and actionItems
     */
    _getMockGuidance(activity, metrics = {}) {
      // First check if the user has specific needs based on their metrics
      if (metrics.heartRate && metrics.heartRate > 160) {
        return {
          message: 'Your heart rate is elevated. Consider taking a short recovery break to bring it down to a more sustainable level.',
          actionItems: [
            'Focus on deep, controlled breathing',
            'Hydrate adequately',
            'Reduce intensity until heart rate stabilizes'
          ],
          priority: 'high'
        };
      }
      
      if (metrics.formQuality && metrics.formQuality < 70) {
        return {
          message: 'I\'ve detected some form inconsistencies. Let\'s focus on technique before increasing intensity.',
          actionItems: [
            'Slow down your movements for better control',
            'Focus on proper alignment in each position',
            'Consider reducing resistance/weight to master form first'
          ],
          priority: 'medium'
        };
      }

      // Activity-specific guidance
      switch (activity) {
        case 'balance':
          return {
            message: 'I\'m monitoring your balance training. Focus on engaging your core muscles and maintaining stability throughout each exercise.',
            actionItems: [
              'Keep your spine neutral during planks',
              'Breathe steadily and deeply',
              'Engage your core throughout all exercises'
            ],
            priority: 'normal'
          };
          
        case 'endurance':
          // Personalize based on user's current endurance metrics
          const enduranceLevel = metrics.endurance || 50;
          const heartRateStatus = metrics.heartRate ? (metrics.heartRate < 140 ? 'below target' : metrics.heartRate > 150 ? 'above target' : 'on target') : 'unknown';
          
          return {
            message: `I'm monitoring your cardiovascular metrics. Your endurance level is ${enduranceLevel}% and heart rate is ${heartRateStatus}. ${heartRateStatus === 'on target' ? 'Maintain this pace for optimal training.' : 'Adjust your intensity to reach your target zone.'}`,
            actionItems: [
              'Maintain a steady breathing pattern',
              'Stay hydrated throughout your session',
              'Monitor your heart rate recovery between intervals'
            ],
            priority: heartRateStatus === 'above target' ? 'medium' : 'normal'
          };
          
        case 'exercise':
          const exerciseId = metrics.exerciseId || '';
          switch (exerciseId) {
            case 'planks':
              return {
                message: 'For plank exercises, focus on maintaining a straight line from head to heels. This position is crucial for EVA operations when you need to maintain position against reaction forces.',
                actionItems: [
                  'Engage your core by pulling your belly button toward your spine',
                  'Keep your neck in a neutral position - imagine your space helmet position',
                  'Distribute your weight evenly as you would in a balanced EVA position'
                ],
                priority: 'normal',
                relatedExercises: ['side-planks', 'dynamic-planks']
              };
              
            case 'stability-ball':
              return {
                message: 'Stability ball exercises mimic the constant adjustments needed in microgravity. Focus on controlled movements and core engagement.',
                actionItems: [
                  'Move slowly and deliberately as you would during in-space operations',
                  'Maintain awareness of your entire body position',
                  'Practice small corrections - essential for station keeping in EVA'
                ],
                priority: 'normal',
                relatedExercises: ['bosu-balance', 'swiss-ball-pikes']
              };
              
            case 'single-leg':
              return {
                message: 'Single-leg exercises train your vestibular system to maintain orientation without normal gravity cues - critical for spacewalks.',
                actionItems: [
                  'Focus on a fixed point like you would on a spacecraft reference point',
                  'Practice smooth transitions between positions',
                  'Maintain awareness of your center of gravity'
                ],
                priority: 'normal',
                relatedExercises: ['single-leg-deadlift', 'pistol-squats']
              };
              
            case 'hollow-hold':
              return {
                message: 'The hollow hold position trains the same core muscles used to maintain body position during launch and reentry. Note how this engages your entire anterior chain.',
                actionItems: [
                  'Press your lower back into the floor throughout the exercise',
                  'Keep your shoulders slightly lifted but relaxed',
                  'Maintain consistent breathing pattern - essential during high-G phases'
                ],
                priority: 'high',
                relatedExercises: ['v-ups', 'tuck-holds']
              };
              
            case 'rotation-training':
              return {
                message: 'Rotational exercises prepare your vestibular system for the disorientation many astronauts experience in microgravity. The space station has no fixed "up" or "down".',
                actionItems: [
                  'Move through each rotation slowly at first, then increase speed',
                  'Keep your eyes open to train visual reorientation',
                  'Practice reestablishing your reference frame after each rotation'
                ],
                priority: 'high',
                relatedExercises: ['vestibular-ball-work', 'orientation-drills']
              };
              
            default:
              return {
                message: 'I\'m monitoring your form and performance. Each exercise in this program is designed to prepare specific physiological systems for spaceflight demands.',
                actionItems: [
                  'Focus on quality over quantity - space operations require precision',
                  'Maintain proper breathing techniques throughout',
                  'Visualize how this movement relates to space operations'
                ],
                priority: 'normal'
              };
          }
          
        case 'session-start':
          // Personalized session start guidance
          const userName = metrics.userName || 'Cadet';
          
          return {
            message: `Welcome to your Core & Balance training session, ${userName}. This session focuses on developing the stability needed in microgravity environments. I'll be monitoring your form and providing real-time guidance.`,
            actionItems: [
              'Begin with the vestibular calibration exercises (30 seconds each)',
              'Focus on form quality rather than repetitions',
              'Remember to hydrate - fluid distribution changes significantly in space'
            ],
            priority: 'normal',
            sessionType: metrics.sessionType || 'core-balance'
          };
          
        case 'session-end':
          // Calculate session effectiveness based on metrics
          const effectivenessScore = this._calculateSessionEffectiveness(metrics);
          const effectivenessRating = effectivenessScore > 85 ? 'excellent' : effectivenessScore > 70 ? 'good' : effectivenessScore > 50 ? 'moderate' : 'needs improvement';
          
          return {
            message: `Great work! You've completed your Core & Balance training with ${effectivenessRating} effectiveness. Your vestibular adaptation metrics show improvement, which will be crucial for your orientation in microgravity.`,
            actionItems: [
              'Complete the vestibular re-calibration exercises',
              'Log your session notes while the experience is fresh',
              'Your next training session is recommended in 48 hours'
            ],
            priority: 'normal',
            sessionStats: {
              duration: metrics.sessionDuration || '00:30:00',
              effectiveness: effectivenessScore,
              vestibularAdaptation: metrics.vestibularAdaptation || 75,
              coreStrength: metrics.coreStrength || 80
            }
          };
          
        case 'progress-milestone':
          // Guidance based on mission progress milestone
          const milestone = metrics.milestone || 1;
          
          const milestoneMessages = [
            'You\'ve completed 25% of your Core & Balance mission. Your dedicated training is building the foundation needed for space operations.',
            'Halfway through your Core & Balance mission! Your vestibular metrics show a 15% improvement since you started.',
            'You\'ve reached 75% completion of your Core & Balance mission. Your progress demonstrates the consistent training essential for astronaut preparation.',
            'Congratulations on completing your Core & Balance mission! This foundational training will support all future space operations training.'
          ];
          
          return {
            message: milestoneMessages[milestone - 1] || 'You\'re making great progress in your training mission.',
            actionItems: [
              'Review your progress metrics in your training log',
              'Consider increasing challenge level for exercises you find easy',
              'Continue consistent practice for optimal adaptation'
            ],
            priority: 'normal',
            milestone: milestone
          };
          
        case 'exercise-completed':
          // Exercise-specific completion feedback
          const exerciseName = metrics.exerciseId || 'this exercise';
          
          return {
            message: `You've completed ${exerciseName}! This exercise specifically develops the ${exerciseName.includes('plank') ? 'core stability' : exerciseName.includes('balance') ? 'vestibular adaptation' : 'neuromuscular control'} needed for ${exerciseName.includes('plank') ? 'maintaining position during EVA operations' : exerciseName.includes('balance') ? 'orientation in variable gravity' : 'precise movement control in space'}.`,
            actionItems: [
              'Take 30 seconds to recover before your next exercise',
              'Note any areas of difficulty for focused training',
              'Hydrate between exercises to maintain optimal performance'
            ],
            priority: 'normal',
            exerciseMetrics: {
              duration: metrics.duration || '00:01:30',
              formQuality: metrics.formQuality || 85,
              difficultyRating: metrics.difficulty || 'moderate'
            }
          };
          
        case 'metrics-update':
          // Response to significant metrics changes
          let metricMessage = 'I\'m monitoring your training metrics. ';
          
          if (metrics.heartRate > 150) {
            metricMessage += 'Your elevated heart rate indicates high exertion. Consider whether this intensity is sustainable for your training phase.';
          } else if (metrics.formQuality < 70) {
            metricMessage += 'I\'ve detected some form inconsistencies. Quality of movement is more important than quantity for space preparation.';
          } else if (metrics.vestibularAdaptation > 80) {
            metricMessage += 'Your vestibular adaptation score is excellent. You\'re developing the neural pathways needed to quickly adapt to changing gravity conditions.';
          } else {
            metricMessage += 'Your metrics are within expected ranges for this training phase. Continue focusing on quality execution.';
          }
          
          return {
            message: metricMessage,
            actionItems: [
              'Focus on maintaining proper form throughout all exercises',
              'Your vestibular adaptation is the primary focus of this mission',
              'Track your subjective experience along with objective metrics'
            ],
            priority: 'normal'
          };
          
        default:
          return {
            message: 'I\'m here to guide your space training. Your Core & Balance foundation will prepare critical physiological systems for the unique challenges of spaceflight.',
            actionItems: [
              'Focus on form quality in all exercises',
              'Pay attention to how your vestibular system responds',
              'Track your progress to see your adaptation over time'
            ],
            priority: 'normal'
          };
      }
    }
    
    /**
     * Calculate session effectiveness score based on metrics
     * @param {Object} metrics - Session metrics
     * @returns {Number} Effectiveness score (0-100)
     * @private
     */
    _calculateSessionEffectiveness(metrics) {
      // Default values if metrics are missing
      const heartRateConsistency = metrics.heartRateConsistency || 75;
      const formQuality = metrics.formQuality || 70;
      const timeInTargetZone = metrics.timeInTargetZone || 65;
      const exerciseCompletion = metrics.exerciseCompletion || 80;
      const focusScore = metrics.focusScore || 75;
      
      // Weighted calculation
      return Math.round(
        (heartRateConsistency * 0.2) +
        (formQuality * 0.25) +
        (timeInTargetZone * 0.25) +
        (exerciseCompletion * 0.15) +
        (focusScore * 0.15)
      );
    }
    
    /**
     * PRIVATE: Get mock response to a question
     * @private
     * @param {String} question - User's question
     * @returns {String} STELLA's response
     */
    _getMockResponse(question) {
      // Convert question to lowercase for easier matching
      const lowerQuestion = question.toLowerCase();
      
      // Check for common questions and provide responses
      if (lowerQuestion.includes('assessment') || lowerQuestion.includes('initial test')) {
        const response = "The Core & Balance assessment evaluates your current vestibular adaptation and core stability baseline. It contains exercises that test your ability to maintain position and balance in conditions that simulate aspects of microgravity. Complete this assessment first so I can customize your training program based on your specific needs.";
        this._addMessageToConversation(response, 'stella');
        return response;
      }
      
      if (lowerQuestion.includes('core') || lowerQuestion.includes('strength')) {
        const response = "Core strength is critical for astronauts. In microgravity, your core muscles no longer work against gravity, leading to weakening. Additionally, a strong core is essential for controlling your position during EVA operations and withstanding the G-forces during launch and reentry. The exercises in this mission specifically target the deep stabilizing muscles needed for space operations.";
        this._addMessageToConversation(response, 'stella');
        return response;
      }
      
      if (lowerQuestion.includes('balance') || lowerQuestion.includes('dizzy') || lowerQuestion.includes('vestibular')) {
        const response = "Balance training is essential because your vestibular system will need to recalibrate in microgravity. Astronauts report that the first days in space often include disorientation and space sickness as the brain learns to interpret sensory input differently. These exercises help train your brain to rely less on gravity-dependent signals and more on visual and proprioceptive cues - exactly what you'll need in space.";
        this._addMessageToConversation(response, 'stella');
        return response;
      }
      
      if (lowerQuestion.includes('progress') || lowerQuestion.includes('improving') || lowerQuestion.includes('better')) {
        const response = "You're making good progress in your Core & Balance training! Your vestibular adaptation metrics have improved by approximately 12% since your initial assessment, and your core stability metrics are showing steady improvement. Continue focusing on the exercises that challenge you most, as these represent your greatest opportunities for improvement.";
        this._addMessageToConversation(response, 'stella');
        return response;
      }
      
      if (lowerQuestion.includes('why') && (lowerQuestion.includes('important') || lowerQuestion.includes('necessary') || lowerQuestion.includes('need'))) {
        const response = "This training is critical because space environments present unique challenges to the human body. Without gravity, your muscles - especially your core - atrophy rapidly. Your balance system becomes confused without the constant reference of Earth's gravity. Research shows astronauts who complete comprehensive physical preparation experience less severe space adaptation syndrome, maintain greater strength during missions, and recover faster upon return to Earth.";
        this._addMessageToConversation(response, 'stella');
        return response;
      }
      
      if (lowerQuestion.includes('next') || lowerQuestion.includes('after') || lowerQuestion.includes('future')) {
        const response = "After completing the Core & Balance Foundation mission, your next recommended training is the Endurance Boost mission. This will build on your foundational stability by developing the cardiovascular endurance needed for EVA operations and emergency procedures. All physical training missions work together to create complete astronaut-level physical preparation.";
        this._addMessageToConversation(response, 'stella');
        return response;
      }
      
      if (lowerQuestion.includes('credits') || lowerQuestion.includes('points') || lowerQuestion.includes('reward')) {
        const response = "Training credits are earned by completing assessments, exercises, and full missions. For this Core & Balance mission, you'll earn 75 credits for completing each exercise session, with bonus credits for excellent form quality. These credits unlock advanced training modules and contribute to your Space Readiness certification level. Credits also reduce your Space Readiness Countdown timer.";
        this._addMessageToConversation(response, 'stella');
        return response;
      }
      
      if (lowerQuestion.includes('countdown') || lowerQuestion.includes('timer') || lowerQuestion.includes('days')) {
        const response = "Your Space Readiness Countdown represents the estimated time until you've completed the essential training for space operations. Completing missions reduces this countdown, with more challenging missions providing greater reductions. The Core & Balance Foundation mission will reduce your countdown by 18 days total, with each session contributing proportionally.";
        this._addMessageToConversation(response, 'stella');
        return response;
      }
      
      if (lowerQuestion.includes('exercises') || lowerQuestion.includes('workout') || lowerQuestion.includes('routine')) {
        const response = "This Core & Balance mission contains three key exercises: Space Plank, Astronaut Hollow Hold, and Microgravity Rotations. Each targets specific physiological systems needed in space. Space Plank develops the core stability needed for EVA operations. Hollow Hold trains your body positioning for launch and reentry. Rotation exercises prepare your vestibular system for microgravity orientation. Complete all exercises for comprehensive preparation.";
        this._addMessageToConversation(response, 'stella');
        return response;
      }
      
      if (lowerQuestion.includes('hard') || lowerQuestion.includes('difficult') || lowerQuestion.includes('challenge')) {
        const response = "It's normal to find some of these exercises challenging. Astronaut training is designed to gradually build capabilities you don't normally need on Earth. The vestibular exercises often feel the most challenging at first because we rarely train this system specifically. If you're finding an exercise too difficult, focus on shorter durations with perfect form rather than longer durations with compromised technique.";
        this._addMessageToConversation(response, 'stella');
        return response;
      }
      
      if (lowerQuestion.includes('how long') || lowerQuestion.includes('duration') || lowerQuestion.includes('time')) {
        const response = "The Core & Balance mission consists of three training sessions, each taking approximately 20-30 minutes to complete. Ideally, these sessions should be separated by 24-48 hours to allow for adaptation. Most trainees complete the full mission within 2-3 weeks, though your specific pace may vary based on your schedule and adaptation rate.";
        this._addMessageToConversation(response, 'stella');
        return response;
      }
      
      if (lowerQuestion.includes('help') || lowerQuestion.includes('guide') || lowerQuestion.includes('how do i')) {
        const response = "I'm here to guide your training! To get started, complete the initial assessment by clicking the 'Take Assessment' button. After that, you'll be able to access the first training session. Follow the on-screen instructions and timer for each exercise. I'll provide real-time guidance on your form and technique. You can ask me specific questions about any exercise at any time during your training.";
        this._addMessageToConversation(response, 'stella');
        return response;
      }
      
      if (lowerQuestion.includes('space') || lowerQuestion.includes('astronaut') || lowerQuestion.includes('zero g') || lowerQuestion.includes('microgravity')) {
        const response = "Space environments create unique challenges for the human body. In microgravity, your muscles don't work against gravity and can atrophy quickly. Your vestibular system loses its primary reference point, causing disorientation. Fluids shift upward in your body, affecting circulation. This training program specifically addresses these challenges, preparing your physiology for the demanding environment of space through targeted exercises developed from actual astronaut training protocols.";
        this._addMessageToConversation(response, 'stella');
        return response;
      }
  
      // Default response for other questions
      const defaultResponse = "I'm your STELLA AI assistant for space training. I'm here to guide you through exercises specifically designed to prepare your body for space environments. The Core & Balance mission you're working on is foundational for all space activities, developing the stability and vestibular adaptation needed for microgravity operations. Is there something specific about your training you'd like to know more about?";
      this._addMessageToConversation(defaultResponse, 'stella');
      return defaultResponse;
    }
  };
}