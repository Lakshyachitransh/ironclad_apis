/**
 * WebRTC Debugging Script
 * 
 * Usage: 
 * npx ts-node debug-webrtc.ts
 * 
 * This script helps diagnose WebRTC connection issues by:
 * 1. Testing WebSocket connection
 * 2. Simulating a join event
 * 3. Testing signal delivery between two peers
 */

import io from 'socket.io-client';

const WS_URL = 'http://localhost:3000/ws-live-class';
const ROOM_ID = 'debug-test-room-' + Date.now();

interface Participant {
  socketId: string;
  username: string;
}

let peer1: any = null;
let peer2: any = null;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testWebRTCSignaling() {
  console.log('\n🔍 Starting WebRTC Signaling Debug...\n');
  console.log(`📍 Room: ${ROOM_ID}`);
  console.log(`🌐 WebSocket: ${WS_URL}\n`);

  // Step 1: Connect Peer 1
  console.log('📍 Step 1: Connecting Peer 1...');
  peer1 = await connectPeer('Peer1', 'peer1@example.com');
  if (!peer1) {
    console.error('❌ Failed to connect Peer 1');
    process.exit(1);
  }

  await sleep(500);

  // Step 2: Join Peer 1 to room
  console.log('\n📍 Step 2: Peer 1 joining room...');
  const peer1SocketId = await joinRoom(peer1, 'Peer1', 'peer1@example.com');
  console.log(`✅ Peer 1 joined. Socket ID: ${peer1SocketId}`);

  await sleep(800);

  // Step 3: Connect Peer 2
  console.log('\n📍 Step 3: Connecting Peer 2...');
  peer2 = await connectPeer('Peer2', 'peer2@example.com');
  if (!peer2) {
    console.error('❌ Failed to connect Peer 2');
    process.exit(1);
  }

  await sleep(500);

  // Step 4: Join Peer 2 to room (should see Peer 1 in existing-participants)
  console.log('\n📍 Step 4: Peer 2 joining room...');
  const peer2SocketId = await joinRoom(peer2, 'Peer2', 'peer2@example.com');
  console.log(`✅ Peer 2 joined. Socket ID: ${peer2SocketId}`);

  await sleep(800);

  // Step 5: Get room stats
  console.log('\n📍 Step 5: Getting room stats...');
  getStats(peer1);
  await sleep(500);

  // Step 6: Test signal delivery
  console.log('\n📍 Step 6: Testing signal delivery (Peer 1 -> Peer 2)...');
  testSignalDelivery(peer1, peer2SocketId);

  await sleep(1000);

  // Step 7: Cleanup
  console.log('\n📍 Step 7: Cleanup...');
  peer1.disconnect();
  peer2.disconnect();

  console.log('\n✅ Debug test completed!\n');
  process.exit(0);
}

async function connectPeer(name: string, email: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const socket = io(WS_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket'],
    });

    const timeout = setTimeout(() => {
      reject(new Error(`${name} connection timeout`));
    }, 5000);

    socket.on('connect', () => {
      clearTimeout(timeout);
      console.log(`   ✅ ${name} connected (socket: ${socket.id})`);
      resolve(socket);
    });

    socket.on('error', (error) => {
      clearTimeout(timeout);
      console.error(`   ❌ ${name} connection error:`, error);
      reject(error);
    });

    socket.on('connect_error', (error) => {
      console.error(`   ❌ ${name} connection error:`, error);
    });

    socket.on('disconnect', (reason) => {
      console.log(`   ℹ️ ${name} disconnected: ${reason}`);
    });
  });
}

async function joinRoom(
  socket: any,
  username: string,
  email: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`${username} join timeout`));
    }, 5000);

    socket.once('existing-participants', (data: any) => {
      clearTimeout(timeout);
      console.log(`   ✅ ${username} received existing-participants:`, {
        count: data.participants?.length || 0,
        participants: data.participants?.map((p: any) => ({
          socketId: p.socketId,
          username: p.username,
        })),
      });
      resolve(socket.id);
    });

    socket.once('error', (error: any) => {
      clearTimeout(timeout);
      console.error(`   ❌ ${username} join error:`, error);
      reject(error);
    });

    console.log(`   📤 Emitting join: ${username}`);
    socket.emit('join', {
      roomId: ROOM_ID,
      userId: `user-${username}`,
      username,
      email,
    });
  });
}

function getStats(socket: any) {
  socket.once('stats', (stats: any) => {
    console.log('   📊 Room Stats:', JSON.stringify(stats, null, 2));
    stats.rooms.forEach((room: any) => {
      if (room.roomId === ROOM_ID) {
        console.log(`   ✅ Found test room: ${room.participantCount} participants`);
        room.participants.forEach((p: any) => {
          console.log(`      - ${p.username} (${p.socketId})`);
        });
      }
    });
  });

  socket.emit('get-stats');
}

function testSignalDelivery(peer1: any, peer2SocketId: string) {
  // Setup listener on peer2 for offer
  peer2.once('offer', (data: any) => {
    console.log('   ✅ Peer 2 RECEIVED OFFER from', data.from);
    console.log('      Offer details:', {
      from: data.from,
      hasOffer: !!data.offer,
      roomId: data.roomId,
    });
  });

  // Send test offer from peer1
  console.log(`   📤 Peer 1 sending offer to ${peer2SocketId}...`);
  peer1.emit('offer', {
    roomId: ROOM_ID,
    to: peer2SocketId,
    offer: {
      type: 'offer',
      sdp: 'v=0\r\no=- 123456 2 IN IP4 127.0.0.1\r\n...', // Dummy SDP
    },
  });

  // Wait for potential delivery confirmation
  setTimeout(() => {
    console.log('   ⏱️ Waiting 1 second for delivery confirmation...');
  }, 100);
}

// Run the test
testWebRTCSignaling().catch((error) => {
  console.error('❌ Debug test failed:', error);
  if (peer1) peer1.disconnect();
  if (peer2) peer2.disconnect();
  process.exit(1);
});
