const express = require('express');
const listEndpoints = require('express-list-endpoints');
const app = require('./app'); // Ensure app.js is correctly exporting the Express app
const fs = require('fs');

// Generate the endpoints list
const endpoints = listEndpoints(app);

// Check if the list is empty
if (!endpoints || endpoints.length === 0) {
    console.error('❌ No endpoints found. Check if app.js correctly exports the Express app.');
    process.exit(1);
}

// Print endpoints to console for verification
console.log('🚀 Available API Endpoints:', endpoints);

// Save to a JSON file
fs.writeFileSync('endpoints.json', JSON.stringify(endpoints, null, 2));
console.log('✅ API endpoints list saved to endpoints.json');
