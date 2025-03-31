// public/js/missionControl.js - Enhanced with Mission Control integration

document.addEventListener('DOMContentLoaded', function() {
  // Initialize dashboard components
  initializeMissionControl();
  loadUserProfile();
  loadAssessmentStatus();
  loadTrainingProgress();
  setupSTELLAIntegration();
  initializeSpaceCountdown();
  
  // Add event listeners
  setupNavigationHandlers();
  setupAssessmentCards();
});

/**
 * Initialize the Mission Control dashboard
 */
function initializeMissionControl() {
  console.log('Initializing Mission Control Dashboard...');
  
  // Get user ID from local storage or session
  const userId = getUserId();
  if (!userId) {
    console.error('No user ID found, redirecting to login');
    window.location.href = '/login.html';
    return;
  }
  
  // Show loading state
  document.querySelectorAll('.loading-container').forEach(container => {
    container.innerHTML = `
      <div class="flex items-center justify-center p-6">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span class="ml-3 text-blue-400">Loading your mission data...</span>
      </div>
    `;
  });
  
  // Setup space background effects (orbital rings, radar grid)
  setupSpaceBackgroundEffects();
}

/**
 * Load user profile data
 */
async function loadUserProfile() {
  try {
    const userId = getUserId();
    const response = await fetch(`/api/users/${userId}/profile`);
    
    if (!response.ok) {
      throw new Error('Failed to load user profile');
    }
    
    const userData = await response.json();
    
    // Update user profile UI elements
    document.querySelectorAll('.user-name').forEach(el => {
      el.textContent = userData.name;
    });
    
    document.querySelectorAll('.user-initials').forEach(el => {
      const initials = userData.name.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase();
      el.textContent = initials;
    });
    
    // Update subscription status if applicable
    const subscriptionStatus = document.getElementById('subscription-status');
    if (subscriptionStatus && userData.subscription) {
      subscriptionStatus.textContent = userData.subscription.type.charAt(0).toUpperCase() + 
                                       userData.subscription.type.slice(1);
      
      // Add visual styling based on subscription type
      if (userData.subscription.type === 'galactic') {
        subscriptionStatus.classList.add('bg-purple-900', 'text-purple-200');
      } else if (userData.subscription.type === 'family') {
        subscriptionStatus.classList.add('bg-blue-900', 'text-blue-200');
      } else {
        subscriptionStatus.classList.add('bg-gray-800', 'text-gray-200');
      }
    }
    
    // Update leaderboard stats if applicable
    const leaderboardScore = document.getElementById('leaderboard-score');
    if (leaderboardScore && userData.leaderboard) {
      leaderboardScore.textContent = userData.leaderboard.score.toLocaleString();
    }
    
    // Update credits display
    const creditsDisplay = document.getElementById('user-credits');
    if (creditsDisplay) {
      creditsDisplay.textContent = userData.credits.toLocaleString();
    }
  } catch (error) {
    console.error('Error loading user profile:', error);
    showNotification('Unable to load user profile data', 'error');
  }
}

/**
 * Load user's assessment status and update UI
 */
async function loadAssessmentStatus() {
  try {
    const userId = getUserId();
    if (response.success && response.guidance && response.guidance.message) {
      message = response.guidance.message;
    } else {
      message = "Sorry, I'm having trouble providing a detailed answer right now. Can you try again?";
    }
        
    if (!response.ok) {
      throw new Error('Failed to load assessment status');
    }
    
    const { success, assessments } = await response.json();
    
    if (!success) {
      throw new Error('Error in assessment status response');
    }
    
    // Update assessment cards based on completion status
    updateAssessmentCards(assessments);
    
    // If initial assessment is completed, update other sections
    if (assessments.initial) {
      // Load assessment results for personalized content
      loadAssessmentResults(userId, 'initial');
      
      // Update countdown section
      updateCountdownVisibility(true);
      
      // Update mission status section
      updateMissionStatusSection(true);
    } else {
      // Show prompts to complete initial assessment
      updateCountdownVisibility(false);
      updateMissionStatusSection(false);
      
      // Highlight initial assessment card
      highlightInitialAssessment();
    }
  } catch (error) {
    console.error('Error loading assessment status:', error);
    // Use default UI state
    updateCountdownVisibility(false);
    updateMissionStatusSection(false);
  }
}

/**
 * Update assessment cards based on completion status
 */
