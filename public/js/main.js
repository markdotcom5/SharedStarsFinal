/**
 * SharedStars Main Application
 * 
 * This is the entry point for the SharedStars application.
 * It initializes all core components, manages configuration,
 * and establishes connections between different modules.
 */

// Global application namespace
const SharedStars = {
    // App version
    version: '0.1.0',
    
    // App state
    state: {
      initialized: false,
      ready: false,
      debug: false,
      environment: 'production',
      modules: {},
      components: {}
    },
    
    // Configuration
    config: {
      apiUrl: '/api',
      inMemoryDB: false,
      useLocalStorage: true,
      stellaEnabled: true,
      pageTransitions: true,
      offline: {
        enabled: true,
        syncInterval: 30000
      },
      training: {
        useRealTimeData: false,
        mockDataEnabled: true,
        updateInterval: 3000
      }
    },
    
    /**
     * Initialize the application
     * @param {Object} options - Initialization options
     */
    init: function(options = {}) {
      // Don't initialize twice
      if (this.state.initialized) {
        console.warn('SharedStars application already initialized');
        return;
      }
      
      console.log('Initializing SharedStars application...');
      
      // Merge options with default config
      this.config = { ...this.config, ...options };
      
      // Set environment
      this.state.environment = this.config.environment || 'production';
      this.state.debug = this.config.debug || this.state.environment === 'development';
      
      // Load saved configuration if available
      this.loadSavedConfig();
      
      // Detect capabilities and environment
      this.detectEnvironment();
      
      // Initialize core services
      this.initCoreServices();
      
      // Initialize UI components
      this.initUIComponents();
      
      // Connect modules
      this.connectModules();
      
      // Register event listeners
      this.registerEventListeners();
      
      // Initialize modules based on current page
      this.initializeCurrentPageModules();
      
      // Mark as initialized
      this.state.initialized = true;
      
      // Log initialization
      if (this.state.debug) {
        console.log('SharedStars initialized with config:', this.config);
      }
      
      // Dispatch initialization event
      this.dispatchEvent('app:initialized', { 
        timestamp: new Date().toISOString(),
        config: this.config
      });
      
      // Set app as ready
      setTimeout(() => {
        this.setReady();
      }, 100);
      
      return this;
    },
    
    /**
     * Load saved configuration from localStorage
     */
    loadSavedConfig: function() {
      if (!this.config.useLocalStorage) return;
      
      try {
        const savedConfig = localStorage.getItem('sharedStars_config');
        if (savedConfig) {
          const parsedConfig = JSON.parse(savedConfig);
          
          // Only merge certain safe properties
          const safeProperties = [
            'pageTransitions',
            'stellaEnabled',
            'useLocalStorage',
            'offline'
          ];
          
          safeProperties.forEach(prop => {
            if (parsedConfig[prop] !== undefined) {
              if (typeof parsedConfig[prop] === 'object' && !Array.isArray(parsedConfig[prop])) {
                this.config[prop] = { ...this.config[prop], ...parsedConfig[prop] };
              } else {
                this.config[prop] = parsedConfig[prop];
              }
            }
          });
          
          if (this.state.debug) {
            console.log('Loaded saved configuration:', this.config);
          }
        }
      } catch (error) {
        console.warn('Error loading saved configuration:', error);
      }
    },
    
    /**
     * Save current configuration to localStorage
     */
    saveConfig: function() {
      if (!this.config.useLocalStorage) return;
      
      try {
        // Only save certain safe properties
        const safeConfig = {
          pageTransitions: this.config.pageTransitions,
          stellaEnabled: this.config.stellaEnabled,
          useLocalStorage: this.config.useLocalStorage,
          offline: this.config.offline
        };
        
        localStorage.setItem('sharedStars_config', JSON.stringify(safeConfig));
        
        if (this.state.debug) {
          console.log('Saved configuration:', safeConfig);
        }
      } catch (error) {
        console.warn('Error saving configuration:', error);
      }
    },
    
    /**
     * Detect browser capabilities and environment
     */
    detectEnvironment: function() {
      // Check online status
      this.state.online = navigator.onLine;
      
      // Check for localStorage support
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        this.state.hasLocalStorage = true;
      } catch (e) {
        this.state.hasLocalStorage = false;
        this.config.useLocalStorage = false;
      }
      
      // Check for service worker support
      this.state.hasServiceWorker = 'serviceWorker' in navigator;
      
      // Check for IndexedDB support
      this.state.hasIndexedDB = 'indexedDB' in window;
      
      // Check for WebGL support (for 3D visualizations)
      this.state.hasWebGL = (function() {
        try {
          const canvas = document.createElement('canvas');
          return !!(window.WebGLRenderingContext && 
                   (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
          return false;
        }
      })();
      
      // Check for WebRTC support (for potential future features)
      this.state.hasWebRTC = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      
      // Detect device type
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      this.state.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      this.state.isTablet = this.state.isMobile && Math.min(window.innerWidth, window.innerHeight) > 480;
      
      // Adjust config based on environment detection
      if (!this.state.hasLocalStorage) {
        this.config.useLocalStorage = false;
      }
      
      if (!this.state.hasIndexedDB) {
        this.config.inMemoryDB = true;
      }
      
      if (this.state.isMobile) {
        // Reduce resource usage on mobile
        this.config.training.updateInterval = 5000; // Less frequent updates
      }
      
      if (this.state.debug) {
        console.log('Environment detection:', {
          online: this.state.online,
          hasLocalStorage: this.state.hasLocalStorage,
          hasServiceWorker: this.state.hasServiceWorker,
          hasIndexedDB: this.state.hasIndexedDB,
          hasWebGL: this.state.hasWebGL,
          hasWebRTC: this.state.hasWebRTC,
          isMobile: this.state.isMobile,
          isTablet: this.state.isTablet
        });
      }
    },
    
    /**
     * Initialize core services
     */
    initCoreServices: function() {
      // Initialize API service
      this.initApiService();
      
      // Initialize database service
      this.initDatabaseService();
      
      // Initialize authentication service
      this.initAuthService();
      
      // Initialize STELLA AI service if enabled
      if (this.config.stellaEnabled) {
        this.initStellaService();
      }
    },
    
    /**
     * Initialize API service
     */
    initApiService: function() {
      // Create API service
      this.api = {
        baseUrl: this.config.apiUrl,
        token: null,
        
        /**
         * Make an API request
         * @param {String} endpoint - API endpoint
         * @param {Object} options - Request options
         * @returns {Promise} - Promise resolving to API response
         */
        request: async function(endpoint, options = {}) {
          // Trigger request start event
          SharedStars.dispatchEvent('api:requestStart', { endpoint });
          
          try {
            // If not starting with http, prepend API URL
            const url = endpoint.startsWith('http') ? endpoint : this.baseUrl + endpoint;
            
            // Add authorization header if token exists
            const headers = options.headers || {};
            if (this.token) {
              headers.Authorization = `Bearer ${this.token}`;
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
            if (SharedStars.state.debug) {
              console.log(`API ${options.method || 'GET'} ${endpoint}:`, data);
            }
            
            // Trigger request end event
            SharedStars.dispatchEvent('api:requestEnd', { endpoint, response: data });
            
            return data;
          } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            
            // Trigger request error event
            SharedStars.dispatchEvent('api:requestError', { endpoint, error });
            
            throw error;
          }
        },
        
        /**
         * Set API authentication token
         * @param {String} token - Authentication token
         */
        setToken: function(token) {
          this.token = token;
        },
        
        /**
         * Clear API authentication token
         */
        clearToken: function() {
          this.token = null;
        }
      };
      
      // Store in components
      this.state.components.api = this.api;
      
      if (this.state.debug) {
        console.log('API service initialized');
      }
    },
    
    /**
     * Initialize database service
     */
    initDatabaseService: function() {
      // Import database service based on configuration
      if (this.config.inMemoryDB) {
        // Use in-memory database
        import('./inMemoryDatabase.js')
          .then(module => {
            this.db = module.default;
            this.state.components.db = this.db;
            
            if (this.state.debug) {
              console.log('In-memory database initialized');
            }
            
            this.dispatchEvent('db:initialized', { type: 'inMemory' });
          })
          .catch(error => {
            console.error('Failed to initialize in-memory database:', error);
          });
      } else if (this.state.hasIndexedDB) {
        // Use IndexedDB
        import('./indexedDatabase.js')
          .then(module => {
            this.db = module.default;
            this.state.components.db = this.db;
            
            if (this.state.debug) {
              console.log('IndexedDB database initialized');
            }
            
            this.dispatchEvent('db:initialized', { type: 'indexedDB' });
          })
          .catch(error => {
            console.error('Failed to initialize IndexedDB database:', error);
            
            // Fall back to in-memory database
            this.config.inMemoryDB = true;
            this.initDatabaseService();
          });
      } else {
        // Fall back to in-memory database
        this.config.inMemoryDB = true;
        this.initDatabaseService();
      }
    },
    
    /**
     * Initialize authentication service
     */
    initAuthService: function() {
      // Create auth service
      this.auth = {
        user: null,
        token: null,
        isAuthenticated: false,
        
        /**
         * Check authentication status
         * @returns {Promise} - Promise resolving to auth status
         */
        checkStatus: async function() {
          try {
            // Check if we have a token in localStorage
            if (SharedStars.config.useLocalStorage) {
              const savedUser = localStorage.getItem('sharedStars_user');
              if (savedUser) {
                const userData = JSON.parse(savedUser);
                this.user = userData;
                this.token = userData.token;
                this.isAuthenticated = true;
                
                // Update API token
                if (SharedStars.api) {
                  SharedStars.api.setToken(this.token);
                }
                
                SharedStars.dispatchEvent('auth:userLoaded', { user: this.user });
              }
            }
            
            // Verify with server if online
            if (navigator.onLine) {
              const response = await SharedStars.api.request('/auth/status', {
                method: 'GET'
              });
              
              if (response.authenticated) {
                this.user = response.user;
                this.token = response.token || this.token;
                this.isAuthenticated = true;
                
                // Update API token
                if (SharedStars.api) {
                  SharedStars.api.setToken(this.token);
                }
                
                // Save to localStorage
                if (SharedStars.config.useLocalStorage) {
                  localStorage.setItem('sharedStars_user', JSON.stringify(this.user));
                }
                
                SharedStars.dispatchEvent('auth:authenticated', { user: this.user });
              } else {
                // Clear auth data
                this.logout(false); // Don't send logout request to server
              }
            }
            
            return {
              authenticated: this.isAuthenticated,
              user: this.user
            };
          } catch (error) {
            console.error('Error checking authentication status:', error);
            return {
              authenticated: this.isAuthenticated,
              user: this.user,
              error
            };
          }
        },
        
        /**
         * Log in user
         * @param {Object} credentials - User credentials
         * @returns {Promise} - Promise resolving to login result
         */
        login: async function(credentials) {
          try {
            const response = await SharedStars.api.request('/auth/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(credentials)
            });
            
            if (response.success) {
              this.user = response.user;
              this.token = response.token;
              this.isAuthenticated = true;
              
              // Update API token
              if (SharedStars.api) {
                SharedStars.api.setToken(this.token);
              }
              
              // Save to localStorage if remember is checked
              if (SharedStars.config.useLocalStorage && credentials.remember) {
                localStorage.setItem('sharedStars_user', JSON.stringify(this.user));
              }
              
              SharedStars.dispatchEvent('auth:login', { user: this.user });
            }
            
            return response;
          } catch (error) {
            console.error('Login error:', error);
            SharedStars.dispatchEvent('auth:loginError', { error });
            throw error;
          }
        },
        
        /**
         * Log out user
         * @param {Boolean} sendRequest - Whether to send logout request to server
         * @returns {Promise} - Promise resolving to logout result
         */
        logout: async function(sendRequest = true) {
          try {
            if (sendRequest && navigator.onLine) {
              await SharedStars.api.request('/auth/logout', {
                method: 'POST'
              });
            }
            
            // Clear auth data
            this.user = null;
            this.token = null;
            this.isAuthenticated = false;
            
            // Clear API token
            if (SharedStars.api) {
              SharedStars.api.clearToken();
            }
            
            // Clear from localStorage
            if (SharedStars.config.useLocalStorage) {
              localStorage.removeItem('sharedStars_user');
            }
            
            SharedStars.dispatchEvent('auth:logout');
            
            return { success: true };
          } catch (error) {
            console.error('Logout error:', error);
            
            // Still clear local auth data even if API call fails
            this.user = null;
            this.token = null;
            this.isAuthenticated = false;
            
            if (SharedStars.api) {
              SharedStars.api.clearToken();
            }
            
            if (SharedStars.config.useLocalStorage) {
              localStorage.removeItem('sharedStars_user');
            }
            
            SharedStars.dispatchEvent('auth:logout');
            
            return { success: true, error };
          }
        },
        
        /**
         * Register new user
         * @param {Object} userData - User registration data
         * @returns {Promise} - Promise resolving to registration result
         */
        register: async function(userData) {
          try {
            const response = await SharedStars.api.request('/auth/register', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(userData)
          });
          
          SharedStars.dispatchEvent('auth:register', { 
            success: response.success
          });
          
          return response;
        } catch (error) {
          console.error('Registration error:', error);
          SharedStars.dispatchEvent('auth:registerError', { error });
          throw error;
        }
      }
    };
    
    // Store in components
    this.state.components.auth = this.auth;
    
    // Check authentication status
    this.auth.checkStatus();
    
    if (this.state.debug) {
      console.log('Auth service initialized');
    }
  },
  
  /**
   * Initialize STELLA AI service
   */
  initStellaService: function() {
    // Load STELLA module
    if (window.stellaCore) {
      this.stella = window.stellaCore;
      this.state.components.stella = this.stella;
      
      // Initialize STELLA with app reference
      this.stella.initialize(this);
      
      if (this.state.debug) {
        console.log('STELLA AI service initialized');
      }
      
      this.dispatchEvent('stella:initialized');
    } else {
      console.warn('STELLA Core not available');
      
      // Try to load it
      import('./stella-core.js')
        .then(module => {
          this.stella = module.default;
          window.stellaCore = this.stella;
          this.state.components.stella = this.stella;
          
          // Initialize STELLA with app reference
          this.stella.initialize(this);
          
          if (this.state.debug) {
            console.log('STELLA AI service loaded and initialized');
          }
          
          this.dispatchEvent('stella:initialized');
        })
        .catch(error => {
          console.error('Failed to load STELLA AI service:', error);
          this.config.stellaEnabled = false;
        });
    }
  },
  
  /**
   * Initialize UI components
   */
  initUIComponents: function() {
    // Initialize frontend UI manager
    if (window.SharedStarsFrontend) {
      this.frontend = new window.SharedStarsFrontend({
        apiUrl: this.config.apiUrl,
        useLocalStorage: this.config.useLocalStorage,
        debugMode: this.state.debug
      });
      
      this.state.components.frontend = this.frontend;
      
      if (this.state.debug) {
        console.log('Frontend UI manager initialized');
      }
    } else {
      console.warn('Frontend UI manager not available');
      
      // Try to load it
      import('./frontend.js')
        .then(module => {
          const FrontendClass = module.default || module;
          this.frontend = new FrontendClass({
            apiUrl: this.config.apiUrl,
            useLocalStorage: this.config.useLocalStorage,
            debugMode: this.state.debug
          });
          
          this.state.components.frontend = this.frontend;
          
          if (this.state.debug) {
            console.log('Frontend UI manager loaded and initialized');
          }
        })
        .catch(error => {
          console.error('Failed to load Frontend UI manager:', error);
        });
    }
    
    // Initialize navigation manager
    if (window.NavigationManager) {
      this.navigation = new window.NavigationManager({
        pageTransitions: this.config.pageTransitions,
        debugMode: this.state.debug
      });
      
      this.state.components.navigation = this.navigation;
      
      if (this.state.debug) {
        console.log('Navigation manager initialized');
      }
    } else {
      console.warn('Navigation manager not available');
      
      // Try to load it
      import('./navigation.js')
        .then(module => {
          const NavigationClass = module.default || module;
          this.navigation = new NavigationClass({
            pageTransitions: this.config.pageTransitions,
            debugMode: this.state.debug
          });
          
          this.state.components.navigation = this.navigation;
          
          if (this.state.debug) {
            console.log('Navigation manager loaded and initialized');
          }
        })
        .catch(error => {
          console.error('Failed to load Navigation manager:', error);
        });
    }
    
    // Initialize training UI if on training page
    if (document.querySelector('[data-module]')) {
      this.initTrainingUI();
    }
  },
  
  /**
   * Initialize training UI components
   */
  initTrainingUI: function() {
    // Check if TrainingUI is available
    if (window.TrainingUI) {
      this.trainingUI = new window.TrainingUI();
      this.state.components.trainingUI = this.trainingUI;
      
      if (this.state.debug) {
        console.log('Training UI initialized');
      }
    } else {
      console.warn('Training UI not available');
      
      // Try to load it
      import('./training-ui.js')
        .then(module => {
          const TrainingUIClass = module.default || module;
          this.trainingUI = new TrainingUIClass();
          this.state.components.trainingUI = this.trainingUI;
          
          if (this.state.debug) {
            console.log('Training UI loaded and initialized');
          }
        })
        .catch(error => {
          console.error('Failed to load Training UI:', error);
        });
    }
    
    // Initialize training module if not already
    if (!window.trainingModule) {
      this.initTrainingModule();
    } else {
      this.state.components.trainingModule = window.trainingModule;
    }
  },
  
  /**
   * Initialize training module
   */
  initTrainingModule: function() {
    // Get module type
    const moduleElement = document.querySelector('[data-module]');
    if (!moduleElement) return;
    
    const moduleType = moduleElement.dataset.module;
    
    // Check if TrainingModule is available
    if (window.TrainingModule) {
      let module;
      
      switch (moduleType) {
        case 'physical':
          if (window.PhysicalTrainingModule) {
            module = new window.PhysicalTrainingModule({
              useMockData: this.config.training.mockDataEnabled,
              updateInterval: this.config.training.updateInterval
            });
          } else {
            module = new window.TrainingModule({
              moduleType: 'physical',
              useMockData: this.config.training.mockDataEnabled,
              updateInterval: this.config.training.updateInterval
            });
          }
          break;
        // Add other module types as needed
        default:
          module = new window.TrainingModule({
            moduleType,
            useMockData: this.config.training.mockDataEnabled,
            updateInterval: this.config.training.updateInterval
          });
      }
      
      window.trainingModule = module;
      this.state.components.trainingModule = module;
      
      if (this.state.debug) {
        console.log(`Training module initialized (${moduleType})`);
      }
    } else {
      console.warn('Training module not available');
      
      // Try to load it
      import('./training-module.js')
        .then(module => {
          const { TrainingModule, PhysicalTrainingModule } = module;
          
          let trainingInstance;
          
          switch (moduleType) {
            case 'physical':
              if (PhysicalTrainingModule) {
                trainingInstance = new PhysicalTrainingModule({
                  useMockData: this.config.training.mockDataEnabled,
                  updateInterval: this.config.training.updateInterval
                });
              } else {
                trainingInstance = new TrainingModule({
                  moduleType: 'physical',
                  useMockData: this.config.training.mockDataEnabled,
                  updateInterval: this.config.training.updateInterval
                });
              }
              break;
            // Add other module types as needed
            default:
              trainingInstance = new TrainingModule({
                moduleType,
                useMockData: this.config.training.mockDataEnabled,
                updateInterval: this.config.training.updateInterval
              });
          }
          
          window.trainingModule = trainingInstance;
          this.state.components.trainingModule = trainingInstance;
          
          if (this.state.debug) {
            console.log(`Training module loaded and initialized (${moduleType})`);
          }
        })
        .catch(error => {
          console.error('Failed to load Training module:', error);
        });
    }
  },
  
  /**
   * Connect modules and establish communications
   */
  connectModules: function() {
    // Connect STELLA to training modules if both exist
    if (this.stella && window.trainingModule) {
      this.stella.connectToTrainingModule(window.trainingModule);
      
      if (this.state.debug) {
        console.log('Connected STELLA to training module');
      }
    }
    
    // When STELLA is initialized, connect it to training module
    document.addEventListener('stella:initialized', () => {
      if (this.stella && window.trainingModule) {
        this.stella.connectToTrainingModule(window.trainingModule);
        
        if (this.state.debug) {
          console.log('Connected STELLA to training module after initialization');
        }
      }
    });
    
    // When training module is initialized, connect STELLA to it
    document.addEventListener('trainingModule:initialized', () => {
      if (this.stella && window.trainingModule) {
        this.stella.connectToTrainingModule(window.trainingModule);
        
        if (this.state.debug) {
          console.log('Connected STELLA to training module after training initialization');
        }
      }
    });
  },
  
  /**
   * Register application-wide event listeners
   */
  registerEventListeners: function() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.state.online = true;
      this.dispatchEvent('app:online');
      
      // Sync offline data
      this.syncOfflineData();
    });
    
    window.addEventListener('offline', () => {
      this.state.online = false;
      this.dispatchEvent('app:offline');
    });
    
    // Listen for visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.dispatchEvent('app:visible');
        
        // Refresh data when coming back to the app
        this.refreshData();
      } else {
        this.dispatchEvent('app:hidden');
      }
    });
    
    // Listen for auth events
    document.addEventListener('auth:login', (e) => {
      if (this.state.debug) {
        console.log('User logged in:', e.detail.user);
      }
    });
    
    document.addEventListener('auth:logout', () => {
      if (this.state.debug) {
        console.log('User logged out');
      }
    });
    
    // Listen for config changes
    document.addEventListener('app:configChanged', () => {
      this.saveConfig();
    });
    
    // Listen for error events
    window.addEventListener('error', (e) => {
      this.handleError(e.error || e);
    });
    
    window.addEventListener('unhandledrejection', (e) => {
      this.handleError(e.reason);
    });
  },
  
  /**
   * Initialize modules based on current page
   */
  initializeCurrentPageModules: function() {
    // Get the current page path
    const path = window.location.pathname;
    
    // Initialize page-specific modules
    if (path.startsWith('/training/')) {
      // Training page
      this.initTrainingPage();
    } else if (path.startsWith('/dashboard')) {
      // Dashboard page
      this.initDashboardPage();
    } else if (path.startsWith('/profile')) {
      // Profile page
      this.initProfilePage();
    } else if (path.startsWith('/leaderboard')) {
      // Leaderboard page
      this.initLeaderboardPage();
    }
    
    // Common modules for all pages
    this.initCommonModules();
  },
  
  /**
   * Initialize training page specific modules
   */
  initTrainingPage: function() {
    // Already initialized in initTrainingUI
    // Additional training page specific setup can go here
    if (this.state.debug) {
      console.log('Training page specific modules initialized');
    }
  },
  
  /**
   * Initialize dashboard page specific modules
   */
  initDashboardPage: function() {
    // Initialize dashboard charts
    this.initDashboardCharts();
    
    // Initialize progress trackers
    this.initProgressTrackers();
    
    if (this.state.debug) {
      console.log('Dashboard page specific modules initialized');
    }
  },
  
  /**
   * Initialize dashboard charts
   */
  initDashboardCharts: function() {
    // Check if Chart.js is available
    if (window.Chart) {
      const chartElements = document.querySelectorAll('[data-chart]');
      
      chartElements.forEach(element => {
        const chartType = element.dataset.chartType || 'line';
        let chartData;
        
        try {
          chartData = JSON.parse(element.dataset.chartData || '{}');
        } catch (e) {
          console.warn('Error parsing chart data:', e);
          chartData = { labels: [], datasets: [] };
        }
        
        new Chart(element, {
          type: chartType,
          data: chartData,
          options: {
            responsive: true,
            maintainAspectRatio: false
          }
        });
      });
      
      if (this.state.debug) {
        console.log(`Initialized ${chartElements.length} dashboard charts`);
      }
    } else {
      console.warn('Chart.js not available');
    }
  },
  
  /**
   * Initialize progress trackers
   */
  initProgressTrackers: function() {
    const progressElements = document.querySelectorAll('[data-progress]');
    
    progressElements.forEach(element => {
      const progress = parseFloat(element.dataset.progress) || 0;
      const progressBar = element.querySelector('.progress-bar');
      
      if (progressBar) {
        progressBar.style.width = `${progress}%`;
      }
    });
    
    if (this.state.debug) {
      console.log(`Initialized ${progressElements.length} progress trackers`);
    }
  },
  
  /**
   * Initialize profile page specific modules
   */
  initProfilePage: function() {
    // Initialize profile forms
    this.initProfileForms();
    
    if (this.state.debug) {
      console.log('Profile page specific modules initialized');
    }
  },
  
  /**
   * Initialize profile forms
   */
  initProfileForms: function() {
    const profileForm = document.getElementById('profile-form');
    
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(profileForm);
        const profileData = {};
        
        formData.forEach((value, key) => {
          profileData[key] = value;
        });
        
        this.updateUserProfile(profileData);
      });
    }
  },
  
  /**
   * Update user profile
   * @param {Object} profileData - User profile data
   */
  async updateUserProfile(profileData) {
    if (!this.auth || !this.auth.isAuthenticated) {
      console.warn('User not authenticated');
      return;
    }
    
    try {
      const response = await this.api.request('/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });
      
      if (response.success) {
        // Update auth user data
        this.auth.user = { ...this.auth.user, ...response.user };
        
        // Update localStorage if enabled
        if (this.config.useLocalStorage) {
          localStorage.setItem('sharedStars_user', JSON.stringify(this.auth.user));
        }
        
        // Show success message
        this.showNotification('Profile updated successfully!', 'success');
        
        // Dispatch event
        this.dispatchEvent('user:profileUpdated', { user: this.auth.user });
      } else {
        this.showNotification(response.message || 'Failed to update profile', 'error');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      this.showNotification('An error occurred while updating your profile', 'error');
    }
  },
  
  /**
   * Initialize leaderboard page specific modules
   */
  initLeaderboardPage: function() {
    // Initialize leaderboard filters
    this.initLeaderboardFilters();
    
    // Load leaderboard data
    this.loadLeaderboardData();
    
    if (this.state.debug) {
      console.log('Leaderboard page specific modules initialized');
    }
  },
  
  /**
   * Initialize leaderboard filters
   */
  initLeaderboardFilters: function() {
    const filterForm = document.getElementById('leaderboard-filters');
    
    if (filterForm) {
      filterForm.addEventListener('change', () => {
        this.loadLeaderboardData();
      });
    }
  },
  
  /**
   * Load leaderboard data
   */
  async loadLeaderboardData() {
    const leaderboardContainer = document.getElementById('leaderboard-container');
    if (!leaderboardContainer) return;
    
    // Get filter values
    const filterForm = document.getElementById('leaderboard-filters');
    const filters = {};
    
    if (filterForm) {
      const formData = new FormData(filterForm);
      formData.forEach((value, key) => {
        filters[key] = value;
      });
    }
    
    try {
      // Show loading state
      leaderboardContainer.innerHTML = `
        <div class="flex justify-center items-center p-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      `;
      
      // Fetch leaderboard data
      const queryParams = new URLSearchParams(filters).toString();
      const response = await this.api.request(`/leaderboard?${queryParams}`, {
        method: 'GET'
      });
      
      if (response.success && response.leaderboard) {
        // Render leaderboard
        this.renderLeaderboard(leaderboardContainer, response.leaderboard);
      } else {
        leaderboardContainer.innerHTML = `
          <div class="p-8 text-center text-gray-400">
            <p>Failed to load leaderboard data.</p>
            <button class="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg">Try Again</button>
          </div>
        `;
        
        // Add retry button handler
        const retryButton = leaderboardContainer.querySelector('button');
        if (retryButton) {
          retryButton.addEventListener('click', () => {
            this.loadLeaderboardData();
          });
        }
      }
    } catch (error) {
      console.error('Error loading leaderboard data:', error);
      
      leaderboardContainer.innerHTML = `
        <div class="p-8 text-center text-gray-400">
          <p>An error occurred while loading leaderboard data.</p>
          <button class="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg">Try Again</button>
        </div>
      `;
      
      // Add retry button handler
      const retryButton = leaderboardContainer.querySelector('button');
      if (retryButton) {
        retryButton.addEventListener('click', () => {
          this.loadLeaderboardData();
        });
      }
    }
  },
  
  /**
   * Render leaderboard
   * @param {HTMLElement} container - Container element
   * @param {Array} leaderboardData - Leaderboard data
   */
  renderLeaderboard(container, leaderboardData) {
    // Get current user ID
    const currentUserId = this.auth && this.auth.user ? this.auth.user.id : null;
    
    // Build leaderboard HTML
    let html = `
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-700">
          <thead>
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rank</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cadet</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Score</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Modules</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Specialty</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-700">
    `;
    
    if (leaderboardData.length === 0) {
      html += `
        <tr>
          <td colspan="5" class="px-6 py-8 text-center text-gray-400">
            No leaderboard data available
          </td>
        </tr>
      `;
    } else {
      leaderboardData.forEach((entry, index) => {
        const isCurrentUser = currentUserId && entry.userId === currentUserId;
        
        html += `
          <tr class="${isCurrentUser ? 'bg-blue-900/20' : index % 2 === 0 ? 'bg-gray-800/50' : 'bg-gray-900/50'} ${isCurrentUser ? 'border-l-2 border-blue-500' : ''}">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="w-8 h-8 rounded-full flex items-center justify-center ${
                  index === 0 ? 'bg-yellow-600/30 text-yellow-400' :
                  index === 1 ? 'bg-gray-500/30 text-gray-300' :
                  index === 2 ? 'bg-amber-700/30 text-amber-500' :
                  'bg-blue-600/20 text-blue-400'
                } font-bold">
                  ${index + 1}
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="flex-shrink-0 h-10 w-10">
                  <img class="h-10 w-10 rounded-full" src="${entry.avatar || '/images/default-avatar.png'}" alt="${entry.name}">
                </div>
                <div class="ml-4">
                  <div class="text-sm font-medium ${isCurrentUser ? 'text-blue-400' : 'text-white'}">
                    ${entry.name}
                  </div>
                  <div class="text-sm text-gray-400">
                    ${entry.level || 'Cadet'}
                  </div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm ${isCurrentUser ? 'text-blue-400 font-bold' : 'text-white'}">
                ${entry.score.toLocaleString()}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-300">
                ${entry.completedModules || 0}/${entry.totalModules || 21}
              </div>
              <div class="w-24 h-1.5 bg-gray-700 rounded-full mt-1">
                <div class="h-full bg-${isCurrentUser ? 'blue' : 'green'}-500 rounded-full" style="width: ${(entry.completedModules / (entry.totalModules || 21)) * 100}%"></div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
              ${entry.specialty || 'General Training'}
            </td>
          </tr>
        `;
      });
    }
    
    html += `
          </tbody>
        </table>
      </div>
    `;
    
    container.innerHTML = html;
  },
  
  /**
   * Initialize common modules for all pages
   */
  initCommonModules: function() {
    // Initialize notifications
    this.initNotifications();
    
    // Initialize theme toggle
    this.initThemeToggle();
    
    // Initialize tooltips
    this.initTooltips();
    
    if (this.state.debug) {
      console.log('Common modules initialized');
    }
  },
  
  /**
   * Initialize notifications
   */
  initNotifications: function() {
    // Create notifications container if it doesn't exist
    if (!document.getElementById('notifications-container')) {
      const container = document.createElement('div');
      container.id = 'notifications-container';
      container.className = 'fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2';
      document.body.appendChild(container);
    }
  },
  
  /**
   * Initialize theme toggle
   */
  initThemeToggle: function() {
    const themeToggle = document.getElementById('theme-toggle');
    
    if (themeToggle) {
      // Check saved theme preference
      const savedTheme = localStorage.getItem('sharedStars_theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      // Set initial theme
      if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.classList.add('dark');
        themeToggle.dataset.theme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        themeToggle.dataset.theme = 'light';
      }
      
      // Update toggle button
      this.updateThemeToggle(themeToggle);
      
      // Add click handler
      themeToggle.addEventListener('click', () => {
        const currentTheme = themeToggle.dataset.theme || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        // Update theme
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
        // Save preference
        localStorage.setItem('sharedStars_theme', newTheme);
        
        // Update button
        themeToggle.dataset.theme = newTheme;
        this.updateThemeToggle(themeToggle);
      });
    }
  },
  
  /**
   * Update theme toggle button
   * @param {HTMLElement} toggleButton - Theme toggle button
   */
  updateThemeToggle(toggleButton) {
    const theme = toggleButton.dataset.theme || 'light';
    const icon = toggleButton.querySelector('i') || toggleButton.querySelector('svg');
    
    if (icon) {
      if (theme === 'dark') {
        icon.className = 'fas fa-sun';
        toggleButton.title = 'Switch to Light Mode';
      } else {
        icon.className = 'fas fa-moon';
        toggleButton.title = 'Switch to Dark Mode';
      }
    } else {
      toggleButton.innerHTML = theme === 'dark' 
        ? '<i class="fas fa-sun"></i>' 
        : '<i class="fas fa-moon"></i>';
    }
  },
  
  /**
   * Initialize tooltips
   */
  initTooltips: function() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    
    tooltipElements.forEach(element => {
      element.addEventListener('mouseenter', () => {
        const tooltip = element.dataset.tooltip;
        if (!tooltip) return;
        
        const tooltipEl = document.createElement('div');
        tooltipEl.className = 'absolute z-50 bg-gray-900 text-white text-xs px-2 py-1 rounded pointer-events-none transform -translate-y-full left-1/2 -translate-x-1/2 -mt-1 opacity-0 transition-opacity duration-200';
        tooltipEl.textContent = tooltip;
        
        element.style.position = 'relative';
        element.appendChild(tooltipEl);
        
        // Show with a small delay
        setTimeout(() => {
          tooltipEl.classList.remove('opacity-0');
        }, 10);
      });
      
      element.addEventListener('mouseleave', () => {
        const tooltipEl = element.querySelector('div');
        if (tooltipEl) {
          tooltipEl.classList.add('opacity-0');
          
          // Remove after transition
          setTimeout(() => {
            if (tooltipEl.parentNode === element) {
              element.removeChild(tooltipEl);
            }
          }, 200);
        }
      });
    });
  },
  
  /**
   * Set application ready state
   */
  setReady: function() {
    this.state.ready = true;
    
    // Remove loading screen if it exists
    const loadingScreen = document.getElementById('app-loading');
    if (loadingScreen) {
      loadingScreen.classList.add('opacity-0');
      setTimeout(() => {
        loadingScreen.classList.add('hidden');
      }, 500);
    }
    
    // Add ready class to body
    document.body.classList.add('app-ready');
    
    // Dispatch ready event
    this.dispatchEvent('app:ready');
    
    if (this.state.debug) {
      console.log('Application ready');
    }
  },
  
  /**
   * Refresh application data
   */
  refreshData: function() {
    // Refresh auth status
    if (this.auth) {
      this.auth.checkStatus();
    }
    
    // Refresh page-specific data
    const path = window.location.pathname;
    
    if (path.startsWith('/dashboard')) {
      this.loadDashboardData();
    } else if (path.startsWith('/leaderboard')) {
      this.loadLeaderboardData();
    }
    
    if (this.state.debug) {
      console.log('Application data refreshed');
    }
  },
  
 /**
   * Sync offline data
   */
 syncOfflineData: function() {
    if (!navigator.onLine || !this.config.offline.enabled) return;
    
    // Get pending uploads from localStorage
    if (this.config.useLocalStorage) {
      try {
        const pendingUploads = JSON.parse(localStorage.getItem('sharedStars_pendingUploads') || '[]');
        
        if (pendingUploads.length > 0 && this.state.debug) {
          console.log(`Syncing ${pendingUploads.length} pending uploads`);
        }
        
        // Process each pending upload
        pendingUploads.forEach(async (upload, index) => {
          try {
            await this.api.request(upload.endpoint, {
              method: upload.method,
              headers: upload.contentType === 'json' ? {
                'Content-Type': 'application/json'
              } : undefined,
              body: upload.contentType === 'json' ? JSON.stringify(upload.data) : upload.data
            });
            
            // Remove from pending uploads
            pendingUploads.splice(index, 1);
            
            // Update localStorage
            localStorage.setItem('sharedStars_pendingUploads', JSON.stringify(pendingUploads));
          } catch (error) {
            console.error(`Failed to sync upload ${upload.id}:`, error);
            // Keep in queue to retry later
          }
        });
        
        // Notify if syncing was successful
        if (pendingUploads.length > 0) {
          this.showNotification(`Synced offline data successfully.`, 'success');
        }
      } catch (error) {
        console.error('Error syncing offline data:', error);
      }
    }
  },
  
  /**
   * Load dashboard data
   */
  async loadDashboardData() {
    try {
      const response = await this.api.request('/dashboard/data', {
        method: 'GET'
      });
      
      if (response.success) {
        // Update dashboard UI with new data
        this.updateDashboardUI(response.data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      
      // If offline, try to load cached data
      if (!navigator.onLine && this.config.useLocalStorage) {
        try {
          const cachedData = JSON.parse(localStorage.getItem('sharedStars_dashboardData') || 'null');
          if (cachedData) {
            this.updateDashboardUI(cachedData);
            this.showNotification('Showing cached dashboard data', 'info');
          }
        } catch (e) {
          console.warn('Error loading cached dashboard data:', e);
        }
      }
    }
  },
  
  /**
   * Update dashboard UI with data
   * @param {Object} data - Dashboard data
   */
  updateDashboardUI(data) {
    // Update progress stats
    const progressElements = {
      totalProgress: document.getElementById('total-progress'),
      modulesCompleted: document.getElementById('modules-completed'),
      streak: document.getElementById('streak-count'),
      rank: document.getElementById('user-rank'),
      nextMission: document.getElementById('next-mission')
    };
    
    // Update progress elements if they exist
    if (progressElements.totalProgress && data.totalProgress) {
      progressElements.totalProgress.textContent = `${data.totalProgress}%`;
      const progressBar = progressElements.totalProgress.closest('.progress-container')?.querySelector('.progress-fill');
      if (progressBar) {
        progressBar.style.width = `${data.totalProgress}%`;
      }
    }
    
    if (progressElements.modulesCompleted && data.modulesCompleted) {
      progressElements.modulesCompleted.textContent = `${data.modulesCompleted}/${data.totalModules || 21}`;
    }
    
    if (progressElements.streak && data.streak) {
      progressElements.streak.textContent = data.streak;
    }
    
    if (progressElements.rank && data.rank) {
      progressElements.rank.textContent = data.rank;
    }
    
    if (progressElements.nextMission && data.nextMission) {
      progressElements.nextMission.textContent = data.nextMission.name;
      
      const missionDate = progressElements.nextMission.closest('.mission-card')?.querySelector('.mission-date');
      if (missionDate && data.nextMission.date) {
        const date = new Date(data.nextMission.date);
        missionDate.textContent = date.toLocaleDateString();
      }
    }
    
    // Update recent activities
    const activitiesContainer = document.getElementById('recent-activities');
    if (activitiesContainer && data.recentActivities && data.recentActivities.length > 0) {
      activitiesContainer.innerHTML = '';
      
      data.recentActivities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'flex items-center p-3 border-b border-gray-700';
        
        const activityDate = new Date(activity.timestamp);
        
        activityItem.innerHTML = `
          <div class="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center mr-3 flex-shrink-0">
            <i class="${activity.icon || 'fas fa-check'} text-blue-400"></i>
          </div>
          <div>
            <p class="text-sm text-white">${activity.description}</p>
            <p class="text-xs text-gray-400">${activityDate.toLocaleString()}</p>
          </div>
          <div class="ml-auto text-sm font-medium ${activity.credits ? 'text-green-400' : 'text-gray-400'}">
            ${activity.credits ? `+${activity.credits} credits` : ''}
          </div>
        `;
        
        activitiesContainer.appendChild(activityItem);
      });
    }
    
    // Save to localStorage for offline use
    if (this.config.useLocalStorage) {
      localStorage.setItem('sharedStars_dashboardData', JSON.stringify(data));
    }
  },
  
  /**
   * Handle errors
   * @param {Error} error - Error to handle
   */
  handleError: function(error) {
    console.error('Application error:', error);
    
    // Log error to server if online
    if (navigator.onLine && this.api) {
      this.api.request('/errors/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      }).catch(e => {
        console.error('Failed to log error to server:', e);
      });
    }
    
    // Show notification for user errors
    if (error.userMessage) {
      this.showNotification(error.userMessage, 'error');
    }
    
    // Dispatch error event
    this.dispatchEvent('app:error', { error });
  },
  
  /**
   * Show a notification
   * @param {String} message - Notification message
   * @param {String} type - Notification type (success, warning, error, info)
   * @param {Number} duration - Duration in milliseconds
   */
  showNotification: function(message, type = 'info', duration = 3000) {
    const container = document.getElementById('notifications-container');
    
    if (!container) {
      // Create container if it doesn't exist
      const newContainer = document.createElement('div');
      newContainer.id = 'notifications-container';
      newContainer.className = 'fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2';
      document.body.appendChild(newContainer);
      
      return this.showNotification(message, type, duration);
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
          <i class="fas ${
            type === 'success' ? 'fa-check-circle text-green-400' :
            type === 'warning' ? 'fa-exclamation-triangle text-yellow-400' :
            type === 'error' ? 'fa-times-circle text-red-400' :
            'fa-info-circle text-blue-400'
          }"></i>
        </div>
        <div>
          <p>${message}</p>
        </div>
        <button class="ml-auto -mr-2 text-gray-400 hover:text-white">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    // Add to container
    container.appendChild(notification);
    
    // Add close button functionality
    const closeButton = notification.querySelector('button');
    closeButton.addEventListener('click', () => {
      this.removeNotification(notification);
    });
    
    // Animate in
    setTimeout(() => {
      notification.classList.remove('translate-x-full');
    }, 10);
    
    // Auto remove after duration
    const timeout = setTimeout(() => {
      this.removeNotification(notification);
    }, duration);
    
    // Store reference for potential early removal
    notification._timeout = timeout;
    
    return notification;
  },
  
  /**
   * Remove a notification
   * @param {HTMLElement} notification - Notification element
   */
  removeNotification: function(notification) {
    // Clear timeout if it exists
    if (notification._timeout) {
      clearTimeout(notification._timeout);
    }
    
    // Animate out
    notification.classList.add('translate-x-full');
    
    // Remove after animation
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  },
  
  /**
   * Dispatch a custom event
   * @param {String} eventName - Event name
   * @param {Object} data - Event data
   */
  dispatchEvent: function(eventName, data = {}) {
    const event = new CustomEvent(eventName, {
      detail: {
        ...data,
        timestamp: new Date().toISOString()
      },
      bubbles: true
    });
    
    document.dispatchEvent(event);
    
    if (this.state.debug) {
      console.log(`Event dispatched: ${eventName}`, data);
    }
  }
};

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Get configuration from data attribute if available
  const configElement = document.getElementById('app-config');
  let config = {};
  
  if (configElement) {
    try {
      config = JSON.parse(configElement.textContent);
    } catch (e) {
      console.warn('Error parsing app config:', e);
    }
  }
  
  // Initialize with config
  SharedStars.init(config);
});

// Make SharedStars globally available
window.SharedStars = SharedStars;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SharedStars;
}