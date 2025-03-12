/**
 * SharedStars Frontend
 * Handles general frontend functionality, UI interactions, and API connections
 */

class SharedStarsFrontend {
    /**
     * Initialize the frontend
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
      // Default configuration
      this.options = {
        apiUrl: '/api',
        useLocalStorage: true, // Fallback to localStorage when offline
        debugMode: false,
        ...options
      };
  
      // Application state
      this.state = {
        user: null,
        notifications: [],
        isOnline: navigator.onLine,
        pendingUploads: [],
        sessionData: null
      };
  
      // Cache common DOM elements
      this.cacheElements();
  
      // Set up event listeners
      this.setupEventListeners();
  
      // Initialize components
      this.initializeComponents();
  
      // Check authentication status
      this.checkAuth();
  
      // Log initialization
      if (this.options.debugMode) {
        console.log('SharedStars Frontend initialized with options:', this.options);
      }
    }
  
    /**
     * Cache frequently used DOM elements
     */
    cacheElements() {
      // User-related elements
      this.userProfileElement = document.getElementById('user-profile');
      this.loginFormElement = document.getElementById('login-form');
      this.registerFormElement = document.getElementById('register-form');
      this.logoutButtonElement = document.getElementById('logout-button');
      this.userAvatarElement = document.getElementById('user-avatar');
      this.userNameElement = document.getElementById('user-name');
      this.userRankElement = document.getElementById('user-rank');
      this.userCreditsElement = document.getElementById('user-credits');
  
      // Notification elements
      this.notificationElement = document.getElementById('notification-area');
      this.notificationCountElement = document.getElementById('notification-count');
  
      // Module selection elements
      this.moduleCardsElements = document.querySelectorAll('.module-card');
      this.startModuleButtons = document.querySelectorAll('.start-module');
  
      // Dashboard elements
      this.progressChartElement = document.getElementById('progress-chart');
      this.streakCountElement = document.getElementById('streak-count');
      this.nextMissionElement = document.getElementById('next-mission');
      this.leaderboardElement = document.getElementById('leaderboard');
      
      // Forms
      this.forms = document.querySelectorAll('form[data-api-submit]');
      
      // Search functionality
      this.searchInput = document.getElementById('search-input');
      this.searchResults = document.getElementById('search-results');
  
      // Countdown timers
      this.countdownElements = document.querySelectorAll('[data-countdown]');
      
      // Credits display
      this.creditsDisplayElements = document.querySelectorAll('.credits-display');
    }
  
