// countdown.js - Enhanced version
class SpaceCountdown {
    constructor() {
        this.basePrice = 250000; // Base space ticket price
        this.targetPrice = 5000; // Target affordable price
        this.countdown = {
            years: 0,
            months: 0,
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0
        };
        this.personalCountdown = {
            years: 0,
            months: 0,
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0
        };
        this.hasPersonalPlan = false;
        this.initializeCountdown();
        this.setupEventListeners();
    }

    initializeCountdown() {
        // Check for user's subscription data
        const userData = JSON.parse(localStorage.getItem('selectedPlan'));
        const assessment = JSON.parse(localStorage.getItem('assessment'));
        
        // Always set default countdown first
        this.setDefaultCountdown();
        
        // Then calculate personal countdown if data exists
        if (userData) {
            this.hasPersonalPlan = true;
            this.adjustCountdownBasedOnPlan(userData, assessment);
        }
        
        this.startCountdown();
    }

    setupEventListeners() {
        // Listen for plan selection events
        window.addEventListener('planSelected', (event) => {
            const planData = event.detail || {};
            localStorage.setItem('selectedPlan', JSON.stringify(planData));
            this.hasPersonalPlan = true;
            
            const assessment = JSON.parse(localStorage.getItem('assessment'));
            this.adjustCountdownBasedOnPlan(planData, assessment);
            
            // Update credits display if available
            const creditsDisplay = document.getElementById('credits-display');
            if (creditsDisplay && planData.credits) {
                creditsDisplay.textContent = `Your SharedStars Credits: ${planData.credits}`;
            }
            
            // Add highlight effect to personal countdown
            this.highlightPersonalCountdown();
        });
    }

    highlightPersonalCountdown() {
        // Add visual highlight when personal countdown updates
        const countdown = document.getElementById('personal-countdown');
        if (countdown) {
            countdown.classList.add('highlight-update');
            setTimeout(() => {
                countdown.classList.remove('highlight-update');
            }, 2000);
        }
    }

    adjustCountdownBasedOnPlan(plan, assessment) {
        // Base countdown reduction percentages
        const reductions = {
            individual: 0,    // Base timeline
            family: 15,       // 15% faster
            elite: 50,        // 50% faster
            custom: 25        // Default for custom plans
        };

        // Use plan.type if available, otherwise fall back to plan itself if it's a string
        const planType = plan.type || plan;
        
        // Get reduction percentage, fallback to 0 if not found
        const baseReduction = reductions[planType] || 0;
        
        // Additional reductions based on assessment
        let additionalReduction = 0;
        if (assessment) {
            if (assessment.experience === 'Professional') additionalReduction += 10;
            if (assessment.commitment === 'Full-time') additionalReduction += 10;
            // Add more factors as needed
        }
        
        // Calculate total reduction
        const totalReduction = baseReduction + additionalReduction;
        
        // Adjust base countdown
        const baseYears = 13; // Your default countdown
        const adjustedYears = Math.max(1, baseYears * (1 - totalReduction/100));
        
        // Set personal countdown values
        this.setPersonalCountdownValues(adjustedYears);
    }

    setDefaultCountdown() {
        // Default countdown for non-subscribed users
        const now = new Date();
        const targetDate = new Date();
        targetDate.setFullYear(targetDate.getFullYear() + 13); // 13 years default
        this.updateDefaultCountdown(targetDate - now);
    }
    
    setPersonalCountdownValues(years) {
        const now = new Date();
        const targetDate = new Date();
        targetDate.setFullYear(targetDate.getFullYear() + years);
        this.updatePersonalCountdown(targetDate - now);
    }
    
    updateDefaultCountdown(timeLeft) {
        this.countdown = this.calculateTimeUnits(timeLeft);
    }
    
    updatePersonalCountdown(timeLeft) {
        this.personalCountdown = this.calculateTimeUnits(timeLeft);
    }
    
    calculateTimeUnits(timeLeft) {
        // Ensure timeLeft is positive
        timeLeft = Math.max(0, timeLeft);
        
        const second = 1000;
        const minute = second * 60;
        const hour = minute * 60;
        const day = hour * 24;
        const year = day * 365;
        const month = day * 30;
        
        return {
            years: Math.floor(timeLeft / year),
            months: Math.floor((timeLeft % year) / month),
            days: Math.floor((timeLeft % month) / day),
            hours: Math.floor((timeLeft % day) / hour),
            minutes: Math.floor((timeLeft % hour) / minute),
            seconds: Math.floor((timeLeft % minute) / second)
        };
    }

    updateDisplay() {
        // Update global countdown display
        this.updateCountdownDisplay(this.countdown, 'baseline-countdown');
        
        // Update personal countdown if available
        if (this.hasPersonalPlan) {
            this.updateCountdownDisplay(this.personalCountdown, 'personal-countdown');
        } else {
            // Display placeholders for personal countdown
            document.querySelectorAll('#personal-countdown [data-countdown]').forEach(el => {
                el.textContent = '--';
            });
        }
    }
    
    updateCountdownDisplay(countdownData, countdownId) {
        // Update each unit in the countdown
        Object.entries(countdownData).forEach(([unit, value]) => {
            // Find all elements with the specific data-countdown attribute within the countdown ID
            const selector = countdownId ? 
                `#${countdownId} [data-countdown="${unit}"]` : 
                `[data-countdown="${unit}"]`;
            
            const elements = document.querySelectorAll(selector);
            
            elements.forEach(element => {
                // Format value with leading zeros
                const formattedValue = String(value).padStart(2, '0');
                
                // Only update if content has changed
                if (element.textContent !== formattedValue) {
                    element.textContent = formattedValue;
                    
                    // Add a brief animation to highlight the change
                    element.classList.add('digit-changed');
                    setTimeout(() => {
                        element.classList.remove('digit-changed');
                    }, 500);
                }
            });
        });
    }

    startCountdown() {
        setInterval(() => {
            // Always update the default countdown
            this.setDefaultCountdown();
            
            // Update personal countdown if data exists
            const userData = JSON.parse(localStorage.getItem('selectedPlan'));
            const assessment = JSON.parse(localStorage.getItem('assessment'));
            
            if (userData) {
                this.hasPersonalPlan = true;
                this.adjustCountdownBasedOnPlan(userData, assessment);
            }
            
            // Update the display
            this.updateDisplay();
        }, 1000);
    }
}

// Initialize when document loads
document.addEventListener('DOMContentLoaded', () => {
    new SpaceCountdown();
    
    // Setup plan selection buttons if they exist
    document.querySelectorAll('.plan-button').forEach(button => {
        button.addEventListener('click', function() {
            const planType = this.getAttribute('data-plan');
            
            // Build plan data object
            const planData = {
                type: planType,
                selected: new Date().toISOString()
            };
            
            // Add credits based on plan type
            switch(planType) {
                case 'individual':
                    planData.credits = 100;
                    break;
                case 'family':
                    planData.credits = 250;
                    break;
                case 'elite':
                    planData.credits = 1000;
                    break;
                case 'custom':
                    const amount = parseInt(document.getElementById('customAmount')?.value || 50);
                    planData.credits = amount * 2;
                    break;
            }
            
            // Dispatch custom event with plan data
            const event = new CustomEvent('planSelected', { detail: planData });
            window.dispatchEvent(event);
        });
    });
});