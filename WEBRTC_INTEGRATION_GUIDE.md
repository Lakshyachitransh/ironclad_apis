# WebRTC Video Room Integration Guide

## Overview

This document guides you through integrating the complete **Google Meet-like video conferencing system** into your Ironclad LMS platform.

## Architecture

### Backend (NestJS)
- **WebSocket Gateway**: `src/live-class/gateways/live-class.gateway.ts`
  - Real-time signaling for WebRTC peer-to-peer connections
  - Room management and participant tracking
  - Broadcasting of offers, answers, and ICE candidates
  - Screen sharing and media state notifications

- **Port**: `http://localhost:3000/ws-live-class` (use with socket.io-client)
- **Technology**: Socket.IO for real-time bidirectional communication

### Frontend (React)
- **WebRTC Manager**: `src/lib/webrtc.ts`
  - Manages peer connections, local/remote streams
  - Handles offer/answer SDP exchange
  - ICE candidate collection and processing
  - Auto-reconnection logic

- **Signaling Client**: `src/lib/webrtc-signaling-client.ts`
  - WebSocket client for signaling messages
  - Event-driven architecture
  - Automatic reconnection with backoff

- **UI Components**:
  - `src/pages/VideoRoomPage.tsx` - Full video room interface
  - Responsive grid layout with dynamic participant sizing
  - Speaker pinning, media controls, participant sidebar

## Backend Setup

### 1. Installation (Already Done)
```bash
npm install @nestjs/websockets socket.io @nestjs/platform-socket.io
```

### 2. Files Created/Modified

#### Main Entry Point (`src/main.ts`)
- Added WebSocket adapter configuration
- CORS enabled for WebSocket connections

#### Gateway (`src/live-class/gateways/live-class.gateway.ts`)
```typescript
@WebSocketGateway({
  namespace: '/ws/live-class',
  cors: { origin: true, credentials: true },
  transports: ['websocket'],
})
export class LiveClassGateway { ... }
```

**Key Features:**
- Handles `join`, `leave`, `offer`, `answer`, `ice-candidate` messages
- Broadcasts signaling messages between peers
- Manages room state and participant lists
- Tracks connections and cleans up on disconnect
- Supports screen sharing and media state notifications

#### Module Update (`src/live-class/live-class.module.ts`)
- Added `LiveClassGateway` to providers
- Gateway is automatically loaded with the module

#### Service Helper (`src/live-class/live-class.service.ts`)
- Added `roomExists()` method for WebSocket-level room validation
- Used during join to verify room exists before allowing connection

### 3. WebSocket Message Protocol

#### Client → Server Messages

**Join Room**
```typescript
socket.emit('join', {
  roomId: string;        // Live class ID
  userId: string;        // User ID
  username: string;      // Display name
  email: string;         // User email
});

// Response: 'existing-participants' event with list of current users
```

**Send Offer**
```typescript
socket.emit('offer', {
  roomId: string;
  to: string;           // Target peer socket ID
  offer: {
    type: 'offer';
    sdp: string;        // SDP string
  };
});
```

**Send Answer**
```typescript
socket.emit('answer', {
  roomId: string;
  to: string;           // Target peer socket ID
  answer: {
    type: 'answer';
    sdp: string;        // SDP string
  };
});
```

**Send ICE Candidate**
```typescript
socket.emit('ice-candidate', {
  roomId: string;
  to: string;           // Target peer socket ID
  candidate: {
    candidate: string;  // ICE candidate string
    sdpMLineIndex: number;
    sdpMid: string;
  };
});
```

**Media State Changed** (mute/unmute, camera on/off)
```typescript
socket.emit('media-state-changed', {
  roomId: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
});
```

**Screen Share Started**
```typescript
socket.emit('screen-share-started', {
  roomId: string;
  screenOffer: any;     // WebRTC offer for screen track
});
```

**Screen Share Stopped**
```typescript
socket.emit('screen-share-stopped', {
  roomId: string;
});
```

**Leave Room**
```typescript
socket.emit('leave', {
  roomId: string;
});
```

#### Server → Client Events

