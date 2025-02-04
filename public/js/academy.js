document.addEventListener("DOMContentLoaded", () => {
    const modulesContainer = document.getElementById('academy-modules');
    const trainingMode = localStorage.getItem('trainingMode');
    
    // Keep your existing fetch but modify the module rendering based on mode
    fetch('/api/academy')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch academy modules.');
            }
            return response.json();
        })
        .then(async modules => {
            modulesContainer.innerHTML = ''; 
            
            // If AI mode, initialize guidance
            if (trainingMode === 'ai') {
                const userId = localStorage.getItem('userId');
                // Initialize AI guidance overlay
                try {
                    await fetch('/api/ai/guidance/initialize', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ userId })
                    });
                } catch (error) {
                    console.error('AI guidance initialization error:', error);
                }
            }

            // Render modules with or without AI guidance
            modules.forEach(module => {
                const moduleItem = document.createElement('li');
                moduleItem.classList.add('module-item');
                
                if (trainingMode === 'ai') {
                    moduleItem.dataset.aiEnabled = 'true';
                }
                
                moduleItem.innerHTML = `
                    <div class="module-content">
                        <h3>${module.title}</h3>
                        <p>${module.description}</p>
                        ${trainingMode === 'ai' ? `
                            <div class="ai-guidance-overlay" id="guidance-${module.id}">
                                <div class="ai-status">
                                    <span class="ai-indicator"></span>
                                    AI Coach Active
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `;
                
                modulesContainer.appendChild(moduleItem);
            });
        })
        .catch(error => {
            console.error('Error loading academy modules:', error);
            modulesContainer.innerHTML = '<li class="error">Failed to load academy modules. Please try again later.</li>';
        });
});
// Add to academy.js
class AISpaceGuide {
    constructor() {
        this.initializeGuidanceOverlay();
        this.currentFocus = null;
        this.confidenceLevel = 0;
        this.activeModules = new Set();
    }

    initializeGuidanceOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'ai-guidance-system fixed bottom-4 left-4 w-96 bg-black/80 rounded-xl p-4 text-white z-50';
        overlay.innerHTML = `
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                    <div class="w-3 h-3 bg-blue-500 rounded-full pulse"></div>
                    <span class="font-bold">AI Space Coach Active</span>
                </div>
                <div class="confidence-meter flex items-center gap-2">
                    <span class="text-sm">System Confidence</span>
                    <div class="w-20 h-2 bg-gray-700 rounded-full">
                        <div class="confidence-level w-0 h-full bg-green-500 rounded-full transition-all"></div>
                    </div>
                </div>
            </div>
            <div class="guidance-content">
                <div class="current-focus mb-2"></div>
                <div class="next-steps"></div>
            </div>
        `;

        document.body.appendChild(overlay);
        this.overlay = overlay;
    }

    updateGuidance(data) {
        const focusElement = this.overlay.querySelector('.current-focus');
        const nextStepsElement = this.overlay.querySelector('.next-steps');
        const confidenceMeter = this.overlay.querySelector('.confidence-level');

        focusElement.innerHTML = `
            <div class="flex items-center gap-2 mb-2">
                <span class="text-blue-400">Current Focus:</span>
                <span>${data.currentFocus}</span>
            </div>
        `;

        nextStepsElement.innerHTML = `
            <div class="next-steps bg-blue-900/50 rounded-lg p-2">
                <div class="text-sm text-blue-400 mb-1">Next Steps:</div>
                ${data.nextSteps.map(step => `
                    <div class="flex items-center gap-2 text-sm">
                        <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span>${step}</span>
                    </div>
                `).join('')}
            </div>
        `;

        // Update confidence meter
        confidenceMeter.style.width = `${data.confidence}%`;
    }
}

// Initialize when in AI mode
if (localStorage.getItem('trainingMode') === 'ai') {
    const aiGuide = new AISpaceGuide();
    
    // Connect to your WebSocket service for real-time updates
    const ws = new WebSocket(`wss://${window.location.host}/ws`);
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'guidance_update') {
            aiGuide.updateGuidance(data);
        }
    };
}