// public/js/stella-countdown.js
class StellaCountdown {
    constructor(elementId, userId) {
      this.element = document.getElementById(elementId);
      this.userId = userId;
      this.demoMode = true; // Use demo mode since the API may not be fully implemented
      this.currentTime = 604800; // One week in seconds
      this.totalTime = 604800;
      this.countdownInterval = null;
    }
  
    initialize() {
      if (!this.element) return;
      
      if (this.demoMode) {
        this.startDemoCountdown();
      } else {
        this.checkCountdownStatus();
      }
    }
  
    startDemoCountdown() {
      this.render();
      this.startTicking();
    }
  
    async checkCountdownStatus() {
      try {
        // For now, just use demo mode since the API endpoint may not exist
        this.startDemoCountdown();
        
        // In future, uncomment this to use the actual API
        /*
        const response = await fetch(`/api/stella/countdown/status?userId=${this.userId}`);
        const data = await response.json();
        
        if (data.success && data.status && data.status.active) {
          this.currentTime = data.status.currentTime;
          this.totalTime = data.status.totalTime;
          this.render();
          this.startTicking();
        } else {
          this.renderInactive();
        }
        */
      } catch (error) {
        console.error('Error checking countdown status:', error);
        this.startDemoCountdown(); // Fallback to demo mode
      }
    }
  
    startTicking() {
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }
      
      this.countdownInterval = setInterval(() => {
        if (this.currentTime > 0) {
          this.currentTime--;
          this.render();
        } else {
          this.renderComplete();
          clearInterval(this.countdownInterval);
        }
      }, 1000);
    }
  
    render() {
      if (!this.element) return;
      
      const days = Math.floor(this.currentTime / 86400);
      const hours = Math.floor((this.currentTime % 86400) / 3600);
      const minutes = Math.floor((this.currentTime % 3600) / 60);
      const seconds = this.currentTime % 60;
      
      const percentage = Math.floor((1 - (this.currentTime / this.totalTime)) * 100);
      
      this.element.innerHTML = `
        <div class="stella-countdown">
          <div class="countdown-header">
            <h3>Mission Countdown</h3>
            <div class="progress-bar">
              <div class="progress" style="width: ${percentage}%"></div>
            </div>
          </div>
          <div class="countdown-timer">
            <div class="time-unit">
              <span class="value">${days}</span>
              <span class="label">Days</span>
            </div>
            <div class="time-unit">
              <span class="value">${hours}</span>
              <span class="label">Hours</span>
            </div>
            <div class="time-unit">
              <span class="value">${minutes}</span>
              <span class="label">Mins</span>
            </div>
            <div class="time-unit">
              <span class="value">${seconds}</span>
              <span class="label">Secs</span>
            </div>
          </div>
          <div class="countdown-message">
            Complete training activities to accelerate your countdown!
          </div>
        </div>
      `;
    }
  
    renderInactive() {
      if (!this.element) return;
      
      this.element.innerHTML = `
        <div class="stella-countdown inactive">
          <h3>Start Your Mission</h3>
          <p>No active countdown. Begin your space mission preparation!</p>
          <button id="start-mission" class="btn btn-primary">Start Countdown</button>
        </div>
      `;
      
      document.getElementById('start-mission').addEventListener('click', () => this.startDemoCountdown());
    }
  
    renderComplete() {
      if (!this.element) return;
      
      this.element.innerHTML = `
        <div class="stella-countdown complete">
          <h3>Mission Ready!</h3>
          <p>Your countdown is complete. You are now ready for your space mission.</p>
          <button id="new-mission" class="btn btn-primary">Start New Mission</button>
        </div>
      `;
      
      document.getElementById('new-mission').addEventListener('click', () => {
        this.currentTime = this.totalTime;
        this.startDemoCountdown();
      });
    }
  }