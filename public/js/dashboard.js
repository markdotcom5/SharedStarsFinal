// public/js/dashboard.js
import AIAssistant from '../visualizations/AIAssistant.js';

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
