// services/ModuleSystemIntegrator.js
const { ReinforcementLearning } = require('../models/ReinforcementLearning');
const VRSession = require('../models/vr/VRSession');
const ImmersiveScenarios = require('../modules/vr/scenarios/ImmersiveScenarios');
const PhysicalPropsIntegration = require('../modules/vr/props/PhysicalPropsIntegration');

class ModuleSystemIntegrator {
    constructor() {
        this.rl = ReinforcementLearning;
        this.activeModules = new Map();
        this.moduleConfigs = new Map();
    }

    async initialize() {
        console.log('🚀 Initializing Module System Integrator');
        await this.loadModuleConfigs();
        await this.initializeActiveModules();
        console.log('✅ Module System Integrator initialized');
    }

    async loadModuleConfigs() {
        // Load configurations for all modules
        this.moduleConfigs.set('vr', {
            scenarios: ImmersiveScenarios,
            props: PhysicalPropsIntegration,
            sessions: VRSession
        });
    }

    async initializeActiveModules() {
        for (const [moduleType, config] of this.moduleConfigs) {
            try {
                await this.initializeModule(moduleType, config);
                console.log(`✅ Initialized ${moduleType} module`);
            } catch (error) {
                console.error(`❌ Error initializing ${moduleType} module:`, error);
            }
        }
    }

    async initializeModule(moduleType, config) {
        const module = {
            type: moduleType,
            config,
            status: 'active',
            instances: new Map()
        };

        // Initialize module components
        if (config.scenarios) {
            module.scenarios = await config.scenarios.initialize();
        }
        if (config.props) {
            module.props = await config.props.initialize();
        }

        this.activeModules.set(moduleType, module);
        return module;
    }

    async getModuleInstance(moduleType, instanceId) {
        const module = this.activeModules.get(moduleType);
        if (!module) throw new Error(`Module ${moduleType} not found`);

        let instance = module.instances.get(instanceId);
        if (!instance) {
            instance = await this.createModuleInstance(module, instanceId);
            module.instances.set(instanceId, instance);
        }

        return instance;
    }

    async createModuleInstance(module, instanceId) {
        const instance = {
            id: instanceId,
            module: module.type,
            created: new Date(),
            state: await this.rl.getState(instanceId, module.type, {}),
            active: true
        };

        return instance;
    }

    async handleModuleEvent(moduleType, instanceId, event) {
        try {
            const instance = await this.getModuleInstance(moduleType, instanceId);
            const module = this.activeModules.get(moduleType);

            switch (event.type) {
                case 'start':
                    return await this.handleModuleStart(module, instance, event);
                case 'update':
                    return await this.handleModuleUpdate(module, instance, event);
                case 'complete':
                    return await this.handleModuleComplete(module, instance, event);
                default:
                    throw new Error(`Unknown event type: ${event.type}`);
            }
        } catch (error) {
            console.error('Error handling module event:', error);
            throw error;
        }
    }

    async handleModuleUpdate(module, instance, event) {
        // Update module state
        const nextState = await this.rl.getState(instance.id, module.type, event.data);
        const action = await this.rl.selectAction(instance.state._id, event.actions);
        
        // Apply action and get reward
        const reward = await this.applyModuleAction(module, instance, action);
        
        // Update RL model
        await this.rl.updateAction(instance.state._id, action, reward, nextState._id);
        instance.state = nextState;

        return instance;
    }

    async handleModuleComplete(module, instance, event) {
        // Handle completion
        if (module.type === 'vr') {
            instance.session.endTime = new Date();
            await instance.session.save();
        }

        // Update final state
        const finalState = await this.rl.getState(instance.id, module.type, event.data);
        await this.rl.updateState(finalState._id, event.reward);

        instance.active = false;
        return instance;
    }

    async applyModuleAction(module, instance, action) {
        let reward = 0;

        switch (module.type) {
            case 'vr':
                reward = await this.applyVRAction(instance, action);
                break;
            // Add other module types here
            default:
                reward = 0;
        }

        return reward;
    }

    async applyVRAction(instance, action) {
        try {
            const session = instance.session;
            if (!session) throw new Error('No active VR session');

            // Apply action and calculate reward
            const beforeMetrics = session.metrics;
            await session.save();
            const afterMetrics = session.metrics;

            // Calculate reward based on improvement
            return this.calculateVRReward(beforeMetrics, afterMetrics);
        } catch (error) {
            console.error('Error applying VR action:', error);
            return 0;
        }
    }

    calculateVRReward(before, after) {
        // Calculate reward based on improvement in metrics
        const performanceImprovement = (after.performance.accuracy - before.performance.accuracy) * 0.4;
        const biometricStability = (1 - Math.abs(after.biometrics.stressLevel - before.biometrics.stressLevel)) * 0.3;
        const technicalQuality = (after.technical.trackingQuality - before.technical.trackingQuality) * 0.3;

        return performanceImprovement + biometricStability + technicalQuality;
    }
}

module.exports = new ModuleSystemIntegrator();