function updateAssessmentCards(assessments) {
  const assessmentCards = document.querySelectorAll('.assessment-card');
  
  assessmentCards.forEach(card => {
    const type = card.dataset.assessmentType;
    const isCompleted = assessments[type] === true;
    const statusElement = card.querySelector('.assessment-status');
    const actionButton = card.querySelector('button, a');
    
    if (isCompleted) {
      // Update status
      if (statusElement) {
        statusElement.textContent = 'Completed';
        statusElement.classList.remove('text-yellow-400');
        statusElement.classList.add('text-green-400');
      }
      
      // Update button to view results
      if (actionButton) {
        actionButton.textContent = 'View Results';
        actionButton.setAttribute('href', `/assessment/results.html?type=${type}`);
        actionButton.classList.remove('cursor-not-allowed', 'opacity-70');
      }
      
      // Update card styling
      card.classList.remove('opacity-70');
      card.classList.add('border-green-500/30');
    } else {
      // Check if this card needs to be unlocked
      const shouldBeUnlocked = type === 'initial' || assessments.initial === true;
      
      if (shouldBeUnlocked) {
        // This assessment is available but not completed
        if (statusElement) {
          statusElement.textContent = 'Available';
          statusElement.classList.remove('text-yellow-400');
          statusElement.classList.add('text-blue-400');
        }
        
        if (actionButton) {
          actionButton.textContent = 'Start Assessment';
          actionButton.setAttribute('href', `/assessment.html?type=${type}`);
          actionButton.removeAttribute('disabled');
          actionButton.classList.remove('cursor-not-allowed', 'opacity-70', 'bg-gray-700');
          actionButton.classList.add('bg-blue-600', 'hover:bg-blue-700');
        }
        
        card.classList.remove('opacity-70');
      } else {
        // This assessment is still locked
        if (statusElement) {
          statusElement.textContent = 'Locked';
          statusElement.classList.add('text-yellow-400');
        }
        
        if (actionButton) {
          actionButton.textContent = 'Complete Initial Assessment First';
          actionButton.setAttribute('disabled', 'disabled');
          actionButton.classList.add('cursor-not-allowed', 'opacity-70');
        }
        
        card.classList.add('opacity-70');
      }
    }
  });
}

/**
 * Load specific assessment results
 */
async function loadAssessmentResults(userId, type) {
  try {
    const response = await fetch(`/api/assessment/results/${userId}/${type}`);
    
    if (!response.ok) {
      throw new Error(`Failed to load ${type} assessment results`);
    }
    
    const { success, assessment } = await response.json();
    
    if (!success || !assessment) {
      throw new Error('Invalid assessment results');
    }
    
    // Use the results to personalize the dashboard
    if (assessment.stellaRecommendations) {
      // Update STELLA recommendations
      updateSTELLARecommendations(assessment.stellaRecommendations);
    }
    
    if (assessment.results && assessment.results.scores) {
      // Update score displays
      updateScoreDisplays(assessment.results.scores);
    }
    
    return assessment;
  } catch (error) {
    console.error(`Error loading ${type} assessment results:`, error);
    return null;
  }
}

/**
 * Update STELLA AI recommendations section with assessment-based guidance
 */
function updateSTELLARecommendations(recommendations) {
  const recommendationsContainer = document.querySelector('.stella-recommendations');
  if (!recommendationsContainer) return;
  
  // Clear any loading state
  recommendationsContainer.innerHTML = '';
  
  // Add recommendation message if available
  if (recommendations.message) {
    recommendationsContainer.innerHTML += `
      <div class="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-4">
        <h3 class="font-semibold text-blue-300 mb-2">STELLA's Recommendation</h3>
        <p class="text-gray-300">${recommendations.message}</p>
      </div>
    `;
  }
  
  // Add action items if available
  if (recommendations.actionItems && recommendations.actionItems.length > 0) {
    const actionItemsHTML = recommendations.actionItems
      .map(item => `<li class="flex items-start mb-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        <span>${item}</span>
      </li>`)
      .join('');
      
    recommendationsContainer.innerHTML += `
      <div class="bg-gray-800/50 rounded-lg p-4">
        <h3 class="font-semibold mb-3">Suggested Next Steps</h3>
        <ul class="space-y-1">
          ${actionItemsHTML}
        </ul>
      </div>
    `;
  }
  
  // Add suggested modules if available
  if (recommendations.suggestedModules && recommendations.suggestedModules.length > 0) {
    const modulesHTML = recommendations.suggestedModules
      .map(module => `<a href="/training/${module.toLowerCase().replace(/\s+/g, '-')}.html" 
          class="block bg-blue-900/20 hover:bg-blue-900/30 rounded-lg p-3 mb-2 transition-colors">
        <div class="font-medium">${module}</div>
      </a>`)
      .join('');
      
    recommendationsContainer.innerHTML += `
      <div class="mt-4">
        <h3 class="font-semibold mb-3">Recommended Training Modules</h3>
        <div>
          ${modulesHTML}
        </div>
      </div>
    `;
  }
}

