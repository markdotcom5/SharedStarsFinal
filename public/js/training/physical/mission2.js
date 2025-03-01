// public/js/training/physical/mission2.js
class EnduranceTracker {
    constructor() {
      this.metrics = {
        heartRate: 0,
        o2Saturation: 0,
        hrv: 0,
        vo2: 0,
        timeInZone: {},
        recoveryRate: 0
      };
      this.stella = new STELLAInterface('endurance');
      this.graphs = {};
      this.sessionId = null;
      this.currentZone = null;
    }
  
    async initialize() {
      await this.stella.connect();
      this.setupGraphs();
      this.setupZoneTracking();
      this.startSession();
    }
  
    async startSession() {
      try {
        const response = await fetch('/training/physical/mission/2/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        
        if (data.success) {
          this.sessionId = data.sessionId;
          this.startMonitoring();
          console.log("Session started:", this.sessionId);
        }
      } catch (error) {
        console.error("Error starting session:", error);
      }
    }
  
    setupGraphs() {
      this.graphs.hrv = new PerformanceGraph('.hrv-graph', {
        type: 'line',
        label: 'HRV',
        color: '#3B82F6'
      });
  
      this.graphs.o2 = new PerformanceGraph('.o2-graph', {
        type: 'line',
        label: 'O₂ Utilization',
        color: '#10B981'
      });
    }
  
    setupZoneTracking() {
      document.querySelectorAll('.zone-card').forEach(card => {
        card.addEventListener('click', async () => {
          const zoneId = card.dataset.zoneId;
          const targetHR = parseInt(card.dataset.targetHR);
          
          this.currentZone = zoneId;
          
          // Simulate zone metrics
          const metrics = {
            currentZone: zoneId,
            targetHR,
            heartRate: targetHR - 5 + Math.random() * 10,
            o2Saturation: 95 + Math.random() * 5,
            timeInZone: 0,
            efficiency: 75 + Math.random() * 15,
            recovery: 10 + Math.random() * 10,
            hrv: 50 + Math.random() * 20
          };
          
          this.updateZoneMetrics(card, metrics);
          
          // Trigger custom event for visualization
          const event = new CustomEvent('zoneStart', { detail: metrics });
          card.dispatchEvent(event);
        });
      });
    }
  
    updateZoneMetrics(card, metrics) {
      card.querySelector('.hr-zone').textContent = metrics.currentZone;
      card.querySelector('.zone-time').textContent = 
          this.formatTime(metrics.timeInZone);
      card.querySelector('.efficiency-score').textContent = 
          `${metrics.efficiency}%`;
      card.querySelector('.recovery-rate').textContent = 
          `${metrics.recovery}bpm`;
  
      // Update main metrics
      document.getElementById('current-hr').textContent = 
          `${Math.round(metrics.heartRate)} bpm`;
      document.getElementById('current-o2').textContent = 
          `${Math.round(metrics.o2Saturation)}%`;
  
      // Update graphs
      this.graphs.hrv.addDataPoint(metrics.hrv);
      this.graphs.o2.addDataPoint(metrics.o2Saturation);
  
      // Send metrics to server
      this.sendMetrics(metrics);
    }
  
    async sendMetrics(metrics) {
      if (!this.sessionId) return;
      
      try {
        const response = await fetch('/training/physical/mission/2/metrics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sessionId: this.sessionId,
            metrics
          })
        });
        
        const data = await response.json();
        if (data.success && data.analysis) {
          this.updateFeedback(data.analysis);
        }
      } catch (error) {
        console.error("Error sending metrics:", error);
      }
    }
  
    startMonitoring() {
      // Fetch metrics from server periodically
      this.monitoringInterval = setInterval(async () => {
        if (!this.currentZone) return;
        
        try {
          const response = await fetch('/training/physical/mission/2/metrics');
          const data = await response.json();
          
          if (data.success) {
            const metrics = data.metrics;
            this.updateMetrics(metrics);
            
            // Check for overexertion
            if (metrics.heartRate > this.getMaxSafeHR()) {
              this.triggerSafetyAlert();
            }
          }
        } catch (error) {
          console.error("Error fetching metrics:", error);
        }
      }, 5000);
    }
    
    updateMetrics(metrics) {
      this.metrics = { ...this.metrics, ...metrics };
      
      // Find the current zone card and update it
      const zoneCard = document.querySelector(`.zone-card[data-zone-id="${this.currentZone}"]`);
      if (zoneCard) {
        this.updateZoneMetrics(zoneCard, metrics);
      }
    }
    
    updateFeedback(feedback) {
      const feedbackElement = document.getElementById('stella-endurance-feedback');
      if (feedbackElement) {
        feedbackElement.textContent = feedback.message;
      }
  
      // Update insights
      const insightsContainer = document.getElementById('training-insights');
      if (insightsContainer && feedback.insights) {
        insightsContainer.innerHTML = feedback.insights
          .map(insight => `
            <div class="insight p-3 bg-gray-700/50 rounded-lg">
              <h4 class="font-semibold">${insight.title}</h4>
              <p class="text-sm text-gray-300">${insight.description}</p>
            </div>
          `).join('');
      }
    }
  
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  
    getMaxSafeHR() {
      // Calculate based on user profile and training phase
      return this.stella.getMaxSafeHeartRate() || 180;
    }
  
    triggerSafetyAlert() {
      const monitorStatus = document.getElementById('stella-monitor-status');
      if (monitorStatus) {
        monitorStatus.textContent = "WARNING: Heart rate exceeding safe limits";
        monitorStatus.classList.add('text-yellow-300');
      }
    }
    
    async completeSession() {
      if (!this.sessionId) return;
      
      try {
        const performanceData = {
          averageHeartRate: this.metrics.heartRate,
          peakHeartRate: this.metrics.heartRate + 10,
          o2Saturation: this.metrics.o2Saturation,
          timeInTargetZone: 900, // 15 minutes in seconds
          recoveryRate: this.metrics.recovery,
          caloriesBurned: 250
        };
        
        const response = await fetch('/training/physical/mission/2/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sessionId: this.sessionId,
            performanceData
          })
        });
        
        const data = await response.json();
        if (data.success) {
          this.handleCompletion(data);
        }
      } catch (error) {
        console.error("Error completing session:", error);
      }
    }
    
    handleCompletion(data) {
      // Show completion modal or redirect to results page
      alert(`Endurance mission completed!`);
      
      // Redirect to main physical training page after a delay
      setTimeout(() => {
        window.location.href = '/training/physical';
      }, 3000);
    }
    
    cleanup() {
      // Clear intervals when leaving the page
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
      }
    }
  }
  
  // Initialize when document loads
  document.addEventListener('DOMContentLoaded', () => {
    const tracker = new EnduranceTracker();
    tracker.initialize();
    
    // Set up complete button if it exists
    const completeButton = document.getElementById('complete-mission');
    if (completeButton) {
      completeButton.addEventListener('click', () => {
        tracker.completeSession();
      });
    }
    
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      tracker.cleanup();
    });
  });