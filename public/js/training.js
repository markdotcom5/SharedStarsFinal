class TrainingInterface {
    constructor() {
        this.timelineManager = window.timelineManager;
        this.biometricMonitor = new BiometricMonitor();
        this.aiCoach = new AICoach();
        
        // Existing module state
        this.moduleState = {
            currentPhase: null,
            failedAttempts: 0,
            certificationRequirements: new Map(),
            performanceHistory: []
        };

        // Keep existing requirement thresholds
        this.requirementThresholds = {
            physical: {
                minSimulationHours: 300,
                minPracticalHours: 200,
                minPassingScore: 0.85,
                biometricTargets: {
                    heartRate: { min: 60, max: 150 },
                    oxygenLevel: { min: 95 },
                    stressLevel: { max: 7 }
                }
            },
            technical: {
                requiredProcedures: 50,
                emergencyScenarios: 25,
                systemMasteryScore: 0.9,
                theoreticalExamScore: 0.85
            },
            simulation: {
                missionCompletions: 30,
                teamCoordination: 20,
                crisisManagement: 15,
                decisionAccuracy: 0.9
            }
        };

        // Add new user-centric tracking
        this.userProgress = {
            subscriptionMetrics: {
                startDate: new Date(),
                investmentToDate: 0,
                valueGained: 0,
                skillsAcquired: new Set(),
                certificationsEarned: new Set()
            },
            careerProgress: {
                currentLevel: 'Trainee',
                skillMatrix: new Map(),
                industryRecognition: new Set(),
                careerPathProgress: new Map()
            },
            personalMetrics: {
                learningStyle: null,
                peakPerformanceTimes: [],
                strengthAreas: new Set(),
                improvementAreas: new Set()
            }
        };

        this.initializeUserDashboard();
    }

    async initializeUserDashboard() {
        this.dashboard = {
            async updateRealTimeMetrics() {
                const metrics = await this.collectRealTimeMetrics();
                const analysis = await this.aiCoach.analyzeProgress(metrics);
                
                return {
                    dailyProgress: this.calculateDailyProgress(metrics),
                    spaceReadiness: this.assessSpaceReadiness(analysis),
                    valueMetrics: this.calculateValueMetrics(),
                    timelineUpdates: await this.timelineManager.getUpdates()
                };
            },

            async calculateValueMetrics() {
                const subscription = this.userProgress.subscriptionMetrics;
                return {
                    invested: subscription.investmentToDate,
                    skillsValue: await this.calculateSkillsMarketValue(),
                    progressValue: this.calculateProgressValue(),
                    certificationValue: this.calculateCertificationValue()
                };
            },

            async getPersonalizedInsights() {
                const biometrics = await this.biometricMonitor.getRecentData();
                const performance = this.moduleState.performanceHistory;
                
                return this.aiCoach.generatePersonalizedInsights({
                    biometrics,
                    performance,
                    learningStyle: this.userProgress.personalMetrics.learningStyle
                });
            }
        };
    }

    async startModule(moduleId) {
        // Keep existing module start logic
        const moduleData = await this.fetchModuleContent(moduleId);
        if (!this.validatePrerequisites(moduleData.prerequisites)) {
            throw new Error('Prerequisites not met');
        }

        // Add value tracking
        const moduleValue = await this.calculateModuleValue(moduleId);
        this.userProgress.subscriptionMetrics.valueGained += moduleValue;

        this.currentModule = {
            ...moduleData,
            startTime: Date.now(),
            failurePoints: new Set(),
            adaptiveDifficulty: this.calculateInitialDifficulty(),
            valueMetrics: moduleValue
        };

        // Initialize with personal optimization
        await this.initializePersonalizedPhase(moduleData.phases[0]);
    }

    async initializePersonalizedPhase(phase) {
        // Start biometric tracking
        const biometrics = await this.biometricMonitor.startTracking({
            interval: 1000,
            metrics: ['heartRate', 'oxygenLevel', 'stressLevel']
        });

        // Get AI guidance with personal factors
        const aiGuidance = await this.aiCoach.analyzeLearnerState({
            historicalPerformance: this.moduleState.performanceHistory,
            currentBiometrics: biometrics,
            phaseRequirements: phase.requirements,
            personalMetrics: this.userProgress.personalMetrics,
            careerGoals: this.userProgress.careerProgress.careerPathProgress
        });

        // Adjust for optimal learning
        this.adjustDifficulty(aiGuidance.recommendations);
        this.updatePersonalMetrics(aiGuidance.personalInsights);
    }

    async evaluatePerformance() {
        const metrics = await this.collectDetailedMetrics();
        
        if (this.checkFailureConditions(metrics)) {
            await this.handleFailure(metrics);
            return;
        }

        const progress = this.calculateProgress(metrics);
        
        // Update career progress
        await this.updateCareerProgress(progress);

        if (progress.certificationType) {
            await this.initiateCertificationProcess(progress.certificationType);
        }

        // Update value metrics
        await this.updateValueMetrics(progress);

        this.updateUI(metrics, progress);
    }

    async updateCareerProgress(progress) {
        const careerImpact = await this.calculateCareerImpact(progress);
        this.userProgress.careerProgress = {
            ...this.userProgress.careerProgress,
            ...careerImpact
        };

        // Update dashboard with career progress
        await this.dashboard.updateRealTimeMetrics();
    }

    async calculateCareerImpact(progress) {
        const skillGains = this.mapProgressToSkills(progress);
        const industryAlignment = await this.checkIndustryAlignment(skillGains);
        
        return {
            skillsGained: skillGains,
            newRecognitions: industryAlignment.recognitions,
            careerLevelProgress: industryAlignment.levelProgress,
            marketOpportunities: await this.findRelevantOpportunities(skillGains)
        };
    }

    async updateValueMetrics(progress) {
        const valueGained = await this.calculateValueGained(progress);
        this.userProgress.subscriptionMetrics.valueGained += valueGained;
        
        // Update ROI calculations
        await this.dashboard.calculateValueMetrics();
    }

    // ... keep other existing methods ...

    // Helper methods for new functionality
    async calculateModuleValue(moduleId) {
        // Implementation
    }

    async calculateSkillsMarketValue() {
        // Implementation
    }

    async findRelevantOpportunities(skills) {
        // Implementation
    }

    async mapProgressToSkills(progress) {
        // Implementation
    }

    async checkIndustryAlignment(skills) {
        // Implementation
    }
}

export default TrainingInterface;