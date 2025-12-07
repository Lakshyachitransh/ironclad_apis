# User Endpoints - Complete Guide

## Overview

The application has **user-related endpoints** under the `/api/users` controller. Note: There is **no `/api/user` (singular)** endpoint. All user operations use `/api/users` (plural).

---

## Available User Endpoints

### 1. **List All Users in Tenant** (GET)

**Endpoint**: `GET /api/users`  
**Authentication**: Required (JWT Bearer Token)  
**Authorization**: `tenant_admin` role required  
**Returns**: Array of all users in the authenticated admin's tenant

### 2. **Create New User** (POST)

**Endpoint**: `POST /api/users`  
**Authentication**: Required (JWT Bearer Token)  
**Authorization**: `tenant_admin` role required  
**Payload**: User data with tenant name and optional roles

### 3. **Bulk Upload Users** (POST)

**Endpoint**: `POST /api/users/bulk-upload`  
**Authentication**: Required (JWT Bearer Token)  
**Authorization**: `org_admin` or `tenant_admin` role required  
**Payload**: CSV file with user data

---

## Detailed Endpoint Documentation

## Endpoint 1: List All Users (GET /api/users)

### Purpose

Retrieves all users in the authenticated admin's tenant with their roles and details.

### Request

```
GET /api/users
Authorization: Bearer <JWT_TOKEN>
```

### Response (200 OK)

```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "john@example.com",
    "displayName": "John Doe",
    "roles": ["learner"],
    "createdAt": "2025-11-19T10:00:00Z"
  },
  {
    "id": "223e4567-e89b-12d3-a456-426614174001",
    "email": "jane@example.com",
    "displayName": "Jane Smith",
    "roles": ["learner", "instructor"],
    "createdAt": "2025-11-20T14:30:00Z"
  },
  {
    "id": "323e4567-e89b-12d3-a456-426614174002",
    "email": "mike@example.com",
    "displayName": "Mike Johnson",
    "roles": ["training_manager"],
    "createdAt": "2025-11-21T09:15:00Z"
  }
]
```

### How It Works

**Step-by-step process:**

1. **Authentication Check**
   - Validates JWT token from Authorization header
   - Extracts user information from token payload
   - Verifies token hasn't expired

2. **Authorization Check**
   - Verifies user has `tenant_admin` role
   - If not, returns 403 Forbidden

3. **Tenant Extraction**
   - Retrieves `tenantId` from authenticated user's JWT payload
   - Uses this to filter users

4. **Database Query**
   - Queries `UserTenant` table filtered by tenant ID
   - Joins with `User` table to get user details
   - Returns user info + roles array

5. **Response Formatting**
   - Maps database records to response objects
   - Includes: id, email, displayName, roles, createdAt
   - Returns as JSON array

### Database Query (Behind the Scenes)

```sql
SELECT
  u.id,
  u.email,
  u.displayName,
  u.createdAt,
  ut.roles
FROM "User" u
INNER JOIN "UserTenant" ut ON u.id = ut.userId
WHERE ut.tenantId = $1
ORDER BY u.createdAt DESC;
```

### Example Using cURL

```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example Using JavaScript

```javascript
const response = await fetch('http://localhost:3000/api/users', {
  method: 'GET',
  headers: {
    Authorization: `Bearer ${jwtToken}`,
    'Content-Type': 'application/json',
  },
});

const users = await response.json();
console.log(users);
```

### Error Responses

**401 Unauthorized** (No valid JWT):

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**403 Forbidden** (Not tenant_admin):

```json
{
  "statusCode": 403,
  "message": "Insufficient permissions: user does not have required role 'tenant_admin'"
}
```

---

## Endpoint 2: Create New User (POST /api/users)

### Purpose

Creates a new user and automatically attaches them to the specified tenant.

### Request

```
POST /api/users
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Payload

```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123",
  "displayName": "New User",
  "tenantName": "Tech Academy",
  "roles": ["learner"]
}
```