**Existing Participants**
```typescript
// Sent when user joins - list of users already in room
socket.on('existing-participants', (data) => {
  data.participants: Participant[];  // Array of users
});

interface Participant {
  socketId: string;
  userId: string;
  username: string;
  email: string;
}
```

**User Joined**
```typescript
// Broadcast to room when new user joins
socket.on('user-joined', (data) => {
  data.socketId: string;
  data.userId: string;
  data.username: string;
  data.email: string;
});
```

**User Left**
```typescript
// Broadcast to room when user leaves
socket.on('user-left', (data) => {
  data.socketId: string;
  data.username: string;
});
```

**Participants Updated**
```typescript
// Updated list of all participants in room
socket.on('participants-updated', (data) => {
  data.participants: Participant[];
  data.count: number;
});
```

**Offer Received**
```typescript
socket.on('offer', (data) => {
  data.from: string;           // Sender socket ID
  data.offer: WebRTCOffer;     // SDP offer
});
```

**Answer Received**
```typescript
socket.on('answer', (data) => {
  data.from: string;           // Sender socket ID
  data.answer: WebRTCAnswer;   // SDP answer
});
```

**ICE Candidate Received**
```typescript
socket.on('ice-candidate', (data) => {
  data.from: string;           // Sender socket ID
  data.candidate: IceCandidate;
});
```

**Media State Changed**
```typescript
socket.on('media-state-changed', (data) => {
  data.from: string;
  data.username: string;
  data.audioEnabled: boolean;
  data.videoEnabled: boolean;
});
```

**Screen Share Started**
```typescript
socket.on('screen-share-started', (data) => {
  data.from: string;           // Sender socket ID
  data.username: string;
  data.screenOffer: any;       // Screen track offer
});
```

**Screen Share Stopped**
```typescript
socket.on('screen-share-stopped', (data) => {
  data.from: string;
  data.username: string;
});
```

**Error**
```typescript
socket.on('error', (data) => {
  data.message: string;        // Error description
});
```

## Frontend Integration

### 1. Initialize Signaling Client

```typescript
import { signalingClient } from '@/lib/webrtc-signaling-client';

// Connect to WebSocket
await signalingClient.connect();

// Listen for events
signalingClient.on('existing-participants', (data) => {
  // Handle existing participants
  data.participants.forEach(participant => {
    createPeer(participant);
  });
});

signalingClient.on('user-joined', (data) => {
  // New user joined - establish peer connection
  createPeerConnection(data.socketId);
});
```

### 2. Join a Live Class

```typescript
// When user clicks "Start" or "Join" on live class
const roomId = liveClass.id;
const userId = currentUser.id;
const username = currentUser.name;
const email = currentUser.email;

signalingClient.joinRoom(roomId, userId, username, email);

// Navigate to video room
navigate(`/live-class/${roomId}/room`);
```

### 3. Create Peer Connections

```typescript
import { WebRTCManager } from '@/lib/webrtc';

const webrtcManager = new WebRTCManager();

// Get local stream
const localStream = await webrtcManager.getLocalStream({
  audio: true,
  video: { width: 1280, height: 720 }
});

// Create peer connection for each participant
signalingClient.on('user-joined', async (data) => {
  const peerConnection = await webrtcManager.createPeerConnection(data.socketId);
  
  // Add local stream tracks
  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });
  
  // Create and send offer
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  
  signalingClient.sendOffer(data.socketId, {
    type: 'offer',
    sdp: offer.sdp
  });
});
```

### 4. Handle Signaling Messages

```typescript
// Handle incoming offer
signalingClient.on('offer', async (data) => {
  const peerConnection = await webrtcManager.createPeerConnection(data.from);
  
  // Add local stream tracks
  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });
  
  // Set remote description and create answer
  const remoteDesc = new RTCSessionDescription(data.offer);
  await peerConnection.setRemoteDescription(remoteDesc);
  
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  
  signalingClient.sendAnswer(data.from, {
    type: 'answer',
    sdp: answer.sdp
  });
});

// Handle incoming answer
signalingClient.on('answer', async (data) => {
  const peerConnection = webrtcManager.getPeerConnection(data.from);
  if (peerConnection) {
    const remoteDesc = new RTCSessionDescription(data.answer);
    await peerConnection.setRemoteDescription(remoteDesc);
  }
});

// Handle ICE candidates
signalingClient.on('ice-candidate', (_async (data) => {
  const peerConnection = webrtcManager.getPeerConnection(data.from);
  if (peerConnection) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
  }
});

// Send ICE candidates
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    signalingClient.sendIceCandidate(peerId, event.candidate);
  }
};
```

