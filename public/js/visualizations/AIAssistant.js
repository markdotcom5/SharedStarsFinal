// public/visualizations/AIAssistant.js

class AIAssistant {
  constructor() {
    // Check if a container already exists; otherwise, create one.
    this.container = document.getElementById('ai-guidance-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'ai-guidance-container';
      // Add styling classes (adjust as needed)
      this.container.classList.add(
        'ai-guidance-container',
        'p-4',
        'rounded-lg',
        'bg-blue-900/30',
        'text-white',
        'fixed',
        'top-20',
        'right-4',
        'max-w-sm',
        'shadow-lg',
        'z-50'
      );
      // Optionally add a header
      const header = document.createElement('div');
      header.classList.add('text-lg', 'font-bold', 'mb-2');
      header.textContent = 'AI Assistant';
      this.container.appendChild(header);
      
      // Append container to body
      document.body.appendChild(this.container);
    }
  }

  /**
   * Displays a guidance message.
   * The message fades in smoothly.
   * @param {string} message - The guidance message to display.
   */
  showGuidance(message) {
    const messageEl = document.createElement('div');
    messageEl.classList.add('ai-guidance-message', 'opacity-0', 'transition-opacity', 'duration-500', 'mb-2');
    messageEl.textContent = message;
    this.container.appendChild(messageEl);
    
    // Trigger reflow to apply transition
    void messageEl.offsetWidth;
    messageEl.classList.remove('opacity-0');
  }

  /**
   * Clears all guidance messages from the container.
   */
  clearGuidance() {
    this.container.innerHTML = '';
  }

  /**
   * Optionally, update the current guidance message.
   * If there's an existing message, update it with a fade transition.
   * @param {string} message - The new guidance message.
   */
  updateGuidance(message) {
    // If there is an existing message, update its text.
    const existing = this.container.querySelector('.ai-guidance-message:last-child');
    if (existing) {
      // Fade out the old message first
      existing.classList.add('opacity-0');
      setTimeout(() => {
        existing.textContent = message;
        existing.classList.remove('opacity-0');
      }, 500);
    } else {
      this.showGuidance(message);
    }
  }
}

// Export a singleton instance
export default new AIAssistant();
