/**
 * SharedStars Training UI
 * Handles UI interactions and animations for training modules
 */

class TrainingUI {
    /**
     * Initialize training UI
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
      this.options = {
        darkMode: true,
        animations: true,
        soundEffects: true,
        ...options
      };
  
      // UI state
      this.state = {
        menuOpen: false,
        currentPanel: 'main',
        notifications: [],
        activeModals: []
      };
  
      // Cache DOM elements
      this.cacheElements();
  
      // Set up event listeners
      this.setupEventListeners();
  
      // Initialize UI effects
      this.initializeEffects();
  
      console.log('Training UI initialized');
    }
  
    /**
     * Cache frequently used DOM elements
     */
    cacheElements() {
      // Navigation elements
      this.navToggle = document.getElementById('nav-toggle');
      this.sideNav = document.getElementById('side-navigation');
      this.navOverlay = document.getElementById('nav-overlay');
  
      // Panel navigation
      this.panels = document.querySelectorAll('.panel');
      this.panelNavButtons = document.querySelectorAll('[data-panel-nav]');
  
      // Modals
      this.modals = document.querySelectorAll('.modal');
      this.modalTriggers = document.querySelectorAll('[data-modal]');
      this.modalCloseButtons = document.querySelectorAll('.close-modal');
  
      // Tooltips
      this.tooltipTriggers = document.querySelectorAll('[data-tooltip]');
  
      // Notifications area
      this.notificationContainer = document.getElementById('notification-container');
  
      // Theme toggle
      this.themeToggle = document.getElementById('theme-toggle');
  
      // Animations toggle
      this.animationsToggle = document.getElementById('animations-toggle');
  
      // Sound effects toggle
      this.soundToggle = document.getElementById('sound-toggle');
  
      // Help icon
      this.helpIcon = document.getElementById('help-icon');
  
      // Exercise cards
      this.exerciseCards = document.querySelectorAll('.exercise-card');
  
      // Progress charts
      this.progressCharts = document.querySelectorAll('.progress-chart');
    }
  
