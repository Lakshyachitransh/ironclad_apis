import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_VIDEO_PATH = process.argv[2] || './test-video.mp4';

// Create a test video file if it doesn't exist
function createTestVideo() {
  if (!fs.existsSync(TEST_VIDEO_PATH)) {
    console.log('⚠️ Test video file not found. Creating a minimal test video...');
    // Create a minimal valid MP4 file for testing
    const minimalMp4 = Buffer.from([
      0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70,
      0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x00, 0x00,
      0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32,
      0x6d, 0x70, 0x34, 0x31, 0x69, 0x73, 0x6f, 0x6d
    ]);
    fs.writeFileSync(TEST_VIDEO_PATH, minimalMp4);
    console.log(`✅ Created minimal test video at ${TEST_VIDEO_PATH}`);
  }
}

async function testVideoUpload() {
  try {
    createTestVideo();

    // First, authenticate to get a token
    console.log('🔐 Authenticating...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'password123',
      tenantId: 'default'
    });

    const token = loginResponse.data.access_token;
    console.log('✅ Authenticated successfully');

    // Create a test course if needed
    console.log('📚 Getting or creating test course...');
    const coursesResponse = await axios.get(`${API_BASE_URL}/courses`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    let courseId = coursesResponse.data[0]?.id;
    if (!courseId) {
      console.warn('⚠️ No course found. Please create a course first.');
      return;
    }

    // Get modules
    const modulesResponse = await axios.get(`${API_BASE_URL}/courses/${courseId}/modules`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    let moduleId = modulesResponse.data[0]?.id;
    if (!moduleId) {
      console.warn('⚠️ No module found in course. Please create a module first.');
      return;
    }

    // Get lessons
    const lessonsResponse = await axios.get(
      `${API_BASE_URL}/courses/${courseId}/modules/${moduleId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    let lessonId = lessonsResponse.data?.lessons?.[0]?.id;
    if (!lessonId) {
      console.warn('⚠️ No lesson found in module. Please create a lesson first.');
      return;
    }

    console.log(`\n📝 Test Details:`);
    console.log(`   Course ID: ${courseId}`);
    console.log(`   Module ID: ${moduleId}`);
    console.log(`   Lesson ID: ${lessonId}`);
    console.log(`   Video File: ${TEST_VIDEO_PATH}`);
    console.log(`   File Size: ${fs.statSync(TEST_VIDEO_PATH).size} bytes`);

    // Upload video
    console.log('\n📤 Uploading video...');
    const form = new FormData();
    const fileStream = fs.createReadStream(TEST_VIDEO_PATH);
    form.append('video', fileStream, {
      filename: path.basename(TEST_VIDEO_PATH),
      contentType: 'video/mp4'
    });
    form.append('videoDuration', '60');

    const uploadResponse = await axios.post(
      `${API_BASE_URL}/courses/lessons/${lessonId}/upload-video`,
      form,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          ...form.getHeaders()
        }
      }
    );

    console.log('✅ Video uploaded successfully!');
    console.log('\n📊 Response:');
    console.log(JSON.stringify(uploadResponse.data, null, 2));

    // Retrieve the lesson to verify
    console.log('\n🔍 Retrieving lesson to verify video...');
    const lessonResponse = await axios.get(
      `${API_BASE_URL}/courses/lessons/${lessonId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log('\n📄 Lesson Details:');
    console.log(`   Video URL: ${lessonResponse.data.presignedVideoUrl?.substring(0, 100)}...`);
    console.log(`   Video Duration: ${lessonResponse.data.videoDuration} seconds`);
    console.log(`   Video FileName: ${lessonResponse.data.videoFileName}`);

    // Test if the video URL is accessible and check headers
    if (lessonResponse.data.presignedVideoUrl) {
      console.log('\n🔗 Checking video URL headers...');
      try {
        const headResponse = await axios.head(lessonResponse.data.presignedVideoUrl, {
          validateStatus: () => true // Don't throw on any status
        });

        console.log('   Status:', headResponse.status);
        console.log('   Content-Type:', headResponse.headers['content-type']);
        console.log('   Content-Length:', headResponse.headers['content-length']);
        console.log('   Cache-Control:', headResponse.headers['cache-control']);
        console.log('   Access-Control-Allow-Origin:', headResponse.headers['access-control-allow-origin']);

        if (headResponse.headers['content-type'] !== 'video/mp4') {
          console.warn('⚠️ WARNING: Content-Type is not video/mp4!');
          console.warn(`   Expected: video/mp4`);
          console.warn(`   Got: ${headResponse.headers['content-type']}`);
        }
      } catch (error) {
        console.error('❌ Failed to check video URL headers:', error.message);
      }
    }

    console.log('\n✅ Video upload test completed!');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

testVideoUpload();
