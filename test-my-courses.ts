import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

async function test() {
  try {
    console.log('\n=== TESTING MY-COURSES ENDPOINT ===\n');

    // Step 1: Login
    console.log('1. Logging in with learner1@lakme.com...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'learner1@lakme.com',
      password: '1103@'
    });

    const token = loginRes.data.accessToken;
    console.log('✓ Login successful');
    console.log('Token:', token.substring(0, 50) + '...');

    const headers = { Authorization: `Bearer ${token}` };

    // Step 2: Call debug endpoint
    console.log('\n2. Calling debug-assignments endpoint...');
    const debugRes = await axios.get(`${BASE_URL}/courses/debug-assignments`, { headers });
    
    console.log('\n=== DEBUG OUTPUT ===');
    console.log(JSON.stringify(debugRes.data, null, 2));

    // Step 3: Call my-courses endpoint
    console.log('\n\n3. Calling my-courses endpoint...');
    const myCoursesRes = await axios.get(`${BASE_URL}/courses/my-courses?status=assigned`, { headers });
    
    console.log('\n=== MY-COURSES OUTPUT ===');
    console.log(JSON.stringify(myCoursesRes.data, null, 2));

  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
  }
}

test();
