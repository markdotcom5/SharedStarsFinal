// public/js/modules/training/moduleInterface.js

class ModuleInterface {
    constructor(moduleId) {
        this.moduleId = moduleId;
        this.currentLevel = 0;
        this.moduleData = trainingModules[moduleId];
        this.aiAssistant = null;
    }

    async initialize() {
        this.container = document.querySelector('#training-container');
        if (!this.container) {
            console.error('Training container not found');
            return;
        }

        // Initialize AI Assistant
        this.aiAssistant = new AIAssistant();
        await this.aiAssistant.initialize();
        
        this.render();
    }

    render() {
        const module = this.moduleData;
        this.container.innerHTML = `
            <div class="p-8 bg-gray-900 min-h-screen">
                <div class="max-w-6xl mx-auto">
                    <!-- Module Header -->
                    <div class="mb-8">
                        <h1 class="text-4xl font-bold text-blue-400">${module.title}</h1>
                        <p class="text-gray-300 mt-2">${module.description}</p>
                    </div>

                    <!-- Progress Tracker -->
                    <div class="bg-gray-800 p-4 rounded-lg mb-8">
                        <div class="flex justify-between items-center">
                            <span class="text-white">Progress</span>
                            <span class="text-blue-400" id="progress-display">0%</span>
                        </div>
                        <div class="w-full bg-gray-700 h-2 rounded-full mt-2">
                            <div class="bg-blue-500 h-2 rounded-full" style="width: 0%" id="progress-bar"></div>
                        </div>
                    </div>

                    <!-- Levels Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${module.levels.map((level, index) => this.renderLevel(level, index)).join('')}
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    renderLevel(level, index) {
        return `
            <div class="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-all duration-300">
                <h3 class="text-2xl font-bold text-white mb-4">${level.name}</h3>
                <div class="space-y-4">
                    ${level.content.map(content => this.renderContent(content)).join('')}
                </div>
                <button 
                    class="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                    data-level="${index}"
                    onclick="startLevel(${index})"
                >
                    Start Level
                </button>
            </div>
        `;
    }

    renderContent(content) {
        switch (content.type) {
            case 'video':
                return this.renderVideoContent(content);
            case 'interactive':
                return this.renderInteractiveContent(content);
            case 'program':
                return this.renderProgramContent(content);
            case 'scenario':
                return this.renderScenarioContent(content);
            default:
                return '';
        }
    }

    renderVideoContent(content) {
        return `
            <div class="video-content">
                <h4 class="text-blue-400 font-bold">${content.title}</h4>
                <p class="text-gray-400 text-sm">Duration: ${content.duration}</p>
                <div class="mt-2">
                    ${content.objectives.map(obj => 
                        `<div class="text-gray-300 text-sm">• ${obj}</div>`
                    ).join('')}
                </div>
            </div>
        `;
    }

    // Add other render methods for different content types...

    attachEventListeners() {
        const levelButtons = this.container.querySelectorAll('[data-level]');
        levelButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const levelIndex = parseInt(e.target.dataset.level);
                this.startLevel(levelIndex);
            });
        });
    }

    async startLevel(levelIndex) {
        const level = this.moduleData.levels[levelIndex];
        
        // Show AI welcome message
        await this.aiAssistant.showMessage(`Welcome to ${level.name}! I'll be your guide through this training level.`);
        
        // Start first content piece
        this.startContent(level.content[0]);
    }

    async startContent(content) {
        switch (content.type) {
            case 'video':
                await this.startVideoContent(content);
                break;
            case 'interactive':
                await this.startInteractiveContent(content);
                break;
            // Add other content type handlers...
        }
    }

    // Add methods for handling different content types...
}

export default ModuleInterface;