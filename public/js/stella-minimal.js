const CONFIG = {
  apiBase: '/api/stella',        // ✅ Correct
  apiEndpoint: '/api/stella'     // ✅ Add this line explicitly
};


/**
 * stella-minimal.js - Client-side STELLA integration
 * This file should be placed in your public/js directory
 */

// STELLA Client Integration
const STELLA = {
    // Configuration
    config: {
      apiBase: '/api/stella',
      userId: 'anonymous',
      sessionId: null,
      autoConnect: true,
      debug: true
    },
    
    // State
    state: {
      connected: false,
      initialized: false,
      thinking: false,
      sessionId: null,
      conversationHistory: []
    },
    
    // Initialize STELLA client
    init: function(options = {}) {
      // Merge options with default config
      this.config = { ...this.config, ...options };
      
      this.log('🚀 STELLA Client Integration initialized');
      
      // Auto-connect if enabled
      if (this.config.autoConnect) {
        this.connect();
      }
      
      return this;
    },
    
    // Connect to STELLA
    connect: async function() {
      try {
        this.log(`🔹 Connecting user ${this.config.userId} to STELLA services`);
        
        // Initialize STELLA first
        const initResponse = await fetch(`${this.config.apiEndpoint}/initialize`);
        const connectResponse = await fetch(`${this.config.apiEndpoint}/connect`, { method: 'POST' });
        
        
        if (initData.success) {
          this.log(`✅ STELLA AI Fully Initialized`, initData);
          this.state.initialized = true;
          
          // Establish session if needed
          if (!this.state.sessionId) {
            try {
              const connectResponse = await fetch(`${this.config.apiBase}/connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: this.config.userId })
              });
              
              const sessionData = await connectResponse.json();
              
              if (sessionData.success) {
                this.state.sessionId = sessionData.sessionId;
                this.state.connected = true;
                this.log(`✅ Connected with session ${this.state.sessionId}`);
              }
            } catch (connectError) {
              console.error('Error connecting to STELLA:', connectError);
              // Fallback to a generated session ID
              this.state.sessionId = `stella_${Date.now()}`;
              this.state.connected = true;
              this.log(`⚠️ Fallback connection with session ${this.state.sessionId}`);
            }
          }
        } else {
          console.error('Failed to initialize STELLA:', initData);
        }
      } catch (error) {
        console.error('Error during STELLA initialization:', error);
      }
    },
    
    // Ask STELLA a question
    ask: async function(question, callback) {
      if (!question || question.trim() === '') {
        return { error: 'Please provide a question' };
      }
      
      if (!this.state.connected) {
        await this.connect();
      }
      
      this.state.thinking = true;
      
      try {
        // Add user message to history
        this.addToHistory({
          content: question,
          fromUser: true,
          timestamp: new Date()
        });
        
        // Call guidance endpoint
        const response = await fetch(`${this.config.apiBase}/guidance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: this.config.userId,
            question: question,
            sessionId: this.state.sessionId
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          const responseText = data.guidance.message;
          
          // Add STELLA's response to history
          this.addToHistory({
            content: responseText,
            fromUser: false,
            timestamp: new Date()
          });
          
          this.state.thinking = false;
          
          if (callback && typeof callback === 'function') {
            callback(null, responseText);
          }
          
          return { response: responseText };
        } else {
          console.error('Error from STELLA API:', data.error);
          this.state.thinking = false;
          
          if (callback && typeof callback === 'function') {
            callback(data.error, null);
          }
          
          return { error: data.error || 'Unknown error occurred' };
        }
      } catch (error) {
        console.error('Error asking STELLA:', error);
        this.state.thinking = false;
        
        if (callback && typeof callback === 'function') {
          callback(error.message, null);
        }
        
        return { error: error.message };
      }
    },
    
    // Add message to conversation history
    addToHistory: function(message) {
      this.state.conversationHistory.push(message);
      
      // Limit history size if needed
      if (this.state.conversationHistory.length > 50) {
        this.state.conversationHistory.shift();
      }
    },
    
    // Get conversation history
    getHistory: function() {
      return this.state.conversationHistory;
    },
    
    // Clear conversation history
    clearHistory: function() {
      this.state.conversationHistory = [];
    },
    
    // Provide feedback on a response
    provideFeedback: async function(helpful, rating = null, feedbackText = null) {
      if (!this.state.sessionId) {
        return { error: 'No active session' };
      }
      
      try {
        const response = await fetch(`${this.config.apiBase}/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: this.config.userId,
            sessionId: this.state.sessionId,
            helpful,
            rating,
            feedbackText
          })
        });
        
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error providing feedback:', error);
        return { error: error.message };
      }
    },
    
    // Logging helper
    log: function(message, data = null) {
      if (this.config.debug) {
        if (data) {
          console.log('STELLA:', message, data);
        } else {
          console.log('STELLA:', message);
        }
      }
    }
  };
  
  // Export for use in browser
  module.exports = router;