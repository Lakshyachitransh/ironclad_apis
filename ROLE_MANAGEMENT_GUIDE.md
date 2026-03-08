# Role Management API Guide

**Date:** March 7, 2026  
**Version:** 2.0  
**Status:** Role-Based Access Control Implementation  

---

## Overview

The Role Management API provides endpoints for creating and managing roles in your system with full role-based access control (RBAC). Users can:

- **Create custom roles** for their tenant (if authorized)
- **View all roles** in their tenant (system and custom)
- **View all roles globally** (platform admins only)
- **Assign permissions** to roles
- **Manage roles by category**

---

## Features

✅ **Tenant-Scoped Roles** - Each tenant can create custom roles  
✅ **Role-Based Authorization** - Only authorized users can create roles  
✅ **System & Custom Roles** - Mix of predefined and tenant-specific roles  
✅ **Permission Management** - Assign permissions to roles by code or ID  
✅ **Category-Based Permissions** - Assign all permissions in a category at once  

---

## Authorization Rules

### Who Can Create Roles?

| User Role | Can Create Roles | Scope |
|-----------|-----------------|-------|
| **Platform Admin** | ✅ Yes | Any tenant (via `/roles/tenant/:tenantId`) |
| **Tenant Admin** | ✅ Yes | Only their own tenant |
| **Org Admin** | ✅ Yes | Only their own tenant |
| **Other Users** | ❌ No | Cannot create roles |

### Who Can View Roles?

| User Role | Can View Roles | Scope |
|-----------|---|---|
| **Platform Admin** | ✅ Yes | All tenants (requires `roles.read` permission) |
| **Tenant Admin** | ✅ Yes | Only their own tenant (requires `roles.read` permission) |
| **Org Admin** | ✅ Yes | Only their own tenant (requires `roles.read` permission) |
| **Other Users** | ✅ Yes | Only their own tenant (requires `roles.read` permission) |

---

## API Endpoints

### 1. Get All Roles in Your Tenant (Convenience Endpoint)

**Endpoint:** `GET /roles/my-tenant/all`

**Permission Required:** `roles.read`

**Description:** Get all roles (system and custom) in your current tenant without specifying tenant ID.

**Request:**
```bash
curl -X GET http://localhost:3000/roles/my-tenant/all \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200 OK):**
```json
{
  "systemRoles": [
    {
      "id": "role-uuid-1",
      "code": "learner",
      "name": "Learner",
      "description": "Can access and complete courses",
      "category": "system",
      "isSystem": true,
      "createdAt": "2025-11-01T00:00:00Z",
      "permissions": [
        {
          "id": "perm-uuid-1",
          "code": "courses.read",
          "name": "View Courses",
          "resource": "courses",
          "action": "read"
        }
      ]
    }
  ],
  "customRoles": [
    {
      "id": "custom-role-uuid-1",
      "tenantId": "tenant-uuid-1",
      "roleCode": "course_manager",
      "roleName": "Course Manager",
      "description": "Can create and manage courses for the tenant",
      "category": "custom",
      "isSystem": false,
      "createdAt": "2026-02-25T11:07:28.954Z",
      "updatedAt": "2026-02-25T11:07:28.954Z"
    }
  ],
  "total": 2
}
```

**Error Responses:**

```json
// 403 Forbidden - Not authenticated
{
  "statusCode": 403,
  "message": "Forbidden"
}

// 400 Bad Request - No tenant associated
{
  "statusCode": 400,
  "message": "❌ No tenant associated with your account"
}
```

---

### 2. Create Role in Your Tenant (Convenience Endpoint)

**Endpoint:** `POST /roles/my-tenant`

**Permission Required:** `roles.create`

**Authorization:** Tenant Admin, Org Admin, or Platform Admin

**Description:** Create a custom role in your current tenant. The role code must be unique within the tenant.

**Request:**
```bash
curl -X POST http://localhost:3000/roles/my-tenant \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleCode": "course_manager",
    "roleName": "Course Manager",
    "description": "Can create and manage courses for the tenant"
  }'
