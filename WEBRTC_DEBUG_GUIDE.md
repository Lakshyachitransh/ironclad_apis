# WebRTC Connection Debugging Guide

**Problem**: Frontend is sending signals but peers are not connecting.

## Quick Diagnosis Steps

### 1. **Verify Backend is Running** ✅
```bash
# Check if backend is running
curl http://localhost:3000/api/docs

# Expected: Swagger UI documentation appears
# If fails: Run backend first: npm run start:dev
```

### 2. **Check WebSocket Connection** 🌐
Open browser console and run:
```javascript
const socket = io('http://localhost:3000/ws-live-class', { transports: ['websocket'] });

socket.on('connect', () => {
  console.log('✅ WebSocket connected:', socket.id);
  
  // Test join
  socket.emit('join', {
    roomId: 'test-room',
    userId: 'user-1',
    username: 'TestUser',
    email: 'test@example.com'
  });
});

socket.on('existing-participants', (data) => {
  console.log('✅ Received participants:', data);
});

socket.on('error', (err) => {
  console.error('❌ Connection error:', err);
});
```

### 3. **Run Automated Debug Script** 🔧
This simulates two peers joining and sending signals:

```bash
npm run build
npx ts-node debug-webrtc.ts
```

**Expected Output**:
```
✅ Peer 1 connected
✅ Peer 1 received existing-participants
✅ Peer 2 connected  
✅ Peer 2 received existing-participants with Peer 1
✅ Peer 2 RECEIVED OFFER from peer1-socket-id
```

**If it fails**: See "Troubleshooting" below

### 4. **Check Backend Logs** 📋
Look at your terminal running the backend:

```
✅ Client connected: socket_abc123
👤 User joining room: test-room (TestUser)
📊 Existing participants for TestUser: 0
✅ User joined successfully
📤 Offer from socket_abc123 to socket_def456
✅ Offer delivered to socket_def456
```

## Common Issues & Fixes

### ❌ Issue 1: "Cannot find module 'socket.io-client'" or "Cannot find module '@nestjs/platform-socket.io'"

**Fix**:
```bash
npm install socket.io socket.io-client @nestjs/websockets @nestjs/platform-socket.io --save
npm run build
npm run start:dev
```

### ❌ Issue 2: "WebSocket connection failed" or shows CORS error

**Check CORS in main.ts**:
```typescript
// In src/main.ts, verify this line exists:
app.enableCors({ origin: true, credentials: true });

// And this:
app.useWebSocketAdapter(new IoAdapter(app));
```

**Fix if needed**:
```bash
npm run build
npm run start:dev
```

### ❌ Issue 3: Peer receives nothing when signal is sent

**Root Cause**: The `to` socket ID might not match the target peer's actual socket ID.

**Debug**:
```javascript
// Client 1
const socket1 = io('http://localhost:3000/ws-live-class', { transports: ['websocket'] });
socket1.on('existing-participants', (data) => {
  const peerSocketId = data.participants[0].socketId;
  console.log('OTHER PEER SOCKET ID:', peerSocketId);
  
  // Send offer - MUST use exact socket ID
  socket1.emit('offer', {
    roomId: 'test-room',
    to: peerSocketId,  // ← MUST match exactly!
    offer: { type: 'offer', sdp: '...' }
  });
});

// If other peer doesn't receive, check:
// 1. Is socket ID spelled correctly?
// 2. Did you copy it exactly from existing-participants?
// 3. Is the other peer still connected?
```

### ❌ Issue 4: "Target peer not found in room" error

**Root Cause**: The target socket ID was from a different room or disconnected peer.

**Fix**:
1. Use the socket ID immediately without storing it
2. Always verify peer is still connected before sending
3. Listen for 'user-left' event and remove from peer list

```javascript
socket.on('user-left', (data) => {
  console.log(`${data.username} left - remove from peers`);
  // Remove from your peer list
});
```

### ❌ Issue 5: Signals arrive at backend but receiving peer gets nothing

**This is likely your problem!** The gateway might not be routing signals to the correct socket.

**Check backend logs for pattern**:
```
📤 Offer from socket_abc to socket_def
⚠️ Target peer socket_def not found in room
```

If you see this, the peer disconnect before receiving the signal.

**Fix**: Add reconnection logic to client
```javascript
const socket = io('http://localhost:3000/ws-live-class', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});
```

### ❌ Issue 6: ICE candidates not flowing

**Debug**:
```javascript
// Check if ICE candidates are being sent
socket.on('ice-candidate', (data) => {
  console.log('✅ Received ICE candidate:', data.candidate);
});

// Try sending one
socket.emit('ice-candidate', {
  roomId: 'test-room',
  to: peerSocketId,
  candidate: {
    candidate: 'candidate:1 1 UDP ...',
    sdpMLineIndex: 0,
    sdpMid: '0'
  }
});
```

## Step-by-Step Debugging Checklist

- [ ] Backend running on port 3000
- [ ] WebSocket endpoint accessible: `http://localhost:3000/ws-live-class`
- [ ] Two peers can connect to WebSocket
- [ ] Peer 1 joins room → receives `existing-participants`
- [ ] Peer 2 joins room → receives `user-joined` event
- [ ] Peer 1 receives notification that Peer 2 joined
- [ ] Peer 1 can send offer
- [ ] Peer 2 receives `offer` event
- [ ] Peer 2 sends answer
- [ ] Peer 1 receives `answer` event
- [ ] ICE candidates flow between peers
- [ ] Peer connection state becomes "connected"

## Viewing WebRTC Stats in Browser

Once connected, in browser console:

```javascript
// Get current WebRTC stats
pc.getStats().then(stats => {
  stats.forEach(report => {
    if (report.type === 'inbound-rtp' || report.type === 'outbound-rtp') {
      console.log(report);
    }
  });
});

// Check connection state
console.log(pc.connectionState);  // 'new', 'connecting', 'connected', 'disconnected', 'failed', 'closed'
console.log(pc.iceConnectionState);  // 'new', 'checking', 'connected', 'completed', 'failed', 'disconnected', 'closed'
```

## Next Steps

1. **Run debug script**: `npx ts-node debug-webrtc.ts`
2. **Check which step fails** and note the error
3. **Check backend logs** for error patterns
4. **Apply the appropriate fix** from above
5. **Rebuild**: `npm run build`
6. **Restart**: `npm run start:dev`

## Still Not Working?

Enable verbose logging in the gateway:

```typescript
// In live-class.gateway.ts, line 32:
private logger = new Logger('LiveClassGateway', { timestamp: true });
```

Then check backend terminal output for detailed messages showing:
- Which socket connects
- Which room gets created
- Which signals are routed to which peers

All signals should print like:
```
📤 Offer from socket_abc123 to socket_def456
✅ Offer delivered to socket_def456
```

If you see different patterns, you've found the issue!
