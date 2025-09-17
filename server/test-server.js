const axios = require('axios');

const testServer = async () => {
  const baseURL = 'http://localhost:5000';
  
  console.log('Testing server connection...');
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${baseURL}/api/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    
    // Test CORS preflight
    console.log('2. Testing CORS preflight...');
    const corsResponse = await axios.options(`${baseURL}/api/health`, {
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    console.log('✅ CORS preflight passed:', corsResponse.status);
    
    // Test actual CORS request
    console.log('3. Testing CORS request...');
    const corsRequest = await axios.get(`${baseURL}/api/health`, {
      headers: {
        'Origin': 'http://localhost:3000'
      }
    });
    console.log('✅ CORS request passed:', corsRequest.status);
    
    console.log('\n🎉 All tests passed! Server is ready.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};

// Run test if this file is executed directly
if (require.main === module) {
  testServer();
}

module.exports = testServer;
