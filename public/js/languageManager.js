document.addEventListener("DOMContentLoaded", async () => {
  const langDropdownBtn = document.getElementById("langDropdownBtn");
  const langDropdownMenu = document.getElementById("langDropdownMenu");
  const langItems = document.querySelectorAll(".dropdown-item");
  const selectedLangIcon = document.getElementById("selectedLangIcon");
  const contentElements = document.querySelectorAll("[data-i18n]");

  console.log("📌 Language Manager Initialized");

  // Get saved language and flag from localStorage (fallback to English)
  const savedLang = localStorage.getItem("preferredLanguage") || "en";
  const savedFlag = localStorage.getItem("preferredFlag") || "/images/USflag.png";

  // Function to update UI with selected language and flag
  const updateLanguageUI = (lang, flagSrc) => {
      selectedLangIcon.src = flagSrc; // Set the flag image
      document.documentElement.lang = lang;
  };

  const initLanguage = async () => {
      const translations = await fetchTranslations();
      if (!translations || !translations[savedLang]) {
          console.error(`⚠️ Translations for "${savedLang}" not found.`);
          return;
      }

      updateLanguageUI(savedLang, savedFlag);
      applyTranslations(savedLang, translations);
  };

  // Apply translations function
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

  // Handle language selection and save flag & language to localStorage
  langItems.forEach((item) => {
      item.addEventListener("click", async () => {
          const selectedLang = item.dataset.lang;
          const selectedFlag = item.getAttribute("data-flag");

          // Save in localStorage
          localStorage.setItem("preferredLanguage", selectedLang);
          localStorage.setItem("preferredFlag", selectedFlag);

          const translations = await fetchTranslations();
          if (!translations || !translations[selectedLang]) {
              console.error(`⚠️ Translations for "${selectedLang}" not found.`);
              return;
          }

          updateLanguageUI(selectedLang, selectedFlag);
          applyTranslations(selectedLang, translations);

          // Close dropdown
          langDropdownMenu.classList.add("hidden");
      });
  });

  // Toggle dropdown
  langDropdownBtn.addEventListener("click", () => {
      langDropdownMenu.classList.toggle("hidden");
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", (event) => {
      if (!langDropdownBtn.contains(event.target) && !langDropdownMenu.contains(event.target)) {
          langDropdownMenu.classList.add("hidden");
      }
  });

  // Initialize language settings
  await initLanguage();
});

const fetchTranslations = async () => {
  try {
      const response = await fetch("/js/translations.json"); // Adjust path if needed
      if (!response.ok) throw new Error("Failed to fetch translations");
      return await response.json();
  } catch (error) {
      console.error("⚠️ Failed to load translations:", error);
      return {}; // Return empty object to prevent crashes
  }
};