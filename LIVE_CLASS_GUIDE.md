# Live Class API - Complete Guide

## Overview

The Live Class system provides real-time, scalable video conferencing capabilities for up to 500 concurrent participants. Here's how it works:

---

## Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                       Live Class System                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────┐
│  Teacher/Trainer    │
│  (training_manager) │
└──────────┬──────────┘
           │
           ├─→ [1] CREATE LIVE CLASS
           │   - Generates unique room ID
           │   - Sets status: "scheduled"
           │   - Stores in database
           │
           ├─→ [2] LIST/VIEW CLASSES
           │   - Filter by status
           │   - Pagination support
           │
           ├─→ [3] START LIVE CLASS
           │   - Changes status: "scheduled" → "live"
           │   - Records startedAt timestamp
           │
           └─→ [4] END LIVE CLASS
               - Changes status: "live" → "ended"
               - Records endedAt timestamp
               - Allows recording URL to be set


┌──────────────────────────────────────────────────────────────────┐
│                    Live Class Instance                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ID: 123e4567-e89b-12d3-a456-426614174000                      │
│  Title: "JavaScript Advanced Concepts"                          │
│  Room ID: room-789f0123-e89b-12d3-a456-426614174000            │
│  Status: live                                                   │
│  Max Participants: 150                                          │
│                                                                  │
│  Participants (Real-time):                                      │
│  ├─ Teacher (user-1): JOINED                                    │
│  ├─ Student (user-2): JOINED                                    │
│  ├─ Student (user-3): JOINED                                    │
│  ├─ Student (user-4): JOINED                                    │
│  └─ Student (user-5): LEFT @ 2:45 PM                           │
│                                                                  │
│  Active Participants: 4/150 (Capacity: 2.67%)                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘


┌──────────────────────┐
│  Students/Participants│
│  (any authenticated  │
│   user)              │
└──────────┬───────────┘
           │
           ├─→ [1] LIST LIVE CLASSES
           │   - View all available classes
           │   - Filter by status
           │
           ├─→ [2] JOIN LIVE CLASS
           │   - Can only join if status = "live"
           │   - Creates participant record
           │   - Receives room ID for WebSocket
           │   - Checked against capacity
           │
           ├─→ [3] GET ACTIVE PARTICIPANTS
           │   - Real-time count
           │   - Capacity status
           │   - Participant list
           │
           └─→ [4] LEAVE LIVE CLASS
               - Records leftAt timestamp
               - Updates active count
               - Can rejoin if still live
```

---

## State Machine: Live Class Lifecycle

```
                          CREATE
                            │
                            ▼
                    ┌──────────────┐
                    │  SCHEDULED   │◄─────────────────────┐
                    └──────────────┘                       │
                            │                              │
                            │ START                        │
                            ▼                              │
                    ┌──────────────┐                       │
                    │    LIVE      │                       │
                    │              │                       │
                    │ (Participants │                       │
                    │  can join)    │                       │
                    └──────────────┘                       │
                            │                              │
                            │ END                          │
                            ▼                              │
                    ┌──────────────┐                       │
                    │    ENDED     │                       │
                    └──────────────┘                       │
                            │                              │
                            │ (Optional)                   │
                            │ SET RECORDING                │
                            │                              │
                            └──────────────────────────────┘

Allowed Transitions:
✓ SCHEDULED → LIVE (only by creator)
✓ LIVE → ENDED (only by creator)
✗ SCHEDULED → ENDED (must go through LIVE first)
✗ ENDED → any state (terminal state)
```

---

## Participant Management

### Participant Roles:

- **teacher**: The user who created the live class
- **participant**: Any other user who joins

### Participant Lifecycle:

```
1. USER JOINS LIVE CLASS
   └─ Check: Class status = "live" ✓
   └─ Check: Active participants < max capacity ✓
   └─ Check: User not already joined ✓
   └─ Create: LiveClassParticipant record
      {
        id: unique-participant-id,
        liveClassId: class-id,
        userId: user-id,
        role: "participant" or "teacher",
        joinedAt: timestamp,
        leftAt: null
      }
   └─ Return: Room ID for WebSocket connection

2. USER IS ACTIVE IN CLASS
   └─ Participates in video/audio via WebSocket
   └─ Real-time count includes this user
   └─ Can leave at any time

3. USER LEAVES LIVE CLASS
   └─ Update: LiveClassParticipant.leftAt = now()
   └─ Remove from active participant count
   └─ Can rejoin if class still "live"

4. CLASS ENDS
   └─ All participants' leftAt timestamps recorded
   └─ Recording available at URL
   └─ Class archived
```

---

## Capacity Management

```
CAPACITY RULES:

Maximum Participants: 150-500 (configured per class)

Before Allowing Join:
├─ activeCount = participants where leftAt IS NULL
├─ if (activeCount >= maxParticipants)
│  └─ REJECT: "Live class is at maximum capacity"
└─ else
   └─ ALLOW: Create participant record

Monitoring:
├─ Real-time capacity check available via /participants endpoint
├─ Returns: activeCount, maxCapacity, isFull status
└─ Capacity Used: (activeCount / maxCapacity) * 100%

