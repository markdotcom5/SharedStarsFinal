export function renderTimelineChart(elementId) {
    const ctx = document.getElementById(elementId).getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ["2024", "2029", "2034", "2049"],
            datasets: [
                {
                    label: "Cost of Space Travel",
                    data: [250000, 50000, 25000, 5000],
                    borderColor: "#007bff",
                    backgroundColor: "rgba(0, 123, 255, 0.2)",
                    fill: true,
                }
            ],
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'Year' } },
                y: { title: { display: true, text: 'Cost (USD)' }, beginAtZero: true },
            },
        },
    });
}
