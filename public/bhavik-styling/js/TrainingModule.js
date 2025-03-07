/**
 * SharedStars Training Module
 * Consolidated JavaScript file for training modules with STELLA AI integration
 */

class TrainingModule {
    /**
     * Initialize a new training module
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
      // Default configuration
      this.options = {
        moduleType: document.querySelector('[data-module]')?.dataset.module || 'default',
        useMockData: true, // Use mock data for development/demo
        updateInterval: 3000, // Milliseconds between metric updates
        ...options
      };
  
      // Session state
      this.session = {
        active: false,
        startTime: null,
        currentExercise: null,
        currentZone: null,
        sessionProgress: 0,
        completed: []
      };
  
      // User metrics - will be updated during the session
      this.metrics = {
        heartRate: 72,
        o2Saturation: 98,
        focusScore: 90,
        balance: 0,
        coreStability: 0,
        endurance: 0,
        formQuality: 0,
        timeInZone: {},
        recoveryRate: 0
      };
  
      // Credits and achievements
      this.userProfile = {
        credits: parseInt(document.getElementById('credits-earned')?.textContent || '0'),
        streak: 0,
        certifications: {}
      };
  
      // STELLA AI integration
      this.stellaCore = window.stellaCore;
  
      // Initialize the module
      this.initialize();
    }
  
    /**
     * Initialize the training module
     */
    initialize() {
      console.log(`Initializing ${this.options.moduleType} training module`);
  
      // Initialize the UI elements
      this.initializeUI();
  
      // Set up event listeners
      this.setupEventListeners();
  
      // Initialize STELLA AI integration
      this.initializeSTELLA();
  
      // Module-specific initialization
      this.initializeModuleSpecific();
    }
  
    /**
     * Initialize UI elements
     */
    initializeUI() {
      // Get common UI elements
      this.timerElement = document.getElementById('session-timer');
      this.progressElement = document.getElementById('progress-percentage');
      this.creditsElement = document.getElementById('credits-earned');
      this.focusScoreElement = document.getElementById('focus-score');
      this.heartRateElement = document.getElementById('current-hr');
      this.o2Element = document.getElementById('current-o2');
      this.stellaGuidanceElement = document.getElementById('stella-guidance');
      this.stellaFeedbackElement = document.getElementById(`stella-${this.options.moduleType}-feedback`);
  
      // Initialize the session timer display
      this.updateTimerDisplay(0);
    }
  
