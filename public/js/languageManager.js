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
};

document.addEventListener("DOMContentLoaded", async () => {
    const langDropdownBtn = document.getElementById("langDropdownBtn");
    const langDropdownMenu = document.getElementById("langDropdownMenu");
    const langItems = document.querySelectorAll(".dropdown-item");
    const selectedLangIcon = document.getElementById("selectedLangIcon");
    const contentElements = document.querySelectorAll("[data-i18n]");

    console.log("📌 Language Manager Initialized");

    const flagMap = {
        en: "/images/USflag.png",
        zh: "/images/ChinaFlag.png",
        ko: "/images/KoreaFlag.png",
        es: "/images/ChinaFlag.png"
    };

    // Get saved language or default to English
    const savedLang = getCookie("preferredLanguage") || "en";

    const updateLanguageUI = (lang) => {
        selectedLangIcon.src = flagMap[lang] || flagMap["en"]; // Set flag based on lang
        document.documentElement.lang = lang;
    };

    const initLanguage = async () => {
        const translations = await fetchTranslations();

        if (!translations || !translations[savedLang]) {
            console.error(`⚠️ Translations for "${savedLang}" not found.`);
            return;
        }
        detectUserLanguage();
        updateLanguageUI(savedLang);
        applyTranslations(savedLang, translations);
    };

    // Function to apply translations
    const applyTranslations = (lang, translations) => {
        contentElements.forEach((el) => {
            const key = el.dataset.i18n;
            const keys = key.split(".");
            let translation = translations[lang];

            keys.forEach(k => {
                translation = translation ? translation[k] : null;
            });

            if (translation) el.textContent = translation;
        });
    };

    document.querySelectorAll(".dropdown-item").forEach(item => {
        item.addEventListener("click", function () {
          const flagSrc = this.getAttribute("data-flag");
          selectedLangIcon.src = flagSrc;
          langDropdownMenu.classList.add("hidden"); // Close the dropdown
        });
      });

    // Show/Hide dropdown menu
    langDropdownBtn.addEventListener("click", () => {
        langDropdownMenu.classList.toggle("hidden");
    });

    // Handle language change
    langItems.forEach((item) => {
        item.addEventListener("click", async () => {
            const selectedLang = item.dataset.lang;
            setCookie("preferredLanguage", selectedLang, 30);

            const translations = await fetchTranslations();
            if (!translations || !translations[selectedLang]) {
                console.error(`⚠️ Translations for "${selectedLang}" not found.`);
                return;
            }

            updateLanguageUI(selectedLang);
            applyTranslations(selectedLang, translations);

            // Close dropdown
            langDropdownMenu.classList.add("hidden");
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (event) => {
        if (!langDropdownBtn.contains(event.target) && !langDropdownMenu.contains(event.target)) {
            langDropdownMenu.classList.add("hidden");
        }
    });

    // Initialize
    await initLanguage();
});