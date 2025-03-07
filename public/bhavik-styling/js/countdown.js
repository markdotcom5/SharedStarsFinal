// countdown.js
class SpaceCountdown {
    constructor() {
        this.basePrice = 250000; // Base space ticket price
        this.targetPrice = 5000;  // Target affordable price
        this.countdown = {
            years: 0,
            months: 0,
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0
        };
        
        this.initializeCountdown();
    }

    initializeCountdown() {
        // Check for user's subscription data
        const userData = JSON.parse(localStorage.getItem('selectedPlan'));
        const assessment = JSON.parse(localStorage.getItem('assessment'));
        
        if (userData) {
            this.adjustCountdownBasedOnPlan(userData, assessment);
        } else {
            this.setDefaultCountdown();
        }

        this.startCountdown();
    }

    adjustCountdownBasedOnPlan(plan, assessment) {
        // Base countdown reduction percentages
        const reductions = {
            individual: 0,      // Base timeline
            family: 15,         // 15% faster
            elite: 50          // 50% faster
        };

        // Additional reductions based on assessment
        let additionalReduction = 0;
        if (assessment) {
            if (assessment.experience === 'Professional') additionalReduction += 10;
            if (assessment.commitment === 'Full-time') additionalReduction += 10;
        }

        // Calculate total reduction
        const totalReduction = reductions[plan.type] + additionalReduction;
        
        // Adjust base countdown
        const baseYears = 13; // Your default countdown
        const adjustedYears = Math.max(1, baseYears * (1 - totalReduction/100));
        
        // Set countdown values
        this.setCountdownValues(adjustedYears);
    }

    setDefaultCountdown() {
        // Default countdown for non-subscribed users
        this.setCountdownValues(13); // 13 years default
    }

    setCountdownValues(years) {
        const now = new Date();
        const targetDate = new Date();
        targetDate.setFullYear(targetDate.getFullYear() + years);
        
        this.updateCountdown(targetDate - now);
    }

    updateCountdown(timeLeft) {
        const second = 1000;
        const minute = second * 60;
        const hour = minute * 60;
        const day = hour * 24;
        const year = day * 365;
        const month = day * 30;

        this.countdown = {
            years: Math.floor(timeLeft / year),
            months: Math.floor((timeLeft % year) / month),
            days: Math.floor((timeLeft % month) / day),
            hours: Math.floor((timeLeft % day) / hour),
            minutes: Math.floor((timeLeft % hour) / minute),
            seconds: Math.floor((timeLeft % minute) / second)
        };

        this.updateDisplay();
    }

    updateDisplay() {
        // Update each countdown box
        Object.entries(this.countdown).forEach(([unit, value]) => {
            const element = document.querySelector(`[data-countdown="${unit}"]`);
            if (element) {
                element.textContent = String(value).padStart(2, '0');
            }
        });
    }

    startCountdown() {
        setInterval(() => {
            const userData = JSON.parse(localStorage.getItem('selectedPlan'));
            const assessment = JSON.parse(localStorage.getItem('assessment'));
            
            if (userData) {
                this.adjustCountdownBasedOnPlan(userData, assessment);
            } else {
                const now = new Date();
                const targetDate = new Date(now.getFullYear() + 13, now.getMonth(), now.getDate());
                this.updateCountdown(targetDate - now);
            }
        }, 1000);
    }
}

// Initialize when document loads
document.addEventListener('DOMContentLoaded', () => {
    new SpaceCountdown();
});