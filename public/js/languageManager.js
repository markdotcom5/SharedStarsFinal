/**
 * SharedStars Language Manager
 * Handles multilingual support for the SharedStars platform
 */

class LanguageManager {
  constructor() {
    this.langButtons = document.querySelectorAll('.lang-btn');
    this.currentLang = this.getCookie('language') || 'en';
    // We'll update contentElements dynamically when needed instead of once at initialization
    this.translations = {
      en: {
        // Authentication
        "signup.openButton": "Sign Up Now",
        "signup.title": "Join SharedStars Academy",
        "signup.usernameLabel": "Username",
        "signup.usernamePlaceholder": "Choose a username",
        "signup.emailLabel": "Email",
        "signup.emailPlaceholder": "Enter your email",
        "signup.passwordLabel": "Password",
        "signup.passwordPlaceholder": "Create a password",
        "signup.submitButton": "Sign Up",
        "signup.closeButton": "Close",
        "verification.enterCode": "Enter Verification Code",
        "verification.submit": "Verify Account",
        "login.title": "Welcome back",
        "login.email": "Email address",
        "login.password": "Password",
        "login.rememberMe": "Remember me",
        "login.forgotPassword": "Forgot Password?",
        "login.submit": "Login",
        
        // Navigation
        "academy": "Academy",
        "about": "About",
        "leaderboard": "Leaderboard",
        "subscribe": "Subscribe",
        "missionControl": "Mission Control",
        "trainingHub": "Training Hub",
        "getStarted": "Get Started",
        
        // Training Hub
        "welcome-physical": "Welcome to SharedStars Training Hub!",
        "physical-subtitle": "Master your physical preparation for space missions!",
        "startTraining": "Start My Training",
        "resumeTraining": "Resume Training",
        "continueTraining": "Continue Training",
        "viewProgress": "View My Progress",
        "session": "Session:",
        "pause": "Pause",
        
        // Training Process
        "howTrainingWorks": "How SharedStars Training Works",
        "whyTrainingHub": "Why the Training Hub",
        "step1": "AI evaluates your background and skills.",
        "step2": "Choose from available modules.",
        "step3": "Complete pre-training assessment.",
        "step4": "Begin mission-based training.",
        "step5": "Track progress and certifications.",
        "step1Title": "Step 1: Assessment",
        "step2Title": "Step 2: Planning",
        "step3Title": "Step 3: Training",
        "step4Title": "Step 4: Evaluation",
        "step5Title": "Step 5: Certification",
        
        // Training Modules
        "availableModules": "Available Training Modules",
        "physicalTraining": "Physical Training",
        "physicalDesc": "Comprehensive physical training program designed to enhance strength, endurance, and flexibility.",
        "technicalTraining": "Technical Training",
        "evaTraining": "EVA (Spacewalk) Training",
        "aiGuidedSimulations": "AI-Guided Simulations",
        "impartialARTraining": "Impartial AR Training",
        "planetarySurfaceOperations": "Planetary Surface Operations",
        "spaceMedicine": "Space Medicine & Human Physiology",
        "mentalFitness": "Mental Fitness",
        "mentalDesc": "Develop mental resilience, focus, and cognitive abilities through specialized exercises.",
        "leadership": "Leadership",
        "leadershipDesc": "Cultivate essential leadership skills for effective team management and strategic decision-making.",
        "Assessmentkills": "Assessment Skills",
        "engineeringDesc": "Master technical skills and problem-solving approaches for engineering challenges.",
        "comingSoon": "Coming Soon",
        
        // Social
        "testimonials": "Hear from our trainees!",
        
        // Countdown
        "countdownTitle": "Countdown to mass space travel",
        "staticCountdownTitle": "General space travel availability:",
        "personalizedCountdownTitle": "Your personal space readiness:"
      },
      
      es: {
        // Authentication
        "signup.openButton": "Regístrate ahora",
        "signup.title": "Únete a SharedStars Academy",
        "signup.usernameLabel": "Nombre de usuario",
        "signup.usernamePlaceholder": "Elige un nombre de usuario",
        "signup.emailLabel": "Correo electrónico",
        "signup.emailPlaceholder": "Ingresa tu correo electrónico",
        "signup.passwordLabel": "Contraseña",
        "signup.passwordPlaceholder": "Crea una contraseña",
        "signup.submitButton": "Regístrate",
        "signup.closeButton": "Cerrar",
        "verification.enterCode": "Ingresa el código de verificación",
        "verification.submit": "Verificar cuenta",
        "login.title": "Bienvenido de nuevo",
        "login.email": "Correo electrónico",
        "login.password": "Contraseña",
        "login.rememberMe": "Recordarme",
        "login.forgotPassword": "¿Olvidaste tu contraseña?",
        "login.submit": "Iniciar sesión",
        
        // Navigation
        "academy": "Academia",
        "about": "Acerca de",
        "leaderboard": "Tabla de clasificación",
        "subscribe": "Suscribirse",
        "missionControl": "Control de Misión",
        "trainingHub": "Centro de Entrenamiento",
        "getStarted": "Comenzar",
        
        // Training Hub
        "welcome-physical": "¡Bienvenido al Centro de Entrenamiento SharedStars!",
        "physical-subtitle": "¡Domina tu preparación física para misiones espaciales!",
        "startTraining": "Comenzar Mi Entrenamiento",
        "resumeTraining": "Continuar Entrenamiento",
        "continueTraining": "Continuar Entrenamiento",
        "viewProgress": "Ver Mi Progreso",
        "session": "Sesión:",
        "pause": "Pausa",
        
        // Training Process
        "howTrainingWorks": "Cómo Funciona el Entrenamiento SharedStars",
        "whyTrainingHub": "Por qué el Centro de Entrenamiento",
        "step1": "La IA evalúa tu experiencia y habilidades.",
        "step2": "Elige entre módulos disponibles.",
        "step3": "Completa la evaluación previa al entrenamiento.",
        "step4": "Comienza el entrenamiento basado en misiones.",
        "step5": "Realiza seguimiento del progreso y certificaciones.",
        "step1Title": "Paso 1: Evaluación",
        "step2Title": "Paso 2: Planificación",
        "step3Title": "Paso 3: Entrenamiento",
        "step4Title": "Paso 4: Evaluación",
        "step5Title": "Paso 5: Certificación",
        
        // Training Modules
        "availableModules": "Módulos de Entrenamiento Disponibles",
        "physicalTraining": "Entrenamiento Físico",
        "physicalDesc": "Programa completo de entrenamiento físico diseñado para mejorar la fuerza, resistencia y flexibilidad.",
        "technicalTraining": "Entrenamiento Técnico",
        "evaTraining": "Entrenamiento EVA (Caminata Espacial)",
        "aiGuidedSimulations": "Simulaciones Guiadas por IA",
        "impartialARTraining": "Entrenamiento AR Imparcial",
        "planetarySurfaceOperations": "Operaciones en Superficie Planetaria",
        "spaceMedicine": "Medicina Espacial y Fisiología Humana",
        "mentalFitness": "Aptitud Mental",
        "mentalDesc": "Desarrolla resistencia mental, concentración y habilidades cognitivas a través de ejercicios especializados.",
        "leadership": "Liderazgo",
        "leadershipDesc": "Cultiva habilidades esenciales de liderazgo para la gestión eficaz del equipo y la toma de decisiones estratégicas.",
        "Assessmentkills": "Habilidades de Evaluación",
        "engineeringDesc": "Domina habilidades técnicas y enfoques de resolución de problemas para desafíos de ingeniería.",
        "comingSoon": "Próximamente",
        
        // Social
        "testimonials": "¡Conoce la Experiencia de Nuestros Alumnos!",
        
        // Countdown
        "countdownTitle": "Cuenta atrás para los viajes espaciales masivos",
        "staticCountdownTitle": "Disponibilidad general de viajes espaciales:",
        "personalizedCountdownTitle": "Tu preparación personal para el espacio:"
      },
      
      ko: {
        // Authentication
        "signup.openButton": "지금 가입하기",
        "signup.title": "SharedStars 아카데미 가입하기",
        "signup.usernameLabel": "사용자 이름",
        "signup.usernamePlaceholder": "사용자 이름을 선택하세요",
        "signup.emailLabel": "이메일",
        "signup.emailPlaceholder": "이메일을 입력하세요",
        "signup.passwordLabel": "비밀번호",
        "signup.passwordPlaceholder": "비밀번호를 만드세요",
        "signup.submitButton": "가입하기",
        "signup.closeButton": "닫기",
        "verification.enterCode": "인증 코드 입력",
        "verification.submit": "계정 인증",
        "login.title": "다시 오신 것을 환영합니다",
        "login.email": "이메일 주소",
        "login.password": "비밀번호",
        "login.rememberMe": "로그인 유지",
        "login.forgotPassword": "비밀번호를 잊으셨나요?",
        "login.submit": "로그인",
        
        // Navigation
        "academy": "아카데미",
        "about": "소개",
        "leaderboard": "리더보드",
        "subscribe": "구독하기",
        "missionControl": "미션 컨트롤",
        "trainingHub": "훈련 허브",
        "getStarted": "시작하기",
        
        // Training Hub
        "welcome-physical": "SharedStars 훈련 허브에 오신 것을 환영합니다!",
        "physical-subtitle": "우주 임무를 위한 신체 준비를 완벽하게 갖추세요!",
        "startTraining": "훈련 시작하기",
        "resumeTraining": "훈련 이어하기",
        "continueTraining": "훈련 계속하기",
        "viewProgress": "진행 상황 보기",
        "session": "세션:",
        "pause": "일시 정지",
        
        // Training Process
        "howTrainingWorks": "SharedStars 훈련 방식",
        "whyTrainingHub": "훈련 허브가 필요한 이유",
        "step1": "AI가 당신의 배경과 기술을 평가합니다.",
        "step2": "사용 가능한 모듈 중 선택하세요.",
        "step3": "사전 훈련 평가를 완료하세요.",
        "step4": "미션 기반 훈련을 시작하세요.",
        "step5": "진행 상황 및 인증서를 추적하세요.",
        "step1Title": "1단계: 평가",
        "step2Title": "2단계: 계획",
        "step3Title": "3단계: 훈련",
        "step4Title": "4단계: 평가",
        "step5Title": "5단계: 인증",
        
        // Training Modules
        "availableModules": "사용 가능한 훈련 모듈",
        "physicalTraining": "신체 훈련",
        "physicalDesc": "체력, 지구력 및 유연성을 향상시키기 위해 설계된 종합적인 신체 훈련 프로그램.",
        "technicalTraining": "기술 훈련",
        "evaTraining": "EVA(우주유영) 훈련",
        "aiGuidedSimulations": "AI 가이드 시뮬레이션",
        "impartialARTraining": "공정 AR 훈련",
        "planetarySurfaceOperations": "행성 표면 작전",
        "spaceMedicine": "우주의학 및 인체 생리학",
        "mentalFitness": "정신 건강",
        "mentalDesc": "특수 훈련을 통해 정신적 회복력, 집중력 및 인지 능력을 개발하세요.",
        "leadership": "리더십",
        "leadershipDesc": "효과적인 팀 관리와 전략적 의사 결정을 위한 필수 리더십 기술을 배양하세요.",
        "Assessmentkills": "평가 기술",
        "engineeringDesc": "공학적 문제에 대한 기술 능력과 문제 해결 접근법을 마스터하세요.",
        "comingSoon": "곧 제공 예정",
        
        // Social
        "testimonials": "훈련생들의 이야기를 들어보세요!",
        
        // Countdown
        "countdownTitle": "대중 우주여행 카운트다운",
        "staticCountdownTitle": "일반 우주여행 가능 시기:",
        "personalizedCountdownTitle": "당신의 개인 우주 준비도:"
      },
      
      zh: {
        // Authentication
        "signup.openButton": "立即注册",
        "signup.title": "加入SharedStars学院",
        "signup.usernameLabel": "用户名",
        "signup.usernamePlaceholder": "选择一个用户名",
        "signup.emailLabel": "电子邮件",
        "signup.emailPlaceholder": "输入您的电子邮件",
        "signup.passwordLabel": "密码",
        "signup.passwordPlaceholder": "创建一个密码",
        "signup.submitButton": "注册",
        "signup.closeButton": "关闭",
        "verification.enterCode": "输入验证码",
        "verification.submit": "验证账户",
        "login.title": "欢迎回来",
        "login.email": "电子邮件地址",
        "login.password": "密码",
        "login.rememberMe": "记住我",
        "login.forgotPassword": "忘记密码？",
        "login.submit": "登录",
        
        // Navigation
        "academy": "学院",
        "about": "关于我们",
        "leaderboard": "排行榜",
        "subscribe": "订阅",
        "missionControl": "任务控制",
        "trainingHub": "训练中心",
        "getStarted": "开始使用",
        
        // Training Hub
        "welcome-physical": "欢迎来到SharedStars训练中心！",
        "physical-subtitle": "掌握完成太空任务所需的身体素质！",
        "startTraining": "开始我的训练",
        "resumeTraining": "继续训练",
        "continueTraining": "继续训练",
        "viewProgress": "查看我的进度",
        "session": "训练时长：",
        "pause": "暂停",
        
        // Training Process
        "howTrainingWorks": "SharedStars训练如何运作",
        "whyTrainingHub": "为什么选择训练中心",
        "step1": "AI评估你的背景与技能。",
        "step2": "从可用模块中选择。",
        "step3": "完成训练前的评估。",
        "step4": "开始基于任务的训练。",
        "step5": "跟踪进度与认证情况。",
        "step1Title": "第1步：评估",
        "step2Title": "第2步：规划",
        "step3Title": "第3步：训练",
        "step4Title": "第4步：评估",
        "step5Title": "第5步：认证",
        
        // Training Modules
        "availableModules": "可用训练模块",
        "physicalTraining": "体能训练",
        "physicalDesc": "综合体能训练计划，旨在增强力量、耐力和灵活性。",
        "technicalTraining": "技术训练",
        "evaTraining": "EVA（太空行走）训练",
        "aiGuidedSimulations": "AI引导模拟训练",
        "impartialARTraining": "公平AR训练",
        "planetarySurfaceOperations": "行星表面作业",
        "spaceMedicine": "空间医学与人体生理学",
        "mentalFitness": "心理健康",
        "mentalDesc": "通过专业训练发展心理韧性、专注力和认知能力。",
        "leadership": "领导力",
        "leadershipDesc": "培养有效团队管理和战略决策的基本领导技能。",
        "Assessmentkills": "评估技能",
        "engineeringDesc": "掌握工程挑战的技术技能和问题解决方法。",
        "comingSoon": "即将推出",
        
        // Social
        "testimonials": "听听我们学员的反馈！",
        
        // Countdown
        "countdownTitle": "大众太空旅行倒计时",
        "staticCountdownTitle": "普通太空旅行开放时间：",
        "personalizedCountdownTitle": "您的个人太空准备状态："
      }
    };
    
    this.initialize();
  }
  
