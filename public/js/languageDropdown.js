/**
 * Enhanced Language Dropdown Handler
 * Controls the language dropdown in the header with improved visuals and functionality
 * Integrates with the LanguageManager class for seamless translation
 */

document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const dropdownBtn = document.getElementById('language-dropdown-btn');
  const dropdown = document.getElementById('language-dropdown');
  const selectedLangText = document.getElementById('selected-language-text');
  const selectedLangFlag = document.getElementById('selected-language-flag');
  const languageOptions = document.querySelectorAll('.language-option');
  
  // Language definitions with SVG flags and names
  const languages = {
    'en': {
      name: 'English',
      flagSvg: `<svg class="w-full h-full" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
        <g fill-rule="evenodd">
          <g stroke-width="1pt">
            <path fill="#bd3d44" d="M0 0h912v37H0zm0 73.9h912v37H0zm0 73.8h912v37H0zm0 73.8h912v37H0zm0 74h912v36.8H0zm0 73.7h912v37H0z" transform="scale(.9375)"/>
            <path fill="#fff" d="M0 37h912v36.9H0zm0 73.8h912v36.9H0zm0 73.8h912v37H0zm0 73.9h912v36.9H0zm0 73.8h912v37H0z" transform="scale(.9375)"/>
          </g>
          <path fill="#192f5d" d="M0 0h364.8v258.5H0z" transform="scale(.9375)"/>
          <path fill="#fff" d="M30.4 11l3.4 10.3h10.6l-8.6 6.3 3.3 10.3-8.7-6.4-8.6 6.3L25 27.6l-8.7-6.3h10.9z" transform="scale(.9375)"/>
        </g>
      </svg>`,
      emoji: '🇺🇸 EN'
    },
    'es': {
      name: 'Español',
      flagSvg: `<svg class="w-full h-full" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
        <path fill="#c60b1e" d="M0 0h640v480H0z"/>
        <path fill="#ffc400" d="M0 120h640v240H0z"/>
      </svg>`,
      emoji: '🇪🇸 ES'
    },
    'ko': {
      name: '한국어',
      flagSvg: `<svg class="w-full h-full" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="a">
            <path fill-opacity=".7" d="M-95.8-.4h682.7v512H-95.8z"/>
          </clipPath>
        </defs>
        <g fill-rule="evenodd" clip-path="url(#a)" transform="translate(89.8 .4) scale(.9375)">
          <path fill="#fff" d="M-95.8-.4H587v512H-95.8z"/>
          <g transform="rotate(-56.3 361.5 -95.8) scale(10.66667)">
            <g id="c">
              <path id="b" d="M-6-26H6v2H-6zm0 3H6v2H-6zm0 3H6v2H-6z"/>
              <use width="100%" height="100%" x="0" y="44" href="#b"/>
            </g>
            <path stroke="#fff" d="M0 17v10"/>
            <path fill="#cd2e3a" d="M0-12a12 12 0 0 1 0 24z"/>
            <path fill="#0047a0" d="M0-12a12 12 0 0 0 0 24A6 6 0 0 0 0 0z"/>
            <circle cy="-6" r="6" fill="#cd2e3a"/>
          </g>
        </g>
      </svg>`,
      emoji: '🇰🇷 KO'
    },
    'zh': {
      name: '中文',
      flagSvg: `<svg class="w-full h-full" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <path id="a" fill="#ffde00" d="M-.6.8L0-1 .6.8-1-.3h2z"/>
        </defs>
        <path fill="#de2910" d="M0 0h640v480H0z"/>
        <use width="30" height="20" transform="matrix(71.9991 0 0 72 120 120)" href="#a"/>
        <use width="30" height="20" transform="matrix(-12.33562 -20.5871 20.58684 -12.33577 240.3 48)" href="#a"/>
        <use width="30" height="20" transform="matrix(-3.38573 -23.75998 23.75968 -3.38578 288 95.8)" href="#a"/>
        <use width="30" height="20" transform="matrix(6.5991 -23.0749 23.0746 6.59919 288 168)" href="#a"/>
        <use width="30" height="20" transform="matrix(14.9991 -18.73557 18.73533 14.99929 240 216)" href="#a"/>
      </svg>`,
      emoji: '🇨🇳 ZH'
    }
  };
  
  // Toggle dropdown with animation
  if (dropdownBtn && dropdown) {
    dropdownBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      dropdown.classList.toggle('hidden');
      
      // Optional animation
      if (!dropdown.classList.contains('hidden')) {
        dropdown.style.opacity = '0';
        dropdown.style.transform = 'translateY(-10px)';
        setTimeout(() => {
          dropdown.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
          dropdown.style.opacity = '1';
          dropdown.style.transform = 'translateY(0)';
        }, 10);
      }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!dropdownBtn.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.add('hidden');
      }
    });
    
    // Close dropdown on ESC key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        dropdown.classList.add('hidden');
      }
    });
  }
  
  /**
   * Helper functions for managing language
   */
  
  // Get language from cookies
  function getLanguageFromCookie() {
    const match = document.cookie.match(new RegExp('(^| )language=([^;]+)'));
    return match ? match[2] : null;
  }
  
  // Get language from localStorage
  function getLanguageFromStorage() {
    return localStorage.getItem('userLanguage');
  }
  
  // Get browser language
  function getBrowserLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    return browserLang.split('-')[0]; // Get main language code
  }
  
  // Save language preference
  function saveLanguagePreference(lang) {
    // Save to both cookie and localStorage for maximum compatibility
    document.cookie = `language=${lang}; path=/; max-age=31536000`; // 1 year
    localStorage.setItem('userLanguage', lang);
  }
  
  // Set language in UI and trigger translation
  function setLanguage(langCode) {
    // Default to English if language not supported
    if (!languages[langCode]) {
      langCode = 'en';
    }
    
    // Update selected language display
    if (selectedLangText) {
      selectedLangText.textContent = languages[langCode].name;
    }
    
    // Update flag
    if (selectedLangFlag) {
      selectedLangFlag.innerHTML = languages[langCode].flagSvg;
    }
    
    // If LanguageManager exists, use it (primary method)
    if (window.languageManager) {
      window.languageManager.setLanguage(langCode);
    } else {
      // Fallback translation methods
      
      // Update document language attribute for accessibility
      document.documentElement.setAttribute('lang', langCode);
      
      // Save preference
      saveLanguagePreference(langCode);
      
      // Trigger translation event for any other components
      const event = new CustomEvent('languageChanged', {
        detail: { language: langCode }
      });
      document.dispatchEvent(event);
      
      // If standalone translation function exists, call it
      if (typeof translatePage === 'function') {
        translatePage(langCode);
      } else {
        console.warn('No translation mechanism available. Please include languageManager.js or implement translatePage()');
      }
    }
    
    // Update the select dropdown if it exists (for the simplified version)
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
      languageSelect.value = langCode;
    }
    
    // Close dropdown
    if (dropdown) {
      dropdown.classList.add('hidden');
    }
    
    // Log for debugging
    console.log(`🌐 Language set to ${langCode} (${languages[langCode].name})`);
  }
  
  // Set up language option buttons
  if (languageOptions && languageOptions.length > 0) {
    languageOptions.forEach(option => {
      option.addEventListener('click', function() {
        const lang = this.getAttribute('data-lang');
        setLanguage(lang);
      });
    });
  }
  
  // Initialize language based on preferences or browser language
  function initializeLanguage() {
    // Priority: 1. Cookie 2. LocalStorage 3. Browser Language 4. Default (English)
    const cookieLang = getLanguageFromCookie();
    const storageLang = getLanguageFromStorage();
    const browserLang = getBrowserLanguage();
    
    // Debug info
    console.log('🔍 Language detection:');
    console.log(`- Cookie: ${cookieLang || 'not set'}`);
    console.log(`- LocalStorage: ${storageLang || 'not set'}`);
    console.log(`- Browser: ${browserLang || 'not detected'}`);
    
    let preferredLang = cookieLang || storageLang || browserLang;
    
    // Only use if we support this language
    if (!languages[preferredLang]) {
      console.log(`⚠️ Language "${preferredLang}" not supported, defaulting to English`);
      preferredLang = 'en';
    }
    
    setLanguage(preferredLang);
  }
  
  // Handle simple dropdown select (for the select element version)
  const languageSelect = document.getElementById('language-select');
  if (languageSelect) {
    languageSelect.addEventListener('change', function() {
      setLanguage(this.value);
    });
  }
  
  // Initialize once DOM is loaded
  initializeLanguage();
  
  // Create event to notify other scripts that language dropdown is ready
  document.dispatchEvent(new CustomEvent('languageDropdownReady'));
  
  // Export functions to window for potential use by other scripts
  window.languageDropdown = {
    setLanguage,
    getLanguageFromCookie,
    getLanguageFromStorage,
    getBrowserLanguage,
    languages
  };
});