/**
 * SharedStars Navigation
 * Handles site navigation, routing, and page transitions
 */

class NavigationManager {
    /**
     * Initialize the navigation manager
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
      // Default configuration
      this.options = {
        pageTransitions: true,
        transitionDuration: 300,
        navHighlighting: true,
        scrollToTop: true,
        ...options
      };
  
      // Current page state
      this.currentPageInfo = {
        path: window.location.pathname,
        params: this.getUrlParams(),
        title: document.title,
        referrer: document.referrer
      };
  
      // History of visited pages (limited to last 10)
      this.pageHistory = [];
  
      // Sidebar state
      this.sidebarOpen = false;
  
      // Cache DOM elements
      this.cacheElements();
  
      // Set up event listeners
      this.setupEventListeners();
  
      // Handle initial page load
      this.handleInitialPage();
  
      // Setup route highlighting based on current URL
      this.highlightCurrentRoute();
      
      // Log initialization if in debug mode
      if (this.options.debugMode) {
        console.log('Navigation Manager initialized:', this.options);
      }
    }
  
    /**
     * Cache frequently used DOM elements
     */
    cacheElements() {
      // Main navigation elements
      this.mainNavigation = document.getElementById('main-nav');
      this.navLinks = document.querySelectorAll('.nav-link');
      this.sidebarToggle = document.getElementById('sidebar-toggle');
      this.sidebar = document.getElementById('sidebar');
      this.sidebarOverlay = document.getElementById('sidebar-overlay');
      this.sidebarCloseButton = document.getElementById('sidebar-close');
      
      // Breadcrumb element
      this.breadcrumbContainer = document.getElementById('breadcrumbs');
      
      // Page transition elements
      this.pageTransitionOverlay = document.getElementById('page-transition-overlay');
      
      // Back buttons
      this.backButtons = document.querySelectorAll('.nav-back-button');
      
      // Progress indicator
      this.progressIndicator = document.getElementById('nav-progress-indicator');
      
      // Search form
      this.searchForm = document.getElementById('search-form');
      
      // Content container (for page transitions)
      this.contentContainer = document.getElementById('main-content');
    }
  
