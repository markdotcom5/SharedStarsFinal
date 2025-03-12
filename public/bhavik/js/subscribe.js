class PriceEvolutionChart {
    constructor() {
        // Existing initialization
        this.stripe = Stripe(process.env.STRIPE_PUBLISHABLE_KEY);
        this.elements = this.stripe.elements();
        this.card = this.elements.create('card');
        this.setupStripeElements();
    }

    setupStripeElements() {
        this.card.mount('#card-element');
        this.card.addEventListener('change', this.handleCardChange);
    }

    async handlePlanSelection(planType, button) {
        try {
            const { paymentMethod } = await this.stripe.createPaymentMethod({
                type: 'card',
                card: this.card
            });

            const response = await fetch('/api/subscription/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paymentMethodId: paymentMethod.id,
                    plan: planType
                })
            });

            const { clientSecret, subscriptionId } = await response.json();
            const { error } = await this.stripe.confirmCardPayment(clientSecret);

            if (error) throw new Error(error.message);

            await this.updateSubscriptionStatus(subscriptionId, 'active');
            this.updateChart(planType);
            this.updatePersonalCountdown(planType);

        } catch (error) {
            console.error('Payment failed:', error);
            this.showError(error.message);
        }
    }

    initializePlanListeners() {
        const planButtons = document.querySelectorAll('.plan-select-btn');
        planButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                const planType = button.getAttribute('data-plan');
                if (planType) {
                    await this.handlePlanSelection(planType, button);
                }
            });
        });
    }
}
    getChartData(selectedPlan = null) {
        const basePrice = 450000;
        const years = [2024, 2027, 2030, 2035, 2039];
        
        const basePrices = years.map(year => {
            const yearsFromStart = year - 2024;
            return basePrice * Math.pow(0.85, yearsFromStart);
        });

        const datasets = [{
            label: 'Standard Journey',
            data: basePrices,
            borderColor: 'rgb(156, 163, 175)',
            backgroundColor: 'rgba(156, 163, 175, 0.1)',
            borderWidth: 2,
            tension: 0.4
        }];

        if (selectedPlan) {
            const planConfigs = {
                individual: {
                    rate: 0.75,
                    color: 'rgb(59, 130, 246)',
                    label: 'Explorer Path'
                },
                family: {
                    rate: 0.70,
                    color: 'rgb(139, 92, 246)',
                    label: 'Pioneer Path'
                },
                elite: {
                    rate: 0.55,
                    color: 'rgb(234, 179, 8)',
                    label: 'Elite Path'
                }
            };

            const config = planConfigs[selectedPlan];
            if (config) {
                datasets.push({
                    label: config.label,
                    data: years.map(year => {
                        const yearsFromStart = year - 2024;
                        return basePrice * Math.pow(config.rate, yearsFromStart);
                    }),
                    borderColor: config.color,
                    backgroundColor: `${config.color.replace('rgb', 'rgba').replace(')', ', 0.1)')}`,
                    borderWidth: 3,
                    tension: 0.4,
                    pointStyle: 'star'
                });
            }
        }

        return { labels: years, datasets };
    }

    initializeBaselineTimer() {
        const targetDate = new Date('2039-01-01');
        
        const updateTimer = () => {
            const now = new Date();
            const timeLeft = targetDate - now;
            
            const years = Math.floor(timeLeft / (365.25 * 24 * 60 * 60 * 1000));
            const months = Math.floor((timeLeft % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));
            const days = Math.floor((timeLeft % (30.44 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000));
            const hours = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
            const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
            const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);
    
            document.querySelector('[data-base-timer="years"]').textContent = years.toString().padStart(2, '0');
            document.querySelector('[data-base-timer="months"]').textContent = months.toString().padStart(2, '0');
            document.querySelector('[data-base-timer="days"]').textContent = days.toString().padStart(2, '0');
            document.querySelector('[data-base-timer="hours"]').textContent = hours.toString().padStart(2, '0');
            document.querySelector('[data-base-timer="minutes"]').textContent = minutes.toString().padStart(2, '0');
            document.querySelector('[data-base-timer="seconds"]').textContent = seconds.toString().padStart(2, '0');
        };
    
        updateTimer();
        this.baselineCountdownInterval = setInterval(updateTimer, 1000);
    }
    updateChart(planType) {
        if (!this.chart) return;
        
        this.currentPlan = planType;
        const newData = this.getChartData({ type: planType });  // Fixed argument structure
        this.chart.data = newData;
        this.chart.update('active');
        
        const personalCountdown = document.getElementById('personal-countdown');
        if (personalCountdown) {
            personalCountdown.style.display = 'block';
            this.updatePersonalCountdown(planType);
        }
    }
    
    updatePersonalCountdown(planType) {
        const accelerationRates = {
            individual: 0.25,
            family: 0.40,
            elite: 0.80
        };
    
        const baseYears = 15;
        const reduction = accelerationRates[planType] || 0;
        const adjustedYears = Math.ceil(baseYears * (1 - reduction));
    
        const targetDate = new Date();
        targetDate.setFullYear(targetDate.getFullYear() + adjustedYears);
        this.startPersonalCountdown(targetDate);
    
        const percentageEl = document.querySelector('.acceleration-percentage');
        if (percentageEl) {
            percentageEl.textContent = `${Math.round(reduction * 100)}`;
        }
    }
    
    startPersonalCountdown(targetDate) {
        if (this.personalCountdownInterval) {
            clearInterval(this.personalCountdownInterval);
        }
    
        const updateTimer = () => {
            const now = new Date();
            const timeLeft = targetDate - now;
    
            const units = {
                years: Math.floor(timeLeft / (365.25 * 24 * 60 * 60 * 1000)),
                months: Math.floor((timeLeft % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000)),
                days: Math.floor((timeLeft % (30.44 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000)),
                hours: Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)),
                minutes: Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000)),
                seconds: Math.floor((timeLeft % (60 * 1000)) / 1000)
            };
    
            Object.entries(units).forEach(([unit, value]) => {
                const element = document.querySelector(`[data-personal-countdown="${unit}"]`);
                if (element) {
                    element.textContent = value.toString().padStart(2, '0');
                    element.classList.remove('text-gray-400');
                    element.classList.add('text-blue-800');
                }
            });
        };
    
        updateTimer();
        this.personalCountdownInterval = setInterval(updateTimer, 1000);
    }
    
    // Replace your current initializePlanListeners() method
    initializePlanListeners() {
        console.log('Initializing plan listeners');
        const planButtons = document.querySelectorAll('.plan-select-btn');  // Match HTML class
        planButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const planType = button.getAttribute('data-plan');
                if (planType) {
                    console.log('Plan selected:', planType);
                    this.chart.data = this.getChartData({ type: planType });
                    this.chart.update('active');
                    
                    const personalCountdown = document.getElementById('personal-countdown');
                    if (personalCountdown) {
                        personalCountdown.style.display = 'block';
                        this.updatePersonalCountdown(planType);
                    }
                }
            });
        });
    }
// Initialize when document loads
document.addEventListener('DOMContentLoaded', () => {
    new PriceEvolutionChart();
});