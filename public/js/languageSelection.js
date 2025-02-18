// public/js/languageSelection.js
document.addEventListener('DOMContentLoaded', async () => {
    // Select all language buttons and translatable elements
    const langButtons = document.querySelectorAll('.lang-btn');
    const contentElements = document.querySelectorAll('[data-i18n]');
    const apiGeolocationUrl = 'https://ipapi.co/json/';

    // Translations object (extend as needed)
    const translations = {
        en: {
            nav: {
                home: 'Home',
                about: 'About',
                academy: 'Academy',
                profile: 'Profile',
                subscribe: 'Subscribe',
                leaderboard: 'Leaderboard',
                getStarted: 'Get Started',
            },
            hero: {
                beginTraining: 'Start Training Now',
                yourCountdown: 'See Your Countdown to Space',
                membershipPlans: 'Explore Membership Plans',
                welcomeBack: 'Welcome Back',
                subtitle:
                    'In 36 months, humanity splits into two groups: Those who have prepared for space and those who watch from Earth.',
                continueTraining: 'Continue your training where you left off',
                exploreButton: 'EXPLORE TRAINING PATHS',
                resumeButton: 'RESUME TRAINING',
                teslaTagline:
                    "Like Tesla's FSD for Space Training: Intelligent, Adaptive, Revolutionary",
            },
            banner: {
                title: '36 MONTHS TO SPACE:',
                subtitle: 'Complete Training & Get Approved for Space Flight',
            },
            countdown: {},
            // Additional top-level keys for simpler translations if needed
            heroTitle: "World's Largest AI- Powered Space Training Program",
            subtitle: "Like Tesla's FSD for Space Training: Intelligent, Adaptive, Revolutionary",
            joinNow: 'Join Now',
            communityHub: 'Explore Community Hub',
        },
        zh: {
            nav: {
                home: '首页',
                about: '关于我们',
                academy: 'SharedStars学院',
                profile: '个人资料',
                subscribe: '订阅',
            },
            hero: {
                beginTraining: '开始训练',
                welcomeBack: '欢迎回来',
                subtitle: 'AI加速太空训练计划',
                continueTraining: '从您上次离开的地方继续训练',
                exploreButton: '探索训练路径',
                resumeButton: '继续训练',
                teslaTagline: '像特斯拉FSD一样的太空训练：智能、适应性、革命性',
            },
            banner: {
                title: '36个月到太空：',
                subtitle: '完成训练并获得太空飞行批准',
            },
            heroTitle: '36个月从地球到太空',
            subtitle: '像特斯拉FSD一样的太空训练：智能、适应性、革命性',
            joinNow: '立即加入',
            communityHub: '探索社区中心',
        },
        ko: {
            nav: {
                home: '홈',
                about: '소개',
                academy: 'SharedStars 아카데미',
                profile: '프로필',
                subscribe: '구독',
            },
            hero: {
                beginTraining: '훈련 시작',
                welcomeBack: '다시 오신 것을 환영합니다',
                subtitle: 'AI 가속 우주 훈련 프로그램',
                continueTraining: '마지막으로 종료한 부분부터 훈련 계속하기',
                exploreButton: '훈련 경로 탐색',
                resumeButton: '훈련 재개',
                teslaTagline: '테슬라 FSD와 같은 우주 훈련: 지능적, 적응적, 혁명적',
            },
            banner: {
                title: '우주까지 36개월:',
                subtitle: '훈련을 완료하고 우주 비행 승인 받기',
            },
            heroTitle: '지구에서 우주까지 36개월',
            subtitle: '테슬라 FSD와 같은 우주 훈련: 지능적, 적응적, 혁명적',
            joinNow: '지금 가입하세요',
            communityHub: '커뮤니티 허브 탐험하기',
        },
        es: {
            nav: {
                home: 'Inicio',
                about: 'Acerca de',
                academy: 'Academia SharedStars',
                profile: 'Perfil',
                subscribe: 'Suscribirse',
            },
            hero: {
                beginTraining: 'Comenzar Entrenamiento',
                welcomeBack: 'Bienvenido de nuevo',
                subtitle: 'Programa de entrenamiento espacial acelerado por IA',
                continueTraining: 'Continúa tu entrenamiento donde lo dejaste',
                exploreButton: 'EXPLORAR RUTAS DE ENTRENAMIENTO',
                resumeButton: 'REANUDAR ENTRENAMIENTO',
                teslaTagline:
                    'Como el FSD de Tesla para el entrenamiento espacial: Inteligente, Adaptativo, Revolucionario',
            },
            banner: {
                title: '36 MESES AL ESPACIO:',
                subtitle: 'Completa el entrenamiento y obtén la aprobación para el vuelo espacial',
            },
            heroTitle: 'De la Tierra al Espacio en 36 Meses',
            subtitle:
                'Como el FSD de Tesla para el entrenamiento espacial: Inteligente, Adaptativo, Revolucionario',
            joinNow: 'Únete ahora',
            communityHub: 'Explorar el Centro Comunitario',
        },
    };

    // Helper functions for cookie management
    const getCookie = (name) => {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? match[2] : null;
    };

    const setCookie = (name, value, days) => {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        document.cookie = `${name}=${value}; path=/; expires=${date.toUTCString()}`;
    };

    // Retrieve a nested translation given a key like "nav.home"
    const getTranslation = (lang, key) => {
        const keys = key.split('.');
        let value = translations[lang];
        for (const k of keys) {
            if (value && value[k]) {
                value = value[k];
            } else {
                value = null;
                break;
            }
        }
        return value || '';
    };

    // Apply translations to all elements with the data-i18n attribute
    const applyTranslations = (lang) => {
        contentElements.forEach((el) => {
            const key = el.getAttribute('data-i18n');
            if (key) {
                const translation = getTranslation(lang, key);
                el.textContent = translation;
            }
        });
    };

    // Detect the user language by IP if no language cookie exists
    const detectLanguageByIP = async () => {
        try {
            const response = await fetch(apiGeolocationUrl);
            const data = await response.json();
            const country = data.country_name;
            const languageMap = {
                'United States': 'en',
                China: 'zh',
                Korea: 'ko',
                Spain: 'es',
            };
            return languageMap[country] || 'en';
        } catch (error) {
            console.error('Failed to fetch geolocation data:', error);
            return 'en';
        }
    };

    // Initialize the language system
    const initLanguage = async () => {
        let selectedLang = getCookie('language');
        if (!selectedLang) {
            selectedLang = await detectLanguageByIP();
            setCookie('language', selectedLang, 30);
        }
        document.documentElement.lang = selectedLang;
        applyTranslations(selectedLang);
    };

    // Attach click event listeners for language buttons (ensure they have the "lang-btn" class)
    langButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const selectedLang = button.getAttribute('data-lang');
            if (selectedLang) {
                setCookie('language', selectedLang, 30);
                document.documentElement.lang = selectedLang;
                applyTranslations(selectedLang);
                // Optionally, reload the page if you need to re-render server-side content:
                // window.location.reload();
            }
        });
    });

    // Run language initialization on page load
    initLanguage();
});