```

**Request Body (CreateTenantRoleDto):**
```javascript
{
  roleCode: string;       // Required: unique within tenant (3-50 chars)
  roleName: string;       // Required: human-readable name (3-100 chars)
  description?: string;   // Optional: role description (max 500 chars)
}
```

**Response (201 Created):**
```json
{
  "id": "role-uuid-1",
  "tenantId": "tenant-uuid",
  "roleCode": "course_manager",
  "roleName": "Course Manager",
  "description": "Can create and manage courses for the tenant",
  "category": "custom",
  "isSystem": false,
  "createdAt": "2025-11-25T10:00:00Z",
  "updatedAt": "2025-11-25T10:00:00Z"
}
```

**Error Responses:**

```json
// 400 Bad Request - No tenant associated
{
  "statusCode": 400,
  "message": "❌ No tenant associated with your account"
}

// 403 Forbidden - Not authorized to create roles
{
  "statusCode": 403,
  "message": "❌ Unauthorized: Only tenant admin, org admin, or platform admin can create roles"
}

// 400 Bad Request - Role already exists
{
  "statusCode": 400,
  "message": "Role with code \"course_manager\" already exists in tenant \"My Tenant\""
}
```

---

### 3. Get All Roles in Specific Tenant

**Endpoint:** `GET /roles/tenant/:tenantId`

**Permission Required:** `roles.read`

**Description:** Get all roles (system and custom) for a specific tenant. Platform admins can view any tenant; others can view only their own.

**Request:**
```bash
curl -X GET http://localhost:3000/roles/tenant/tenant-uuid-1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Parameters:**
- `tenantId` (path): UUID of the tenant

**Response (200 OK):**
```json
{
  "systemRoles": [...],
  "customRoles": [...],
  "total": 2
}
```

**Error Responses:**

```json
// 403 Forbidden - Access denied to other tenant
{
  "statusCode": 400,
  "message": "❌ You do not have access to view roles in this tenant"
}

// 404 Not Found - Tenant doesn't exist
{
  "statusCode": 404,
  "message": "Tenant not found"
}
```

---

### 4. Create Role in Specific Tenant

**Endpoint:** `POST /roles/tenant/:tenantId`

**Permission Required:** `roles.create`

**Authorization:** Platform Admin (or Tenant/Org Admin for their own tenant)

**Description:** Create a custom role for a specific tenant.

**Request:**
```bash
curl -X POST http://localhost:3000/roles/tenant/tenant-uuid-1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleCode": "course_manager",
    "roleName": "Course Manager",
    "description": "Can create and manage courses"
  }'
```

**Parameters:**
- `tenantId` (path): UUID of the tenant

**Request Body:** Same as "Create Role in Your Tenant"

**Response (201 Created):** Same as "Create Role in Your Tenant"

**Error Responses:**

```json
// 403 Forbidden - Not authorized for this tenant
{
  "statusCode": 400,
  "message": "❌ Unauthorized: Only tenant admin, org admin, or platform admin can create roles in this tenant"
}

// 404 Not Found - Tenant doesn't exist
{
  "statusCode": 400,
  "message": "Tenant with ID \"invalid-uuid\" not found"
}
```

---

### 5. Get All Global Roles

**Endpoint:** `GET /roles`

**Permission Required:** `roles.read`

**Description:** Get all system-level roles (not tenant-scoped).

**Request:**
```bash
curl -X GET http://localhost:3000/roles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200 OK):**
```json
[
  {
    "id": "role-uuid-1",
    "code": "platform_admin",
    "name": "Platform Administrator",
    "description": "Full platform access",
    "category": "system",
    "isSystem": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  },
  {
    "id": "role-uuid-2",
    "code": "tenant_admin",
    "name": "Tenant Administrator",
    "description": "Tenant-level admin",
    "category": "system",
    "isSystem": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
]
```

---

### 6. Create Global Role (System Level)

**Endpoint:** `POST /roles`

**Permission Required:** `roles.create`

**Description:** Create a system-level role (use with caution, prefer tenant-scoped roles).

**Request:**
```bash
curl -X POST http://localhost:3000/roles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "training_manager",
    "name": "Training Manager",
    "description": "Can manage training programs"
  }'
