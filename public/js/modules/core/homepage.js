// ✅ Ensure this file is recognized as a module
import AISpaceCoach from './AISpaceCoach.js';
import AIGuidanceSystem from './AIGuidanceSystem.js';
import { fetchOpenAIResponse } from './checkOpenAI.js';
import HomepageHandler from './HomepageHandler.js';

class HomepageHandler {
    constructor() {
        console.log('🚀 Initializing Homepage Handler...');
        this.aiCoach = new AISpaceCoach();
        this.guidanceSystem = new AIGuidanceSystem();
        this.initializeComponents();
    }

    initializeComponents() {
        this.initializeMenu();
        this.initializeTrainingToggle();
        this.initializeVideoBackground();
        this.initializeEventListeners();
        this.initializeLanguageSystem();
        this.detectUserLanguage();
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

        menuOverlay.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', toggleMenu);
        });
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

                if (mode === 'ai') {
                    console.log("🚀 AI Mode Activated. Launching AI Training...");
                    this.startAITraining();
                } else {
                    console.log("📍 Opening Sign-Up Popup");
                    this.openSignupPopup();
                }
            });
        });

        // ✅ Fix: Set initial state correctly
        const savedMode = localStorage.getItem('trainingMode') || 'manual';
        const activeOption = [...toggleOptions].find(option => option.getAttribute('data-mode') === savedMode);
        if (activeOption) {
            activeOption.classList.add('active');
            activeOption.setAttribute('aria-pressed', 'true');
        }
    }

    startAITraining() {
        this.openChat();
        this.sendAIMessage("Welcome! I will guide you through your space training journey.");

        setTimeout(() => {
            this.sendAIMessage("Let's start by understanding your fitness level. Are you a Beginner, Intermediate, or Advanced?");
        }, 2000);
    }

    openChat() {
        const chatContainer = document.getElementById('ai-chat-container');
        if (chatContainer) {
            chatContainer.classList.remove('hidden');
        } else {
            console.error("⚠️ AI chat container not found.");
        }
    }

    closeChat() {
        const chatContainer = document.getElementById('ai-chat-container');
        if (chatContainer) {
            chatContainer.classList.add('hidden');
        } else {
            console.error("⚠️ AI chat container not found.");
        }
    }

    sendAIMessage(message) {
        const chatMessages = document.querySelector('.chat-messages');
        if (!chatMessages) {
            console.error("⚠️ Chat messages container not found.");
            return;
        }

        const aiMessage = document.createElement('div');
        aiMessage.classList.add('ai-msg');
        aiMessage.innerHTML = `<strong>AI:</strong> ${message}`;
        chatMessages.appendChild(aiMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    openSignupPopup() {
        const signupPopup = document.createElement("div");
        signupPopup.innerHTML = `
            <div class="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
                <div class="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto text-center">
                    <h2 class="text-2xl font-bold text-gray-900">Join Our Training Program</h2>
                    <p class="text-gray-600 mt-2">Sign up to start your journey!</p>
                    <div class="flex gap-4 mt-4 justify-center">
                        <a href="/signup" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">Signup Now</a>
                        <button class="close-signup bg-gray-300 px-6 py-3 rounded-lg hover:bg-gray-400">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(signupPopup);

        signupPopup.querySelector(".close-signup").addEventListener("click", () => {
            signupPopup.remove();
        });
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

// ✅ Ensure the script runs when the page is loaded
document.addEventListener("DOMContentLoaded", () => {
    window.homepageHandler = new HomepageHandler();
});
