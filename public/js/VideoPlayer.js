class EnhancedVideoPlayer {
    constructor(videoElement, options = {}) {
        this.video = videoElement;
        this.container = videoElement.parentElement;
        this.options = options;

        this.isPlaying = false;
        this.bookmarks = [];
        this.chapters = [];
        this.transcript = [];
        this.init();
    }

    async init() {
        await this.loadVideoData();
        this.createControlsContainer();
        this.createProgressBar();
        this.createMainControls();
        this.setupEventListeners();
    }

    async loadVideoData() {
        const videoId = this.video.dataset.videoId;

        try {
            const response = await fetch(`/api/videos/${videoId}`);
            const videoData = await response.json();
            this.bookmarks = videoData.bookmarks || [];
            this.chapters = videoData.chapters || [];
            this.transcript = videoData.transcript || [];
        } catch (error) {
            console.error("Error fetching video data:", error.message);
        }
    }

    createControlsContainer() {
        const controls = document.createElement("div");
        controls.className = "video-controls";
        this.container.appendChild(controls);
        this.controls = controls;
    }

    createProgressBar() {
        const progressBar = document.createElement("div");
        progressBar.className = "progress-bar";

        const progress = document.createElement("div");
        progress.className = "progress-fill";
        progressBar.appendChild(progress);
        this.controls.appendChild(progressBar);

        // Add chapter markers
        this.chapters.forEach((chapter) => {
            const marker = document.createElement("div");
            marker.className = "chapter-marker";
            marker.style.left = `${(chapter.time / this.video.duration) * 100}%`;
            progressBar.appendChild(marker);
        });
    }

    createMainControls() {
        const playButton = document.createElement("button");
        playButton.textContent = "Play";
        playButton.addEventListener("click", () => this.togglePlay());
        this.controls.appendChild(playButton);
    }

    togglePlay() {
        if (this.video.paused) {
            this.video.play();
        } else {
            this.video.pause();
        }
        this.updatePlayButton();
    }

    updatePlayButton() {
        const playButton = this.controls.querySelector("button");
        playButton.textContent = this.video.paused ? "Play" : "Pause";
    }
}

// Initialize video player
document.addEventListener("DOMContentLoaded", () => {
    const videoElement = document.querySelector("#training-video");
    new EnhancedVideoPlayer(videoElement);
});
