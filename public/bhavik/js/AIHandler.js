/**
 * Enhanced AIHandler.js
 * Frontend interface to STELLA AI space training system
 * Integrated with dynamic mission loading for a SPA approach
 */
class AIHandler {
  constructor(config = {}) {
    // Configuration
    this.config = {
      apiBaseUrl: '/api',
      wsUrl: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`,
      enableCaching: true,
      cacheDuration: 5 * 60 * 1000, // 5 minutes
      ...config
    };
    
    // State
    this.userId = config.userId || this.getUserIdFromSession();
    this.sessionId = this.generateSessionId();
    this.moduleId = config.moduleId;
    this.moduleType = config.moduleType || this.getModuleTypeFromId(this.moduleId);
    this.isInitialized = false;
    this.lastGuidance = null;
    
    // Mission-specific state
    this.currentMission = null;
    this.missionData = null;
    this.missionSpecificHandlers = {
      'core-balance-foundation': this.handleCoreBalanceAI.bind(this),
      'endurance-boost': this.handleEnduranceAI.bind(this),
      'strength-training': this.handleStrengthAI.bind(this),
      'zero-g-adaptation': this.handleZeroGAI.bind(this),
      'eva-preparation': this.handleEVAAI.bind(this)
    };
    
    // Metrics and tracking
    this.metrics = {};
    this.exerciseTracking = {
      active: false,
      startTime: null,
      exerciseId: null,
      exerciseType: null
    };
    
    // WebSocket connection
    this.socket = null;
    this.socketReconnectAttempts = 0;
    this.socketReconnectMax = 5;
    
    // Cache
    this.cache = {
      guidance: new Map(),
      progress: new Map(),
      modules: new Map(),
      missions: new Map(),
      assessments: new Map()
    };
    
    // Module state
    this.currentModuleData = null;
    this.moduleProgress = 0;
    this.moduleComponents = [];
    
    // STELLA Core integration
    this.stellaCore = window.stellaCore || {};
    
    // Event callbacks
    this.callbacks = {
      onGuidance: null,
      onProgress: null,
      onAchievement: null,
      onError: null,
      onModuleLoaded: null,
      onMissionLoaded: null,
      onMetricsUpdated: null,
      onSTELLAIntervention: null
    };
    
    // Initialize
    this.initialize();
    
    console.log('✅ Enhanced AIHandler initialized');
  }
  
  /**
   * Initialize the handler
   */
  initialize() {
    // Set up WebSocket connection
    this.setupWebSocket();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Load initial module data if module ID is provided
    if (this.moduleId) {
      this.loadModuleData(this.moduleId);
    }
    
    // Set up global AI interaction
    this.setupGlobalAIInteraction();
    
    // Track session start
    this.trackSessionStart()
      .then(() => {
        this.isInitialized = true;
        console.log('✅ Session tracking initialized');
      })
      .catch(error => {
        console.error('Error initializing session tracking:', error);
      });
      
    return this;
  }
  
  /**
   * Set up WebSocket connection
   */
  setupWebSocket() {
    try {
      this.socket = new WebSocket(this.config.wsUrl);
      
      this.socket.onopen = () => {
        console.log('WebSocket connection established');
        this.socketReconnectAttempts = 0;
        
        // Authenticate socket connection
        if (this.userId) {
          this.socket.send(JSON.stringify({
            type: 'auth',
            userId: this.userId,
            sessionId: this.sessionId,
            moduleId: this.moduleId,
            missionId: this.currentMission
          }));
        }
      };
      
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleSocketMessage(data);
        } catch (error) {
          console.error('Error parsing socket message:', error);
        }
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      this.socket.onclose = () => {
        console.log('WebSocket connection closed');
        
        // Attempt to reconnect if under max attempts
        if (this.socketReconnectAttempts < this.socketReconnectMax) {
          this.socketReconnectAttempts++;
          setTimeout(() => {
            console.log(`Attempting to reconnect (${this.socketReconnectAttempts}/${this.socketReconnectMax})...`);
            this.setupWebSocket();
          }, 3000 * this.socketReconnectAttempts); // Increasing backoff
        }
      };
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
    }
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Listen for page visibility changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.trackSessionResume();
        } else {
          this.trackSessionPause();
        }
      });
    }
    
    // Listen for module changes
    window.addEventListener('module-loaded', (event) => {
      if (event.detail && event.detail.moduleId) {
        const newModuleId = event.detail.moduleId;
        this.moduleId = newModuleId;
        this.moduleType = this.getModuleTypeFromId(newModuleId);
        this.loadModuleData(newModuleId);
      }
    });
    
    // Listen for mission changes
    document.addEventListener('missionChanged', (event) => {
      if (event.detail && event.detail.missionId) {
        this.switchMission(event.detail.missionId, event.detail.missionData);
      }
    });
    
    // Listen for mission selection
    document.addEventListener('missionSelected', (event) => {
      if (event.detail && event.detail.missionId) {
        this.loadMission(event.detail.missionId);
      }
    });
    
    // Listen for STELLA-specific events
    window.addEventListener('stella-guidance-requested', (event) => {
      const context = event.detail || {};
      this.getModuleGuidance(context);
    });
    
    // Listen for assessment completion
    window.addEventListener('assessment-completed', (event) => {
      if (event.detail) {
        this.trackAssessmentCompletion(event.detail);
      }
    });
    
    // Listen for exercise events
    document.addEventListener('exerciseStarted', (event) => {
      if (event.detail && event.detail.exerciseId) {
        this.beginExerciseMonitoring(
          event.detail.exerciseId, 
          event.detail.exerciseType || this.currentMission
        );
      }
    });
    
    document.addEventListener('exerciseCompleted', (event) => {
      if (event.detail) {
        this.trackExerciseCompletion(event.detail);
      }
    });
    
    // Listen for zone selection
    document.addEventListener('zoneSelected', (event) => {
      if (event.detail && event.detail.zoneId) {
        this.beginZoneMonitoring(event.detail.zoneId, event.detail.targetHR);
      }
    });
    
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      this.trackSessionEnd();
    });
  }
  
  /**
   * Set up global AI interaction interface
   */
  setupGlobalAIInteraction() {
    // Set up chat interface
    const chatInput = document.getElementById('stella-input');
    const sendButton = document.getElementById('stella-send');
    
    if (chatInput && sendButton) {
      sendButton.addEventListener('click', () => {
        const message = chatInput.value.trim();
        if (!message) return;
        
        this.sendUserMessage(message);
        chatInput.value = '';
      });
      
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          sendButton.click();
        }
      });
    }
    
    // Set up AI help buttons
    const aiHelpButtons = document.querySelectorAll('.ai-help-button, #ai-help-button');
    
    aiHelpButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Show AI assistant modal if it exists
        const modal = document.getElementById('stella-modal') || document.getElementById('ai-assistant-modal');
        if (modal) {
          modal.classList.remove('hidden');
        }
      });
    });
    
    // Set up modal close buttons
    const closeButtons = document.querySelectorAll('.close-modal, .modal-close');
    
    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Find closest modal
        const modal = button.closest('.modal');
        if (modal) {
          modal.classList.add('hidden');
        }
      });
    });
  }
  
  /**
   * Switch to a new mission
   * @param {string} missionId - Mission ID
   * @param {Object} missionData - Mission data
   */
  switchMission(missionId, missionData) {
    this.currentMission = missionId;
    this.missionData = missionData || {};
    
    // Reset metrics
    this.metrics = {};
    
    // Initialize mission-specific AI
    if (this.missionSpecificHandlers[missionId]) {
      this.missionSpecificHandlers[missionId].call(this, missionData);
    } else {
      // Default AI handling
      this.handleGenericMissionAI(missionData);
    }
    
    // Tell STELLA about the mission change
    if (this.stellaCore.missionChanged) {
      this.stellaCore.missionChanged({
        missionId,
        missionType: missionData?.type || 'generic',
        metrics: missionData?.metrics || []
      });
    }
    
    // Track mission change
    this.trackMissionChange(missionId);
    
    // Notify mission loaded callback
    if (this.callbacks.onMissionLoaded) {
      this.callbacks.onMissionLoaded(missionId, missionData);
    }
    
    // Get mission-specific guidance
    this.getMissionGuidance(missionId);
  }
  
  /**
   * Load mission data
   * @param {string} missionId - Mission ID to load
   */
  async loadMission(missionId) {
    if (!missionId) return;
    
    try {
      // Check cache first
      const cachedMission = this.cache.missions.get(missionId);
      if (cachedMission) {
        this.switchMission(missionId, cachedMission);
        return cachedMission;
      }
      
      // Fetch from API
      const response = await this.apiGet(`/training/missions/${missionId}`);
      
      if (response && response.success && response.mission) {
        const missionData = response.mission;
        
        // Cache mission data
        this.cache.missions.set(missionId, missionData);
        
        // Switch to this mission
        this.switchMission(missionId, missionData);
        
        return missionData;
      } else {
        console.error(`Error loading mission data: ${response?.message || 'Unknown error'}`);
        return null;
      }
    } catch (error) {
      console.error(`Error loading mission data for ${missionId}:`, error);
      
      // Call error callback
      if (this.callbacks.onError) {
        this.callbacks.onError('mission', error);
      }
      
      return null;
    }
  }
  
  /**
   * Mission-specific AI handlers
   */
  handleCoreBalanceAI(missionData) {
    // Set up core & balance specific monitoring
    this.setupCoreMetricsMonitoring();
    
    // Add event listeners for exercise interactions
    document.querySelectorAll('.exercise-card').forEach(card => {
      card.addEventListener('click', () => {
        const exerciseId = card.dataset.exerciseId;
        if (exerciseId) {
          // Dispatch exercise started event
          const event = new CustomEvent('exerciseStarted', {
            detail: {
              exerciseId,
              exerciseType: 'core-balance'
            }
          });
          document.dispatchEvent(event);
        }
      });
    });
  }
  
  handleEnduranceAI(missionData) {
    // Set up endurance specific monitoring
    this.setupCardioMetricsMonitoring();
    
    // Add event listeners for zone changes
    document.querySelectorAll('.zone-card').forEach(card => {
      card.addEventListener('click', () => {
        const zoneId = card.dataset.zoneId;
        const targetHR = card.dataset.targetHr;
        if (zoneId) {
          // Dispatch zone selected event
          const event = new CustomEvent('zoneSelected', {
            detail: {
              zoneId,
              targetHR
            }
          });
          document.dispatchEvent(event);
        }
      });
    });
  }
  
  handleStrengthAI(missionData) {
    // Set up strength training specific monitoring
    this.setupStrengthMetricsMonitoring();
    
    // Add event listeners for exercise interactions
    document.querySelectorAll('.strength-exercise').forEach(exercise => {
      exercise.addEventListener('click', () => {
        const exerciseId = exercise.dataset.exerciseId;
        if (exerciseId) {
          // Dispatch exercise started event
          const event = new CustomEvent('exerciseStarted', {
            detail: {
              exerciseId,
              exerciseType: 'strength'
            }
          });
          document.dispatchEvent(event);
        }
      });
    });
  }
  
  handleZeroGAI(missionData) {
    // Set up zero-G adaptation specific monitoring
    this.setupVestibularMetricsMonitoring();
    
    // Add specific event listeners for this mission type
    // ...
  }
  
  handleEVAAI(missionData) {
    // Set up EVA specific monitoring
    this.setupEVAMetricsMonitoring();
    
    // Add specific event listeners for this mission type
    // ...
  }
  
  handleGenericMissionAI(missionData) {
    // Default implementation for missions without specific handlers
    console.log('Using generic AI handling for mission:', this.currentMission);
    
    // Add generic event listeners
    document.querySelectorAll('[data-exercise-id]').forEach(element => {
      element.addEventListener('click', () => {
        const exerciseId = element.dataset.exerciseId;
        if (exerciseId) {
          // Dispatch exercise started event
          const event = new CustomEvent('exerciseStarted', {
            detail: {
              exerciseId,
              exerciseType: 'generic'
            }
          });
          document.dispatchEvent(event);
        }
      });
    });
  }
  
  /**
   * Monitoring setup methods
   */
  setupCoreMetricsMonitoring() {
    console.log('Setting up core metrics monitoring');
    // Set up specific metrics tracking for core & balance
    this.metrics = {
      ...this.metrics,
      coreStability: 0,
      balance: 0,
      formQuality: 0
    };
    
    // Example: Update metrics periodically
    this.metricsInterval = setInterval(() => {
      if (this.exerciseTracking.active) {
        // Simulate metrics changes
        this.metrics.coreStability = Math.min(100, this.metrics.coreStability + Math.random() * 5 - 1);
        this.metrics.balance = Math.min(100, this.metrics.balance + Math.random() * 5 - 1);
        this.metrics.formQuality = Math.min(100, this.metrics.formQuality + Math.random() * 5 - 1);
        
        this.updateMetrics(this.metrics);
      }
    }, 3000);
  }
  
  setupCardioMetricsMonitoring() {
    console.log('Setting up cardio metrics monitoring');
    // Set up specific metrics tracking for endurance
    this.metrics = {
      ...this.metrics,
      heartRate: 70,
      o2Saturation: 98,
      timeInZone: 0
    };
    
    // Example: Update metrics periodically
    this.metricsInterval = setInterval(() => {
      if (this.exerciseTracking.active) {
        // Simulate metrics changes
        this.metrics.heartRate = Math.min(180, Math.max(60, this.metrics.heartRate + Math.random() * 10 - 3));
        this.metrics.o2Saturation = Math.min(100, Math.max(94, this.metrics.o2Saturation + Math.random() * 2 - 1));
        
        if (this.metrics.targetHeartRate) {
          const inZone = this.metrics.heartRate >= this.metrics.targetHeartRate[0] && 
                          this.metrics.heartRate <= this.metrics.targetHeartRate[1];
          
          if (inZone) {
            this.metrics.timeInZone += 3; // 3 seconds
          }
        }
        
        this.updateMetrics(this.metrics);
      }
    }, 3000);
  }
  
  setupStrengthMetricsMonitoring() {
    console.log('Setting up strength metrics monitoring');
    // Set up specific metrics tracking for strength
    this.metrics = {
      ...this.metrics,
      power: 0,
      endurance: 0,
      formQuality: 0,
      repetitions: 0
    };
    
    // Implementation for strength metrics monitoring
    // ...
  }
  
  setupVestibularMetricsMonitoring() {
    console.log('Setting up vestibular metrics monitoring');
    // Set up specific metrics tracking for zero-G adaptation
    this.metrics = {
      ...this.metrics,
      vestibularStability: 0,
      spatialOrientation: 0,
      adaptationRate: 0
    };
    
    // Implementation for vestibular metrics monitoring
    // ...
  }
  
  setupEVAMetricsMonitoring() {
    console.log('Setting up EVA metrics monitoring');
    // Set up specific metrics tracking for EVA
    this.metrics = {
      ...this.metrics,
      suitIntegrity: 100,
      oxygenLevel: 100,
      mobilityScore: 0,
      taskCompletion: 0
    };
    
    // Implementation for EVA metrics monitoring
    // ...
  }
  
  /**
   * Begin exercise monitoring
   * @param {string} exerciseId - Exercise ID
   * @param {string} exerciseType - Exercise type
   */
  beginExerciseMonitoring(exerciseId, exerciseType) {
    console.log(`Starting exercise monitoring: ${exerciseId} (${exerciseType})`);
    
    // Clear any existing interval
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    // Set up exercise tracking
    this.exerciseTracking = {
      active: true,
      startTime: new Date(),
      exerciseId,
      exerciseType
    };
    
    // Get exercise-specific guidance
    this.getExerciseGuidance(exerciseId, exerciseType);
    
    // Set up appropriate metrics monitoring based on exercise type
    switch (exerciseType) {
      case 'core-balance':
        this.setupCoreMetricsMonitoring();
        break;
      case 'endurance':
        this.setupCardioMetricsMonitoring();
        break;
      case 'strength':
        this.setupStrengthMetricsMonitoring();
        break;
      default:
        // Generic exercise monitoring
        this.metrics = {
          ...this.metrics,
          formQuality: 0,
          intensity: 0,
          completion: 0
        };
        
        // Update metrics periodically
        this.metricsInterval = setInterval(() => {
          if (this.exerciseTracking.active) {
            // Simulate metrics changes
            this.metrics.formQuality = Math.min(100, this.metrics.formQuality + Math.random() * 5 - 1);
            this.metrics.intensity = Math.min(100, this.metrics.intensity + Math.random() * 5 - 1);
            this.metrics.completion = Math.min(100, this.metrics.completion + 5);
            
            this.updateMetrics(this.metrics);
            
            // Auto-complete exercise when reaches 100%
            if (this.metrics.completion >= 100) {
              this.completeExercise(exerciseId, this.metrics);
            }
          }
        }, 3000);
    }
  }
  
  /**
   * Begin zone monitoring
   * @param {string} zoneId - Training zone ID
   * @param {string|Array} targetHR - Target heart rate (can be string like "130-150" or array [130, 150])
   */
  beginZoneMonitoring(zoneId, targetHR) {
    console.log(`Starting zone monitoring: ${zoneId}`);
    
    // Parse target heart rate
    let targetHeartRateRange;
    if (typeof targetHR === 'string') {
      targetHeartRateRange = targetHR.split('-').map(Number);
    } else if (Array.isArray(targetHR)) {
      targetHeartRateRange = targetHR;
    } else {
      // Default ranges based on zone
      switch (zoneId) {
        case 'recovery':
          targetHeartRateRange = [90, 110];
          break;
        case 'endurance':
          targetHeartRateRange = [110, 140];
          break;
        case 'threshold':
          targetHeartRateRange = [140, 160];
          break;
        case 'hiit':
          targetHeartRateRange = [160, 180];
          break;
        default:
          targetHeartRateRange = [120, 150];
      }
    }
    
    // Update metrics with zone information
    this.metrics = {
      ...this.metrics,
      zone: zoneId,
      targetHeartRate: targetHeartRateRange,
      timeInZone: 0
    };
    
    // Get zone-specific guidance
    this.getZoneGuidance(zoneId);
    
    // Setup appropriate monitoring
    this.setupCardioMetricsMonitoring();
  }
  
  /**
   * Complete current exercise
   * @param {string} exerciseId - Exercise ID
   * @param {Object} metrics - Exercise metrics
   */
  completeExercise(exerciseId, metrics) {
    // Only if there's an active exercise
    if (!this.exerciseTracking.active) return;
    
    // Calculate duration
    const duration = Math.floor((new Date() - this.exerciseTracking.startTime) / 1000);
    
    // Prepare completion data
    const completionData = {
      exerciseId: exerciseId || this.exerciseTracking.exerciseId,
      exerciseType: this.exerciseTracking.exerciseType,
      duration,
      metrics
    };
    
    // Reset exercise tracking
    this.exerciseTracking = {
      active: false,
      startTime: null,
      exerciseId: null,
      exerciseType: null
    };
    
    // Clear metrics interval
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    
    // Track completion
    this.trackExerciseCompletion(completionData);
    
    // Dispatch exercise completed event
    const event = new CustomEvent('exerciseCompleted', {
      detail: completionData
    });
    document.dispatchEvent(event);
  }
  
  /**
   * Update metrics
   * @param {Object} newMetrics - New metrics
   */
  async updateMetrics(newMetrics) {
    // Merge with existing metrics
    this.metrics = { ...this.metrics, ...newMetrics };
    
    // Call metrics updated callback
    if (this.callbacks.onMetricsUpdated) {
      this.callbacks.onMetricsUpdated(this.metrics);
    }
    
    // Send to backend
    if (!this.currentMission && !this.moduleId) return;
    
    try {
      const response = await this.apiPost('/training/metrics', {
        userId: this.userId,
        sessionId: this.sessionId,
        moduleId: this.moduleId,
        missionId: this.currentMission,
        metrics: this.metrics,
        timestamp: new Date().toISOString()
      });
      
      if (response && response.feedback) {
        this.updateSTELLAFeedback(response.feedback);
      }
    } catch (error) {
      console.error('Error sending metrics to AI:', error);
    }
  }
  
  /**
   * Update STELLA feedback in UI
   * @param {Object} feedback - STELLA feedback
   */
  updateSTELLAFeedback(feedback) {
    // Display STELLA's feedback in the UI
    const feedbackContainer = document.getElementById('stella-feedback');
    if (!feedbackContainer) return;
    
    feedbackContainer.innerHTML = `
      <div class="stella-message">${feedback.message}</div>
      ${feedback.actionItems && feedback.actionItems.length ? `
        <ul class="stella-action-items mt-2 space-y-1">
          ${feedback.actionItems.map(item => `<li>${item}</li>`).join('')}
        </ul>
      ` : ''}
    `;
    
    // Highlight the feedback container to draw attention
    feedbackContainer.classList.add('highlight-feedback');
    setTimeout(() => {
      feedbackContainer.classList.remove('highlight-feedback');
    }, 1000);
  }
  
  /**
   * Send user message to STELLA
   * @param {string} message - User message
   */
  async sendUserMessage(message) {
    // Add user message to chat
    this.addMessageToChat(message, 'user');
    
    try {
      // If STELLA Core is available directly
      if (this.stellaCore && this.stellaCore.askQuestion) {
        const response = await this.stellaCore.askQuestion(message, {
          moduleId: this.moduleId,
          missionId: this.currentMission,
          metrics: this.metrics
        });
        
        this.addMessageToChat(response, 'stella');
        return;
      }
      
      // Otherwise use API
      const response = await this.apiPost('/ai/ask', {
        userId: this.userId,
        sessionId: this.sessionId,
        question: message,
        context: {
          moduleId: this.moduleId,
          missionId: this.currentMission,
          moduleType: this.moduleType,
          metrics: this.metrics,
          progress: this.moduleProgress
        }
      });
      
      if (response && response.answer) {
        // Add STELLA's response to chat
        this.addMessageToChat(response.answer, 'stella');
      } else {
        throw new Error('Invalid response from AI');
      }
    } catch (error) {
      console.error('Error communicating with STELLA:', error);
      this.addMessageToChat('Sorry, I\'m having trouble connecting right now. Please try again in a moment.', 'stella');
    }
  }
  
  /**
   * Add message to chat interface
   * @param {string} message - Message content
   * @param {string} sender - Message sender ('user' or 'stella')
   */
  addMessageToChat(message, sender) {
    // Check for different chat container IDs
    const chatContainers = [
      document.getElementById('stella-interface'),
      document.getElementById('stella-chat'),
      document.getElementById('ai-chat-container')
    ];
    
    const chatContainer = chatContainers.find(container => container);
    
    if (!chatContainer) return;
    
    const messageEl = document.createElement('div');
    messageEl.className = `message ${sender}-message`;
    messageEl.innerHTML = `
      <div class="message-sender">${sender === 'user' ? 'You' : 'STELLA'}</div>
      <div class="message-content">${message}</div>
    `;
    
    chatContainer.appendChild(messageEl);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
  
  /**
   * Get module type from module ID
   * @param {string} moduleId - Module ID
   * @returns {string} Module type
   */
  getModuleTypeFromId(moduleId) {
    if (!moduleId) return null;
    
    if (moduleId.includes('phys')) return 'physical';
    if (moduleId.includes('tech')) return 'technical';
    if (moduleId.includes('sim')) return 'simulation';
    if (moduleId.includes('eva')) return 'eva';
    
    // Default to first segment of ID
    const parts = moduleId.split('-');
    return parts[0];
  }
  
  /**
   * Load module data
   * @param {string} moduleId - Module ID to load
   */
  async loadModuleData(moduleId) {
    if (!moduleId) return;
    
    try {
      // Check cache first
      const cachedModule = this.cache.modules.get(moduleId);
      if (cachedModule) {
        this.currentModuleData = cachedModule;
        this.moduleType = this.getModuleTypeFromId(moduleId);
        this.notifyModuleLoaded(cachedModule);
        return cachedModule;
      }
      
      // Fetch from API
      const module = await this.apiGet(`/modules/${moduleId}`);
      
      // Cache module data
      this.cache.modules.set(moduleId, module);
      
      // Update current module data
      this.currentModuleData = module;
      this.moduleType = module.type || this.getModuleTypeFromId(moduleId);
      
      // Get module guidance
      this.getModuleGuidance();
      
      // Get module progress
      this.getModuleProgress();
      
      // Notify callbacks
      this.notifyModuleLoaded(module);
      
      return module;
    } catch (error) {
      console.error(`Error loading module data for ${moduleId}:`, error);
      
      // Call error callback
      if (this.callbacks.onError) {
        this.callbacks.onError('module', error);
      }
      
      return null;
    }
  }
  
  /**
   * Notify module loaded callback
   * @param {Object} moduleData - Module data
   */
  notifyModuleLoaded(moduleData) {
    if (this.callbacks.onModuleLoaded) {
      this.callbacks.onModuleLoaded(moduleData);
    }
  }
  
  /**
   * Track session start
   */
  async trackSessionStart() {
    try {
      const response = await this.apiPost('/ai/session/start', {
        userId: this.userId,
        sessionId: this.sessionId,
        moduleId: this.moduleId,
        moduleType: this.moduleType,
        missionId: this.currentMission,
        timestamp: new Date().toISOString()
      });
      
      return response;
    } catch (error) {
      console.error('Error tracking session start:', error);
    }
  }
  
  /**
   * Track session pause
   */
  async trackSessionPause() {
    try {
      await this.apiPost('/ai/session/pause', {
        userId: this.userId,
        sessionId: this.sessionId,
        moduleId: this.moduleId,
        missionId: this.currentMission,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error tracking session pause:', error);
    }
  }
  
  /**
   * Track session resume
   */
  async trackSessionResume() {
    try {
      await this.apiPost('/ai/session/resume', {
        userId: this.userId,
        sessionId: this.sessionId,
        moduleId: this.moduleId,
        missionId: this.currentMission,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error tracking session resume:', error);
    }
  }
  
  /**
   * Track session end
   */
  async trackSessionEnd() {
    try {
      await this.apiPost('/ai/session/end', {
        userId: this.userId,
        sessionId: this.sessionId,
        moduleId: this.moduleId,
        missionId: this.currentMission,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error tracking session end:', error);
    }
  }
  
  /**
   * Track mission change
   * @param {string} missionId - Mission ID
   */
  async trackMissionChange(missionId) {
    try {
      await this.apiPost('/ai/mission/change', {
        userId: this.userId,
        sessionId: this.sessionId,
        moduleId: this.moduleId,
        previousMission: this.currentMission,
        newMission: missionId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error tracking mission change:', error);
    }
  }
  
  /**
   * Get module guidance
   * @param {Object} context - Additional context
   * @returns {Promise<Object>} Guidance data
   */
  async getModuleGuidance(context = {}) {
    if (!this.moduleId) {
      console.warn('No module ID set, cannot get guidance');
      return null;
    }
    
    try {
      // Check cache first
      const cacheKey = `module_${this.moduleId}_${JSON.stringify(context)}`;
      const cachedGuidance = this.getCachedItem('guidance', cacheKey);
      
      if (cachedGuidance) {
        if (this.callbacks.onGuidance) {
          this.callbacks.onGuidance(cachedGuidance);
        }
        return cachedGuidance;
      }
      
      // Fetch from API
      const response = await this.apiPost('/ai/guidance', {
        userId: this.userId,
        moduleId: this.moduleId,
        moduleType: this.moduleType,
        missionId: this.currentMission,
        context: {
          ...context,
          type: 'module',
          moduleId: this.moduleId,
          moduleType: this.moduleType,
          missionId: this.currentMission
        }
      });
      
      if (response && response.guidance) {
        // Cache the guidance
        this.setCachedItem('guidance', cacheKey, response.guidance);
        
        // Update last guidance
        this.lastGuidance = response.guidance;
        
        // Call callback
        if (this.callbacks.onGuidance) {
          this.callbacks.onGuidance(response.guidance);
        }
        
        // Update UI with guidance
        this.updateSTELLAFeedback(response.guidance);
        
        return response.guidance;
      }
    } catch (error) {
      console.error('Error getting module guidance:', error);
      
      // Call error callback
      if (this.callbacks.onError) {
        this.callbacks.onError('guidance', error);
      }
      
      // Return last guidance or default
      return this.lastGuidance || this.getDefaultGuidance();
    }
  }
  
  /**
   * Get mission-specific guidance
   * @param {string} missionId - Mission ID
   * @param {Object} context - Additional context
   * @returns {Promise<Object>} Guidance data
   */
  async getMissionGuidance(missionId = null, context = {}) {
    const targetMissionId = missionId || this.currentMission;
    
    if (!targetMissionId) {
      console.warn('No mission ID set, cannot get guidance');
      return null;
    }
    
    try {
      // Check cache first
      const cacheKey = `mission_${targetMissionId}_${JSON.stringify(context)}`;
      const cachedGuidance = this.getCachedItem('guidance', cacheKey);
      
      if (cachedGuidance) {
        if (this.callbacks.onGuidance) {
          this.callbacks.onGuidance(cachedGuidance);
        }
        this.updateSTELLAFeedback(cachedGuidance);
        return cachedGuidance;
      }
      
      // Fetch from API
      const response = await this.apiPost('/ai/guidance', {
        userId: this.userId,
        moduleId: this.moduleId,
        missionId: targetMissionId,
        context: {
          ...context,
          type: 'mission',
          missionId: targetMissionId,
          moduleId: this.moduleId,
          moduleType: this.moduleType
        }
      });
      
      if (response && response.guidance) {
        // Cache the guidance
        this.setCachedItem('guidance', cacheKey, response.guidance);
        
        // Update last guidance
        this.lastGuidance = response.guidance;
        
        // Call callback
        if (this.callbacks.onGuidance) {
          this.callbacks.onGuidance(response.guidance);
        }
        
        // Update UI with guidance
        this.updateSTELLAFeedback(response.guidance);
        
        return response.guidance;
      }
    } catch (error) {
      console.error('Error getting mission guidance:', error);
      
      // Call error callback
      if (this.callbacks.onError) {
        this.callbacks.onError('guidance', error);
      }
      
      // Return last guidance or default
      return this.lastGuidance || this.getDefaultGuidance();
    }
  }
  
  /**
   * Get exercise-specific guidance
   * @param {string} exerciseId - Exercise ID
   * @param {string} exerciseType - Exercise type
   * @returns {Promise<Object>} Guidance data
   */
  async getExerciseGuidance(exerciseId, exerciseType) {
    try {
      // Check cache first
      const cacheKey = `exercise_${exerciseId}_${exerciseType}`;
      const cachedGuidance = this.getCachedItem('guidance', cacheKey);
      
      if (cachedGuidance) {
        if (this.callbacks.onGuidance) {
          this.callbacks.onGuidance(cachedGuidance);
        }
        this.updateSTELLAFeedback(cachedGuidance);
        return cachedGuidance;
      }
      
      // Fetch from API
      const response = await this.apiPost('/ai/guidance', {
        userId: this.userId,
        moduleId: this.moduleId,
        missionId: this.currentMission,
        context: {
          type: 'exercise',
          exerciseId,
          exerciseType,
          missionId: this.currentMission,
          moduleId: this.moduleId
        }
      });
      
      if (response && response.guidance) {
        // Cache the guidance
        this.setCachedItem('guidance', cacheKey, response.guidance);
        
        // Update last guidance
        this.lastGuidance = response.guidance;
        
        // Call callback
        if (this.callbacks.onGuidance) {
          this.callbacks.onGuidance(response.guidance);
        }
        
        // Update UI with guidance
        this.updateSTELLAFeedback(response.guidance);
        
        return response.guidance;
      }
    } catch (error) {
      console.error('Error getting exercise guidance:', error);
      
      // Call error callback
      if (this.callbacks.onError) {
        this.callbacks.onError('guidance', error);
      }
      
      // Return default exercise guidance based on type
      return this.getDefaultExerciseGuidance(exerciseType);
    }
  }
  
  /**
   * Get zone-specific guidance
   * @param {string} zoneId - Zone ID
   * @returns {Promise<Object>} Guidance data
   */
  async getZoneGuidance(zoneId) {
    try {
      // Check cache first
      const cacheKey = `zone_${zoneId}`;
      const cachedGuidance = this.getCachedItem('guidance', cacheKey);
      
      if (cachedGuidance) {
        if (this.callbacks.onGuidance) {
          this.callbacks.onGuidance(cachedGuidance);
        }
        this.updateSTELLAFeedback(cachedGuidance);
        return cachedGuidance;
      }
      
      // Fetch from API
      const response = await this.apiPost('/ai/guidance', {
        userId: this.userId,
        moduleId: this.moduleId,
        missionId: this.currentMission,
        context: {
          type: 'zone',
          zoneId,
          missionId: this.currentMission,
          moduleId: this.moduleId
        }
      });
      
      if (response && response.guidance) {
        // Cache the guidance
        this.setCachedItem('guidance', cacheKey, response.guidance);
        
        // Update last guidance
        this.lastGuidance = response.guidance;
        
        // Call callback
        if (this.callbacks.onGuidance) {
          this.callbacks.onGuidance(response.guidance);
        }
        
        // Update UI with guidance
        this.updateSTELLAFeedback(response.guidance);
        
        return response.guidance;
      }
    } catch (error) {
      console.error('Error getting zone guidance:', error);
      
      // Call error callback
      if (this.callbacks.onError) {
        this.callbacks.onError('guidance', error);
      }
      
      // Return default zone guidance
      return this.getDefaultZoneGuidance(zoneId);
    }
  }
  
  /**
   * Get module progress
   * @returns {Promise<Object>} Progress data
   */
  async getModuleProgress() {
    if (!this.moduleId || !this.userId) return null;
    
    try {
      const progress = await this.apiGet(`/progress/${this.userId}/${this.moduleId}`);
      
      if (progress) {
        this.moduleProgress = progress.percentage || 0;
        
        // Call progress callback
        if (this.callbacks.onProgress) {
          this.callbacks.onProgress(progress);
        }
      }
      
      return progress;
    } catch (error) {
      console.error('Error getting module progress:', error);
      return null;
    }
  }
  
  /**
   * Track assessment completion
   * @param {Object} assessmentData - Assessment data
   */
  async trackAssessmentCompletion(assessmentData) {
    try {
      const result = await this.apiPost('/progress/assessment', {
        userId: this.userId,
        sessionId: this.sessionId,
        moduleId: this.moduleId,
        missionId: this.currentMission,
        ...assessmentData,
        timestamp: new Date().toISOString()
      });
      
      // Check for achievements
      if (result.achievements && result.achievements.length > 0) {
        result.achievements.forEach(achievement => {
          this.handleAchievementUnlocked(achievement);
        });
      }
      
      // Update progress
      if (result.progress) {
        this.moduleProgress = result.progress.percentage || this.moduleProgress;
        if (this.callbacks.onProgress) {
          this.callbacks.onProgress(result.progress);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error tracking assessment completion:', error);
      return null;
    }
  }
  
  /**
   * Track exercise completion
   * @param {Object} exerciseData - Exercise data
   */
  async trackExerciseCompletion(exerciseData) {
    try {
      const result = await this.apiPost('/progress/exercise', {
        userId: this.userId,
        sessionId: this.sessionId,
        moduleId: this.moduleId,
        missionId: this.currentMission,
        ...exerciseData,
        timestamp: new Date().toISOString()
      });
      
      // Check for achievements
      if (result.achievements && result.achievements.length > 0) {
        result.achievements.forEach(achievement => {
          this.handleAchievementUnlocked(achievement);
        });
      }
      
      // Update progress
      if (result.progress) {
        this.moduleProgress = result.progress.percentage || this.moduleProgress;
        if (this.callbacks.onProgress) {
          this.callbacks.onProgress(result.progress);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error tracking exercise completion:', error);
      return null;
    }
  }
  
  /**
   * Track user progress for a training module
   * @param {Object} progressData - Progress data
   * @returns {Promise<Object>} Updated progress info
   */
  async trackProgress(progressData) {
    try {
      const response = await this.apiPost('/progress/track', {
        userId: this.userId,
        sessionId: this.sessionId,
        moduleId: this.moduleId,
        moduleType: this.moduleType,
        missionId: this.currentMission,
        ...progressData,
        timestamp: new Date().toISOString()
      });
      
      // Update module progress
      if (response.progress && response.progress.percentage !== undefined) {
        this.moduleProgress = response.progress.percentage;
      }
      
      // Call progress callback
      if (this.callbacks.onProgress) {
        this.callbacks.onProgress(response);
      }
      
      return response;
    } catch (error) {
      console.error('Error tracking progress:', error);
      
      // Call error callback
      if (this.callbacks.onError) {
        this.callbacks.onError('progress', error);
      }
      
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Handle socket message
   * @param {Object} data - Message data
   */
  handleSocketMessage(data) {
    switch (data.type) {
      case 'guidance':
        this.handleGuidanceUpdate(data.guidance);
        break;
        
      case 'progress_update':
        this.handleProgressUpdate(data);
        break;
        
      case 'achievement_unlocked':
        this.handleAchievementUnlocked(data);
        break;
        
      case 'module_update':
        this.handleModuleUpdate(data);
        break;
        
      case 'mission_update':
        this.handleMissionUpdate(data);
        break;
        
      case 'metrics_update':
        this.handleMetricsUpdate(data.metrics);
        break;
        
      case 'stella_intervention':
        this.handleSTELLAIntervention(data);
        break;
        
      case 'assessment_feedback':
        this.handleAssessmentFeedback(data);
        break;
        
      case 'error':
        this.handleError(data.error);
        break;
    }
  }
  
  /**
   * Handle guidance update from socket
   * @param {Object} guidance - Guidance data
   */
  handleGuidanceUpdate(guidance) {
    // Update last guidance
    this.lastGuidance = guidance;
    
    // Call guidance callback
    if (this.callbacks.onGuidance) {
      this.callbacks.onGuidance(guidance);
    }
    
    // Update UI with guidance
    this.updateSTELLAFeedback(guidance);
  }
  
  /**
   * Handle progress update from socket
   * @param {Object} progressData - Progress data
   */
  handleProgressUpdate(progressData) {
    // Update module progress
    if (progressData.progress && progressData.progress.percentage !== undefined) {
      this.moduleProgress = progressData.progress.percentage;
    }
    
    // Call progress callback
    if (this.callbacks.onProgress) {
      this.callbacks.onProgress(progressData);
    }
  }
  
  /**
   * Handle metrics update from socket
   * @param {Object} metrics - Metrics data
   */
  handleMetricsUpdate(metrics) {
    // Update metrics
    this.metrics = { ...this.metrics, ...metrics };
    
    // Call metrics updated callback
    if (this.callbacks.onMetricsUpdated) {
      this.callbacks.onMetricsUpdated(this.metrics);
    }
  }
  
  /**
   * Handle achievement unlocked notification
   * @param {Object} achievementData - Achievement data
   */
  handleAchievementUnlocked(achievementData) {
    // Call achievement callback
    if (this.callbacks.onAchievement) {
      this.callbacks.onAchievement(achievementData);
    }
    
    // Show achievement notification
    this.showAchievementNotification(achievementData);
  }
  
  /**
   * Handle module update from socket
   * @param {Object} moduleData - Module data
   */
  handleModuleUpdate(moduleData) {
    // Update module data
    if (moduleData.id === this.moduleId) {
      this.currentModuleData = moduleData;
      
      // Notify module loaded
      this.notifyModuleLoaded(moduleData);
    }
  }
  
  /**
   * Handle mission update from socket
   * @param {Object} missionData - Mission data
   */
  handleMissionUpdate(missionData) {
    // Update mission data
    if (missionData.id === this.currentMission) {
      this.missionData = missionData.data;
      
      // Update cache
      this.cache.missions.set(missionData.id, missionData.data);
      
      // Notify mission update
      if (this.callbacks.onMissionLoaded) {
        this.callbacks.onMissionLoaded(missionData.id, missionData.data);
      }
    }
  }
  
  /**
   * Handle STELLA intervention from socket
   * @param {Object} interventionData - Intervention data
   */
  handleSTELLAIntervention(interventionData) {
    // Call intervention callback
    if (this.callbacks.onSTELLAIntervention) {
      this.callbacks.onSTELLAIntervention(interventionData);
    }
    
    // Show intervention in UI if provided
    if (interventionData.message) {
      this.showInterventionNotification(interventionData);
    }
  }
  
  /**
   * Handle assessment feedback from socket
   * @param {Object} feedbackData - Assessment feedback data
   */
  handleAssessmentFeedback(feedbackData) {
    // Store in cache
    if (feedbackData.assessmentId) {
      this.cache.assessments.set(feedbackData.assessmentId, feedbackData);
    }
    
    // Display feedback if provided
    if (feedbackData.feedback) {
      this.updateSTELLAFeedback(feedbackData.feedback);
    }
  }
  
  /**
   * Handle error from socket
   * @param {Object} error - Error data
   */
  handleError(error) {
    console.error('Socket error:', error);
    
    // Call error callback
    if (this.callbacks.onError) {
      this.callbacks.onError('socket', error);
    }
  }
  
  /**
   * Show achievement notification
   * @param {Object} achievement - Achievement data
   */
  showAchievementNotification(achievement) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
      <div class="achievement-icon">${achievement.icon || '🏆'}</div>
      <div class="achievement-content">
        <div class="achievement-title">${achievement.title || 'Achievement Unlocked'}</div>
        <div class="achievement-description">${achievement.description || ''}</div>
      </div>
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Show with animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 500);
    }, 5000);
  }
  
  /**
   * Show intervention notification
   * @param {Object} intervention - Intervention data
   */
  showInterventionNotification(intervention) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'stella-intervention';
    notification.innerHTML = `
      <div class="stella-icon">🤖</div>
      <div class="intervention-content">
        <div class="intervention-title">${intervention.title || 'STELLA Intervention'}</div>
        <div class="intervention-message">${intervention.message || ''}</div>
      </div>
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Show with animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 500);
    }, 8000);
  }
  
  /**
   * Get default guidance when API fails
   * @returns {Object} Default guidance
   */
  getDefaultGuidance() {
    // Customize based on module type
    const moduleTypeGuidance = {
      physical: {
        message: 'Focus on proper technique and form during your physical training exercises.',
        actionItems: [
          'Maintain proper posture and alignment',
          'Control your breathing throughout each exercise',
          'Focus on quality over quantity'
        ]
      },
      technical: {
        message: 'Follow the procedures carefully and methodically during technical training.',
        actionItems: [
          'Read each step completely before proceeding',
          'Double-check your work at each milestone',
          'Refer to the technical documentation when needed'
        ]
      },
      simulation: {
        message: 'Approach the simulation with a focus on accuracy and protocol adherence.',
        actionItems: [
          'Communicate clearly with your team',
          'Follow standard operating procedures',
          'Monitor critical systems during operations'
        ]
      },
      eva: {
        message: 'Safety is the highest priority during EVA training.',
        actionItems: [
          'Verify all connections before proceeding',
          'Maintain awareness of your surroundings',
          'Manage your resources carefully'
        ]
      }
    };
    
    // Return module-specific guidance or generic guidance
    return this.moduleType && moduleTypeGuidance[this.moduleType] ? 
      moduleTypeGuidance[this.moduleType] : 
      {
        message: 'Focus on completing your training module. Follow instructions carefully and ask for help if needed.',
        actionItems: [
          'Review the module objectives',
          'Take your time to understand each concept',
          'Practice the exercises thoroughly'
        ],
        priority: 'normal'
      };
  }
  
  /**
   * Get default exercise guidance based on type
   * @param {string} exerciseType - Exercise type
   * @returns {Object} Default guidance
   */
  getDefaultExerciseGuidance(exerciseType) {
    const exerciseGuidance = {
      'core-balance': {
        message: 'Focus on maintaining core stability throughout this exercise.',
        actionItems: [
          'Engage your core muscles',
          'Breathe steadily and deeply',
          'Maintain proper alignment'
        ],
        priority: 'normal'
      },
      'endurance': {
        message: 'Maintain a steady pace and focus on your breathing rhythm.',
        actionItems: [
          'Keep a consistent breathing pattern',
          'Stay within your target heart rate zone',
          'Focus on rhythm and efficiency'
        ],
        priority: 'normal'
      },
      'strength': {
        message: 'Focus on controlled movements and proper form.',
        actionItems: [
          'Maintain proper form throughout the movement',
          'Focus on the eccentric (lowering) phase',
          'Fully engage the target muscle groups'
        ],
        priority: 'normal'
      }
    };
    
    return exerciseType && exerciseGuidance[exerciseType] ?
      exerciseGuidance[exerciseType] :
      {
        message: 'Focus on proper technique and form during this exercise.',
        actionItems: [
          'Maintain proper alignment',
          'Control your breathing',
          'Focus on quality over quantity'
        ],
        priority: 'normal'
      };
  }
  
  /**
   * Get default zone guidance
   * @param {string} zoneId - Zone ID
   * @returns {Object} Default guidance
   */
  getDefaultZoneGuidance(zoneId) {
    const zoneGuidance = {
      'recovery': {
        message: 'You are in the recovery zone. This is ideal for active recovery and building aerobic base.',
        actionItems: [
          'Focus on steady, rhythmic breathing',
          'Maintain a conversation pace',
          'Use this zone for longer duration training'
        ],
        priority: 'low'
      },
      'endurance': {
        message: 'You are in the endurance zone. This improves aerobic capacity and fat utilization.',
        actionItems: [
          'Maintain a steady, sustainable pace',
          'Focus on breathing rhythm',
          'Stay hydrated throughout'
        ],
        priority: 'normal'
      },
      'threshold': {
        message: 'You are in the threshold zone. This improves lactate threshold and cardio performance.',
        actionItems: [
          'Focus on maintaining this challenging pace',
          'Monitor your breathing carefully',
          'Maintain proper form despite fatigue'
        ],
        priority: 'medium'
      },
      'hiit': {
        message: 'You are in the high-intensity zone. This builds maximum cardiovascular capacity.',
        actionItems: [
          'Push to your limit during intervals',
          'Focus on complete recovery between efforts',
          'Maintain proper form despite intensity'
        ],
        priority: 'high'
      }
    };
    
    return zoneId && zoneGuidance[zoneId] ?
      zoneGuidance[zoneId] :
      {
        message: 'Stay focused on maintaining your position in your current training zone.',
        actionItems: [
          'Monitor your heart rate',
          'Adjust intensity as needed',
          'Focus on steady breathing'
        ],
        priority: 'normal'
      };
  }
  
  /**
   * Get item from cache
   * @param {string} cacheType - Cache type
   * @param {string} key - Cache key
   * @returns {any} Cached item or null if not found/expired
   */
  getCachedItem(cacheType, key) {
    if (!this.config.enableCaching) return null;
    
    const cache = this.cache[cacheType];
    if (!cache) return null;
    
    const cachedItem = cache.get(key);
    if (!cachedItem) return null;
    
    // Check if expired
    if (Date.now() - cachedItem.timestamp > this.config.cacheDuration) {
      cache.delete(key);
      return null;
    }
    
    return cachedItem.data;
  }
  
  /**
   * Store item in cache
   * @param {string} cacheType - Cache type
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   */
  setCachedItem(cacheType, key, data) {
    if (!this.config.enableCaching) return;
    
    const cache = this.cache[cacheType];
    if (!cache) return;
    
    cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  /**
   * Make a GET request to the API
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @returns {Promise<any>} Response data
   */
  async apiGet(endpoint, params = {}) {
    const url = new URL(this.config.apiBaseUrl + endpoint, window.location.origin);
    
    // Add params to URL
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': this.sessionId
      },
      credentials: 'same-origin'
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return response.json();
  }
  
  /**
   * Make a POST request to the API
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @returns {Promise<any>} Response data
   */
  async apiPost(endpoint, data = {}) {
    const url = this.config.apiBaseUrl