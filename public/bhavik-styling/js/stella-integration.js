/**
 * STELLA Integration - Frontend client for STELLA AI
 */
window.StellaIntegration = {
  config: {
    apiEndpoint: '/api/stella',
    debug: false,
    timeout: 30000 // 30 seconds
  },
  
  // Status variables
  isInitialized: false,
  isConnected: false,
  userId: null,
  sessionId: null,
  
  /**
   * Initialize the STELLA integration
   * @param {Object} options - Configuration options
   * @returns {Boolean} - Success status
   */
  init: function(options = {}) {
    // Override default config with custom options
    if (options.apiEndpoint) this.config.apiEndpoint = options.apiEndpoint;
    if (options.debug !== undefined) this.config.debug = options.debug;
    if (options.timeout) this.config.timeout = options.timeout;
    
    this._log('🚀 STELLA Integration initialized');
    this.isInitialized = true;

    // Call backend initialization
    this._apiRequest('initialize', {})
      .then(result => {
        this._log('✅ STELLA AI Fully Initialized', result);
      })
      .catch(error => {
        console.error('❌ STELLA AI Initialization Failed:', error);
      });
      
    return true;
  },
  
  /**
   * Connect user to STELLA services
   * @param {String} userId - User ID to connect
   * @returns {Promise} - Connection result
   */
  connect: function(userId) {
    if (!this.isInitialized) {
      console.error('❌ STELLA Integration: Must initialize before connecting');
      return Promise.reject(new Error('Not initialized'));
    }
    
    this._log(`🔹 Connecting user ${userId} to STELLA services`);
    this.userId = userId;
    
    return this._apiRequest('connect', { userId })
      .then(result => {
        this.isConnected = true;
        this.sessionId = result.sessionId || 'sess_' + Math.random().toString(36).substring(2, 15);
        this._log(`✅ Connected with session ${this.sessionId}`);
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
    if (!this._checkConnection()) return Promise.reject(new Error('Not connected'));
    
    this._log('🔹 Asking STELLA:', question);
    
    return this._apiRequest('guidance', { 
      userId: this.userId,
      question: question,
      exerciseId: context.exerciseId || null,
      metrics: context.metrics || {}
    });
  },
  
  /**
   * Make API request to backend
   * @param {String} endpoint - API endpoint
   * @param {Object} data - Request data
   * @returns {Promise} - API response
   * @private
   */
  _apiRequest: function(endpoint, data) {
    return new Promise((resolve, reject) => {
      const url = `${this.config.apiEndpoint}/${endpoint}`;
      
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
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
        console.error(`❌ STELLA API Error (${endpoint}):`, error);
        reject(error);
      });
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
      return false;
    }
    return true;
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
    const userId = stellaElement.getAttribute('data-stella-user-id');
    if (userId) {
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
  }
});