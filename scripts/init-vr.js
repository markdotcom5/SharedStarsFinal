// scripts/init-vr.js
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

async function initializeVR() {
    console.log('🚀 Initializing VR environment...');

    // Create necessary directories
    const directories = [
        'modules/vr/scenarios',
        'modules/vr/props',
        'modules/vr/features',
        'modules/vr/effects',
        'services/vr',
        'models/vr',
        'routes/vr',
        'public/assets/vr'
    ];

    for (const dir of directories) {
        await fs.mkdir(path.join(__dirname, '..', dir), { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
    }

    // Install dependencies
    const dependencies = [
        'three',
        '@react-three/fiber',
        '@react-three/drei',
        'websocket',
        'ws',
        'haptics-api'
    ];

    const devDependencies = [
        '@types/three',
        '@types/websocket'
    ];

    console.log('📦 Installing dependencies...');
    execSync(`npm install ${dependencies.join(' ')}`);
    execSync(`npm install -D ${devDependencies.join(' ')}`);

    console.log('✅ Dependencies installed');

    // Create necessary files
    const files = [
        { 
            path: 'config/vr-config.js',
            content: '// VR Configuration\nmodule.exports = require("../config/vr-config");'
        },
        {
            path: 'middleware/vr.js',
            content: '// VR Middleware\nmodule.exports = require("../middleware/vr-middleware");'
        },
        {
            path: 'routes/vr/index.js',
            content: '// VR Routes\nconst router = require("express").Router();\nmodule.exports = router;'
        }
    ];

    for (const file of files) {
        await fs.writeFile(
            path.join(__dirname, '..', file.path),
            file.content
        );
        console.log(`✅ Created file: ${file.path}`);
    }

    console.log('🎮 VR environment initialized successfully!');
}

initializeVR().catch(console.error);