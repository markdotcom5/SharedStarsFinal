// In js/main.js
// public/js/main.js
import * as Training from './modules/training/index.js';
import * as Core from './modules/core/index.js';
import * as Visualizations from './visualizations/index.js';
import * as UI from './modules/ui/index.js';

class SharedStarsApp {
    constructor() {
        this.training = {
            handler: new Training.TrainingHandler(),
            ai: new Training.AIGuidanceSystem(),
            fsd: new Training.FSDTraining(),
            interface: new Training.ModuleInterface(),
            progress: new Training.ProgressAssessment()
        };

        this.core = {
            timeline: new Core.SpaceTimelineManager(),
            achievements: new Core.AchievementHandler()
        };

        this.visuals = {
            ai: new Visualizations.AIAssistant(),
            progress: new Visualizations.ProgressTracker(),
            achievements: new Visualizations.AchievementDisplay()
        };
    }

    async initialize() {
        // Connect all systems
        await this.training.handler.initialize();
        await this.core.timeline.initialize();
        await this.visuals.ai.initialize();

        // Set up event listeners and connections
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Connect training progress to timeline
        this.training.progress.onUpdate((progress) => {
            this.core.timeline.updateProgress(progress);
            this.visuals.progress.update(progress);
        });

        // Connect AI guidance to visual display
        this.training.ai.onGuidance((guidance) => {
            this.visuals.ai.displayGuidance(guidance);
        });

        // Connect achievements
        this.core.achievements.onAchievement((achievement) => {
            this.visuals.achievements.display(achievement);
            this.core.timeline.awardCredits(achievement.credits);
        });
    }
}
import '/js/languageSelection.js';
import { initAPI } from './modules/core/dashboard.js';
import { initAuth } from './modules/auth/signup.js';
import '/js/languageSelection.js'; // This will run the language system

document.addEventListener('DOMContentLoaded', () => {
    initAPI();
  initAuth();
  // other initialization code...
});

