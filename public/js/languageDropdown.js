/**
 * Language Dropdown Handler
 * Controls the language dropdown in the header
 */

document.addEventListener('DOMContentLoaded', function() {
  // Toggle dropdown
  const dropdownBtn = document.getElementById('language-dropdown-btn');
  const dropdown = document.getElementById('language-dropdown');
  
  if (dropdownBtn && dropdown) {
    dropdownBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      dropdown.classList.toggle('hidden');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!dropdownBtn.contains(e.target)) {
        dropdown.classList.add('hidden');
      }
    });
  }
  
  // Update current language display
  const currentLangSpan = document.getElementById('current-language');
  const langEmojis = {
    'en': '🇺🇸 EN',
    'es': '🇪🇸 ES',
    'ko': '🇰🇷 KO',
    'zh': '🇨🇳 ZH'
  };
  
  if (currentLangSpan) {
    // Update language indicator on change
    document.addEventListener('languageChanged', function(e) {
      const lang = e.detail.language;
      currentLangSpan.textContent = langEmojis[lang] || langEmojis['en'];
      if (dropdown) dropdown.classList.add('hidden');
    });
    
    // Set initial language indicator based on cookie
    const getCookie = (name) => {
      const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
      return match ? match[2] : null;
    };
    
    const currentLang = getCookie('language') || 'en';
    currentLangSpan.textContent = langEmojis[currentLang] || langEmojis['en'];
  }
});