### Response (201 Created)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "newuser@example.com",
  "displayName": "New User",
  "status": "active",
  "createdAt": "2025-12-05T10:30:00Z",
  "tenantName": "Tech Academy",
  "tenantId": "650e8400-e29b-41d4-a716-446655440001",
  "roles": ["learner"],
  "userTenantId": "750e8400-e29b-41d4-a716-446655440002"
}
```

### How It Works

**Step-by-step process:**

1. **Authentication & Authorization**
   - Validates JWT token
   - Checks user has `tenant_admin` role
   - Extracts tenant ID from token

2. **Input Validation**
   - Validates email format
   - Checks password length (min 8 characters)
   - Validates all required fields present

3. **Tenant Lookup**
   - Looks up tenant by exact name match from `tenantName` field
   - Returns error if tenant not found

4. **Email Uniqueness Check**
   - Queries database for existing user with same email
   - Returns error if email already used

5. **Password Hashing**
   - Hashes password using bcrypt (salt rounds from env)
   - Stores hash, not plain password

6. **Transaction - Create User & Link to Tenant**
   - Creates record in `User` table with:
     - email
     - passwordHash (bcrypt hashed)
     - displayName
     - status: "active"
   - Creates `UserTenant` relationship with:
     - userId → newly created user
     - tenantId → looked up tenant
     - roles → assigned roles (defaults to ["learner"])

7. **Response**
   - Returns created user with full tenant details

### Database Operations (Behind the Scenes)

```sql
BEGIN TRANSACTION;

-- Create user
INSERT INTO "User" (id, email, passwordHash, displayName, status, createdAt)
VALUES (uuid(), $1, $2, $3, 'active', NOW());

-- Create user-tenant link
INSERT INTO "UserTenant" (id, userId, tenantId, roles, createdAt)
VALUES (uuid(), $4, $5, $6, NOW());

COMMIT;
```

### Error Responses

**400 Bad Request** (Email already exists):

```json
{
  "statusCode": 400,
  "message": "Email already exists",
  "error": "Bad Request"
}
```

**400 Bad Request** (Tenant not found):

```json
{
  "statusCode": 400,
  "message": "Tenant \"NonExistent Org\" not found",
  "error": "Bad Request"
}
```

**400 Bad Request** (Invalid email format):

```json
{
  "statusCode": 400,
  "message": "email must be an email",
  "error": "Bad Request"
}
```

**400 Bad Request** (Password too short):

```json
{
  "statusCode": 400,
  "message": "password must be longer than or equal to 8 characters",
  "error": "Bad Request"
}
```

---

## Endpoint 3: Bulk Upload Users (POST /api/users/bulk-upload)

### Purpose

Upload multiple users at once from a CSV file.

### Request

```
POST /api/users/bulk-upload
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

### CSV Format

```
email,displayName,password,roles
user1@example.com,John Doe,,learner
user2@example.com,Jane Smith,,learner|instructor
user3@example.com,Bob Johnson,SecurePass123,training_manager
```

### Field Descriptions

| Column      | Required | Description                                  |
| ----------- | -------- | -------------------------------------------- |
| email       | Yes      | User's email address                         |
| displayName | No       | Display name (defaults to "User {n}")        |
| password    | No       | Password (auto-generated if missing)         |
| roles       | No       | Pipe-separated roles (defaults to "learner") |

### Request Example (cURL)

```bash
curl -X POST http://localhost:3000/api/users/bulk-upload \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -F "csv=@users.csv" \
  -F "defaultRoles=learner"
```

### Response (201 Created)

```json
{
  "successful": 3,
  "failed": 0,
  "results": [
    {
      "email": "user1@example.com",
      "displayName": "John Doe",
      "password": "TempPass_12345",
      "roles": ["learner"],
      "status": "success"
    },
    {
      "email": "user2@example.com",
      "displayName": "Jane Smith",
      "password": "TempPass_67890",
      "roles": ["learner", "instructor"],
      "status": "success"
    },
    {
      "email": "user3@example.com",
      "displayName": "Bob Johnson",
      "password": "SecurePass123",
      "roles": ["training_manager"],
      "status": "success"
    }
  ]
}
```

### How It Works

1. **File Upload**
   - Receives CSV file in request
   - Validates file size (max 5MB)

2. **CSV Parsing**
   - Reads CSV file line by line
   - Parses columns: email, displayName, password, roles

3. **For Each User:**
   - Validates email format
   - Generates password if not provided
   - Splits pipe-separated roles
   - Creates user using same logic as POST /api/users

