const translations = {
    en: {
        nav: {
            home: "Home",
            about: "About",
            academy: "SharedStars Academy",
            profile: "Profile",
            subscribe: "SUBSCRIBE"
        },
        hero: {
            beginTraining: "Begin Your Training",
            welcomeBack: "Welcome Back",
            subtitle: "AI-accelerated space training program",
            continueTraining: "Continue your training where you left off",
            exploreButton: "EXPLORE TRAINING PATHS",
            resumeButton: "RESUME TRAINING",
            teslaTagline: "Like Tesla's FSD for Space Training: Intelligent, Adaptive, Revolutionary"
        },
        banner: {
            title: "36 MONTHS TO SPACE:",
            subtitle: "Complete Training & Get Approved for Space Flight"
        }
    },
    zh: {
        nav: {
            home: "首页",
            about: "关于我们",
            academy: "SharedStars学院",
            profile: "个人资料",
            subscribe: "订阅"
        },
        hero: {
            beginTraining: "开始训练",
            welcomeBack: "欢迎回来",
            subtitle: "AI加速太空训练计划",
            continueTraining: "从您上次离开的地方继续训练",
            exploreButton: "探索训练路径",
            resumeButton: "继续训练",
            teslaTagline: "像特斯拉FSD一样的太空训练：智能、适应性、革命性"
        },
        banner: {
            title: "36个月到太空：",
            subtitle: "完成训练并获得太空飞行批准"
        }
    },
    ko: {
        nav: {
            home: "홈",
            about: "소개",
            academy: "SharedStars 아카데미",
            profile: "프로필",
            subscribe: "구독"
        },
        hero: {
            beginTraining: "훈련 시작",
            welcomeBack: "다시 오신 것을 환영합니다",
            subtitle: "AI 가속 우주 훈련 프로그램",
            continueTraining: "마지막으로 종료한 부분부터 훈련 계속하기",
            exploreButton: "훈련 경로 탐색",
            resumeButton: "훈련 재개",
            teslaTagline: "테슬라 FSD와 같은 우주 훈련: 지능적, 적응적, 혁명적"
        },
        banner: {
            title: "우주까지 36개월:",
            subtitle: "훈련을 완료하고 우주 비행 승인 받기"
        }
    },
    es: {
        nav: {
            home: "Inicio",
            about: "Acerca de",
            academy: "Academia SharedStars",
            profile: "Perfil",
            subscribe: "Suscribirse"
        },
        hero: {
            beginTraining: "Comenzar Entrenamiento",
            welcomeBack: "Bienvenido de nuevo",
            subtitle: "Programa de entrenamiento espacial acelerado por IA",
            continueTraining: "Continúa tu entrenamiento donde lo dejaste",
            exploreButton: "EXPLORAR RUTAS DE ENTRENAMIENTO",
            resumeButton: "REANUDAR ENTRENAMIENTO",
            teslaTagline: "Como el FSD de Tesla para el entrenamiento espacial: Inteligente, Adaptativo, Revolucionario"
        },
        banner: {
            title: "36 MESES AL ESPACIO:",
            subtitle: "Completa el entrenamiento y obtén la aprobación para el vuelo espacial"
        }
    }
};

/**
 * Retrieve translation by key
 */
function getTranslation(lang, key) {
    const keys = key.split('.');
    let value = translations[lang];

    keys.forEach(k => {
        value = value ? value[k] : null;
    });

    return value || translations.en[key]; // Fallback to English
}

/**
 * Apply translations dynamically
 */
function applyTranslations(lang) {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.dataset.i18n;
        const translation = getTranslation(lang, key);
        if (translation) {
            element.textContent = translation;
        }
    });
}

/**
 * Detect user language from browser or IP
 */
async function detectUserLanguage() {
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
}

/**
 * Initialize the language system
 */
document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".lang-btn").forEach(button => {
        button.addEventListener("click", function () {
            const selectedLang = this.getAttribute("data-lang");
            if (!selectedLang) {
                console.error("❌ Language attribute missing on flag.");
                return;
            }

            localStorage.setItem("selectedLang", selectedLang);
            console.log(`🌍 Language changed to: ${selectedLang}`);
            window.location.reload();
        });
    });

    // Apply saved language settings
    const savedLang = localStorage.getItem("selectedLang") || "en"; // Default to English
    document.documentElement.setAttribute("lang", savedLang);

    // Example: Update text dynamically (if you have translations)
    const translations = {
        en: "Welcome, Space Explorer!",
        es: "¡Bienvenido, Explorador Espacial!",
        fr: "Bienvenue, Explorateur Spatial!",
        de: "Willkommen, Weltraumforscher!"
    };

    const greetingElement = document.getElementById("aiGreeting");
    if (greetingElement) {
        greetingElement.innerText = translations[savedLang] || translations.en;
    } else {
        console.warn("⚠️ AI greeting element not found.");
    }
});

// Run language system when page loads
document.addEventListener("DOMContentLoaded", initLanguageSystem);