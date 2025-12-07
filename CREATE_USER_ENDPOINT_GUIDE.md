# Create User Endpoint - Complete Guide

## Endpoint Overview

**Endpoint**: `POST /api/users`  
**Authentication**: Required (JWT Bearer Token)  
**Authorization**: `tenant_admin` role required  
**Status Code**: `201 Created`

---

## Payload Structure

### Request Body (JSON)

```json
{
  "email": "string (required)",           // Valid email address, must be unique
  "password": "string (required)",        // Minimum 8 characters
  "displayName": "string (optional)",     // User's display name (first + last name)
  "tenantName": "string (required)",      // Name of tenant to attach user to
  "roles": ["string[]] (optional)"        // Array of role codes. Default: ["learner"]
}
```

---

## Field Validation Rules

| Field         | Type     | Required | Validation                                   | Example                                               |
| ------------- | -------- | -------- | -------------------------------------------- | ----------------------------------------------------- |
| `email`       | string   | ✅ YES   | Valid email format, must be unique in system | `john@example.com`                                    |
| `password`    | string   | ✅ YES   | Minimum 8 characters                         | `SecurePass123!`                                      |
| `displayName` | string   | ❌ NO    | Any string                                   | `John Doe`                                            |
| `tenantName`  | string   | ✅ YES   | Must match exact tenant name in database     | `Tech Academy`                                        |
| `roles`       | string[] | ❌ NO    | Array of valid role codes                    | `["learner"]` or `["instructor", "training_manager"]` |

---

## Complete Payload Examples

### Example 1: Minimal Payload (Only Required Fields)

```json
{
  "email": "student@example.com",
  "password": "MyPassword123",
  "tenantName": "Tech Academy"
}
```

**What happens:**

- Creates user with email `student@example.com`
- Password set to `MyPassword123`
- Display name: `null` (not provided)
- Attached to tenant named `Tech Academy`
- **Default role assigned**: `["learner"]`

**Response** (201 Created):

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "student@example.com",
  "displayName": null,
  "status": "active",
  "createdAt": "2025-12-05T10:30:00Z",
  "tenantName": "Tech Academy",
  "tenantId": "650e8400-e29b-41d4-a716-446655440001",
  "roles": ["learner"],
  "userTenantId": "750e8400-e29b-41d4-a716-446655440002"
}
```

---

### Example 2: Complete Payload with Display Name

```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123",
  "displayName": "John Doe",
  "tenantName": "Tech Academy"
}
```

**What happens:**

- Creates user with name "John Doe"
- Attached to `Tech Academy` tenant
- Default role: `["learner"]`

**Response** (201 Created):

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john.doe@example.com",
  "displayName": "John Doe",
  "status": "active",
  "createdAt": "2025-12-05T10:30:00Z",
  "tenantName": "Tech Academy",
  "tenantId": "650e8400-e29b-41d4-a716-446655440001",
  "roles": ["learner"],
  "userTenantId": "750e8400-e29b-41d4-a716-446655440002"
}
```

---

### Example 3: User with Single Custom Role

```json
{
  "email": "instructor@example.com",
  "password": "TeacherPass123",
  "displayName": "Sarah Smith",
  "tenantName": "Tech Academy",
  "roles": ["instructor"]
}
```

**What happens:**

- Creates instructor user
- Assigned `instructor` role (not default learner)
- Can now start live classes and view student progress

**Response** (201 Created):

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "email": "instructor@example.com",
  "displayName": "Sarah Smith",
  "status": "active",
  "createdAt": "2025-12-05T10:35:00Z",
  "tenantName": "Tech Academy",
  "tenantId": "650e8400-e29b-41d4-a716-446655440001",
  "roles": ["instructor"],
  "userTenantId": "750e8400-e29b-41d4-a716-446655440003"
}
```

---

### Example 4: User with Multiple Roles

```json
{
  "email": "manager@example.com",
  "password": "ManagerPass123",
  "displayName": "Mike Johnson",
  "tenantName": "Tech Academy",
  "roles": ["training_manager", "instructor"]
}
```

**What happens:**

- Creates user with TWO roles in the same tenant
- Can create courses AND teach live classes
- Permissions = Union of both roles' permissions

**Response** (201 Created):

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440004",
  "email": "manager@example.com",
  "displayName": "Mike Johnson",
  "status": "active",
  "createdAt": "2025-12-05T10:40:00Z",
  "tenantName": "Tech Academy",
  "tenantId": "650e8400-e29b-41d4-a716-446655440001",
  "roles": ["training_manager", "instructor"],
  "userTenantId": "750e8400-e29b-41d4-a716-446655440004"
}
```

---

### Example 5: Real-World Scenario - Creating Different User Types

#### Creating a Learner

```json
{
  "email": "alice@students.edu",
  "password": "StudentPassword123",
  "displayName": "Alice Brown",
  "tenantName": "University of Tech"
}
```

