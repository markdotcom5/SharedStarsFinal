class AICompanion {
    constructor(userId) {
      this.userId = userId;
      this.currentModule = null;
      this.isTyping = false;
      this.messageQueue = [];
      this.initialize();
    }
  
    async initialize() {
      this.createCompanionElement();
      this.initializeEventListeners();
      await this.loadChatHistory();
    }
  
    createCompanionElement() {
      const companion = document.createElement("div");
      companion.className = "ai-companion";
      companion.innerHTML = `
        <div class="ai-avatar" id="aiAvatar">
          <div class="ai-status"></div>
          <div class="core">
            <i class="ai-icon">🚀</i>
          </div>
        </div>
        <div class="ai-message" id="aiMessage">
          <div class="message-content"></div>
          <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
        </div>
      `;
      document.body.appendChild(companion);
  
      this.avatar = document.getElementById("aiAvatar");
      this.messageBox = document.getElementById("aiMessage");
      this.messageContent = this.messageBox.querySelector(".message-content");
      this.typingIndicator = this.messageBox.querySelector(".typing-indicator");
    }
  
    initializeEventListeners() {
      this.avatar.addEventListener("click", async () => {
        if (this.messageBox.classList.contains("active")) {
          this.messageBox.classList.remove("active");
        } else {
          this.messageBox.classList.add("active");
          await this.showMessage("Hello! Ready to explore space? 🚀", 4000);
        }
      });
    }
  
    async showMessage(message, duration = 5000, sender = "ai") {
      this.messageQueue.push({ message, duration, sender });
  
      await this.saveChatMessage(sender, message);
      
      if (!this.isTyping) {
        this.processMessageQueue();
      }
    }
  
    async processMessageQueue() {
      if (this.messageQueue.length === 0) {
        this.isTyping = false;
        this.messageBox.classList.remove("active");
        return;
      }
  
      this.isTyping = true;
      const { message, duration, sender } = this.messageQueue.shift();
  
      this.messageBox.classList.add("active");
      this.typingIndicator.style.display = "flex";
      this.messageContent.textContent = "";
  
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.typingIndicator.style.display = "none";
  
      for (let char of message) {
        this.messageContent.textContent += char;
        await new Promise(resolve => setTimeout(resolve, 30));
      }
  
      await new Promise(resolve => setTimeout(resolve, duration));
      this.messageBox.classList.remove("active");
  
      this.processMessageQueue();
    }
  
    async saveChatMessage(sender, message) {
      try {
        await fetch("/api/chat/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: this.userId, sender, message }),
        });
      } catch (error) {
        console.error("Failed to save chat message:", error);
      }
    }
  
    async loadChatHistory() {
      try {
        const response = await fetch(`/api/chat/history?userId=${this.userId}`);
        const data = await response.json();
  
        if (data.messages) {
          for (let msg of data.messages) {
            await this.showMessage(msg.text, 2000, msg.sender);
          }
        }
      } catch (error) {
        console.error("Failed to load chat history:", error);
      }
    }
  }
  
  window.aiCompanion = new AICompanion("USER_ID_HERE"); // Replace USER_ID_HERE dynamically