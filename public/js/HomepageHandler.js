// ✅ Ensure this file is recognized as a module
export default class HomepageHandler {
    constructor() {
        console.log('🚀 Initializing Homepage Handler...');
        this.initializeComponents();
    }

    initializeComponents() {
        this.initializeMenu();
        this.initializeTrainingToggle();
        this.initializeCountdownTimer('countdown-timer', '2049-01-01T00:00:00');
    }

    initializeMenu() {
        const menuToggle = document.getElementById('menuToggle');
        const menuOverlay = document.getElementById('menuOverlay');
        const closeMenu = document.getElementById('closeMenu');

        if (!menuToggle || !menuOverlay || !closeMenu) {
            console.error("⚠️ Menu elements not found!");
            return;
        }

        const toggleMenu = () => {
            menuOverlay.classList.toggle("hidden");
            document.body.style.overflow = menuOverlay.classList.contains("hidden") ? "" : "hidden";
        };

        menuToggle.addEventListener('click', toggleMenu);
        closeMenu.addEventListener('click', toggleMenu);
    }

    initializeTrainingToggle() {
        const toggleOptions = document.querySelectorAll('.toggle-option');

        if (!toggleOptions.length) {
            console.error("⚠️ Training toggle elements not found!");
            return;
        }

        toggleOptions.forEach(option => {
            option.addEventListener('click', () => {
                toggleOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');

                const mode = option.getAttribute('data-mode');
                localStorage.setItem('trainingMode', mode);
                console.log(`Training mode selected: ${mode}`);
            });
        });

        // ✅ Set initial state correctly
        const savedMode = localStorage.getItem('trainingMode') || 'manual';
        const activeOption = [...toggleOptions].find(option => option.getAttribute('data-mode') === savedMode);
        if (activeOption) {
            activeOption.classList.add('active');
            activeOption.setAttribute('aria-pressed', 'true');
        }
    }

    initializeCountdownTimer(elementId, targetDate) {
        const timerElement = document.getElementById(elementId);
        if (!timerElement) {
            console.warn(`⚠️ Countdown timer element (#${elementId}) not found.`);
            return;
        }

        const updateTimer = () => {
            const now = new Date();
            const target = new Date(targetDate);
            const diff = target - now;

            if (diff <= 0) {
                timerElement.textContent = "🚀 The journey begins!";
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / 1000 / 60) % 60);
            const seconds = Math.floor((diff / 1000) % 60);

            timerElement.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        };

        updateTimer();
        setInterval(updateTimer, 1000);
    }
}
