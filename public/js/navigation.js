// navigation.js - Handles language selection and menu behavior

document.addEventListener('DOMContentLoaded', () => {
    // Language configurations
    const languages = [
        { code: 'en', flag: '🇺🇸', name: 'English' },
        { code: 'zh', flag: '🇨🇳', name: 'Chinese' },
        { code: 'ko', flag: '🇰🇷', name: 'Korean' },
        { code: 'es', flag: '🇪🇸', name: 'Spanish' }
    ];

    // Menu items with translations
    const menuTranslations = {
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
        zh: {
            home: '主页',
            why: '为什么选择 StelTrek',
            about: '关于我们',
            leaderboard: '排行榜',
            login: '登录',
            retail: '零售店',
            profile: '个人资料',
            signup: '注册',
            academy: 'StelTrek 学院',
            welcome: '欢迎',
            subscribe: '订阅'
        },
        ko: {
            home: '홈',
            why: 'StelTrek을 선택하는 이유',
            about: '소개',
            leaderboard: '리더보드',
            login: '로그인',
            retail: '소매점',
            profile: '프로필',
            signup: '가입하기',
            academy: 'StelTrek 아카데미',
            welcome: '환영합니다',
            subscribe: '구독'
        },
        es: {
            home: 'Inicio',
            why: '¿Por qué StelTrek?',
            about: 'Acerca de',
            leaderboard: 'Tabla de Clasificación',
            login: 'Iniciar Sesión',
            retail: 'Tienda',
            profile: 'Perfil',
            signup: 'Registrarse',
            academy: 'Academia StelTrek',
            welcome: 'Bienvenido',
            subscribe: 'Suscribirse'
        }
    };

    // Menu items with their URLs
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

    // Create language selector if not already selected
    function createLanguageSelector() {
        const selectedLang = localStorage.getItem('selectedLanguage');
        if (!selectedLang) {
            const langContainer = document.createElement('div');
            langContainer.className = 'language-selector';

            languages.forEach(lang => {
                const button = document.createElement('button');
                button.className = 'language-flag';
                button.innerHTML = lang.flag;
                button.title = lang.name;
                
                button.addEventListener('click', () => {
                    selectLanguage(lang.code);
                });

                langContainer.appendChild(button);
            });

            document.body.appendChild(langContainer);
        }
        return !!selectedLang;
    }

    // Handle language selection
    function selectLanguage(langCode) {
        localStorage.setItem('selectedLanguage', langCode);
        document.querySelector('.language-selector').remove();
        createMenu();
    }

    // Create menu after language selection
    function createMenu() {
        const langCode = localStorage.getItem('selectedLanguage');
        if (!langCode) return;

        // Create menu button if it doesn't exist
        if (!document.querySelector('.menu-icon')) {
            const menuButton = document.createElement('button');
            menuButton.className = 'menu-icon';
            menuButton.innerHTML = '☰';
            document.body.appendChild(menuButton);

            const menuContainer = document.createElement('div');
            menuContainer.className = 'menu-container';
            
            const menuContent = document.createElement('nav');
            menuContent.className = 'menu-content';

            // Add menu items with correct translation
            menuItems.forEach(item => {
                const link = document.createElement('a');
                link.href = item.href;
                link.className = 'menu-item';
                link.textContent = menuTranslations[langCode][item.key];
                menuContent.appendChild(link);
            });

            menuContainer.appendChild(menuContent);
            document.body.appendChild(menuContainer);

            // Add hover events
            menuButton.addEventListener('mouseenter', () => {
                menuContainer.style.display = 'flex';
            });

            menuContainer.addEventListener('mouseleave', () => {
                menuContainer.style.display = 'none';
            });
        }
    }

    // Initialize navigation
    const hasLanguage = createLanguageSelector();
    if (hasLanguage) {
        createMenu();
    }
});