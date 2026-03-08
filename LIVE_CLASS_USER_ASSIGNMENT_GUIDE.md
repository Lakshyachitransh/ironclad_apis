# Live Class User Assignment Endpoints

## Overview

Two new endpoints have been added to the Live Class API to enable user assignment and selection functionality:

1. **List Available Users** - GET endpoint to retrieve all users in a tenant
2. **Assign Users** - POST endpoint to bulk-add users to a live class

---

## Endpoint 1: List Available Users

### Purpose
Retrieve all active users in a tenant that can be assigned to a live class. Use this endpoint to populate user selection dropdowns or lists in your frontend interface.

### Request

**HTTP Method:** `GET`

**Route:** `/live-classes/:liveClassId/available-users`

**Path Parameters:**
- `liveClassId` (string, required) - The ID of the live class

**Headers:**
```
Authorization: Bearer <access-token>
Content-Type: application/json
```

**Query Parameters:** None

**Request Body:** None

### Response

**Status Code:** `200 OK`

**Success Response Example:**
```json
{
  "total": 25,
  "users": [
    {
      "id": "user-1",
      "email": "john.doe@example.com",
      "displayName": "John Doe",
      "roles": ["learner", "trainer"],
      "createdAt": "2025-11-01T10:00:00Z"
    },
    {
      "id": "user-2",
      "email": "jane.smith@example.com",
      "displayName": "Jane Smith",
      "roles": ["learner"],
      "createdAt": "2025-11-02T10:00:00Z"
    }
  ]
}
```

**Response Fields:**
- `total` (number) - Total count of available users
- `users` (array) - Array of user objects
  - `id` (string) - Unique user ID
  - `email` (string) - User's email address
  - `displayName` (string) - User's display name
  - `roles` (array) - Array of tenant roles assigned to the user
  - `createdAt` (string, ISO8601) - User creation date

**Error Responses:**
- `400 Bad Request` - Missing tenant information in token
- `404 Not Found` - Live class not found

---

## Endpoint 2: Assign Users to Live Class

### Purpose
Bulk-add one or more users as participants to a live class. Set their role and handle capacity management automatically.

### Request

**HTTP Method:** `POST`

**Route:** `/live-classes/:liveClassId/assign-users`

**Path Parameters:**
- `liveClassId` (string, required) - The ID of the live class

**Headers:**
```
Authorization: Bearer <access-token>
Content-Type: application/json
```

**Required Permissions:**
- `live-classes.manage` - Permission required to manage live class participants

**Request Body:**
```json
{
  "userIds": ["user-id-1", "user-id-2", "user-id-3"],
  "role": "participant"
}
```

**Request Fields:**
- `userIds` (array of strings, required)
  - Array of user IDs to assign to the live class
  - Minimum: 1 user ID
  - Example: `["user-1", "user-2", "user-3"]`

- `role` (string, optional, default: "participant")
  - Role for the assigned users
  - Allowed values: `"participant"` or `"teacher"`
  - Example: `"participant"`

### Response

**Status Code:** `200 OK`

**Success Response Example:**
```json
{
  "liveClassId": "123e4567-e89b-12d3-a456-426614174000",
  "assigned": 3,
  "skipped": 0,
  "alreadyAssigned": [],
  "participants": [
    {
      "id": "participant-1",
      "userId": "user-id-1",
      "role": "participant",
      "joinedAt": "2025-11-20T14:00:00Z"
    },
    {
      "id": "participant-2",
      "userId": "user-id-2",
      "role": "participant",
      "joinedAt": "2025-11-20T14:00:00Z"
    },
    {
      "id": "participant-3",
      "userId": "user-id-3",
      "role": "participant",
      "joinedAt": "2025-11-20T14:00:00Z"
    }
  ],
  "message": "Successfully assigned 3 user(s) to the live class"
}
```

**Response Fields:**
- `liveClassId` (string) - The ID of the live class
- `assigned` (number) - Count of newly assigned users
- `skipped` (number) - Count of users already assigned (not re-assigned)
- `alreadyAssigned` (array) - Array of user IDs that were already assigned
- `participants` (array) - Array of newly assigned participant objects
  - `id` (string) - Participant record ID
  - `userId` (string) - The user ID
  - `role` (string) - The assigned role
  - `joinedAt` (string, ISO8601) - Assignment timestamp
- `message` (string) - Human-readable success message

### Response Status Codes

| Status Code | Description |
|------------|-------------|
| 200 | Users assigned successfully |
| 400 | Bad request (invalid input, capacity exceeded, users not found) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Live class not found |

### Error Response Examples

**Capacity Exceeded:**
```json
{
  "statusCode": 400,
  "message": "Cannot assign 5 users. Only 2 slots available (class capacity: 150)",
  "error": "Bad Request"
}
```

**Users Not Found:**
```json
{
  "statusCode": 400,
  "message": "2 user(s) not found or not active in this tenant",
  "error": "Bad Request"
}
```

**Insufficient Permissions:**
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

---

## Usage Examples

### Example 1: Fetch Available Users

**cURL:**
```bash
curl -X GET "http://localhost:3000/live-classes/class-id-123/available-users" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"
```

