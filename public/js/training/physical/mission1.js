// public/js/training/physical/mission1.js
class CoreBalanceTracker {
    constructor() {
      this.metrics = {
        coreEngagement: 0,
        balance: 0,
        stability: 0,
        posture: 0
      };
      this.sessionId = null;
      this.active = false;
    }
  
    async initialize() {
      // Connect to STELLA
      if (window.stellaCore) {
        window.stellaCore.initialize({
          trainingType: 'core-balance',
          adaptiveLearning: true
        });
      }
      
      this.setupExerciseButtons();
      this.setupMetricsTracking();
      this.startSession();
    }
  
    async startSession() {
      try {
        const response = await fetch('/training/physical/mission/1/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          this.sessionId = data.sessionId;
          this.active = true;
          console.log('Session started:', this.sessionId);
          
          // Start metrics update interval
          this.startMetricsInterval();
        }
      } catch (error) {
        console.error('Error starting session:', error);
      }
    }
  
    setupExerciseButtons() {
      const exerciseButtons = document.querySelectorAll('.exercise-card button:not(.cursor-not-allowed)');
      
      exerciseButtons.forEach(button => {
        button.addEventListener('click', () => {
          const exerciseCard = button.closest('.exercise-card');
          const exerciseType = exerciseCard?.dataset.exercise;
          
          if (!exerciseType) return;
          
          // Change button text to indicate exercise is active
          button.textContent = button.textContent.trim() === 'Start Exercise' ? 
            'In Progress...' : 'Start Exercise';
            
          // Toggle active class
          exerciseCard.classList.toggle('ring');
          exerciseCard.classList.toggle('ring-blue-500');
          
          // Update metrics based on exercise type
          this.updateExerciseMetrics(exerciseType);
        });
      });
    }
  
    setupMetricsTracking() {
      // Set up any needed event listeners for tracking metrics
    }
  
    updateExerciseMetrics(exerciseType) {
      // Update metrics based on exercise type
      let metrics = {};
      
      switch(exerciseType) {
        case 'planks':
          metrics = {
            coreEngagement: 85 + Math.random() * 10,
            posture: 80 + Math.random() * 15,
            exerciseType
          };
          break;
        case 'stability-ball':
          metrics = {
            balance: 75 + Math.random() * 15,
            stability: 70 + Math.random() * 20,
            exerciseType
          };
          break;
        case 'single-leg':
          metrics = {
            balance: 80 + Math.random() * 15,
            stability: 85 + Math.random() * 10,
            exerciseType
          };
          break;
      }
      
      // Send metrics to server
      this.sendMetrics(metrics);
    }
  
    async sendMetrics(metrics) {
      if (!this.sessionId || !this.active) return;
      
      try {
        const response = await fetch('/training/physical/mission/1/metrics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sessionId: this.sessionId,
            metrics
          })
        });
        
        const data = await response.json();
        
        if (data.success && data.feedback) {
          this.updateFeedbackDisplay(data.feedback);
        }
      } catch (error) {
        console.error('Error sending metrics:', error);
      }
    }
  
    startMetricsInterval() {
      // Send periodic updates
      this.metricsInterval = setInterval(() => {
        if (!this.active) return;
        
        // Generate some simulated metrics
        const metrics = {
          coreEngagement: 70 + Math.random() * 20,
          balance: 65 + Math.random() * 25,
          stability: 75 + Math.random() * 15,
          posture: 80 + Math.random() * 10,
          timestamp: Date.now()
        };
        
        // Update UI display
        this.updateMetricsDisplay(metrics);
        
        // Send to server
        this.sendMetrics(metrics);
      }, 5000);
    }
  
    updateMetricsDisplay(metrics) {
      // Update the UI with new metrics
      const coreElement = document.getElementById('core-engagement');
      if (coreElement) coreElement.textContent = `${Math.round(metrics.coreEngagement)}%`;
      
      const balanceElement = document.getElementById('balance-score');
      if (balanceElement) balanceElement.textContent = `${Math.round(metrics.balance)}%`;
      
      const stabilityElement = document.getElementById('stability-score');
      if (stabilityElement) stabilityElement.textContent = `${Math.round(metrics.stability)}%`;
      
      const postureElement = document.getElementById('posture-score');
      if (postureElement) postureElement.textContent = `${Math.round(metrics.posture)}%`;
    }
  
    updateFeedbackDisplay(feedback) {
      // Update STELLA feedback display
      const feedbackElement = document.getElementById('stella-balance-feedback');
      if (feedbackElement && feedback.message) {
        feedbackElement.innerHTML = `
          <p>${feedback.message}</p>
          ${feedback.corrections ? `
            <ul class="mt-2 space-y-1 list-disc list-inside">
              ${feedback.corrections.map(correction => `<li class="text-yellow-300">${correction}</li>`).join('')}
            </ul>
          ` : ''}
          ${feedback.recommendations ? `
            <ul class="mt-2 space-y-1 list-disc list-inside">
              ${feedback.recommendations.map(rec => `<li class="text-green-300">${rec}</li>`).join('')}
            </ul>
          ` : ''}
        `;
      }
      
      // Also update STELLA guidance area if it exists
      const guidanceElement = document.getElementById('stella-guidance');
      if (guidanceElement && feedback.message) {
        guidanceElement.innerHTML = `
          <div class="bg-blue-500/10 rounded-lg p-3">
            <p class="text-sm text-blue-300">${feedback.message}</p>
          </div>
        `;
      }
    }
  
    async completeSession() {
      if (!this.sessionId || !this.active) return;
      
      try {
        const performanceData = {
          coreEngagement: 85,
          balance: 78,
          stability: 80,
          posture: 82,
          duration: 1200, // 20 minutes in seconds
          exercises: ['planks', 'stability-ball', 'single-leg']
        };
        
        const response = await fetch('/training/physical/mission/1/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sessionId: this.sessionId,
            performanceData
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Show completion UI
          alert(`Session completed! You earned ${data.credits?.totalEarned || 0} credits.`);
          
          // Redirect to physical training overview
          setTimeout(() => {
            window.location.href = '/training/physical';
          }, 3000);
        }
      } catch (error) {
        console.error('Error completing session:', error);
      }
    }
  
    cleanup() {
      this.active = false;
      if (this.metricsInterval) {
        clearInterval(this.metricsInterval);
      }
    }
  }
  
  // Initialize on page load
  document.addEventListener('DOMContentLoaded', () => {
    const tracker = new CoreBalanceTracker();
    tracker.initialize();
    
    // Set up complete button
    const completeButton = document.getElementById('complete-mission');
    if (completeButton) {
      completeButton.addEventListener('click', () => {
        tracker.completeSession();
      });
    }
    
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      tracker.cleanup();
    });
  });