Example Response:
{
  "activeCount": 42,
  "maxCapacity": 150,
  "isFull": false,
  "capacityUsed": "28%",
  "participants": [...]
}
```

---

## Database Schema

```sql
-- LiveClass Table
CREATE TABLE "LiveClass" (
  id UUID PRIMARY KEY,
  tenantId UUID NOT NULL,
  createdBy UUID NOT NULL (teacher),
  title VARCHAR NOT NULL,
  description TEXT,
  roomId VARCHAR NOT NULL (unique),
  status ENUM('scheduled', 'live', 'ended', 'cancelled'),
  scheduledAt TIMESTAMP NOT NULL,
  startedAt TIMESTAMP,           -- Set when status → "live"
  endedAt TIMESTAMP,             -- Set when status → "ended"
  maxParticipants INT DEFAULT 200,
  recordingUrl VARCHAR,          -- S3 URL after class ends
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

-- LiveClassParticipant Table
CREATE TABLE "LiveClassParticipant" (
  id UUID PRIMARY KEY,
  liveClassId UUID NOT NULL,
  userId UUID NOT NULL,
  role ENUM('teacher', 'participant'),
  joinedAt TIMESTAMP DEFAULT NOW(),
  leftAt TIMESTAMP,              -- NULL while active, set on leave
  createdAt TIMESTAMP DEFAULT NOW()
);
```

---

## API Endpoints

### 1. CREATE LIVE CLASS

```
POST /live-classes
Authorization: Bearer <token>
Role Required: training_manager, org_admin

Request Body:
{
  "tenantId": "456e7890-e89b-12d3-a456-426614174000",
  "title": "Advanced JavaScript Session",
  "description": "Q&A for advanced concepts",
  "scheduledAt": "2025-11-20T14:00:00Z",
  "maxParticipants": 150
}

Response (201):
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Advanced JavaScript Session",
  "status": "scheduled",
  "roomId": "room-789f0123-e89b-12d3-a456-426614174000",
  "scheduledAt": "2025-11-20T14:00:00Z",
  "maxParticipants": 150,
  "participantCount": 0,
  "createdAt": "2025-11-19T10:00:00Z"
}
```

### 2. LIST LIVE CLASSES

```
GET /live-classes?status=live&limit=50&offset=0
Authorization: Bearer <token>

Query Parameters:
- status (optional): scheduled, live, ended, cancelled
- limit (optional, default: 50): max results per page
- offset (optional, default: 0): pagination offset

Response (200):
{
  "total": 5,
  "limit": 50,
  "offset": 0,
  "liveClasses": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Advanced JavaScript Session",
      "status": "live",
      "roomId": "room-789f0123-e89b-12d3-a456-426614174000",
      "scheduledAt": "2025-11-20T14:00:00Z",
      "startedAt": "2025-11-20T14:05:00Z",
      "endedAt": null,
      "maxParticipants": 150,
      "participantCount": 42,
      "activeParticipants": 42,
      "createdAt": "2025-11-19T10:00:00Z"
    }
  ]
}
```

### 3. GET LIVE CLASS DETAILS

```
GET /live-classes/{liveClassId}
Authorization: Bearer <token>

Response (200):
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Advanced JavaScript Session",
  "status": "live",
  "roomId": "room-789f0123-e89b-12d3-a456-426614174000",
  "maxParticipants": 150,
  "participantCount": 42,
  "activeParticipants": 42,
  "participants": [
    {
      "id": "participant-1",
      "userId": "user-1",
      "role": "teacher",
      "joinedAt": "2025-11-20T14:05:00Z",
      "leftAt": null
    },
    {
      "id": "participant-2",
      "userId": "user-2",
      "role": "participant",
      "joinedAt": "2025-11-20T14:06:00Z",
      "leftAt": null
    }
  ]
}
```

### 4. START LIVE CLASS

```
POST /live-classes/{liveClassId}/start
Authorization: Bearer <token>
Role Required: training_manager, org_admin

Response (200):
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "live",
  "startedAt": "2025-11-20T14:05:00Z",
  "message": "Live class started successfully"
}

Error Cases:
- 404: Live class not found
- 403: Only the creator can start
- 400: Status must be "scheduled"
```

### 5. END LIVE CLASS

```
POST /live-classes/{liveClassId}/end
Authorization: Bearer <token>
Role Required: training_manager, org_admin

Response (200):
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "ended",
  "endedAt": "2025-11-20T15:00:00Z",
  "message": "Live class ended successfully"
}

Error Cases:
- 404: Live class not found
- 403: Only the creator can end
- 400: Status must be "live"
```

### 6. JOIN LIVE CLASS

```
POST /live-classes/{liveClassId}/join
Authorization: Bearer <token>

Response (200):
{
  "id": "participant-id",
  "liveClassId": "123e4567-e89b-12d3-a456-426614174000",
  "userId": "user-id",
  "roomId": "room-789f0123-e89b-12d3-a456-426614174000",
  "joinedAt": "2025-11-20T14:06:00Z",
  "message": "Joined live class successfully"
}

