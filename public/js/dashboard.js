// public/js/dashboard.js
import AIAssistant from '../visualizations/AIAssistant.js';
// public/js/dashboard.js
const updateLeaderboardDisplay = (scoreData) => {
  const leaderboardElement = document.getElementById('leaderboard-section');
  
  const scoreBreakdown = `
      <div class="score-breakdown bg-gray-800 p-4 rounded-lg">
          <h3 class="text-xl font-bold mb-3">Training Score: ${scoreData.leaderboardScore}</h3>
          <div class="grid grid-cols-2 gap-4">
              <div class="stat-item">
                  <span class="font-medium">Sessions:</span>
                  <span>${scoreData.scoreBreakdown.sessionsScore}</span>
              </div>
              <div class="stat-item">
                  <span class="font-medium">Streak Bonus:</span>
                  <span>${scoreData.scoreBreakdown.streakScore}</span>
              </div>
              <div class="stat-item">
                  <span class="font-medium">Exercise Variety:</span>
                  <span>${scoreData.scoreBreakdown.exerciseVarietyScore}</span>
              </div>
              <div class="stat-item">
                  <span class="font-medium">Improvements:</span>
                  <span>${scoreData.scoreBreakdown.durationImprovementScore}</span>
              </div>
          </div>
      </div>
  `;
  
  leaderboardElement.innerHTML = scoreBreakdown;
};
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Assume you have a global userId (set it from your session data)
    const userId = window.currentUserId; // e.g., set by a server-rendered script tag
    // Initialize the AI assistant for this session
    await AIAssistant.initialize(userId, 'full_guidance');

    // Optionally, request a personalized greeting
    const response = await fetch('/api/ai/greeting', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    const greetingElement = document.getElementById('aiGreeting');
    if (greetingElement && data.greeting) {
      greetingElement.textContent = data.greeting;
    }
  } catch (error) {
    console.error('Error initializing AI in dashboard:', error);
  }
});
