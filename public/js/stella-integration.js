// At the top of stella-integration.js:
const CONFIG = {
  apiBase: '/api/stella'
};
/**
 * STELLA Integration - Frontend client for STELLA AI
 * Enhanced with better error handling, event system, and improved UX
 */
window.StellaIntegration = {
  config: {
    apiBase: '/api/stella',        // ✅ ADD THIS LINE!
    apiEndpoint: '/api/stella',    // ✅ KEEP THIS TOO!
    debug: false,
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    autoReconnect: true,
    offlineStorage: true,
    animationEnabled: true
  },
  ...  
  // Status variables
  isInitialized: false,
  isConnected: false,
  userId: null,
  sessionId: null,
  isThinking: false,
  conversationHistory: [],
  offlineQueue: [],
  
  // Animation control
  animationTimer: null,
  
  /**
   * Initialize the STELLA integration
   * @param {Object} options - Configuration options
   * @returns {Boolean} - Success status
   */
  init: function(options = {}) {
    // Override default config with custom options
    Object.assign(this.config, options);
    
    this._log('🚀 STELLA Integration initialized');
    this.isInitialized = true;

    // Set up UI event listeners
    this._setupUIEventListeners();

    // Check network status and set up listeners
    this._setupNetworkListeners();

    // Restore offline queue from localStorage if available
    this._restoreOfflineQueue();

    // Call backend initialization
    this._apiRequest('initialize', {})
      .then(result => {
        this._log('✅ STELLA AI Fully Initialized', result);
        
        // Dispatch initialization event
        document.dispatchEvent(new CustomEvent('stella:initialized', { 
          detail: { success: true, version: result.version }
        }));
      })
      .catch(error => {
        console.error('❌ STELLA AI Initialization Failed:', error);
        
        // Dispatch failed initialization event
        document.dispatchEvent(new CustomEvent('stella:initialized', { 
          detail: { success: false, error: error.message }
        }));
      });
      
    return true;
  },
  
  /**
   * Connect user to STELLA services
   * @param {String} userId - User ID to connect
   * @returns {Promise} - Connection result
   */
  connect: function(userId = 'anonymous') {
    if (!this.isInitialized) {
      console.error('❌ STELLA Integration: Must initialize before connecting');
      return Promise.reject(new Error('Not initialized'));
    }
    
    this._log(`🔹 Connecting user ${userId} to STELLA services`);
    this.userId = userId;
    
    return this._apiRequest('connect', { userId })
      .then(result => {
        this.isConnected = true;
        this.sessionId = result.sessionId || `stella_${Date.now()}`;
        this._log(`✅ Connected with session ${this.sessionId}`);
        
        // Process offline queue if any
        if (this.offlineQueue.length > 0) {
          this._processOfflineQueue();
        }
        
        // Dispatch connected event
        document.dispatchEvent(new CustomEvent('stella:connected', { 
          detail: { userId, sessionId: this.sessionId }
        }));
        
        return result;
      });
  },
  
  /**
   * Ask STELLA a question
   * @param {String} question - The question to ask
   * @param {Object} context - Additional context
   * @returns {Promise} - STELLA's response
   */
  askQuestion: function(question, context = {}) {
    if (!this._checkConnection()) {
      // If offline storage is enabled, store question for later
      if (this.config.offlineStorage) {
        this._queueOfflineQuestion(question, context);
        return Promise.reject(new Error('Not connected - Question saved for later'));
      }
      return Promise.reject(new Error('Not connected'));
    }
    
    this._log('🔹 Asking STELLA:', question);
    this.isThinking = true;
    
    // Trigger thinking animation if enabled
    if (this.config.animationEnabled) {
      this._triggerThinkingAnimation();
    }
    
    // Add question to conversation history
    this._addToConversationHistory({
      fromUser: true,
      content: question,
      timestamp: new Date()
    });
    
    // Dispatch question event
    document.dispatchEvent(new CustomEvent('stella:question', { 
      detail: { question, userId: this.userId }
    }));
    
    return this._apiRequest('guidance', { 
      userId: this.userId,
      question: question,
      sessionId: this.sessionId,
      exerciseId: context.exerciseId || null,
      moduleId: context.moduleId || null,
      metrics: context.metrics || {}
    }).then(response => {
      this.isThinking = false;
      
      // Add response to conversation history
      this._addToConversationHistory({
        fromUser: false,
        content: response.guidance.message,
        timestamp: new Date()
      });
      
      // Dispatch answer event
      document.dispatchEvent(new CustomEvent('stella:answer', { 
        detail: { 
          question, 
          answer: response.guidance.message,
          userId: this.userId 
        }
      }));
      
      return response;
    }).catch(error => {
      this.isThinking = false;
      
      // Dispatch error event
      document.dispatchEvent(new CustomEvent('stella:error', { 
        detail: { 
          question, 
          error: error.message,
          userId: this.userId 
        }
      }));
      
      throw error;
    });
  },
  
  /**
   * Provide feedback on STELLA's response
   * @param {Boolean} helpful - Whether the response was helpful
   * @param {Number} rating - Optional rating (1-5)
   * @param {String} comment - Optional feedback comment
   * @returns {Promise} - Feedback result
   */
  provideFeedback: function(helpful, rating = null, comment = null) {
    if (!this._checkConnection()) return Promise.reject(new Error('Not connected'));
    
    return this._apiRequest('feedback', {
      userId: this.userId,
      sessionId: this.sessionId,
      helpful: helpful,
      rating: rating,
      feedbackText: comment
    });
  },
  
  /**
   * Get STELLA system status
   * @returns {Promise} - System status
   */
  getStatus: function() {
    if (!this.isInitialized) {
      console.error('❌ STELLA Integration: Must initialize before checking status');
      return Promise.reject(new Error('Not initialized'));
    }
    
    return fetch(`${this.config.apiEndpoint}/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(result => {
      if (result.error) {
        throw new Error(result.error);
      }
      return result;
    });
  },
  
  /**
   * Clear conversation history
   */
  clearConversationHistory: function() {
    this.conversationHistory = [];
    localStorage.removeItem('stella_conversation_history');
    
    // Dispatch event
    document.dispatchEvent(new CustomEvent('stella:historyCleared', { 
      detail: { userId: this.userId }
    }));
  },
  
  /**
   * Get conversation history
   * @returns {Array} - Conversation history
   */
  getConversationHistory: function() {
    return this.conversationHistory;
  },
  
  /**
   * Trigger Sophon sword thinking animation
   * @private
   */
  _triggerThinkingAnimation: function() {
    const avatar = document.getElementById('sophon-avatar');
    const sword = document.getElementById('sophon-sword');
    const flash = document.querySelector('.flash-effect');
    
    if (avatar && sword) {
      // Add classes to start animation
      avatar.parentElement.classList.add('slicer-animation');
      
      // Clear previous animation timer if exists
      if (this.animationTimer) {
        clearTimeout(this.animationTimer);
      }
      
      // Remove animation classes after animation completes
      this.animationTimer = setTimeout(() => {
        avatar.parentElement.classList.remove('slicer-animation');
      }, 1500);
    }
  },
  
  /**
   * Make API request to backend with retry logic
   * @param {String} endpoint - API endpoint
   * @param {Object} data - Request data
   * @returns {Promise} - API response
   * @private
   */
  _apiRequest: function(endpoint, data) {
    return new Promise((resolve, reject) => {
      const attemptRequest = (attempt = 0) => {
        const url = `${this.config.apiEndpoint}/${endpoint}`;
        
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
          signal: AbortSignal.timeout(this.config.timeout)
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`STELLA API Error: ${response.status}`);
          }
          return response.json();
        })
        .then(result => {
          if (result.error) {
            reject(new Error(result.error));
          } else {
            resolve(result);
          }
        })
        .catch(error => {
          if (attempt < this.config.retryAttempts && !error.name === 'AbortError') {
            // Retry with exponential backoff
            const delay = this.config.retryDelay * Math.pow(2, attempt);
            this._log(`Retrying request (${attempt + 1}/${this.config.retryAttempts}) in ${delay}ms`);
            setTimeout(() => attemptRequest(attempt + 1), delay);
          } else {
            console.error(`❌ STELLA API Error (${endpoint}):`, error);
            reject(error);
          }
        });
      };
      
      // Start the first attempt
      attemptRequest();
    });
  },
  
  /**
   * Check if connected to STELLA
   * @returns {Boolean} - Connection status
   * @private
   */
  _checkConnection: function() {
    if (!this.isConnected) {
      console.error('❌ STELLA Integration: Must connect before using this feature');
      
      // Auto-reconnect if enabled
      if (this.config.autoReconnect && this.userId) {
        this._log('🔄 Attempting to reconnect...');
        this.connect(this.userId).catch(err => {
          this._log('❌ Reconnection failed:', err.message);
        });
      }
      
      return false;
    }
    return true;
  },
  
  /**
   * Add message to conversation history
   * @param {Object} message - Message object
   * @private
   */
  _addToConversationHistory: function(message) {
    this.conversationHistory.push(message);
    
    // Limit history size to prevent excessive memory usage
    if (this.conversationHistory.length > 100) {
      this.conversationHistory.shift();
    }
    
    // Persist to localStorage
    try {
      localStorage.setItem('stella_conversation_history', JSON.stringify(this.conversationHistory));
    } catch (error) {
      console.warn('Could not save conversation history to localStorage:', error);
    }
  },
  
  /**
   * Queue question for later when offline
   * @param {String} question - The question to ask
   * @param {Object} context - Additional context
   * @private
   */
  _queueOfflineQuestion: function(question, context) {
    this.offlineQueue.push({
      question,
      context,
      timestamp: Date.now()
    });
    
    // Persist to localStorage
    try {
      localStorage.setItem('stella_offline_queue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.warn('Could not save offline queue to localStorage:', error);
    }
    
    this._log(`📝 Question saved offline: "${question}"`);
  },
  
  /**
   * Restore offline queue from localStorage
   * @private
   */
  _restoreOfflineQueue: function() {
    try {
      const savedQueue = localStorage.getItem('stella_offline_queue');
      if (savedQueue) {
        this.offlineQueue = JSON.parse(savedQueue);
        this._log(`📂 Restored ${this.offlineQueue.length} offline questions`);
      }
    } catch (error) {
      console.warn('Could not restore offline queue from localStorage:', error);
    }
  },
  
  /**
   * Process offline queued questions
   * @private
   */
  _processOfflineQueue: function() {
    if (this.offlineQueue.length === 0) return;
    
    this._log(`🔄 Processing ${this.offlineQueue.length} offline questions`);
    
    // Process one question at a time to maintain order
    const processNext = () => {
      if (this.offlineQueue.length === 0) {
        localStorage.removeItem('stella_offline_queue');
        return;
      }
      
      const item = this.offlineQueue.shift();
      this.askQuestion(item.question, item.context)
        .then(() => {
          // Update localStorage with remaining queue
          localStorage.setItem('stella_offline_queue', JSON.stringify(this.offlineQueue));
          
          // Process next after a short delay
          setTimeout(processNext, 1000);
        })
        .catch(error => {
          // Put the item back at the front of the queue if it fails
          this.offlineQueue.unshift(item);
          localStorage.setItem('stella_offline_queue', JSON.stringify(this.offlineQueue));
          
          console.error('Failed to process offline question:', error);
        });
    };
    
    processNext();
  },
  
  /**
   * Set up network status listeners
   * @private
   */
  _setupNetworkListeners: function() {
    window.addEventListener('online', () => {
      this._log('🌐 Network connection restored');
      
      // Attempt to reconnect if previously connected
      if (this.config.autoReconnect && this.userId && !this.isConnected) {
        this.connect(this.userId);
      }
    });
    
    window.addEventListener('offline', () => {
      this._log('🔌 Network connection lost');
      this.isConnected = false;
    });
  },
  
  /**
   * Set up UI event listeners
   * @private
   */
  _setupUIEventListeners: function() {
    // Set up after DOM is fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this._attachUIEventListeners());
    } else {
      this._attachUIEventListeners();
    }
  },
  /**
 * Attach UI event listeners
 * @private
 */
_attachUIEventListeners: function() {
  // Handle Enter key press in the question input
  const questionInput = document.getElementById('stella-question');
  if (questionInput) {
    questionInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('send-to-stella').click();
      }
    });
  }
  
  // Handle click on the send button
  const sendButton = document.getElementById('send-to-stella');
  if (sendButton) {
    sendButton.addEventListener('click', () => {
      const question = questionInput.value.trim();
      if (question) {
        // Clear input
        questionInput.value = '';
        
        // Display user message
        this._displayMessage('user', question);
        
        // Send question
        this.askQuestion(question)
          .then(response => {
            // Display STELLA's response
            this._displayMessage('stella', response.guidance.message);
          })
          .catch(error => {
            console.error('Error asking STELLA:', error);
            // Show error message
            this._displayMessage('system', "I'm having trouble connecting. Please try again in a moment.");
          });
      }
    });
  }
  
  // Set up quick action buttons
  document.querySelectorAll('.stella-action-btn').forEach(button => {
    button.addEventListener('click', () => {
      const question = button.getAttribute('data-question');
      if (question) {
        // Set the question in the input field
        const questionInput = document.getElementById('stella-question');
        if (questionInput) {
          questionInput.value = question;
          // Trigger click on send button
          document.getElementById('send-to-stella').click();
        }
      }
    });
  });
},

/**
 * Display message in the conversation UI
 * @param {String} sender - Message sender (user, stella, system)
 * @param {String} message - Message content
 * @private
 */
_displayMessage: function(sender, message) {
  const stellaConversation = document.querySelector('.stella-conversation');
  if (!stellaConversation) return;
  
  const messageElement = document.createElement('div');
  messageElement.className = `message ${sender}`;
  
  const content = document.createElement('div');
  content.className = 'message-content';
  content.innerHTML = message;
  
  messageElement.appendChild(content);
  stellaConversation.appendChild(messageElement);
  
  // Scroll to bottom
  stellaConversation.scrollTop = stellaConversation.scrollHeight;
},
    // Set up quick action buttons
    document.querySelectorAll('.stella-action-btn').forEach(button => {
      button.addEventListener('click', () => {
        const question = button.getAttribute('data-question');
        if (question) {
          // Set the question in the input field
          const questionInput = document.getElementById('stella-question');
          if (questionInput) {
            questionInput.value = question;
            // Trigger click on send button
            document.getElementById('send-to-stella').click();
          }
        }
      });
    });
  },
 /**
 * Internal logging method
 * @param {String} message - Log message
 * @param {Object} data - Additional data
 * @private
 */
_log: function(message, data) {
  if (this.config.debug) {
    if (data) {
      console.log(`STELLA: ${message}`, data);
    } else {
      console.log(`STELLA: ${message}`);
    }
  }
}
};

// Initialize STELLA on page load if auto-init data attribute is present
document.addEventListener('DOMContentLoaded', () => {
  const stellaElement = document.querySelector('[data-stella-auto-init]');
  if (stellaElement) {
    const options = {
      debug: stellaElement.getAttribute('data-stella-debug') === 'true',
      apiEndpoint: stellaElement.getAttribute('data-stella-endpoint') || undefined
    };
    
    window.StellaIntegration.init(options);
    
    // Auto-connect if user ID is provided
    const userId = stellaElement.getAttribute('data-stella-user-id') || 'anonymous';
    window.StellaIntegration.connect(userId)
      .then(() => {
        // Dispatch event when connection is successful
        const event = new CustomEvent('stella:connected', { 
          detail: { userId, sessionId: window.StellaIntegration.sessionId }
        });
        document.dispatchEvent(event);
      })
      .catch(error => {
        console.error('❌ STELLA connection failed:', error);
      });
  }
  
  // Connect existing UI if not using auto-init
  if (!document.querySelector('[data-stella-auto-init]') && document.getElementById('send-to-stella')) {
    window.StellaIntegration.init({ debug: true });
    window.StellaIntegration.connect('anonymous')
      .then(() => {
        console.log('✅ STELLA connected successfully');
      })
      .catch(error => {
        console.error('❌ STELLA connection failed:', error);
      });
  }
  
  // Initialize all STELLA chat interfaces on the page
  const initializeChat = () => {
    // Set up quick action buttons
    document.querySelectorAll('.stella-action-btn').forEach(button => {
      button.addEventListener('click', () => {
        const question = button.getAttribute('data-question');
        if (question && window.StellaIntegration.isConnected) {
          // Handle quick action click
          window.StellaIntegration.askQuestion(question)
            .then(response => {
              // Update UI with response
              const stellaMessage = document.getElementById('stella-message');
              if (stellaMessage) {
                stellaMessage.innerHTML = `<p class="text-white">${response.guidance.message}</p>`;
              }
            })
            .catch(error => {
              console.error('Error with quick action:', error);
            });
        }
      });
    });
    
    // Set up Enter key support for question input
    const questionInput = document.getElementById('stella-question');
    const sendButton = document.getElementById('send-to-stella');
    
    if (questionInput && sendButton) {
      questionInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          sendButton.click();
        }
      });
    }
  };
  
  // Initialize chat functionality
  initializeChat();
});