```

**Request Body:**
```javascript
{
  code: string;            // Role code (unique system-wide)
  name: string;            // Human-readable name
  description?: string;    // Optional description
}
```

**Response (201 Created):**
```json
{
  "id": "role-uuid",
  "code": "training_manager",
  "name": "Training Manager",
  "description": "Can manage training programs",
  "category": "custom",
  "isSystem": false,
  "createdAt": "2025-11-25T10:00:00Z",
  "updatedAt": "2025-11-25T10:00:00Z"
}
```

---

### 7. Assign Permission to Role

**Endpoint:** `POST /roles/assign-permission`

**Permission Required:** `roles.assign-permission`

**Description:** Assign a permission to a role by permission code or ID.

**Request:**
```bash
curl -X POST http://localhost:3000/roles/assign-permission \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleCode": "training_manager",
    "permissionId": "courses.create"
  }'
```

**Request Body:**
```javascript
{
  roleCode: string;           // Role code (e.g., "training_manager")
  permissionId: string;       // Permission code or UUID
                              // Example: "courses.create" or "5deb5f91-9a89-4f8a-a733-1fe947043aed"
}
```

**Response (200 OK):**
```json
{
  "id": "roleperm-uuid",
  "roleId": "role-uuid",
  "permissionId": "permission-uuid",
  "createdAt": "2025-11-25T10:00:00Z"
}
```

**Error Responses:**

```json
// 400 Bad Request - Role not found
{
  "statusCode": 400,
  "message": "Role not found"
}

// 400 Bad Request - Permission not found
{
  "statusCode": 400,
  "message": "Permission 'invalid_code' not found"
}
```

---

### 8. Assign All Permissions in Category to Role

**Endpoint:** `POST /roles/assign-permissions-by-category`

**Permission Required:** `roles.assign-permission`

**Description:** Assign all permissions in a category to a role at once.

**Request:**
```bash
curl -X POST http://localhost:3000/roles/assign-permissions-by-category \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleCode": "training_manager",
    "category": "courses"
  }'
```

**Request Body:**
```javascript
{
  roleCode: string;    // Role code
  category: string;    // Permission category (see categories below)
}
```

**Available Categories:**
- `users` - User management permissions
- `roles` - Role management permissions
- `courses` - Course management permissions
- `modules` - Module management permissions
- `lessons` - Lesson management permissions
- `content` - Content management permissions
- `quizzes` - Quiz management permissions
- `live-class` - Live class permissions
- `licenses` - License management permissions
- `admin` - Admin permissions
- `tenants` - Tenant management permissions
- `permissions` - Permission management permissions
- `reports` - Reporting permissions
- `attendance` - Attendance tracking permissions
- `analytics` - Analytics permissions
- `progress` - Progress tracking permissions

**Response (200 OK):**
```json
{
  "roleCode": "training_manager",
  "category": "courses",
  "assignedCount": 7,
  "permissions": [
    { "code": "courses.create", "name": "Create Course" },
    { "code": "courses.read", "name": "View Courses" },
    { "code": "courses.update", "name": "Update Course" },
    { "code": "courses.delete", "name": "Delete Course" },
    { "code": "courses.publish", "name": "Publish Course" },
    { "code": "courses.assign", "name": "Assign Course" },
    { "code": "courses.export", "name": "Export Course" }
  ]
}
```

---

### 9. Get Permissions for a Role

**Endpoint:** `GET /roles/:roleCode/permissions`

**Permission Required:** `roles.read`

**Description:** Get all permissions assigned to a specific role.

**Request:**
```bash
curl -X GET http://localhost:3000/roles/training_manager/permissions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Parameters:**
- `roleCode` (path): Role code (e.g., "training_manager")

**Response (200 OK):**
```json
[
  {
    "id": "roleperm-uuid-1",
    "role": { ... },
    "roleId": "role-uuid",
    "permission": {
      "id": "perm-uuid-1",
      "code": "courses.create",
      "name": "Create Course",
      "resource": "courses",
      "action": "create",
      "category": "courses"
    },
    "permissionId": "perm-uuid-1"
  }
]
```

---

## Common Workflows

### Workflow 1: Create a New Custom Role for Your Tenant