**JavaScript/Fetch:**
```javascript
const response = await fetch(
  'http://localhost:3000/live-classes/class-id-123/available-users',
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  }
);

const data = await response.json();
console.log('Available users:', data.users);
```

---

### Example 2: Assign Users to Live Class

**cURL:**
```bash
curl -X POST "http://localhost:3000/live-classes/class-id-123/assign-users" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["user-1", "user-2", "user-3"],
    "role": "participant"
  }'
```

**JavaScript/Fetch:**
```javascript
const response = await fetch(
  'http://localhost:3000/live-classes/class-id-123/assign-users',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userIds: ['user-1', 'user-2', 'user-3'],
      role: 'participant'
    })
  }
);

const result = await response.json();
console.log(`Assigned ${result.assigned} users to the live class`);
console.log(`Already assigned: ${result.skipped} users`);
```

---

### Example 3: Assign Teacher to Live Class

**cURL:**
```bash
curl -X POST "http://localhost:3000/live-classes/class-id-123/assign-users" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["teacher-user-id"],
    "role": "teacher"
  }'
```

**JavaScript/Fetch:**
```javascript
await fetch(
  'http://localhost:3000/live-classes/class-id-123/assign-users',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userIds: ['teacher-user-id'],
      role: 'teacher'
    })
  }
);
```

---

## Frontend Integration Guide

### Step 1: Fetch Available Users
```javascript
async function loadAvailableUsers(liveClassId) {
  const response = await fetch(
    `/live-classes/${liveClassId}/available-users`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  return response.json();
}
```

### Step 2: Display User Selector UI
```javascript
// Example: Populate a dropdown or multi-select component
const data = await loadAvailableUsers(classId);
const userOptions = data.users.map(user => ({
  value: user.id,
  label: `${user.displayName} (${user.email})`,
  roles: user.roles
}));

// Display options in UI dropdown
```

### Step 3: Assign Selected Users
```javascript
async function assignUsers(liveClassId, selectedUserIds, role = 'participant') {
  const response = await fetch(
    `/live-classes/${liveClassId}/assign-users`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userIds: selectedUserIds,
        role: role
      })
    }
  );

  const result = await response.json();
  console.log(`Successfully assigned ${result.assigned} users`);
  if (result.skipped > 0) {
    console.log(`${result.skipped} users were already assigned`);
  }
  return result;
}
```

---

## API Workflow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                  Live Class Management                   │
└─────────────────────────────────────────────────────────┘

1. User loads live class management page
   ↓
2. GET /live-classes/:id/available-users
   ├─ Fetches all active users in tenant
   ├─ Returns list of users with their details
   └─ Frontend displays user selection UI
   ↓
3. User selects multiple users or individual users
   ↓
4. POST /live-classes/:id/assign-users
   ├─ Validates all users exist and are active
   ├─ Checks available capacity
   ├─ Skips already-assigned users
   ├─ Creates LiveClassParticipant records
   └─ Returns result with assignment summary
   ↓
5. Frontend displays success message with:
   ├─ Number of newly assigned users
   ├─ Number of already-assigned users (skipped)
   └─ Assignment details
```

---

## Important Notes

1. **Capacity Management**
   - Each live class has a maximum participant capacity
   - The `assign-users` endpoint respects this limit
   - If there aren't enough slots, the request will fail with a 400 error

2. **Duplicate Prevention**
   - Users already assigned to the live class are automatically skipped
   - The response will show these in the `alreadyAssigned` array
   - No error is thrown; the assignment simply skips them

3. **Permissions**
   - The assign-users endpoint requires `live-classes.manage` permission
   - The available-users endpoint requires only basic authentication

4. **User Validation**
   - Only active users in the tenant are returned/assignable
   - Inactive or deleted users cannot be assigned
   - Users from other tenants cannot be assigned

5. **Role Assignment**
   - Default role is `"participant"` if not specified
   - Currently supports: `"participant"` and `"teacher"`
   - All assigned users get the same role in that assignment batch

---

## Troubleshooting

### Issue: "No tenant information in token"
**Solution:** Ensure your authentication token includes valid tenant information. Platform admins should have their token properly configured.

### Issue: "Live class not found"
**Solution:** Verify the `liveClassId` parameter is correct and the live class exists in your tenant.

### Issue: "Cannot assign users. Only X slots available"
**Solution:** The live class has reached its capacity. Either:
- Remove unnecessary participants
- Increase the class capacity (if allowed)
- Create a second live class

### Issue: "User(s) not found or not active in this tenant"
**Solution:** Verify:
- The user IDs are correct
- Users are active (not suspended/deleted)
- Users belong to the same tenant as the live class

---

## Related Endpoints

- `POST /live-classes` - Create a new live class
- `GET /live-classes` - List all live classes
- `GET /live-classes/:id` - Get live class details
- `POST /live-classes/:id/join` - Join a live class as participant
- `POST /live-classes/:id/leave` - Leave a live class
- `GET /live-classes/:id/participants` - Get active participants

---

## Support

For issues or questions regarding these endpoints, please refer to the main API documentation or contact the development team.
