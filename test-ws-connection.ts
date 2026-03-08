import { io, Socket } from 'socket.io-client';

async function testConnection() {
  console.log('🧪 Testing WebSocket Connection\n');
  console.log('═'.repeat(50));

  let passed = 0;
  let failed = 0;

  // Test 1: Connect to default namespace
  console.log('\n1️⃣  Testing default namespace (/)');
  console.log('   URL: http://localhost:3000');
  
  try {
    const socket1 = io('http://localhost:3000', {
      transports: ['websocket'],
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket1.disconnect();
        reject(new Error('Connection timeout'));
      }, 3000);

      socket1.on('connect', () => {
        clearTimeout(timeout);
        console.log('   ✅ PASSED: Connected successfully');
        console.log(`   ✓ Socket ID: ${socket1.id}`);
        passed++;
        socket1.disconnect();
        resolve(null);
      });

      socket1.on('error', (error) => {
        clearTimeout(timeout);
        console.error(`   ❌ FAILED: ${error}`);
        failed++;
        reject(error);
      });

      socket1.on('connect_error', (error) => {
        clearTimeout(timeout);
        console.error(`   ❌ Connection ERROR: ${error}`);
        failed++;
        reject(error);
      });
    });
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    failed++;
  }

  // Wait a moment
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Test 2: Connect to custom namespace
  console.log('\n2️⃣  Testing custom namespace (/ws-live-class)');
  console.log('   URL: http://localhost:3000/ws-live-class');

  try {
    const socket2 = io('http://localhost:3000/ws-live-class', {
      transports: ['websocket'],
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket2.disconnect();
        reject(new Error('Connection timeout'));
      }, 3000);

      socket2.on('connect', () => {
        clearTimeout(timeout);
        console.log('   ✅ PASSED: Connected successfully');
        console.log(`   ✓ Socket ID: ${socket2.id}`);
        passed++;
        socket2.disconnect();
        resolve(null);
      });

      socket2.on('error', (error) => {
        clearTimeout(timeout);
        console.error(`   ❌ FAILED: ${error}`);
        failed++;
        reject(error);
      });

      socket2.on('connect_error', (error) => {
        clearTimeout(timeout);
        console.error(`   ❌ Connection ERROR: ${error}`);
        failed++;
        reject(error);
      });
    });
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    failed++;
  }

  // Test 3: Connect and emit event on custom namespace
  console.log('\n3️⃣  Testing event emission on custom namespace');
  console.log('   Event: "join"');

  try {
    const socket3 = io('http://localhost:3000/ws-live-class', {
      transports: ['websocket'],
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket3.disconnect();
        reject(new Error('Event test timeout'));
      }, 5000);

      socket3.on('connect', () => {
        console.log('   ✓ Connected, sending event...');
        
        // Send a join event to a non-existent room (expected to fail)
        socket3.emit('join', {
          roomId: 'test-room-123',
          userId: 'test-user',
          username: 'Test User',
          email: 'test@example.com'
        });
      });

      socket3.on('error', (error) => {
        clearTimeout(timeout);
        if (error.message === 'Room not found') {
          console.log('   ✅ PASSED: Event received and processed');
          console.log(`   ✓ Response: "${error.message}" (expected for non-existent room)`);
          passed++;
        } else {
          console.error(`   ⚠️  Unexpected error: ${error.message}`);
        }
        socket3.disconnect();
        resolve(null);
      });

      socket3.on('disconnect', () => {
        clearTimeout(timeout);
        resolve(null);
      });

      socket3.on('connect_error', (error) => {
        clearTimeout(timeout);
        console.error(`   ❌ Connection ERROR: ${error}`);
        failed++;
        reject(error);
      });
    });
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    failed++;
  }

  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log('\n📊 Test Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! WebSocket is working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed.');
    process.exit(1);
  }
}

// Run test
testConnection().catch((error) => {
  console.error('\n❌ Test error:', error.message);
  process.exit(1);
});

// Timeout after 20 seconds
setTimeout(() => {
  console.error('\n⏱️ Test timeout');
  process.exit(1);
}, 20000);
