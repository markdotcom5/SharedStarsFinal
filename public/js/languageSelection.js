document.addEventListener('DOMContentLoaded', () => {
  const langButtons = document.querySelectorAll('.lang-btn');
  const contentElements = document.querySelectorAll('[data-i18n]');

  const translations = {
    en: {
      // Existing translations
      "welcome-physical": "Welcome to SharedStars Training Hub!",
      "physical-subtitle": "Master Your Physical Readiness for Space Missions!",
      "startTraining": "Start My Training",
      "resumeTraining": "Resume Training",
      "viewProgress": "View My Progress",
      "session": "Session:",
      "pause": "Pause",
      "howTrainingWorks": "How SharedStars Training Works",
      "availableModules": "Available Training Modules",
      "physicalTraining": "Physical Training",
      "technicalTraining": "Technical Training",
      "evaTraining": "EVA (Spacewalk) Training",
      "aiGuidedSimulations": "AI-Guided Simulations",
      "impartialARTraining": "Impartial AR Training",
      "planetarySurfaceOperations": "Planetary Surface Operations",
      "spaceMedicine": "Space Medicine & Human Physiology",
      "comingSoon": "Coming soon",
      "testimonials": "Hear from Our Trainees!",
      "step1": "AI assesses your background & skills.",
      "step2": "Choose from available modules.",
      "step3": "Complete pre-training assessment.",
      "step4": "Begin mission-based training.",
      "step5": "Track progress and certifications.",
      "countdownTitle": "Countdown to Mass Space Travel",
      "staticCountdownTitle": "General Space Travel Availability:",
      "personalizedCountdownTitle": "Your Personal Space Readiness:",
      
      // Adding missing keys from error logs
      "academy": "Academy",
      "about": "About",
      "leaderboard": "Leaderboard",
      "subscribe": "Subscribe",
      "missionControl": "Mission Control",
      "trainingHub": "Training Hub",
      "getStarted": "Get Started",
      "whyTrainingHub": "Why Training Hub",
      "step1Title": "Step 1: Assessment",
      "step2Title": "Step 2: Planning",
      "step3Title": "Step 3: Training",
      "step4Title": "Step 4: Evaluation",
      "step5Title": "Step 5: Certification",
      "physicalDesc": "Comprehensive physical training program designed to enhance strength, endurance, and flexibility.",
      "continueTraining": "Continue Training",
      "mentalFitness": "Mental Fitness",
      "mentalDesc": "Develop mental resilience, focus, and cognitive abilities through specialized exercises.",
      "leadership": "Leadership",
      "leadershipDesc": "Cultivate essential leadership skills for effective team management and strategic decision-making.",
      "Assessmentkills": "Assessment Skills", // This might be a typo, should it be "AssessmentSkills"?
      "engineeringDesc": "Master technical skills and problem-solving approaches for engineering challenges."
    },
    es: {
      // Existing translations
      "welcome-physical": "¡Bienvenido al Centro de Entrenamiento SharedStars!",
      "physical-subtitle": "¡Domina tu preparación física para misiones espaciales!",
      "startTraining": "Comenzar Mi Entrenamiento",
      "resumeTraining": "Continuar Entrenamiento",
      "viewProgress": "Ver Mi Progreso",
      "session": "Sesión:",
      "pause": "Pausa",
      "howTrainingWorks": "Cómo Funciona el Entrenamiento SharedStars",
      "availableModules": "Módulos de Entrenamiento Disponibles",
      "physicalTraining": "Entrenamiento Físico",
      "technicalTraining": "Entrenamiento Técnico",
      "evaTraining": "Entrenamiento EVA (Caminata Espacial)",
      "aiGuidedSimulations": "Simulaciones Guiadas por IA",
      "impartialARTraining": "Entrenamiento AR Imparcial",
      "planetarySurfaceOperations": "Operaciones en Superficie Planetaria",
      "spaceMedicine": "Medicina Espacial y Fisiología Humana",
      "comingSoon": "Próximamente",
      "testimonials": "¡Conoce la Experiencia de Nuestros Alumnos!",
      "step1": "La IA evalúa tu experiencia y habilidades.",
      "step2": "Elige entre módulos disponibles.",
      "step3": "Completa la evaluación previa al entrenamiento.",
      "step4": "Comienza el entrenamiento basado en misiones.",
      "step5": "Realiza seguimiento del progreso y certificaciones.",
      "countdownTitle": "Cuenta atrás para los viajes espaciales masivos",
      "staticCountdownTitle": "Disponibilidad general de viajes espaciales:",
      "personalizedCountdownTitle": "Tu preparación personal para el espacio:",
      
      // Adding missing keys with Spanish translations
      "academy": "Academia",
      "about": "Acerca de",
      "leaderboard": "Tabla de clasificación",
      "subscribe": "Suscribirse",
      "missionControl": "Control de Misión",
      "trainingHub": "Centro de Entrenamiento",
      "getStarted": "Comenzar",
      "whyTrainingHub": "Por qué el Centro de Entrenamiento",
      "step1Title": "Paso 1: Evaluación",
      "step2Title": "Paso 2: Planificación",
      "step3Title": "Paso 3: Entrenamiento",
      "step4Title": "Paso 4: Evaluación",
      "step5Title": "Paso 5: Certificación",
      "physicalDesc": "Programa completo de entrenamiento físico diseñado para mejorar la fuerza, resistencia y flexibilidad.",
      "continueTraining": "Continuar Entrenamiento",
      "mentalFitness": "Aptitud Mental",
      "mentalDesc": "Desarrolla resistencia mental, concentración y habilidades cognitivas a través de ejercicios especializados.",
      "leadership": "Liderazgo",
      "leadershipDesc": "Cultiva habilidades esenciales de liderazgo para la gestión eficaz del equipo y la toma de decisiones estratégicas.",
      "Assessmentkills": "Habilidades de Evaluación",
      "engineeringDesc": "Domina habilidades técnicas y enfoques de resolución de problemas para desafíos de ingeniería."
    },
    ko: {
      // Existing translations
      "welcome-physical": "SharedStars 훈련 허브에 오신 것을 환영합니다!",
      "physical-subtitle": "우주 임무를 위한 신체 준비를 완벽하게 갖추세요!",
      "startTraining": "훈련 시작하기",
      "resumeTraining": "훈련 이어하기",
      "viewProgress": "진행 상황 보기",
      "session": "세션:",
      "pause": "일시 정지",
      "howTrainingWorks": "SharedStars 훈련 방식",
      "availableModules": "사용 가능한 훈련 모듈",
      "physicalTraining": "신체 훈련",
      "technicalTraining": "기술 훈련",
      "evaTraining": "EVA(우주유영) 훈련",
      "aiGuidedSimulations": "AI 가이드 시뮬레이션",
      "impartialARTraining": "공정 AR 훈련",
      "planetarySurfaceOperations": "행성 표면 작전",
      "spaceMedicine": "우주의학 및 인체 생리학",
      "comingSoon": "곧 제공 예정",
      "testimonials": "훈련생들의 이야기를 들어보세요!",
      "step1": "AI가 당신의 배경과 기술을 평가합니다.",
      "step2": "사용 가능한 모듈 중 선택하세요.",
      "step3": "사전 훈련 평가를 완료하세요.",
      "step4": "미션 기반 훈련을 시작하세요.",
      "step5": "진행 상황 및 인증서를 추적하세요.",
      "countdownTitle": "대중 우주여행 카운트다운",
      "staticCountdownTitle": "일반 우주여행 가능 시기:",
      "personalizedCountdownTitle": "당신의 개인 우주 준비도:",
      
      // Adding missing keys with Korean translations
      "academy": "아카데미",
      "about": "소개",
      "leaderboard": "리더보드",
      "subscribe": "구독하기",
      "missionControl": "미션 컨트롤",
      "trainingHub": "훈련 허브",
      "getStarted": "시작하기",
      "whyTrainingHub": "훈련 허브가 필요한 이유",
      "step1Title": "1단계: 평가",
      "step2Title": "2단계: 계획",
      "step3Title": "3단계: 훈련",
      "step4Title": "4단계: 평가",
      "step5Title": "5단계: 인증",
      "physicalDesc": "체력, 지구력 및 유연성을 향상시키기 위해 설계된 종합적인 신체 훈련 프로그램.",
      "continueTraining": "훈련 계속하기",
      "mentalFitness": "정신 건강",
      "mentalDesc": "특수 훈련을 통해 정신적 회복력, 집중력 및 인지 능력을 개발하세요.",
      "leadership": "리더십",
      "leadershipDesc": "효과적인 팀 관리와 전략적 의사 결정을 위한 필수 리더십 기술을 배양하세요.",
      "Assessmentkills": "평가 기술",
      "engineeringDesc": "공학적 문제에 대한 기술 능력과 문제 해결 접근법을 마스터하세요."
    },
    zh: {
      // Existing translations
      "welcome-physical": "欢迎来到SharedStars训练中心！",
      "physical-subtitle": "掌握完成太空任务所需的身体素质！",
      "startTraining": "开始我的训练",
      "resumeTraining": "继续训练",
      "viewProgress": "查看我的进度",
      "session": "训练时长：",
      "pause": "暂停",
      "howTrainingWorks": "SharedStars训练如何运作",
      "availableModules": "可用训练模块",
      "physicalTraining": "体能训练",
      "technicalTraining": "技术训练",
      "evaTraining": "EVA（太空行走）训练",
      "aiGuidedSimulations": "AI引导模拟训练",
      "impartialARTraining": "公平AR训练",
      "planetarySurfaceOperations": "行星表面作业",
      "spaceMedicine": "空间医学与人体生理学",
      "comingSoon": "即将推出",
      "testimonials": "听听我们学员的反馈！",
      "step1": "AI评估你的背景与技能。",
      "step2": "从可用模块中选择。",
      "step3": "完成训练前的评估。",
      "step4": "开始基于任务的训练。",
      "step5": "跟踪进度与认证情况。",
      "countdownTitle": "大众太空旅行倒计时",
      "staticCountdownTitle": "普通太空旅行开放时间：",
      "personalizedCountdownTitle": "您的个人太空准备状态：",
      
      // Adding missing keys with Chinese translations
      "academy": "学院",
      "about": "关于我们",
      "leaderboard": "排行榜",
      "subscribe": "订阅",
      "missionControl": "任务控制",
      "trainingHub": "训练中心",
      "getStarted": "开始使用",
      "whyTrainingHub": "为什么选择训练中心",
      "step1Title": "第1步：评估",
      "step2Title": "第2步：规划",
      "step3Title": "第3步：训练",
      "step4Title": "第4步：评估",
      "step5Title": "第5步：认证",
      "physicalDesc": "综合体能训练计划，旨在增强力量、耐力和灵活性。",
      "continueTraining": "继续训练",
      "mentalFitness": "心理健康",
      "mentalDesc": "通过专业训练发展心理韧性、专注力和认知能力。",
      "leadership": "领导力",
      "leadershipDesc": "培养有效团队管理和战略决策的基本领导技能。",
      "Assessmentkills": "评估技能",
      "engineeringDesc": "掌握工程挑战的技术技能和问题解决方法。"
    }
  };

  const applyTranslations = (lang) => {
    contentElements.forEach((el) => {
      const key = el.dataset.i18n;
      if (translations[lang] && translations[lang][key]) {
        el.textContent = translations[lang][key];
      } else if (translations.en[key]) {
        el.textContent = translations.en[key];
        console.warn(`Missing translation for key: ${key}, defaulted to English.`);
      } else {
        console.error(`Translation completely missing for key: ${key}`);
      }
    });
  };

  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? match[2] : null;
  };

  // In your languageSelection.js
const initLanguage = () => {
  const lang = getCookie('language') || 'en'; // Force 'en' as default
  document.documentElement.lang = lang;
  applyTranslations(lang);
};

  langButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      document.cookie = `language=${lang}; path=/; max-age=${60*60*24*365}`;
      applyTranslations(lang);
      document.documentElement.lang = lang;
    });
  });

  initLanguage();
});