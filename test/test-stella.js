// test-stella.js
const axios = require('axios');
const BASE_URL = 'http://localhost:3000/api/stella';

async function testStellaAPI() {
  console.log('STELLA API Integration Test\n------------------------');
  
  try {
    // Test status endpoint
    console.log('Testing /status endpoint...');
    const statusRes = await axios.get(`${BASE_URL}/status`);
    console.log('Status:', statusRes.data.status);
    console.log('Version:', statusRes.data.version);
    console.log('Capabilities:', statusRes.data.capabilities);
    
    // Test guidance endpoint
    console.log('\nTesting /guidance endpoint...');
    const guidanceRes = await axios.post(`${BASE_URL}/guidance`, {
      userId: 'test-user',
      question: 'How do I prepare for microgravity?'
    });
    console.log('Guidance response:', guidanceRes.data.guidance.message.substring(0, 100) + '...');
    
    // Test countdown endpoints if implemented
    console.log('\nTesting countdown functionality...');
    try {
      const countdownRes = await axios.post(`${BASE_URL}/countdown/start`, {
        userId: 'test-user',
        mission: 'space-walk-demo',
        duration: 3600 // 1 hour in seconds
      });
      console.log('Countdown started:', countdownRes.data.success);
      
      const statusRes = await axios.get(`${BASE_URL}/countdown/status?userId=test-user`);
      console.log('Countdown status:', statusRes.data.status);
    } catch (err) {
      console.log('Countdown endpoints not yet implemented or failed');
    }
    
    console.log('\nAll tests completed!');
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testStellaAPI();