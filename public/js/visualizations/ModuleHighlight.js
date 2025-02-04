class AIVisualizationSystem {
    constructor() {
        this.initializeCanvas();
        this.highlightedModules = new Map();
    }

    initializeCanvas() {
        const canvas = document.createElement('div');
        canvas.className = 'ai-visualization-overlay fixed inset-0 pointer-events-none z-40';
        document.body.appendChild(canvas);
        this.canvas = canvas;
    }

    highlightModule(moduleId, status) {
        const module = document.querySelector(`[data-module-id="${moduleId}"]`);
        if (!module) return;

        const highlight = document.createElement('div');
        highlight.className = `
            absolute rounded-lg border-2 transition-all duration-300
            ${this.getStatusStyle(status)}
        `;
        
        // Position highlight over module
        const bounds = module.getBoundingClientRect();
        Object.assign(highlight.style, {
            left: `${bounds.left}px`,
            top: `${bounds.top}px`,
            width: `${bounds.width}px`,
            height: `${bounds.height}px`
        });

        this.canvas.appendChild(highlight);
        this.highlightedModules.set(moduleId, highlight);
    }
}