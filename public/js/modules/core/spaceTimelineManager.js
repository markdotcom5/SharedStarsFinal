class SpaceTimelineManager {
  constructor() {
    // Initialize core properties
    this.totalCredits = 0;
    this.selectedPlan = null;
    this.baselineYears = 15;
    this.currentPlan = null;

    // Initialize Stripe (ensure STRIPE_PUBLISHABLE_KEY is available)
    this.stripe = Stripe(process.env.STRIPE_PUBLISHABLE_KEY);
    this.elements = this.stripe.elements();
    this.card = this.elements.create('card');

    // Setup initial state
    this.setupStripeElements();
    this.initializeChart();
    this.initializeBaselineTimer();
    this.initializePlanListeners();
  }

  setupStripeElements() {
    if (document.getElementById('card-element')) {
      this.card.mount('#card-element');
      this.card.addEventListener('change', this.handleCardChange);
    }
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
      this.updatePersonalTimeline(this.calculateCreditsForPlan(planType));

    } catch (error) {
      console.error('Payment failed:', error);
      this.showError(error.message);
    }
  }

  calculateCreditsForPlan(planType) {
    const creditMapping = {
        individual: 1000,
        family: 2000,
        galactic: 3000, // New plan added
        variable: 4000  // New plan added
    };
    return creditMapping[planType] || 0;
}

  initializeChart() {
    const ctx = document.getElementById('priceChart').getContext('2d');
    const basePrice = 450000;
    const years = [2024, 2027, 2030, 2035, 2039];
    const basePrices = years.map(year => {
      const yearsFromStart = year - 2024;
      return basePrice * Math.pow(0.85, yearsFromStart);
    });

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: years,
        datasets: [{
          label: 'Standard Journey',
          data: basePrices,
          borderColor: 'rgb(156, 163, 175)',
          backgroundColor: 'rgba(156, 163, 175, 0.1)',
          borderWidth: 2,
          tension: 0.4
        }]
      },
      options: {
        scales: {
          y: {
            type: 'logarithmic',
            title: {
              display: true,
              text: 'Price (USD)'
            }
          }
        }
      }
    });
  }

  // Alternative: Merge PriceEvolution.js logic here to calculate personalized data
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
            galactic: {
                rate: 0.65,
                color: 'rgb(234, 179, 8)',
                label: 'Galactic Path'
            },
            variable: {
                rate: 0.60,
                color: 'rgb(16, 185, 129)',
                label: 'Variable Path'
            }
        };

        const config = planConfigs[selectedPlan];
        if (config) {
            const personalData = this.calculatePersonalPriceCurve(
                this.calculateTimeReduction(this.totalCredits),
                config.rate
            );
            
            datasets.push({
                label: config.label,
                data: personalData,
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


  calculateTimeReduction(credits) {
    const maxReduction = 14; // Cannot reduce beyond 1 year remaining
    const creditsPerYear = 1000;
    const reduction = Math.min(maxReduction, credits / creditsPerYear);
    return this.baselineYears - reduction;
  }

  calculatePersonalPriceCurve(years, rate) {
    const basePrice = 450000;
    const targetPrice = 5000;
    const steps = 5; // Matches the number of years in the chart
    return Array.from({ length: steps }, (_, i) =>
      Math.max(targetPrice, basePrice * Math.pow(rate, i))
    );
  }

  initializeBaselineTimer() {
    const targetDate = new Date('2039-01-01');
    const updateTimer = () => {
      const now = new Date();
      const units = this.calculateTimeUnits(now, targetDate);
      const unitNames = ['years', 'months', 'days', 'hours', 'minutes', 'seconds'];
      unitNames.forEach((unit, index) => {
        const element = document.querySelector(`[data-base-timer="${unit}"]`);
        if (element) {
          element.textContent = units[index].toString().padStart(2, '0');
        }
      });
    };
    updateTimer();
    this.baselineCountdownInterval = setInterval(updateTimer, 1000);
  }

  calculateTimeUnits(start, end) {
    const diff = end - start;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30.44);
    const years = Math.floor(days / 365.25);
    return [years, months % 12, days % 30, hours % 24, minutes % 60, seconds % 60];
  }

  updateChart(planType) {
    if (!this.chart) return;
    this.currentPlan = planType;
    const newData = this.getChartData(planType);
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
    const reduction = accelerationRates[planType] || 0;
    const adjustedYears = this.calculateTimeReduction(this.calculateCreditsForPlan(planType));
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
      const units = this.calculateTimeUnits(now, targetDate);
      const unitNames = ['years', 'months', 'days', 'hours', 'minutes', 'seconds'];
      unitNames.forEach((unit, index) => {
        const element = document.querySelector(`[data-personal-countdown="${unit}"]`);
        if (element) {
          element.textContent = units[index].toString().padStart(2, '0');
          element.classList.remove('text-gray-400');
          element.classList.add('text-blue-800');
        }
      });
    };
    updateTimer();
    this.personalCountdownInterval = setInterval(updateTimer, 1000);
  }

  initializePlanListeners() {
    console.log('Initializing plan listeners');
    const planButtons = document.querySelectorAll('.plan-select-btn');
    planButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        e.preventDefault();
        const planType = button.getAttribute('data-plan');
        if (planType) {
          console.log('Plan selected:', planType);
          await this.handlePlanSelection(planType, button);
        }
      });
    });
  }

  addCredits(amount) {
    this.totalCredits += amount;
    this.updateChart(this.currentPlan);
    const creditsDisplay = document.getElementById('credits-display');
    if (creditsDisplay) {
      creditsDisplay.textContent = `Your SharedStars Credits: ${this.totalCredits}`;
    }
  }

  // Achievement handling
  awardAchievement(type) {
    const achievementCredits = {
      mission_complete: 500,
      training_milestone: 300,
      community_contribution: 200
    };
    if (achievementCredits[type]) {
      this.addCredits(achievementCredits[type]);
      this.showAchievementNotification(type);
    }
  }

  showAchievementNotification(type) {
    // Implement your UI notification logic here
    console.log(`Achievement unlocked: ${type}`);
  }
}

// Initialize when document loads
document.addEventListener('DOMContentLoaded', () => {
  window.timelineManager = new SpaceTimelineManager();
});
