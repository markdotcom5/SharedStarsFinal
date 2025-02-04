document.addEventListener('DOMContentLoaded', () => {
    const fetchProgress = async () => {
        try {
            const trainingData = {
                moduleCompletion: { Physical: 80, Technical: 60, Psychological: 50 },
                badgesEarned: ['Beginner', 'Explorer'],
            };

            const response = await fetch('/api/training/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trainingData }),
            });

            const data = await response.json();

            if (data.success) {
                // Render the chart
                const ctx = document.getElementById('progress-chart').getContext('2d');
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Physical', 'Technical', 'Psychological'],
                        datasets: [
                            {
                                label: 'Completion Rate (%)',
                                data: Object.values(trainingData.moduleCompletion),
                                backgroundColor: ['#4caf50', '#2196f3', '#ff5722'],
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                display: true,
                                position: 'top',
                            },
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Percentage (%)',
                                },
                            },
                        },
                    },
                });

                // Update textual analysis
                document.getElementById('progress-analysis').innerText = data.analysis;
            } else {
                console.error('Error fetching progress analysis:', data.error);
            }
        } catch (error) {
            console.error('Error fetching progress data:', error.message);
        }
    };

    // Fetch progress data when the button is clicked
    document.getElementById('fetch-progress').addEventListener('click', fetchProgress);
});
