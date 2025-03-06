document.addEventListener("DOMContentLoaded", async () => {
  const langDropdownBtn = document.getElementById("langDropdownBtn");
  const langDropdownMenu = document.getElementById("langDropdownMenu");
  const langItems = document.querySelectorAll(".dropdown-item");
  const selectedLangIcon = document.getElementById("selectedLangIcon");
  const selectedLangText = document.getElementById("selectedLangText");
  const contentElements = document.querySelectorAll("[data-i18n]");

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

  // Cookie Helpers
  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? match[2] : null;
  };

  const setCookie = (name, value, days) => {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value}; path=/; expires=${date.toUTCString()}`;
  };

  // Function to apply translations
  const applyTranslations = (lang) => {
    contentElements.forEach((el) => {
      const key = el.dataset.i18n;
      if (translations[lang] && translations[lang][key]) {
        el.textContent = translations[lang][key];
      }
    });
  };

  // Load saved language or default to English
  const initLanguage = () => {
    let selectedLang = getCookie("language") || "en";
    let selectedFlag = "🇺🇸";
    if (selectedLang === "zh") selectedFlag = "🇨🇳";
    if (selectedLang === "ko") selectedFlag = "🇰🇷";
    if (selectedLang === "es") selectedFlag = "🇪🇸";

    selectedLangIcon.textContent = selectedFlag;
    selectedLangText.textContent = selectedLang.toUpperCase();
    document.documentElement.lang = selectedLang;
    applyTranslations(selectedLang);
  };

  // Show/Hide dropdown menu
  langDropdownBtn.addEventListener("click", () => {
    langDropdownMenu.classList.toggle("hidden");
  });

  // Handle language change
  langItems.forEach((item) => {
    item.addEventListener("click", () => {
      const selectedLang = item.dataset.lang;
      const selectedFlag = item.dataset.flag;

      setCookie("language", selectedLang, 30);
      selectedLangIcon.textContent = selectedFlag;
      selectedLangText.textContent = selectedLang.toUpperCase();
      document.documentElement.lang = selectedLang;
      applyTranslations(selectedLang);

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

  // Initialize language
  initLanguage();
});