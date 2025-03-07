// Ultra-simple mission-handler.js with exercise functionality
console.log("Ultra-simple mission-handler.js loading...");

class MissionHandler {
  constructor() {
    this.missions = window.physicalMissions || [];
    console.log("Physical missions available:", this.missions.length);
    this.currentMission = null;
    this.exerciseTimers = {};
  }
  
  initialize() {
    console.log("Initializing simplified mission handler");
    this.renderMissionList();
    
    // Check URL for mission parameter
    const urlParams = new URLSearchParams(window.location.search);
    const missionId = urlParams.get('mission');
    
    if (missionId) {
      console.log("Found mission ID in URL:", missionId);
      this.handleMissionClick(missionId);
    }
  }
  
  renderMissionList() {
    const missionListEl = document.getElementById('mission-list');
    console.log("Mission list element found:", !!missionListEl);
    
    if (!missionListEl) {
      console.error("Mission list element not found");
      return;
    }
    
    // Create extremely simple mission cards
    let html = "";
    
    for (let i = 0; i < this.missions.length; i++) {
      const mission = this.missions[i];
      html += `
        <div class="mission-card bg-gray-800 rounded-xl p-4 mb-4">
          <h3 class="text-xl font-bold text-white mb-2">${mission.name || 'Unnamed Mission'}</h3>
          <button class="bg-blue-600 text-white px-4 py-2 rounded" 
                  onclick="window.simpleMissionHandler.handleMissionClick('${mission.id}')">
            Start Mission ${i+1}
          </button>
        </div>
      `;
    }
    
    missionListEl.innerHTML = html;
    console.log("Simple mission cards rendered:", this.missions.length);
  }
  
  handleMissionClick(missionId) {
    console.log("Mission clicked:", missionId);
    
    // Find the mission
    const mission = this.missions.find(m => m.id === missionId);
    if (!mission) {
      console.error("Mission not found:", missionId);
      return;
    }
    
    this.currentMission = mission;
    
    // Update URL
    window.history.pushState({}, '', `?mission=${missionId}`);
    
    // Hide mission list
    const missionsList = document.getElementById('missions-container');
    if (missionsList) {
      missionsList.style.display = 'none';
    }
    
    // Show mission content
    const missionContent = document.getElementById('mission-content');
    if (!missionContent) {
      console.error("Mission content element not found");
      return;
    }
    
    missionContent.style.display = 'block';
    
    // Build exercise HTML
    let exercisesHtml = '';
    if (mission.exercises && mission.exercises.length > 0) {
      exercisesHtml = mission.exercises.map(ex => `
        <div class="bg-gray-700 p-4 rounded mb-4" id="exercise-${ex.id}">
          <h4 class="text-lg font-bold mb-2">${ex.name}</h4>
          <p class="mb-3">${ex.description || 'No description'}</p>
          <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
                  onclick="window.simpleMissionHandler.startExercise('${ex.id}')">
            Start Exercise
          </button>
          <div id="timer-${ex.id}" class="mt-4 hidden"></div>
        </div>
      `).join('');
    } else {
      exercisesHtml = '<p>No exercises available for this mission</p>';
    }
    
    // Mission content with exercises
    missionContent.innerHTML = `
      <div class="p-4">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-bold">${mission.name}</h2>
          <button id="back-button" class="bg-blue-600 text-white px-4 py-2 rounded"
                  onclick="window.simpleMissionHandler.goBack()">
            Go Back
          </button>
        </div>
        <p class="mb-4">${mission.description || 'No description'}</p>
        
        <!-- Progress -->
        <div class="bg-gray-800 p-4 rounded-xl mb-6">
          <div class="flex justify-between mb-2">
            <span>Mission Progress</span>
            <span id="mission-progress">0%</span>
          </div>
          <div class="w-full h-2 bg-gray-700 rounded-full">
            <div id="progress-bar" class="h-full bg-blue-500 rounded-full" style="width: 0%"></div>
          </div>
        </div>
        
        <!-- Exercises -->
        <h3 class="text-xl mb-4">Exercises</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${exercisesHtml}
        </div>
      </div>
    `;
  }
  
