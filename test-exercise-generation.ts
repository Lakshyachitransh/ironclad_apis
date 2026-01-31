/**
 * Test Exercise Generation Endpoint
 * 
 * This test demonstrates how to generate an exercise using the AI Tutor system
 * with your specific parameters: async and await topic with medium difficulty
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

// Your test data
const exerciseGenerationRequest = {
  topic: 'async and await',
  difficulty: 'intermediate', // Maps to medium difficulty
  programmingLanguage: 'javascript',
  courseId: '8b7bc0ee-aac7-4b53-809d-1f893de0e439',
  description: 'Learn async/await patterns and promise handling in JavaScript'
};

async function testExerciseGeneration() {
  try {
    console.log('📚 Starting Exercise Generation Test\n');
    console.log('Request Data:');
    console.log(JSON.stringify(exerciseGenerationRequest, null, 2));
    console.log('\n');

    // Step 1: Login to get JWT token
    console.log('🔐 Step 1: Authenticating...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@ironclad.local',
      password: 'Test123!@#'
    });

    const token = loginResponse.data.data.accessToken;
    console.log('✅ Authentication successful\n');

    // Step 2: Generate exercise
    console.log('🎯 Step 2: Generating Exercise...');
    const exerciseResponse = await axios.post(
      `${API_BASE_URL}/ai-tutor/generate-exercise`,
      exerciseGenerationRequest,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Exercise Generated Successfully!\n');
    
    // Display results
    const exercise = exerciseResponse.data.data;
    console.log('📋 Generated Exercise:');
    console.log('─'.repeat(60));
    console.log(`Title: ${exercise.title}`);
    console.log(`Difficulty: ${exercise.difficulty}`);
    console.log(`Category: ${exercise.category}`);
    console.log(`Language: ${exercise.programmingLanguage || 'javascript'}`);
    console.log('─'.repeat(60));
    
    console.log('\n📝 Instructions:');
    console.log(exercise.instructions);
    
    console.log('\n💻 Starting Code:');
    console.log(exercise.startingCode);
    
    console.log('\n🧪 Test Cases:');
    if (Array.isArray(exercise.testCases)) {
      exercise.testCases.forEach((test, index) => {
        console.log(`  Test ${index + 1}:`);
        console.log(`    Input: ${JSON.stringify(test.input)}`);
        console.log(`    Expected: ${JSON.stringify(test.expected)}`);
      });
    }
    
    console.log('\n💡 Highlighted Sections:');
    if (Array.isArray(exercise.highlightedSections)) {
      exercise.highlightedSections.forEach((section, index) => {
        console.log(`  ${index + 1}. ${section.hint}`);
        console.log(`     Lines: ${section.startLine}-${section.endLine}`);
      });
    }
    
    console.log('\n✨ Exercise generated and ready for students!');
    
  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Alternative format for the request - showing flexibility
const alternativeRequest = {
  topic: 'async and await',
  difficulty: 'medium',
  language: 'javascript',
  course_id: '8b7bc0ee-aac7-4b53-809d-1f893de0e439'
};

console.log('Available Request Format Examples:');
console.log('\n1️⃣ Camel Case Format (Recommended):');
console.log(JSON.stringify(exerciseGenerationRequest, null, 2));

console.log('\n2️⃣ Snake Case Format:');
console.log(JSON.stringify(alternativeRequest, null, 2));

// Run the test
testExerciseGeneration();
