// templates/newModuleTemplate.js
const moduleTemplate = {
    // Basic module structure
    base: {
        id: '',
        name: '',
        description: '',
        version: '1.0.0',
        aiEnabled: true,
        components: ['main', 'tasks', 'assessments'],
        prerequisites: []
    },

    // Directory structure
    directories: [
        'main',
        'tasks',
        'assessments',
        'requirements',
        'data'
    ],

    // Required files
    files: {
        'index.js': `
            const express = require('express');
            const router = express.Router();
            const moduleConfig = require('./config');
            
            class {{ModuleName}}Module {
                constructor() {
                    this.config = moduleConfig;
                    this.router = router;
                    this.initialized = false;
                }

                async initialize() {
                    // Initialize module
                    this.initialized = true;
                }

                async setupRoutes() {
                    // Setup routes
                }
            }

            module.exports = new {{ModuleName}}Module();
        `,

        'config.js': `
            module.exports = {
                id: '{{moduleId}}',
                name: '{{moduleName}}',
                description: '{{moduleDescription}}',
                version: '1.0.0',
                aiEnabled: true,
                components: {
                    tasks: require('./tasks'),
                    assessments: require('./assessments'),
                    requirements: require('./requirements')
                }
            };
        `,

        'routes.js': `
            const express = require('express');
            const router = express.Router();
            const { authenticate } = require('../../middleware/authenticate');
            
            // Module routes
            router.get('/status', authenticate, async (req, res) => {
                // Implementation
            });

            module.exports = router;
        `
    },

    // Event handlers template
    eventHandlers: `
        setupEventHandlers() {
            this.on('progress', this.handleProgress.bind(this));
            this.on('assessment', this.handleAssessment.bind(this));
            this.on('ai-feedback', this.handleAIFeedback.bind(this));
        }
    `,

    // AI integration template
    aiIntegration: `
        async setupAI() {
            await this.aiService.initialize({
                moduleId: this.config.id,
                features: ['feedback', 'assessment', 'adaptation']
            });
        }
    `
};

module.exports = moduleTemplate;