  startExercise(exerciseId) {
    console.log("Starting exercise:", exerciseId);
    
    const exerciseDiv = document.getElementById(`exercise-${exerciseId}`);
    if (!exerciseDiv) return;
    
    const button = exerciseDiv.querySelector('button');
    const timerDiv = document.getElementById(`timer-${exerciseId}`);
    
    if (!button || !timerDiv) return;
    
    // Switch button to "Complete"
    button.textContent = "Complete Exercise";
    button.classList.remove("bg-blue-600", "hover:bg-blue-700");
    button.classList.add("bg-green-600", "hover:bg-green-700");
    button.onclick = function() {
      window.simpleMissionHandler.completeExercise(exerciseId);
    };
    
    // Show timer
    timerDiv.classList.remove("hidden");
    timerDiv.innerHTML = `
      <div class="text-center">
        <span class="text-2xl font-bold" id="countdown-${exerciseId}">60</span>
        <span class="text-sm ml-1">seconds remaining</span>
      </div>
    `;
    
    // Start countdown
    let timeLeft = 60;
    const countdownEl = document.getElementById(`countdown-${exerciseId}`);
    
    this.exerciseTimers[exerciseId] = setInterval(() => {
      timeLeft--;
      
      if (countdownEl) {
        countdownEl.textContent = timeLeft;
      }
      
      if (timeLeft <= 0) {
        this.completeExercise(exerciseId);
      }
    }, 1000);
  }
  
  completeExercise(exerciseId) {
    console.log("Completing exercise:", exerciseId);
    
    // Clear timer
    if (this.exerciseTimers[exerciseId]) {
      clearInterval(this.exerciseTimers[exerciseId]);
      delete this.exerciseTimers[exerciseId];
    }
    
    const exerciseDiv = document.getElementById(`exercise-${exerciseId}`);
    if (!exerciseDiv) return;
    
    const button = exerciseDiv.querySelector('button');
    
    // Mark as completed
    button.textContent = "Completed";
    button.disabled = true;
    button.classList.remove("bg-green-600", "hover:bg-green-700");
    button.classList.add("bg-gray-600");
    
    // Add completed class
    exerciseDiv.classList.add("border-2", "border-green-500");
    
    // Update mission progress
    this.updateProgress();
    
    // Show credit notification
    this.showCreditNotification(25);
  }
  
  updateProgress() {
    if (!this.currentMission) return;
    
    // Count completed exercises
    const totalExercises = this.currentMission.exercises ? this.currentMission.exercises.length : 0;
    const completedExercises = document.querySelectorAll('button[disabled]').length;
    
    if (totalExercises === 0) return;
    
    // Calculate progress percentage
    const progressPercent = Math.round((completedExercises / totalExercises) * 100);
    
    // Update UI
    const progressText = document.getElementById('mission-progress');
    const progressBar = document.getElementById('progress-bar');
    
    if (progressText) progressText.textContent = `${progressPercent}%`;
    if (progressBar) progressBar.style.width = `${progressPercent}%`;
    
    // Update mission object
    this.currentMission.progress = progressPercent;
    
    console.log(`Mission progress updated: ${progressPercent}%`);
  }
  
  showCreditNotification(amount) {
    // Create notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-4 bg-blue-900 text-white px-4 py-2 rounded shadow-lg';
    notification.innerHTML = `<span>+${amount} Credits Earned!</span>`;
    
    document.body.appendChild(notification);
    
    // Remove after delay
    setTimeout(() => {
      notification.remove();
    }, 3000);
    
    // Update credits counter if it exists
    const creditsEl = document.getElementById('total-credits');
    if (creditsEl) {
      const currentCredits = parseInt(creditsEl.textContent || '0');
      creditsEl.textContent = currentCredits + amount;
    }
  }
  
  goBack() {
    console.log("Going back to mission list");
    
    // Clear all timers
    Object.values(this.exerciseTimers).forEach(timer => clearInterval(timer));
    this.exerciseTimers = {};
    
    // Show mission list
    const missionsList = document.getElementById('missions-container');
    if (missionsList) {
      missionsList.style.display = 'block';
    }
    
    // Hide mission content
    const missionContent = document.getElementById('mission-content');
    if (missionContent) {
      missionContent.style.display = 'none';
    }
    
    // Clear URL parameter
    window.history.pushState({}, '', window.location.pathname);
    
    this.currentMission = null;
  }
}

// Initialize when document loads and make it globally accessible
window.simpleMissionHandler = new MissionHandler();
document.addEventListener('DOMContentLoaded', () => {
  window.simpleMissionHandler.initialize();
});