/**
 * Live Class API Testing Guide
 * 
 * This script demonstrates how to create and handle live classes
 * including creation, starting, joining, and ending sessions.
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

// Test data
interface TestUser {
  email: string;
  password: string;
  role: string;
  token?: string;
  id?: string;
  tenantId?: string;
}

const users: Record<string, TestUser> = {
  teacher: {
    email: 'teacher@example.com',
    password: 'Teacher123!',
    role: 'training_manager'
  },
  student1: {
    email: 'student1@example.com',
    password: 'Student123!',
    role: 'student'
  },
  student2: {
    email: 'student2@example.com',
    password: 'Student123!',
    role: 'student'
  }
};

// ============================================================================
// STEP 1: AUTHENTICATION
// ============================================================================

async function authenticateUser(userKey: string): Promise<void> {
  const user = users[userKey];
  console.log(`\n🔐 Authenticating ${userKey} (${user.email})...`);

  try {
    // Step 1a: Register if needed
    try {
      const registerRes = await axios.post(`${API_BASE_URL}/auth/register`, {
        email: user.email,
        password: user.password,
        displayName: userKey.charAt(0).toUpperCase() + userKey.slice(1)
      });
      console.log(`   ✓ User registered`);
    } catch (err: any) {
      if (err.response?.status === 409) {
        console.log(`   ℹ User already exists`);
      } else {
        throw err;
      }
    }

    // Step 1b: Login to get JWT token
    const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: user.email,
      password: user.password
    });

    user.token = loginRes.data.accessToken;
    user.id = loginRes.data.userId;
    user.tenantId = loginRes.data.tenantId;

    console.log(`   ✓ Authentication successful`);
    console.log(`     Token: ${user.token.substring(0, 20)}...`);
    console.log(`     User ID: ${user.id}`);
    console.log(`     Tenant ID: ${user.tenantId}`);
  } catch (error: any) {
    console.error(`   ✗ Authentication failed:`, error.response?.data || error.message);
    throw error;
  }
}

// ============================================================================
// STEP 2: CREATE LIVE CLASS
// ============================================================================

interface LiveClass {
  id: string;
  title: string;
  description?: string;
  status: string;
  roomId: string;
  scheduledAt: string;
  maxParticipants: number;
  participantCount: number;
}

async function createLiveClass(teacherKey: string): Promise<LiveClass> {
  const teacher = users[teacherKey];
  console.log(`\n📚 Creating live class...`);

  try {
    const scheduledTime = new Date();
    scheduledTime.setMinutes(scheduledTime.getMinutes() + 5); // Schedule 5 minutes from now

    const res = await axios.post(
      `${API_BASE_URL}/live-classes`,
      {
        tenantId: teacher.tenantId,
        title: 'JavaScript Advanced Concepts - Live Session',
        description: 'Real-time Q&A for advanced JavaScript topics including async/await, promises, and callbacks',
        scheduledAt: scheduledTime.toISOString(),
        maxParticipants: 150
      },
      {
        headers: {
          Authorization: `Bearer ${teacher.token}`
        }
      }
    );

    const liveClass = res.data;
    console.log(`   ✓ Live class created successfully`);
    console.log(`     ID: ${liveClass.id}`);
    console.log(`     Title: ${liveClass.title}`);
    console.log(`     Status: ${liveClass.status}`);
    console.log(`     Room ID: ${liveClass.roomId}`);
    console.log(`     Max Participants: ${liveClass.maxParticipants}`);
    console.log(`     Scheduled: ${liveClass.scheduledAt}`);

    return liveClass;
  } catch (error: any) {
    console.error(`   ✗ Failed to create live class:`, error.response?.data || error.message);
    throw error;
  }
}

// ============================================================================
// STEP 3: LIST LIVE CLASSES
// ============================================================================

async function listLiveClasses(userKey: string): Promise<void> {
  const user = users[userKey];
  console.log(`\n📋 Listing live classes...`);

  try {
    const res = await axios.get(
      `${API_BASE_URL}/live-classes?limit=10&offset=0`,
      {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      }
    );

    const { total, liveClasses } = res.data;
    console.log(`   ✓ Retrieved ${liveClasses.length} of ${total} live classes`);

    liveClasses.forEach((lc: LiveClass, index: number) => {
      console.log(`\n   [${index + 1}] ${lc.title}`);
      console.log(`       Status: ${lc.status}`);
      console.log(`       Participants: ${lc.participantCount}/${lc.maxParticipants}`);
      console.log(`       Room ID: ${lc.roomId}`);
    });
  } catch (error: any) {
    console.error(`   ✗ Failed to list live classes:`, error.response?.data || error.message);
    throw error;
  }
}

// ============================================================================
// STEP 4: GET LIVE CLASS DETAILS
// ============================================================================

async function getLiveClassDetails(userKey: string, liveClassId: string): Promise<void> {
  const user = users[userKey];
  console.log(`\n🔍 Getting live class details...`);

  try {
    const res = await axios.get(
      `${API_BASE_URL}/live-classes/${liveClassId}`,
      {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      }
    );

    const lc = res.data;
    console.log(`   ✓ Live class details retrieved`);
    console.log(`     ID: ${lc.id}`);
    console.log(`     Title: ${lc.title}`);
    console.log(`     Description: ${lc.description}`);
    console.log(`     Status: ${lc.status}`);
    console.log(`     Room ID: ${lc.roomId}`);
    console.log(`     Scheduled At: ${lc.scheduledAt}`);
    console.log(`     Max Participants: ${lc.maxParticipants}`);
    console.log(`     Current Participants: ${lc.participantCount}`);
    console.log(`     Active Participants: ${lc.activeParticipants}`);
    
    if (lc.participants?.length > 0) {
      console.log(`     Participants:`);
      lc.participants.forEach((p: any) => {
        console.log(`       - User ${p.userId} (${p.role}): joined ${p.joinedAt}`);
      });
    }
  } catch (error: any) {
    console.error(`   ✗ Failed to get live class details:`, error.response?.data || error.message);
    throw error;
  }
}

// ============================================================================
// STEP 5: START LIVE CLASS
// ============================================================================

async function startLiveClass(teacherKey: string, liveClassId: string): Promise<void> {
  const teacher = users[teacherKey];
  console.log(`\n▶️  Starting live class...`);

  try {
    const res = await axios.post(
      `${API_BASE_URL}/live-classes/${liveClassId}/start`,
      {},
      {
        headers: {
          Authorization: `Bearer ${teacher.token}`
        }
      }
    );

    console.log(`   ✓ Live class started successfully`);
    console.log(`     Status: ${res.data.status}`);
    console.log(`     Started At: ${res.data.startedAt}`);
    console.log(`     Message: ${res.data.message}`);
  } catch (error: any) {
    console.error(`   ✗ Failed to start live class:`, error.response?.data || error.message);
    throw error;
  }
}

// ============================================================================
// STEP 6: JOIN LIVE CLASS
// ============================================================================

interface ParticipantResponse {
  id: string;
  liveClassId: string;
  userId: string;
  roomId: string;
  joinedAt: string;
  message: string;
}

async function joinLiveClass(userKey: string, liveClassId: string): Promise<ParticipantResponse> {
  const user = users[userKey];
  console.log(`\n👤 ${userKey} joining live class...`);

  try {
    const res = await axios.post(
      `${API_BASE_URL}/live-classes/${liveClassId}/join`,
      {},
      {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      }
    );

    console.log(`   ✓ Successfully joined`);
    console.log(`     Participant ID: ${res.data.id}`);
    console.log(`     Room ID: ${res.data.roomId}`);
    console.log(`     Joined At: ${res.data.joinedAt}`);
    console.log(`     Message: ${res.data.message}`);

    return res.data;
  } catch (error: any) {
    console.error(`   ✗ Failed to join live class:`, error.response?.data || error.message);
    throw error;
  }
}

// ============================================================================
// STEP 7: GET ACTIVE PARTICIPANTS
// ============================================================================

async function getActiveParticipants(userKey: string, liveClassId: string): Promise<void> {
  const user = users[userKey];
  console.log(`\n👥 Getting active participants...`);

  try {
    const res = await axios.get(
      `${API_BASE_URL}/live-classes/${liveClassId}/participants`,
      {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      }
    );

    const { activeCount, maxCapacity, isFull, participants } = res.data;
    console.log(`   ✓ Participants retrieved`);
    console.log(`     Active: ${activeCount}/${maxCapacity}`);
    console.log(`     Is Full: ${isFull}`);
    console.log(`     Capacity Used: ${Math.round((activeCount / maxCapacity) * 100)}%`);

    if (participants?.length > 0) {
      console.log(`     Participant List:`);
      participants.forEach((p: any, i: number) => {
        console.log(`       [${i + 1}] User: ${p.userId} | Role: ${p.role} | Joined: ${p.joinedAt}`);
      });
    }
  } catch (error: any) {
    console.error(`   ✗ Failed to get participants:`, error.response?.data || error.message);
    throw error;
  }
}

// ============================================================================
// STEP 8: LEAVE LIVE CLASS
// ============================================================================

async function leaveLiveClass(userKey: string, liveClassId: string): Promise<void> {
  const user = users[userKey];
  console.log(`\n🚪 ${userKey} leaving live class...`);

  try {
    const res = await axios.post(
      `${API_BASE_URL}/live-classes/${liveClassId}/leave`,
      {},
      {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      }
    );

    console.log(`   ✓ Successfully left`);
    console.log(`     Left At: ${res.data.leftAt}`);
    console.log(`     Message: ${res.data.message}`);
  } catch (error: any) {
    console.error(`   ✗ Failed to leave live class:`, error.response?.data || error.message);
    throw error;
  }
}

// ============================================================================
// STEP 9: END LIVE CLASS
// ============================================================================

async function endLiveClass(teacherKey: string, liveClassId: string): Promise<void> {
  const teacher = users[teacherKey];
  console.log(`\n⏹️  Ending live class...`);

  try {
    const res = await axios.post(
      `${API_BASE_URL}/live-classes/${liveClassId}/end`,
      {},
      {
        headers: {
          Authorization: `Bearer ${teacher.token}`
        }
      }
    );

    console.log(`   ✓ Live class ended successfully`);
    console.log(`     Status: ${res.data.status}`);
    console.log(`     Ended At: ${res.data.endedAt}`);
    console.log(`     Message: ${res.data.message}`);
  } catch (error: any) {
    console.error(`   ✗ Failed to end live class:`, error.response?.data || error.message);
    throw error;
  }
}

// ============================================================================
// STEP 10: SET RECORDING URL
// ============================================================================

async function setRecordingUrl(teacherKey: string, liveClassId: string): Promise<void> {
  const teacher = users[teacherKey];
  console.log(`\n📹 Setting recording URL...`);

  try {
    const recordingUrl = `s3://bucket/live-classes/${liveClassId}/recording.mp4`;
    
    const res = await axios.post(
      `${API_BASE_URL}/live-classes/${liveClassId}/recording`,
      { recordingUrl },
      {
        headers: {
          Authorization: `Bearer ${teacher.token}`
        }
      }
    );

    console.log(`   ✓ Recording URL set successfully`);
    console.log(`     Recording URL: ${res.data.recordingUrl}`);
    console.log(`     Message: ${res.data.message}`);
  } catch (error: any) {
    console.error(`   ✗ Failed to set recording URL:`, error.response?.data || error.message);
    throw error;
  }
}

// ============================================================================
// MAIN TEST FLOW
// ============================================================================

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                  LIVE CLASS API - COMPREHENSIVE TEST                       ║
║                                                                            ║
║ This script demonstrates the complete live class lifecycle:               ║
║ 1. User authentication                                                     ║
║ 2. Create live class                                                       ║
║ 3. List live classes                                                       ║
║ 4. Get live class details                                                  ║
║ 5. Start live class                                                        ║
║ 6. Join live class (multiple users)                                        ║
║ 7. Get active participants                                                 ║
║ 8. Leave live class                                                        ║
║ 9. End live class                                                          ║
║ 10. Set recording URL                                                      ║
╚════════════════════════════════════════════════════════════════════════════╝
  `);

  try {
    // Step 1: Authenticate all users
    await authenticateUser('teacher');
    await authenticateUser('student1');
    await authenticateUser('student2');

    // Step 2: Create a live class
    const liveClass = await createLiveClass('teacher');
    const liveClassId = liveClass.id;

    // Step 3: List all live classes
    await listLiveClasses('teacher');

    // Step 4: Get details of the specific class
    await getLiveClassDetails('teacher', liveClassId);

    // Step 5: Start the live class
    await startLiveClass('teacher', liveClassId);

    // Step 6: Have users join the live class
    await joinLiveClass('teacher', liveClassId);
    await joinLiveClass('student1', liveClassId);
    await joinLiveClass('student2', liveClassId);

    // Step 7: Check active participants
    await getActiveParticipants('teacher', liveClassId);

    // Step 8: Have one student leave
    await leaveLiveClass('student2', liveClassId);

    // Step 9: Check participants again
    console.log(`\n📋 After student2 leaves:`);
    await getActiveParticipants('teacher', liveClassId);

    // Step 10: End the live class
    await endLiveClass('teacher', liveClassId);

    // Step 11: Set recording URL
    await setRecordingUrl('teacher', liveClassId);

    // Step 12: Get final details
    await getLiveClassDetails('teacher', liveClassId);

    console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                         ✓ ALL TESTS COMPLETED                             ║
╚════════════════════════════════════════════════════════════════════════════╝
    `);

  } catch (error) {
    console.error(`\n✗ Test failed:`, error);
    process.exit(1);
  }
}

main();
