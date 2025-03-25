/**
 * SharedStars Language Manager
 * Enhanced version with better integration for the Sophon UI
 */

class LanguageManager {
  constructor() {
    // FIRST, initialize translations completely
    this.translations = {
      en: { /* Your English translations here */ },
      es: { /* Your Spanish translations here */ },
      ko: { /* Your Korean translations here */ },
      zh: { /* Your Chinese translations here */ }
    };

    // THEN, set your current language after translations are initialized
    this.currentLang = this.getPreferredLanguage();

    // Last, call initialization functions
    this.langButtons = document.querySelectorAll('.lang-btn, .language-option');
    this.initialize();
  }

  getPreferredLanguage() {
    const cookieLang = this.getCookie('language');
    const storageLang = localStorage.getItem('userLanguage');
    const browserLang = (navigator.language || '').split('-')[0];

    let lang = cookieLang || storageLang || browserLang || 'en';

    if (!this.translations[lang]) {
      console.warn(`Language "${lang}" is not supported. Defaulting to English.`);
      lang = 'en';
    }

    return lang;
  }

  // Your other methods here...
}
  /**
   * Initialize the language manager
   */
  initialize() {
    this.setupEventListeners();
    this.setLanguage(this.currentLang);
    
    // Handle the new dropdown selector if it exists
    this.setupLanguageDropdown();
    
    // Optional: load additional translations from server
    // Uncomment this if you want to load translations from your Express backend
    // this.fetchTranslationsFromServer(this.currentLang);
  }
  
  /**
   * Set up the new dropdown language selector
   */
  setupLanguageDropdown() {
    // Find language dropdown elements
    const dropdownBtn = document.getElementById('language-dropdown-btn');
    const dropdown = document.getElementById('language-dropdown');
    const languageOptions = document.querySelectorAll('.language-option');
    
    // If we have the new dropdown structure
    if (dropdownBtn && dropdown) {
      // Initialize the selected language in the dropdown
      this.updateDropdownUI(this.currentLang);
      
      // Add event listeners for language options
      languageOptions.forEach(option => {
        option.addEventListener('click', () => {
          const lang = option.getAttribute('data-lang');
          this.setLanguage(lang);
          
          // Close the dropdown
          dropdown.classList.add('hidden');
        });
      });
    }
  }
  
  /**
   * Update the dropdown UI to show the current language
   * @param {string} lang - Language code
   */
  updateDropdownUI(lang) {
    const selectedLangText = document.getElementById('selected-language-text');
    const selectedLangFlag = document.getElementById('selected-language-flag');
    
    if (selectedLangText) {
      selectedLangText.textContent = this.languageNames[lang] || this.languageNames['en'];
    }
    
    if (selectedLangFlag) {
      selectedLangFlag.innerHTML = this.languageFlags[lang] || this.languageFlags['en'];
    }
  }
  
  /**
   * Set up event listeners for language buttons
   */
  setupEventListeners() {
    if (this.langButtons.length) {
      this.langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const lang = btn.getAttribute('data-lang');
          this.setLanguage(lang);
        });
      });
    }
  }
  
  /**
   * Get a cookie by name
   * @param {string} name - Cookie name to retrieve
   * @returns {string|null} Cookie value or null if not found
   */
  getCookie(name) {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? match[2] : null;
  }
  
  /**
   * Set a cookie
   * @param {string} name - Cookie name
   * @param {string} value - Cookie value
   * @param {number} days - Cookie expiration in days
   */
  setCookie(name, value, days = 365) {
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value}; path=/; max-age=${maxAge}`;
  }
  
  /**
   * Apply translations to all elements with data-i18n attribute
   * @param {string} lang - Language code (en, es, ko, zh)
   */
  applyTranslations(lang) {
    // Get all elements with data-i18n attribute (refreshes to include dynamically added elements)
    const contentElements = document.querySelectorAll('[data-i18n]');
    
    contentElements.forEach((el) => {
      const key = el.dataset.i18n;
      
      if (this.translations[lang] && this.translations[lang][key]) {
        el.textContent = this.translations[lang][key];
      } else if (this.translations.en[key]) {
        // Fallback to English
        el.textContent = this.translations.en[key];
        console.warn(`Missing translation for key: ${key} in ${lang}, defaulted to English.`);
      } else {
        console.error(`Translation completely missing for key: ${key}`);
      }
      
      // For input elements, also set placeholder if it has data-i18n-placeholder
      if (el.hasAttribute('data-i18n-placeholder')) {
        const placeholderKey = el.getAttribute('data-i18n-placeholder');
        if (this.translations[lang] && this.translations[lang][placeholderKey]) {
          el.placeholder = this.translations[lang][placeholderKey];
        }
      }
    });
  }
  
  /**
   * Set the active language and apply translations
   * @param {string} lang - Language code (en, es, ko, zh)
   */
  setLanguage(lang) {
    // Validate language is supported
    if (!this.translations[lang]) {
      console.error(`Language ${lang} is not supported. Defaulting to English.`);
      lang = 'en';
    }
    
    // Update document language attribute
    document.documentElement.lang = lang;
    
    // Apply translations
    this.applyTranslations(lang);
    
    // Update any dropdown UI elements
    this.updateDropdownUI(lang);
    
    // Store language preference in cookie and localStorage
    this.setCookie('language', lang);
    localStorage.setItem('userLanguage', lang);
    
    // Update current language
    this.currentLang = lang;
    
    // Trigger custom event for other components
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
  }
  
  /**
   * Get translation for a specific key
   * @param {string} key - Translation key
   * @param {string} lang - Optional language code (defaults to current language)
   * @returns {string} Translated text or key if translation not found
   */
  getTranslation(key, lang = this.currentLang) {
    if (this.translations[lang] && this.translations[lang][key]) {
      return this.translations[lang][key];
    } else if (this.translations.en[key]) {
      return this.translations.en[key];
    }
    return key;
  }
  
  /**
   * Apply translations to a specific element and its children
   * Useful for dynamically created elements like popups
   * @param {HTMLElement} element - The root element to translate
   * @param {string} lang - Optional language code (defaults to current language)
   */
  translateElement(element, lang = this.currentLang) {
    // Translate the element itself if it has data-i18n
    if (element.hasAttribute && element.hasAttribute('data-i18n')) {
      const key = element.dataset.i18n;
      if (this.translations[lang] && this.translations[lang][key]) {
        element.textContent = this.translations[lang][key];
      } else if (this.translations.en[key]) {
        element.textContent = this.translations.en[key];
      }
      
      // Handle placeholder if present
      if (element.hasAttribute('data-i18n-placeholder')) {
        const placeholderKey = element.getAttribute('data-i18n-placeholder');
        if (this.translations[lang] && this.translations[lang][placeholderKey]) {
          element.placeholder = this.translations[lang][placeholderKey];
        }
      }
    }
    
    // Translate children with data-i18n
    const childElements = element.querySelectorAll('[data-i18n]');
    childElements.forEach(el => {
      const key = el.dataset.i18n;
      if (this.translations[lang] && this.translations[lang][key]) {
        el.textContent = this.translations[lang][key];
      } else if (this.translations.en[key]) {
        el.textContent = this.translations.en[key];
      }
      
      // Handle placeholder if present
      if (el.hasAttribute('data-i18n-placeholder')) {
        const placeholderKey = el.getAttribute('data-i18n-placeholder');
        if (this.translations[lang] && this.translations[lang][placeholderKey]) {
          el.placeholder = this.translations[lang][placeholderKey];
        }
      }
    });
    
    return element;
  }
  
  /**
   * Add a new translation
   * @param {string} lang - Language code
   * @param {string} key - Translation key
   * @param {string} value - Translated text
   */
  addTranslation(lang, key, value) {
    if (!this.translations[lang]) {
      this.translations[lang] = {};
    }
    
    this.translations[lang][key] = value;
    
    // Re-apply translations if adding to current language
    if (lang === this.currentLang) {
      this.applyTranslations(lang);
    }
  }
  
  /**
   * Add multiple translations at once
   * @param {string} lang - Language code
   * @param {Object} translations - Object with key-value pairs of translations
   */
  addTranslations(lang, translations) {
    if (!this.translations[lang]) {
      this.translations[lang] = {};
    }
    
    Object.assign(this.translations[lang], translations);
    
    // Re-apply translations if adding to current language
    if (lang === this.currentLang) {
      this.applyTranslations(lang);
    }
  }
  
  /**
   * Merge external translations with the current ones
   * @param {Object} externalTranslations - Object containing translations by language
   */
  mergeTranslations(externalTranslations) {
    // Loop through each language in the external translations
    for (const lang in externalTranslations) {
      if (externalTranslations.hasOwnProperty(lang)) {
        // Create language object if it doesn't exist
        if (!this.translations[lang]) {
          this.translations[lang] = {};
        }
        
        // Add all translations for this language
        Object.assign(this.translations[lang], externalTranslations[lang]);
      }
    }
    
    // Re-apply translations for current language
    this.applyTranslations(this.currentLang);
  }
}

// Initialize language manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Create global instance
  window.languageManager = new LanguageManager();
  
  // For backwards compatibility
  // This allows the old code to continue working
  window.applyTranslations = (lang) => {
    window.languageManager.setLanguage(lang);
  };
  
  // Set up MutationObserver to detect dynamically added content (like popups)
  const observer = new MutationObserver((mutations) => {
    let needsTranslationUpdate = false;
    
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        // Check if any added nodes have data-i18n attributes
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            if (node.querySelector('[data-i18n]') || node.hasAttribute('data-i18n')) {
              needsTranslationUpdate = true;
            }
          }
        });
      }
    });
    
    // Apply translations if needed
    if (needsTranslationUpdate) {
      window.languageManager.applyTranslations(window.languageManager.currentLang);
    }
  });
  
  // Start observing the document body for changes
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
});