    /**
     * Set up event listeners
     */
    setupEventListeners() {
      // Common controls
      const pauseButton = document.getElementById('pause-session');
      if (pauseButton) {
        pauseButton.addEventListener('click', () => this.togglePause());
      }
  
      const aiHelpButton = document.getElementById('ai-help-button');
      if (aiHelpButton) {
        aiHelpButton.addEventListener('click', () => {
          if (this.stellaCore) {
            this.stellaCore.showModal();
          }
        });
      }
  
      // Set up modal close button
      const closeModalButton = document.getElementById('close-stella-modal');
      if (closeModalButton) {
        closeModalButton.addEventListener('click', () => {
          const modal = document.getElementById('stella-help-modal');
          if (modal) {
            modal.classList.add('hidden');
          }
        });
      }
  
      // Listen for stella question submissions
      const sendButton = document.getElementById('send-to-stella');
      const questionInput = document.getElementById('stella-question');
      if (sendButton && questionInput) {
        sendButton.addEventListener('click', () => {
          const question = questionInput.value.trim();
          if (question && this.stellaCore) {
            this.stellaCore.askQuestion(question);
            questionInput.value = '';
          }
        });
  
        // Also listen for Enter key
        questionInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && this.stellaCore) {
            const question = questionInput.value.trim();
            if (question) {
              this.stellaCore.askQuestion(question);
              questionInput.value = '';
            }
          }
        });
      }
    }
  
    /**
     * Initialize STELLA AI integration
     */
    initializeSTELLA() {
      if (!this.stellaCore) {
        console.warn('STELLA Core not available. Some features may be limited.');
        return;
      }
  
      // Request initial guidance from STELLA
      this.stellaCore.getGuidance(this.options.moduleType);
  
      // Set up event handling for STELLA responses
      document.addEventListener('stella-guidance', (e) => {
        this.updateSTELLAGuidance(e.detail.guidance);
      });
  
      document.addEventListener('stella-metrics-update', (e) => {
        this.updateMetrics(e.detail.metrics);
      });
    }
  
    /**
     * Update STELLA's guidance display
     * @param {Object} guidance - Guidance data from STELLA
     */
    updateSTELLAGuidance(guidance) {
      if (!this.stellaGuidanceElement) return;
  
      if (guidance && guidance.message) {
        const actionItemsHtml = guidance.actionItems && guidance.actionItems.length
          ? `<ul class="mt-2 space-y-1">
              ${guidance.actionItems.map(item => `<li class="text-xs text-blue-200">• ${item}</li>`).join('')}
            </ul>`
          : '';
        
        this.stellaGuidanceElement.innerHTML = `
          <div class="bg-blue-500/10 rounded-lg p-3">
            <p class="text-sm text-blue-300">${guidance.message}</p>
            ${actionItemsHtml}
          </div>
        `;
      }
    }
  
    /**
     * Initialize module-specific UI and functionality
     * This should be overridden by specific module implementations
     */
    initializeModuleSpecific() {
      // To be implemented by specific module classes
      console.log('Base module initialization complete');
    }
  
    /**
     * Start the training session
     */
    startSession() {
      this.session.active = true;
      this.session.startTime = new Date();
      this.session.sessionProgress = 0;
      
      // Start the session timer
      this.startTimer();
      
      // Update the UI to reflect active session
      this.updateSessionUI(true);
  
      // Notify STELLA about session start
      if (this.stellaCore) {
        this.stellaCore.updateMetrics({ sessionActive: true });
        this.stellaCore.getGuidance(this.options.moduleType, { sessionStart: true });
      }
  
      // Start mock data updates if enabled
      if (this.options.useMockData) {
        this.startMockDataUpdates();
      }
  
      console.log(`${this.options.moduleType} training session started`);
    }
  
    /**
     * End the training session
     */
    endSession() {
      this.session.active = false;
      
      // Stop the timer
      this.stopTimer();
      
      // Calculate session stats
      const sessionDuration = Math.floor((new Date() - this.session.startTime) / 1000);
      
      // Update the UI to reflect inactive session
      this.updateSessionUI(false);
  
      // Notify STELLA about session end
      if (this.stellaCore) {
        this.stellaCore.updateMetrics({ 
          sessionActive: false,
          sessionDuration: sessionDuration,
          completedExercises: this.session.completed
        });
        this.stellaCore.getGuidance(this.options.moduleType, { sessionEnd: true });
      }
  
      // Stop mock data updates
      clearInterval(this.metricsInterval);
  
      // Update progress
      this.updateProgress();
  
      console.log(`${this.options.moduleType} training session ended`);
      
      return {
        duration: sessionDuration,
        completed: this.session.completed,
        metrics: this.metrics
      };
    }
  
    /**
     * Toggle session pause state
     */
    togglePause() {
      const pauseButton = document.getElementById('pause-session');
      
      if (!this.session.active) return;
      
      if (!this.session.paused) {
        // Pause session
        this.session.paused = true;
        this.stopTimer();
        
        if (pauseButton) {
          pauseButton.textContent = 'Resume';
        }
        
        // Notify STELLA
        if (this.stellaCore) {
          this.stellaCore.updateMetrics({ sessionPaused: true });
        }
      } else {
        // Resume session
        this.session.paused = false;
        this.startTimer();
        
        if (pauseButton) {
          pauseButton.textContent = 'Pause';
        }
        
        // Notify STELLA
        if (this.stellaCore) {
          this.stellaCore.updateMetrics({ sessionPaused: false });
        }
      }
    }
  
    /**
     * Update UI to reflect session state
     * @param {Boolean} isActive - Whether the session is active
     */
    updateSessionUI(isActive) {
      const startButton = document.getElementById('start-session');
      const endButton = document.getElementById('end-session');
      const pauseButton = document.getElementById('pause-session');
      const sessionControls = document.getElementById('session-controls');
      const preSessionUI = document.getElementById('pre-session-ui');
      const activeSessionUI = document.getElementById('active-session-ui');
      
      if (isActive) {
        // Show active session UI
        if (preSessionUI) preSessionUI.classList.add('hidden');
        if (activeSessionUI) activeSessionUI.classList.remove('hidden');
        if (sessionControls) sessionControls.classList.remove('hidden');
        
        // Update button states
        if (startButton) startButton.classList.add('hidden');
        if (endButton) endButton.classList.remove('hidden');
        if (pauseButton) {
          pauseButton.classList.remove('hidden');
          pauseButton.textContent = 'Pause';
        }
      } else {
        // Show pre-session UI
        if (preSessionUI) preSessionUI.classList.remove('hidden');
        if (activeSessionUI) activeSessionUI.classList.add('hidden');
        if (sessionControls) sessionControls.classList.add('hidden');
        
        // Update button states
        if (startButton) startButton.classList.remove('hidden');
        if (endButton) endButton.classList.add('hidden');
        if (pauseButton) pauseButton.classList.add('hidden');
      }
    }
  
    /**
     * Start the session timer
     */
    startTimer() {
      // Clear any existing timer
      this.stopTimer();
      
      const startTime = this.session.startTime;
      
      // Set up the timer interval
      this.timerInterval = setInterval(() => {
        if (!this.session.active || this.session.paused) return;
        
        const elapsedSeconds = Math.floor((new Date() - startTime) / 1000);
        this.updateTimerDisplay(elapsedSeconds);
      }, 1000);
    }
  
    /**
     * Stop the session timer
     */
    stopTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    }
  
    /**
     * Update the timer display
     * @param {Number} seconds - Elapsed seconds
     */
    updateTimerDisplay(seconds) {
      if (!this.timerElement) return;
      
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = seconds % 60;
      
      const formattedTime = [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        remainingSeconds.toString().padStart(2, '0')
      ].join(':');
      
      this.timerElement.textContent = formattedTime;
    }
  
    /**
     * Update progress percentage
     * @param {Number} progress - Progress percentage (0-100)
     */
    updateProgress(progress) {
      if (!this.progressElement) return;
      
      // If progress is provided, use it; otherwise use session progress
      const currentProgress = typeof progress === 'number' 
        ? progress 
        : this.session.sessionProgress;
      
      this.session.sessionProgress = currentProgress;
      this.progressElement.textContent = `${Math.floor(currentProgress)}%`;
      
      // Update progress bar if it exists
      const progressBar = document.querySelector('.progress-fill');
      if (progressBar) {
        progressBar.style.width = `${currentProgress}%`;
      }
      
      // Notify STELLA of progress update
      if (this.stellaCore) {
        this.stellaCore.updateMetrics({ sessionProgress: currentProgress });
      }
    }
  
    /**
     * Update user metrics
     * @param {Object} metrics - Metrics to update
     */
    updateMetrics(metrics) {
      // Update metrics object
      this.metrics = {
        ...this.metrics,
        ...metrics
      };
      
      // Update UI elements with new metrics
      if (this.heartRateElement && typeof metrics.heartRate !== 'undefined') {
        this.heartRateElement.textContent = metrics.heartRate;
      }
      
      if (this.o2Element && typeof metrics.o2Saturation !== 'undefined') {
        this.o2Element.textContent = metrics.o2Saturation;
      }
      
      if (this.focusScoreElement && typeof metrics.focusScore !== 'undefined') {
        this.focusScoreElement.textContent = metrics.focusScore;
      }
      
      // Update additional module-specific metrics
      this.updateModuleSpecificMetrics(metrics);
    }
  
    /**
     * Update module-specific metrics
     * This should be overridden by specific module implementations
     * @param {Object} metrics - Metrics to update
     */
    updateModuleSpecificMetrics(metrics) {
      // To be implemented by specific module classes
    }
  
    /**
     * Start mock data updates for development/demo
     */
    startMockDataUpdates() {
      // Clear any existing interval
      if (this.metricsInterval) {
        clearInterval(this.metricsInterval);
      }
      
      // Set up the interval for mock data updates
      this.metricsInterval = setInterval(() => {
        if (!this.session.active || this.session.paused) return;
        
        // Generate mock metrics
        const mockMetrics = this.generateMockMetrics();
        
        // Update the metrics
        this.updateMetrics(mockMetrics);
        
        // Increment progress
        const newProgress = Math.min(100, this.session.sessionProgress + (100 / (15 * 60)) * (this.options.updateInterval / 1000));
        this.updateProgress(newProgress);
        
        // Simulate STELLA guidance (randomly)
        if (Math.random() < 0.1 && this.stellaCore) {
          this.stellaCore.getGuidance(this.options.moduleType);
        }
      }, this.options.updateInterval);
    }
  
    /**
     * Generate mock metrics for development/demo
     * @returns {Object} Mock metrics
     */
    generateMockMetrics() {
      // Base metrics with small random variations
      const heartRateVariation = Math.floor(Math.random() * 10) - 5; // -5 to +5
      const o2Variation = Math.random() < 0.8 ? 0 : (Math.floor(Math.random() * 3) - 1); // mostly stable, occasional -1 to +1
      const focusVariation = Math.floor(Math.random() * 6) - 3; // -3 to +3
      
      return {
        heartRate: Math.max(60, Math.min(180, this.metrics.heartRate + heartRateVariation)),
        o2Saturation: Math.max(94, Math.min(100, this.metrics.o2Saturation + o2Variation)),
        focusScore: Math.max(60, Math.min(100, this.metrics.focusScore + focusVariation)),
        // Module-specific mock metrics will be added by subclasses
      };
    }
  
    /**
     * Log an exercise as completed
     * @param {String} exerciseId - ID of the completed exercise
     * @param {Object} details - Details about completion (score, duration, etc.)
     */
    completeExercise(exerciseId, details = {}) {
      const completion = {
        id: exerciseId,
        timestamp: new Date().toISOString(),
        ...details
      };
      
      // Add to completed exercises
      this.session.completed.push(completion);
      
      // Award credits
      this.awardCredits(details.credits || 10); // Default 10 credits per exercise
      
      // Notify STELLA of completion
      if (this.stellaCore) {
        this.stellaCore.updateMetrics({ 
          completedExercise: completion
        });
        this.stellaCore.getGuidance(this.options.moduleType, { exerciseCompleted: exerciseId });
      }
      
      // Update progress
      const progressIncrement = 100 / (this.getModuleExerciseCount() || 10); // Default to 10 exercises
      this.updateProgress(this.session.sessionProgress + progressIncrement);
      
      console.log(`Exercise ${exerciseId} completed`);
      
      return completion;
    }
  
    /**
     * Get the total number of exercises in this module
     * This should be overridden by specific module implementations
     * @returns {Number} Number of exercises
     */
    getModuleExerciseCount() {
      // To be implemented by specific module classes
      return 10; // Default value
    }
  
    /**
     * Award credits to the user
     * @param {Number} amount - Number of credits to award
     */
    awardCredits(amount) {
      // Update user profile
      this.userProfile.credits += amount;
      
      // Update the UI
      if (this.creditsElement) {
        this.creditsElement.textContent = this.userProfile.credits;
      }
      
      // Show a notification
      this.showNotification(`Earned ${amount} credits!`);
      
      // Save to server
      this.saveUserProgress();
    }
  
    /**
     * Show a notification to the user
     * @param {String} message - Notification message
     * @param {String} type - Notification type (success, warning, error)
     */
    showNotification(message, type = 'success') {
      // Create notification element
      const notification = document.createElement('div');
      notification.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg z-50 transform transition-transform duration-300 translate-y-20 ${
        type === 'success' ? 'bg-green-900/80 text-green-100 border border-green-500/30' :
        type === 'warning' ? 'bg-yellow-900/80 text-yellow-100 border border-yellow-500/30' :
        'bg-red-900/80 text-red-100 border border-red-500/30'
      }`;
      notification.textContent = message;
      
      document.body.appendChild(notification);
      
      // Animate in
      setTimeout(() => {
        notification.classList.remove('translate-y-20');
      }, 10);
      
      // Remove after 3 seconds
      setTimeout(() => {
        notification.classList.add('translate-y-20');
        setTimeout(() => {
          notification.remove();
        }, 300);
      }, 3000);
    }
  
    /**
     * Save user progress to the server
     */
    saveUserProgress() {
      // If we have a real API to save to, use that
      if (window.api && window.api.saveUserProgress) {
        window.api.saveUserProgress({
          moduleType: this.options.moduleType,
          credits: this.userProfile.credits,
          completedExercises: this.session.completed
        })
        .then(() => console.log('Progress saved'))
        .catch(err => console.error('Error saving progress:', err));
      } else {
        // Otherwise just simulate saving (for development/demo)
        console.log('Simulating progress save:', {
          moduleType: this.options.moduleType,
          credits: this.userProfile.credits,
          completedExercises: this.session.completed
        });
        
        // Save to localStorage for persistence across page reloads
        try {
          localStorage.setItem('sharedStars_userProgress', JSON.stringify({
            moduleType: this.options.moduleType,
            credits: this.userProfile.credits,
            completedExercises: this.session.completed,
            lastUpdated: new Date().toISOString()
          }));
        } catch (e) {
          console.warn('Could not save to localStorage', e);
        }
      }
    }
  
    /**
     * Load saved user progress
     */
    loadUserProgress() {
      // If we have a real API to load from, use that
      if (window.api && window.api.getUserProgress) {
        window.api.getUserProgress(this.options.moduleType)
          .then(progress => {
            if (progress) {
              this.userProfile.credits = progress.credits || this.userProfile.credits;
              this.updateUserProfile(progress);
            }
          })
          .catch(err => console.error('Error loading progress:', err));
      } else {
        // Otherwise try to load from localStorage (for development/demo)
        try {
          const savedProgress = localStorage.getItem('sharedStars_userProgress');
          if (savedProgress) {
            const progress = JSON.parse(savedProgress);
            this.updateUserProfile(progress);
          }
        } catch (e) {
          console.warn('Could not load from localStorage', e);
        }
      }
    }
  
    /**
     * Update user profile with loaded data
     * @param {Object} progress - Progress data
     */
    updateUserProfile(progress) {
      // Update credits display
      if (progress.credits && this.creditsElement) {
        this.userProfile.credits = progress.credits;
        this.creditsElement.textContent = progress.credits;
      }
      
      // Update other profile elements as needed
      if (progress.streak) {
        this.userProfile.streak = progress.streak;
      }
      
      if (progress.certifications) {
        this.userProfile.certifications = progress.certifications;
      }
    }
  
    /**
     * Set the current exercise
     * @param {String} exerciseId - ID of the current exercise
     */
    setCurrentExercise(exerciseId) {
      this.session.currentExercise = exerciseId;
      
      // Update UI to highlight the current exercise
      const exerciseElements = document.querySelectorAll('.exercise-item');
      exerciseElements.forEach(element => {
        if (element.dataset.exerciseId === exerciseId) {
          element.classList.add('current-exercise', 'border-blue-500', 'bg-blue-900/20');
        } else {
          element.classList.remove('current-exercise', 'border-blue-500', 'bg-blue-900/20');
        }
      });
      
      // Notify STELLA of exercise change
      if (this.stellaCore) {
        this.stellaCore.updateMetrics({ currentExercise: exerciseId });
        this.stellaCore.getGuidance(this.options.moduleType, { currentExercise: exerciseId });
      }
    }
  
    /**
     * Set the current training zone
     * @param {String} zone - Training zone (e.g., 'aerobic', 'strength', 'balance')
     */
    setCurrentZone(zone) {
      this.session.currentZone = zone;
      
      // Update zone indicator in UI
      const zoneElement = document.getElementById('current-zone');
      if (zoneElement) {
        zoneElement.textContent = zone.charAt(0).toUpperCase() + zone.slice(1);
        
        // Change color based on zone
        zoneElement.className = 'font-medium ' + (
          zone === 'aerobic' ? 'text-green-400' :
          zone === 'strength' ? 'text-red-400' :
          zone === 'balance' ? 'text-blue-400' :
          zone === 'flexibility' ? 'text-purple-400' :
          'text-white'
        );
      }
      
      // Notify STELLA of zone change
      if (this.stellaCore) {
        this.stellaCore.updateMetrics({ currentZone: zone });
      }
    }
  }
  
  // Module-specific implementations can extend this base class
  class PhysicalTrainingModule extends TrainingModule {
    initializeModuleSpecific() {
      console.log('Initializing physical training module');
      
      // Set up physical training specific UI and controls
      const exerciseButtons = document.querySelectorAll('[data-exercise]');
      exerciseButtons.forEach(button => {
        button.addEventListener('click', () => {
          const exerciseId = button.dataset.exercise;
          this.setCurrentExercise(exerciseId);
        });
      });
      
      // Load exercises
      this.loadExercises();
    }
    
    updateModuleSpecificMetrics(metrics) {
      // Update physical training specific metrics
      const balanceElement = document.getElementById('balance-score');
      if (balanceElement && typeof metrics.balance !== 'undefined') {
        balanceElement.textContent = metrics.balance;
      }
      
      const coreStabilityElement = document.getElementById('core-stability');
      if (coreStabilityElement && typeof metrics.coreStability !== 'undefined') {
        coreStabilityElement.textContent = metrics.coreStability;
      }
    }
    
    generateMockMetrics() {
      const baseMetrics = super.generateMockMetrics();
      
      // Add physical-specific mock metrics
      return {
        ...baseMetrics,
        balance: Math.max(0, Math.min(100, this.metrics.balance + (Math.floor(Math.random() * 5) - 2))),
        coreStability: Math.max(0, Math.min(100, this.metrics.coreStability + (Math.floor(Math.random() * 5) - 2))),
        endurance: Math.max(0, Math.min(100, this.metrics.endurance + (Math.floor(Math.random() * 3) - 1)))
      };
    }
    
    loadExercises() {
      // In a real implementation, this would load from an API
      // For now, using mock exercises
      const mockExercises = [
        { id: 'zero-g-squat', name: 'Zero-G Squat', zone: 'strength', duration: 180 },
        { id: 'vestibular-balance', name: 'Vestibular Balance', zone: 'balance', duration: 120 },
        { id: 'core-rotation', name: 'Core Rotation', zone: 'strength', duration: 150 },
        { id: 'spatial-orientation', name: 'Spatial Orientation', zone: 'balance', duration: 240 },
        { id: 'endurance-cycle', name: 'Endurance Cycle', zone: 'aerobic', duration: 300 }
      ];
      
      const exerciseList = document.getElementById('exercise-list');
      if (!exerciseList) return;
      
      exerciseList.innerHTML = '';
      
      mockExercises.forEach(exercise => {
        const exerciseItem = document.createElement('div');
        exerciseItem.className = 'exercise-item p-3 border border-gray-700 rounded-lg mb-2 cursor-pointer hover:bg-gray-800/50 transition';
        exerciseItem.dataset.exerciseId = exercise.id;
        
        const zoneColor = 
          exercise.zone === 'aerobic' ? 'bg-green-500/20 text-green-400' :
          exercise.zone === 'strength' ? 'bg-red-500/20 text-red-400' :
          exercise.zone === 'balance' ? 'bg-blue-500/20 text-blue-400' :
          'bg-purple-500/20 text-purple-400';
        
        exerciseItem.innerHTML = `
          <div class="flex items-center justify-between">
            <div>
              <h4 class="font-medium">${exercise.name}</h4>
              <div class="flex items-center mt-1">
                <span class="text-xs px-2 py-0.5 rounded ${zoneColor} mr-2">${exercise.zone}</span>
                <span class="text-xs text-gray-400">${Math.floor(exercise.duration / 60)}:${(exercise.duration % 60).toString().padStart(2, '0')}</span>
              </div>
            </div>
            <button class="start-exercise px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 rounded text-white" data-exercise="${exercise.id}">
              Start
            </button>
          </div>
        `;
        
        exerciseList.appendChild(exerciseItem);
        
        // Add click handler
        const startButton = exerciseItem.querySelector('.start-exercise');
        startButton.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent the parent click handler
          this.startExercise(exercise);
        });
        
        exerciseItem.addEventListener('click', () => {
          this.showExerciseDetails(exercise);
        });
      });
    }
    
    startExercise(exercise) {
      if (!this.session.active) {
        this.startSession();
      }
      
      this.setCurrentExercise(exercise.id);
      this.setCurrentZone(exercise.zone);
      
      // Show active exercise UI
      const exerciseUI = document.getElementById('active-exercise');
      if (exerciseUI) {
        exerciseUI.classList.remove('hidden');
        exerciseUI.querySelector('.exercise-name').textContent = exercise.name;
        exerciseUI.querySelector('.exercise-duration').textContent = 
          `${Math.floor(exercise.duration / 60)}:${(exercise.duration % 60).toString().padStart(2, '0')}`;
      }
      
      // Get guidance from STELLA for this exercise
      if (this.stellaCore) {
        this.stellaCore.getGuidance(this.options.moduleType, { 
          currentExercise: exercise.id,
          exerciseStarted: true
        });
      }
      
      this.exerciseTimer = setInterval(() => {
        if (this.session.paused) return;
        
        remainingTime--;
        
        if (timerElement) {
          timerElement.textContent = `${Math.floor(remainingTime / 60)}:${(remainingTime % 60).toString().padStart(2, '0')}`;
        }
        
        // Update exercise progress bar if it exists
        const progressBar = document.getElementById('exercise-progress');
        if (progressBar) {
          const progressPercentage = 100 - (remainingTime / exercise.duration) * 100;
          progressBar.style.width = `${progressPercentage}%`;
        }
        
        // When exercise is complete
        if (remainingTime <= 0) {
          clearInterval(this.exerciseTimer);
          this.completeExercise(exercise.id, { duration: exercise.duration, zone: exercise.zone });
          
          // Hide exercise UI
          if (exerciseUI) {
            exerciseUI.classList.add('hidden');
          }
          
          // Show completion UI
          const completionUI = document.getElementById('exercise-completion');
          if (completionUI) {
            completionUI.classList.remove('hidden');
            setTimeout(() => {
              completionUI.classList.add('hidden');
            }, 3000);
          }
        }
      }, 1000);
    }
    
    showExerciseDetails(exercise) {
      const detailsModal = document.getElementById('exercise-details-modal');
      if (!detailsModal) return;
      
      detailsModal.classList.remove('hidden');
      
      const modalTitle = detailsModal.querySelector('.modal-title');
      const modalContent = detailsModal.querySelector('.modal-content');
      
      if (modalTitle) {
        modalTitle.textContent = exercise.name;
      }
      
      if (modalContent) {
        modalContent.innerHTML = `
          <div class="space-y-4">
            <div>
              <span class="text-sm text-gray-400">Type:</span>
              <span class="text-white font-medium">${exercise.zone.charAt(0).toUpperCase() + exercise.zone.slice(1)}</span>
            </div>
            <div>
              <span class="text-sm text-gray-400">Duration:</span>
              <span class="text-white font-medium">${Math.floor(exercise.duration / 60)}:${(exercise.duration % 60).toString().padStart(2, '0')}</span>
            </div>
            <div>
              <h4 class="text-sm text-gray-400 mb-1">Description:</h4>
              <p class="text-white">This ${exercise.zone} exercise is designed to train astronauts for the unique challenges of ${exercise.zone === 'aerobic' ? 'maintaining cardiovascular fitness' : exercise.zone === 'strength' ? 'preserving muscle mass' : 'maintaining spatial orientation'} in microgravity environments.</p>
            </div>
            <div>
              <h4 class="text-sm text-gray-400 mb-1">STELLA's Tips:</h4>
              <div class="bg-blue-900/20 border border-blue-500/20 rounded-lg p-3">
                <p class="text-blue-300 text-sm">For best results, ${
                  exercise.zone === 'aerobic' ? 'maintain a steady pace and focus on controlled breathing patterns.' : 
                  exercise.zone === 'strength' ? 'ensure proper form and engage core muscles throughout the exercise.' : 
                  'close your eyes periodically to challenge your vestibular system more intensely.'
                }</p>
              </div>
            </div>
          </div>
        `;
      }
      
      // Set up close button
      const closeButton = detailsModal.querySelector('.close-modal');
      if (closeButton) {
        closeButton.addEventListener('click', () => {
          detailsModal.classList.add('hidden');
        });
      }
      
      // Close when clicking outside the modal content
      detailsModal.addEventListener('click', (e) => {
        if (e.target === detailsModal) {
          detailsModal.classList.add('hidden');
        }
      });
    }
    
    getModuleExerciseCount() {
      // For physical training, we have 5 exercises
      return 5;
    }
  }
  
  // Export the classes for use in other files
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      TrainingModule,
      PhysicalTrainingModule
    };
  } else {
    // For browser environment
    window.TrainingModule = TrainingModule;
    window.PhysicalTrainingModule = PhysicalTrainingModule;
  }
  
  // Initialize the appropriate module based on the page
  document.addEventListener('DOMContentLoaded', () => {
    const moduleType = document.querySelector('[data-module]')?.dataset.module;
    
    if (moduleType) {
      let module;
      
      switch (moduleType) {
        case 'physical':
          module = new PhysicalTrainingModule();
          break;
        // Add other module types as needed
        default:
          module = new TrainingModule({ moduleType });
      }
      
      // Make accessible globally for debugging
      window.trainingModule = module;
    }
  });