    /**
     * Set up event listeners
     */
    setupEventListeners() {
      // Intercept link clicks for smooth page transitions
      document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && this.shouldHandleLink(link)) {
          e.preventDefault();
          this.navigateTo(link.href);
        }
      });
  
      // Handle browser back/forward buttons
      window.addEventListener('popstate', (e) => {
        if (e.state) {
          this.handlePageChange(window.location.href, true);
        }
      });
  
      // Toggle sidebar
      if (this.sidebarToggle) {
        this.sidebarToggle.addEventListener('click', () => {
          this.toggleSidebar();
        });
      }
  
      // Close sidebar when overlay is clicked
      if (this.sidebarOverlay) {
        this.sidebarOverlay.addEventListener('click', () => {
          this.closeSidebar();
        });
      }
  
      // Close sidebar with close button
      if (this.sidebarCloseButton) {
        this.sidebarCloseButton.addEventListener('click', () => {
          this.closeSidebar();
        });
      }
  
      // Handle back buttons
      this.backButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          this.goBack();
        });
      });
  
      // Handle search form
      if (this.searchForm) {
        this.searchForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const searchInput = this.searchForm.querySelector('input[type="search"]');
          if (searchInput && searchInput.value.trim()) {
            this.navigateTo(`/search?q=${encodeURIComponent(searchInput.value.trim())}`);
          }
        });
      }
      
      // Mobile menu toggle
      const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
      const mobileMenu = document.getElementById('mobile-menu');
      
      if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', () => {
          mobileMenu.classList.toggle('hidden');
        });
      }
      
      // Collapsible sidebar sections
      const collapsibleHeaders = document.querySelectorAll('.sidebar-collapsible-header');
      collapsibleHeaders.forEach(header => {
        header.addEventListener('click', () => {
          const content = header.nextElementSibling;
          const icon = header.querySelector('.sidebar-collapse-icon');
          
          if (content && content.classList.contains('sidebar-collapsible-content')) {
            content.classList.toggle('hidden');
            if (icon) {
              icon.classList.toggle('transform');
              icon.classList.toggle('rotate-180');
            }
          }
        });
      });
      
      // Listen for custom navigation events
      document.addEventListener('navigate', (e) => {
        if (e.detail && e.detail.url) {
            this.navigateTo(e.detail.url);
          }
        });
      }
    
      /**
       * Handle initial page load
       */
      handleInitialPage() {
        // Store initial page in history
        this.addToPageHistory({
          path: window.location.pathname,
          params: this.getUrlParams(),
          title: document.title,
          referrer: document.referrer
        });
        
        // Trigger page loaded event
        this.triggerPageEvent('pageloaded', {
          url: window.location.href,
          title: document.title
        });
      }
    
      /**
       * Check if a link should be handled by the navigation manager
       * @param {HTMLAnchorElement} link - Link element
       * @returns {Boolean} - Whether the link should be handled
       */
      shouldHandleLink(link) {
        // Skip if no href
        if (!link.href) return false;
        
        // Skip if target is _blank
        if (link.target === '_blank') return false;
        
        // Skip if has download attribute
        if (link.hasAttribute('download')) return false;
        
        // Skip if it's an anchor link on the same page
        if (link.getAttribute('href').startsWith('#')) return false;
        
        // Skip external links
        const currentOrigin = window.location.origin;
        if (!link.href.startsWith(currentOrigin)) return false;
        
        // Skip if has data-no-transition attribute
        if (link.dataset.noTransition !== undefined) return false;
        
        return true;
      }
    
      /**
       * Navigate to a URL
       * @param {String} url - URL to navigate to
       * @param {Boolean} skipPushState - Whether to skip pushing state to history
       */
      navigateTo(url, skipPushState = false) {
        // Show progress indicator
        this.showProgressIndicator();
        
        // Handle page transition
        this.handlePageChange(url, skipPushState);
      }
    
      /**
       * Handle page change
       * @param {String} url - URL to navigate to
       * @param {Boolean} skipPushState - Whether to skip pushing state to history
       */
      async handlePageChange(url, skipPushState = false) {
        try {
          // Parse URL
          const parsedUrl = new URL(url);
          const path = parsedUrl.pathname;
          
          // If same page with different hash, just scroll to anchor
          if (parsedUrl.pathname === window.location.pathname && 
              parsedUrl.hash && parsedUrl.hash !== window.location.hash) {
            
            // Update URL
            if (!skipPushState) {
              window.history.pushState({ path }, '', url);
            }
            
            // Scroll to anchor
            const anchorElement = document.querySelector(parsedUrl.hash);
            if (anchorElement) {
              anchorElement.scrollIntoView({ behavior: 'smooth' });
            }
            
            this.hideProgressIndicator();
            return;
          }
          
          // If using page transitions, show the overlay
          if (this.options.pageTransitions && this.pageTransitionOverlay) {
            this.pageTransitionOverlay.classList.remove('hidden');
            this.pageTransitionOverlay.classList.add('opacity-100');
            
            // Wait for transition
            await this.sleep(this.options.transitionDuration);
          }
          
          // Fetch new page content if using AJAX navigation
          // Note: For a complete app, you would implement AJAX page loading here
          // For simplicity in this example, we're just navigating to the URL directly
          
          // Update URL in browser if not coming from popstate
          if (!skipPushState) {
            window.history.pushState({ path }, '', url);
          }
          
          // Store current page info
          const currentPageInfo = {
            path: window.location.pathname,
            params: this.getUrlParams(),
            title: document.title,
            referrer: document.referrer
          };
          
          // Add to history
          this.addToPageHistory(currentPageInfo);
          
          // For demo purposes, just navigate directly
          window.location.href = url;
          
          // In a real AJAX implementation, you would:
          // 1. Fetch the new page content
          // 2. Update the DOM with the new content
          // 3. Update title and meta tags
          // 4. Handle scripts and stylesheets
          // 5. Trigger page load events
          // 6. Hide transition overlay
          
          // For now, page will reload and this function will effectively terminate here
          
        } catch (error) {
          console.error('Navigation error:', error);
          this.hideProgressIndicator();
          
          // In case of error, fall back to direct navigation
          window.location.href = url;
        }
      }
    
      /**
       * Add page to navigation history
       * @param {Object} pageInfo - Page information
       */
      addToPageHistory(pageInfo) {
        // Add to beginning of array
        this.pageHistory.unshift(pageInfo);
        
        // Limit history to 10 items
        if (this.pageHistory.length > 10) {
          this.pageHistory = this.pageHistory.slice(0, 10);
        }
      }
    
      /**
       * Go back in navigation history
       */
      goBack() {
        // If we have history, go back
        if (this.pageHistory.length > 1) {
          window.history.back();
        } else {
          // If no history, go to home
          this.navigateTo('/');
        }
      }
    
      /**
       * Toggle sidebar
       */
      toggleSidebar() {
        if (this.sidebarOpen) {
          this.closeSidebar();
        } else {
          this.openSidebar();
        }
      }
    
      /**
       * Open sidebar
       */
      openSidebar() {
        if (!this.sidebar) return;
        
        this.sidebar.classList.remove('-translate-x-full');
        this.sidebar.classList.add('translate-x-0');
        
        if (this.sidebarOverlay) {
          this.sidebarOverlay.classList.remove('opacity-0', 'pointer-events-none');
        }
        
        this.sidebarOpen = true;
        
        // Add class to body to prevent scrolling
        document.body.classList.add('sidebar-open', 'overflow-hidden');
      }
    
      /**
       * Close sidebar
       */
      closeSidebar() {
        if (!this.sidebar) return;
        
        this.sidebar.classList.remove('translate-x-0');
        this.sidebar.classList.add('-translate-x-full');
        
        if (this.sidebarOverlay) {
          this.sidebarOverlay.classList.add('opacity-0', 'pointer-events-none');
        }
        
        this.sidebarOpen = false;
        
        // Remove class from body to allow scrolling
        document.body.classList.remove('sidebar-open', 'overflow-hidden');
      }
    
      /**
       * Show progress indicator
       */
      showProgressIndicator() {
        if (!this.progressIndicator) return;
        
        this.progressIndicator.classList.remove('hidden');
        this.progressIndicator.classList.add('opacity-100');
      }
    
      /**
       * Hide progress indicator
       */
      hideProgressIndicator() {
        if (!this.progressIndicator) return;
        
        this.progressIndicator.classList.add('opacity-0');
        setTimeout(() => {
          this.progressIndicator.classList.add('hidden');
        }, 300); // Match transition duration
      }
    
      /**
       * Highlight current route in navigation
       */
      highlightCurrentRoute() {
        if (!this.options.navHighlighting) return;
        
        const currentPath = window.location.pathname;
        
        this.navLinks.forEach(link => {
          const href = link.getAttribute('href');
          
          // If link href matches current path exactly
          if (href === currentPath) {
            link.classList.add('nav-active');
            
            // Also highlight parent if inside a dropdown
            const dropdown = link.closest('.nav-dropdown');
            if (dropdown) {
              const dropdownToggle = dropdown.querySelector('.nav-dropdown-toggle');
              if (dropdownToggle) {
                dropdownToggle.classList.add('nav-active');
              }
            }
          } 
          // If link is a parent path of current path
          else if (href !== '/' && currentPath.startsWith(href)) {
            link.classList.add('nav-parent-active');
          } 
          // Not active
          else {
            link.classList.remove('nav-active', 'nav-parent-active');
          }
        });
        
        // Update breadcrumbs
        this.updateBreadcrumbs();
      }
    
      /**
       * Update breadcrumbs based on current path
       */
      updateBreadcrumbs() {
        if (!this.breadcrumbContainer) return;
        
        const currentPath = window.location.pathname;
        
        // Skip for home page
        if (currentPath === '/') {
          this.breadcrumbContainer.innerHTML = '';
          return;
        }
        
        // Split path into segments
        const segments = currentPath.split('/').filter(segment => segment);
        
        // Build breadcrumb HTML
        let breadcrumbHtml = `
          <div class="flex items-center text-sm">
            <a href="/" class="text-blue-400 hover:text-blue-300">Home</a>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mx-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
        `;
        
        // Build path progressively
        let currentSegmentPath = '';
        
        segments.forEach((segment, index) => {
          currentSegmentPath += `/${segment}`;
          
          // Format segment for display (replace dashes with spaces, capitalize)
          const displayName = segment
            .replace(/-/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
          
          // If last segment, don't make it a link
          if (index === segments.length - 1) {
            breadcrumbHtml += `<span class="font-medium text-gray-200">${displayName}</span>`;
          } else {
            breadcrumbHtml += `
              <a href="${currentSegmentPath}" class="text-blue-400 hover:text-blue-300">${displayName}</a>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mx-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            `;
          }
        });
        
        breadcrumbHtml += '</div>';
        
        // Update breadcrumb container
        this.breadcrumbContainer.innerHTML = breadcrumbHtml;
      }
    
      /**
       * Get URL parameters as an object
       * @returns {Object} - URL parameters
       */
      getUrlParams() {
        const params = {};
        const searchParams = new URLSearchParams(window.location.search);
        
        for (const [key, value] of searchParams.entries()) {
          params[key] = value;
        }
        
        return params;
      }
    
      /**
       * Trigger a custom page event
       * @param {String} eventName - Event name
       * @param {Object} data - Event data
       */
      triggerPageEvent(eventName, data = {}) {
        const event = new CustomEvent(eventName, {
          detail: {
            ...data,
            timestamp: new Date().toISOString()
          },
          bubbles: true
        });
        
        document.dispatchEvent(event);
      }
    
      /**
       * Sleep utility for async functions
       * @param {Number} ms - Milliseconds to sleep
       * @returns {Promise} - Resolves after delay
       */
      sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
      }
    }
    
    // Initialize the navigation manager when the DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
      // Get configuration
      const configElement = document.getElementById('navigation-config');
      let config = {};
      
      if (configElement) {
        try {
          config = JSON.parse(configElement.textContent);
        } catch (e) {
          console.warn('Error parsing navigation config:', e);
        }
      }
      
      // Initialize navigation manager
      window.navigationManager = new NavigationManager(config);
      
      console.log('Navigation Manager initialized');
    });
    
    // Export for use in other modules
    if (typeof module !== 'undefined' && module.exports) {
      module.exports = NavigationManager;
    } else {
      // For browser environment
      window.NavigationManager = NavigationManager;
    }