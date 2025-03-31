// scripts/test-stella-integration.js
const axios = require('axios');
const BASE_URL = 'http://localhost:3000/api/stella';

async function testStellaIntegration() {
  console.log('STELLA Service Integration Test\n---------------------------');
  
  try {
    // 1. Test status endpoint
    console.log('Testing /status endpoint...');
    const statusRes = await axios.get(`${BASE_URL}/status`);
    console.log('Status:', statusRes.data.status);
    console.log('Version:', statusRes.data.version);
    console.log('Capabilities:', statusRes.data.capabilities);
    
    // 2. Test guidance endpoint
    console.log('\nTesting /guidance endpoint...');
    const guidanceRes = await axios.post(`${BASE_URL}/guidance`, {
      userId: 'test-integration',
      question: 'How do I prepare for my first EVA training?'
    });
    console.log('Guidance response:', guidanceRes.data.guidance.message.substring(0, 100) + '...');
    
    // 3. Test daily briefing if implemented
    console.log('\nTesting daily briefing functionality...');
    try {
      const briefingRes = await axios.get(`${BASE_URL}/daily-briefing?userId=test-integration`);
      console.log('Briefing available:', briefingRes.data.success);
      if (briefingRes.data.success) {
        console.log('Briefing summary:', briefingRes.data.briefing.summary.substring(0, 100) + '...');
      }
    } catch (err) {
      console.log('Daily briefing endpoint not yet implemented or failed');
    }
    
    // 4. Test countdown functionality if implemented
    console.log('\nTesting countdown functionality...');
    try {
      const countdownRes = await axios.post(`${BASE_URL}/countdown/start`, {
        userId: 'test-integration',
        mission: 'test-mission',
        duration: 3600 // 1 hour in seconds
      });
      console.log('Countdown started:', countdownRes.data.success);
      
      if (countdownRes.data.success) {
        const statusRes = await axios.get(`${BASE_URL}/countdown/status?userId=test-integration`);
        console.log('Countdown status:', statusRes.data.status.active ? 'Active' : 'Inactive');
        console.log('Current time remaining:', statusRes.data.status.currentTime);
      }
    } catch (err) {
      console.log('Countdown endpoints not yet implemented or failed');
    }
    
    // 5. Test personality service if implemented
    console.log('\nTesting personality service...');
    try {
      const personalityRes = await axios.post(`${BASE_URL}/personality/update`, {
        userId: 'test-integration',
        traits: {
          supportiveness: 0.8,
          technicalDetail: 0.6,
          encouragement: 0.9
        }
      });
      console.log('Personality update successful:', personalityRes.data.success);
      if (personalityRes.data.success) {
        console.log('Updated traits:', JSON.stringify(personalityRes.data.personality));
      }
    } catch (err) {
      console.log('Personality service not yet implemented or failed');
    }
    
    console.log('\nAll tests completed!');
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the tests
testStellaIntegration();