/**
 * Update score displays in the dashboard
 */
function updateScoreDisplays(scores) {
  const scoreElements = document.querySelectorAll('[data-score-type]');
  
  scoreElements.forEach(element => {
    const scoreType = element.dataset.scoreType;
    const scoreValue = scores[scoreType];
    
    if (scoreValue !== undefined) {
      // Update the score display
      element.textContent = `${scoreValue}%`;
      
      // If this is a progress bar, update the width
      if (element.classList.contains('progress-fill')) {
        element.style.width = `${scoreValue}%`;
      }
      
      // Update color based on score range
      if (scoreValue >= 80) {
        element.classList.add('text-green-400');
      } else if (scoreValue >= 60) {
        element.classList.add('text-blue-400');
      } else if (scoreValue >= 40) {
        element.classList.add('text-yellow-400');
      } else {
        element.classList.add('text-red-400');
      }
    }
  });
}

/**
 * Update countdown section visibility based on assessment completion
 */
function updateCountdownVisibility(showCountdown) {
  const countdownSection = document.querySelector('.countdown-section');
  const countdownPlaceholder = document.querySelector('.countdown-placeholder');
  
  if (!countdownSection || !countdownPlaceholder) return;
  
  if (showCountdown) {
    countdownSection.classList.remove('hidden');
    countdownPlaceholder.classList.add('hidden');
    
    // Initialize the actual countdown
    initializeCountdown();
  } else {
    countdownSection.classList.add('hidden');
    countdownPlaceholder.classList.remove('hidden');
  }
}

/**
 * Update mission status section based on assessment completion
 */
function updateMissionStatusSection(showMissions) {
  const missionStatusContent = document.querySelector('.mission-status-content');
  const missionStatusPlaceholder = document.querySelector('.mission-status-placeholder');
  
  if (!missionStatusContent || !missionStatusPlaceholder) return;
  
  if (showMissions) {
    missionStatusContent.classList.remove('hidden');
    missionStatusPlaceholder.classList.add('hidden');
    
    // Load mission data
    loadUserMissions();
  } else {
    missionStatusContent.classList.add('hidden');
    missionStatusPlaceholder.classList.remove('hidden');
  }
}

/**
 * Highlight the initial assessment card to draw attention
 */
