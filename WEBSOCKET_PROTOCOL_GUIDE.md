# WebSocket Protocol Guide - Raw WebSocket vs Socket.IO

**Date:** March 7, 2026  
**Status:** Complete Frontend Integration Guide  
**Purpose:** Fix "Reconnecting..." error and establish proper WebSocket connection

---

## Problem Statement

**Frontend Issue:** Stuck in "Reconnecting..." loop with error messages

**Root Cause:** Frontend was using **raw WebSocket protocol** with query parameters, but the backend is using **Socket.IO protocol**. These are incompatible communication methods.

**Evidence:**
```javascript
// ❌ WRONG - Frontend attempting raw WebSocket
const socket = new WebSocket('ws://localhost:3000/ws/live-class?roomId=...&token=...')
socket.send(JSON.stringify({ type: "join", roomId: "...", userId: "..." }))

// ✅ CORRECT - Backend expecting Socket.IO
// Socket.IO client with event-based messaging
socket.emit('join', { roomId: "...", userId: "..." })
```

---

## Raw WebSocket vs Socket.IO

### **1. Raw WebSocket**

**What it is:**
- Low-level bidirectional communication protocol (RFC 6455)
- Direct TCP connection upgraded to WebSocket
- Sends/receives raw data (text or binary)
- No built-in protocol layer

**URL Format:**
```
ws://localhost:3000/ws/live-class
ws://localhost:3000/ws/live-class?roomId=room-123&token=jwt-token
```

**Message Format:**
```javascript
// Sender must manually serialize data
socket.send(JSON.stringify({
  type: "join",
  roomId: "...",
  userId: "..."
}))

// Receiver must manually parse data
socket.onmessage = (event) => {
  const data = JSON.parse(event.data)
  if (data.type === 'join') { ... }
}
```

**Pros:**
- ✅ Lightweight, minimal overhead
- ✅ Direct control over protocol
- ✅ Works anywhere with WebSocket support
- ✅ No library dependency

**Cons:**
- ❌ Manual message serialization/deserialization
- ❌ No automatic reconnection
- ❌ No fallback mechanisms
- ❌ No acknowledgments
- ❌ Complex error handling

---

### **2. Socket.IO**

**What it is:**
- High-level real-time communication library (built on top of WebSocket)
- Provides automatic fallbacks (polling, etc.)
- Event-based messaging system
- Built-in features: reconnection, acknowledgments, rooms, namespaces

**URL Format:**
```
http://localhost:3000/ws-live-class
http://localhost:3000/socket.io/?namespace=ws-live-class&EIO=4&transport=websocket
```

**Message Format:**
```javascript
// Sender uses event emit
socket.emit('join', {
  roomId: "...",
  userId: "...",
  username: "...",
  email: "..."
})

// Receiver uses event listener
socket.on('join-success', (data) => {
  console.log('Joined:', data)
})
```

**Pros:**
- ✅ Simple event-based API
- ✅ Automatic reconnection with exponential backoff
- ✅ Fallback transports (polling, etc.)
- ✅ Built-in acknowledgments
- ✅ Namespace support for multiple connection types
- ✅ Room management
- ✅ Binary message support

**Cons:**
- ❌ Slightly more overhead
- ❌ Requires socket.io-client library
- ❌ Must understand Socket.IO protocol

---

## Backend: Already Using Socket.IO

Your NestJS backend is configured for **Socket.IO**:

```typescript
// src/live-class/gateways/live-class.gateway.ts
@WebSocketGateway({
  namespace: 'ws-live-class',  // Socket.IO namespace
  cors: { origin: true, credentials: true },
  transports: ['websocket'],
})
export class LiveClassGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  
  @SubscribeMessage('join')
  async handleJoin(client: Socket, data: { roomId: string; userId: string; ... }) {
    // Handle join event
  }

  @SubscribeMessage('offer')
  handleOffer(client: Socket, data: { to: string; offer: RTCSessionDescription }) {
    // Handle offer event
  }
  
  // ... other handlers
}
```

**Key Points:**
- ✅ Uses `@WebSocketGateway` decorator (Socket.IO)
- ✅ Uses `@SubscribeMessage` for events
- ✅ Expects event-based messages, NOT raw JSON
- ✅ Listens on namespace `/ws-live-class`