Error Cases:
- 400: Class not live
- 400: Class at maximum capacity
- 404: Live class not found
```

### 7. LEAVE LIVE CLASS

```
POST /live-classes/{liveClassId}/leave
Authorization: Bearer <token>

Response (200):
{
  "id": "participant-id",
  "liveClassId": "123e4567-e89b-12d3-a456-426614174000",
  "userId": "user-id",
  "leftAt": "2025-11-20T15:00:00Z",
  "message": "Left live class successfully"
}

Error Cases:
- 404: Not currently in this live class
- 404: Live class not found
```

### 8. GET ACTIVE PARTICIPANTS

```
GET /live-classes/{liveClassId}/participants
Authorization: Bearer <token>

Response (200):
{
  "liveClassId": "123e4567-e89b-12d3-a456-426614174000",
  "activeCount": 42,
  "maxCapacity": 150,
  "isFull": false,
  "participants": [
    {
      "userId": "user-1",
      "role": "teacher",
      "joinedAt": "2025-11-20T14:05:00Z"
    },
    {
      "userId": "user-2",
      "role": "participant",
      "joinedAt": "2025-11-20T14:06:00Z"
    }
  ]
}
```

### 9. SET RECORDING URL

```
POST /live-classes/{liveClassId}/recording
Authorization: Bearer <token>
Role Required: training_manager, org_admin

Request Body:
{
  "recordingUrl": "s3://bucket/live-classes/123e4567-e89b-12d3-a456-426614174000/recording.mp4"
}

Response (200):
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "recordingUrl": "s3://bucket/live-classes/...",
  "message": "Recording URL updated successfully"
}
```

---

## Error Handling

### Common Errors:

```javascript
// 400: Bad Request
{
  "statusCode": 400,
  "message": "Cannot start class with status: live",
  "error": "Bad Request"
}

// 403: Forbidden (Access Denied)
{
  "statusCode": 403,
  "message": "Only the class creator can start the class",
  "error": "Forbidden"
}

// 404: Not Found
{
  "statusCode": 404,
  "message": "Live class not found",
  "error": "Not Found"
}

// 409: Conflict
{
  "statusCode": 409,
  "message": "Live class is at maximum capacity (150 participants)",
  "error": "Conflict"
}
```

---

## Creating and Handling Live Classes - Step by Step

### Scenario: Teacher Creating and Running a Live Session

**Step 1: Create the Live Class**

```typescript
POST /live-classes
{
  "tenantId": "tenant-id",
  "title": "Q&A Session",
  "description": "Live interaction with students",
  "scheduledAt": "2025-11-20T14:00:00Z",  // 5 minutes from now
  "maxParticipants": 100
}
// Returns: class ID, room ID, status="scheduled"
```

**Step 2: Check Class Details**

```typescript
GET / live - classes / { classId };
// Returns: full class info with 0 participants
```

**Step 3: When Time Arrives, Start the Class**

```typescript
POST / live - classes / { classId } / start;
// Changes status: "scheduled" → "live"
// Records startedAt timestamp
```

**Step 4: Students See and List Available Classes**

```typescript
GET /live-classes?status=live
// Returns: Only live classes visible
```

**Step 5: Student Joins**

```typescript
POST / live - classes / { classId } / join;
// Creates participant record
// Returns: room ID for WebSocket connection
// Teacher receives notification (via WebSocket)
```

**Step 6: Monitor Class Activity**

```typescript
GET / live - classes / { classId } / participants;
// Returns: 42 active participants out of 100
```

**Step 7: Class Concludes, Teacher Ends It**

```typescript
POST / live - classes / { classId } / end;
// Changes status: "live" → "ended"
// Records endedAt timestamp
// All participants are marked as left
```

**Step 8: Upload Recording**

```typescript
POST /live-classes/{classId}/recording
{
  "recordingUrl": "s3://bucket/recording.mp4"
}
// Links recording for future playback
```

---

## Key Features Summary

| Feature                 | Description                                             |
| ----------------------- | ------------------------------------------------------- |
| **Scalability**         | Supports up to 500 concurrent participants              |
| **Room IDs**            | Unique per class for seamless WebSocket routing         |
| **Status Tracking**     | scheduled → live → ended state machine                  |
| **Capacity Management** | Real-time capacity tracking and enforcement             |
| **Participant Roles**   | Teacher and participant differentiation                 |
| **Join/Leave Tracking** | Timestamps for all participant activities               |
| **Recording Support**   | S3 URL storage for post-class access                    |
| **Pagination**          | Efficient listing with limit/offset                     |
| **Filtering**           | Filter classes by status                                |
| **Authorization**       | Role-based access control (training_manager, org_admin) |
| **Multi-tenant**        | Isolated by tenant ID                                   |

---

## Important Considerations

1. **Only "live" classes can be joined** - Students must wait for teacher to start
2. **Capacity is enforced** - Once full, no more joins allowed
3. **Creator-only operations** - Only the teacher who created can start/end
4. **One join per user** - Duplicate joins return existing participant record
5. **Graceful leave** - Leaving doesn't affect class; others unaffected
6. **Immutable recording** - Once set, recording URL doesn't change
7. **Tenant isolation** - Users can only see/join classes in their tenant
