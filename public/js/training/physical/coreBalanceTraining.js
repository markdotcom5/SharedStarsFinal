// public/js/training/physical/coreBalanceTracker.js
class CoreBalanceTracker extends MissionTracker {
  constructor() {
    super('core-balance');
    this.exerciseData = null;
    this.breathingInterval = null;
    this.heartRateInterval = null;
    this.sessionInterval = null;
    
    // Add new properties for enhanced features
    this.requirements = {
      equipment: ['equipment-1', 'equipment-2', 'equipment-3', 'equipment-4'],
      preparation: ['prep-1', 'prep-2', 'prep-3', 'prep-4']
    };
    this.visualizations = {};
    this.leaderboardData = null;
    this.journeyStep = 1;
  }
  
  initialize() {
    super.initialize();
    
    // Load user progress and preferences
    this.loadUserProgress();
    
    // Initialize circular progress
    this.initCircularProgress();
    
    // Add specific event listeners for core & balance mission
    this.setupRequirementsChecklist();
    this.setupBreathingGuide();
    this.setupExerciseControls();
    this.setupHeartRateMonitor();
    this.setupSocialSharing();
    this.setupJourneyTimeline();
    this.loadLeaderboardData();
    this.setupModalEvents();
    
    // Initialize visualizations
    this.initVisualizations();
  }
  
