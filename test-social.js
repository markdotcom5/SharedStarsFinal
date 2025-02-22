// test-social.js
const socialPlatformIntegrator = require('./services/SocialPlatformIntegrator');

async function testSocialIntegration() {
  try {
    console.log('Testing social platform integrator...');
    
    // Test platform initialization
    console.log('Available platforms:', Object.keys(socialPlatformIntegrator.platforms));
    
    // Test a specific platform (this will use the default implementation)
    const result = await socialPlatformIntegrator.platforms.facebook.share({
      text: 'This is a test post'
    });
    
    console.log('Share result:', result);
    console.log('✅ Basic functionality test passed');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSocialIntegration();