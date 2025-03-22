class SpaceCountdown {
    constructor() {
        this.basePrice = 250000; // Base space ticket price
        this.targetPrice = 5000;  // Target affordable price
        this.countdown = {
            years: 0,
            months: 0,
            weeks: 0,
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
        const week = day * 7;
        const year = day * 365;
        const month = day * 30;

        const years = Math.floor(timeLeft / year);
    timeLeft %= year;

    const months = Math.floor(timeLeft / month);
    timeLeft %= month;

    const weeks = Math.floor(timeLeft / week);
    timeLeft %= week;

    const days = Math.floor(timeLeft / day);
    timeLeft %= day;

    const hours = Math.floor(timeLeft / hour);
    timeLeft %= hour;

    const minutes = Math.floor(timeLeft / minute);
    timeLeft %= minute;

    const seconds = Math.floor(timeLeft / second);

    this.countdown = { years, months, weeks, days, hours, minutes, seconds };

    this.updateDisplay();
    }

    updateDisplay() {
        // Update each countdown box
        Object.entries(this.countdown).forEach(([unit, value]) => {
            const elements = document.querySelectorAll(`[data-countdown="${unit}"]`);
            elements.forEach(element => {
                element.textContent = String(value).padStart(2, '0');
            });
            // if (element) {
            //     element.textContent = String(value).padStart(2, '0');
            // }
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