### 5. Handle Remote Streams

```typescript
// When receiving remote stream
peerConnection.ontrack = (event) => {
  console.log('🎥 Received remote stream');
  
  // Add to remote participants list
  addRemoteParticipant(peerId, {
    stream: event.streams[0],
    audioEnabled: true,
    videoEnabled: true
  });
  
  // Update UI with video elements
  renderRemoteStreamToDOM(peerId, event.streams[0]);
};
```

### 6. Media Controls

```typescript
// Mute/Unmute Audio
async function toggleAudio(enabled: boolean) {
  const audioTracks = localStream.getAudioTracks();
  audioTracks.forEach(track => track.enabled = enabled);
  
  signalingClient.notifyMediaStateChanged(enabled, videoEnabled);
}

// Camera On/Off
async function toggleCamera(enabled: boolean) {
  const videoTracks = localStream.getVideoTracks();
  videoTracks.forEach(track => track.enabled = enabled);
  
  signalingClient.notifyMediaStateChanged(audioEnabled, enabled);
}

// Screen Share
async function startScreenShare() {
  const screenStream = await navigator.mediaDevices.getDisplayMedia({
    video: { cursor: 'always' },
    audio: false
  });
  
  const screenTrack = screenStream.getVideoTracks()[0];
  
  // Send screen share notification
  signalingClient.notifyScreenShareStarted(screenStream);
  
  // Handle screen share stop
  screenTrack.onended = () => {
    signalingClient.notifyScreenShareStopped();
  };
}
```

## Live Class Integration

### Modifying Live Class Controller

Update `src/live-class/live-class.controller.ts` to pass JWT token to video room:

```typescript
@Get(':liveClassId/room')
@UseGuards(JwtAuthGuard)
async getVideoRoomToken(
  @Param('liveClassId') liveClassId: string,
  @Request() req: ExpressRequest
) {
  // @ts-ignore
  const actor = req.user as JwtUser;
  
  return {
    roomId: liveClassId,
    userId: actor.id,
    username: actor.name,
    email: actor.email,
    token: req.headers.authorization?.replace('Bearer ', '')
  };
}
```

### Frontend Video Room Page

```typescript
// src/pages/VideoRoomPage.tsx
import { useEffect, useState } from 'react';
import { signalingClient } from '@/lib/webrtc-signaling-client';
import { WebRTCManager } from '@/lib/webrtc';

export function VideoRoomPage() {
  const { roomId } = useParams();
  const [participants, setParticipants] = useState<Map<string, RemoteParticipant>>();
  const [localStream, setLocalStream] = useState<MediaStream>();
  
  useEffect(() => {
    async function setupVideoRoom() {
      // Connect WebSocket
      await signalingClient.connect();
      
      // Get local stream
      const manager = new WebRTCManager();
      const stream = await manager.getLocalStream({
        audio: true,
        video: { width: 1280, height: 720 }
      });
      setLocalStream(stream);
      
      // Join room
      const user = await getCurrentUser();
      signalingClient.joinRoom(roomId, user.id, user.name, user.email);
      
      // Setup event handlers
      setupEventHandlers(manager, stream);
    }
    
    setupVideoRoom();
    
    return () => {
      signalingClient.leaveRoom();
      signalingClient.disconnect();
    };
  }, [roomId]);
  
  return (
    <div className="video-room">
      {/* Local video preview */}
      <video autoPlay muted playsInline srcObject={localStream} />
      
      {/* Remote participants grid */}
      <div className="participants-grid">
        {Array.from(participants?.entries() || []).map(([socketId, participant]) => (
          <VideoTile
            key={socketId}
            participant={participant}
            username={participant.username}
            stream={participant.stream}
          />
        ))}
      </div>
      
      {/* Media controls */}
      <MediaControls
        onToggleAudio={handleToggleAudio}
        onToggleCamera={handleToggleCamera}
        onShareScreen={handleShareScreen}
        onLeave={handleLeave}
      />
    </div>
  );
}
```

