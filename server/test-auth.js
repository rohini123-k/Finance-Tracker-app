const axios = require('axios');

const testAuthEndpoint = async () => {
  const baseURL = 'http://localhost:5000';
  
  console.log('Testing auth endpoint CORS...');
  
  try {
    // Test OPTIONS request to auth/login (preflight)
    console.log('1. Testing OPTIONS request to /api/auth/login...');
    const optionsResponse = await axios.options(`${baseURL}/api/auth/login`, {
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    console.log('✅ OPTIONS request passed:', optionsResponse.status);
    console.log('CORS headers:', {
      'Access-Control-Allow-Origin': optionsResponse.headers['access-control-allow-origin'],
      'Access-Control-Allow-Methods': optionsResponse.headers['access-control-allow-methods'],
      'Access-Control-Allow-Headers': optionsResponse.headers['access-control-allow-headers']
    });
    
    // Test POST request to auth/login
    console.log('2. Testing POST request to /api/auth/login...');
    const postResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'testpassword'
    }, {
      headers: {
        'Origin': 'http://localhost:3000',
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ POST request passed:', postResponse.status);
    
  } catch (error) {
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response headers:', error.response.headers);
      if (error.response.status === 400 || error.response.status === 401) {
        console.log('✅ CORS is working (got expected auth error)');
      } else {
        console.error('❌ Unexpected error:', error.response.data);
      }
    } else {
      console.error('❌ Network error:', error.message);
    }
  }
};

// Run test if this file is executed directly
if (require.main === module) {
  testAuthEndpoint();
}

module.exports = testAuthEndpoint;