// js/main.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing UI Handler');

    // Cache DOM elements
    const ui = {
        video: document.getElementById('heroVideo'),
        menuToggle: document.getElementById('menuToggle'),
        menuOverlay: document.getElementById('menuOverlay'),
        closeMenu: document.getElementById('closeMenu'),
        toggleOptions: document.querySelectorAll('.toggle-option'),
        signupDialog: document.getElementById('signupDialog')
    };

    // Menu functionality
    if (ui.menuToggle && ui.menuOverlay) {
        ui.menuToggle.addEventListener('click', () => {
            ui.menuOverlay.classList.remove('translate-x-full');
            document.body.style.overflow = 'hidden';
        });

        ui.closeMenu.addEventListener('click', () => {
            ui.menuOverlay.classList.add('translate-x-full');
            document.body.style.overflow = '';
        });
    }

    // Video initialization
    if (ui.video) {
        ui.video.play().catch(error => {
            console.error('❌ Video error:', error);
            ui.video.closest('.video-container').style.backgroundColor = '#000';
        });
    }

    // Training Toggle: Example of mode selection
    document.querySelectorAll('.toggle-option').forEach(option => {
        option.addEventListener('click', function() {
            const mode = this.getAttribute('data-mode');
            localStorage.setItem('trainingMode', mode);
            if (mode === 'ai') {
                window.location.href = '/ai-training';
            } else {
                openSignupPopup();
            }
        });
    });

     // Function definitions for AI Welcome Experience, Assessment, Signup Popup, etc.
     async function showAIWelcomeExperience() {
        console.log('Initializing AI Welcome Experience...');

        
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'ai-modal-overlay fixed inset-0 bg-black/50 flex justify-center items-center z-50';

        const modalContent = document.createElement('div');
        modalContent.className = 'ai-modal-content bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto text-center';
        
        modalContent.innerHTML = `
            <h2 class="text-2xl font-bold text-gray-900">Initializing Your AI Personal Coach</h2>
            <div class="ai-initialization-steps">
                <div class="step"><div class="step-icon">⚡</div> Connecting to AI Training Systems</div>
                <div class="step"><div class="step-icon">🔍</div> Building Your Personal Training Profile</div>
                <div class="step"><div class="step-icon">🎯</div> Preparing Customized Training Path</div>
            </div>
            <button class="close-ai-modal bg-gray-300 mt-4 px-4 py-2 rounded-lg hover:bg-gray-400">Close</button>
        `;

        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        // Animate steps
        const steps = modalContent.querySelectorAll('.step');
        for (let i = 0; i < steps.length; i++) {
            steps[i].classList.add('active');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        modalContent.querySelector(".close-ai-modal").addEventListener("click", () => {
            modalOverlay.remove();
        });
    }

    // ✅ Initialize Training Assessment
    async function startAssessment() {
        console.log('Starting assessment...');
        const overlay = document.querySelector('.mode-overlay');

        const assessmentQuestions = [
            { question: "What is your primary motivation for space training?", options: ["Space Tourism", "Professional Development", "Research & Science", "Space Colonization"] },
            { question: "What's your current fitness level?", options: ["Beginner", "Intermediate", "Advanced", "Professional Athlete"] },
            { question: "What's your background in space-related studies?", options: ["No Experience", "Self-Taught Enthusiast", "Academic Background", "Industry Professional"] }
        ];

        showAssessmentQuestion(overlay, assessmentQuestions[0]);
    }

    async function showAssessmentQuestion(modalContent, questionData) {
        modalContent.innerHTML = `
            <div class="assessment-interface">
                <h2>Space Training Assessment</h2>
                <p>${questionData.question}</p>
                <div class="options">
                    ${questionData.options.map(option => `<button class="option-btn">${option}</button>`).join('')}
                </div>
            </div>
        `;

        modalContent.querySelectorAll('.option-btn').forEach(button => {
            button.addEventListener('click', () => {
                handleAssessmentAnswer(button.textContent, modalContent);
            });
        });
    }

    async function handleAssessmentAnswer(answer, modalContent) {
        console.log(`User selected: ${answer}`);
        modalContent.innerHTML = `<h2>Thank you for completing the assessment!</h2>`;
    }

    // ✅ Initialize Signup Popup
    function openSignupPopup() {
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
// Retrieve stored authentication token
const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

if (!token) {
    console.error("❌ No authentication token found. WebSocket connection may fail.");
}

// Connect WebSocket with authentication token
const socket = new WebSocket(`ws://${window.location.host}/ws?token=${encodeURIComponent(token)}`);

socket.onopen = () => console.log("✅ Connected to WebSocket Server with Authentication");

socket.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        console.log("📡 WebSocket Message Received:", data);
    } catch (error) {
        console.error("❌ WebSocket Error:", error);
    }
};

socket.onerror = (error) => console.error("❌ WebSocket Error:", error);
socket.onclose = () => console.warn("⚠️ WebSocket Disconnected");

