class EVASafetyMonitor {
    constructor() {
        this.thresholds = {
            oxygen: { min: 85, max: 100, unit: '%' },
            pressure: { min: 3.5, max: 5.0, unit: 'PSI' },
            temperature: { min: 60, max: 85, unit: '°F' },
            battery: { min: 20, max: 100, unit: '%' }
        };
        
        this.monitoringInterval = null;
        this.currentSession = null;
        this.alertHandlers = new Map();
    }

    async initialize(safetyProtocols) {
        this.protocols = safetyProtocols;
        this.setupAlertHandlers();
        this.initializeUI();
    }

    setupAlertHandlers() {
        this.alertHandlers.set('oxygen', (value) => {
            if (value < this.thresholds.oxygen.min) {
                this.triggerAlert('Critical: Low Oxygen Level', 'critical');
            } else if (value < this.thresholds.oxygen.min + 5) {
                this.triggerAlert('Warning: Oxygen Level Low', 'warning');
            }
        });

        this.alertHandlers.set('pressure', (value) => {
            if (value < this.thresholds.pressure.min || value > this.thresholds.pressure.max) {
                this.triggerAlert('Critical: Pressure Out of Range', 'critical');
            }
        });

        // Add more alert handlers as needed
    }

    startMonitoring(sessionId) {
        this.currentSession = sessionId;
        this.monitoringInterval = setInterval(() => this.checkVitalSigns(), 1000);
    }

    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }

    async checkVitalSigns() {
        try {
            const vitals = await this.fetchVitalSigns();
            this.updateVitalsDisplay(vitals);
            this.checkThresholds(vitals);
        } catch (error) {
            console.error("❌ Vitals Check Error:", error);
            this.handleMonitoringError(error);
        }
    }

    async fetchVitalSigns() {
        const response = await fetch(`/api/eva/session/${this.currentSession}/vitals`);
        if (!response.ok) throw new Error('Failed to fetch vital signs');
        return response.json();
    }

    checkThresholds(vitals) {
        for (const [metric, value] of Object.entries(vitals)) {
            const handler = this.alertHandlers.get(metric);
            if (handler) {
                handler(value);
            }
        }
    }

    triggerAlert(message, severity) {
        const alertElement = document.getElementById('eva-alerts');
        if (alertElement) {
            const alert = document.createElement('div');
            alert.className = `alert alert-${severity} fade-in`;
            alert.textContent = message;
            alertElement.appendChild(alert);

            // Remove alert after 5 seconds
            setTimeout(() => alert.remove(), 5000);
        }

        if (severity === 'critical') {
            this.triggerEmergencyProtocol(message);
        }
    }

    async triggerEmergencyProtocol(reason) {
        try {
            console.log("🚨 Emergency Protocol Triggered:", reason);
            
            // Stop normal monitoring
            this.stopMonitoring();

            // Notify backend
            await fetch(`/api/eva/session/${this.currentSession}/emergency`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason })
            });

            // Update UI
            document.body.classList.add('emergency-mode');
            this.showEmergencyProcedures();

        } catch (error) {
            console.error("❌ Emergency Protocol Error:", error);
            // Fallback to local emergency procedures
            this.showEmergencyProcedures();
        }
    }

    showEmergencyProcedures() {
        const emergencyUI = document.getElementById('emergency-procedures');
        if (emergencyUI) {
            emergencyUI.classList.remove('hidden');
            // Populate with relevant procedures
            emergencyUI.innerHTML = this.protocols.emergency
                .map(proc => `<div class="emergency-step">${proc}</div>`)
                .join('');
        }
    }

    updateVitalsDisplay(vitals) {
        for (const [metric, value] of Object.entries(vitals)) {
            const element = document.getElementById(`eva-${metric}`);
            if (element) {
                element.textContent = `${value}${this.thresholds[metric].unit}`;
                this.updateMetricStatus(element, metric, value);
            }
        }
    }

    updateMetricStatus(element, metric, value) {
        const threshold = this.thresholds[metric];
        element.classList.remove('normal', 'warning', 'critical');
        
        if (value < threshold.min || value > threshold.max) {
            element.classList.add('critical');
        } else if (value < threshold.min + 5 || value > threshold.max - 5) {
            element.classList.add('warning');
        } else {
            element.classList.add('normal');
        }
    }

    handleMonitoringError(error) {
        console.error("Monitoring Error:", error);
        this.triggerAlert('Monitoring System Error', 'warning');
        
        // If connection lost, switch to local monitoring
        if (error.message.includes('fetch')) {
            this.switchToLocalMonitoring();
        }
    }

    switchToLocalMonitoring() {
        console.log("⚠️ Switching to Local Monitoring");
        // Implement local monitoring logic
    }

    async performFinalChecks() {
        try {
            const checks = await this.runSafetyChecklist();
            const telemetry = await this.getFullTelemetry();
            
            return {
                passed: checks.every(check => check.passed),
                safetyScore: this.calculateSafetyScore(checks, telemetry),
                checks,
                telemetry
            };
        } catch (error) {
            console.error("❌ Final Checks Error:", error);
            throw error;
        }
    }

    async runSafetyChecklist() {
        // Implement safety checklist verification
        return [];
    }

    async getFullTelemetry() {
        // Implement telemetry gathering
        return {};
    }

    calculateSafetyScore(checks, telemetry) {
        // Implement safety score calculation
        return 100;
    }

    initializeUI() {
        // Initialize safety monitoring UI elements
        const container = document.getElementById('eva-safety-monitor');
        if (container) {
            container.innerHTML = this.generateSafetyUI();
        }
    }

    generateSafetyUI() {
        return `
            <div class="safety-monitor-container">
                <div id="eva-alerts" class="alerts-container"></div>
                <div class="vitals-grid">
                    ${Object.entries(this.thresholds).map(([metric, data]) => `
                        <div class="vital-metric">
                            <label>${metric.toUpperCase()}</label>
                            <span id="eva-${metric}" class="normal">--${data.unit}</span>
                        </div>
                    `).join('')}
                </div>
                <div id="emergency-procedures" class="hidden"></div>
            </div>
        `;
    }
}

export default EVASafetyMonitor;