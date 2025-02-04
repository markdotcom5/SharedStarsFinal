class DashboardController {
    constructor() {
        this.charts = {};
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.initialize();
    }

    async initialize() {
        try {
            const [stats, chartData] = await Promise.all([
                this.fetchStats(),
                this.fetchChartData()
            ]);

            this.initializeCharts(chartData);
            this.updateStats(stats);
            this.setupWebSocket();
            this.setupEventListeners();
            this.setupTaskManagement();
        } catch (error) {
            showError('Dashboard initialization failed');
            console.error('Dashboard initialization failed:', error);
        }
    }

    initializeCharts(data) {
        this.charts.progress = new Chart('progressChart', {
            type: 'line',
            data: {
                labels: data.progress.labels,
                datasets: [{
                    label: 'Training Progress',
                    data: data.progress.data,
                    borderColor: '#60A5FA',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: '#fff' }
                    }
                },
                scales: {
                    y: { grid: { color: '#1E293B' } },
                    x: { grid: { color: '#1E293B' } }
                }
            }
        });

        this.charts.achievements = new Chart('achievementsChart', {
            type: 'bar',
            data: {
                labels: data.achievements.labels,
                datasets: [{
                    label: 'Achievements',
                    data: data.achievements.data,
                    backgroundColor: '#818CF8'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: '#fff' }
                    }
                }
            }
        });
    }

    async fetchStats() {
        try {
            const response = await fetch('/api/dashboard/stats', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!response.ok) throw new Error('Failed to fetch stats');
            return response.json();
        } catch (error) {
            showError('Failed to fetch dashboard stats');
            throw error;
        }
    }

    async fetchChartData() {
        try {
            const response = await fetch('/api/dashboard/charts', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!response.ok) throw new Error('Failed to fetch chart data');
            return response.json();
        } catch (error) {
            showError('Failed to fetch chart data');
            throw error;
        }
    }

    setupWebSocket() {
        this.socket = new WebSocket(`wss://${window.location.host}/ws/dashboard`);
        
        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleRealtimeUpdate(data);
            } catch (error) {
                console.error('WebSocket message parsing error:', error);
            }
        };
        // Add to dashboard.js
          checkWebSocketConnection() {
           if (this.ws.readyState === WebSocket.OPEN) {
         console.log('WebSocket connected');
          this.requestInitialStats();
         }
        }
        this.socket.onclose = () => {
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                setTimeout(() => {
                    this.reconnectAttempts++;
                    this.setupWebSocket();
                }, 3000 * Math.pow(2, this.reconnectAttempts));
            } else {
                showError('Connection lost. Please refresh the page.');
            }
        };

        this.socket.onerror = (error) => {
            showError('WebSocket error occurred');
            console.error('WebSocket error:', error);
        };
    }
// In public/js/dashboard.js
updateStats(data) {
    document.querySelector('[data-stat="points"]').textContent = data.points;
    document.querySelector('[data-stat="successRate"]').textContent = `${Math.round(data.successRate)}%`;
    document.querySelector('[data-stat="activeMissions"]').textContent = data.activeMissions;
}
    handleRealtimeUpdate(data) {
        switch(data.type) {
            case 'stats':
                this.updateStats(data.stats);
                break;
            case 'progress':
                this.updateCharts(data);
                break;
            case 'task':
                this.updateTasks(data.task);
                break;
            case 'achievement':
                this.updateAchievements([data.achievement]);
                break;
            case 'mission-update':
                this.updateNextMission(data.mission);
                break;
            default:
                console.warn('Unknown update type:', data.type);
        }
    }

    updateStats(stats) {
        Object.entries(stats).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) {
                element.textContent = typeof value === 'number' ? 
                    value.toLocaleString() : value;
            }
        });
    }

    updateCharts(data) {
        if (data.progress && this.charts.progress) {
            this.charts.progress.data.datasets[0].data = data.progress;
            this.charts.progress.update();
        }
        if (data.achievements && this.charts.achievements) {
            this.charts.achievements.data.datasets[0].data = data.achievements;
            this.charts.achievements.update();
        }
    }

    setupEventListeners() {
        document.getElementById('logout-button')?.addEventListener('click', this.handleLogout.bind(this));
    }

    async handleLogout() {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!response.ok) throw new Error('Logout failed');
            localStorage.removeItem('token');
            window.location.href = '/login';
        } catch (error) {
            showError('Logout failed');
            console.error('Logout failed:', error);
        }
    }

    // Task Management
    setupTaskManagement() {
        this.setupTaskEventListeners();
    }

    async addTask(task) {
        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(task)
            });
            if (!response.ok) throw new Error('Failed to add task');
            const data = await response.json();
            this.updateTaskUI(data);
        } catch (error) {
            showError('Failed to add task');
            console.error('Failed to add task:', error);
        }
    }

    async updateTask(taskId, updates) {
        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(updates)
            });
            if (!response.ok) throw new Error('Failed to update task');
            const data = await response.json();
            this.updateTaskUI(data);
        } catch (error) {
            showError('Failed to update task');
            console.error('Failed to update task:', error);
        }
    }

    updateTaskUI(task) {
        const taskElement = document.querySelector(`[data-task-id="${task.id}"]`);
        if (!taskElement) {
            const prioritySection = document.querySelector(`.${task.priority}-priority`);
            if (prioritySection) {
                prioritySection.querySelector('.task-list')?.insertAdjacentHTML('beforeend', this.createTaskHTML(task));
            }
        } else {
            taskElement.outerHTML = this.createTaskHTML(task);
        }
    }

    createTaskHTML(task) {
        return `
            <div class="bg-gray-800/50 p-3 rounded" data-task-id="${task.id}">
                <div class="flex justify-between">
                    <span>${task.title}</span>
                    <span class="text-${task.priority}-400">${task.deadline}</span>
                </div>
            </div>
        `;
    }

    setupTaskEventListeners() {
        document.querySelector('.btn-add-task')?.addEventListener('click', () => {
            const task = {
                title: 'New Task',
                priority: 'medium',
                deadline: 'Tomorrow'
            };
            this.addTask(task);
        });

        document.querySelectorAll('.task-list').forEach(list => {
            list.addEventListener('click', (e) => {
                const taskElement = e.target.closest('[data-task-id]');
                if (taskElement) {
                    // Task click handling logic here
                }
            });
        });
    }
}

function showError(message) {
    console.error(message);
    // Implement your error notification system here
    // Example: toast notification
    if (window.toast) {
        window.toast.error(message);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DashboardController();
});