class PredictiveLearningSystem {
    constructor(aiGuide) {
        this.aiGuide = aiGuide;
        this.learningPath = [];
        this.currentNodeIndex = 0;
    }

    async predictNextSteps(currentModuleId, userMetrics) {
        try {
            const response = await fetch('/api/ai/predict-path', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentModule: currentModuleId,
                    userMetrics,
                    learningHistory: this.learningPath
                })
            });

            const prediction = await response.json();
            this.updateLearningPath(prediction);
            this.visualizePath();
        } catch (error) {
            console.error('Path prediction error:', error);
        }
    }

    visualizePath() {
        const pathContainer = document.createElement('div');
        pathContainer.className = 'learning-path-visualization fixed right-4 top-20 w-64 bg-black/80 rounded-xl p-4';
        
        pathContainer.innerHTML = `
            <div class="text-blue-400 font-bold mb-2">Predicted Learning Path</div>
            ${this.learningPath.map((node, index) => `
                <div class="path-node flex items-center gap-2 ${index === this.currentNodeIndex ? 'text-green-400' : 'text-gray-400'}">
                    <div class="w-2 h-2 rounded-full ${index === this.currentNodeIndex ? 'bg-green-400' : 'bg-gray-600'}"></div>
                    <span>${node.title}</span>
                </div>
            `).join('')}
        `;

        document.body.appendChild(pathContainer);
    }
}