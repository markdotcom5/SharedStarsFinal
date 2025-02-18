document.addEventListener('DOMContentLoaded', function () {
    const ctx = document.getElementById('priceChart').getContext('2d');
    const baselineData = [
        { year: 2022, price: 875000 },
        { year: 2024, price: 250000 },
        { year: 2029, price: 75000 },
        { year: 2034, price: 17500 },
        { year: 2039, price: 5000 },
    ];

    // Personalization factors
    const accelerationFactors = {
        subscriptionPlans: {
            free: 0,
            basic: 0.1,
            premium: 0.2,
            enterprise: 0.3,
        },
        achievements: {
            bronze: 0.05,
            silver: 0.1,
            gold: 0.15,
            platinum: 0.2,
        },
        credits: {
            factor: 0.001,
        },
    };

    function calculatePersonalTimeline(userProfile) {
        const { subscriptionType = 'free', achievements = [], credits = 0 } = userProfile;
        let totalAcceleration = accelerationFactors.subscriptionPlans[subscriptionType];
        achievements.forEach((achievement) => {
            totalAcceleration += accelerationFactors.achievements[achievement.level] || 0;
        });
        totalAcceleration += credits * accelerationFactors.credits.factor;

        return baselineData.map((point) => {
            const yearsFromNow = point.year - 2024;
            const acceleratedYears = yearsFromNow * (1 - totalAcceleration);
            const acceleratedPrice = point.price * (1 - totalAcceleration);
            return {
                year: 2024 + acceleratedYears,
                price: Math.max(acceleratedPrice, point.price * 0.2),
            };
        });
    }

    // Example user profile; replace with real user data as needed
    const userProfile = {
        subscriptionType: 'premium',
        achievements: [
            { level: 'gold', name: 'Training Complete' },
            { level: 'silver', name: 'Mission Success' },
        ],
        credits: 500,
    };

    const personalData = calculatePersonalTimeline(userProfile);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: baselineData.map((d) => d.year),
            datasets: [
                {
                    label: 'Industry Baseline',
                    data: baselineData.map((d) => d.price),
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                },
                {
                    label: 'Your Personal Timeline',
                    data: personalData.map((d) => d.price),
                    borderColor: 'rgba(16, 185, 129, 1)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4,
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: 'white' },
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label ? context.dataset.label + ': ' : '';
                            label += new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                            }).format(context.parsed.y);
                            return label;
                        },
                    },
                },
            },
            scales: {
                y: {
                    type: 'logarithmic',
                    title: { display: true, text: 'Price (USD)', color: 'white' },
                    ticks: {
                        color: 'white',
                        callback: function (value) {
                            return new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                            }).format(value);
                        },
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                },
                x: {
                    title: { display: true, text: 'Year', color: 'white' },
                    ticks: { color: 'white' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                },
            },
        },
    });
});
