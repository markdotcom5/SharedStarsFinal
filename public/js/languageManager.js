// Cookie Helper Functions
const getCookie = (name) => {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? match[2] : null;
};

const setCookie = (name, value, days) => {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value}; path=/; expires=${date.toUTCString()}`;
};

// Fetch translations dynamically
const fetchTranslations = async () => {
    try {
        const response = await fetch('/js/translations.json');
        if (!response.ok) throw new Error("Failed to fetch translations");
        return await response.json();
    } catch (error) {
        console.error("⚠️ Failed to load translations:", error);
        return null; // Return null instead of an empty object
    }
};

// Detects user language based on IP (optional feature)
const detectUserLanguage = async () => {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const country = data.country_name;

        const languageMap = {
            'United States': 'en',
            'China': 'zh',
            'Korea': 'ko',
            'Spain': 'es',
        };

        return languageMap[country] || 'en'; // Default to English
    } catch (error) {
        console.error("⚠️ Geolocation failed:", error);
        return 'en';
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