import translations from '/js/languages.js';

document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('preferredLanguage') || 'en';
    document.documentElement.lang = savedLang;
    applyTranslations(savedLang);

    document.querySelectorAll('.language-flag').forEach(flag => {
        flag.addEventListener('click', () => {
            const selectedLang = flag.dataset.lang || 'en';
            if (savedLang !== selectedLang) {
                localStorage.setItem('preferredLanguage', selectedLang);
                document.documentElement.lang = selectedLang;
                applyTranslations(selectedLang);
            }
        });
    });
});

function applyTranslations(lang) {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.dataset.i18n;
        const keys = key.split('.');
        let translation = translations[lang];

        keys.forEach(k => {
            translation = translation ? translation[k] : null;
        });

        if (translation) element.textContent = translation;
    });
}