## Testing

### 1. Backend WebSocket Testing

```bash
# Terminal 1: Start backend
npm run start:dev

# Terminal 2: Test with WebSocket CLI
npx wscat -c "ws://localhost:3000/socket.io/?namespace=ws-live-class&EIO=4&transport=websocket"

# Send join message
{"event":"join","data":{"roomId":"test-room-123","userId":"user-123","username":"John Doe","email":"john@example.com"}}
```

### 2. Frontend Testing

```typescript
// Open browser console and test
const { signalingClient } = await import('http://localhost:3000/src/lib/webrtc-signaling-client.ts');

await signalingClient.connect();
signalingClient.joinRoom('test-room', 'user-123', 'Test User', 'test@example.com');

// Listen to events
signalingClient.on('existing-participants', console.log);
signalingClient.on('user-joined', console.log);
```

### 3. Multi-User Testing

1. Open first browser tab and join video room
2. Open second browser tab (different user) and join same room
3. Verify:
   - Connection established
   - Offer/Answer exchange complete
   - ICE candidates flowing
   - Audio/video streams available
   - Media controls working
   - Screen share functionality

## Troubleshooting

### WebSocket Connection Issues

**Problem**: `Connection refused`
```
Solution: 
- Verify backend is running: http://localhost:3000/api/docs
- Check WebSocket port (default 3000)
- Ensure CORS is enabled in main.ts
```

**Problem**: `CORS error`
```
Solution:
- Verify app.enableCors({ origin: true, credentials: true }) in main.ts
- Check browser console for actual CORS error
- Ensure Socket.IO is configured with cors in @WebSocketGateway
```

### Peer Connection Issues

**Problem**: No video/audio between peers
```
Solution:
- Verify getDisplayMedia/getUserMedia permissions granted
- Check browser console for constraints errors
- Verify ICE candidates are flowing
- Check browser networking tab for WebRTC connections
```

**Problem**: `No remote stream`
```
Solution:
- Verify ontrack handler is registered before setRemoteDescription
- Check that both peers created offers/answers successfully
- Verify ICE candidate collection completed
```

### Room Issues

**Problem**: `Room not found` error
```
Solution:
- Verify liveClassId is correct
- Check that live class exists in database (status != 'ended')
- Verify room hasn't been deleted
```

## Performance Optimization

### Client-Side
- **Bitrate Control**: Limit video resolution based on network conditions
- **Simulcast**: Send multiple qualities for adaptive streaming
- **Connection Pool**: Reuse WebSocket for multiple rooms
- **Lazy Loading**: Only create peer connections when visible

### Server-Side
- **Room Cleanup**: Auto-delete empty rooms after 5 minutes
- **Participant Limits**: Max 100 per room (can be increased)
- **Memory Monitoring**: Track open connections and clean stale ones
- **Event Batching**: Batch participant updates instead of individual events

## Security Considerations

1. **WebSocket Authorization**: 
   - Validate JWT token before allowing room join
   - Add auth middleware to gateway

2. **Room Access Control**:
   - Verify user has permission to access live class
   - Check tenant ownership

3. **Media Encryption**:
   - DTLS-SRTP enabled by default in WebRTC
   - All peer connections encrypted end-to-end

4. **Rate Limiting**:
   - Limit messages per connection
   - Prevent message flooding attacks

## Next Steps

1. **Add Authentication Middleware**: Protect WebSocket connections
2. **Implement Recording**: Store video sessions
3. **Add Chat**: Text messaging alongside video
4. **Analytics**: Track session metrics and user engagement
5. **Transcription**: Real-time STT/captions
6. **Analytics Dashboard**: Heatmaps, engagement metrics

## Documentation Links

- [WebRTC MDN Docs](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Socket.IO Documentation](https://socket.io/docs/)
- [NestJS WebSockets](https://docs.nestjs.com/websockets/gateways)
- [Adaptive Video Bitrate Streaming](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_Statistics_API)
