# Live Class Creation - Complete Guide

**Date:** March 7, 2026  
**Status:** Endpoint Documentation  
**Purpose:** Create live classes with proper payload format

---

## Problem

Error when creating live class:
```
✗ ERROR: Tenant "" not found in database
```

**Root Cause:** The `tenantName` field is empty or missing in the request payload.

---

## Required Data Structure

### API Endpoint
```
POST /api/live-classes
```

### Request Headers
```
Content-Type: application/json
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

### Request Payload

**Minimal (Required Fields Only):**
```json
{
  "tenantName": "Your Tenant Name",
  "title": "Live Class Title",
  "scheduledAt": "2025-11-20T14:00:00Z"
}
```

**Full (With Optional Fields):**
```json
{
  "tenantName": "Your Tenant Name",
  "title": "Advanced JavaScript Session - Live Q&A",
  "description": "Interactive Q&A session for advanced JavaScript concepts",
  "scheduledAt": "2025-11-20T14:00:00Z",
  "maxParticipants": 150
}
```

---

## Field Reference

### **1. tenantName** (Required)
- **Type:** String
- **Description:** The exact name of your tenant organization
- **Example:** `"Tech Academy"`, `"Ironclad LMS"`, `"Your Organization"`
- **Important:** Must match the existing tenant name in database
- **Error:** If empty or doesn't exist → `Tenant "" not found in database`

### **2. title** (Required)
- **Type:** String
- **Description:** Title of the live class/session
- **Example:** `"Advanced JavaScript Session - Live Q&A"`
- **Max Length:** Not limited
- **Min Length:** At least 1 character

### **3. scheduledAt** (Required)
- **Type:** ISO 8601 string
- **Description:** When the live class should start
- **Format:** `YYYY-MM-DDTHH:mm:ssZ`
- **Example:** `"2025-11-20T14:00:00Z"` or `"2025-03-10T19:30:00+05:30"`
- **Timezone:** Can use any timezone offset

### **4. description** (Optional)
- **Type:** String
- **Description:** Additional details about the live class
- **Example:** `"Interactive Q&A session for advanced JavaScript concepts"`
- **Max Length:** Not limited
- **Default:** Empty string if omitted

### **5. maxParticipants** (Optional)
- **Type:** Integer
- **Description:** Maximum allowed participants in the room
- **Min:** 10
- **Max:** 500
- **Example:** `150`
- **Default:** 200 if omitted

---

## Real-World Examples

### **Example 1: Basic Live Class**
```json
{
  "tenantName": "Tech Academy",
  "title": "Introduction to WebRTC",
  "scheduledAt": "2025-03-10T10:00:00Z"
}
```

### **Example 2: Advanced Live Class**
```json
{
  "tenantName": "Ironclad LMS",
  "title": "Advanced JavaScript Session - Live Q&A",
  "description": "Join us for an interactive Q&A session covering advanced JavaScript concepts including closures, prototypes, and async/await. Bring your questions!",
  "scheduledAt": "2025-03-20T15:00:00Z",
  "maxParticipants": 100
}
```

### **Example 3: Production Training**
```json
{
  "tenantName": "Fortune Tech",
  "title": "React Performance Optimization Workshop",
  "description": "Learn advanced React optimization techniques including code splitting, lazy loading, and performance monitoring.",
  "scheduledAt": "2025-04-15T09:00:00Z",
  "maxParticipants": 200
}
```

---

## Step-by-Step Creation Flow

### **Step 1: Get Your Tenant Name**
```sql
-- List all available tenants
SELECT id, name FROM "Tenant";
```

**Output:**
```
id                                    | name
--------------------------------------|------------------
550e8400-e29b-41d4-a716-446655440000 | Tech Academy
660e8400-e29b-41d4-a716-446655440001 | Ironclad LMS
770e8400-e29b-41d4-a716-446655440002 | Fortune Tech
```

### **Step 2: Format the Request**
```json
{
  "tenantName": "Tech Academy",
  "title": "My Amazing Live Class",
  "scheduledAt": "2025-12-01T14:00:00Z"
}
```

### **Step 3: Send the Request**

**Using cURL:**
```bash
curl -X POST http://localhost:3000/api/live-classes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName": "Tech Academy",
    "title": "My Amazing Live Class",
    "scheduledAt": "2025-12-01T14:00:00Z"
  }'
```

**Using Postman:**
1. Method: `POST`
2. URL: `http://localhost:3000/api/live-classes`
3. Headers:
   ```
   Authorization: Bearer YOUR_JWT_TOKEN
   Content-Type: application/json
   ```
