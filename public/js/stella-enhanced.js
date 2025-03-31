// public/js/stella-enhanced.js
class StellaEnhanced {
    constructor(chatContainerId, inputId, sendButtonId, userId) {
      this.chatContainer = document.getElementById(chatContainerId);
      this.input = document.getElementById(inputId);
      this.sendButton = document.getElementById(sendButtonId);
      this.userId = userId || 'test-user';
      
      this.initEventListeners();
    }
  
    initEventListeners() {
      this.sendButton.addEventListener('click', () => this.sendMessage());
      this.input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }
  
    initialize() {
      this.addSystemMessage('STELLA initialized and ready to assist with your space training.');
    }
  
    async sendMessage() {
      const message = this.input.value.trim();
      if (!message) return;
      
      // Clear input
      this.input.value = '';
      
      // Add user message to chat
      this.addUserMessage(message);
      
      // Add typing indicator
      const typingId = this.addTypingIndicator();
      
      try {
        const response = await fetch('/api/stella/guidance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: this.userId,
            question: message
          })
        });
        
        const data = await response.json();
        
        // Remove typing indicator
        this.removeTypingIndicator(typingId);
        
        if (data.success) {
          this.addStellaMessage(data.guidance.message);
        } else {
          this.addSystemMessage('Sorry, I encountered an error processing your request.');
        }
      } catch (error) {
        console.error('Error sending message to STELLA:', error);
        this.removeTypingIndicator(typingId);
        this.addSystemMessage('Connection error. Please try again.');
      }
    }
  
    addUserMessage(message) {
      const messageElement = document.createElement('div');
      messageElement.className = 'message user-message';
      messageElement.innerHTML = `
        <div class="message-content">
          <p>${this.escapeHtml(message)}</p>
        </div>
      `;
      this.chatContainer.appendChild(messageElement);
      this.scrollToBottom();
    }
  
    addStellaMessage(message) {
      const messageElement = document.createElement('div');
      messageElement.className = 'message stella-message';
      messageElement.innerHTML = `
        <div class="avatar">
          <img src="https://via.placeholder.com/40" alt="STELLA">
        </div>
        <div class="message-content">
          <p>${this.formatMessage(message)}</p>
        </div>
      `;
      
      this.chatContainer.appendChild(messageElement);
      this.scrollToBottom();
    }
  
    addSystemMessage(message) {
      const messageElement = document.createElement('div');
      messageElement.className = 'message system-message';
      messageElement.innerHTML = `
        <div class="message-content">
          <p>${this.escapeHtml(message)}</p>
        </div>
      `;
      this.chatContainer.appendChild(messageElement);
      this.scrollToBottom();
    }
  
    addTypingIndicator() {
      const id = 'typing-' + Date.now();
      const indicatorElement = document.createElement('div');
      indicatorElement.id = id;
      indicatorElement.className = 'message stella-message typing';
      indicatorElement.innerHTML = `
        <div class="avatar">
          <img src="https://via.placeholder.com/40" alt="STELLA">
        </div>
        <div class="message-content">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      `;
      this.chatContainer.appendChild(indicatorElement);
      this.scrollToBottom();
      return id;
    }
  
    removeTypingIndicator(id) {
      const element = document.getElementById(id);
      if (element) {
        element.remove();
      }
    }
  
    formatMessage(message) {
      // Replace markdown-style formatting
      let formatted = this.escapeHtml(message);
      
      // Bold
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Italic
      formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
      
      // Lists
      formatted = formatted.replace(/^- (.*)/gm, '<li>$1</li>');
      
      // Wrap lists in ul tags
      if (formatted.includes('<li>')) {
        formatted = formatted.replace(/(<li>.*?<\/li>)+/gs, '<ul>$&</ul>');
      }
      
      // Convert line breaks
      formatted = formatted.replace(/\n/g, '<br>');
      
      return formatted;
    }
  
    escapeHtml(unsafe) {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
  
    scrollToBottom() {
      this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }
  }