#### Creating an Instructor

```json
{
  "email": "prof.james@university.edu",
  "password": "ProfessorPass123",
  "displayName": "Professor James Wilson",
  "tenantName": "University of Tech",
  "roles": ["instructor"]
}
```

#### Creating a Course Manager

```json
{
  "email": "curriculum@university.edu",
  "password": "ManagerPass123",
  "displayName": "Curriculum Manager",
  "tenantName": "University of Tech",
  "roles": ["training_manager"]
}
```

#### Creating a Tenant Admin

```json
{
  "email": "admin@university.edu",
  "password": "AdminPass123",
  "displayName": "Tenant Administrator",
  "tenantName": "University of Tech",
  "roles": ["tenant_admin"]
}
```

---

## Step-by-Step Request Example

### Using cURL

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123",
    "displayName": "New User",
    "tenantName": "Tech Academy",
    "roles": ["learner"]
  }'
```

### Using JavaScript/Fetch

```javascript
const response = await fetch('http://localhost:3000/api/users', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${jwtToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'newuser@example.com',
    password: 'SecurePass123',
    displayName: 'New User',
    tenantName: 'Tech Academy',
    roles: ['learner'],
  }),
});

const user = await response.json();
console.log(user);
```

### Using TypeScript/Axios

```typescript
import axios from 'axios';

interface CreateUserPayload {
  email: string;
  password: string;
  displayName?: string;
  tenantName: string;
  roles?: string[];
}

const payload: CreateUserPayload = {
  email: 'newuser@example.com',
  password: 'SecurePass123',
  displayName: 'New User',
  tenantName: 'Tech Academy',
  roles: ['learner'],
};

const response = await axios.post('http://localhost:3000/api/users', payload, {
  headers: {
    Authorization: `Bearer ${jwtToken}`,
    'Content-Type': 'application/json',
  },
});

console.log(response.data);
```

### Using Postman

```
1. Set Method: POST
2. URL: http://localhost:3000/api/users
3. Headers Tab:
   - Authorization: Bearer YOUR_JWT_TOKEN
   - Content-Type: application/json
4. Body Tab (raw, JSON):
{
  "email": "newuser@example.com",
  "password": "SecurePass123",
  "displayName": "New User",
  "tenantName": "Tech Academy",
  "roles": ["learner"]
}
5. Click Send
```

---

## Response Formats

### ✅ Success Response (201 Created)

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

### ❌ Error: Invalid Email Format (400 Bad Request)

```json
{
  "statusCode": 400,
  "message": "email must be an email",
  "error": "Bad Request"
}
```

### ❌ Error: Password Too Short (400 Bad Request)

```json
{
  "statusCode": 400,
  "message": "password must be longer than or equal to 8 characters",
  "error": "Bad Request"
}
```

### ❌ Error: Email Already Exists (400 Bad Request)

```json
{
  "statusCode": 400,
  "message": "Email already exists",
  "error": "Bad Request"
}
```

### ❌ Error: Tenant Not Found (400 Bad Request)

```json
{
  "statusCode": 400,
  "message": "Tenant \"NonExistent Org\" not found",
  "error": "Bad Request"
}
```

### ❌ Error: Missing Required Field (400 Bad Request)

```json
{
  "statusCode": 400,
  "message": "email should not be empty",
  "error": "Bad Request"
}
```

### ❌ Error: No Authentication (401 Unauthorized)

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### ❌ Error: Insufficient Permissions (403 Forbidden)

```json
{
  "statusCode": 403,
  "message": "Insufficient permissions: user does not have required role 'tenant_admin'",
  "error": "Forbidden"
}
```

---

## Important Notes

### 1. **Tenant Name Must Match Exactly**

The `tenantName` must match an existing tenant name in the database (case-sensitive).

```javascript
// ✅ CORRECT - matches tenant name exactly
{
  tenantName: 'Tech Academy';
}

// ❌ WRONG - different case
{
  tenantName: 'tech academy';
}

// ❌ WRONG - close but not exact
{
  tenantName: 'Tech Academy Ltd';
}
```

### 2. **Email Must Be Unique**

Once an email is used, it cannot be reused. Each user must have a unique email.

```javascript
// ✅ First time - works
{ email: "john@example.com", ... }