function highlightInitialAssessment() {
  const initialAssessmentCard = document.querySelector('[data-assessment-type="initial"]');
  if (!initialAssessmentCard) return;
  
  initialAssessmentCard.classList.add('ring-2', 'ring-blue-500', 'pulse-animation');
  
  // Add pulsing animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
      100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
    }
    .pulse-animation {
      animation: pulse 2s infinite;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Load user training progress data
 */
async function loadTrainingProgress() {
  try {
    const userId = getUserId();
    const response = await fetch(`/api/progress/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to load training progress');
    }
    
    const { success, progress } = await response.json();
    
    if (!success) {
      throw new Error('Error in progress response');
    }
    
    // Update module progress cards
    updateModuleProgressCards(progress);
    
  } catch (error) {
    console.error('Error loading training progress:', error);
    // Show empty state
    showEmptyTrainingState();
  }
}

/**
 * Update module progress cards with actual progress data
 */
function updateModuleProgressCards(progress) {
  const moduleCards = document.querySelectorAll('[data-module-id]');
  
  moduleCards.forEach(card => {
    const moduleId = card.dataset.moduleId;
    const moduleProgress = progress.find(p => p.moduleId === moduleId);
    
    // Get the relevant elements within this card
    const progressBar = card.querySelector('.progress-fill');
    const percentageDisplay = card.querySelector('.module-completion');
    const sessionsDisplay = card.querySelector('.completed-sessions');
    
    if (moduleProgress) {
      // Module has progress data
      const completionPercentage = moduleProgress.completionPercentage || 0;
      
      // Update progress bar
      if (progressBar) {
        progressBar.style.width = `${completionPercentage}%`;
      }
      
      // Update percentage text
      if (percentageDisplay) {
        percentageDisplay.textContent = `${completionPercentage}% Complete`;
      }
      
      // Update sessions info if available
      if (sessionsDisplay && moduleProgress.completedSessions) {
        sessionsDisplay.textContent = `${moduleProgress.completedSessions} Sessions`;
      }
      
      // Update status indicators
      card.classList.remove('opacity-70');
      
      const statusBadge = card.querySelector('.module-status');
      if (statusBadge) {
        if (completionPercentage >= 100) {
          statusBadge.textContent = 'Completed';
          statusBadge.classList.add('bg-green-900/50', 'text-green-300');
        } else if (completionPercentage > 0) {
          statusBadge.textContent = 'In Progress';
          statusBadge.classList.add('bg-blue-900/50', 'text-blue-300');
        } else {
          statusBadge.textContent = 'Not Started';
          statusBadge.classList.add('bg-gray-800/50', 'text-gray-300');
        }
      }
    } else {
      // No progress data for this module
      if (progressBar) {
        progressBar.style.width = '0%';
      }
      
      if (percentageDisplay) {
        percentageDisplay.textContent = '0% Complete';
      }
      
      // Update status indicators
      card.classList.add('opacity-70');
      
      const statusBadge = card.querySelector('.module-status');
      if (statusBadge) {
        statusBadge.textContent = 'Not Started';
        statusBadge.classList.add('bg-gray-800/50', 'text-gray-300');
      }
    }
  });
}

/**
 * Show empty training state UI
 */
function showEmptyTrainingState() {
  const moduleCards = document.querySelectorAll('[data-module-id]');
  
  moduleCards.forEach(card => {
    // Reset all cards to empty state
    const progressBar = card.querySelector('.progress-fill');
    if (progressBar) {
      progressBar.style.width = '0%';
    }
    
    card.classList.add('opacity-70');
    
    const statusBadge = card.querySelector('.module-status');
    if (statusBadge) {
      statusBadge.textContent = 'Not Started';
      statusBadge.classList.add('bg-gray-800/50', 'text-gray-300');
    }
  });
}

/**
 * Setup event handlers for navigation elements
 */
function setupNavigationHandlers() {
  // Tab switching
  const tabButtons = document.querySelectorAll('[data-tab-target]');
  const tabContents = document.querySelectorAll('[data-tab-content]');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const target = button.dataset.tabTarget;
      
      // Update active state for buttons
      tabButtons.forEach(btn => {
        btn.classList.remove('bg-blue-700', 'text-white');
        btn.classList.add('bg-gray-800', 'text-gray-300');
      });
      button.classList.remove('bg-gray-800', 'text-gray-300');
      button.classList.add('bg-blue-700', 'text-white');
      
      // Show target content, hide others
      tabContents.forEach(content => {
        if (content.dataset.tabContent === target) {
          content.classList.remove('hidden');
        } else {
          content.classList.add('hidden');
        }
      });
    });
  });
  
  // Mobile menu toggle
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  
  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }
}

/**
 * Load user missions data
 */
async function loadUserMissions() {
  try {
    const userId = getUserId();
    const response = await fetch(`/api/missions/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to load missions data');
    }
    
    const { success, missions } = await response.json();
    
    if (!success) {
      throw new Error('Error in missions response');
    }
    
    // Update missions display
    updateMissionsDisplay(missions);
    
  } catch (error) {
    console.error('Error loading missions:', error);
    // Show empty state for missions
    showEmptyMissionsState();
  }
}

/**
 * Update missions display with data
 */
function updateMissionsDisplay(missions) {
  const missionsContainer = document.querySelector('.missions-container');
  if (!missionsContainer) return;
  
  // Clear loading state
  missionsContainer.innerHTML = '';
  
  if (!missions || missions.length === 0) {
    missionsContainer.innerHTML = `
      <div class="text-center py-8">
        <p class="text-gray-400">No missions available yet. Complete your initial assessment to unlock missions.</p>
      </div>
    `;
    return;
  }
  
  // Add each mission
  missions.forEach(mission => {
    const missionCard = document.createElement('div');
    missionCard.className = 'mission-card bg-gray-800/50 rounded-lg p-4 mb-4 border border-gray-700';
    
    const progressPercentage = mission.progress || 0;
    const statusClass = mission.status === 'active' ? 'bg-blue-900/50 text-blue-300' :
                       mission.status === 'completed' ? 'bg-green-900/50 text-green-300' :
                       'bg-gray-700/50 text-gray-300';
    
    missionCard.innerHTML = `
      <div class="flex justify-between items-center mb-2">
        <h3 class="font-semibold">${mission.name}</h3>
        <span class="text-xs px-2 py-1 rounded ${statusClass}">${mission.status.toUpperCase()}</span>
      </div>
      <p class="text-sm text-gray-400 mb-3">${mission.description}</p>
      <div class="progress-bar rounded-full bg-gray-700 h-2 mb-2">
        <div class="progress-fill bg-blue-500 h-2 rounded-full" style="width: ${progressPercentage}%"></div>
      </div>
      <div class="flex justify-between text-xs">
        <span>${progressPercentage}% Complete</span>
        <span>${mission.exercisesCompleted || 0}/${mission.totalExercises || 0} Exercises</span>
      </div>
      <div class="mt-4">
        <a href="/missions/${mission.id}.html" 
           class="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          ${mission.status === 'not_started' ? 'Start Mission' : 
            mission.status === 'active' ? 'Continue Mission' : 
            'View Results'}
        </a>
      </div>
    `;
    
    missionsContainer.appendChild(missionCard);
  });
}

/**
 * Show empty missions state
 */
function showEmptyMissionsState() {
  const missionsContainer = document.querySelector('.missions-container');
  if (!missionsContainer) return;
  
  missionsContainer.innerHTML = `
    <div class="text-center py-8">
      <p class="text-gray-400">Complete your initial assessment to unlock missions.</p>
      <a href="/assessment.html?type=initial" class="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
        Start Initial Assessment
      </a>
    </div>
  `;
}
/**
 * Send message to STELLA AI
 */
function sendMessageToSTELLA() {
  const stellaInput = document.getElementById('stella-question');
  const stellaConversation = document.querySelector('.stella-conversation');
  const question = stellaInput.value.trim();
  
  if (!question) return;
  
  // Clear input
  stellaInput.value = '';
  
  // Display user message
  displayMessage('user', question);
  
  // Show typing indicator
  displayTypingIndicator();
  
  // Get session ID from localStorage
  const sessionId = localStorage.getItem('stella_session_id') || `session_${Date.now()}`;
  
  // Get conversation history
  const conversationHistory = JSON.parse(localStorage.getItem('stella_conversation_history') || '[]');
  
  // Call STELLA API
  fetch('/api/stella/guidance', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({
          userId: getUserId(),
          question: question,
          context: {
              currentPage: 'mission-control',
              moduleContext: getCurrentModule()
          },
          sessionId: sessionId,
          conversationHistory: conversationHistory
      })
  })
  .then(response => response.json())
  .then(data => {
      // Remove typing indicator
      removeTypingIndicator();
      
      if (data.success) {
          // Display STELLA response
          displayMessage('stella', data.guidance.message);
          
          // Store feedback token for later use
          if (data.feedbackToken) {
              stellaConversation.lastElementChild.dataset.feedbackToken = data.feedbackToken;
          }
          
          // Update conversation history
          conversationHistory.push({
              role: 'user',
              content: question
          });
          conversationHistory.push({
              role: 'assistant',
              content: data.guidance.message
          });
          
          // Limit history to last 10 messages
          while (conversationHistory.length > 10) {
              conversationHistory.shift();
          }
          
          localStorage.setItem('stella_conversation_history', JSON.stringify(conversationHistory));
          
          // Display action items if any
          if (data.guidance.actionItems && data.guidance.actionItems.length > 0) {
              displayActionItems(data.guidance.actionItems);
          }
          
          // Update countdown if provided
          if (data.countdown && data.countdown.timelineImpact) {
              updateCountdown(data.countdown);
          }
          
          // Show recommendations if available
          if (data.adaptiveLearning && data.adaptiveLearning.recommendedNextSteps) {
              showRecommendations(data.adaptiveLearning.recommendedNextSteps);
          }
      } else {
          displayMessage('system', "I'm having trouble processing your request. Please try again.");
      }
  })
  .catch(error => {
      console.error('Error sending message to STELLA:', error);
      removeTypingIndicator();
      displayMessage('system', "Connection to mission control interrupted. Please try again.");
  });
}

/**
* Display message in conversation
*/
function displayMessage(sender, message) {
  const stellaConversation = document.querySelector('.stella-conversation');
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', sender);
  
  const content = document.createElement('div');
  content.classList.add('message-content');
  content.innerHTML = message;
  
  messageElement.appendChild(content);
  
  // Add feedback buttons for STELLA messages
  if (sender === 'stella') {
      const feedbackElement = document.createElement('div');
      feedbackElement.classList.add('message-feedback');
      feedbackElement.innerHTML = `
          <button class="feedback-helpful" title="Helpful"><i class="fas fa-thumbs-up"></i></button>
          <button class="feedback-unhelpful" title="Not Helpful"><i class="fas fa-thumbs-down"></i></button>
      `;
      messageElement.appendChild(feedbackElement);
      
      // Add event listeners for feedback
      setTimeout(() => {
          const helpfulBtn = messageElement.querySelector('.feedback-helpful');
          const unhelpfulBtn = messageElement.querySelector('.feedback-unhelpful');
          
          helpfulBtn.addEventListener('click', () => provideFeedback(messageElement, true));
          unhelpfulBtn.addEventListener('click', () => provideFeedback(messageElement, false));
      }, 100);
  }
  
  stellaConversation.appendChild(messageElement);
  
  // Scroll to bottom
  stellaConversation.scrollTop = stellaConversation.scrollHeight;
}