```bash
# 1. Create the role
curl -X POST http://localhost:3000/roles/my-tenant \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleCode": "course_creator",
    "roleName": "Course Creator",
    "description": "Can create and publish courses"
  }'

# Response contains the created role with ID

# 2. Assign permissions to the role
curl -X POST http://localhost:3000/roles/assign-permissions-by-category \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleCode": "course_creator",
    "category": "courses"
  }'

# 3. Verify the role was created
curl -X GET http://localhost:3000/roles/my-tenant/all \
  -H "Authorization: Bearer TOKEN"
```

### Workflow 2: View All Roles in Your Tenant

```bash
curl -X GET http://localhost:3000/roles/my-tenant/all \
  -H "Authorization: Bearer TOKEN"
```

### Workflow 3: Check Permissions for a Role

```bash
curl -X GET http://localhost:3000/roles/course_creator/permissions \
  -H "Authorization: Bearer TOKEN"
```

### Workflow 4: Create Role with Specific Permissions

```bash
# 1. Create the role
curl -X POST http://localhost:3000/roles/my-tenant \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleCode": "viewer",
    "roleName": "Viewer",
    "description": "Can view content"
  }'

# 2. Assign individual permissions
curl -X POST http://localhost:3000/roles/assign-permission \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleCode": "viewer",
    "permissionId": "courses.read"
  }'

curl -X POST http://localhost:3000/roles/assign-permission \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleCode": "viewer",
    "permissionId": "lessons.read"
  }'
```

---

## HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| `200` | OK | Successful GET or POST (already exists) |
| `201` | Created | Role/permission successfully created |
| `400` | Bad Request | Invalid input, validation failed, or resource not found |
| `403` | Forbidden | User not authenticated or insufficient permissions |
| `404` | Not Found | Resource not found |
| `500` | Server Error | Internal server error |

---

## Error Handling

All error responses follow this format:

```json
{
  "statusCode": <number>,
  "message": "<error message>",
  "error": "<error type>"
}
```

### Common Errors

**Unauthorized:**
```json
{
  "statusCode": 403,
  "message": "Forbidden"
}
```

**Missing Permission:**
```json
{
  "statusCode": 403,
  "message": "❌ Unauthorized: Only tenant admin, org admin, or platform admin can create roles"
}
```

**Invalid Input:**
```json
{
  "statusCode": 400,
  "message": "validation error"
}
```

**Resource Not Found:**
```json
{
  "statusCode": 400,
  "message": "Role not found"
}
```

---

## Requirements

- **JWT Token**: All endpoints require a valid JWT token in the Authorization header
- **Format**: `Authorization: Bearer <jwt_token>`
- **Permissions**: User must have the required permission code assigned to their role

---

## Testing in Postman

1. **Set up environment variables:**
   - `BASE_URL`: http://localhost:3000
   - `TOKEN`: Your JWT token (from login)
   - `TENANT_ID`: Your tenant UUID

2. **Import requests:**

**GET /roles/my-tenant/all**
```
GET {{BASE_URL}}/roles/my-tenant/all
Authorization: Bearer {{TOKEN}}
```

**POST /roles/my-tenant**
```
POST {{BASE_URL}}/roles/my-tenant
Authorization: Bearer {{TOKEN}}
Content-Type: application/json

{
  "roleCode": "course_manager",
  "roleName": "Course Manager",
  "description": "Can manage courses"
}
```

---

## Key Points

✅ **Tenant Isolation**: Users can only manage roles within their own tenant (except platform admins)  
✅ **Role-Based Authorization**: Only authorized users can create roles  
✅ **Unique Role Codes**: Role codes must be unique within their scope (tenant or system)  
✅ **Permission Assignment**: Assign permissions by code or UUID  
✅ **Category Bulk Assignment**: Assign all permissions in a category at once  
✅ **Audit Trail**: All role operations are logged  

---

## Support

For issues or questions:
1. Check error messages for specific guidance
2. Verify user has required permissions
3. Ensure tenant ID is correct
4. Check that role codes are unique within scope

---

**Last Updated:** March 7, 2026  
**Status:** Complete API Documentation