    /**
     * Set up event listeners for UI interactions
     */
    setupEventListeners() {
      // Navigation toggle
      if (this.navToggle) {
        this.navToggle.addEventListener('click', () => this.toggleNavigation());
      }
  
      // Navigation overlay (for closing)
      if (this.navOverlay) {
        this.navOverlay.addEventListener('click', () => this.closeNavigation());
      }
  
      // Panel navigation
      this.panelNavButtons.forEach(button => {
        button.addEventListener('click', () => {
          const targetPanel = button.dataset.panelNav;
          this.changePanel(targetPanel);
        });
      });
  
      // Modal triggers
      this.modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
          const modalId = trigger.dataset.modal;
          this.openModal(modalId);
        });
      });
  
      // Modal close buttons
      this.modalCloseButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          const modal = e.target.closest('.modal');
          if (modal) {
            this.closeModal(modal.id);
          }
        });
      });
  
      // Close modals when clicking outside
      this.modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            this.closeModal(modal.id);
          }
        });
      });
  
      // Tooltips
      this.tooltipTriggers.forEach(trigger => {
        trigger.addEventListener('mouseenter', () => this.showTooltip(trigger));
        trigger.addEventListener('mouseleave', () => this.hideTooltip(trigger));
      });
  
      // Theme toggle
      if (this.themeToggle) {
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
      }
  
      // Animations toggle
      if (this.animationsToggle) {
        this.animationsToggle.addEventListener('click', () => this.toggleAnimations());
      }
  
      // Sound effects toggle
      if (this.soundToggle) {
        this.soundToggle.addEventListener('click', () => this.toggleSoundEffects());
      }
  
      // Help icon
      if (this.helpIcon) {
        this.helpIcon.addEventListener('click', () => this.showHelp());
      }
  
      // Exercise cards
      this.exerciseCards.forEach(card => {
        card.addEventListener('click', () => {
          this.handleExerciseCardClick(card);
        });
      });
  
      // Escape key for closing modals
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.closeAllModals();
        }
      });
  
      // Window resize handler
      window.addEventListener('resize', () => this.handleResize());
    }
  
    /**
     * Initialize UI effects
     */
    initializeEffects() {
      // Apply current theme
      this.applyTheme();
  
      // Initialize progress charts
      this.initializeProgressCharts();
  
      // Initialize tooltips
      this.initializeTooltips();
  
      // Add particle effects if enabled
      if (this.options.animations) {
        this.initializeParticleEffects();
      }
  
      // Initialize sound effects if enabled
      if (this.options.soundEffects) {
        this.initializeSoundEffects();
      }
    }
  
    /**
     * Toggle side navigation menu
     */
    toggleNavigation() {
      if (this.state.menuOpen) {
        this.closeNavigation();
      } else {
        this.openNavigation();
      }
    }
  
    /**
     * Open side navigation menu
     */
    openNavigation() {
      if (!this.sideNav) return;
  
      this.sideNav.classList.remove('-translate-x-full');
      if (this.navOverlay) {
        this.navOverlay.classList.remove('opacity-0', 'pointer-events-none');
      }
      this.state.menuOpen = true;
  
      // Play sound effect if enabled
      if (this.options.soundEffects) {
        this.playSound('navigation');
      }
    }
  
    /**
     * Close side navigation menu
     */
    closeNavigation() {
      if (!this.sideNav) return;
  
      this.sideNav.classList.add('-translate-x-full');
      if (this.navOverlay) {
        this.navOverlay.classList.add('opacity-0', 'pointer-events-none');
      }
      this.state.menuOpen = false;
    }
  
    /**
     * Change the active panel
     * @param {String} panelId - ID of the panel to show
     */
    changePanel(panelId) {
      const targetPanel = document.getElementById(panelId);
      if (!targetPanel) return;
  
      // Hide all panels
      this.panels.forEach(panel => {
        panel.classList.add('hidden');
      });
  
      // Show target panel
      targetPanel.classList.remove('hidden');
      
      // Update active state in navigation
      this.panelNavButtons.forEach(button => {
        if (button.dataset.panelNav === panelId) {
          button.classList.add('bg-blue-900/30', 'border-blue-500');
          button.classList.remove('border-gray-700');
        } else {
          button.classList.remove('bg-blue-900/30', 'border-blue-500');
          button.classList.add('border-gray-700');
        }
      });
  
      this.state.currentPanel = panelId;
  
      // Play panel change sound if enabled
      if (this.options.soundEffects) {
        this.playSound('panel-change');
      }
    }
  
    /**
     * Open a modal
     * @param {String} modalId - ID of the modal to open
     */
    openModal(modalId) {
      const modal = document.getElementById(modalId);
      if (!modal) return;
  
      // Show the modal
      modal.classList.remove('hidden');
      
      // Apply animation if enabled
      if (this.options.animations) {
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
          modalContent.classList.add('animate-modal-in');
          setTimeout(() => {
            modalContent.classList.remove('animate-modal-in');
          }, 300);
        }
      }
  
      // Add to active modals
      this.state.activeModals.push(modalId);
  
      // Play modal sound if enabled
      if (this.options.soundEffects) {
        this.playSound('modal-open');
      }
    }
  
    /**
     * Close a modal
     * @param {String} modalId - ID of the modal to close
     */
    closeModal(modalId) {
      const modal = document.getElementById(modalId);
      if (!modal) return;
  
      // Apply animation if enabled
      if (this.options.animations) {
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
          modalContent.classList.add('animate-modal-out');
          setTimeout(() => {
            modal.classList.add('hidden');
            modalContent.classList.remove('animate-modal-out');
          }, 200);
        } else {
          modal.classList.add('hidden');
        }
      } else {
        modal.classList.add('hidden');
      }
  
      // Remove from active modals
      this.state.activeModals = this.state.activeModals.filter(id => id !== modalId);
  
      // Play modal close sound if enabled
      if (this.options.soundEffects) {
        this.playSound('modal-close');
      }
    }
  
    /**
     * Close all open modals
     */
    closeAllModals() {
      const activeModals = [...this.state.activeModals];
      activeModals.forEach(modalId => {
        this.closeModal(modalId);
      });
    }
  
    /**
     * Show a tooltip
     * @param {HTMLElement} trigger - Element that triggered the tooltip
     */
    showTooltip(trigger) {
      const tooltipText = trigger.dataset.tooltip;
      if (!tooltipText) return;
  
      // Check if tooltip already exists
      let tooltip = trigger.querySelector('.tooltip');
      
      if (!tooltip) {
        // Create tooltip element
        tooltip = document.createElement('div');
        tooltip.className = 'tooltip absolute z-50 bg-gray-900 text-white text-xs px-2 py-1 rounded pointer-events-none transform -translate-y-full -translate-x-1/2 left-1/2 -mt-1 opacity-0 transition-opacity duration-200';
        tooltip.textContent = tooltipText;
        
        // Add to DOM
        trigger.style.position = 'relative';
        trigger.appendChild(tooltip);
      }
  
      // Show tooltip
      setTimeout(() => {
        tooltip.classList.remove('opacity-0');
      }, 10);
    }
  
    /**
     * Hide a tooltip
     * @param {HTMLElement} trigger - Element that triggered the tooltip
     */
    hideTooltip(trigger) {
      const tooltip = trigger.querySelector('.tooltip');
      if (tooltip) {
        tooltip.classList.add('opacity-0');
        
        // Remove after animation completes
        setTimeout(() => {
          if (tooltip.parentNode === trigger) {
            trigger.removeChild(tooltip);
          }
        }, 200);
      }
    }
  
    /**
     * Toggle dark/light theme
     */
    toggleTheme() {
      this.options.darkMode = !this.options.darkMode;
      this.applyTheme();
      
      // Update toggle button
      if (this.themeToggle) {
        const icon = this.themeToggle.querySelector('i');
        if (icon) {
          icon.className = this.options.darkMode ? 'fas fa-sun' : 'fas fa-moon';
        }
        this.themeToggle.title = this.options.darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode';
      }
  
      // Save preference
      this.savePreferences();
  
      // Play toggle sound if enabled
      if (this.options.soundEffects) {
        this.playSound('toggle');
      }
    }
  
    /**
     * Apply current theme to UI
     */
    applyTheme() {
      if (this.options.darkMode) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('bg-gray-900', 'text-white');
        document.body.classList.remove('bg-white', 'text-gray-900');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('bg-gray-900', 'text-white');
        document.body.classList.add('bg-white', 'text-gray-900');
      }
    }
  
    /**
     * Toggle UI animations
     */
    toggleAnimations() {
      this.options.animations = !this.options.animations;
      
      // Update UI to reflect animation state
      if (this.options.animations) {
        document.body.classList.remove('reduce-motion');
        if (this.animationsToggle) {
          this.animationsToggle.textContent = 'Animations: On';
        }
        // Reinitialize particle effects
        this.initializeParticleEffects();
      } else {
        document.body.classList.add('reduce-motion');
        if (this.animationsToggle) {
          this.animationsToggle.textContent = 'Animations: Off';
        }
        // Remove particle effects
        this.removeParticleEffects();
      }
  
      // Save preference
      this.savePreferences();
  
      // Play toggle sound if enabled
      if (this.options.soundEffects) {
        this.playSound('toggle');
      }
    }
  
    /**
     * Toggle sound effects
     */
    toggleSoundEffects() {
      this.options.soundEffects = !this.options.soundEffects;
      
      // Update UI to reflect sound effects state
      if (this.soundToggle) {
        const icon = this.soundToggle.querySelector('i');
        if (icon) {
          icon.className = this.options.soundEffects ? 'fas fa-volume-up' : 'fas fa-volume-mute';
        }
        this.soundToggle.title = this.options.soundEffects ? 'Mute Sound Effects' : 'Enable Sound Effects';
      }
  
      // Save preference
      this.savePreferences();
  
      // Play toggle sound if newly enabled
      if (this.options.soundEffects) {
        this.playSound('toggle');
      }
    }
  
    /**
     * Save user preferences
     */
    savePreferences() {
      try {
        localStorage.setItem('sharedStars_uiPreferences', JSON.stringify({
          darkMode: this.options.darkMode,
          animations: this.options.animations,
          soundEffects: this.options.soundEffects
        }));
      } catch (e) {
        console.warn('Failed to save preferences to localStorage', e);
      }
    }
  
    /**
     * Load user preferences
     */
    loadPreferences() {
      try {
        const savedPreferences = localStorage.getItem('sharedStars_uiPreferences');
        if (savedPreferences) {
          const preferences = JSON.parse(savedPreferences);
          this.options.darkMode = preferences.darkMode ?? this.options.darkMode;
          this.options.animations = preferences.animations ?? this.options.animations;
          this.options.soundEffects = preferences.soundEffects ?? this.options.soundEffects;
          
          // Apply loaded preferences
          this.applyTheme();
          if (!this.options.animations) {
            document.body.classList.add('reduce-motion');
          }
          
          // Update UI controls
          if (this.themeToggle) {
            const icon = this.themeToggle.querySelector('i');
            if (icon) {
              icon.className = this.options.darkMode ? 'fas fa-sun' : 'fas fa-moon';
            }
          }
          
          if (this.animationsToggle) {
            this.animationsToggle.textContent = `Animations: ${this.options.animations ? 'On' : 'Off'}`;
          }
          
          if (this.soundToggle) {
            const icon = this.soundToggle.querySelector('i');
            if (icon) {
              icon.className = this.options.soundEffects ? 'fas fa-volume-up' : 'fas fa-volume-mute';
            }
          }
        }
      } catch (e) {
        console.warn('Failed to load preferences from localStorage', e);
      }
    }
  
    /**
     * Initialize progress charts
     */
    initializeProgressCharts() {
      this.progressCharts.forEach(chart => {
        const chartType = chart.dataset.chartType || 'line';
        const chartData = JSON.parse(chart.dataset.chartData || '[]');
        const chartOptions = JSON.parse(chart.dataset.chartOptions || '{}');
        
        // Use Chart.js if available
        if (window.Chart) {
          new Chart(chart, {
            type: chartType,
            data: chartData,
            options: {
              responsive: true,
              maintainAspectRatio: false,
              ...chartOptions
            }
          });
        } else {
          console.warn('Chart.js not available. Charts will not be rendered.');
          chart.innerHTML = '<div class="p-4 text-center text-gray-400">Chart visualization unavailable</div>';
        }
      });
    }
  
    /**
     * Initialize particle effects
     */
    initializeParticleEffects() {
      if (!this.options.animations) return;
      
      // Only initialize if Particles.js is available
      if (window.particlesJS) {
        particlesJS('particles-js', {
          particles: {
            number: {
              value: 30,
              density: {
                enable: true,
                value_area: 800
              }
            },
            color: {
              value: '#3b82f6'
            },
            shape: {
              type: 'circle',
              stroke: {
                width: 0,
                color: '#000000'
              }
            },
            opacity: {
              value: 0.2,
              random: true,
              anim: {
                enable: true,
                speed: 1,
                opacity_min: 0.1,
                sync: false
              }
            },
            size: {
              value: 3,
              random: true
            },
            line_linked: {
              enable: true,
              distance: 150,
              color: '#3b82f6',
              opacity: 0.1,
              width: 1
            },
            move: {
              enable: true,
              speed: 1,
              direction: 'none',
              random: true,
              straight: false,
              out_mode: 'out',
              bounce: false
            }
          },
          interactivity: {
            detect_on: 'canvas',
            events: {
              onhover: {
                enable: true,
                mode: 'grab'
              },
              onclick: {
                enable: true,
                mode: 'push'
              },
              resize: true
            }
          },
          retina_detect: true
        });
      }
    }
  
    /**
     * Remove particle effects
     */
    removeParticleEffects() {
      const particlesContainer = document.getElementById('particles-js');
      if (particlesContainer) {
        particlesContainer.innerHTML = '';
      }
    }
  
    /**
     * Initialize tooltips
     */
    initializeTooltips() {
      // Already set up in event listeners
    }
  
    /**
     * Initialize sound effects
     */
    initializeSoundEffects() {
      // Create audio elements for each sound
      this.sounds = {
        'navigation': new Audio('/sounds/navigation.mp3'),
        'modal-open': new Audio('/sounds/modal-open.mp3'),
        'modal-close': new Audio('/sounds/modal-close.mp3'),
        'panel-change': new Audio('/sounds/panel-change.mp3'),
        'toggle': new Audio('/sounds/toggle.mp3'),
        'success': new Audio('/sounds/success.mp3'),
        'error': new Audio('/sounds/error.mp3'),
        'notification': new Audio('/sounds/notification.mp3'),
        'exercise-complete': new Audio('/sounds/exercise-complete.mp3')
      };
  
      // Preload all sounds
      Object.values(this.sounds).forEach(sound => {
        sound.load();
        sound.volume = 0.5; // Set volume to 50%
      });
    }
  
    /**
     * Play a sound effect
     * @param {String} soundName - Name of the sound to play
     */
    playSound(soundName) {
      if (!this.options.soundEffects || !this.sounds || !this.sounds[soundName]) return;
      
      // Clone the audio to allow overlapping sounds
      const sound = this.sounds[soundName].cloneNode();
      sound.volume = 0.5;
      sound.play().catch(e => {
        // Autoplay might be blocked by browser
        console.warn('Sound playback failed:', e);
      });
    }
  
    /**
     * Show a notification
     * @param {String} message - Notification message
     * @param {String} type - Notification type (success, warning, error, info)
     * @param {Number} duration - Duration in milliseconds
     */
    showNotification(message, type = 'info', duration = 3000) {
      if (!this.notificationContainer) {
        // Create notification container if it doesn't exist
        this.notificationContainer = document.createElement('div');
        this.notificationContainer.id = 'notification-container';
        this.notificationContainer.className = 'fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2';
        document.body.appendChild(this.notificationContainer);
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
            <i class="${
              type === 'success' ? 'fas fa-check-circle text-green-400' :
              type === 'warning' ? 'fas fa-exclamation-triangle text-yellow-400' :
              type === 'error' ? 'fas fa-times-circle text-red-400' :
              'fas fa-info-circle text-blue-400'
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
  
      // Add to notification container
      this.notificationContainer.appendChild(notification);
  
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
  
      // Play notification sound if enabled
      if (this.options.soundEffects) {
        this.playSound(type === 'success' ? 'success' : 
                      type === 'error' ? 'error' : 'notification');
      }
  
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
        if (notification.parentNode === this.notificationContainer) {
          this.notificationContainer.removeChild(notification);
        }
      }, 300);
    }
  
    /**
     * Handle window resize events
     */
    handleResize() {
        // Close side navigation on small screens
        if (window.innerWidth < 768 && this.state.menuOpen) {
          this.closeNavigation();
        }
    
        // Adjust UI elements based on screen size
        this.adjustUIForScreenSize();
      }
    
      /**
       * Adjust UI elements based on screen size
       */
      adjustUIForScreenSize() {
        const isMobile = window.innerWidth < 768;
        const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
        
        // Adjust chart sizes
        this.progressCharts.forEach(chart => {
          if (chart.chart) {
            chart.chart.resize();
          }
        });
        
        // Adjust modal positioning
        this.modals.forEach(modal => {
          const modalContent = modal.querySelector('.modal-content');
          if (modalContent) {
            if (isMobile) {
              modalContent.classList.add('max-w-full', 'mx-4');
              modalContent.classList.remove('max-w-2xl');
            } else {
              modalContent.classList.add('max-w-2xl');
              modalContent.classList.remove('max-w-full', 'mx-4');
            }
          }
        });
        
        // Adjust exercise card layout
        this.exerciseCards.forEach(card => {
          if (isMobile) {
            card.classList.add('flex-col');
            card.classList.remove('flex-row');
          } else {
            card.classList.add('flex-row');
            card.classList.remove('flex-col');
          }
        });
      }
    
      /**
       * Handle exercise card click
       * @param {HTMLElement} card - Exercise card element
       */
      handleExerciseCardClick(card) {
        const exerciseId = card.dataset.exerciseId;
        if (!exerciseId) return;
        
        // Show exercise details
        if (window.trainingModule) {
          const exercise = {
            id: exerciseId,
            name: card.querySelector('.exercise-name')?.textContent || 'Exercise',
            zone: card.dataset.exerciseZone || 'default',
            duration: parseInt(card.dataset.exerciseDuration || '180', 10)
          };
          
          window.trainingModule.showExerciseDetails(exercise);
        }
      }
    
      /**
       * Show help information
       */
      showHelp() {
        this.openModal('help-modal');
      }
    
      /**
       * Update exercise progress indication
       * @param {String} exerciseId - ID of the exercise
       * @param {Number} progress - Progress percentage (0-100)
       */
      updateExerciseProgress(exerciseId, progress) {
        const exerciseCard = document.querySelector(`.exercise-card[data-exercise-id="${exerciseId}"]`);
        if (!exerciseCard) return;
        
        const progressBar = exerciseCard.querySelector('.progress-bar .progress-fill');
        if (progressBar) {
          progressBar.style.width = `${progress}%`;
        }
        
        const progressText = exerciseCard.querySelector('.progress-text');
        if (progressText) {
          progressText.textContent = `${Math.round(progress)}%`;
        }
        
        // Add completed class if 100%
        if (progress >= 100) {
          exerciseCard.classList.add('completed');
          const completionBadge = exerciseCard.querySelector('.completion-badge');
          if (completionBadge) {
            completionBadge.classList.remove('hidden');
          }
        }
      }
    
      /**
       * Update overall module progress
       * @param {Number} progress - Progress percentage (0-100)
       */
      updateModuleProgress(progress) {
        const moduleProgressBar = document.getElementById('module-progress-bar');
        if (moduleProgressBar) {
          const fill = moduleProgressBar.querySelector('.progress-fill');
          if (fill) {
            fill.style.width = `${progress}%`;
          }
        }
        
        const moduleProgressText = document.getElementById('module-progress-text');
        if (moduleProgressText) {
          moduleProgressText.textContent = `${Math.round(progress)}%`;
        }
      }
    
      /**
       * Update credits display
       * @param {Number} credits - Current credit amount
       */
      updateCredits(credits) {
        const creditsDisplay = document.getElementById('credits-earned');
        if (creditsDisplay) {
          creditsDisplay.textContent = credits;
          
          // Highlight with animation
          creditsDisplay.classList.add('pulse-highlight');
          setTimeout(() => {
            creditsDisplay.classList.remove('pulse-highlight');
          }, 1000);
        }
      }
    
      /**
       * Update metrics display
       * @param {Object} metrics - Metrics to update
       */
      updateMetrics(metrics) {
        Object.entries(metrics).forEach(([key, value]) => {
          const element = document.getElementById(`metric-${key}`);
          if (element) {
            // Update text
            element.textContent = value;
            
            // Add pulse effect
            element.classList.add('pulse-highlight');
            setTimeout(() => {
              element.classList.remove('pulse-highlight');
            }, 1000);
          }
        });
      }
    
      /**
       * Update STELLA's guidance display
       * @param {Object} guidance - Guidance data from STELLA
       */
      updateSTELLAGuidance(guidance) {
        const guidanceElement = document.getElementById('stella-guidance');
        if (!guidanceElement) return;
        
        if (guidance && guidance.message) {
          const actionItemsHtml = guidance.actionItems && guidance.actionItems.length
            ? `<ul class="mt-2 space-y-1">
                ${guidance.actionItems.map(item => `<li class="text-xs text-blue-200">• ${item}</li>`).join('')}
              </ul>`
            : '';
          
          guidanceElement.innerHTML = `
            <div class="bg-blue-500/10 rounded-lg p-3">
              <p class="text-sm text-blue-300">${guidance.message}</p>
              ${actionItemsHtml}
            </div>
          `;
          
          // Add appear animation
          guidanceElement.classList.add('fade-in');
          setTimeout(() => {
            guidanceElement.classList.remove('fade-in');
          }, 1000);
          
          // Play guidance sound if enabled
          if (this.options.soundEffects) {
            this.playSound('notification');
          }
        }
      }
    }
    
    // Initialize the training UI when the DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
      // Get saved preferences
      let uiOptions = {};
      try {
        const savedPreferences = localStorage.getItem('sharedStars_uiPreferences');
        if (savedPreferences) {
          uiOptions = JSON.parse(savedPreferences);
        }
      } catch (e) {
        console.warn('Failed to load UI preferences', e);
      }
      
      // Create training UI instance
      window.trainingUI = new TrainingUI(uiOptions);
      
      // Load user preferences
      window.trainingUI.loadPreferences();
      
      console.log('Training UI initialized with options:', uiOptions);
    });
    
    // Export the TrainingUI class for use in other files
    if (typeof module !== 'undefined' && module.exports) {
      module.exports = TrainingUI;
    } else {
      // For browser environment
      window.TrainingUI = TrainingUI;
    }