/**
* Display typing indicator
*/
function displayTypingIndicator() {
  const stellaConversation = document.querySelector('.stella-conversation');
  const typingIndicator = document.createElement('div');
  typingIndicator.classList.add('message', 'stella', 'typing-indicator');
  typingIndicator.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
  
  stellaConversation.appendChild(typingIndicator);
  stellaConversation.scrollTop = stellaConversation.scrollHeight;
}

/**
* Remove typing indicator
*/
function removeTypingIndicator() {
  const typingIndicator = document.querySelector('.typing-indicator');
  if (typingIndicator) {
      typingIndicator.remove();
  }
}

/**
* Display action items
*/
function displayActionItems(actionItems) {
  const stellaConversation = document.querySelector('.stella-conversation');
  const lastMessage = stellaConversation.lastElementChild;
  
  const actionsElement = document.createElement('div');
  actionsElement.classList.add('action-items');
  
  let actionsHTML = '<h4>Recommended Actions:</h4><ul>';
  actionItems.forEach(item => {
      actionsHTML += `<li>${item}</li>`;
  });
  actionsHTML += '</ul>';
  
  actionsElement.innerHTML = actionsHTML;
  lastMessage.appendChild(actionsElement);
}

/**
* Provide feedback on STELLA response
*/
function provideFeedback(messageElement, helpful) {
  const feedbackToken = messageElement.dataset.feedbackToken;
  if (!feedbackToken) {
      console.warn('No feedback token available for this message');
      return;
  }
  
  // Disable feedback buttons
  const feedbackButtons = messageElement.querySelectorAll('.message-feedback button');
  feedbackButtons.forEach(btn => btn.disabled = true);
  
  // Show feedback submitted message
  const feedbackElement = messageElement.querySelector('.message-feedback');
  feedbackElement.innerHTML = '<span class="feedback-submitted">Feedback submitted</span>';
  
  // Send feedback to API
  fetch('/api/stella/feedback', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({
          feedbackToken: feedbackToken,
          helpful: helpful,
          rating: helpful ? 4 : 2
      })
  })
  .then(response => response.json())
  .then(data => {
      console.log('Feedback submitted:', data);
  })
  .catch(error => {
      console.error('Error submitting feedback:', error);
  });
}

/**
* Update countdown display
*/
function updateCountdown(countdownData) {
  const countdownElement = document.getElementById('mission-countdown');
  if (!countdownElement) return;
  
  if (countdownData.timelineImpact && countdownData.timelineImpact.timelineChange) {
      // Show impact notification
      const notification = document.createElement('div');
      notification.classList.add('countdown-impact');
      notification.innerHTML = `
          <div class="impact-message">
              <i class="fas fa-clock"></i>
              <span>${countdownData.timelineImpact.impactDescription}</span>
              <span class="impact-value">-${countdownData.timelineImpact.timelineChange} days</span>
          </div>
      `;
      
      document.body.appendChild(notification);
      
      // Remove after 5 seconds
      setTimeout(() => {
          notification.classList.add('fade-out');
          setTimeout(() => notification.remove(), 500);
      }, 5000);
  }
  
  // Update countdown display if it exists
  if (countdownData.daysRemaining) {
      countdownElement.textContent = countdownData.daysRemaining.toFixed(1);
  }
}

