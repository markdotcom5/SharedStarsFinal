console.log('File loaded:', 'trialFlow.js');  // Add to trialFlow.js

class AIGuidanceHandler {
    constructor() {
        this.initialized = false;
        this.sessionData = null;
        console.log('AI Guidance Handler initialized');
    }

    async showAIWelcomeExperience() {
        try {
            console.log('Showing AI Welcome Experience...');
            const overlay = document.createElement('div');
            overlay.className = 'ai-welcome-overlay';

            // Add inline styles for visibility
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.95);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            `;

            // Add content to the overlay
            overlay.innerHTML = `
                <div class="ai-welcome-content" style="
                    background: rgba(0, 0, 0, 0.8);
                    padding: 2rem;
                    border-radius: 15px;
                    border: 1px solid #00ffff;
                    max-width: 600px;
                    width: 90%;
                    color: white;
                    text-align: center;
                ">
                    <h2>Initializing Your AI Personal Coach</h2>
                    <div class="ai-initialization-steps">
                        <div class="step" style="opacity: 0; transform: translateY(20px);">
                            <div class="step-icon">⚡</div>
                            <p>Connecting to AI Training Systems</p>
                        </div>
                        <div class="step" style="opacity: 0; transform: translateY(20px);">
                            <div class="step-icon">🔍</div>
                            <p>Building Your Personal Training Profile</p>
                        </div>
                        <div class="step" style="opacity: 0; transform: translateY(20px);">
                            <div class="step-icon">🎯</div>
                            <p>Preparing Customized Training Path</p>
                        </div>
                    </div>
                    <div class="subscription-prompt" style="display: none; margin-top: 2rem;">
                        <h3 style="color: #00ffff; margin-bottom: 1rem;">Secure Your Place in Space History</h3>
                        <div class="price-tag" style="font-size: 1.5rem; margin: 1rem 0;">
                            $49.99/month
                        </div>
                        <div class="benefits" style="text-align: left; margin: 1rem 0;">
                            <ul style="list-style: none; padding: 0;">
                                <li style="margin: 0.5rem 0;">✓ Personal AI Space Training Coach</li>
                                <li style="margin: 0.5rem 0;">✓ Priority Access to New Modules</li>
                                <li style="margin: 0.5rem 0;">✓ Exclusive Community Access</li>
                                <li style="margin: 0.5rem 0;">✓ Track Your Journey to Space</li>
                            </ul>
                        </div>
                        <button class="subscribe-btn" style="
                            background: #00ffff;
                            color: black;
                            border: none;
                            padding: 1rem 2rem;
                            border-radius: 5px;
                            font-weight: bold;
                            cursor: pointer;
                            margin: 1rem 0;
                        ">Join the Program</button>
                        <p style="color: #ff4444; font-size: 0.9rem;">Limited spots available at this rate</p>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);
            console.log('AI Welcome overlay added to document');

            const steps = overlay.querySelectorAll('.step');
            console.log('Found steps:', steps);

            if (!steps || steps.length === 0) {
                console.warn('No steps found in the overlay');
                return;
            }

            // Animate steps sequentially
            steps.forEach((step, index) => {
                setTimeout(() => {
                    step.style.opacity = '1';
                    step.style.transform = 'translateY(0)';
                    console.log(`Step ${index + 1} activated`);

                    if (index === steps.length - 1) {
                        console.log('All steps completed. Preparing to display subscription prompt...');
                        const subscriptionPrompt = overlay.querySelector('.subscription-prompt');
                        if (subscriptionPrompt) {
                            subscriptionPrompt.style.display = 'block';
                            subscriptionPrompt.style.opacity = '1';
                            console.log('Subscription prompt displayed');
                        } else {
                            console.error('Subscription prompt not found.');
                        }
                    }
                }, index * 1000);
            });

            // Handle subscription button click
            const subscribeBtn = overlay.querySelector('.subscribe-btn');
            if (subscribeBtn) {
                console.log('Subscribe button found');
                subscribeBtn.addEventListener('click', () => {
                    console.log('Subscribe button clicked');
                    window.location.href = '/subscribe';
                });
            } else {
                console.error('Subscribe button not found');
            }
        } catch (error) {
            console.error('Error showing AI Welcome Experience:', error);
            alert('There was an error initializing the AI Guide. Please try again.');
        }
    }

    async startFreeTrial() {
        try {
            console.log('Starting free trial');
            const aiGuidance = document.getElementById('ai-guidance');
            if (aiGuidance) {
                aiGuidance.classList.remove('hidden');
                aiGuidance.innerHTML = `
                    <div class="ai-welcome-message">
                        <h3>Welcome to Your AI-Guided Space Journey</h3>
                        <p>I'll be your personal AI guide on your path to becoming space-ready.</p>
                        <button class="begin-assessment-btn">Begin Assessment</button>
                    </div>
                `;

                const assessmentBtn = aiGuidance.querySelector('.begin-assessment-btn');
                if (assessmentBtn) {
                    console.log('Assessment button found');
                    assessmentBtn.addEventListener('click', () => {
                        console.log('Assessment button clicked');
                        this.beginAssessment();
                    });
                } else {
                    console.error('Assessment button not found');
                }
            }
        } catch (error) {
            console.error('Error starting trial:', error);
        }
    }

    beginAssessment() {
        console.log('Beginning assessment');
        alert('Starting your personalized assessment...');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing AI Guidance Handler');
    window.aiGuidance = new AIGuidanceHandler();
});