  loadUserProgress() {
    // In production, this would load from server
    // For now, we'll use localStorage with fallback to default values
    try {
      const savedProgress = localStorage.getItem('core-balance-progress');
      if (savedProgress) {
        this.progressData = JSON.parse(savedProgress);
        this.updateProgressUI();
      } else {
        // Set defaults
        this.progressData = {
          progress: 0,
          credits: 0,
          currentExerciseIndex: 0,
          completedSessions: [],
          difficultyLevel: 'beginner',
          requirementsCompleted: {
            equipment: [],
            preparation: []
          },
          journeyStep: 1
        };
      }
      
      // Update requirements checklist based on saved data
      if (this.progressData.requirementsCompleted) {
        Object.keys(this.progressData.requirementsCompleted).forEach(category => {
          this.progressData.requirementsCompleted[category].forEach(item => {
            const checkbox = document.querySelector(`input[data-requirement="${item}"]`);
            if (checkbox) checkbox.checked = true;
          });
        });
      }
      
      // Update journey step
      this.journeyStep = this.progressData.journeyStep || 1;
      this.updateJourneyUI();
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  }
  
  updateProgressUI() {
    // Update progress indicators
    const progress = this.progressData.progress || 0;
    const credits = this.progressData.credits || 0;
    
    // Update progress bar
    const progressBar = document.getElementById('mission-progress');
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
    
    // Update progress text
    const progressText = document.getElementById('mission-progress-text');
    if (progressText) {
      progressText.textContent = `${Math.round(progress)}%`;
    }
    
    // Update circular progress
    this.updateCircularProgress(progress);
    
    // Update credits
    const creditsEarned = document.getElementById('credits-earned');
    if (creditsEarned) {
      creditsEarned.textContent = credits;
    }
    
    // Update session progress
    this.progressData.completedSessions?.forEach(sessionId => {
      const sessionProgress = document.querySelector(`.session-progress[data-session="${sessionId}"]`);
      if (sessionProgress) {
        sessionProgress.style.width = '100%';
        
        const sessionCard = sessionProgress.closest('.session-card');
        if (sessionCard) {
          const statusText = sessionCard.querySelector('.session-status');
          const completionText = sessionCard.querySelector('.session-completion');
          const sessionButton = sessionCard.querySelector('.session-button');
          
          if (statusText) statusText.textContent = 'Completed';
          if (completionText) completionText.textContent = '100% Complete';
          if (sessionButton) {
            sessionButton.textContent = 'Review Session';
            sessionButton.classList.remove('button-primary');
            sessionButton.classList.add('button-secondary');
          }
        }
      }
    });
    
    // Update mission status
    const missionStatus = document.getElementById('mission-status');
    if (missionStatus) {
      if (progress >= 100) {
        missionStatus.textContent = 'Completed';
        missionStatus.classList.add('text-green-400');
      } else if (progress > 0) {
        missionStatus.textContent = 'In Progress';
        missionStatus.classList.add('text-yellow-400');
      }
    }
    
    // Update certification status if completed
    if (progress >= 100) {
      const certStatus = document.getElementById('certification-status');
      if (certStatus) {
        certStatus.textContent = 'Certified';
        certStatus.classList.add('text-green-400');
      }
    }
  }
  
  saveUserProgress() {
    try {
      localStorage.setItem('core-balance-progress', JSON.stringify(this.progressData));
      console.log('Progress saved successfully');
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }
  
  initCircularProgress() {
    const circleProgress = document.getElementById('mission-circle-progress');
    if (!circleProgress) return;
    
    const circle = circleProgress.querySelector('circle.progress-circle');
    const percentage = circleProgress.querySelector('.progress-percentage');
    
    if (!circle || !percentage) return;
    
    // Calculate circle properties
    const radius = parseInt(circle.getAttribute('r'));
    const circumference = 2 * Math.PI * radius;
    
    // Set initial circumference
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    
    // Update with current progress
    const progress = this.progressData.progress || 0;
    const offset = circumference - (progress / 100) * circumference;
    circle.style.strokeDashoffset = offset;
    
    percentage.textContent = `${progress}%`;
  }
  
  updateCircularProgress(value) {
    const circleProgress = document.getElementById('mission-circle-progress');
    if (!circleProgress) return;
    
    const circle = circleProgress.querySelector('circle.progress-circle');
    const percentage = circleProgress.querySelector('.progress-percentage');
    
    if (!circle || !percentage) return;
    
    // Calculate circle properties
    const radius = parseInt(circle.getAttribute('r'));
    const circumference = 2 * Math.PI * radius;
    
    // Update with new progress
    const offset = circumference - (value / 100) * circumference;
    circle.style.strokeDashoffset = offset;
    percentage.textContent = `${value}%`;
  }
  
  setupRequirementsChecklist() {
    const checkboxes = document.querySelectorAll('.checklist-checkbox');
    const saveRequirementsBtn = document.getElementById('save-requirements');
    
    if (checkboxes.length > 0) {
      checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
          this.updateRequirementsProgress();
        });
      });
    }
    
    if (saveRequirementsBtn) {
      saveRequirementsBtn.addEventListener('click', () => {
        this.saveRequirements();
      });
    }
    
    // Initialize requirements progress
    this.updateRequirementsProgress();
  }
  
  updateRequirementsProgress() {
    const totalRequirements = document.getElementById('total-requirements');
    const completedRequirements = document.getElementById('completed-requirements');
    const progressBar = document.getElementById('requirements-progress');
    
    if (!totalRequirements || !completedRequirements || !progressBar) return;
    
    const checkboxes = document.querySelectorAll('.checklist-checkbox');
    const totalCount = checkboxes.length;
    const completedCount = Array.from(checkboxes).filter(checkbox => checkbox.checked).length;
    
    totalRequirements.textContent = totalCount;
    completedRequirements.textContent = completedCount;
    
    const progressPercentage = (completedCount / totalCount) * 100;
    progressBar.style.width = `${progressPercentage}%`;
  }
  
  saveRequirements() {
    // Get all checked checkboxes
    const equipmentCheckboxes = document.querySelectorAll('.checklist-checkbox[data-requirement^="equipment-"]');
    const prepCheckboxes = document.querySelectorAll('.checklist-checkbox[data-requirement^="prep-"]');
    
    // Store completed requirements
    this.progressData.requirementsCompleted = {
      equipment: Array.from(equipmentCheckboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.getAttribute('data-requirement')),
      preparation: Array.from(prepCheckboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.getAttribute('data-requirement'))
    };
    
    // Save progress
    this.saveUserProgress();
    
    // Hide requirements checklist if all are completed
    const allCompleted = Array.from(document.querySelectorAll('.checklist-checkbox'))
      .every(checkbox => checkbox.checked);
    
    if (allCompleted) {
      const checklist = document.getElementById('requirements-checklist');
      if (checklist) {
        checklist.classList.add('completed');
        // Optionally hide after animation
        setTimeout(() => {
          checklist.style.display = 'none';
        }, 1000);
      }
    }
    
    // Show toast
    this.showToast('Requirements saved successfully!');
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
    const startButton = document.getElementById('start-mission-btn');
    if (startButton) {
      startButton.addEventListener('click', () => {
        // Check if assessment is completed
        const hasCompletedAssessment = localStorage.getItem('assessment_completed') === 'true';
        if (!hasCompletedAssessment) {
          this.showToast('Please complete your assessment before starting.', 'warning');
          return;
        }
        
        // Check if requirements are completed
        const requiredCount = 4; // Minimum required
        const completedCount = (this.progressData.requirementsCompleted?.equipment?.length || 0) +
                              (this.progressData.requirementsCompleted?.preparation?.length || 0);
        
        if (completedCount < requiredCount) {
          this.showToast('Please complete the requirements checklist first.', 'warning');
          return;
        }
        
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
        
        // Update journey if appropriate
        if (currentIndex + 1 >= 5) { // Completed all exercises
          this.progressData.journeyStep = Math.min(5, this.progressData.journeyStep + 1);
          this.updateJourneyUI();
        }
      });
    }
    
    const checkStatusButton = document.getElementById('check-status-btn');
    if (checkStatusButton) {
      checkStatusButton.addEventListener('click', () => {
        this.showAIFeedback();
      });
    }
    
    // Initialize session buttons
    const sessionButtons = document.querySelectorAll('.session-button');
    if (sessionButtons.length > 0) {
      sessionButtons.forEach(button => {
        button.addEventListener('click', () => {
          if (button.classList.contains('locked')) {
            this.showToast('Complete previous sessions first.', 'warning');
            return;
          }
          
          const sessionId = button.getAttribute('data-session');
          if (!sessionId) return;
          
          // In production, navigate to the session page
          window.location.href = `/sessions/core-balance-${sessionId}.html`;
        });
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
    
    // Track progress button
    const trackProgressBtn = document.getElementById('track-progress-btn');
    if (trackProgressBtn) {
      trackProgressBtn.addEventListener('click', () => {
        // In a full implementation, this would show detailed progress
        // For now, we'll just toggle the feedback modal
        this.showAIFeedback();
      });
    }
  }
  
  setupModalEvents() {
    // Set up feedback modal close button
    const closeModalBtn = document.getElementById('close-feedback-modal');
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => {
        const modal = document.getElementById('feedback-modal');
        if (modal) {
          modal.classList.add('hidden');
        }
      });
    }
  }
  
  setupJourneyTimeline() {
    const journeyNodes = document.querySelectorAll('.journey-node');
    if (journeyNodes.length === 0) return;
    
    // Initialize journey timeline based on current step
    this.updateJourneyUI();
  }
  
  updateJourneyUI() {
    const journeyNodes = document.querySelectorAll('.journey-node');
    if (journeyNodes.length === 0) return;
    
    journeyNodes.forEach(node => {
      const step = parseInt(node.getAttribute('data-step'));
      node.classList.remove('active', 'completed');
      
      if (step < this.journeyStep) {
        node.classList.add('completed');
      } else if (step === this.journeyStep) {
        node.classList.add('active');
      }
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
  
  loadLeaderboardData() {
    // In production, this would fetch from API
    // For now, we'll use mock data
    
    // Get DOM elements
    const userRank = document.getElementById('user-rank');
    const completedMissions = document.getElementById('completed-missions');
    const totalPoints = document.getElementById('total-points');
    const performanceVsAvg = document.getElementById('performance-vs-avg');
    
    // Set mock values (replace with API calls in production)
    if (userRank) {
      userRank.innerHTML = '<span class="rank-number">#42</span> <span class="rank-percentile">Top 15%</span>';
    }
    
    if (completedMissions) {
      completedMissions.textContent = '0/10';
    }
    
    if (totalPoints) {
      totalPoints.textContent = '150';
    }
    
    if (performanceVsAvg) {
      performanceVsAvg.textContent = '+12% above avg';
      performanceVsAvg.classList.add('positive');
    }
  }
  
  initVisualizations() {
    try {
      // Initialize visualizations if available
      if (window.AchievementDisplay) {
        this.visualizations.achievements = new window.AchievementDisplay({
          container: 'achievements-container',
          missionId: 'core-balance'
        });
      }
      
      if (window.ProgressTracker) {
        this.visualizations.progress = new window.ProgressTracker({
          container: 'progress-visualization',
          userId: this.getUserId(),
          missionId: 'core-balance'
        });
      }
      
      if (window.ModuleHighlight) {
        this.visualizations.moduleHighlight = new window.ModuleHighlight({
          container: 'module-highlight',
          missionId: 'core-balance'
        });
      }
    } catch (e) {
      console.warn('Error initializing visualizations:', e);
    }
  }
  
  getUserId() {
    // Get user ID from localStorage or session
    return localStorage.getItem('userId') || 
           sessionStorage.getItem('userId') || 
           'anonymous';
  }
  
  startExerciseSession() {
    this.progressData.startTime = new Date();
    
    // Update mission status
    const missionStatus = document.getElementById('mission-status');
    if (missionStatus) {
      missionStatus.textContent = 'In Progress';
      missionStatus.classList.add('text-yellow-400');
    }
    
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
    
    // Trigger appropriate visualizations
    if (this.visualizations.moduleHighlight) {
      this.visualizations.moduleHighlight.highlightModule(1); // Highlight first module
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
    
    // Trigger appropriate visualizations
    if (this.visualizations.moduleHighlight) {
      this.visualizations.moduleHighlight.highlightModule(index + 1); // Highlight current module
    }
    
    // Save progress
    this.saveUserProgress();
    
    // Show toast
    this.showToast(`Exercise ${index + 1} of ${totalExercises}`);
  }
  
  updateProgress(progressValue) {
    this.progressData.progress = progressValue;
    
    // Update progress bar
    const progressBar = document.getElementById('mission-progress');
    if (progressBar) {
      progressBar.style.width = `${progressValue}%`;
    }
    
    // Update progress text
    const progressText = document.getElementById('mission-progress-text');
    if (progressText) {
      progressText.textContent = `${Math.round(progressValue)}%`;
    }
    
    // Update circular progress
    this.updateCircularProgress(progressValue);
    
    // Update certification status if completed
    if (progressValue >= 100) {
      const certStatus = document.getElementById('certification-status');
      if (certStatus) {
        certStatus.textContent = 'Certified';
        certStatus.classList.add('text-green-400');
      }
      
      // Update mission status
      const missionStatus = document.getElementById('mission-status');
      if (missionStatus) {
        missionStatus.textContent = 'Completed';
        missionStatus.classList.remove('text-yellow-400');
        missionStatus.classList.add('text-green-400');
      }
      
      // Trigger achievement visualization if available
      if (this.visualizations.achievements) {
        this.visualizations.achievements.showAchievement({
          title: 'Core & Balance Master',
          description: 'Completed the Core & Balance Foundation training',
          icon: 'trophy'
        });
      }
    }
    
    // Save progress
    this.saveUserProgress();
  }
  
  setDifficulty(level) {
    this.progressData.difficultyLevel = level;
    
    // Save progress
    this.saveUserProgress();
    
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
    const creditsEarned = document.getElementById('credits-earned');
    if (creditsEarned) {
      creditsEarned.textContent = this.progressData.credits;
    }
    
    // Update footer credits if available
    const footerCredits = document.getElementById('footer-credits');
    if (footerCredits) {
      footerCredits.textContent = this.progressData.credits;
    }
    
    // Save progress
    this.saveUserProgress();
    
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
    const feedbackModal = document.getElementById('feedback-modal');
    const feedbackContent = document.getElementById('feedback-content');
    
    if (feedbackModal && feedbackContent) {
      feedbackModal.classList.remove('hidden');
      
      // Generate performance score
      const currentProgress = this.progressData.progress || 0;
      
      // Prepare feedback content
      let feedbackHTML = `
        <div class="feedback-header">
          <div class="performance-score">
            <div class="score-circle">
              <span id="performance-score">${Math.floor(70 + Math.random() * 20)}%</span>
            </div>
            <div class="score-label">Performance</div>
          </div>
          
          <div class="feedback-stats">
            <div class="stat-item">
              <div class="stat-label">Certification Progress</div>
              <div class="stat-value" id="certification-progress">${currentProgress >= 50 ? '1/3' : '0/3'}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Points Earned</div>
              <div class="stat-value" id="points-earned">${Math.floor(currentProgress * 1.5)}</div>
            </div>
          </div>
        </div>
      `;
      
      // Get AI feedback from STELLA if available
      if (window.stellaCore && typeof window.stellaCore.getGuidance === 'function') {
        window.stellaCore.getGuidance({
          context: 'feedback',
          progress: currentProgress,
          exerciseType: 'core-balance',
          difficulty: this.progressData.difficultyLevel || 'beginner'
        }).then(guidance => {
          if (guidance && guidance.message) {
            feedbackHTML += `
              <div class="feedback-body">
                <h3 class="feedback-section-title">Training Analysis</h3>
                <p class="feedback-text">${guidance.message}</p>
                ${guidance.actionItems && guidance.actionItems.length > 0 ? `
                  <h3 class="feedback-section-title">Recommendations</h3>
                  <ul class="feedback-list">
                    ${guidance.actionItems.map(tip => `<li>${tip}</li>`).join('')}
                  </ul>
                ` : ''}
              </div>
            `;
          } else {
            // Fallback to default feedback if no guidance
            this.addFallbackFeedback(feedbackHTML);
          }
          
          // Set content
          feedbackContent.innerHTML = feedbackHTML;
        }).catch(err => {
          console.error('Error getting AI guidance:', err);
          // Fallback to default feedback
          this.addFallbackFeedback(feedbackHTML);
          feedbackContent.innerHTML = feedbackHTML;
        });
      } else {
        // Fallback to default feedback if STELLA not available
        this.addFallbackFeedback(feedbackHTML);
        feedbackContent.innerHTML = feedbackHTML;
      }
    }
  }
  
  addFallbackFeedback(feedbackHTML) {
    feedbackHTML += `
      <div class="feedback-body">
        <h3 class="feedback-section-title">Training Analysis</h3>
        <p class="feedback-text">You're making good progress! Your core stability is improving steadily. Continue focusing on proper form for best results.</p>
        <h3 class="feedback-section-title">Recommendations</h3>
        <ul class="feedback-list">
          <li>Focus on maintaining tension in your core throughout all exercises</li>
          <li>Try to keep your breathing steady and controlled during holds</li>
          <li>Consider adding 5 seconds to your plank duration in your next session</li>
        </ul>
      </div>
    `;
    return feedbackHTML;
  }
  
  showToast(message, type = 'info') {
    const toast = document.getElementById('toast-message');
    if (!toast) return;
    
    // Set message and type
    toast.textContent = message;
    toast.className = 'toast'; // Reset classes
    
    // Add type-specific class
    if (type === 'warning') {
      toast.classList.add('toast-warning');
    } else if (type === 'success') {
      toast.classList.add('toast-success');
    }
    
    // Show toast
    toast.classList.add('show');
    
    // Hide after delay
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
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
            userId: this.getUserId(),
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
  // Add this to public/js/training/physical/coreBalanceTraining.js
// or create a new file called assessment-emergency-fix.js and load it in your HTML

(function() {
  // Run when DOM is fully loaded
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Emergency assessment fix loaded');
    
    // Direct DOM element references - using multiple selector strategies for robustness
    const assessmentButton = document.querySelector('#take-assessment-btn') || 
                             document.querySelector('.assessment-btn') || 
                             document.querySelector('button:contains("Take Assessment")') ||
                             document.querySelector('button[id*="assessment"]') ||
                             document.querySelector('a[id*="assessment"]');
    
    // Find the button by text content if all other selectors fail
    if (!assessmentButton) {
      const allButtons = document.querySelectorAll('button, a.button, .btn, a.btn');
      for (let btn of allButtons) {
        if (btn.textContent.toLowerCase().includes('assessment')) {
          console.log('Found assessment button by text content:', btn);
          initializeButton(btn);
          break;
        }
      }
    } else {
      console.log('Found assessment button:', assessmentButton);
      initializeButton(assessmentButton);
    }
    
    // Function to initialize button
    function initializeButton(button) {
      // Remove any existing listeners by cloning
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
      
      // Add fresh click handler
      newButton.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Assessment button clicked');
        showAssessmentModal();
      });
    }
    
    // Create and show assessment modal
    function showAssessmentModal() {
      // Check for existing modal or create one
      let modal = document.getElementById('assessment-modal');
      
      if (!modal) {
        // Create a new modal
        modal = document.createElement('div');
        modal.id = 'assessment-modal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '1000';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.style.backgroundColor = '#1e293b';
        modalContent.style.padding = '20px';
        modalContent.style.borderRadius = '8px';
        modalContent.style.maxWidth = '500px';
        modalContent.style.width = '90%';
        
        // Add assessment content
        modalContent.innerHTML = `
          <h2 style="color: white; margin-top: 0; margin-bottom: 16px; font-size: 20px;">Core & Balance Assessment</h2>
          <p style="color: #e2e8f0; margin-bottom: 20px;">This assessment will evaluate your core strength and balance capabilities.</p>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; color: white; margin-bottom: 8px;">How would you rate your core strength?</label>
            <select id="core-strength" style="width: 100%; padding: 8px; background-color: #334155; color: white; border: 1px solid #475569; border-radius: 4px;">
              <option>Beginner</option>
              <option selected>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; color: white; margin-bottom: 8px;">Can you hold a plank for more than 30 seconds?</label>
            <div style="display: flex; gap: 16px;">
              <label style="display: flex; align-items: center; color: white;">
                <input type="radio" name="plank-ability" value="yes" checked style="margin-right: 8px;"> Yes
              </label>
              <label style="display: flex; align-items: center; color: white;">
                <input type="radio" name="plank-ability" value="no" style="margin-right: 8px;"> No
              </label>
            </div>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-top: 20px;">
            <button id="cancel-assessment" style="background-color: #64748b; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
              Cancel
            </button>
            <button id="complete-assessment" style="background-color: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
              Complete Assessment
            </button>
          </div>
        `;
        
        // Add modal to document
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Add event listeners to buttons
        document.getElementById('cancel-assessment').addEventListener('click', function() {
          modal.style.display = 'none';
        });
        
        document.getElementById('complete-assessment').addEventListener('click', function() {
          completeAssessment();
        });
      } else {
        // Show existing modal
        modal.style.display = 'flex';
      }
    }
    
    // Handle assessment completion
    function completeAssessment() {
      console.log('Assessment completed');
      
      // Save to localStorage
      localStorage.setItem('assessment_completed', 'true');
      localStorage.setItem('core_balance_assessment', 'true');
      
      // Hide modal
      const modal = document.getElementById('assessment-modal');
      if (modal) {
        modal.style.display = 'none';
      }
      
      // Hide warning if it exists
      const assessmentWarning = document.querySelector('.assessment-required') || 
                                document.querySelector('#assessment-warning') ||
                                document.querySelector('[id*="assessment"][id*="warning"]');
      if (assessmentWarning) {
        assessmentWarning.style.display = 'none';
      }
      
      // Update Session 1 button
      const session1Btn = document.querySelector('button:contains("Complete Assessment First")') ||
                          document.querySelector('button:contains("Assessment")') ||
                          document.querySelector('button[disabled]');
      if (session1Btn) {
        session1Btn.disabled = false;
        session1Btn.textContent = 'Start Session';
        session1Btn.innerHTML = session1Btn.innerHTML.replace('Complete Assessment First', 'Start Session');
      }
      
      // Update mission status & progress
      updateProgress();
      
      // Show success message
      showToast('Assessment completed successfully!');
    }
    
    // Update mission progress
    function updateProgress() {
      // Find progress bar
      const progressBar = document.querySelector('.progress-fill') || 
                          document.querySelector('[id*="progress-bar"]');
      if (progressBar) {
        progressBar.style.width = '20%';
      }
      
      // Update percentage text
      const progressText = document.querySelector('[id*="progress-percentage"]') ||
                           document.querySelector('.progress-percentage');
      if (progressText) {
        progressText.textContent = '20%';
      }
      
      // Update mission status
      const missionStatus = document.querySelector('[id*="mission-status"]');
      if (missionStatus) {
        missionStatus.textContent = 'In Progress';
      }
      
      // Update countdown
      updateCountdown();
    }
    
    // Update countdown timer
    function updateCountdown() {
      // Get current countdown value
      const countdownElement = document.querySelector('[id*="countdown"]') ||
                               document.querySelector('.countdown-timer');
      if (!countdownElement) return;
      
      const currentText = countdownElement.textContent;
      const currentValue = parseInt(currentText);
      
      if (!isNaN(currentValue)) {
        // Reduce by 5 days for assessment
        const newValue = currentValue - 5;
        countdownElement.textContent = `${newValue} Days`;
        localStorage.setItem('countdown_days', newValue);
      }
    }
    
    // Show toast notification
    function showToast(message) {
      // Check for existing toast
      let toast = document.getElementById('toast-message');
      
      if (!toast) {
        // Create new toast
        toast = document.createElement('div');
        toast.id = 'toast-message';
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.backgroundColor = '#1e293b';
        toast.style.color = 'white';
        toast.style.padding = '12px 20px';
        toast.style.borderRadius = '4px';
        toast.style.borderLeft = '4px solid #2563eb';
        toast.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        toast.style.zIndex = '1000';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'opacity 0.3s, transform 0.3s';
        document.body.appendChild(toast);
      }
      
      // Set message and show
      toast.textContent = message;
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
      
      // Hide after 3 seconds
      setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
      }, 3000);
    }
    
    // Check if assessment was already completed
    if (localStorage.getItem('assessment_completed') === 'true' || 
        localStorage.getItem('core_balance_assessment') === 'true') {
      console.log('Assessment was previously completed');
      
      // Hide warning if it exists
      const assessmentWarning = document.querySelector('.assessment-required') || 
                                document.querySelector('#assessment-warning') ||
                                document.querySelector('[id*="assessment"][id*="warning"]');
      if (assessmentWarning) {
        assessmentWarning.style.display = 'none';
      }
      
      // Update Session 1 button
      const session1Btn = document.querySelector('button:contains("Complete Assessment First")') ||
                          document.querySelector('button:contains("Assessment")') ||
                          document.querySelector('button[disabled]');
      if (session1Btn) {
        session1Btn.disabled = false;
        session1Btn.textContent = 'Start Session';
        session1Btn.innerHTML = session1Btn.innerHTML.replace('Complete Assessment First', 'Start Session');
      }
      
      // Update progress bar
      const progressBar = document.querySelector('.progress-fill') || 
                          document.querySelector('[id*="progress-bar"]');
      if (progressBar) {
        progressBar.style.width = '20%';
      }
      
      // Update mission status
      const missionStatus = document.querySelector('[id*="mission-status"]');
      if (missionStatus) {
        missionStatus.textContent = 'In Progress';
      }
    }
  });
})();
  // Initialize on page load
  document.addEventListener('DOMContentLoaded', () => {
    const tracker = new CoreBalanceTracker();
    tracker.initialize();
    
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      tracker.cleanup();
    });
  });