// Function to begin training journey
async function beginTrainingJourney() {
    console.log('🚀 Beginning training journey...');
    const overlay = document.querySelector('.mode-overlay');

    if (!overlay) {
        console.error("❌ Error: Overlay element not found.");
        return;
    }

    overlay.innerHTML = `
        <div class="training-interface">
            <h2 class="text-xl font-bold text-gray-900">Module 1: Introduction to Space</h2>
            <div class="training-content p-4">
                <div class="lesson-progress mb-4">
                    <div class="progress-bar w-full bg-gray-200 rounded">
                        <div class="progress bg-blue-600 h-2 rounded transition-all duration-300" style="width: 0%"></div>
                    </div>
                    <p class="text-gray-600 mt-2">Progress: <span id="lessonProgressCount">0</span>/5 Lessons Complete</p>
                </div>
                <div class="current-lesson p-4 bg-white shadow rounded">
                    <h3 class="text-lg font-semibold text-gray-800">Lesson 1: Basic Space Concepts</h3>
                    <div class="lesson-content mt-2">
                        <p>Let's start with fundamental concepts about space...</p>
                        <button class="next-lesson-btn bg-blue-500 text-white px-4 py-2 mt-4 rounded hover:bg-blue-700 transition">Start Lesson</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Attach event listener to Start Lesson button
    document.querySelector('.next-lesson-btn')?.addEventListener('click', () => {
        startLesson(1);
    });
}

// Function to start a lesson
async function startLesson(lessonNumber) {
    try {
        console.log(`📖 Starting Lesson ${lessonNumber}...`);

        const lessons = {
            1: {
                title: "Basic Space Concepts",
                sections: [
                    { type: "intro", content: "Welcome to your first space training lesson. Today we'll cover fundamental concepts about space and space travel." },
                    { type: "content", title: "What is Space?", content: "Space begins at the Kármán line, approximately 100 kilometers (62 miles) above Earth's surface. This is where Earth's atmosphere becomes too thin for conventional aircraft to maintain lift." },
                    { type: "interactive", question: "At what height does space begin?", options: ["50 kilometers", "100 kilometers (Kármán line)", "150 kilometers", "200 kilometers"], correct: 1 },
                    { type: "video_placeholder", description: "Space Environment Visualization", content: "This simulation shows the transition from Earth's atmosphere to space." },
                    { type: "summary", content: "You've learned about the basic definition of space and where it begins. In the next lesson, we'll explore the challenges of surviving in this environment." }
                ],
                duration: "20 minutes",
                nextLesson: "Space Environment Challenges"
            }
        };

        if (!lessons[lessonNumber]) {
            console.error(`❌ Error: Lesson ${lessonNumber} not found.`);
            return;
        }

        const lesson = lessons[lessonNumber];
        const overlay = document.querySelector('.mode-overlay');

        if (!overlay) {
            console.error("❌ Error: Overlay element not found.");
            return;
        }

        overlay.innerHTML = `
            <div class="lesson-interface p-6 bg-white rounded shadow-lg max-w-lg mx-auto">
                <h2 class="text-xl font-bold text-gray-900">${lesson.title}</h2>
                <div id="lessonContent" class="lesson-content mt-4"></div>
                <button id="nextSectionBtn" class="hidden bg-blue-500 text-white px-4 py-2 mt-4 rounded hover:bg-blue-700 transition">Next</button>
            </div>
        `;

        const contentContainer = overlay.querySelector("#lessonContent");
        const nextBtn = overlay.querySelector("#nextSectionBtn");

        let currentSectionIndex = 0;

        function loadSection() {
            if (currentSectionIndex >= lesson.sections.length) {
                overlay.innerHTML = `
                    <div class="lesson-complete p-6 bg-green-100 text-green-800 rounded shadow-md text-center">
                        <h2 class="text-xl font-bold">🎉 Lesson Complete!</h2>
                        <p class="mt-2">You've completed <strong>${lesson.title}</strong>. Your next lesson is: <strong>${lesson.nextLesson}</strong>.</p>
                        <button class="continue-btn bg-green-500 text-white px-4 py-2 mt-4 rounded hover:bg-green-700 transition">Continue</button>
                    </div>
                `;

                // Progress bar update
                const progressElement = document.querySelector(".progress");
                const progressCount = document.querySelector("#lessonProgressCount");
                if (progressElement && progressCount) {
                    progressElement.style.width = `100%`;
                    progressCount.textContent = "5"; // Mark lesson complete
                }

                overlay.querySelector(".continue-btn").addEventListener("click", () => {
                    beginTrainingJourney();
                });

                return;
            }

            const section = lesson.sections[currentSectionIndex];
            contentContainer.innerHTML = "";

            switch (section.type) {
                case "content":
                    contentContainer.innerHTML = `<h3 class="text-lg font-semibold">${section.title}</h3><p class="text-gray-700 mt-2">${section.content}</p>`;
                    break;
                case "interactive":
                    contentContainer.innerHTML = `
                        <h3 class="text-lg font-semibold">${section.question}</h3>
                        <div class="options mt-2">
                            ${section.options.map((option, index) => 
                                `<button class="option-btn bg-gray-200 px-4 py-2 rounded m-1 hover:bg-gray-300" data-index="${index}">${option}</button>`
                            ).join("")}
                        </div>
                    `;

                    contentContainer.querySelectorAll(".option-btn").forEach(button => {
                        button.addEventListener("click", () => {
                            const selected = parseInt(button.dataset.index);
                            button.classList.add(selected === section.correct ? "bg-green-500 text-white" : "bg-red-500 text-white");

                            setTimeout(() => {
                                currentSectionIndex++;
                                loadSection();
                            }, 2000);
                        });
                    });
                    return;
                case "video_placeholder":
                    contentContainer.innerHTML = `<h3 class="text-lg font-semibold">${section.description}</h3><p class="text-gray-700 mt-2">${section.content}</p><div class="video-placeholder bg-gray-300 h-40 flex items-center justify-center mt-2">🎥 Video Placeholder</div>`;
                    break;
                case "summary":
                    contentContainer.innerHTML = `<h3 class="text-lg font-semibold">Lesson Summary</h3><p class="text-gray-700 mt-2">${section.content}</p>`;
                    break;
                default:
                    console.warn(`⚠️ Unknown section type: ${section.type}`);
            }

            nextBtn.classList.remove("hidden");
            nextBtn.onclick = () => {
                currentSectionIndex++;
                loadSection();
            };
        }

        loadSection();

    } catch (error) {
        console.error("❌ Error in startLesson:", error);
    }
}

        overlay.innerHTML = `
            <div class="lesson-interface">
                <div class="lesson-header">
                    <h2>${lesson.title}</h2>
                    <div class="lesson-info">
                        <span>Duration: ${lesson.duration}</span>
                        <span>Progress: 0/${lesson.sections.length}</span>
                    </div>
                </div>
                <div class="lesson-content">
                    <div class="section active">
                        ${this.renderSection(lesson.sections[0])}
                    </div>
                    <div class="lesson-navigation">
                        <button class="prev-btn" disabled>Previous</button>
                        <button class="next-btn">Next</button>
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress" style="width: 0%"></div>
                </div>
            </div>
        `;

        document.addEventListener("DOMContentLoaded", function () {
            console.log("✅ JavaScript Loaded - Ensuring all buttons work properly...");
        
            class TrainingHandler {
                constructor() {
                    this.currentSectionIndex = 0;
                    this.isShowingAI = false;
                }
        
                initializeLessonControls(lesson) {
                    const nextBtn = document.querySelector('.next-btn');
                    const prevBtn = document.querySelector('.prev-btn');
                    const progressBar = document.querySelector('.progress');
        
                    if (!nextBtn || !prevBtn || !progressBar) {
                        console.warn("⚠️ Lesson controls not found. Skipping initialization.");
                        return;
                    }
        
                    const updateButtons = () => {
                        prevBtn.disabled = this.currentSectionIndex === 0;
                        nextBtn.textContent = this.currentSectionIndex === lesson.sections.length - 1 ? 'Complete Lesson' : 'Next';
                    };
        
                    nextBtn.addEventListener('click', () => {
                        if (this.currentSectionIndex < lesson.sections.length - 1) {
                            this.currentSectionIndex++;
                            this.updateSection(lesson.sections[this.currentSectionIndex], this.currentSectionIndex, lesson.sections.length);
                            updateButtons();
                        } else {
                            this.completeLessonAndShowNext(lesson);
                        }
                    });
        
                    prevBtn.addEventListener('click', () => {
                        if (this.currentSectionIndex > 0) {
                            this.currentSectionIndex--;
                            this.updateSection(lesson.sections[this.currentSectionIndex], this.currentSectionIndex, lesson.sections.length);
                            updateButtons();
                        }
                    });
        
                    updateButtons();
                }
        
                updateSection(section, currentIndex, totalSections) {
                    const contentArea = document.querySelector('.lesson-content .section');
                    if (!contentArea) {
                        console.error("❌ Lesson content area not found!");
                        return;
                    }
                    contentArea.innerHTML = this.renderSection(section);
        
                    const progress = ((currentIndex + 1) / totalSections) * 100;
                    document.querySelector('.progress').style.width = `${progress}%`;
                    document.querySelector('.lesson-info span:last-child').textContent = `Progress: ${currentIndex + 1}/${totalSections}`;
                }
        
                async completeLessonAndShowNext(lesson) {
                    const overlay = document.querySelector('.mode-overlay');
                    if (!overlay) {
                        console.error("❌ Mode overlay not found!");
                        return;
                    }
        
                    overlay.innerHTML = `
                        <div class="lesson-complete">
                            <h2>🎉 Congratulations!</h2>
                            <p>You've completed: <strong>${lesson.title}</strong></p>
                            <div class="completion-stats">
                                <div class="stat">
                                    <span class="label">Time Spent</span>
                                    <span class="value">${lesson.duration}</span>
                                </div>
                                <div class="stat">
                                    <span class="label">Next Topic</span>
                                    <span class="value">${lesson.nextLesson}</span>
                                </div>
                            </div>
                            <button class="next-lesson-btn">Continue to Next Lesson</button>
                        </div>
                    `;
        
                    const nextLessonBtn = overlay.querySelector('.next-lesson-btn');
                    if (nextLessonBtn) {
                        nextLessonBtn.addEventListener('click', () => {
                            const nextLessonId = lesson.nextLessonId || 2;
                            this.startLesson(nextLessonId);
                        });
                    }
                }
        
                handleAIInitializationError(message) {
                    console.error('❌ AI Initialization Error:', message);
                    const errorMessage = document.createElement('div');
                    errorMessage.className = 'ai-error-message';
        
                    errorMessage.innerHTML = `
                        <div class="error-content">
                            <h3>Error</h3>
                            <p>${message}</p>
                            <button class="retry-button">Retry</button>
                        </div>
                    `;
        
                    document.body.appendChild(errorMessage);
        
                    const retryButton = errorMessage.querySelector('.retry-button');
                    if (retryButton) {
                        retryButton.addEventListener('click', () => {
                            errorMessage.remove();
                            this.showAIWelcomeExperience();
                        });
                    }
                }
        
                showSelfPacedWelcome() {
                    console.log('📚 Showing Self-Paced Welcome');
        
                    const overlay = document.createElement('div');
                    overlay.className = 'mode-overlay';
        
                    overlay.innerHTML = `
                        <div class="welcome-content">
                            <h2>Welcome to Self-Paced Training</h2>
                            <div class="training-introduction">
                                <div class="step active"><div class="step-icon">📚</div><p>Access structured learning modules at your own pace</p></div>
                                <div class="step active"><div class="step-icon">🎯</div><p>Track your progress through comprehensive training materials</p></div>
                                <div class="step active"><div class="step-icon">🚀</div><p>Complete training milestones on your schedule</p></div>
                            </div>
                            <button class="begin-training-btn">Start Training</button>
                        </div>
                    `;
        
                    document.body.appendChild(overlay);
        
                    const beginButton = overlay.querySelector('.begin-training-btn');
                    if (beginButton) {
                        beginButton.addEventListener('click', () => {
                            overlay.remove();
                            this.beginTrainingJourney();
                        });
                    }
                }
        
                handleAICoachMode() {
                    if (!this.isShowingAI) {
                        this.isShowingAI = true;
                        this.showAIWelcomeExperience()
                            .then(() => { this.isShowingAI = false; })
                            .catch(error => {
                                this.isShowingAI = false;
                                this.handleAIInitializationError('Failed to initialize AI experience');
                            });
                    }
                }
        
                handleSelfPacedMode() {
                    this.showSelfPacedWelcome();
                }
            }
        
            // ✅ Initialize training handler
            const trainingHandler = new TrainingHandler();
        
            // ✅ Attach event listeners to mode selection buttons
            const selfPacedButton = document.querySelector('#selfPacedMode');
            const aiCoachButton = document.querySelector('#aiCoachMode');
        
            if (selfPacedButton) {
                selfPacedButton.addEventListener('click', () => trainingHandler.handleSelfPacedMode());
            }
        
            if (aiCoachButton) {
                aiCoachButton.addEventListener('click', () => trainingHandler.handleAICoachMode());
            }
        
            console.log("🎯 UI Initialization Complete");
        });
        
    /** ==========================
     *  🔹 Navigation Buttons (Home, Academy, About, Subscribe)
     *  ========================== **/
    document.querySelectorAll("nav a").forEach(button => {
        button.addEventListener("click", function (event) {
            event.preventDefault();
            console.log(`✅ Navigating to: ${this.href}`);
            window.location.href = this.href;
        });
    });

    /** ==========================
     *  🔹 Signup Modal Controls
     *  ========================== **/
    const signupModal = document.getElementById("signup_modal");
    const openSignupModal = document.getElementById("openSignupModal");
    const closeSignupModal = document.getElementById("closeSignupModal");

    if (openSignupModal && signupModal) {
        openSignupModal.addEventListener("click", function () {
            signupModal.showModal();
        });
    } else {
        console.warn("⚠️ 'Open Signup Modal' button not found.");
    }

    if (closeSignupModal && signupModal) {
        closeSignupModal.addEventListener("click", function () {
            signupModal.close();
        });
    }
    
/** ==========================
 *  🔹 Begin Training Button
 *  ========================== **/
const beginTrainingBtns = document.querySelectorAll(".begin-training-btn");

if (beginTrainingBtns.length > 0) {
    beginTrainingBtns.forEach(button => {
        button.addEventListener("click", function () {
            console.log("🚀 Starting AI Training...");
            if (typeof showAIWelcomeExperience === "function") {
                showAIWelcomeExperience();
            } else {
                console.error("❌ Function 'showAIWelcomeExperience()' is not defined.");
                alert("Training function is unavailable at the moment.");
            }
        });
    });
} else {
    console.warn("⚠️ 'Begin Training' buttons not found!");
}
document.addEventListener('DOMContentLoaded', function() {
    const ui = {
        video: document.getElementById('heroVideo'),
        menuToggle: document.getElementById('menuToggle'),
        menuOverlay: document.getElementById('menuOverlay'),
        closeMenu: document.getElementById('closeMenu')
    };

    // Menu Toggle
    if (ui.menuToggle && ui.menuOverlay) {
        ui.menuToggle.addEventListener('click', () => {
            ui.menuOverlay.classList.remove('translate-x-full');
            document.body.style.overflow = 'hidden';
        });

        ui.closeMenu?.addEventListener('click', () => {
            ui.menuOverlay.classList.add('translate-x-full');
            document.body.style.overflow = '';
        });
    }

    // Video Loading
    if (ui.video) {
        ui.video.src = '/videos/academy10.mp4';
        ui.video.play().catch(console.error);
    }
});
/** ==========================
 *  🔹 Subscribe Button
 *  ========================== **/
const subscribeBtn = document.getElementById("subscribe-btn");
const subscribeInput = document.getElementById("subscribe-email");
const subscribeMessage = document.getElementById("subscribe-message");

if (subscribeBtn && subscribeInput && subscribeMessage) {
    subscribeBtn.addEventListener("click", function () {
        const email = subscribeInput.value.trim();

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert("❌ Please enter a valid email address.");
            return;
        }

        console.log(`✅ Subscribed with email: ${email}`);
        subscribeMessage.classList.remove("hidden");
        subscribeMessage.textContent = `✅ Subscribed successfully!`;
        subscribeInput.value = "";

        // Simulate an API call (for future backend integration)
        setTimeout(() => {
            console.log("📨 Simulating subscription email confirmation...");
        }, 1000);
    });
} else {
    console.warn("⚠️ Subscription elements not found!");
}

/** ==========================
 *  🔹 Password Validation
 *  ========================== **/
const passwordInput = document.getElementById("password");
const requirements = {
    length: document.getElementById("length-check"),
    uppercase: document.getElementById("uppercase-check"),
    lowercase: document.getElementById("lowercase-check"),
    number: document.getElementById("number-check"),
    special: document.getElementById("special-check"),
};

if (passwordInput && Object.values(requirements).every(el => el)) {
    passwordInput.addEventListener("input", function () {
        const password = this.value;

        const criteria = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*]/.test(password),
        };

        // Update UI dynamically
        for (const key in criteria) {
            requirements[key].style.color = criteria[key] ? "lime" : "red";
        }
    });
} else {
    console.warn("⚠️ Password validation elements not found!");
}

/** ==========================
 *  🔹 Signup Form Submission
 *  ========================== **/
const signupForm = document.getElementById("signup-form");

if (signupForm) {
    signupForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        console.log("🚀 Submitting signup form...");

        const formData = new FormData(signupForm);
        const userData = {
            username: formData.get("username").trim(),
            email: formData.get("email").trim(),
            password: formData.get("password").trim(),
        };

        if (!userData.username || !userData.email || !userData.password) {
            alert("❌ All fields are required.");
            return;
        }

        try {
            const response = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData),
            });

            const data = await response.json();
            if (data.success) {
                alert("✅ Signup Successful! Redirecting...");
                window.location.href = "/welcome.html";
            } else {
                throw new Error(data.message || "Signup failed.");
            }
        } catch (error) {
            console.error("❌ Signup failed:", error);
            alert("Signup failed: " + error.message);
        }
    });
} else {
    console.warn("⚠️ Signup form not found!");
}
// Initialize when document loads
document.addEventListener('DOMContentLoaded', async () => {
    window.app = new SharedStarsApp();
    await window.app.initialize();
});
