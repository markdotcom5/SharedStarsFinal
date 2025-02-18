// config/vr-config.js
module.exports = {
    vr: {
        websocketPort: 8081,
        trackingUpdateRate: 120,
        hapticFeedbackEnabled: true,
        environmentalEffects: true,
        debug: process.env.NODE_ENV === 'development',
    },
    devices: {
        quest: {
            enabled: true,
            features: ['handTracking', 'voiceComms', 'environmentalEffects'],
        },
    },
    props: {
        trackingSystems: ['optical', 'magnetic', 'inertial'],
        calibrationMode: 'auto',
    },
    scenarios: {
        preload: true,
        assetPath: '/assets/vr/scenarios/',
        effectsEnabled: true,
    },
};
