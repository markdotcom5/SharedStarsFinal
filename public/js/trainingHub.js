// public/js/trainingHub.js

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Training Hub initialized');
    
    // ===== Button Event Listeners =====
    // Find and attach listeners to all training buttons
    initializeTrainingButtons();
    
    
    // ===== Performance Tracking =====
    // Only run if we're on a post-training page
    if (document.querySelector('#progress-container')) {
      trackPerformance();
    }
    
    // ===== Language Selection =====
    // Make sure language buttons work properly
    setupLanguageButtons();
    
    // ===== Countdown Timer =====
    // Initialize any countdown timers on page
    initializeCountdowns();
  });
  
  // Initialize all training-related buttons
  function initializeTrainingButtons() {
    // Primary action buttons
    attachButtonListener('.btn[data-i18n="startTraining"]', () => {
      console.log('Starting training...');
      window.location.href = '/training/physical';
    });
    
    attachButtonListener('.btn[data-i18n="resumeTraining"]', () => {
      console.log('Resuming training...');
      window.location.href = '/training/dashboard';
    });
    
    attachButtonListener('.btn[data-i18n="viewProgress"]', () => {
      console.log('Viewing progress...');
      window.location.href = '/training/progress';
    });
    
    // Module selection buttons
    document.querySelectorAll('.module-card').forEach(card => {
      card.addEventListener('click', function() {
        const moduleId = this.getAttribute('data-module');
        if (moduleId) {
          console.log(`Selected module: ${moduleId}`);
          window.location.href = `/training/module/${moduleId}`;
        }
      });
    });
    
    // Continue training buttons
    document.querySelectorAll('.continue-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent triggering the card click
        const moduleId = this.getAttribute('data-module');
        if (moduleId) {
          console.log(`Continuing module: ${moduleId}`);
          window.location.href = `/training/module/${moduleId}/resume`;
        }
      });
    });
  }
  
  // Helper function to attach a click listener to a button
  function attachButtonListener(selector, callback) {
    const button = document.querySelector(selector);
    if (button) {
      console.log(`Found button: ${selector}`);
      button.addEventListener('click', callback);
    } else {
      console.warn(`Button not found: ${selector}`);
    }
  }

  // Track user performance for completed training
  function trackPerformance() {
    const moduleId = document.body.getAttribute('data-module-id') || 'physical';
    
    // Sample performance data - in a real app, this would come from the training session
    const performanceData = {
      completionTime: 450,
      accuracy: 0.95,
      interactions: 8,
      challengesCompleted: 4,
      exercises: ['push-up', 'squat', 'plank'],
      caloriesBurned: 120
    };
    
    submitPerformance(moduleId, performanceData);
  }
  
  // Submit performance data to the server
  async function submitPerformance(moduleId, performanceData) {
    try {
      const response = await fetch('/api/progress/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId, performanceData })
      });
      
      const data = await response.json();
      if (data.success) {
        updateProgressBar(moduleId, data.score);
        displayAchievements(data.achievements);
        updateCredits(data.credits);
      } else {
        console.error(`Server Error: ${data.message}`);
      }
    } catch (error) {
      console.error('API Submission Error:', error);
    }
  }
  
  // Update the progress bar for a module
  function updateProgressBar(moduleId, score) {
    const bar = document.querySelector(`#progress-${moduleId}`);
    if (bar) {
      bar.style.width = `${score * 100}%`;
    }
  }
  
  // Display achievements earned
  function displayAchievements(achievements) {
    const container = document.querySelector('#achievements-container');
    if (container && achievements && achievements.length) {
      container.innerHTML = ''; // Clear previous achievements
      achievements.forEach(ach => {
        const div = document.createElement('div');
        div.className = 'achievement-item';
        div.innerHTML = `<span class="achievement-icon">🏅</span> <span class="achievement-text">${ach.name}: ${ach.description}</span>`;
        container.appendChild(div);
      });
    }
  }
  
  // Update user credits display
  function updateCredits(credits) {
    const creditsElement = document.querySelector('#user-credits');
    if (creditsElement) {
      creditsElement.textContent = credits;
    }
  }
  
  // Setup language selection buttons
  function setupLanguageButtons() {
    const langButtons = document.querySelectorAll('.lang-btn');
    if (langButtons.length) {
      langButtons.forEach(btn => {
        btn.addEventListener('click', function() {
          const lang = this.getAttribute('data-lang');
          if (lang) {
            console.log(`Switching language to: ${lang}`);
            document.cookie = `language=${lang}; path=/; max-age=${60*60*24*365}`;
            window.location.reload();
          }
        });
      });
    }
  }
  
  // Initialize countdown timers
  function initializeCountdowns() {
    const countdownElements = document.querySelectorAll('.countdown');
    if (countdownElements.length) {
      countdownElements.forEach(element => {
        const targetDate = new Date(element.getAttribute('data-target'));
        
        if (!isNaN(targetDate.getTime())) {
          // Update immediately
          updateCountdown(element, targetDate);
          
          // Then update every second
          setInterval(() => {
            updateCountdown(element, targetDate);
          }, 1000);
        }
      });
    }
  }
  
  // Update a countdown timer
  function updateCountdown(element, targetDate) {
    const now = new Date();
    const difference = targetDate.getTime() - now.getTime();
    
    if (difference <= 0) {
      element.innerHTML = 'LAUNCHED!';
      return;
    }
    
    // Calculate time units
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    
    // Update the HTML with the new countdown values
    element.innerHTML = `
      <div class="countdown-item"><span class="countdown-value">${days}</span><span class="countdown-label">Days</span></div>
      <div class="countdown-item"><span class="countdown-value">${hours}</span><span class="countdown-label">Hours</span></div>
      <div class="countdown-item"><span class="countdown-value">${minutes}</span><span class="countdown-label">Mins</span></div>
      <div class="countdown-item"><span class="countdown-value">${seconds}</span><span class="countdown-label">Secs</span></div>
    `;
  }