/**
* Show recommended next steps
*/
function showRecommendations(nextSteps) {
  const recommendationsContainer = document.getElementById('recommendations-container');
  if (!recommendationsContainer) return;
  
  recommendationsContainer.innerHTML = '';
  
  nextSteps.forEach(step => {
      const stepElement = document.createElement('div');
      stepElement.classList.add('recommendation');
      stepElement.innerHTML = `
          <div class="recommendation-title">${step.title}</div>
          <div class="recommendation-description">${step.description}</div>
          <a href="${step.url}" class="recommendation-action">Start Now</a>
      `;
      
      recommendationsContainer.appendChild(stepElement);
  });
  
  // Show recommendations panel
  recommendationsContainer.parentElement.classList.add('show');
}

/**
* Get current user ID
*/
function getUserId() {
  // Replace with your actual user ID retrieval logic
  return localStorage.getItem('userId') || 'test-user';
}

/**
* Get current module context
*/
function getCurrentModule() {
  // Replace with your actual module context retrieval logic
  return document.body.dataset.currentModule || 'mission-control';
}

/**
 * Initialize the countdown timer
 */
function initializeSpaceCountdown() {
  // Get user's custom timeline if available
  fetch(`/api/users/${getUserId()}/timeline`)
    .then(response => response.json())
    .then(data => {
      if (data.success && data.timeline) {
        updateCountdownDisplay(data.timeline);
      } else {
        // Use default countdown
       // Use default countdown
       const defaultTimeline = {
        years: 8,
        months: 3,
        days: 15,
        hours: 6,
        minutes: 22,
        seconds: 37
      };
      updateCountdownDisplay(defaultTimeline);
    }
  })
  .catch(error => {
    console.error('Error loading timeline:', error);
    // Use default countdown on error
    const defaultTimeline = {
      years: 8,
      months: 3,
      days: 15,
      hours: 6,
      minutes: 22,
      seconds: 37
    };
    updateCountdownDisplay(defaultTimeline);
  });
  
// Start the countdown update interval
startCountdownTimer();
}

/**
* Update countdown display with timeline data
*/
function updateCountdownDisplay(timeline) {
// Update each countdown box
Object.entries(timeline).forEach(([unit, value]) => {
  const countdownElement = document.querySelector(`.countdown-value[data-unit="${unit}"]`);
  if (countdownElement) {
    countdownElement.textContent = value.toString().padStart(2, '0');
  }
});

// Store the end date for the countdown timer
const now = new Date();
const endDate = new Date(now);
endDate.setFullYear(endDate.getFullYear() + (timeline.years || 0));
endDate.setMonth(endDate.getMonth() + (timeline.months || 0));
endDate.setDate(endDate.getDate() + (timeline.days || 0));
endDate.setHours(endDate.getHours() + (timeline.hours || 0));
endDate.setMinutes(endDate.getMinutes() + (timeline.minutes || 0));
endDate.setSeconds(endDate.getSeconds() + (timeline.seconds || 0));

// Store end date in local storage for timer
localStorage.setItem('countdown_end_date', endDate.toISOString());
}

