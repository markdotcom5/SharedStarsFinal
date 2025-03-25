/**
 * SharedStars Translation System
 * Simplified translation module that works with the LanguageManager
 */

// Additional translations to supplement the main LanguageManager
const translations = {
  en: {
    "welcome-physical": "Welcome to SharedStars Training Hub!",
    "login.submit": "Login",
    "login.forgot": "Forgot Password?",
    // more keys as needed
  },
  es: {
    "welcome-physical": "¡Bienvenido al Centro de Entrenamiento SharedStars!",
    "login.submit": "Iniciar sesión",
    "login.forgot": "¿Olvidaste tu contraseña?",
    // more keys...
  },
  zh: {
    "welcome-physical": "欢迎来到SharedStars训练中心！",
    "login.submit": "登录",
    "login.forgot": "忘记密码了吗？",
    // more keys...
  },
  ko: {
    "welcome-physical": "SharedStars 훈련 허브에 오신 것을 환영합니다!",
    "login.submit": "로그인",
    "login.forgot": "비밀번호를 잊으셨나요?",
    // more keys...
  }
};

// Function to translate page content
function translatePage(language) {
  // If LanguageManager exists, use it
  if (window.languageManager) {
    // Add these translations to the LanguageManager
    window.languageManager.mergeTranslations(translations);
    
    // Let the language manager handle the translations
    window.languageManager.setLanguage(language);
    return;
  }
  
  // Fallback for when LanguageManager is not available
  const elements = document.querySelectorAll('[data-i18n]');
  
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    
    if (translations[language] && translations[language][key]) {
      element.textContent = translations[language][key];
    } else if (translations.en[key]) {
      // Fallback to English
      element.textContent = translations.en[key];
      console.warn(`Missing translation for key: ${key} in ${language}, defaulted to English.`);
    }
  });
  
  // Set language attribute on HTML tag for accessibility
  document.documentElement.setAttribute('lang', language);
  
  // Store the language preference
  localStorage.setItem('userLanguage', language);
  document.cookie = `language=${language}; path=/; max-age=${365 * 24 * 60 * 60}`;
  
  // Dispatch an event for other components
  document.dispatchEvent(new CustomEvent('languageChanged', {
    detail: { language }
  }));
}

// Listen for language change events from dropdown
document.addEventListener('DOMContentLoaded', function() {
  // Set up event listener for language changed event
  document.addEventListener('languageChanged', function(event) {
    const language = event.detail.language;
    
    // If this came from another source (like dropdown), 
    // we need to make sure our translations are applied
    if (window.languageManager && window.languageManager.currentLang !== language) {
      // Sync with the language manager
      window.languageManager.setLanguage(language);
    }
  });
  
  // Initialize with saved language or browser language
  const savedLang = localStorage.getItem('userLanguage') || 
                   document.cookie.replace(/(?:(?:^|.*;\s*)language\s*\=\s*([^;]*).*$)|^.*$/, "$1") ||
                   (navigator.language || navigator.userLanguage).split('-')[0];
  
  // Validate language is supported
  const lang = translations[savedLang] ? savedLang : 'en';
  
  // Only translate if languageManager hasn't already done it
  if (!window.languageManager) {
    translatePage(lang);
  }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { translatePage, translations };
}