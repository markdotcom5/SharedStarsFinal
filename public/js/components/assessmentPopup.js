// public/js/components/assessmentPopup.js

class AssessmentPopup {
    constructor() {
      this.popup = null;
      this.assessmentInstance = null;
      this.assessmentType = null;
      this.onComplete = null;
    }
  
    /**
     * Initialize the popup with an assessment type
     * @param {string} assessmentType - Type of assessment (initial, physical, mission-core-balance, etc.)
     * @param {function} onComplete - Callback function when assessment is completed
     */
    initialize(assessmentType, onComplete) {
      this.assessmentType = assessmentType;
      this.onComplete = onComplete;
      this.createPopupElement();
    }
  
    /**
     * Create the popup DOM element
     */
    createPopupElement() {
      // Remove any existing popup
      if (this.popup) {
        document.body.removeChild(this.popup);
      }
  
      // Create popup container
      this.popup = document.createElement('div');
      this.popup.className = 'assessment-popup fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-80 backdrop-blur-sm';
      this.popup.style.opacity = '0';
      this.popup.style.transition = 'opacity 0.3s ease-in-out';
  
      // Create popup content
      const popupContent = document.createElement('div');
      popupContent.className = 'assessment-popup-content relative w-full max-w-4xl bg-gray-800 rounded-xl border border-blue-500/30 shadow-xl p-6 max-h-90vh overflow-y-auto';
      popupContent.style.opacity = '0';
      popupContent.style.transform = 'translateY(20px)';
      popupContent.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
  
      // Add close button
      const closeButton = document.createElement('button');
      closeButton.className = 'absolute top-4 right-4 text-gray-400 hover:text-white transition-colors';
      closeButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      `;
      closeButton.addEventListener('click', () => this.closePopup());
  
      // Add header
      const header = document.createElement('div');
      header.className = 'mb-6';
      header.innerHTML = `
        <h2 class="text-2xl font-bold text-blue-400">Assessment</h2>
        <p class="text-gray-300">Complete this assessment to personalize your training.</p>
      `;
  
      // Add progress bar
      const progressContainer = document.createElement('div');
      progressContainer.className = 'h-2 bg-gray-700 rounded-full mb-8';
      
      const progressBar = document.createElement('div');
      progressBar.id = 'assessment-progress';
      progressBar.className = 'h-full bg-blue-500 rounded-full transition-all duration-300';
      progressBar.style.width = '0%';
      
      progressContainer.appendChild(progressBar);
  
      // Add assessment container
      const assessmentContainer = document.createElement('div');
      assessmentContainer.id = 'assessment-container';
      assessmentContainer.className = 'mb-8';
  
      // Add navigation buttons
      const navButtons = document.createElement('div');
      navButtons.className = 'flex justify-between mt-8';
      navButtons.innerHTML = `
        <button id="prev-question" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
          Previous
        </button>
        <button id="next-question" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
          Next
        </button>
      `;
  
      // Add submit button (hidden initially)
      const submitButton = document.createElement('button');
      submitButton.id = 'submit-assessment';
      submitButton.className = 'w-full px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold text-lg transition-colors';
      submitButton.textContent = 'Submit Assessment';
      submitButton.style.display = 'none';
  
      // Assemble popup content
      popupContent.appendChild(closeButton);
      popupContent.appendChild(header);
      popupContent.appendChild(progressContainer);
      popupContent.appendChild(assessmentContainer);
      popupContent.appendChild(navButtons);
      popupContent.appendChild(submitButton);
      this.popup.appendChild(popupContent);
  
      // Add to DOM
      document.body.appendChild(this.popup);
  
      // Animate in after a small delay
      setTimeout(() => {
        this.popup.style.opacity = '1';
        popupContent.style.opacity = '1';
        popupContent.style.transform = 'translateY(0)';
      }, 10);
  
      // Initialize the assessment
      this.initializeAssessment();
    }
  
    /**
     * Initialize the assessment instance
     */
    initializeAssessment() {
      // Create assessment instance
      this.assessmentInstance = new ReadinessAssessment(this.assessmentType);
      
      // Set completion callback
      this.assessmentInstance.onComplete = (result) => {
        if (typeof this.onComplete === 'function') {
          this.onComplete(result);
        }
        
        // Show completion message and close after delay
        this.showCompletionMessage(result);
        setTimeout(() => this.closePopup(), 3000);
      };
      
      // Initialize assessment
      this.assessmentInstance.initialize('assessment-container');
    }
  
    /**
     * Display completion message
     * @param {object} result - Assessment result object
     */
    showCompletionMessage(result) {
      const assessmentContainer = document.getElementById('assessment-container');
      if (assessmentContainer) {
        assessmentContainer.innerHTML = `
          <div class="text-center py-8">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="text-xl font-bold text-green-400 mb-2">Assessment Complete!</h3>
            <p class="text-gray-300">Your personalized training plan is being updated.</p>
          </div>
        `;
      }
    }
  
    /**
     * Close the popup
     */
    closePopup() {
      if (!this.popup) return;
      
      // Animate out
      this.popup.style.opacity = '0';
      setTimeout(() => {
        if (this.popup && this.popup.parentNode) {
          document.body.removeChild(this.popup);
          this.popup = null;
        }
      }, 300);
    }
  
    /**
     * Show the assessment popup
     */
    show() {
      if (this.popup) {
        this.popup.style.opacity = '1';
      } else {
        this.createPopupElement();
      }
    }
  }
  
  // Export as a singleton instance
  const assessmentPopup = new AssessmentPopup();
  window.assessmentPopup = assessmentPopup; // For global access