/**
* Start countdown timer interval
*/
function startCountdownTimer() {
// Update every second
setInterval(() => {
  const endDateString = localStorage.getItem('countdown_end_date');
  if (!endDateString) return;
  
  const endDate = new Date(endDateString);
  const now = new Date();
  const diff = endDate - now;
  
  if (diff <= 0) {
    // Countdown complete
    document.querySelectorAll('.countdown-value').forEach(el => {
      el.textContent = '00';
    });
    return;
  }
  
  // Calculate remaining time
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
  const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
  const days = Math.floor((diff % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  // Update display
  const timeUnits = { years, months, days, hours, minutes, seconds };
  Object.entries(timeUnits).forEach(([unit, value]) => {
    const countdownElement = document.querySelector(`.countdown-value[data-unit="${unit}"]`);
    if (countdownElement) {
      countdownElement.textContent = value.toString().padStart(2, '0');
    }
  });
}, 1000);
}

/**
* Setup assessment card click handlers
*/
function setupAssessmentCards() {
document.querySelectorAll('.assessment-card').forEach(card => {
  const actionButton = card.querySelector('button, a');
  if (!actionButton) return;
  
  // If disabled, show a message explaining why
  if (actionButton.hasAttribute('disabled')) {
    actionButton.addEventListener('click', function(e) {
      e.preventDefault();
      showNotification('Complete your initial assessment first to unlock this assessment', 'info');
    });
  }
});
}

/**
* Setup space background visual effects
*/
function setupSpaceBackgroundEffects() {
// Add orbital rings animation
const orbitalRings = document.querySelectorAll('.orbital-ring');
if (orbitalRings.length > 0) {
  // Add rotation animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes rotate {
      from { transform: translate(-50%, -50%) rotate(0deg); }
      to { transform: translate(-50%, -50%) rotate(360deg); }
    }
    .orbital-ring {
      animation: rotate 120s linear infinite;
    }
    .orbital-ring:nth-child(2) {
      animation-duration: 180s;
      animation-direction: reverse;
    }
    .orbital-ring:nth-child(3) {
      animation-duration: 240s;
    }
  `;
  document.head.appendChild(style);
}

// Add radar scan effect
const radarGrid = document.querySelector('.radar-grid');
if (radarGrid) {
  // Create radar scan line
  const scanLine = document.createElement('div');
  scanLine.className = 'radar-scan-line';
  radarGrid.appendChild(scanLine);
  
  // Add radar scan animation
  const style = document.createElement('style');
  style.textContent = `
    .radar-scan-line {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 50%;
      height: 1px;
      background: linear-gradient(90deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.7));
      transform-origin: left center;
      animation: radar-scan 8s linear infinite;
    }
    @keyframes radar-scan {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

// Add twinkling stars effect
const starsOverlay = document.querySelector('.stars-overlay');
if (starsOverlay) {
  // Generate random stars
  for (let i = 0; i < 50; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.top = `${Math.random() * 100}%`;
    star.style.left = `${Math.random() * 100}%`;
    star.style.animationDelay = `${Math.random() * 5}s`;
    starsOverlay.appendChild(star);
  }
  
  // Add star twinkling animation
  const style = document.createElement('style');
  style.textContent = `
    .star {
      position: absolute;
      width: 2px;
      height: 2px;
      background-color: white;
      border-radius: 50%;
      animation: twinkle 5s infinite ease-in-out;
    }
    @keyframes twinkle {
      0%, 100% { opacity: 0.2; }
      50% { opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}
}

/**
* Show notification message
*/
function showNotification(message, type = 'info') {
const notificationContainer = document.getElementById('notification-container');
if (!notificationContainer) {
  // Create container if it doesn't exist
  const container = document.createElement('div');
  container.id = 'notification-container';
  container.className = 'fixed top-4 right-4 z-50 flex flex-col items-end space-y-2';
  document.body.appendChild(container);
}

// Create notification element
const notification = document.createElement('div');
notification.className = 'transform transition-all duration-300 ease-out translate-x-full';

// Style based on type
let bgColor, icon;
switch (type) {
  case 'success':
    bgColor = 'bg-green-800 border-green-600';
    icon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>`;
    break;
  case 'error':
    bgColor = 'bg-red-800 border-red-600';
    icon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>`;
    break;
  case 'warning':
    bgColor = 'bg-yellow-800 border-yellow-600';
    icon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>`;
    break;
  default: // info
    bgColor = 'bg-blue-800 border-blue-600';
    icon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>`;
}

notification.innerHTML = `
  <div class="px-4 py-3 rounded-lg shadow-lg ${bgColor} border text-white flex items-start">
    <div class="flex-shrink-0 mr-2">
      ${icon}
    </div>
    <div>${message}</div>
    <button class="ml-4 text-white focus:outline-none" onclick="this.parentElement.parentElement.remove()">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    </button>
  </div>
`;

// Add to container
document.getElementById('notification-container').appendChild(notification);

// Trigger animation
setTimeout(() => {
  notification.classList.remove('translate-x-full');
  notification.classList.add('translate-x-0');
}, 10);

// Auto-remove after timeout
setTimeout(() => {
  notification.classList.remove('translate-x-0');
  notification.classList.add('translate-x-full');
  
  // Remove from DOM after animation
  setTimeout(() => {
    notification.remove();
  }, 300);
}, 5000);
}

/**
* Helper function to get user ID
*/
function getUserId() {
// Get from local storage or session storage
return localStorage.getItem('userId') || 
       sessionStorage.getItem('userId') || 
       'anonymous';
}

// Initialize mission control when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
// Initialize dashboard components
initializeMissionControl();
});