    /**
     * Set up event listeners
     */
    setupEventListeners() {
      // Authentication forms
      if (this.loginFormElement) {
        this.loginFormElement.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleLogin(e.target);
        });
      }
  
      if (this.registerFormElement) {
        this.registerFormElement.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleRegistration(e.target);
        });
      }
  
      if (this.logoutButtonElement) {
        this.logoutButtonElement.addEventListener('click', () => {
          this.handleLogout();
        });
      }
  
      // Module selection
      this.moduleCardsElements.forEach(card => {
        card.addEventListener('click', () => {
          const moduleId = card.dataset.moduleId;
          if (moduleId) {
            this.showModuleDetails(moduleId);
          }
        });
      });
  
      this.startModuleButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent bubbling to card click
          const moduleId = button.dataset.moduleId;
          if (moduleId) {
            this.startModule(moduleId);
          }
        });
      });
  
      // API forms
      this.forms.forEach(form => {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleFormSubmit(form);
        });
      });
  
      // Search functionality
      if (this.searchInput) {
        this.searchInput.addEventListener('input', () => {
          this.debounce(this.performSearch.bind(this), 300)();
        });
      }
  
      // Online/offline status
      window.addEventListener('online', () => {
        this.handleOnlineStatus(true);
      });
  
      window.addEventListener('offline', () => {
        this.handleOnlineStatus(false);
      });
      
      // Handle global AJAX events
      document.addEventListener('api-request-start', () => {
        this.showLoading(true);
      });
      
      document.addEventListener('api-request-end', () => {
        this.showLoading(false);
      });
      
      // Custom events for STELLA interactions
      document.addEventListener('stella-guidance', (e) => {
        if (this.options.debugMode) {
          console.log('STELLA Guidance received:', e.detail);
        }
      });
      
      document.addEventListener('stella-response', (e) => {
        if (this.options.debugMode) {
          console.log('STELLA Response received:', e.detail);
        }
      });
      
      // Window beforeunload to warn about unsaved data
      window.addEventListener('beforeunload', (e) => {
        if (this.state.pendingUploads.length > 0 || 
            (this.state.sessionData && this.state.sessionData.active)) {
          const message = 'You have unsaved changes or an active session. Are you sure you want to leave?';
          e.returnValue = message;
          return message;
        }
      });
    }
  
    /**
     * Initialize application components
     */
    initializeComponents() {
      // Initialize tooltips
      this.initializeTooltips();
  
      // Initialize modals
      this.initializeModals();
  
      // Initialize countdown timers
      this.initializeCountdowns();
  
      // Initialize charts if Chart.js is available
      if (window.Chart && this.progressChartElement) {
        this.initializeCharts();
      }
  
      // Initialize clipboard functionality
      this.initializeClipboard();
      
      // Initialize lazy loading for images
      this.initializeLazyLoading();
      
      // Initialize smooth scrolling
      this.initializeSmoothScroll();
      
      // Setup periodic sync for offline data
      if (this.options.useLocalStorage) {
        this.setupPeriodicSync();
      }
    }
  
    /**
     * Initialize tooltips
     */
    initializeTooltips() {
      const tooltips = document.querySelectorAll('[data-tooltip]');
      tooltips.forEach(tooltip => {
        tooltip.addEventListener('mouseenter', (e) => {
          const text = tooltip.dataset.tooltip;
          if (!text) return;
          
          // Create tooltip element
          const tooltipElement = document.createElement('div');
          tooltipElement.className = 'tooltip absolute z-50 bg-gray-900 text-white text-xs px-2 py-1 rounded pointer-events-none transform -translate-y-full -translate-x-1/2 left-1/2 -mt-1';
          tooltipElement.textContent = text;
          
          // Add to DOM
          tooltip.style.position = 'relative';
          tooltip.appendChild(tooltipElement);
          
          // Remove after mouseout
          tooltip.addEventListener('mouseleave', () => {
            if (tooltipElement.parentNode === tooltip) {
              tooltip.removeChild(tooltipElement);
            }
          }, { once: true });
        });
      });
    }
  
    /**
     * Initialize modals
     */
    initializeModals() {
      const modalTriggers = document.querySelectorAll('[data-modal]');
      const modals = document.querySelectorAll('.modal');
      
      modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
          const modalId = trigger.dataset.modal;
          const modal = document.getElementById(modalId);
          if (modal) {
            modal.classList.remove('hidden');
          }
        });
      });
      
      modals.forEach(modal => {
        const closeButtons = modal.querySelectorAll('.close-modal');
        closeButtons.forEach(button => {
          button.addEventListener('click', () => {
            modal.classList.add('hidden');
          });
        });
        
        // Close when clicking outside content
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.classList.add('hidden');
          }
        });
      });
    }
  
    /**
     * Initialize countdown timers
     */
    initializeCountdowns() {
      this.countdownElements.forEach(element => {
        const targetDate = new Date(element.dataset.countdown).getTime();
        
        // Set up interval to update countdown
        const interval = setInterval(() => {
          const now = new Date().getTime();
          const distance = targetDate - now;
          
          if (distance < 0) {
            clearInterval(interval);
            element.textContent = element.dataset.countdownExpired || "EXPIRED";
            return;
          }
          
          const days = Math.floor(distance / (1000 * 60 * 60 * 24));
          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);
          
          element.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        }, 1000);
      });
    }
  
    /**
     * Initialize charts
     */
    initializeCharts() {
      // Progress chart setup
      if (this.progressChartElement && window.Chart) {
        const ctx = this.progressChartElement.getContext('2d');
        
        // Sample data - replace with actual user data
        const chartData = {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'Progress',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
            data: [10, 25, 40, 30, 70, 85]
          }]
        };
        
        this.progressChart = new Chart(ctx, {
          type: 'line',
          data: chartData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                max: 100
              }
            }
          }
        });
      }
    }
  
    /**
     * Initialize clipboard functionality
     */
    initializeClipboard() {
      const clipboardButtons = document.querySelectorAll('[data-clipboard]');
      
      clipboardButtons.forEach(button => {
        button.addEventListener('click', () => {
          const text = button.dataset.clipboard;
          if (!text) return;
          
          navigator.clipboard.writeText(text)
            .then(() => {
              // Show success feedback
              const originalText = button.textContent;
              button.textContent = 'Copied!';
              
              setTimeout(() => {
                button.textContent = originalText;
              }, 2000);
            })
            .catch(err => {
              console.error('Failed to copy text: ', err);
            });
        });
      });
    }
  
    /**
     * Initialize lazy loading for images
     */
    initializeLazyLoading() {
      if ('IntersectionObserver' in window) {
        const lazyImages = document.querySelectorAll('img[data-src]');
        
        const imageObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          });
        });
        
        lazyImages.forEach(img => {
          imageObserver.observe(img);
        });
      } else {
        // Fallback for browsers without IntersectionObserver
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        });
      }
    }
  
    /**
     * Initialize smooth scrolling for anchor links
     */
    initializeSmoothScroll() {
      const anchors = document.querySelectorAll('a[href^="#"]:not([href="#"])');
      
      anchors.forEach(anchor => {
        anchor.addEventListener('click', function(e) {
          e.preventDefault();
          
          const targetId = this.getAttribute('href');
          const targetElement = document.querySelector(targetId);
          
          if (targetElement) {
            // Smooth scroll to element
            targetElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
            
            // Update URL hash without scrolling
            history.pushState(null, null, targetId);
          }
        });
      });
    }
  
    /**
     * Setup periodic sync for offline data
     */
    setupPeriodicSync() {
      // Sync every 30 seconds if online
      setInterval(() => {
        if (navigator.onLine && this.state.pendingUploads.length > 0) {
          this.syncOfflineData();
        }
      }, 30000);
      
      // Also try to sync when coming back online
      window.addEventListener('online', () => {
        this.syncOfflineData();
      });
    }
  
    /**
     * Check authentication status
     */
    async checkAuth() {
      try {
        // First check local storage for cached user data
        if (this.options.useLocalStorage) {
          const cachedUser = localStorage.getItem('sharedStars_user');
          if (cachedUser) {
            this.state.user = JSON.parse(cachedUser);
            this.updateUserUI();
          }
        }
        
        // Then verify with server if online
        if (navigator.onLine) {
          const response = await this.apiRequest('/auth/status', {
            method: 'GET'
          });
          
          if (response.authenticated) {
            this.state.user = response.user;
            
            // Update local storage
            if (this.options.useLocalStorage) {
              localStorage.setItem('sharedStars_user', JSON.stringify(response.user));
            }
            
            this.updateUserUI();
          } else {
            // Clear local user data if server says not authenticated
            this.state.user = null;
            if (this.options.useLocalStorage) {
              localStorage.removeItem('sharedStars_user');
            }
            this.updateUserUI();
          }
        }
      } catch (error) {
        console.error('Error checking authentication status:', error);
        // If offline, rely on cached user data
      }
    }
  
    /**
     * Handle login form submission
     * @param {HTMLFormElement} form - Login form element
     */
    async handleLogin(form) {
      try {
        const formData = new FormData(form);
        const loginData = {
          email: formData.get('email'),
          password: formData.get('password'),
          rememberMe: formData.get('remember-me') === 'on'
        };
        
        const response = await this.apiRequest('/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(loginData)
        });
        
        if (response.success) {
          this.state.user = response.user;
          
          // Save to local storage if rememberMe is checked
          if (loginData.rememberMe && this.options.useLocalStorage) {
            localStorage.setItem('sharedStars_user', JSON.stringify(response.user));
          }
          
          this.updateUserUI();
          
          // Show success message
          this.showNotification('Login successful!', 'success');
          
          // Redirect to dashboard or requested page
          window.location.href = response.redirectUrl || '/dashboard';
        } else {
          this.showNotification(response.message || 'Login failed. Please try again.', 'error');
        }
      } catch (error) {
        console.error('Login error:', error);
        this.showNotification('An error occurred during login. Please try again.', 'error');
      }
    }
  
    /**
     * Handle registration form submission
     * @param {HTMLFormElement} form - Registration form element
     */
    async handleRegistration(form) {
      try {
        const formData = new FormData(form);
        
        // Validate passwords match
        const password = formData.get('password');
        const confirmPassword = formData.get('confirm-password');
        
        if (password !== confirmPassword) {
          this.showNotification('Passwords do not match.', 'error');
          return;
        }
        
        const registrationData = {
          name: formData.get('name'),
          email: formData.get('email'),
          password: password
        };
        
        const response = await this.apiRequest('/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(registrationData)
        });
        
        if (response.success) {
          this.showNotification('Registration successful! Please check your email for verification.', 'success');
          
          // Redirect to login page
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else {
          this.showNotification(response.message || 'Registration failed.', 'error');
        }
      } catch (error) {
        console.error('Registration error:', error);
        this.showNotification('An error occurred during registration. Please try again.', 'error');
      }
    }
  
    /**
     * Handle logout
     */
    async handleLogout() {
      try {
        const response = await this.apiRequest('/auth/logout', {
          method: 'POST'
        });
        
        // Clear local user data regardless of response
        this.state.user = null;
        if (this.options.useLocalStorage) {
          localStorage.removeItem('sharedStars_user');
        }
        
        this.updateUserUI();
        
        // Show success message
        this.showNotification('Logout successful!', 'success');
        
        // Redirect to home page
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } catch (error) {
        console.error('Logout error:', error);
        
        // Still clear local data even if API call fails
        this.state.user = null;
        if (this.options.useLocalStorage) {
          localStorage.removeItem('sharedStars_user');
        }
        
        this.updateUserUI();
        window.location.href = '/';
      }
    }
  
    /**
     * Update user UI elements with current user data
     */
    updateUserUI() {
      if (this.state.user) {
        // Show logged-in UI
        document.body.classList.add('user-logged-in');
        document.body.classList.remove('user-logged-out');
        
        // Update user name and avatar
        if (this.userNameElement) {
          this.userNameElement.textContent = this.state.user.name;
        }
        
        if (this.userAvatarElement) {
          this.userAvatarElement.src = this.state.user.avatar || '/images/default-avatar.png';
          this.userAvatarElement.alt = this.state.user.name;
        }
        
        // Update user rank
        if (this.userRankElement) {
          this.userRankElement.textContent = this.state.user.rank || 'Cadet';
        }
        
        // Update user credits
        if (this.userCreditsElement) {
          this.userCreditsElement.textContent = this.state.user.credits || 0;
        }
        
        // Update all credit displays
        this.creditsDisplayElements.forEach(element => {
          element.textContent = this.state.user.credits || 0;
        });
        
        // Show user profile area
        if (this.userProfileElement) {
          this.userProfileElement.classList.remove('hidden');
        }
        
        // Hide login/register forms
        if (this.loginFormElement) {
          this.loginFormElement.closest('.login-container')?.classList.add('hidden');
        }
        
        if (this.registerFormElement) {
          this.registerFormElement.closest('.register-container')?.classList.add('hidden');
        }
      } else {
        // Show logged-out UI
        document.body.classList.add('user-logged-out');
        document.body.classList.remove('user-logged-in');
        
        // Hide user profile area
        if (this.userProfileElement) {
          this.userProfileElement.classList.add('hidden');
        }
        
        // Show login/register forms if on auth pages
        if (window.location.pathname.includes('/login') && this.loginFormElement) {
          this.loginFormElement.closest('.login-container')?.classList.remove('hidden');
        }
        
        if (window.location.pathname.includes('/register') && this.registerFormElement) {
          this.registerFormElement.closest('.register-container')?.classList.remove('hidden');
        }
      }
    }
  
    /**
     * Show module details
     * @param {String} moduleId - ID of the module to show details for
     */
    async showModuleDetails(moduleId) {
      try {
        // Get module details from API
        const response = await this.apiRequest(`/modules/${moduleId}`, {
          method: 'GET'
        });
        
        if (response.success) {
          const module = response.module;
          
          // Update module details modal
          const moduleModal = document.getElementById('module-details-modal');
          if (moduleModal) {
            const modalTitle = moduleModal.querySelector('.modal-title');
            if (modalTitle) {
              modalTitle.textContent = module.name;
            }
            
            const modalDescription = moduleModal.querySelector('.modal-description');
            if (modalDescription) {
              modalDescription.textContent = module.description;
            }
            
            const modalImage = moduleModal.querySelector('.modal-image');
            if (modalImage) {
              modalImage.src = module.image || '/images/default-module.jpg';
              modalImage.alt = module.name;
            }
            
            const startButton = moduleModal.querySelector('.start-module-button');
            if (startButton) {
              startButton.dataset.moduleId = moduleId;
            }
            
            // Show modal
            moduleModal.classList.remove('hidden');
        }
      } else {
        this.showNotification(response.message || 'Failed to load module details.', 'error');
      }
    } catch (error) {
      console.error('Error loading module details:', error);
      this.showNotification('An error occurred while loading module details.', 'error');
    }
  }

  /**
   * Start a training module
   * @param {String} moduleId - ID of the module to start
   */
  async startModule(moduleId) {
    try {
      // Check if user is logged in
      if (!this.state.user) {
        this.showNotification('Please log in to start training.', 'warning');
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        return;
      }
      
      // Start module session via API
      const response = await this.apiRequest(`/modules/${moduleId}/start`, {
        method: 'POST'
      });
      
      if (response.success) {
        // Store session data
        this.state.sessionData = response.session;
        
        // Navigate to module page
        window.location.href = `/training/${moduleId}`;
      } else {
        this.showNotification(response.message || 'Failed to start module.', 'error');
      }
    } catch (error) {
      console.error('Error starting module:', error);
      
      // If offline, try to start in offline mode
      if (!navigator.onLine && this.options.useLocalStorage) {
        try {
          // Get cached module data
          const cachedModules = JSON.parse(localStorage.getItem('sharedStars_modules') || '{}');
          const moduleData = cachedModules[moduleId];
          
          if (moduleData) {
            // Create offline session
            const offlineSession = {
              id: `offline-${Date.now()}`,
              moduleId: moduleId,
              startTime: new Date().toISOString(),
              offlineMode: true
            };
            
            // Store in localStorage
            localStorage.setItem('sharedStars_currentSession', JSON.stringify(offlineSession));
            
            // Navigate to module page
            window.location.href = `/training/${moduleId}?offline=true`;
          } else {
            this.showNotification('Module data not available offline.', 'error');
          }
        } catch (offlineError) {
          console.error('Error starting offline module:', offlineError);
          this.showNotification('Failed to start module in offline mode.', 'error');
        }
      } else {
        this.showNotification('An error occurred while starting the module.', 'error');
      }
    }
  }

  /**
   * Handle form submissions with API integration
   * @param {HTMLFormElement} form - Form element
   */
  async handleFormSubmit(form) {
    try {
      const formData = new FormData(form);
      const endpoint = form.dataset.apiEndpoint;
      const method = form.dataset.apiMethod || 'POST';
      
      if (!endpoint) {
        console.error('Form is missing data-api-endpoint attribute');
        return;
      }
      
      // Convert FormData to JSON or use as is based on form attribute
      let body;
      const contentType = form.dataset.apiContentType || 'json';
      
      if (contentType === 'json') {
        const jsonData = {};
        formData.forEach((value, key) => {
          jsonData[key] = value;
        });
        body = JSON.stringify(jsonData);
      } else {
        body = formData;
      }
      
      // Show loading state
      const submitButton = form.querySelector('[type="submit"]');
      if (submitButton) {
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Processing...';
        
        if (submitButton.querySelector('.loading-spinner')) {
          submitButton.querySelector('.loading-spinner').classList.remove('hidden');
        }
      }
      
      // Make API request
      const response = await this.apiRequest(endpoint, {
        method,
        headers: contentType === 'json' ? {
          'Content-Type': 'application/json'
        } : undefined,
        body
      });
      
      // Reset button state
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
        
        if (submitButton.querySelector('.loading-spinner')) {
          submitButton.querySelector('.loading-spinner').classList.add('hidden');
        }
      }
      
      // Handle response
      if (response.success) {
        // Show success message
        this.showNotification(response.message || 'Success!', 'success');
        
        // Clear form if specified
        if (form.dataset.apiClearOnSuccess === 'true') {
          form.reset();
        }
        
        // Redirect if specified
        if (response.redirectUrl) {
          window.location.href = response.redirectUrl;
        }
        
        // Callback function if specified
        if (form.dataset.apiCallback) {
          const callbackFn = window[form.dataset.apiCallback];
          if (typeof callbackFn === 'function') {
            callbackFn(response);
          }
        }
        
        // Trigger custom event
        form.dispatchEvent(new CustomEvent('api-form-success', { detail: response }));
      } else {
        // Show error message
        this.showNotification(response.message || 'An error occurred.', 'error');
        
        // Focus first field with error if available
        if (response.errors && Object.keys(response.errors).length > 0) {
          const firstErrorField = Object.keys(response.errors)[0];
          const field = form.querySelector(`[name="${firstErrorField}"]`);
          if (field) {
            field.focus();
            
            // Show error message next to field
            const errorElement = document.createElement('div');
            errorElement.className = 'text-red-500 text-xs mt-1';
            errorElement.textContent = response.errors[firstErrorField];
            
            // Remove any existing error message
            const existingError = field.parentNode.querySelector('.text-red-500');
            if (existingError) {
              existingError.remove();
            }
            
            field.parentNode.appendChild(errorElement);
          }
        }
        
        // Trigger custom event
        form.dispatchEvent(new CustomEvent('api-form-error', { detail: response }));
      }
    } catch (error) {
      console.error('Form submission error:', error);
      this.showNotification('An error occurred while processing your request.', 'error');
      
      // Reset button state
      const submitButton = form.querySelector('[type="submit"]');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Submit';
        
        if (submitButton.querySelector('.loading-spinner')) {
          submitButton.querySelector('.loading-spinner').classList.add('hidden');
        }
      }
      
      // Store form data for retry if offline
      if (!navigator.onLine && this.options.useLocalStorage) {
        this.storePendingFormSubmission(form);
      }
    }
  }

  /**
   * Store pending form submission for retry when online
   * @param {HTMLFormElement} form - Form element
   */
  storePendingFormSubmission(form) {
    try {
      const formData = new FormData(form);
      const endpoint = form.dataset.apiEndpoint;
      const method = form.dataset.apiMethod || 'POST';
      const contentType = form.dataset.apiContentType || 'json';
      
      const jsonData = {};
      formData.forEach((value, key) => {
        jsonData[key] = value;
      });
      
      // Add to pending uploads
      this.state.pendingUploads.push({
        id: `form-${Date.now()}`,
        endpoint,
        method,
        contentType,
        data: jsonData,
        timestamp: new Date().toISOString()
      });
      
      // Save to localStorage
      localStorage.setItem('sharedStars_pendingUploads', JSON.stringify(this.state.pendingUploads));
      
      this.showNotification('Form data saved. Will be submitted when you\'re back online.', 'info');
    } catch (error) {
      console.error('Error storing pending form submission:', error);
    }
  }

  /**
   * Sync offline data when back online
   */
  async syncOfflineData() {
    if (!navigator.onLine || this.state.pendingUploads.length === 0) return;
    
    // Process each pending upload
    const uploads = [...this.state.pendingUploads];
    const completedUploads = [];
    
    for (const upload of uploads) {
      try {
        // Attempt to submit
        const response = await this.apiRequest(upload.endpoint, {
          method: upload.method,
          headers: upload.contentType === 'json' ? {
            'Content-Type': 'application/json'
          } : undefined,
          body: upload.contentType === 'json' ? JSON.stringify(upload.data) : new FormData(upload.data)
        });
        
        if (response.success) {
          // Mark as completed
          completedUploads.push(upload.id);
        }
      } catch (error) {
        console.error(`Error syncing upload ${upload.id}:`, error);
        // Keep in queue to retry later
      }
    }
    
    // Remove completed uploads from state
    if (completedUploads.length > 0) {
      this.state.pendingUploads = this.state.pendingUploads.filter(
        upload => !completedUploads.includes(upload.id)
      );
      
      // Update localStorage
      localStorage.setItem('sharedStars_pendingUploads', JSON.stringify(this.state.pendingUploads));
      
      this.showNotification(`Synced ${completedUploads.length} pending uploads.`, 'success');
    }
  }

  /**
   * Perform search
   */
  async performSearch() {
    const query = this.searchInput.value.trim();
    
    if (!query || query.length < 2) {
      if (this.searchResults) {
        this.searchResults.innerHTML = '';
        this.searchResults.classList.add('hidden');
      }
      return;
    }
    
    try {
      const response = await this.apiRequest(`/search?q=${encodeURIComponent(query)}`, {
        method: 'GET'
      });
      
      if (response.success && this.searchResults) {
        this.searchResults.innerHTML = '';
        this.searchResults.classList.remove('hidden');
        
        if (response.results.length === 0) {
          this.searchResults.innerHTML = `
            <div class="p-4 text-center text-gray-400">
              No results found for "${query}"
            </div>
          `;
          return;
        }
        
        // Display results
        response.results.forEach(result => {
          const resultItem = document.createElement('div');
          resultItem.className = 'p-3 hover:bg-gray-800 cursor-pointer flex items-center';
          
          resultItem.innerHTML = `
            <div class="mr-3">
              <img src="${result.image || '/images/default.png'}" alt="${result.title}" class="w-10 h-10 rounded">
            </div>
            <div>
              <div class="font-medium text-white">${result.title}</div>
              <div class="text-gray-400 text-sm">${result.type}</div>
            </div>
          `;
          
          resultItem.addEventListener('click', () => {
            window.location.href = result.url;
          });
          
          this.searchResults.appendChild(resultItem);
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      
      if (this.searchResults) {
        this.searchResults.innerHTML = `
          <div class="p-4 text-center text-red-400">
            Error performing search. Please try again.
          </div>
        `;
      }
    }
  }

  /**
   * Show loading indicator
   * @param {Boolean} isLoading - Whether to show or hide loading indicator
   */
  showLoading(isLoading) {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
      if (isLoading) {
        loadingIndicator.classList.remove('hidden');
      } else {
        loadingIndicator.classList.add('hidden');
      }
    }
  }

  /**
   * Handle online/offline status changes
   * @param {Boolean} isOnline - Whether the application is online
   */
  handleOnlineStatus(isOnline) {
    this.state.isOnline = isOnline;
    
    if (isOnline) {
      // Remove offline notification
      const offlineBanner = document.getElementById('offline-banner');
      if (offlineBanner) {
        offlineBanner.classList.add('hidden');
      }
      
      // Sync offline data
      this.syncOfflineData();
      
      this.showNotification('You are back online!', 'success');
    } else {
      // Show offline notification
      const offlineBanner = document.getElementById('offline-banner');
      if (offlineBanner) {
        offlineBanner.classList.remove('hidden');
      } else {
        // Create offline banner if it doesn't exist
        const banner = document.createElement('div');
        banner.id = 'offline-banner';
        banner.className = 'fixed top-0 left-0 right-0 bg-yellow-900 text-yellow-100 py-2 px-4 text-center z-50';
        banner.innerHTML = `
          <div class="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <span>You are currently offline. Some features may be limited.</span>
          </div>
        `;
        document.body.prepend(banner);
      }
      
      this.showNotification('You are offline. Limited functionality available.', 'warning');
    }
  }

  /**
   * Show a notification
   * @param {String} message - Notification message
   * @param {String} type - Notification type (success, warning, error, info)
   * @param {Number} duration - Duration in milliseconds
   */
  showNotification(message, type = 'info', duration = 3000) {
    if (!this.notificationElement) {
      // Create notification container if it doesn't exist
      this.notificationElement = document.createElement('div');
      this.notificationElement.className = 'fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2';
      document.body.appendChild(this.notificationElement);
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `transform transition-all duration-300 translate-x-full max-w-sm rounded-lg shadow-lg p-4 ${
      type === 'success' ? 'bg-green-900/80 border border-green-500/30 text-green-100' :
      type === 'warning' ? 'bg-yellow-900/80 border border-yellow-500/30 text-yellow-100' :
      type === 'error' ? 'bg-red-900/80 border border-red-500/30 text-red-100' :
      'bg-blue-900/80 border border-blue-500/30 text-blue-100'
    }`;

    notification.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0 mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ${
            type === 'success' ? 'text-green-400' :
            type === 'warning' ? 'text-yellow-400' :
            type === 'error' ? 'text-red-400' :
            'text-blue-400'
          }" viewBox="0 0 20 20" fill="currentColor">
            ${type === 'success' ? 
              '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />' :
            type === 'warning' ?
              '<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />' :
            type === 'error' ?
              '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />' :
              '<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />'
            }
          </svg>
        </div>
        <div>
          <p>${message}</p>
        </div>
        <button class="ml-auto -mr-2 text-gray-400 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    `;

    // Add to notifications
    this.notificationElement.appendChild(notification);

    // Add close button functionality
    const closeButton = notification.querySelector('button');
    closeButton.addEventListener('click', () => {
      this.removeNotification(notification);
    });

    // Set auto-remove timer
    const removeTimeout = setTimeout(() => {
      this.removeNotification(notification);
    }, duration);

    // Add to state to track
    this.state.notifications.push({
      element: notification,
      timeout: removeTimeout
    });

    // Animate in
    setTimeout(() => {
      notification.classList.remove('translate-x-full');
    }, 10);

    return notification;
  }

  /**
   * Remove a notification
   * @param {HTMLElement} notification - Notification element to remove
   */
  removeNotification(notification) {
    // Animate out
    notification.classList.add('translate-x-full');
    
    // Find in state and clear timeout
    const index = this.state.notifications.findIndex(n => n.element === notification);
    if (index !== -1) {
      clearTimeout(this.state.notifications[index].timeout);
      this.state.notifications.splice(index, 1);
    }
    
    // Remove from DOM after animation
    setTimeout(() => {
      if (notification.parentNode === this.notificationElement) {
        this.notificationElement.removeChild(notification);
      }
    }, 300);
  }

  /**
   * Make an API request
   * @param {String} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} - API response
   */
  async apiRequest(endpoint, options = {}) {
    // Trigger request start event
    document.dispatchEvent(new CustomEvent('api-request-start'));
    
    try {
      // If not starting with http, prepend API URL
      const url = endpoint.startsWith('http') ? endpoint : this.options.apiUrl + endpoint;
      
      // Add authorization header if logged in
      const headers = options.headers || {};
      if (this.state.user && this.state.user.token) {
        headers.Authorization = `Bearer ${this.state.user.token}`;
      }
      
      const response = await fetch(url, {
        ...options,
        headers
      });
      
      let data;
      const contentType = response.headers.get('Content-Type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      // Add status and ok properties
      data.status = response.status;
      data.ok = response.ok;
      
      // Standard format
      if (!data.success) {
        data.success = response.ok;
      }
      
      // Log if in debug mode
      if (this.options.debugMode) {
        console.log(`API ${options.method || 'GET'} ${endpoint}:`, data);
      }
      
      // Trigger request end event
      document.dispatchEvent(new CustomEvent('api-request-end', { detail: data }));
      
      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      
      // Trigger request end event
      document.dispatchEvent(new CustomEvent('api-request-end', { detail: { error } }));
      
      throw error;
    }
  }

  /**
   * Debounce function to limit how often a function can run
   * @param {Function} func - Function to debounce
   * @param {Number} wait - Milliseconds to wait
   * @returns {Function} - Debounced function
   */
  debounce(func, wait) {
    let timeout;
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }
}

// Initialize the frontend when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Get configuration
  const configElement = document.getElementById('frontend-config');
  let config = {};
  
  if (configElement) {
    try {
      config = JSON.parse(configElement.textContent);
    } catch (e) {
      console.warn('Error parsing frontend config:', e);
    }
  }
  
  // Initialize frontend
  window.sharedStars = new SharedStarsFrontend(config);
  
  console.log('SharedStars Frontend initialized');
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SharedStarsFrontend;
} else {
  // For browser environment
  window.SharedStarsFrontend = SharedStarsFrontend;
}