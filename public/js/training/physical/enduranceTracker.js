// public/js/training/physical/enduranceTracker.js
class EnduranceTracker extends MissionTracker {
    constructor(config = {}) {
      super('endurance');
      this.config = config;
      this.heartRateInterval = null;
      this.zoneInterval = null;
      this.sessionInterval = null;
      this.caloriesInterval = null;
      this.currentZone = null;
      this.isPaused = false;
      
      // Bind display elements from config
      this.displayElements = {
        heartRateDisplay: document.querySelector(config.heartRateDisplay || '#heart-rate-display'),
        zoneTimeDisplay: document.querySelector(config.zoneTimeDisplay || '#zone-time-display'),
        caloriesDisplay: document.querySelector(config.caloriesDisplay || '#calories-display'),
        currentZoneDisplay: document.querySelector(config.currentZoneDisplay || '#current-zone-display'),
        targetHRDisplay: document.querySelector(config.targetHRDisplay || '#target-hr-display'),
        sessionDurationDisplay: document.querySelector(config.sessionDurationDisplay || '#session-duration-display'),
        sessionCreditsDisplay: document.querySelector(config.sessionCreditsDisplay || '#session-credits-display'),
        heartRateGraph: document.querySelector(config.heartRateGraph || '#heart-rate-graph'),
        footerDuration: document.querySelector(config.footerDuration || '#footer-duration'),
        footerHR: document.querySelector(config.footerHR || '#footer-hr'),
        footerCredits: document.querySelector(config.footerCredits || '#footer-credits'),
        progressBar: document.querySelector(config.progressBar || '#progress-bar'),
        progressPercentage: document.querySelector(config.progressPercentage || '#progress-percentage-display')
      };
      
      // Heart rate zones
      this.zones = {
        recovery: { min: 50, max: 60, color: '#3B82F6', name: 'Recovery' },
        endurance: { min: 60, max: 70, color: '#10B981', name: 'Endurance' },
        threshold: { min: 70, max: 80, color: '#FBBF24', name: 'Threshold' },
        hiit: { min: 80, max: 90, color: '#F97316', name: 'HIIT' },
        peak: { min: 90, max: 100, color: '#EF4444', name: 'Peak' }
      };
      
      // Initialize progress data
      this.progressData = {
        startTime: null,
        currentZone: null,
        zones: {},
        totalCalories: 0,
        heartRateHistory: [],
        maxHeartRate: this.calculateMaxHeartRate(),
        credits: 0,
        progress: 0
      };
    }
    
    initialize() {
      super.initialize();
      
      this.setupZoneSelectors();
      this.setupControlButtons();
      this.setupSocialSharing();
      
      // Initialize STELLA AI if available
      if (window.stellaCore && typeof window.stellaCore.initialize === 'function') {
        window.stellaCore.initialize({
          trainingType: 'endurance',
          adaptiveLearning: true,
          userLevel: 'beginner'
        });
      }
      
      // Show toast notification
      this.showToast('Endurance training ready. Select a zone to begin.');
    }
    
    setupZoneSelectors() {
      const zoneCards = document.querySelectorAll('.zone-card');
      
      zoneCards.forEach(card => {
        if (!card.querySelector('.premium-overlay')) {  // Skip premium zones with overlay
          card.addEventListener('click', () => {
            const zoneId = card.dataset.zone;
            
            // Remove active class from all zones
            zoneCards.forEach(c => c.classList.remove('active-zone'));
            
            // Add active class to selected zone
            card.classList.add('active-zone');
            
            // Start training in this zone
            this.startZone(zoneId);
          });
        }
      });
    }
    
    setupControlButtons() {
      const endSessionBtn = document.getElementById('end-session-btn');
      if (endSessionBtn) {
        endSessionBtn.addEventListener('click', () => this.endSession());
      }
      
      const pauseSessionBtn = document.getElementById('pause-session-btn');
      if (pauseSessionBtn) {
        pauseSessionBtn.addEventListener('click', () => this.togglePause());
      }
      
      const saveProgressBtn = document.getElementById('save-progress-btn');
      if (saveProgressBtn) {
        saveProgressBtn.addEventListener('click', () => this.saveProgress());
      }
      
      // STELLA chat modal
      const aiHelpButton = document.getElementById('ai-help-button');
      const stellaModal = document.getElementById('stella-help-modal');
      const closeModalButton = document.getElementById('close-stella-modal');
      
      if (aiHelpButton && stellaModal) {
        aiHelpButton.addEventListener('click', () => {
          stellaModal.style.display = 'flex';
        });
      }
      
      if (closeModalButton && stellaModal) {
        closeModalButton.addEventListener('click', () => {
          stellaModal.style.display = 'none';
        });
      }
      
      // STELLA chat functionality
      const stellaQuestion = document.getElementById('stella-question');
      const sendToStella = document.getElementById('send-to-stella');
      
      if (sendToStella && stellaQuestion) {
        sendToStella.addEventListener('click', () => this.askStella());
        
        stellaQuestion.addEventListener('keydown', e => {
          if (e.key === 'Enter') this.askStella();
        });
      }
    }
    
