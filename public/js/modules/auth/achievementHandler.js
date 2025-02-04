// public/js/modules/auth/achievementHandler.js (as an ES Module)
export default class AchievementDisplay {
    constructor() {
      this.initializeAchievementContainer();
    }
  
    initializeAchievementContainer() {
      const container = document.createElement('div');
      container.className = 'fixed bottom-4 right-4 flex flex-col gap-4 z-50';
      container.id = 'achievement-container';
      document.body.appendChild(container);
    }
  
    displayAchievement(achievement) {
      const notification = document.createElement('div');
      notification.className = `
        achievement-card 
        bg-gradient-to-r from-purple-900 to-blue-900 
        rounded-lg shadow-xl transform transition-all duration-500
        border border-blue-500/20 backdrop-blur-lg
        p-4 w-96
        animate-slide-in
      `;
      notification.innerHTML = `
        <div class="flex items-center gap-4">
          <div class="achievement-icon w-16 h-16 rounded-full 
               bg-gradient-to-r from-blue-500 to-purple-500 
               flex items-center justify-center text-2xl">
            ${achievement.icon}
          </div>
          <div class="flex-1">
            <div class="text-sm text-blue-400 font-semibold">Achievement Unlocked!</div>
            <div class="text-white font-bold text-lg">${achievement.title}</div>
            <div class="text-gray-300 text-sm">${achievement.description}</div>
          </div>
        </div>
        
        ${achievement.rewards ? `
            <div class="mt-3 bg-black/30 rounded p-2 text-sm text-blue-300">
                🎁 ${achievement.rewards}
            </div>
        ` : ''}
      `;
      const container = document.getElementById('achievement-container');
      container.appendChild(notification);
  
      // Remove after animation
      setTimeout(() => {
        notification.classList.add('animate-slide-out');
        setTimeout(() => notification.remove(), 500);
      }, 5000);
    }
  }
  