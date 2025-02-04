// public/js/menu.js
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const menuOverlay = document.getElementById('menuOverlay');
    const closeMenu = document.getElementById('closeMenu');
  
    menuToggle.addEventListener('click', () => {
      menuOverlay.classList.toggle('translate-x-full');
    });
  
    closeMenu.addEventListener('click', () => {
      menuOverlay.classList.add('translate-x-full');
    });
  
    // Setup language button listeners (example)
    document.querySelectorAll('.language-option').forEach(button => {
      button.addEventListener('click', (e) => {
        const lang = e.currentTarget.getAttribute('data-lang');
        // Store language preference (e.g., in localStorage)
        localStorage.setItem('preferredLanguage', lang);
        // Optionally reload or update the page language dynamically
        console.log('Language changed to:', lang);
      });
    });
  });
  
document.addEventListener('DOMContentLoaded', () => {
    const translations = {
        en: {
            home: 'Home',
            why: 'Why StelTrek',
            about: 'About',
            leaderboard: 'Leaderboard',
            login: 'Login',
            retail: 'Retail Store',
            profile: 'Profile',
            signup: 'Sign Up',
            academy: 'StelTrek Academy',
            welcome: 'Welcome',
            subscribe: 'Subscribe'
        },
        // ... other translations
    };

    const menuItems = [
        { key: 'home', href: '/index.html' },
        { key: 'why', href: '/Why-StelTrek.html' },
        { key: 'about', href: '/about.html' },
        { key: 'leaderboard', href: '/leaderboard.html' },
        { key: 'login', href: '/login.html' },
        { key: 'retail', href: '/merchandise.html' },
        { key: 'profile', href: '/profile.html' },
        { key: 'signup', href: '/signup.html' },
        { key: 'academy', href: '/academy.html' },
        { key: 'welcome', href: '/welcome.html' },
        { key: 'subscribe', href: '/subscribe.html' }
    ];

    const menuContainer = document.getElementById('menu-container');
    const menuContent = menuContainer.querySelector('.menu-content');
    const menuButton = document.getElementById('menu-button');

    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.dataset.lang;
            document.cookie = `language=${lang};path=/`;
            document.getElementById('language-container').style.display = 'none';
            menuButton.style.display = 'block';
            initializeMenu(lang);
        });
    });

    const selectedLang = document.cookie.split(';').find(c => c.trim().startsWith('language='));
    const lang = selectedLang ? selectedLang.split('=')[1] : 'en';
    initializeMenu(lang);

    function initializeMenu(lang) {
        console.log('Initializing menu for language:', lang);

        // Clear existing menu items
        menuContent.innerHTML = '';

        // Populate menu with translated items
        menuItems.forEach(item => {
            const link = document.createElement('a');
            link.href = item.href;
            link.textContent = translations[lang][item.key];
            link.className = 'menu-item';
            menuContent.appendChild(link);
        });

        // Ensure event listeners are only added once
        if (!menuButton.dataset.listenersAdded) {
            menuButton.addEventListener('mouseenter', () => {
                menuContainer.style.display = 'flex';
            });
            menuContainer.addEventListener('mouseleave', () => {
                menuContainer.style.display = 'none';
            });
            menuButton.dataset.listenersAdded = true;
        }
    }
});