  /**
   * Initialize the language manager
   */
  initialize() {
    this.setupEventListeners();
    this.setLanguage(this.currentLang);
    
    // Optional: load additional translations from server
    // Uncomment this if you want to load translations from your Express backend
    // this.fetchTranslationsFromServer(this.currentLang);
  }
  
  /**
   * Set up event listeners for language buttons
   */
  setupEventListeners() {
    if (this.langButtons.length) {
      this.langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const lang = btn.getAttribute('data-lang');
          this.setLanguage(lang);
        });
      });
    }
  }
  
  /**
   * Get a cookie by name
   * @param {string} name - Cookie name to retrieve
   * @returns {string|null} Cookie value or null if not found
   */
  getCookie(name) {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? match[2] : null;
  }
  
  /**
   * Set a cookie
   * @param {string} name - Cookie name
   * @param {string} value - Cookie value
   * @param {number} days - Cookie expiration in days
   */
  setCookie(name, value, days = 365) {
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value}; path=/; max-age=${maxAge}`;
  }
  
  /**
   * Apply translations to all elements with data-i18n attribute
   * @param {string} lang - Language code (en, es, ko, zh)
   */
  applyTranslations(lang) {
    // Get all elements with data-i18n attribute (refreshes to include dynamically added elements)
    const contentElements = document.querySelectorAll('[data-i18n]');
    
    contentElements.forEach((el) => {
      const key = el.dataset.i18n;
      
      if (this.translations[lang] && this.translations[lang][key]) {
        el.textContent = this.translations[lang][key];
      } else if (this.translations.en[key]) {
        // Fallback to English
        el.textContent = this.translations.en[key];
        console.warn(`Missing translation for key: ${key} in ${lang}, defaulted to English.`);
      } else {
        console.error(`Translation completely missing for key: ${key}`);
      }
      
      // For input elements, also set placeholder if it has data-i18n-placeholder
      if (el.hasAttribute('data-i18n-placeholder')) {
        const placeholderKey = el.getAttribute('data-i18n-placeholder');
        if (this.translations[lang] && this.translations[lang][placeholderKey]) {
          el.placeholder = this.translations[lang][placeholderKey];
        }
      }
    });
  }
  
  /**
   * Set the active language and apply translations
   * @param {string} lang - Language code (en, es, ko, zh)
   */
  setLanguage(lang) {
    // Validate language is supported
    if (!this.translations[lang]) {
      console.error(`Language ${lang} is not supported. Defaulting to English.`);
      lang = 'en';
    }
    
    // Update document language attribute
    document.documentElement.lang = lang;
    
    // Apply translations
    this.applyTranslations(lang);
    
    // Store language preference in cookie
    this.setCookie('language', lang);
    
    // Update current language
    this.currentLang = lang;
    
    // Trigger custom event for other components
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
  }
  
  /**
   * Get translation for a specific key
   * @param {string} key - Translation key
   * @param {string} lang - Optional language code (defaults to current language)
   * @returns {string} Translated text or key if translation not found
   */
  getTranslation(key, lang = this.currentLang) {
    if (this.translations[lang] && this.translations[lang][key]) {
      return this.translations[lang][key];
    } else if (this.translations.en[key]) {
      return this.translations.en[key];
    }
    return key;
  }
  
  /**
   * Apply translations to a specific element and its children
   * Useful for dynamically created elements like popups
   * @param {HTMLElement} element - The root element to translate
   * @param {string} lang - Optional language code (defaults to current language)
   */
  translateElement(element, lang = this.currentLang) {
    // Translate the element itself if it has data-i18n
    if (element.hasAttribute && element.hasAttribute('data-i18n')) {
      const key = element.dataset.i18n;
      if (this.translations[lang] && this.translations[lang][key]) {
        element.textContent = this.translations[lang][key];
      } else if (this.translations.en[key]) {
        element.textContent = this.translations.en[key];
      }
      
      // Handle placeholder if present
      if (element.hasAttribute('data-i18n-placeholder')) {
        const placeholderKey = element.getAttribute('data-i18n-placeholder');
        if (this.translations[lang] && this.translations[lang][placeholderKey]) {
          element.placeholder = this.translations[lang][placeholderKey];
        }
      }
    }
    
    // Translate children with data-i18n
    const childElements = element.querySelectorAll('[data-i18n]');
    childElements.forEach(el => {
      const key = el.dataset.i18n;
      if (this.translations[lang] && this.translations[lang][key]) {
        el.textContent = this.translations[lang][key];
      } else if (this.translations.en[key]) {
        el.textContent = this.translations.en[key];
      }
      
      // Handle placeholder if present
      if (el.hasAttribute('data-i18n-placeholder')) {
        const placeholderKey = el.getAttribute('data-i18n-placeholder');
        if (this.translations[lang] && this.translations[lang][placeholderKey]) {
          el.placeholder = this.translations[lang][placeholderKey];
        }
      }
    });
    
    return element;
  }
  
  /**
   * Add a new translation
   * @param {string} lang - Language code
   * @param {string} key - Translation key
   * @param {string} value - Translated text
   */
  addTranslation(lang, key, value) {
    if (!this.translations[lang]) {
      this.translations[lang] = {};
    }
    
    this.translations[lang][key] = value;
    
    // Re-apply translations if adding to current language
    if (lang === this.currentLang) {
      this.applyTranslations(lang);
    }
  }
  
  /**
   * Add multiple translations at once
   * @param {string} lang - Language code
   * @param {Object} translations - Object with key-value pairs of translations
   */
  addTranslations(lang, translations) {
    if (!this.translations[lang]) {
      this.translations[lang] = {};
    }
    
    Object.assign(this.translations[lang], translations);
    
    // Re-apply translations if adding to current language
    if (lang === this.currentLang) {
      this.applyTranslations(lang);
    }
  }
}

// Initialize language manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Create global instance
  window.languageManager = new LanguageManager();
  
  // For backwards compatibility
  // This allows the old code to continue working
  window.applyTranslations = (lang) => {
    window.languageManager.setLanguage(lang);
  };
  
  // Set up MutationObserver to detect dynamically added content (like popups)
  const observer = new MutationObserver((mutations) => {
    let needsTranslationUpdate = false;
    
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        // Check if any added nodes have data-i18n attributes
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            if (node.querySelector('[data-i18n]') || node.hasAttribute('data-i18n')) {
              needsTranslationUpdate = true;
            }
          }
        });
      }
    });
    
    // Apply translations if needed
    if (needsTranslationUpdate) {
      window.languageManager.applyTranslations(window.languageManager.currentLang);
    }
  });
  
  // Start observing the document body for changes
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
});
