/**
 * Core & Balance Assessment Integration
 * This script integrates the assessment popup with the Core & Balance training dashboard
 * and handles the assessment flow for astronaut physical training preparation.
 */
class CoreBalanceAssessment {
  constructor() {
    this.initialized = false;
    this.assessmentType = 'mission-core-balance';
    this.userId = null;
    this.assessmentStatus = false;
    this.debug = true; // Enable debugging for development
  }

  /**
   * Initialize the assessment integration
   */
  initialize() {
    if (this.initialized) return;
    
    // Log initialization for debugging
    if (this.debug) console.log('Initializing Core Balance Assessment');
    
    // Get user ID from localStorage or session
    this.userId = localStorage.getItem('userId') || sessionStorage.getItem('userId') || 'anonymous';
    
    // Add assessment button to relevant UI elements
    this.addAssessmentButtons();
    
    // Check if user has already completed this assessment
    this.checkAssessmentStatus();
    
    this.initialized = true;
    
    if (this.debug) console.log('Core Balance Assessment initialized successfully');
  }

  /**
   * Add assessment buttons to the UI
   */
  addAssessmentButtons() {
    if (this.debug) console.log('Adding assessment buttons to UI');
    
    // Add button to assessment warning panel if it exists
    const assessmentWarning = document.getElementById('assessment-warning');
    if (assessmentWarning) {
      const existingButton = assessmentWarning.querySelector('button') || assessmentWarning.querySelector('a');
      if (existingButton) {
        // Remove href if it exists to prevent navigation
        if (existingButton.hasAttribute('href')) {
          existingButton.removeAttribute('href');
        }
        
        // Add click handler with explicit preventDefault
        existingButton.addEventListener('click', (e) => {
          e.preventDefault();
          if (this.debug) console.log('Assessment button clicked');
          this.startAssessment();
        });
        
        if (this.debug) console.log('Added click handler to existing assessment button');
      } else if (this.debug) {
        console.warn('No button found in assessment warning panel');
      }
    } else if (this.debug) {
      console.warn('Assessment warning panel not found');
    }
    
    // Add assessment button to mission overview area if it doesn't already exist
    const existingAssessButton = document.getElementById('core-balance-assessment-btn');
    if (!existingAssessButton) {
      const missionActionButtons = document.querySelector('#mission-actions') || 
                                    document.querySelector('#start-mission-btn')?.parentNode ||
                                    document.querySelector('.mission-header')?.parentNode;
      
      if (missionActionButtons) {
        const assessButton = document.createElement('button');
        assessButton.id = 'core-balance-assessment-btn';
        assessButton.className = 'bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center';
        assessButton.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Take Assessment
        `;
        assessButton.addEventListener('click', (e) => {
          e.preventDefault();
          if (this.debug) console.log('Assessment button clicked');
          this.startAssessment();
        });
        
        missionActionButtons.appendChild(assessButton);
        if (this.debug) console.log('Added new assessment button to mission actions');
      } else if (this.debug) {
        console.warn('Mission action buttons container not found');
      }
    } else if (this.debug) {
      console.log('Assessment button already exists, adding click handler');
      existingAssessButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.startAssessment();
      });
    }
  }

  /**
   * Check if user has already completed this assessment
   */
  async checkAssessmentStatus() {
    if (this.debug) console.log(`Checking assessment status for user: ${this.userId}`);
    
    try {
      const response = await fetch(`/api/assessment/status/${this.userId}`).catch(err => {
        // Handle network error gracefully
        if (this.debug) console.warn('Error fetching assessment status, falling back to localStorage:', err);
        return { ok: false };
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.assessments) {
          this.assessmentStatus = data.assessments[this.assessmentType] || false;
          if (this.debug) console.log(`Assessment status from API: ${this.assessmentStatus}`);
          this.updateUIBasedOnStatus();
        }
      } else {
        // Fallback to localStorage if API fails
        const storedStatus = localStorage.getItem(`assessment_${this.assessmentType}`);
        if (storedStatus) {
          this.assessmentStatus = storedStatus === 'true';
          if (this.debug) console.log(`Assessment status from localStorage: ${this.assessmentStatus}`);
          this.updateUIBasedOnStatus();
        }
      }
    } catch (error) {
      console.error('Error checking assessment status:', error);
      
      // Fallback to localStorage as a last resort
      const storedStatus = localStorage.getItem(`assessment_${this.assessmentType}`);
      if (storedStatus) {
        this.assessmentStatus = storedStatus === 'true';
        if (this.debug) console.log(`Fallback assessment status from localStorage: ${this.assessmentStatus}`);
        this.updateUIBasedOnStatus();
      }
    }
  }

  /**
   * Update UI elements based on assessment status
   */
  updateUIBasedOnStatus() {
    if (this.debug) console.log(`Updating UI based on assessment status: ${this.assessmentStatus}`);
    
    if (this.assessmentStatus) {
      // User has completed the assessment
      const assessmentWarning = document.getElementById('assessment-warning');
      if (assessmentWarning) {
        assessmentWarning.style.display = 'none';
        if (this.debug) console.log('Hidden assessment warning panel');
      }
      
      // Update any assessment buttons to show completion
      const assessButtons = [
        document.getElementById('core-balance-assessment-btn'),
        document.getElementById('take-assessment-btn')
      ].filter(Boolean);
      
      assessButtons.forEach(button => {
        button.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Assessment Complete
        `;
        button.className = button.className.replace(/bg-yellow-\d00/g, 'bg-green-600').replace(/hover:bg-yellow-\d00/g, 'hover:bg-green-700');
        if (this.debug) console.log('Updated assessment button to show completion');
      });
      
      // Enable start session buttons if they were disabled
      const sessionButtons = document.querySelectorAll('.session-btn');
      sessionButtons.forEach(button => {
        button.removeAttribute('disabled');
        if (button.textContent.includes('Complete Previous Session')) {
          button.textContent = 'Start Session';
          button.classList.remove('bg-gray-700');
          button.classList.add('bg-blue-600', 'hover:bg-blue-700');
        }
      });
      if (this.debug && sessionButtons.length > 0) {
        console.log(`Enabled ${sessionButtons.length} session buttons`);
      }
      
      // Update mission status if needed
      const missionStatus = document.getElementById('mission-status');
      if (missionStatus && missionStatus.textContent === 'Not Started') {
        missionStatus.textContent = 'In Progress';
        missionStatus.classList.remove('text-gray-400');
        missionStatus.classList.add('text-blue-400');
        if (this.debug) console.log('Updated mission status to In Progress');
      }
    }
  }

  /**
   * Start the assessment process
   */
  startAssessment() {
    if (this.debug) console.log('Starting assessment process');
    
    // Show toast notification to inform user
    this.showToast('Loading assessment...', 2000);
    
    // Require the assessment popup (dynamically load if needed)
    if (!window.assessmentPopup) {
      if (this.debug) console.log('Assessment popup not found, loading required scripts');
      this.loadAssessmentScript(() => this.initializeAndShowPopup());
    } else {
      if (this.debug) console.log('Assessment popup found, showing directly');
      this.initializeAndShowPopup();
    }
  }

  /**
   * Initialize and show the assessment popup
   */
  initializeAndShowPopup() {
    if (this.debug) console.log('Initializing and showing assessment popup');
    
    // When assessment completes, update the UI and store results
    const onComplete = (result) => {
      if (this.debug) console.log('Assessment completed:', result);
      
      // Save assessment completion status
      this.assessmentStatus = true;
      localStorage.setItem(`assessment_${this.assessmentType}`, 'true');
      localStorage.setItem('assessment_completed', 'true');
      
      // Update UI elements
      this.updateUIBasedOnStatus();
      
      // Update mission progress
      this.updateMissionProgress(40);
      
      // Send assessment completion to server
      this.sendAssessmentCompletionToServer(result);
      
      // Trigger STELLA message about completion
      this.triggerStellaMessage('Great job completing your Core & Balance assessment! I've analyzed your results and customized your training plan. You're ready to begin your first session.');
      
      // Show success toast
      this.showToast('Assessment completed successfully!', 3000);
    };
    
    try {
      // Initialize and show the assessment popup
      if (window.assessmentPopup) {
        window.assessmentPopup.initialize(this.assessmentType, onComplete);
        window.assessmentPopup.show();
        if (this.debug) console.log('Assessment popup shown successfully');
      } else {
        throw new Error('Assessment popup component not loaded');
      }
    } catch (error) {
      console.error('Error showing assessment popup:', error);
      
      // Fallback to mock completion for development
      if (this.debug) {
        console.log('Using mock completion for development');
        setTimeout(() => {
          onComplete({
            score: 85,
            areas: {
              balance: 80,
              coreStrength: 85,
              vestibularAdaptation: 90
            },
            timestamp: new Date().toISOString()
          });
        }, 3000);
      } else {
        // Show error toast in production
        this.showToast('Error loading assessment. Please try again.', 3000);
      }
    }
  }

  /**
   * Send assessment completion to server
   * @param {Object} result - Assessment result data
   */
  async sendAssessmentCompletionToServer(result) {
    if (this.debug) console.log('Sending assessment completion to server');
    
    try {
      const response = await fetch('/api/assessment/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: this.userId,
          assessmentType: this.assessmentType,
          results: result
        })
      });
      
      const data = await response.json();
      if (this.debug) console.log('Server response:', data);
      
      return data;
    } catch (error) {
      console.error('Error sending assessment completion to server:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Dynamically load the assessment popup script
   * @param {function} callback - Function to call when script is loaded
   */
  loadAssessmentScript(callback) {
    if (this.debug) console.log('Loading assessment scripts');
    
    // First ensure ReadinessAssessment is loaded
    this.loadScript('/js/assessment/readiness-assessment.js', () => {
      if (this.debug) console.log('Readiness assessment script loaded');
      
      // Then load the popup component
      this.loadScript('/js/components/assessmentPopup.js', () => {
        if (this.debug) console.log('Assessment popup script loaded');
        
        // Execute callback
        if (callback && typeof callback === 'function') {
          callback();
        }
      });
    });
  }

  /**
   * Dynamically load a script
   * @param {string} src - Script source URL
   * @param {function} callback - Function to call when script is loaded
   */
  loadScript(src, callback) {
    if (this.debug) console.log(`Loading script: ${src}`);
    
    // Check if script is already loaded
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      if (this.debug) console.log(`Script already loaded: ${src}`);
      if (callback && typeof callback === 'function') {
        callback();
      }
      return;
    }
    
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => {
      if (this.debug) console.log(`Script loaded successfully: ${src}`);
      if (callback && typeof callback === 'function') {
        callback();
      }
    };
    script.onerror = (error) => {
      console.error(`Error loading script ${src}:`, error);
      // Still call callback to allow fallback behavior
      if (callback && typeof callback === 'function') {
        callback();
      }
    };
    document.head.appendChild(script);
  }

  /**
   * Update mission progress after assessment
   * @param {number} percentage - Progress percentage
   */
  updateMissionProgress(percentage) {
    if (this.debug) console.log(`Updating mission progress to ${percentage}%`);
    
    // Update progress display
    const missionProgress = document.getElementById('mission-progress');
    const missionProgressText = document.getElementById('mission-progress-text');
    const missionStatus = document.getElementById('mission-status');
    const missionCircleProgress = document.getElementById('mission-circle-progress');
    
    if (missionProgress) {
      missionProgress.style.width = `${percentage}%`;
    }
    
    if (missionProgressText) {
      missionProgressText.textContent = `${percentage}%`;
    }
    
    if (missionStatus && missionStatus.textContent === 'Not Started') {
      missionStatus.textContent = 'In Progress';
      missionStatus.classList.remove('text-gray-400');
      missionStatus.classList.add('text-blue-400');
    }
    
    // Update progress circle if it exists
    if (missionCircleProgress) {
      // Update the progress circle
      // Calculate circle progress (339.292 is the circumference of a circle with r=54)
      const circumference = 339.292;
      const offset = circumference - (percentage / 100) * circumference;
      missionCircleProgress.style.strokeDashoffset = offset;
      
      // Also update the percentage text inside the circle
      const percentageText = missionCircleProgress.closest('.relative')?.querySelector('.progress-percentage');
      if (percentageText) {
        percentageText.textContent = `${percentage}%`;
      }
    }
    
    // Update journey nodes if they exist
    const journeyNodes = document.querySelectorAll('.journey-node');
    if (journeyNodes.length > 1) {
      journeyNodes[0].classList.add('completed');
      journeyNodes[1].classList.add('active');
      
      // Update journey node indicators
      const indicators = document.querySelectorAll('.journey-node .absolute');
      if (indicators.length > 1) {
        indicators[0].classList.replace('bg-blue-600', 'bg-green-500');
        indicators[1].classList.replace('bg-gray-700', 'bg-blue-600');
        indicators[1].classList.replace('border-gray-600', 'border-blue-400');
      }
    }
    
    // Update credits display
    const creditsEarned = document.getElementById('credits-earned');
    if (creditsEarned) {
      creditsEarned.textContent = '100';
    }
    
    if (this.debug) console.log('Mission progress updated successfully');
  }

  /**
   * Trigger a message from STELLA
   * @param {string} message - Message to display
   */
  triggerStellaMessage(message) {
    if (this.debug) console.log(`Triggering STELLA message: ${message}`);
    
    const stellaMessage = document.getElementById('stella-message');
    if (stellaMessage) {
      stellaMessage.innerHTML = `<p>${message}</p>`;
      
      // Add to conversation if container exists
      const conversationContainer = document.querySelector('.stella-conversation');
      if (conversationContainer) {
        const messageElement = document.createElement('div');
        messageElement.className = 'stella-message mb-3 bg-blue-900/20 rounded-lg p-3 border border-blue-500/30';
        messageElement.innerHTML = `<p>${message}</p>`;
        conversationContainer.appendChild(messageElement);
        conversationContainer.scrollTop = conversationContainer.scrollHeight;
      }
    } else if (this.debug) {
      console.warn('STELLA message element not found');
    }
  }
  
  /**
   * Show a toast notification
   * @param {string} message - Message to display
   * @param {number} duration - Duration in milliseconds
   */
  showToast(message, duration = 3000) {
    if (this.debug) console.log(`Showing toast: ${message}`);
    
    const toast = document.getElementById('toast-message');
    if (toast) {
      toast.textContent = message;
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
      
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
      }, duration);
    } else if (this.debug) {
      console.warn('Toast element not found');
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing Core Balance Assessment');
  const coreBalanceAssessment = new CoreBalanceAssessment();
  coreBalanceAssessment.initialize();
  
  // Make it globally accessible for debugging
  window.coreBalanceAssessment = coreBalanceAssessment;
});