// public/js/training/physical/flexibilityTraining.js
class FlexibilityTracker extends MissionTracker {
    constructor() {
      super('flexibility');
      this.breathingInterval = null;
      this.exerciseData = null;
    }
    
    initialize() {
      super.initialize();
      
      // Add specific event listeners for flexibility mission
      this.setupBreathingGuide();
      this.setupExerciseControls();
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
      // Add flexibility-specific event handlers
      const startButton = document.getElementById('start-btn');
      if (startButton) {
        startButton.addEventListener('click', () => {
          if (this.startBreathingGuide) {
            this.startBreathingGuide();
          }
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
        });
      }
    }
    
    cleanup() {
      super.cleanup();
      
      // Clear breathing interval if active
      if (this.breathingInterval) {
        clearInterval(this.breathingInterval);
      }
    }
  }
  
  // Initialize on page load
  document.addEventListener('DOMContentLoaded', () => {
    const tracker = new FlexibilityTracker();
    tracker.initialize();
    
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      tracker.cleanup();
    });
  });