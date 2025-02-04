document.addEventListener('DOMContentLoaded', () => {
    const translations = {
        welcome: {
            videoTagline: "Enough dreaming, let’s take a walk to show how we can get you up to space.",
            ctaMessage: "Are you ready to begin your space journey?",
            joinButton: "Join Now",
            proceedButton: "Proceed"
        },
        common: {
            footer: "© 2024 StelTrek Academy. All rights reserved."
        }
    };

    // Language Setup
    const savedLang = localStorage.getItem('preferredLanguage') || 'en';
    document.documentElement.lang = savedLang;
    applyTranslations(savedLang);

    // Event Listeners for Buttons
    document.getElementById('join-now').addEventListener('click', handleJoin);
    document.getElementById('proceed').addEventListener('click', handleProceed);

    // Handle Join Button
    function handleJoin() {
        const userSignedUp = localStorage.getItem('signedUp');
        if (userSignedUp) {
            alert('Welcome back! Redirecting to your dashboard...');
            window.location.href = '/dashboard.html';
        } else {
            alert('Redirecting to the sign-up page...');
            window.location.href = '/signup.html'; // or whatever your correct signup page path is
        }
    }

    // Handle Proceed Button
    function handleProceed() {
        alert('Welcome back! Proceeding to your dashboard...');
        window.location.href = '/dashboard.html';
    }

    // Apply Translations
    function applyTranslations(lang) {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.dataset.i18n;
            const keys = key.split('.');
            let translation = translations[lang];

            keys.forEach(k => {
                translation = translation ? translation[k] : null;
            });

            if (translation) {
                element.textContent = translation;
            }
        });
    }
});