// ❌ Second time - fails with "Email already exists"
{ email: "john@example.com", ... }
```

### 3. **Password Hashing**

Passwords are automatically hashed using bcrypt before storage. The password in response will NOT be returned.

### 4. **Default Role Assignment**

If no roles are specified, the user automatically gets the `learner` role.

```javascript
// These two are equivalent:
{
  roles: ['learner'];
}
{
} // roles not specified - defaults to ["learner"]
```

### 5. **Multiple Roles in One Tenant**

A user can have multiple roles in the same tenant, giving them combined permissions.

```javascript
{
  "roles": ["instructor", "training_manager", "course_reviewer"]
}
// User can: Teach classes + Create courses + Review content
```

### 6. **Status Always "active"**

New users are created with status `active` by default. They can log in immediately.

### 7. **User Creation Transaction**

The entire process (create user + link to tenant + assign roles) happens in a database transaction. If any step fails, the entire operation is rolled back.

---

## Response Field Explanation

| Field          | Type           | Explanation                                              |
| -------------- | -------------- | -------------------------------------------------------- |
| `id`           | UUID           | Unique user identifier across entire system              |
| `email`        | string         | User's email address (unique globally)                   |
| `displayName`  | string or null | User's display name, or null if not provided             |
| `status`       | string         | User status (always "active" for new users)              |
| `createdAt`    | ISO string     | When the user was created (UTC timestamp)                |
| `tenantName`   | string         | Name of the tenant the user belongs to                   |
| `tenantId`     | UUID           | ID of the tenant                                         |
| `roles`        | string[]       | Array of role codes assigned to this user in this tenant |
| `userTenantId` | UUID           | Unique ID of the UserTenant relationship record          |

---

## Authorization & Security

### Who Can Create Users?

Only `tenant_admin` users can create new users.

```javascript
// Must have this role to call endpoint
"roles": ["tenant_admin"]
```

### What About Platform Admin?

Platform admin can also create users using the same endpoint, as they have `tenant_admin` capabilities.

### Multi-Tenant Isolation

Tenant admins can ONLY create users in their own tenant:

```javascript
// tenant_admin of "Tech Academy" tries this:
{
  "email": "newuser@example.com",
  "password": "SecurePass123",
  "tenantName": "Competitor Academy"  // ❌ FAILS - not their tenant
}

// Must be:
{
  "email": "newuser@example.com",
  "password": "SecurePass123",
  "tenantName": "Tech Academy"  // ✅ Their tenant
}
```

---

## Common Scenarios

### Scenario 1: Bulk Create Users (One at a Time)

```javascript
const users = [
  {
    email: 'student1@example.com',
    password: 'Pass123456',
    displayName: 'Student 1',
  },
  {
    email: 'student2@example.com',
    password: 'Pass123456',
    displayName: 'Student 2',
  },
  {
    email: 'student3@example.com',
    password: 'Pass123456',
    displayName: 'Student 3',
  },
];

for (const user of users) {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...user,
      tenantName: 'Tech Academy',
      roles: ['learner'],
    }),
  });
  console.log(await response.json());
}

// Better: Use bulk upload endpoint instead (if available)
```

### Scenario 2: Create Instructor for a Course

```javascript
{
  "email": "prof.smith@university.edu",
  "password": "InstructorPass123",
  "displayName": "Professor Smith",
  "tenantName": "University of Tech",
  "roles": ["instructor"]
}
```

### Scenario 3: Create Power User (Multiple Roles)

```javascript
{
  "email": "poweruser@example.com",
  "password": "PowerUserPass123",
  "displayName": "Power User",
  "tenantName": "Tech Academy",
  "roles": ["training_manager", "instructor", "course_reviewer"]
}
```

### Scenario 4: Quick Learner Registration

```javascript
{
  "email": "quicklearn@example.com",
  "password": "QuickPass123",
  "tenantName": "Tech Academy"
  // displayName and roles omitted - uses defaults
}

// Result: Created with null displayName and ["learner"] role
```

---

## Troubleshooting

| Error                                                   | Cause                         | Solution                                                 |
| ------------------------------------------------------- | ----------------------------- | -------------------------------------------------------- |
| `email must be an email`                                | Invalid email format          | Use valid email: `user@domain.com`                       |
| `password must be longer than or equal to 8 characters` | Password too short            | Use at least 8 characters                                |
| `Email already exists`                                  | Email is already used         | Use a different, unique email                            |
| `Tenant "X" not found`                                  | Tenant name doesn't exist     | Check exact tenant name in database                      |
| `Unauthorized`                                          | No JWT token or invalid token | Include valid Bearer token in header                     |
| `Insufficient permissions`                              | Not a tenant_admin            | Must have tenant_admin role                              |
| Missing required field error                            | Didn't include required field | Include all required fields: email, password, tenantName |

---

## API Documentation Link

- Swagger/OpenAPI: `http://localhost:3000/api/docs`

---

## Summary

**Create User Endpoint:**

- **URL**: `POST /api/users`
- **Auth**: JWT token + `tenant_admin` role required
- **Required fields**: `email`, `password`, `tenantName`
- **Optional fields**: `displayName`, `roles`
- **Default role**: `learner` (if not specified)
- **Response**: Created user with all details including tenant and role information
- **Status Code**: `201 Created` on success

**Minimum Valid Payload:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "tenantName": "Your Tenant Name"
}
```

**Full Payload Example:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "displayName": "User Name",
  "tenantName": "Your Tenant Name",
  "roles": ["learner"]
}
```
