class DashboardController {
    constructor() {
        this.tasks = [];
        this.editingTaskId = null;
        this.socket = null;
        this.eventListeners = new Map();
        this.initialize();
    }

    async initialize() {
        try {
            await this.loadTasks();
            this.initializeTaskModal();
            this.setupWebSocket();
            this.setupDashboardStats();
            this.setupEventListeners();
        } catch (error) {
            this.handleError(error);
        }
    }

    initializeTaskModal() {
        this.taskModal = document.getElementById('taskModal');
        this.taskForm = document.getElementById('taskForm');
        
        this.taskForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const taskData = {
                title: document.getElementById('taskTitle').value,
                priority: document.getElementById('taskPriority').value,
                deadline: document.getElementById('taskDeadline').value,
                category: document.getElementById('taskCategory').value,
                description: document.getElementById('taskDescription').value,
                resources: this.getSelectedResources()
            };

            try {
                if (this.editingTaskId) {
                    await this.updateTask(this.editingTaskId, taskData);
                } else {
                    await this.addTask(taskData);
                }
                this.taskModal.close();
                this.renderDashboard();
            } catch (error) {
                this.handleError(error);
            }
        });

        // Add validation
        this.setupFormValidation();
    }

    showTaskModal(taskId = null) {
        this.editingTaskId = taskId;
        if (taskId) {
            const task = this.tasks.find(t => t.id === taskId);
            if (!task) return;

            Object.entries({
                'taskTitle': task.title,
                'taskPriority': task.priority,
                'taskDeadline': task.deadline,
                'taskCategory': task.category,
                'taskDescription': task.description
            }).forEach(([id, value]) => {
                document.getElementById(id).value = value;
            });

            this.setSelectedResources(task.resources);
        } else {
            this.taskForm.reset();
            this.resetResourceSelection();
        }

        this.updateModalUI();
        this.taskModal.showModal();
    }

    async addTask(taskData) {
        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(taskData)
            });

            if (!response.ok) throw new Error('Failed to add task');

            const newTask = await response.json();
            this.tasks.push(newTask);
            this.emit('taskAdded', newTask);
            this.renderTasks();
        } catch (error) {
            this.handleError(error);
        }
    }

    async updateTask(taskId, taskData) {
        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(taskData)
            });

            if (!response.ok) throw new Error('Failed to update task');

            const updatedTask = await response.json();
            const index = this.tasks.findIndex(t => t.id === taskId);
            if (index !== -1) {
                this.tasks[index] = updatedTask;
            }
            this.emit('taskUpdated', updatedTask);
            this.renderTasks();
        } catch (error) {
            this.handleError(error);
        }
    }

    setupFormValidation() {
        const inputs = this.taskForm.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.validateField(input);
            });
        });
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        switch (field.id) {
            case 'taskTitle':
                isValid = value.length >= 3;
                errorMessage = 'Title must be at least 3 characters';
                break;
            case 'taskDeadline':
                const deadline = new Date(value);
                isValid = deadline > new Date();
                errorMessage = 'Deadline must be in the future';
                break;
            // Add more validation cases
        }

        this.updateFieldValidation(field, isValid, errorMessage);
        return isValid;
    }

    updateFieldValidation(field, isValid, errorMessage) {
        const errorDiv = field.nextElementSibling;
        if (isValid) {
            field.classList.remove('invalid');
            field.classList.add('valid');
            errorDiv?.remove();
        } else {
            field.classList.remove('valid');
            field.classList.add('invalid');
            if (!errorDiv) {
                const div = document.createElement('div');
                div.className = 'error-message text-red-500 text-sm mt-1';
                div.textContent = errorMessage;
                field.parentNode.insertBefore(div, field.nextSibling);
            }
        }
    }

    handleError(error) {
        console.error('Dashboard Error:', error);
        // Implement your error UI here
    }
}
// In your controller (e.g., DashboardController.js)
exports.renderDashboard = async (req, res) => {
    try {
      const userData = await getUserData(req.user.id); // your service call
      res.render('dashboard', { title: 'Dashboard', user: userData });
    } catch (error) {
      res.status(500).send('Error rendering dashboard');
    }
  };
  
export default DashboardController;