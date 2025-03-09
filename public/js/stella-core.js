Copy/**
 * STELLA Core - Space Training Enhancement and Learning Logic Assistant
 * Core AI functionality for the SharedStars training platform
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
        ...options
      };
      
      this.connected = false;
      this.currentModuleType = document.querySelector('[data-module]')?.dataset.module || 'default';
      this.sessionMetrics = {
        heartRate: 0,
        o2Saturation: 0,
        focusScore: 0,
        progressPercentage: 0,
        balance: 0,
        coreStability: 0,
        endurance: 0
      };
      
      // Initialize STELLA
      this.initialize();
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
      
      // Set up event listeners
      this._setupEventListeners();
      
      // Set initial status
      this._updateStatus('connecting');
      
      // Connect to backend
      this._connectToBackend()
        .then(() => {
          this._updateStatus('connected');
          this._fetchUserInfo();
        })
        .catch(error => {
          console.error('Failed to connect to STELLA backend:', error);
          this._updateStatus('error');
        });
    }
    
    /**
     * Get guidance for current activity
     * @param {String} activity - Activity type (e.g., 'endurance', 'balance')
     * @param {Object} metrics - Current metrics
     * @returns {Promise<Object>} Guidance data
     */
    async getGuidance(activity, metrics = {}) {
      try {
        // Merge current session metrics with provided metrics
        const combinedMetrics = {
          ...this.sessionMetrics,
          ...metrics
        };
        
        // For MVP, we'll mock the API call
        if (this.options.mockApi !== false) {
          return this._getMockGuidance(activity, combinedMetrics);
        }
        
        // Call backend API for guidance
        const response = await fetch('/api/ai/guidance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            activity,
            metrics: combinedMetrics
          })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to get guidance: ${response.status}`);
        }
        
        const guidance = await response.json();
        
        // Update UI with guidance
        this._updateGuidance(guidance);
        
        // Dispatch guidance event
        this._dispatchGuidanceEvent(guidance);
        
        return guidance;
      } catch (error) {
        console.error('Error getting STELLA guidance:', error);
        
        // Fallback guidance
        const fallbackGuidance = {
          message: 'Focus on maintaining proper form and breathing during this exercise.',
          actionItems: ['Monitor your breathing', 'Maintain proper posture']
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
      if (!question.trim()) {
        return null;
      }
      
      try {
        // Add user question to conversation UI
        this._addMessageToConversation(question, 'user');
        
        // For MVP, use mock responses
        if (this.options.mockApi !== false) {
          return this._getMockResponse(question);
        }
        
        // Real API call
        const response = await fetch('/api/ai/ask', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ question })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to get response: ${response.status}`);
        }
        
        const { answer } = await response.json();
        
        // Add STELLA's response to conversation UI
        this._addMessageToConversation(answer, 'stella');
        
        return answer;
      } catch (error) {
        console.error('Error asking STELLA:', error);
        
        // Fallback response
        const fallbackResponse = "I apologize, but I'm having trouble processing your question right now. Let's focus on your training for now, and I'll be fully operational soon.";
        this._addMessageToConversation(fallbackResponse, 'stella');
        
        return fallbackResponse;
      }
    }
    
    /**
     * Update current session metrics
     * @param {Object} metrics - Updated metrics
     */
    updateMetrics(metrics) {
      this.sessionMetrics = {
        ...this.sessionMetrics,
        ...metrics
      };
      
      // Dispatch metrics update event
      this._dispatchMetricsEvent(this.sessionMetrics);
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
     * PRIVATE: Set up event listeners
     * @private
     */
    _setupEventListeners() {
      // Send button click
      if (this.sendButton) {
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
        default:
          this.statusElement.classList.add('bg-red-500');
          if (this.messageElement) {
            this.messageElement.innerHTML = 'STELLA: <span class="text-red-400">Connection error</span>';
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
                  message: 'For plank exercises, focus on maintaining a straight line from head to heels. Don\'t let your hips sag.',
                  actionItems: [
                    'Engage your core by pulling your belly button toward your spine',
                    'Keep your neck in a neutral position',
                    'Distribute your weight evenly'
                  ],
                  priority: 'normal',
                  relatedExercises: ['side-planks', 'dynamic-planks']
                };
                
              case 'stability-ball':
                return {
                  message: 'Stability ball exercises improve core engagement and proprioception. Focus on controlled movements.',
                  actionItems: [
                    'Move slowly and deliberately',
                    'Keep your core engaged throughout the exercise',
                    'Focus on balance rather than speed'
                  ],
                  priority: 'normal',
                  relatedExercises: ['bosu-balance', 'swiss-ball-pikes']
                };
                
              case 'single-leg':
                return {
                  message: 'Single-leg exercises are excellent for improving balance and stability. Focus on a fixed point to maintain balance.',
                  actionItems: [
                    'Engage your core for better stability',
                    'Keep your standing knee slightly bent',
                    'Focus your gaze on a fixed point'
                  ],
                  priority: 'normal',
                  relatedExercises: ['single-leg-deadlift', 'pistol-squats']
                };
                
              case 'zero-g-adaptation':
                return {
                  message: 'Zero-G adaptation exercises help prepare your vestibular system for microgravity conditions. These are critical for preventing space sickness.',
                  actionItems: [
                    'Complete the full range of head movements slowly',
                    'If dizziness occurs, pause briefly then continue',
                    'Gradually increase duration with each session'
                  ],
                  priority: 'high',
                  relatedExercises: ['vestibular-habituation', 'rotation-training']
                };
                
              case 'resistance-training':
                return {
                  message: 'Resistance training is vital for maintaining muscle mass during space missions. Focus on compound movements that engage multiple muscle groups.',
                  actionItems: [
                    'Maintain controlled eccentric (lowering) phases',
                    'Focus on time under tension rather than repetitions',
                    'Ensure balanced development of antagonist muscle groups'
                  ],
                  priority: 'normal',
                  relatedExercises: ['squats', 'pull-ups', 'bench-press']
                };
                
              default:
                return {
                  message: 'I\'m monitoring your form and performance. Focus on maintaining proper technique throughout this exercise.',
                  actionItems: [
                    'Maintain proper breathing',
                    'Focus on quality over quantity',
                    'Pay attention to form'
                  ],
                  priority: 'normal'
                };
            }
            
          case 'zone':
            const zoneId = metrics.zoneId || '';
            switch (zoneId) {
              case 'recovery':
                return {
                  message: 'You\'re in the recovery zone. This builds your aerobic base and helps with active recovery.',
                  actionItems: [
                    'Focus on steady, rhythmic breathing',
                    'Maintain a conversation pace',
                    'Use this zone for longer duration training'
                  ],
                  priority: 'low',
                  targetHeartRate: '50-60% of max'
                };
                
              case 'endurance':
                return {
                  message: 'You\'re in the endurance zone. This is where you build cardiovascular efficiency and stamina.',
                  actionItems: [
                    'Focus on maintaining this intensity level',
                    'This is your primary training zone for aerobic development',
                    'Monitor your breathing pattern'
                  ],
                  priority: 'normal',
                  targetHeartRate: '60-70% of max'
                };
                
              case 'threshold':
                return {
                  message: 'You\'re in the threshold zone. This is challenging but sustainable intensity that improves your lactate threshold.',
                  actionItems: [
                    'This intensity should feel challenging but sustainable',
                    'Focus on consistent pacing',
                    'Pay attention to your breathing rhythm'
                  ],
                  priority: 'medium',
                  targetHeartRate: '70-80% of max'
                };
                
              case 'hiit':
                return {
                  message: 'You\'re in the high-intensity zone. This builds maximum cardiovascular capacity but should be used sparingly.',
                  actionItems: [
                    'This is a high-stress zone - use it strategically',
                    'Focus on quality recovery between intervals',
                    'Push your limits but maintain form'
                  ],
                  priority: 'high',
                  targetHeartRate: '80-90% of max'
                };
                
              case 'vo2max':
                return {
                  message: 'You\'re approaching your VO2max zone. This intensity is very demanding and should be used in short intervals only.',
                  actionItems: [
                    'Keep intervals in this zone brief (30-90 seconds)',
                    'Ensure complete recovery between efforts',
                    'Monitor for signs of overexertion'
                  ],
                  priority: 'high',
                  targetHeartRate: '90-100% of max'
                };
                
              default:
                return {
                  message: 'I\'m monitoring your heart rate and cardiovascular metrics. Stay within your target zone for optimal training.',
                  actionItems: [
                    'Monitor your breathing pattern',
                    'Stay hydrated',
                    'Pace yourself appropriately'
                  ],
                  priority: 'normal'
                };
            }
            
          case 'session-start':
            // Personalized session start guidance
            const userName = metrics.userName || 'Cadet';
            
            return {
              message: `Welcome to your training session, ${userName}. I'll be monitoring your progress and providing real-time guidance. Let's begin with a proper warm-up.`,
              actionItems: [
                'Start with 5 minutes of light cardio to elevate your heart rate',
                'Follow with dynamic stretching for major muscle groups',
                'Complete specific warm-up exercises for today\'s training focus'
              ],
              priority: 'normal',
              sessionType: metrics.sessionType || 'general'
            };
            
          case 'session-end':
            // Calculate session effectiveness based on metrics
            const effectivenessScore = this._calculateSessionEffectiveness(metrics);
            const effectivenessRating = effectivenessScore > 85 ? 'excellent' : effectivenessScore > 70 ? 'good' : effectivenessScore > 50 ? 'moderate' : 'needs improvement';
            
            return {
              message: `Great work! You've completed your training session with ${effectivenessRating} effectiveness. Your form quality and consistency have shown improvement.`,
              actionItems: [
                'Complete a proper cool-down with static stretching',
                'Hydrate and consider protein intake within the next 30 minutes',
                'Review your session metrics in your training log'
              ],
              priority: 'normal',
              sessionStats: {
                duration: metrics.sessionDuration || '00:30:00',
                effectiveness: effectivenessScore,
                caloriesBurned: metrics.calories || 350,
                focusScore: metrics.focusScore || 85
              }
            };
            
          case 'progress-update':
            // Generate progress insight based on historical data
            return {
              message: 'I\'ve analyzed your progress over the past week. Your core stability has improved by 12%, and your balance metrics are showing consistent improvement.',
              actionItems: [
                'Continue focusing on vestibular adaptation exercises',
                'Increase resistance training frequency to 3x weekly',
                'Your next assessment is scheduled in 5 days'
              ],
              priority: 'normal',
              progressStats: {
                strengths: ['Core stability', 'Endurance'],
                improvements: ['Balance', 'Reaction time'],
                weeklyChange: '+8% overall'
              }
            };
            
          default:
            return {
              message: 'I\'m here to help guide your training. Let me know if you need specific assistance.',
              actionItems: [
                'Focus on proper form',
                'Stay hydrated',
                'Listen to your body'
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
        
        // Track user questions for learning
        this._trackUserQuestion(question);
        
        // Check for common questions and provide responses
        if (lowerQuestion.includes('heart rate') || lowerQuestion.includes('target zone')) {
          const response = "Your target heart rate depends on your training goal. For endurance training, aim for 60-70% of your maximum heart rate. For threshold training, aim for 70-80%. Your current heart rate is within your target zone.";
          this._addMessageToConversation(response, 'stella');
          return response;
        }
        
        if (lowerQuestion.includes('form') || lowerQuestion.includes('technique')) {
          const response = "For optimal form, focus on engaging your core throughout the exercise. Keep your spine neutral and breathe steadily. I'm monitoring your form and it's improving with each session.";
          this._addMessageToConversation(response, 'stella');
          return response;
        }
        
        if (lowerQuestion.includes('progress') || lowerQuestion.includes('improving')) {
          const response = "You're making steady progress! Your core stability has improved by 15% since your last session, and your balance metrics are showing consistent improvement. Keep up the good work!";
          this._addMessageToConversation(response, 'stella');
          return response;
        }
        
        if (lowerQuestion.includes('next') || lowerQuestion.includes('recommendation')) {
          const response = "Based on your current progress, I recommend focusing on the Endurance Training module next. This will complement your core and balance work and help build your overall space readiness.";
          this._addMessageToConversation(response, 'stella');
          return response;
        }
        
        if (lowerQuestion.includes('space') || lowerQuestion.includes('zero-g') || lowerQuestion.includes('zero g') || lowerQuestion.includes('microgravity')) {
          const response = "Microgravity training is critical for space readiness. Your vestibular adaptation exercises are specifically designed to prepare your body for the disorientation many astronauts experience in zero-G. Continue with the rotational exercises to build tolerance.";
          this._addMessageToConversation(response, 'stella');
          return response;
        }
  
        if (lowerQuestion.includes('muscle') || lowerQuestion.includes('strength') || lowerQuestion.includes('atrophy')) {
          const response = "Muscle atrophy is a significant challenge in spaceflight. Your resistance training program is designed to minimize muscle loss through targeted high-intensity exercises. I recommend increasing your protein intake to 1.6-1.8g per kg of body weight to support muscle maintenance.";
          this._addMessageToConversation(response, 'stella');
          return response;
        }
  
        if (lowerQuestion.includes('bone') || lowerQuestion.includes('density') || lowerQuestion.includes('calcium')) {
          const response = "Bone density loss is a serious concern in microgravity. Your training includes impact exercises and resistance training to maintain bone health. I've also noted recommendations for vitamin D and calcium supplementation in your personalized nutrition plan.";
          this._addMessageToConversation(response, 'stella');
          return response;
        }
  
        if (lowerQuestion.includes('plan') || lowerQuestion.includes('schedule') || lowerQuestion.includes('training plan')) {
          const response = "Your personalized training plan incorporates all critical elements for space readiness: cardiovascular endurance, resistance training, vestibular adaptation, and neuromuscular coordination. This week's focus is on improving your balance and coordination in simulated altered gravity conditions.";
          this._addMessageToConversation(response, 'stella');
          return response;
        }
  
        if (lowerQuestion.includes('eva') || lowerQuestion.includes('spacewalk') || lowerQuestion.includes('extravehicular')) {
          const response = "EVA training requires exceptional upper body strength, fine motor control, and cardiovascular endurance. Your current program includes specific exercises that mimic the demands of maneuvering in a pressurized suit. I recommend adding the grip strength exercises to your routine to prepare for tool manipulation during spacewalks.";
          this._addMessageToConversation(response, 'stella');
          return response;
        }
  
        if (lowerQuestion.includes('stellarx') || lowerQuestion.includes('advanced') || lowerQuestion.includes('next level')) {
          const response = "The StellarX advanced training modules will become available once you complete Level 2 certification. These include simulated mission scenarios, emergency response protocols, and specialized role training. Based on your current progress, you should be eligible for StellarX access in approximately 3 weeks.";
          this._addMessageToConversation(response, 'stella');
          return response;
        }
        
        // More contextual questions about specific training
        if (lowerQuestion.includes('balance') || lowerQuestion.includes('stability')) {
          const response = "Balance training is critical for astronauts to adapt quickly to changing gravitational environments. Your vestibular system needs to be trained to maintain spatial orientation in microgravity. I recommend incorporating the vestibular habituation exercises 3 times per week.";
          this._addMessageToConversation(response, 'stella');
          return response;
        }
        
        if (lowerQuestion.includes('cardio') || lowerQuestion.includes('endurance') || lowerQuestion.includes('aerobic')) {
          const response = "Cardiovascular endurance is essential for EVA operations and overall mission performance. Your current endurance metrics show good progress, but I recommend increasing your Zone 2 training duration by 10% each week to prepare for the sustained effort required during spacewalks.";
          this._addMessageToConversation(response, 'stella');
          return response;
        }
        
        if (lowerQuestion.includes('recovery') || lowerQuestion.includes('rest') || lowerQuestion.includes('overtraining')) {
          const response = "Recovery is a critical component of effective training. Your current metrics indicate adequate recovery between sessions, but your sleep quality could be improved. I recommend implementing the pre-sleep relaxation protocol outlined in your recovery module to optimize adaptation and prevent overtraining.";
          this._addMessageToConversation(response, 'stella');
          return response;
        }
        
        if (lowerQuestion.includes('nutrition') || lowerQuestion.includes('diet') || lowerQuestion.includes('eating')) {
          const response = "Space nutrition requires careful consideration of nutrient density, shelf stability, and digestibility. Your current nutrition plan emphasizes anti-inflammatory foods, adequate protein for muscle maintenance, and nutrients that support bone health. I recommend increasing your intake of omega-3 fatty acids to support cognitive function during training.";
          this._addMessageToConversation(response, 'stella');
          return response;
        }
        
        // Default response for other questions
        const defaultResponse = "I'm here to help with your space training journey. Your current training is focused on building the fundamental physical capabilities needed for space travel. Keep focusing on proper form and consistent practice. If you have specific questions about any aspect of your training, don't hesitate to ask.";
        this._addMessageToConversation(defaultResponse, 'stella');
        return defaultResponse;
      }
      
     /**
 * Track user questions to improve STELLA's responses
 * @param {String} question - User's question
 * @private
 */
_trackUserQuestion(question) {
  // In a real implementation, this would send the question to a learning system
  // For now, just store locally if localStorage is available
  if (window.localStorage) {
    try {
      // Get existing questions
      const existingQuestions = JSON.parse(localStorage.getItem('stella_user_questions') || '[]');
      
      // Add new question with timestamp
      existingQuestions.push({
        question,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 50 questions
      const recentQuestions = existingQuestions.slice(-50);
      
      // Save back to localStorage
      localStorage.setItem('stella_user_questions', JSON.stringify(recentQuestions));
    } catch (error) {
      console.warn('Error storing user question:', error);
    }
  }
}

getPersonalizedRecommendations(userData = {}) {
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
};
