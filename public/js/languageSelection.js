// public/js/languageSelection.js

document.addEventListener('DOMContentLoaded', async () => {
    const langButtons = document.querySelectorAll('.lang-btn');
    const contentElements = document.querySelectorAll('[data-i18n]');
    const apiGeolocationUrl = 'https://ipapi.co/json/'; // You can change this if needed
  
    // Your translations for a few keys (extend as needed)
    const translations = {
      en: {
        heroTitle: "From Earth to Space in 36 Months",
        subtitle: "Like Tesla's FSD for Space Training: Intelligent, Adaptive, Revolutionary",
        joinNow: "Join Now",
        communityHub: "Explore Community Hub",
      },
      zh: {
        heroTitle: "36个月从地球到太空",
        subtitle: "像特斯拉FSD一样的太空训练：智能、适应性、革命性",
        joinNow: "立即加入",
        communityHub: "探索社区中心",
      },
      ko: {
        heroTitle: "지구에서 우주까지 36개월",
        subtitle: "테슬라 FSD와 같은 우주 훈련: 지능적, 적응적, 혁명적",
        joinNow: "지금 가입하세요",
        communityHub: "커뮤니티 허브 탐험하기",
      },
      es: {
        heroTitle: "De la Tierra al Espacio en 36 Meses",
        subtitle: "Como el FSD de Tesla para el entrenamiento espacial: Inteligente, Adaptativo, Revolucionario",
        joinNow: "Únete ahora",
        communityHub: "Explorar el Centro Comunitario",
      },
    };
  
    // Function to apply translations
    const applyTranslations = (lang) => {
      contentElements.forEach((el) => {
        const key = el.dataset.i18n;
        // If a translation exists for the key, update; otherwise leave as is.
        if (translations[lang] && translations[lang][key]) {
          el.textContent = translations[lang][key];
        }
      });
    };
  
    // Cookie helpers
    const getCookie = (name) => {
      const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
      return match ? match[2] : null;
    };
  
    const setCookie = (name, value, days) => {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      document.cookie = `${name}=${value}; path=/; expires=${date.toUTCString()}`;
    };
  
    // Detect language from IP
    const detectLanguageByIP = async () => {
      try {
        const response = await fetch(apiGeolocationUrl);
        const data = await response.json();
        const country = data.country_name;
        const languageMap = {
          'United States': 'en',
          'China': 'zh',
          'Korea': 'ko',
          'Spain': 'es',
        };
        return languageMap[country] || 'en';
      } catch (error) {
        console.error('Failed to fetch geolocation data:', error);
        return 'en';
      }
    };
  
    // Initialize language system
    const initLanguage = async () => {
      let selectedLang = getCookie('language');
      if (!selectedLang) {
        selectedLang = await detectLanguageByIP();
        setCookie('language', selectedLang, 30);
      }
      document.documentElement.lang = selectedLang;
      applyTranslations(selectedLang);
    };
  
    // Attach click handlers to flag buttons
    langButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const selectedLang = button.dataset.lang;
        setCookie('language', selectedLang, 30);
        document.documentElement.lang = selectedLang;
        applyTranslations(selectedLang);
      });
    });
  
    // Run language initialization
    initLanguage();
  });
  