    setupSocialSharing() {
      const shareTwitter = document.getElementById('share-twitter');
      if (shareTwitter) {
        shareTwitter.addEventListener('click', () => {
          const text = encodeURIComponent('I just completed an Endurance training session on SharedStars! #SpaceTraining #SharedStars');
          const url = encodeURIComponent(window.location.href);
          window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
        });
      }
      
      const shareFacebook = document.getElementById('share-facebook');
      if (shareFacebook) {
        shareFacebook.addEventListener('click', () => {
          const url = encodeURIComponent(window.location.href);
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
        });
      }
      
      const shareLinkedin = document.getElementById('share-linkedin');
      if (shareLinkedin) {
        shareLinkedin.addEventListener('click', () => {
          const url = encodeURIComponent(window.location.href);
          const title = encodeURIComponent('Endurance Training - SharedStars');
          window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}`, '_blank');
        });
      }
    }
    
    askStella() {
      const questionInput = document.getElementById('stella-question');
      const chatContainer = document.getElementById('stella-conversation');
      
      if (!questionInput || !chatContainer) return;
      
      const question = questionInput.value.trim();
      if (!question) return;
      
      // Add user message to chat
      chatContainer.innerHTML += `
        <div class="user-message">
          <div class="bg-blue-900/30 rounded-lg p-3 border border-blue-500/30 inline-block max-w-lg">
            <p>${question}</p>
          </div>
        </div>
      `;
      
      // Clear input
      questionInput.value = '';
      
      // Scroll to bottom
      chatContainer.scrollTop = chatContainer.scrollHeight;
      
      // Get AI response if STELLA is available
      if (window.stellaCore && typeof window.stellaCore.getGuidance === 'function') {
        window.stellaCore.getGuidance({
          question,
          context: 'endurance-training'
        }).then(guidance => {
          if (guidance && guidance.message) {
            chatContainer.innerHTML += `
              <div class="stella-message">
                <div class="bg-green-900/30 rounded-lg p-3 border border-green-500/30 inline-block max-w-lg">
                  <p>${guidance.message}</p>
                  ${guidance.actionItems && guidance.actionItems.length > 0 ? `
                    <ul class="mt-2">
                      ${guidance.actionItems.map(item => `<li>• ${item}</li>`).join('')}
                    </ul>
                  ` : ''}
                </div>
              </div>
            `;
            
            // Scroll to bottom
            chatContainer.scrollTop = chatContainer.scrollHeight;
          }
        }).catch(err => {
          console.error("Error getting STELLA guidance:", err);
          this.showFallbackResponse(chatContainer, question);
        });
      } else {
        // Show fallback response if STELLA is not available
        this.showFallbackResponse(chatContainer, question);
      }
    }
    
    showFallbackResponse(chatContainer, question) {
      let response = "I'm here to help with your endurance training. What would you like to know?";
      
      // Simple keyword-based responses
      if (question.toLowerCase().includes('heart rate') || question.toLowerCase().includes('bpm')) {
        response = "Your heart rate is a key indicator of training intensity. For endurance, try to maintain your heart rate in the 60-70% of your maximum heart rate zone for extended periods.";
      } else if (question.toLowerCase().includes('zone')) {
        response = "Training zones are based on percentages of your maximum heart rate. Each zone targets different energy systems and adaptations. The endurance zone (60-70%) is great for building aerobic efficiency.";
      } else if (question.toLowerCase().includes('calorie') || question.toLowerCase().includes('burn')) {
        response = "Calorie burn depends on intensity, duration, and your individual metrics. Consistent endurance training in the 60-70% zone will optimize fat burning while building cardiovascular capacity.";
      }
      
      chatContainer.innerHTML += `
        <div class="stella-message">
          <div class="bg-green-900/30 rounded-lg p-3 border border-green-500/30 inline-block max-w-lg">
            <p>${response}</p>
          </div>
        </div>
      `;
      
      // Scroll to bottom
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    
    startZone(zoneId) {
      if (!this.zones[zoneId]) {
        console.error(`Invalid zone: ${zoneId}`);
        return;
      }
      
      // Set current zone
      this.currentZone = zoneId;
      this.progressData.currentZone = zoneId;
      
      // Initialize zone time if not exists
      if (!this.progressData.zones[zoneId]) {
        this.progressData.zones[zoneId] = {
          timeSpent: 0,
          caloriesBurned: 0,
          started: new Date()
        };
      } else {
        // Update start time for existing zone
        this.progressData.zones[zoneId].started = new Date();
      }
      
      // Set session start time if first zone
      if (!this.progressData.startTime) {
        this.progressData.startTime = new Date();
        this.startSessionTimer();
      }
      
      // Update display
      this.updateDisplays();
      
      // Start simulations
      this.startHeartRateSimulation();
      this.startCaloriesBurnedSimulation();
      
      // Update zone time
      this.startZoneTimeTracking();
      
      // Update zone display
      if (this.displayElements.currentZoneDisplay) {
        this.displayElements.currentZoneDisplay.textContent = this.zones[zoneId].name;
        this.displayElements.currentZoneDisplay.style.color = this.zones[zoneId].color;
      }
      
      // Update target heart rate
      if (this.displayElements.targetHRDisplay) {
        const maxHR = this.progressData.maxHeartRate;
        const minTarget = Math.floor(maxHR * (this.zones[zoneId].min / 100));
        const maxTarget = Math.floor(maxHR * (this.zones[zoneId].max / 100));
        this.displayElements.targetHRDisplay.textContent = `${minTarget}-${maxTarget} bpm`;
      }
      
      // Show toast notification
      this.showToast(`${this.zones[zoneId].name} zone activated!`);
      
      // Update progress
      const zoneProgress = Object.keys(this.progressData.zones).length * 20; // 20% per zone
      this.updateProgress(Math.min(zoneProgress, 100));
      
      // Log to server
      this.logActivity('zone_start', {
        zoneId,
        zoneName: this.zones[zoneId].name
      });
      
      // Award credits for starting this zone
      this.awardCredits(30);
    }
    
    startHeartRateSimulation() {
      // Clear existing interval
      if (this.heartRateInterval) {
        clearInterval(this.heartRateInterval);
      }
      
      this.heartRateInterval = setInterval(() => {
        if (this.isPaused) return;
        
        const zone = this.zones[this.currentZone];
        const maxHR = this.progressData.maxHeartRate;
        
        // Calculate heart rate in current zone with small random fluctuations
        const minHR = Math.floor(maxHR * (zone.min / 100));
        const maxHR2 = Math.floor(maxHR * (zone.max / 100));
        const targetHR = minHR + Math.floor(Math.random() * (maxHR2 - minHR));
        
        // Add small random fluctuation
        const fluctuation = Math.floor(Math.random() * A) - 2; // -2 to +2
        const heartRate = targetHR + fluctuation;
        
        // Update displays
        if (this.displayElements.heartRateDisplay) {
          this.displayElements.heartRateDisplay.textContent = `${heartRate} bpm`;
        }
        
        if (this.displayElements.footerHR) {
          this.displayElements.footerHR.textContent = `${heartRate} bpm`;
        }
        
        // Store in history (limited to last 50 readings)
        this.progressData.heartRateHistory.push({
          time: new Date(),
          value: heartRate
        });
        
        if (this.progressData.heartRateHistory.length > 50) {
          this.progressData.heartRateHistory.shift();
        }
        
        // TODO: Update heart rate graph if needed
      }, 3000);
    }
    
    startCaloriesBurnedSimulation() {
      // Clear existing interval
      if (this.caloriesInterval) {
        clearInterval(this.caloriesInterval);
      }
      
      // Starting calories based on zone intensity
      const zone = this.zones[this.currentZone];
      const baseCaloriesPerMinute = 3 + ((zone.min + zone.max) / 2) / 10;
      
      this.caloriesInterval = setInterval(() => {
        if (this.isPaused) return;
        
        // Calculate calories burned in the last interval (every 15 seconds)
        const caloriesBurned = baseCaloriesPerMinute / 4; // Per 15 seconds
        
        // Update zone calories
        this.progressData.zones[this.currentZone].caloriesBurned += caloriesBurned;
        this.progressData.totalCalories += caloriesBurned;
        
        // Update display
        if (this.displayElements.caloriesDisplay) {
          this.displayElements.caloriesDisplay.textContent = `${Math.floor(this.progressData.totalCalories)} kcal`;
        }
      }, 15000); // Update every 15 seconds
    }
    
    startZoneTimeTracking() {
      // Clear existing interval
      if (this.zoneInterval) {
        clearInterval(this.zoneInterval);
      }
      
      this.zoneInterval = setInterval(() => {
        if (this.isPaused) return;
        
        // Update time spent in current zone
        this.progressData.zones[this.currentZone].timeSpent += 1;
        
        // Format time for display
        const minutes = Math.floor(this.progressData.zones[this.currentZone].timeSpent / 60);
        const seconds = this.progressData.zones[this.currentZone].