4. Body (raw JSON):
   ```json
   {
     "tenantName": "Tech Academy",
     "title": "My Amazing Live Class",
     "scheduledAt": "2025-12-01T14:00:00Z"
   }
   ```

**Using JavaScript/Fetch:**
```javascript
const token = localStorage.getItem('jwt_token');

fetch('http://localhost:3000/api/live-classes', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tenantName: 'Tech Academy',
    title: 'My Amazing Live Class',
    scheduledAt: '2025-12-01T14:00:00Z'
  })
})
.then(response => response.json())
.then(data => console.log('✅ Live Class Created:', data))
.catch(error => console.error('❌ Error:', error));
```

**Using TypeScript/Axios:**
```typescript
import axios from 'axios';

const createLiveClass = async () => {
  try {
    const token = localStorage.getItem('jwt_token');
    
    const response = await axios.post(
      'http://localhost:3000/api/live-classes',
      {
        tenantName: 'Tech Academy',
        title: 'My Amazing Live Class',
        scheduledAt: '2025-12-01T14:00:00Z',
        maxParticipants: 150
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Live Class Created:', response.data);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
};

createLiveClass();
```

### **Step 4: Success Response**

**Status:** `201 Created`

```json
{
  "id": "uuid-of-live-class",
  "tenantId": "tenant-uuid",
  "title": "My Amazing Live Class",
  "description": null,
  "scheduledAt": "2025-12-01T14:00:00Z",
  "roomId": "room-a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "scheduled",
  "createdBy": "user-uuid",
  "createdAt": "2025-03-07T12:34:56Z",
  "updatedAt": "2025-03-07T12:34:56Z",
  "maxParticipants": 200,
  "participants": [],
  "tenant": {
    "id": "tenant-uuid",
    "name": "Tech Academy"
  }
}
```

---

## Common Errors & Solutions

### **Error 1: Tenant not found**
```
✗ ERROR: Tenant "" not found in database
```

**Cause:** `tenantName` field is empty or doesn't match any tenant

**Solution:**
```json
// ❌ WRONG
{
  "tenantName": "",
  "title": "My Class",
  "scheduledAt": "2025-12-01T14:00:00Z"
}

// ✅ CORRECT
{
  "tenantName": "Tech Academy",
  "title": "My Class",
  "scheduledAt": "2025-12-01T14:00:00Z"
}
```

---

### **Error 2: Invalid ISO 8601 date**
```
✗ ERROR: Validation failed - scheduledAt must be an ISO 8601 string
```

**Cause:** Date format is incorrect

**Solution:**
```json
// ❌ WRONG
{
  "tenantName": "Tech Academy",
  "title": "My Class",
  "scheduledAt": "12/01/2025 2:00 PM"
}

// ✅ CORRECT
{
  "tenantName": "Tech Academy",
  "title": "My Class",
  "scheduledAt": "2025-12-01T14:00:00Z"
}
```

---

### **Error 3: Missing required field**
```
✗ ERROR: title should not be empty
```

**Cause:** Required field is missing or empty

**Solution:**
```json
// ❌ WRONG
{
  "tenantName": "Tech Academy",
  "title": "",
  "scheduledAt": "2025-12-01T14:00:00Z"
}

// ✅ CORRECT
{
  "tenantName": "Tech Academy",
  "title": "My Class Title",
  "scheduledAt": "2025-12-01T14:00:00Z"
}
```

---

### **Error 4: Invalid maxParticipants**
```
✗ ERROR: maxParticipants must be between 10 and 500
```

**Cause:** Value is too low or too high

**Solution:**
```json
// ❌ WRONG
{
  "tenantName": "Tech Academy",
  "title": "My Class",
  "scheduledAt": "2025-12-01T14:00:00Z",
  "maxParticipants": 5
}

// ✅ CORRECT
{
  "tenantName": "Tech Academy",
  "title": "My Class",
  "scheduledAt": "2025-12-01T14:00:00Z",
  "maxParticipants": 50
}
```

---

### **Error 5: Unauthorized (401)**
```
✗ ERROR: Unauthorized - Invalid or missing JWT token
```

**Cause:** JWT token is missing, expired, or invalid

**Solution:**
```bash
# Make sure to include Authorization header
curl -X POST http://localhost:3000/api/live-classes \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d {...}
```

---

### **Error 6: Forbidden (403)**
```
✗ ERROR: You do not belong to tenant "Tech Academy"
```

**Cause:** User doesn't have access to this tenant

**Solution:**
- Use a tenant that belongs to your user
- Contact tenant admin to grant access
- Check that your user account is active in the tenant

---

## Debugging Steps