---

## Converting Frontend from Raw WebSocket to Socket.IO

### **Step 1: Install Socket.IO Client**

```bash
npm install socket.io-client
```

### **Step 2: Replace WebSocket Code**

**BEFORE (❌ Raw WebSocket):**
```typescript
class WebRTCManager {
  private socket: WebSocket;

  connect(token: string, roomId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const url = `ws://localhost:3000/ws/live-class?roomId=${roomId}&token=${token}`;
        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
          console.log('Connected');
          // Send raw JSON message
          this.socket.send(JSON.stringify({
            type: 'join',
            roomId: roomId,
            userId: 'user-123',
            displayName: 'User Name'
          }));
          resolve();
        };

        this.socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'existing-participants') {
            this.handleParticipants(data);
          }
        };

        this.socket.onerror = reject;
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleParticipants(data: any) {
    console.log('Participants:', data.participants);
  }

  disconnect() {
    this.socket?.close();
  }
}
```

**AFTER (✅ Socket.IO):**
```typescript
import { io, Socket } from 'socket.io-client';

class WebRTCManager {
  private socket: Socket;
  private apiUrl: string;

  constructor(apiUrl: string = 'http://localhost:3000') {
    this.apiUrl = apiUrl;
  }

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Connect using Socket.IO
        this.socket = io(`${this.apiUrl}/ws-live-class`, {
          transports: ['websocket'],
          auth: {
            token: token  // Pass token in auth option
          },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5
        });

        // Handle connection
        this.socket.on('connect', () => {
          console.log('✅ WebSocket connected');
          resolve();
        });

        // Handle events
        this.socket.on('existing-participants', (data) => {
          this.handleParticipants(data);
        });

        this.socket.on('user-joined', (data) => {
          this.handleUserJoined(data);
        });

