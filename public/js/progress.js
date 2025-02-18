// Add to your main.js or a new progress.js file
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Progress Tracker
    const tracker = new ProgressTracker();

    // Initialize Timeline Chart
    const ctx = document.getElementById('timeline-chart').getContext('2d');
    const timelineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Price Evolution',
                    data: [],
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                    },
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                    },
                },
            },
            plugins: {
                legend: {
                    display: false,
                },
            },
        },
    });

    // Function to show achievement notification
    function showAchievementToast(achievement) {
        const toast = document.getElementById('achievement-toast');
        document.getElementById('achievement-icon').textContent = achievement.icon;
        document.getElementById('achievement-title').textContent = achievement.title;
        document.getElementById('achievement-credits').textContent =
            `+${achievement.credits} credits`;

        toast.classList.remove('hidden');
        setTimeout(() => (toast.style.transform = 'translateY(0)'), 100);

        setTimeout(() => {
            toast.style.transform = 'translateY(-100%)';
            setTimeout(() => toast.classList.add('hidden'), 300);
        }, 5000);
    }
});