4. **Error Handling**
   - Continues processing even if one user fails
   - Returns both successful and failed entries
   - Includes error reasons for failures

5. **Response**
   - Summary: successful count, failed count
   - Detailed list of each result with status

---

## Request/Response Flow Diagram

```
┌─────────────────────────────────────┐
│   Client Request                    │
│ GET /api/users                      │
│ Authorization: Bearer <JWT>         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 1. JWT Validation                   │
│    - Verify token signature         │
│    - Check expiration               │
│    - Extract payload                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 2. Authorization Check              │
│    - Verify tenant_admin role       │
│    - Extract tenantId               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 3. Database Query                   │
│    SELECT users WHERE               │
│    tenantId = $1                    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 4. Format Response                  │
│    Map to JSON array                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   JSON Response (200 OK)            │
│   [{ user1 }, { user2 }, ...]      │
└─────────────────────────────────────┘
```

---

## Important Concepts

### 1. **Tenant-Scoped Operations**

All user operations are tenant-scoped:

- `tenant_admin` can only see/manage users in their tenant
- Users in different tenants are completely isolated
- Same user can exist in multiple tenants with different roles

### 2. **Role-Based Access Control**

- Only `tenant_admin` or `platform_admin` can create/list users
- Regular users cannot call these endpoints
- Unauthenticated requests return 401

### 3. **Multi-Tenant Support**

A user can belong to multiple tenants:

```javascript
// Same user in different tenants
UserTenant 1: user-123 → tenant-A → roles: ["learner"]
UserTenant 2: user-123 → tenant-B → roles: ["instructor"]

// GET /api/users from tenant-A returns only users in tenant-A
// GET /api/users from tenant-B returns only users in tenant-B
```

### 4. **Password Security**

- Passwords are bcrypt hashed before storage
- Plain passwords are never returned in responses
- Passwords are never logged
- Salt rounds configurable via `BCRYPT_SALT_ROUNDS` env var

### 5. **Transaction Safety**

User creation uses database transactions:

- If any step fails, entire operation rolled back
- No orphaned users without tenant links
- Data consistency guaranteed

---

## Common Use Cases

### Use Case 1: Admin Views Team

```javascript
// Tenant admin views all users in their organization
const response = await fetch('/api/users', {
  headers: { Authorization: `Bearer ${adminToken}` },
});
const teamUsers = await response.json();
console.log(`Team has ${teamUsers.length} members`);
```

### Use Case 2: Create New Learner

```javascript
const response = await fetch('/api/users', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'learner@company.com',
    password: 'TempPass123',
    displayName: 'New Learner',
    tenantName: 'My Organization',
    roles: ['learner'],
  }),
});
const newUser = await response.json();
console.log(`Created user: ${newUser.email}`);
```

### Use Case 3: Bulk Import

```javascript
// Upload 100 users from CSV
const formData = new FormData();
formData.append('csv', csvFile);
formData.append('defaultRoles', 'learner');

const response = await fetch('/api/users/bulk-upload', {
  method: 'POST',
  headers: { Authorization: `Bearer ${adminToken}` },
  body: formData,
});
const result = await response.json();
console.log(`Imported ${result.successful} users, ${result.failed} failed`);
```

---

## Troubleshooting

| Error                      | Cause                     | Solution                                           |
| -------------------------- | ------------------------- | -------------------------------------------------- |
| 401 Unauthorized           | No JWT or invalid token   | Include valid Bearer token in Authorization header |
| 403 Forbidden              | Not tenant_admin          | Must have tenant_admin role                        |
| 400 - Tenant not found     | Tenant name doesn't exist | Check exact tenant name in database                |
| 400 - Email already exists | Email in use              | Use different email address                        |
| 400 - Invalid email format | Email format wrong        | Use valid email format                             |

---

## Summary

**User Endpoints:**

- **GET /api/users** - List all users in your tenant
- **POST /api/users** - Create single user
- **POST /api/users/bulk-upload** - Bulk import users from CSV

**Requirements:**

- JWT Bearer token in Authorization header
- `tenant_admin` or `platform_admin` role
- Valid tenant for user creation

**Key Points:**

- Tenant-scoped: only see your tenant's users
- Multi-tenant support: users can exist in multiple tenants
- Password security: bcrypt hashing
- Transaction safe: atomic operations
