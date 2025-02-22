class STELLAAnimations {
    constructor() {
        this.avatar = document.getElementById('stella-avatar');
        if (!this.avatar) {
            console.warn('STELLA avatar not found!');
            return;
        }
        this.currentState = 'idle';
        this.states = {
            idle: {
                frames: ['idle-1', 'idle-2'],
                duration: 2000
            },
            thinking: {
                frames: ['think-1', 'think-2', 'think-3'],
                duration: 1500
            },
            speaking: {
                frames: ['speak-1', 'speak-2'],
                duration: 1000
            }
        };
    }

    async animateState(state) {
        if (!this.avatar || !this.states[state]) return;
        this.currentState = state;
        const stateConfig = this.states[state];
        
        for (const frame of stateConfig.frames) {
            await this.displayFrame(frame, stateConfig.duration / stateConfig.frames.length);
        }
    }

    async displayFrame(frame, duration) {
        if (!this.avatar) return;
        this.avatar.classList.add(`stella-${frame}`);
        setTimeout(() => {
            this.avatar.classList.remove(`stella-${frame}`);
        }, duration);
        await new Promise(resolve => setTimeout(resolve, duration));
    }

    async respondToUser() {
        await this.animateState('thinking');
        await this.animateState('speaking');
        await this.animateState('idle');
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const stella = new STELLAAnimations();
    if (stella.avatar) {
        stella.animateState("idle");
    }

    const aiHandler = new AIHandler();
    const stellaIntegration = new STELLAIntegration(aiHandler);
    const interactions = new STELLAInteractions(stellaIntegration);
    const animations = new TrainingAnimations();

    stellaIntegration.initialize().then(() => {
        const trainingModule = new TrainingModule({
            stella: stellaIntegration,
            animations,
            aiHandler
        });
        trainingModule.startSession();
    });

    window.app = new SharedStarsApp();
    window.app.initialize();

    // WebSocket event handling
    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'STELLA_GUIDANCE') {
                window.app.stella.interface.displayGuidance(data.guidance);
            }
            if (data.type === 'STELLA_INTERVENTION') {
                window.app.stella.coach.handleIntervention(data.intervention);
            }
            console.log("📡 WebSocket Message Received:", data);
        } catch (error) {
            console.error("❌ WebSocket Error:", error);
        }
    };
});
