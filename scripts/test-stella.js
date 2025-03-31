// scripts/test-stella.js
const axios = require('axios');
const BASE_URL = 'http://localhost:3000/api/stella';

async function testStellaAPI() {
  console.log('STELLA API Test\n--------------');
  
  try {
    // Test test endpoint first (simpler)
    console.log('Testing /test endpoint...');
    const testRes = await axios.get(`${BASE_URL}/test`);
    console.log('Test response:', testRes.data);
    
    // If that works, try status
    console.log('\nTesting /status endpoint...');
    const statusRes = await axios.get(`${BASE_URL}/status`);
    console.log('Status response:', statusRes.data);
    
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testStellaAPI();