        this.socket.on('error', (error) => {
          console.error('❌ Socket error:', error);
          reject(error);
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ Connection error:', error);
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  joinRoom(roomId: string, userId: string, username: string, email: string) {
    // Emit Socket.IO event
    this.socket.emit('join', {
      roomId,
      userId,
      username,
      email
    });
  }

  private handleParticipants(data: any) {
    console.log('Participants:', data.participants);
  }

  private handleUserJoined(data: any) {
    console.log('User joined:', data);
  }

  disconnect() {
    this.socket?.disconnect();
  }
}

export default WebRTCManager;
```

---

## Complete Integration Example

### **React Component Integration**

```typescript
import { useEffect, useState } from 'react';
import WebRTCManager from '@/lib/webrtc';

function VideoRoomPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [manager] = useState(() => new WebRTCManager('http://localhost:3000'));

  useEffect(() => {
    const initializeConnection = async () => {
      try {
        // Get JWT token from auth context or local storage
        const token = localStorage.getItem('jwt_token');
        const roomId = new URLSearchParams(window.location.search).get('roomId');
        const userId = localStorage.getItem('user_id');
        const username = localStorage.getItem('username');
        const email = localStorage.getItem('email');

        // Connect to WebSocket
        await manager.connect(token);
        setIsConnected(true);

        // Join room
        manager.joinRoom(roomId, userId, username, email);

        // Listen to events
        manager.socket.on('existing-participants', (data) => {
          setParticipants(data.participants || []);
        });

        manager.socket.on('user-joined', (data) => {
          setParticipants(prev => [...prev, data]);
        });

        manager.socket.on('user-left', (data) => {
          setParticipants(prev => prev.filter(p => p.socketId !== data.socketId));
        });

      } catch (error) {
        console.error('Connection failed:', error);
        setIsConnected(false);
      }
    };

    initializeConnection();

    return () => {
      manager.disconnect();
    };
  }, [manager]);

  return (
    <div>
      <h1>Video Room</h1>
      <div>
        Status: {isConnected ? '✅ Connected' : '❌ Disconnected'}
      </div>
      <div>
        <h2>Participants ({participants.length})</h2>
        {participants.map(p => (
          <div key={p.socketId}>
            {p.username} ({p.email})
          </div>
        ))}
      </div>
    </div>
  );
}

export default VideoRoomPage;
```

---

## Connection Flow Comparison

### **Raw WebSocket Flow (❌ Doesn't Work)**

```
1. Client creates WebSocket to: ws://localhost:3000/ws/live-class?roomId=X&token=Y
2. Server receives raw WebSocket connection request
3. Client sends: { "type": "join", "roomId": "X", "userId": "Y" }
4. Server NestJS Gateway is expecting Socket.IO protocol format: 42["join", {...}]
5. Server doesn't understand the message ❌ Hang up ❌
```

### **Socket.IO Flow (✅ Works)**

```
1. Client connects: io('http://localhost:3000/ws-live-class', { auth: { token } })
2. Socket.IO client library sends: GET /socket.io/?...
3. Server upgrades to WebSocket and sends SID
4. Client emits: socket.emit('join', { roomId, userId, ... })
5. Socket.IO formats as: 42["join", { roomId, userId, ... }]
6. Server Gateway receives and processes with @SubscribeMessage('join')
7. Server responds with Socket.IO events ✅
```

---

## Protocol Details

### **Socket.IO Message Format**

When you call `socket.emit('join', {...})`, Socket.IO encodes it as:

```
42["join",{"roomId":"...","userId":"...","username":"...","email":"..."}]
```

**Format breakdown:**
- `42` - Socket.IO binary message type
- `["join",{...}]` - Event name and data as array

### **Socket.IO Connection Process**

```
Client                          Server
  │                               │
  ├─ GET /socket.io/ ────────────>│
  │ (HTTP with EIO=4 params)      │
  │                               │
  │<─ 0{sid,pingInterval,...} ────┤
  │  (session ID and config)      │
  │                               │
  ├─ Upgrade to WebSocket ──────>│
  │                               │
  ├─ 40 (connect to namespace) ──>│
  │                               │
  │<─ 40 (connected) ─────────────┤
  │                               │
  ├─ 42["join",{...}] ──────────>│
  │  (emit event)                 │
  │                               │
  │<─ 42["join-success",{...}] ───┤
  │  (server responds)            │
  │                               │
```

---

## Debugging Checklist

### **✅ Connection Test (Terminal)**

```bash
# Test Socket.IO endpoint
wscat -c "ws://localhost:3000/socket.io/?namespace=ws-live-class&EIO=4&transport=websocket"

# Expected: Connected message
# Then send: 42["join",{"roomId":"test","userId":"user1","username":"Test","email":"test@example.com"}]
# Expected response: 42["existing-participants",{"participants":[]}]
```

### **✅ Browser Console Test**

```javascript
// In browser console
const socket = io('http://localhost:3000/ws-live-class', { transports: ['websocket'] });

socket.on('connect', () => console.log('✅ Connected:', socket.id));
socket.on('connect_error', (err) => console.error('❌ Error:', err));
socket.on('disconnect', (reason) => console.log('Disconnected:', reason));

// Send join event
socket.emit('join', {
  roomId: 'test-room',
  userId: 'user-123',
  username: 'Test User',
  email: 'test@example.com'
});

// Listen for response
socket.on('existing-participants', (data) => {
  console.log('Got participants:', data);
});
```

### **✅ Backend Logs**

When connection succeeds, you should see:

```
✅ WebSocket client connected: socket_abc123
👤 User joining room: room-uuid (Test User)
🏢 Room created: room-uuid
📊 Existing participants for Test User: 0
✅ User joined successfully. Room: room-uuid, Total: 1
```

---

## Common Errors & Solutions

### **Error: "Reconnecting..." (infinite loop)**

**Cause:** Using raw WebSocket url instead of Socket.IO

**Fix:**
```javascript
// ❌ WRONG
const socket = new WebSocket('ws://localhost:3000/ws/live-class');

// ✅ CORRECT
import { io } from 'socket.io-client';
const socket = io('http://localhost:3000/ws-live-class');
```

---

### **Error: "Cannot GET /ws/live-class"**

**Cause:** Browser trying to access raw HTTP endpoint for WebSocket

**Fix:** Ensure using Socket.IO client library, not raw HTTP requests

```javascript
// ❌ WRONG
fetch('ws://localhost:3000/ws/live-class')

// ✅ CORRECT
io('http://localhost:3000/ws-live-class')
```

---

### **Error: "403 Forbidden" or token issues**

**Cause:** Token not passed correctly

**Fix:**
```javascript
// ✅ CORRECT - Pass token in auth option
const socket = io('http://localhost:3000/ws-live-class', {
  auth: {
    token: jwt_access_token
  }
});
```

---

### **Error: CORS issues**

**Cause:** CORS not configured

**Fix:** Backend already has CORS enabled:

```typescript
// src/live-class/gateways/live-class.gateway.ts
@WebSocketGateway({
  namespace: 'ws-live-class',
  cors: { origin: true, credentials: true },  // ✅ CORS enabled
  transports: ['websocket'],
})
```

Frontend can connect from any origin in development.

---

## Environment Configuration

### **Development**
```typescript
const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const socket = io(`${apiUrl}/ws-live-class`, {
  transports: ['websocket'],
  auth: { token: localStorage.getItem('jwt_token') }
});
```

### **Production**
```typescript
const apiUrl = process.env.REACT_APP_API_URL || 'https://api.example.com';
const socket = io(`${apiUrl}/ws-live-class`, {
  transports: ['websocket'],
  secure: true,  // Use wss:// instead of ws://
  auth: { token: localStorage.getItem('jwt_token') }
});
```

---

## Frontend Event Reference

### **Events to Send (Client → Server)**

```typescript
// Join a room
socket.emit('join', {
  roomId: string;
  userId: string;
  username: string;
  email: string;
});

// Leave room
socket.emit('leave', {
  roomId: string;
});

// Send WebRTC offer
socket.emit('offer', {
  roomId: string;
  to: string;  // target socket ID
  offer: RTCSessionDescription;
});

// Send WebRTC answer
socket.emit('answer', {
  roomId: string;
  to: string;
  answer: RTCSessionDescription;
});

// Send ICE candidate
socket.emit('ice-candidate', {
  roomId: string;
  to: string;
  candidate: RTCIceCandidate;
});

// Update media state
socket.emit('media-state-changed', {
  roomId: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
});
```

### **Events to Listen (Server → Client)**

```typescript
// List of current participants
socket.on('existing-participants', (data: {
  participants: Array<{ socketId, userId, username, email }>
}) => { ... });

// New participant joined
socket.on('user-joined', (data: {
  socketId: string;
  userId: string;
  username: string;
  email: string;
}) => { ... });

// Participant left
socket.on('user-left', (data: {
  socketId: string;
}) => { ... });

// Participant list updated
socket.on('participants-updated', (data: {
  participants: Array<{ socketId, userId, username }>
  roomId: string;
}) => { ... });

// Remote WebRTC offer received
socket.on('offer', (data: {
  from: string;
  offer: RTCSessionDescription;
}) => { ... });

// Remote WebRTC answer received
socket.on('answer', (data: {
  from: string;
  answer: RTCSessionDescription;
}) => { ... });

// ICE candidate from remote peer
socket.on('ice-candidate', (data: {
  from: string;
  candidate: RTCIceCandidate;
}) => { ... });

// Error occurred
socket.on('error', (error: { message: string }) => { ... });
```

---

## Migration Checklist

- [ ] Install `socket.io-client` package
- [ ] Replace all raw WebSocket code with Socket.IO client
- [ ] Update connection URL from `ws://` to `http://`
- [ ] Move query parameters to `auth` option
- [ ] Change message sending from `socket.send(JSON.stringify(...))` to `socket.emit(event, data)`
- [ ] Change message receiving from `onmessage` handlers to `socket.on(event, ...)`
- [ ] Remove manual connection management (Socket.IO handles reconnection)
- [ ] Test in browser console
- [ ] Test in terminal with wscat
- [ ] Check backend logs for successful connection
- [ ] Test all events (join, leave, offer, answer, ice-candidate)
- [ ] Test with multiple peers in same room
- [ ] Test reconnection after network disconnect

---

## References

- [Socket.IO Documentation](https://socket.io/docs/v4/client-api/)
- [Socket.IO vs Raw WebSocket](https://socket.io/docs/#what-socket-io-is-not)
- [NestJS WebSockets](https://docs.nestjs.com/websockets/gateways)
- [WebRTC Signaling](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)

---

**Document Version:** 1.0  
**Last Updated:** March 7, 2026  
**Status:** Ready for Implementation
