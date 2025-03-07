// public/js/training/physical/coreBalanceTraining.js
class CoreBalanceTracker extends MissionTracker {
    constructor() {
      super('core-balance');
      this.exerciseData = null;
      this.breathingInterval = null;
      this.heartRateInterval = null;
    }
    
    initialize() {
      super.initialize();
      
      // Add specific event listeners for core & balance mission
      this.setupBreathingGuide();
      this.setupExerciseControls();
      this.setupHeartRateMonitor();
      this.setupSocialSharing();
    }
    
    setupBreathingGuide() {
      const breathInstruction = document.getElementById('breath-instruction');
      if (!breathInstruction) return;
      
      this.startBreathingGuide = () => {
        let phase = "inhale";
        breathInstruction.textContent = "Breathe in deeply...";
        
        this.breathingInterval = setInterval(() => {
          if (phase === "inhale") {
            phase = "hold";
            breathInstruction.textContent = "Hold...";
          } else if (phase === "hold") {
            phase = "exhale";
            breathInstruction.textContent = "Breathe out slowly...";
          } else {
            phase = "inhale";
            breathInstruction.textContent = "Breathe in deeply...";
          }
        }, 2000);
      };
    }
    
    setupExerciseControls() {
      // Add core & balance specific event handlers
      const startButton = document.getElementById('start-btn');
      if (startButton) {
        startButton.addEventListener('click', () => {
          if (this.startBreathingGuide) {
            this.startBreathingGuide();
          }
          this.startExerciseSession();
        });
      }
      
      const nextButton = document.getElementById('next-btn');
      if (nextButton) {
        nextButton.addEventListener('click', () => {
          // Update exercise index
          const currentIndex = this.progressData.currentExerciseIndex || 0;
          this.updateCurrentExercise(currentIndex + 1);
          
          // Update progress
          const progressPercentage = ((currentIndex + 1) / 5) * 100; // Assuming 5 exercises
          this.updateProgress(progressPercentage);
          
          // Award credits
          this.awardCredits(30);
        });
      }
      
      const checkStatusButton = document.getElementById('check-status-btn');
      if (checkStatusButton) {
        checkStatusButton.addEventListener('click', () => {
          this.showAIFeedback();
        });
      }
      
      // Difficulty selector handling
      const difficultyButtons = document.querySelectorAll('.difficulty-btn');
      difficultyButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          const level = e.target.getAttribute('data-level');
          this.setDifficulty(level);
          
          // Update UI
          difficultyButtons.forEach(btn => btn.classList.remove('active'));
          e.target.classList.add('active');
        });
      });
    }
    
    setupHeartRateMonitor() {
      // Simulated heart rate monitoring
      const heartRateDisplay = document.getElementById('heart-rate-display');
      if (heartRateDisplay) {
        this.heartRateInterval = setInterval(() => {
          // Simulate heart rate between 70-85 bpm
          const heartRate = 70 + Math.floor(Math.random() * 15);
          heartRateDisplay.textContent = `${heartRate} bpm`;
        }, 3000);
      }
    }
    
    setupSocialSharing() {
      // Set up social sharing buttons
      const shareTwitter = document.getElementById('share-twitter');
      if (shareTwitter) {
        shareTwitter.addEventListener('click', () => {
          const text = encodeURIComponent('I just completed a Core & Balance training session on SharedStars! #SpaceTraining #SharedStars');
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
          const title = encodeURIComponent('Core & Balance Training - SharedStars');
          window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}`, '_blank');
        });
      }
    }
    
    startExerciseSession() {
      this.progressData.startTime = new Date();
      
      // Initialize session with STELLA AI if available
      if (window.stellaCore && typeof window.stellaCore.initialize === 'function') {
        window.stellaCore.initialize({
          trainingType: 'core-balance',
          adaptiveLearning: true,
          userLevel: this.progressData.difficultyLevel || 'beginner'
        });
      }
      
      // Start session timer
      const sessionTimer = document.getElementById('session-timer');
      const footerDuration = document.getElementById('footer-duration');
      
      if (sessionTimer || footerDuration) {
        this.sessionInterval = setInterval(() => {
          const elapsed = new Date() - this.progressData.startTime;
          const seconds = Math.floor((elapsed / 1000) % 60);
          const minutes = Math.floor((elapsed / (1000 * 60)) % 60);
          const hours = Math.floor(elapsed / (1000 * 60 * 60));
          
          const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          
          if (sessionTimer) sessionTimer.textContent = timeString;
          if (footerDuration) footerDuration.textContent = timeString;
        }, 1000);
      }
      
      // Show toast notification
      this.showToast('Mission started! Focus on proper form.');
      
      // Log to server
      this.logActivity('mission_start', {
        missionId: 'core-balance',
        difficulty: this.progressData.difficultyLevel || 'beginner'
      });
    }
    
    updateCurrentExercise(index) {
      this.progressData.currentExerciseIndex = index;
      const totalExercises = 5; // Assuming 5 exercises per mission
      
      // Update display
      const footerExercises = document.getElementById('footer-exercises');
      if (footerExercises) {
        footerExercises.textContent = `${index + 1}/${totalExercises}`;
      }
      
      // Show toast
      this.showToast(`Exercise ${index + 1} of ${totalExercises}`);
    }
    
    setDifficulty(level) {
      this.progressData.difficultyLevel = level;
      
      // Log to server
      this.logActivity('difficulty_change', {
        missionId: 'core-balance',
        difficulty: level
      });
      
      // Show toast
      this.showToast(`Difficulty set to ${level}`);
    }
    
    awardCredits(amount) {
      this.progressData.credits = (this.progressData.credits || 0) + amount;
      
      // Update display
      const creditsEarned = document.getElementById('footer-credits');
      if (creditsEarned) {
        creditsEarned.textContent = this.progressData.credits;
      }
      
      // Show toast
      this.showToast(`+${amount} credits earned!`);
      
      // Log to server
      this.logActivity('credits_earned', {
        missionId: 'core-balance',
        amount: amount,
        total: this.progressData.credits
      });
    }
    
    showAIFeedback() {
      const stellaFeedback = document.getElementById('stella-feedback');
      const stellaFeedbackContent = document.getElementById('stella-feedback-content');
      
      if (stellaFeedback && stellaFeedbackContent) {
        stellaFeedback.style.display = 'block';
        
        // Generate performance score
        const currentProgress = this.progressData.progress || 0;
        const performanceScore = document.getElementById('performance-score');
        if (performanceScore && currentProgress > 0) {
          const baseScore = 70 + Math.floor(Math.random() * 20);
          performanceScore.textContent = `${baseScore}%`;
        }
        
        // Update certification progress
        const certProgress = document.getElementById('certification-progress');
        if (certProgress) {
          certProgress.textContent = currentProgress >= 50 ? '1/3' : '0/3';
        }
        
        // Update points earned
        const pointsEarned = document.getElementById('points-earned');
        if (pointsEarned) {
          pointsEarned.textContent = Math.floor(currentProgress * 1.5);
        }
        
        // Get AI feedback from STELLA if available
        if (window.stellaCore && typeof window.stellaCore.getGuidance === 'function') {
          window.stellaCore.getGuidance({
            context: 'feedback',
            progress: currentProgress,
            exerciseType: 'core-balance',
            difficulty: this.progressData.difficultyLevel || 'beginner'
          }).then(guidance => {
            if (guidance && guidance.message) {
              stellaFeedbackContent.innerHTML = `
                <p class="text-green-300 font-bold mb-2">Training Analysis</p>
                <p class="text-gray-300 mb-4">${guidance.message}</p>
                ${guidance.actionItems && guidance.actionItems.length > 0 ? `
                  <p class="text-blue-300 font-bold mb-2">Recommendations:</p>
                  <ul class="list-disc pl-5 space-y-1 text-gray-300">
                    ${guidance.actionItems.map(tip => `<li>${tip}</li>`).join('')}
                  </ul>
                ` : ''}
              `;
            }
          }).catch(err => {
            console.error('Error getting AI guidance:', err);
            this.showFallbackFeedback(stellaFeedbackContent);
          });
        } else {
          this.showFallbackFeedback(stellaFeedbackContent);
        }
      }
    }
    
    showFallbackFeedback(contentElement) {
      contentElement.innerHTML = `
        <p class="text-green-300 font-bold mb-2">Training Analysis</p>
        <p class="text-gray-300 mb-4">You're making good progress! Your core stability is improving steadily. Continue focusing on proper form for best results.</p>
        <p class="text-blue-300 font-bold mb-2">Recommendations:</p>
        <ul class="list-disc pl-5 space-y-1 text-gray-300">
          <li>Focus on maintaining tension in your core throughout all exercises</li>
          <li>Try to keep your breathing steady and controlled during holds</li>
          <li>Consider adding 5 seconds to your plank duration in your next session</li>
        </ul>
      `;
    }
    
    showToast(message) {
      const toast = document.getElementById('toast-message');
      if (toast) {
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
          toast.classList.remove('show');
        }, 3000);
      }
    }
    
    logActivity(action, data = {}) {
      try {
        // Log to server if available
        if (window.fetch) {
          fetch('/api/training/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action,
              timestamp: new Date().toISOString(),
              ...data
            })
          }).catch(err => console.warn('Error logging activity:', err));
        }
      } catch (e) {
        console.warn('Error logging activity:', e);
      }
    }
    
    cleanup() {
      super.cleanup();
      
      // Clear intervals if active
      if (this.breathingInterval) {
        clearInterval(this.breathingInterval);
      }
      
      if (this.heartRateInterval) {
        clearInterval(this.heartRateInterval);
      }
      
      if (this.sessionInterval) {
        clearInterval(this.sessionInterval);
      }
    }
  }
  
  // Initialize on page load
  document.addEventListener('DOMContentLoaded', () => {
    const tracker = new CoreBalanceTracker();
    tracker.initialize();
    
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      tracker.cleanup();
    });
  });