### **1. Check Available Tenants**
```bash
# In terminal, run:
psql postgresql://user:password@localhost:5432/database -c "SELECT id, name FROM \"Tenant\";"
```

### **2. Verify Your User Belongs to Tenant**
```bash
# Check UserTenant relationship
psql postgresql://user:password@localhost:5432/database -c "SELECT * FROM \"UserTenant\" WHERE \"userId\" = 'your-user-id';"
```

### **3. Test with Correct Tenant Name**
```bash
# Copy exact tenant name from database query results
# Use that exact spelling and capitalization
```

### **4. Check Your JWT Token**
```bash
# Decode JWT at jwt.io
# Verify user ID is correct
# Verify token is not expired
```

### **5. Check Backend Logs**
```bash
# Look for this in backend logs:
npm run start:dev
# Should show successful creation logs:
# 🎬 Starting Live Class Creation:
#    📝 Title: Your Title
#    🏢 Tenant Name: Your Tenant
#    ✓ Tenant found: Your Tenant (ID: ...)
```

---

## Full Request/Response Cycle

### **Request:**
```http
POST /api/live-classes HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
Content-Length: 150

{
  "tenantName": "Tech Academy",
  "title": "Advanced JavaScript Workshop",
  "description": "Learn advanced JS concepts",
  "scheduledAt": "2025-12-01T14:00:00Z",
  "maxParticipants": 100
}
```

### **Backend Logs:**
```
🎬 Starting Live Class Creation:
   📝 Title: Advanced JavaScript Workshop
   🏢 Tenant Name: Tech Academy
   👤 User ID: 8a41abb1-7a94-4cde-a173-46f6fd9d19f0
   🎭 Roles: tenant_admin
   🔍 Checking tenant membership...
   ✓ Tenant found: Tech Academy (ID: 550e8400-e29b-41d4-a716-446655440000)
   ✓ User 8a41abb1-7a94-4cde-a173-46f6fd9d19f0 is valid member
   ✅ Live Class created successfully:
      📌 ID: new-uuid
      🎭 Room ID: room-a1b2c3d4-e5f6-7890-abcd-ef1234567890
      🎬 Status: scheduled
```

### **Response:**
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "550e8401-e29b-41d4-a716-446655440001",
  "tenantId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Advanced JavaScript Workshop",
  "description": "Learn advanced JS concepts",
  "scheduledAt": "2025-12-01T14:00:00Z",
  "roomId": "room-a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "scheduled",
  "createdBy": "8a41abb1-7a94-4cde-a173-46f6fd9d19f0",
  "createdAt": "2025-03-07T12:34:56Z",
  "updatedAt": "2025-03-07T12:34:56Z",
  "maxParticipants": 100,
  "participants": [],
  "tenant": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Tech Academy"
  }
}
```

---

## Next Steps After Creating Live Class

### **1. Start the Live Class**
```bash
POST /api/live-classes/{liveClassId}/start
```

### **2. Join the Live Class**
```javascript
// Connect WebSocket
const socket = io('http://localhost:3000/ws-live-class', {
  transports: ['websocket'],
  auth: { token: JWT_TOKEN }
});

socket.emit('join', {
  roomId: 'room-uuid-from-response',
  userId: 'your-user-id',
  username: 'Your Name',
  email: 'your@email.com'
});
```

### **3. Start WebRTC Communication**
- Exchange peer offers/answers
- Handle ICE candidates
- Stream audio/video

### **4. End the Live Class**
```bash
POST /api/live-classes/{liveClassId}/end
```

---

## Quick Reference

| Field | Required | Type | Example |
|-------|----------|------|---------|
| tenantName | ✅ | String | "Tech Academy" |
| title | ✅ | String | "JavaScript Workshop" |
| scheduledAt | ✅ | ISO 8601 | "2025-12-01T14:00:00Z" |
| description | ❌ | String | "Learn JS concepts" |
| maxParticipants | ❌ | Int (10-500) | 100 |

---

## Summary

**To fix your error:**

1. **Get your tenant name:**
   ```sql
   SELECT name FROM "Tenant" LIMIT 1;
   ```

2. **Use that name in your request:**
   ```json
   {
     "tenantName": "Your Exact Tenant Name",
     "title": "Your Live Class Title",
     "scheduledAt": "2025-12-01T14:00:00Z"
   }
   ```

3. **Include Authorization header:**
   ```
   Authorization: Bearer YOUR_JWT_TOKEN
   ```

That's it! Your live class will be created successfully. 🎉

---

**Document Version:** 1.0  
**Last Updated:** March 7, 2026  
**Status:** Complete Reference Guide
