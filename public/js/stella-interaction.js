// public/js/stella-interactions.js
class STELLAInteractions {
    constructor(stella) {
        this.stella = stella;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Real-time form monitoring
        document.addEventListener('userMovement', async (e) => {
            await this.stella.animations.animateState('analyzing');
            const feedback = await this.stella.aiHandler.analyzeForm(e.data);
            await this.provideFeedback(feedback);
        });

        // User questions/interactions
        document.getElementById('ask-stella').addEventListener('click', async () => {
            await this.stella.animations.animateState('listening');
            const response = await this.handleUserQuery();
            await this.stella.provideFeedback(response);
        });

        // Progress milestones
        this.stella.aiHandler.on('milestone', async (data) => {
            await this.stella.animations.animateState('celebrating');
            await this.showMilestoneAchievement(data);
        });
    }

    async handleUserQuery() {
        const query = document.getElementById('user-query').value;
        await this.stella.animations.animateState('thinking');
        return await this.stella.aiHandler.generateResponse(query);
    }
}