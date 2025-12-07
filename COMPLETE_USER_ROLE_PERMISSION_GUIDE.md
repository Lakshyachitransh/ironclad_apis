# 🔐 Complete End-to-End Guide: Users, Roles & Permissions

## Table of Contents

1. [Overview](#overview)
2. [Step 1: Create a Tenant (if needed)](#step-1-create-a-tenant)
3. [Step 2: Create Users in a Tenant](#step-2-create-users-in-a-tenant)
4. [Step 3: Create Roles](#step-3-create-roles)
5. [Step 4: Assign Permissions to Roles](#step-4-assign-permissions-to-roles)
6. [Step 5: Assign Roles to Users](#step-5-assign-roles-to-users)
7. [Available Permissions](#available-permissions)
8. [Complete Examples](#complete-examples)

---

## Overview

The system uses a **permission-based authorization model** with:

- **15 Core Permissions**: Organized by resource (users, courses, roles, admin)
- **3 System Roles**: platform_admin, tenant_admin, trainer
- **Custom Roles**: Can be created and assigned custom permissions
- **Platform Admin Bypass**: Users with @secnuo/@ironclad emails get automatic platform_admin role

### Authorization Flow

```
User registers → Checks email domain → Assigns platform_admin role
                                    ↓
                            OR assigns to tenant
                                    ↓
User logs in → Gets platform/tenant roles → Can access endpoints based on permissions
```

---

## Step 1: Create a Tenant

### Prerequisites

- You need a **platform_admin** token (register with @secnuo or @ironclad email)

### Create Tenant Endpoint

```bash
curl -X POST http://localhost:3000/api/tenants \
  -H "Authorization: Bearer YOUR_PLATFORM_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corporation",
    "code": "acme-corp",
    "description": "Our training platform tenant"
  }'
```

### Response

```json
{
  "success": true,
  "tenant": {
    "id": "tenant-123",
    "name": "Acme Corporation",
    "code": "acme-corp",
    "description": "Our training platform tenant",
    "createdAt": "2025-12-05T08:00:00Z"
  }
}
```

---

## Step 2: Create Users in a Tenant

### Prerequisites

- Tenant ID (from Step 1)
- **Tenant Admin token** OR **Platform Admin token**

### Create Single User Endpoint

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_TENANT_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@acmecorp.com",
    "displayName": "John Doe",
    "password": "SecurePassword123!",
    "tenantName": "Acme Corporation",
    "roles": ["learner"]
  }'
```

### Response

```json
{
  "id": "user-456",
  "email": "john.doe@acmecorp.com",
  "displayName": "John Doe",
  "status": "active",
  "createdAt": "2025-12-05T08:15:00Z",
  "tenantName": "Acme Corporation",
  "roles": ["learner"],
  "userTenantId": "ut-789"
}
```

### Bulk Create Users (CSV)

```bash
# Create a CSV file: users.csv
# email,displayName,password,roles
# jane.smith@acmecorp.com,Jane Smith,SecurePass123!,trainer
# mike.johnson@acmecorp.com,Mike Johnson,SecurePass123!,learner|trainer

curl -X POST http://localhost:3000/api/users/bulk-upload \
  -H "Authorization: Bearer YOUR_TENANT_ADMIN_TOKEN" \
  -F "csv=@users.csv" \
  -F "tenantName=Acme Corporation"
```

---

## Step 3: Create Roles

### Available System Roles

The system comes with 3 pre-defined roles:

- **platform_admin** - Full system access (all 15 permissions)
- **tenant_admin** - Manage entire tenant (12 permissions)
- **trainer** - Create and manage courses (5 permissions)

### Create Custom Role Endpoint

```bash
curl -X POST http://localhost:3000/api/roles \
  -H "Authorization: Bearer YOUR_PLATFORM_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "course_creator",
    "name": "Course Creator",
    "description": "Can create and manage courses"
  }'
```

### Response

```json
{
  "code": "course_creator",
  "name": "Course Creator",
  "description": "Can create and manage courses"
}
```

---

## Step 4: Assign Permissions to Roles

### Get All Available Permissions

```bash
curl -X GET http://localhost:3000/api/admin/permissions/predefined \
  -H "Authorization: Bearer YOUR_PLATFORM_ADMIN_TOKEN"
```

**Response:**

```json
{
  "success": true,
  "totalPermissions": 15,
  "permissionsByCategory": {
    "users": [
      {
        "id": "...",
        "code": "users.read",
        "name": "Read users",
        "category": "users"
      },
      {
        "id": "...",
        "code": "users.create",
        "name": "Create user",
        "category": "users"
      },
      {
        "id": "...",
        "code": "users.update",
        "name": "Update user",
        "category": "users"
      },
      {
        "id": "...",
        "code": "users.delete",
        "name": "Delete user",
        "category": "users"
      }
    ],
    "courses": [
      { "id": "...", "code": "courses.read", "name": "Read courses" },
      { "id": "...", "code": "courses.create", "name": "Create course" },
      { "id": "...", "code": "courses.update", "name": "Update course" },
      { "id": "...", "code": "courses.delete", "name": "Delete course" }
    ],
    "roles": [
      { "id": "...", "code": "roles.read", "name": "Read roles" },
      { "id": "...", "code": "roles.create", "name": "Create role" },
      { "id": "...", "code": "roles.update", "name": "Update role" },
      { "id": "...", "code": "roles.delete", "name": "Delete role" }
    ],
    "admin": [
      { "id": "...", "code": "admin.read", "name": "Read admin data" },
      { "id": "...", "code": "admin.create", "name": "Create admin data" },
      { "id": "...", "code": "admin.manage", "name": "Manage system" }
    ]
  }
}
```

### Assign Permission to Role

```bash
curl -X POST http://localhost:3000/api/roles/assign-permission \
  -H "Authorization: Bearer YOUR_PLATFORM_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleCode": "course_creator",
    "permissionCode": "courses.create"
  }'
```

### Assign Multiple Permissions

```bash
# Call the endpoint multiple times or create a script:

ROLE_CODE="course_creator"
PERMISSIONS=("courses.read" "courses.create" "courses.update")

for permission in "${PERMISSIONS[@]}"; do
  curl -X POST http://localhost:3000/api/roles/assign-permission \
    -H "Authorization: Bearer YOUR_PLATFORM_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"roleCode\": \"$ROLE_CODE\", \"permissionCode\": \"$permission\"}"
done
```

### View Permissions for a Role

```bash
curl -X GET http://localhost:3000/api/roles/course_creator/permissions \
  -H "Authorization: Bearer YOUR_PLATFORM_ADMIN_TOKEN"
```

**Response:**

```json
{
  "code": "course_creator",
  "name": "Course Creator",
  "permissions": [
    { "code": "courses.read", "name": "Read courses" },
    { "code": "courses.create", "name": "Create course" },
    { "code": "courses.update", "name": "Update course" }
  ]
}
```

---

## Step 5: Assign Roles to Users

### Assign Role to User Endpoint

```bash
curl -X POST http://localhost:3000/api/roles/assign-role \
  -H "Authorization: Bearer YOUR_TENANT_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-456",
    "roleCode": "course_creator",
    "tenantId": "tenant-123"
  }'
```

### Response

```json
{
  "success": true,
  "message": "Role assigned successfully",
  "user": {
    "id": "user-456",
    "email": "john.doe@acmecorp.com",
    "roles": ["learner", "course_creator"]
  }
}
```

---

## Available Permissions

### Users Category (4 permissions)

```
users.read      - View users in tenant
users.create    - Create new users
users.update    - Update user information
users.delete    - Delete users
```

### Courses Category (4 permissions)

```
courses.read    - View courses
courses.create  - Create new courses
courses.update  - Update course details
courses.delete  - Delete courses
```

### Roles Category (4 permissions)

```
roles.read      - View available roles
roles.create    - Create new roles
roles.update    - Update role details
roles.delete    - Delete roles
```

### Admin Category (3 permissions)

```
admin.read      - Read admin data
admin.create    - Create admin resources
admin.manage    - Manage system configuration
```

---

## Complete Examples

### Example 1: Setup New Training Manager for a Tenant

**Goal**: Create a user with "Training Manager" role that can manage courses

```bash
# 1. Get Platform Admin Token
PLATFORM_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@secnuo.com",
    "password": "SecNuoAdmin123!"
  }' | jq -r '.access_token')

# 2. Create Tenant
TENANT=$(curl -s -X POST http://localhost:3000/api/tenants \
  -H "Authorization: Bearer $PLATFORM_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech Academy",
    "code": "tech-academy"
  }')
TENANT_ID=$(echo $TENANT | jq -r '.tenant.id')

# 3. Create Tenant Admin
TENANT_ADMIN=$(curl -s -X POST http://localhost:3000/api/admin/tenants/$TENANT_ID/create-admin \
  -H "Authorization: Bearer $PLATFORM_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@techacademy.com",
    "displayName": "Tech Academy Admin",
    "password": "AdminPass123!"
  }')
TENANT_ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@techacademy.com",
    "password": "AdminPass123!"
  }' | jq -r '.access_token')

# 4. Create Training Manager User
USER=$(curl -s -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer $TENANT_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "trainer@techacademy.com",
    "displayName": "John Trainer",
    "password": "TrainerPass123!",
    "tenantName": "Tech Academy",
    "roles": ["trainer"]
  }')
USER_ID=$(echo $USER | jq -r '.id')

# 5. (Optional) Assign additional custom role
curl -X POST http://localhost:3000/api/roles/assign-role \
  -H "Authorization: Bearer $TENANT_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"roleCode\": \"trainer\",
    \"tenantId\": \"$TENANT_ID\"
  }"

echo "✅ Training Manager Setup Complete!"
echo "Email: trainer@techacademy.com"
echo "Password: TrainerPass123!"
```

### Example 2: Create Custom "Content Manager" Role

**Goal**: Create a role that can read and update courses (but not create/delete)

```bash
# 1. Create the custom role
curl -X POST http://localhost:3000/api/roles \
  -H "Authorization: Bearer YOUR_PLATFORM_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "content_manager",
    "name": "Content Manager",
    "description": "Can read and update course content"
  }'

# 2. Assign permissions to the role
for permission in "courses.read" "courses.update"; do
  curl -X POST http://localhost:3000/api/roles/assign-permission \
    -H "Authorization: Bearer YOUR_PLATFORM_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"roleCode\": \"content_manager\",
      \"permissionCode\": \"$permission\"
    }"
done

# 3. Assign role to a user
curl -X POST http://localhost:3000/api/roles/assign-role \
  -H "Authorization: Bearer YOUR_TENANT_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id-here",
    "roleCode": "content_manager",
    "tenantId": "tenant-id-here"
  }'

echo "✅ Content Manager Role Created and Assigned!"
```

### Example 3: Bulk Create Users with Different Roles

**Goal**: Create 10 users with different roles in bulk

```bash
# 1. Create users.csv
cat > users.csv << 'EOF'
email,displayName,password,roles
student1@academy.com,Student 1,Pass123!,learner
student2@academy.com,Student 2,Pass123!,learner
trainer1@academy.com,Trainer 1,Pass123!,trainer
trainer2@academy.com,Trainer 2,Pass123!,trainer
admin@academy.com,Admin User,Pass123!,tenant_admin
EOF

# 2. Upload CSV
curl -X POST http://localhost:3000/api/users/bulk-upload \
  -H "Authorization: Bearer YOUR_TENANT_ADMIN_TOKEN" \
  -F "csv=@users.csv" \
  -F "tenantName=Your Tenant Name"

echo "✅ Bulk users created from CSV!"
```

---

## Authorization & Access Control

### How Permissions Work

1. **User Registration**
   - If email ends with @secnuo/@ironclad → platform_admin role
   - Otherwise → no platform role

2. **User in Tenant**
   - Assigned tenant-specific roles (learner, trainer, tenant_admin, or custom)
   - Each role has specific permissions

3. **API Access**
   - Endpoint checks `@RequirePermission('resource.action')`
   - If user has platform_admin → auto-approved (bypass all checks)
   - Otherwise → check RolePermission table
   - User must have at least one role with the required permission

### Example Authorization Flow

```
User: john@example.com
Assigned role in tenant: trainer
Trainer role has permissions: [courses.read, courses.create, courses.update]

Request: POST /api/courses (needs courses.create)
✅ ALLOWED - User has courses.create permission via trainer role

Request: DELETE /api/courses/123 (needs courses.delete)
❌ DENIED - User doesn't have courses.delete permission
```

---

## Troubleshooting

### User Can't Access Endpoint

**Problem**: User gets 403 Forbidden
**Solution**:

1. Check user roles: GET /api/users/{userId}
2. Check role permissions: GET /api/roles/{roleCode}/permissions
3. Verify endpoint permission requirement
4. Assign missing permission to role

### Role Not Found

**Problem**: "Role code not found" error
**Solution**:

1. List available roles: GET /api/roles
2. Create role if needed: POST /api/roles
3. Assign permissions: POST /api/roles/assign-permission

### User Already Exists

**Problem**: "User with this email already exists"
**Solution**:

1. Use different email for new user
2. Or update existing user instead

---

## API Quick Reference

| Action               | Endpoint                                  | Method | Auth Required  |
| -------------------- | ----------------------------------------- | ------ | -------------- |
| Create Tenant        | POST /api/tenants                         | POST   | platform_admin |
| List Tenants         | GET /api/tenants                          | GET    | authenticated  |
| Create User          | POST /api/users                           | POST   | tenant_admin   |
| List Users           | GET /api/users                            | GET    | authenticated  |
| Create Role          | POST /api/roles                           | POST   | platform_admin |
| List Roles           | GET /api/roles                            | GET    | authenticated  |
| Assign Permission    | POST /api/roles/assign-permission         | POST   | platform_admin |
| Get Role Permissions | GET /api/roles/{code}/permissions         | GET    | authenticated  |
| Assign Role to User  | POST /api/roles/assign-role               | POST   | tenant_admin   |
| Get Permissions      | GET /api/admin/permissions/predefined     | GET    | platform_admin |
| Create Tenant Admin  | POST /api/admin/tenants/{id}/create-admin | POST   | platform_admin |

---

## Next Steps

1. ✅ Register with @secnuo/@ironclad email to get platform_admin
2. ✅ Create a tenant for your organization
3. ✅ Create a tenant_admin user
4. ✅ Create users in the tenant
5. ✅ Create custom roles with specific permissions
6. ✅ Assign roles to users
7. ✅ Start using the API with proper authorization!

---

**Last Updated**: December 5, 2025
**API Version**: 1.0
**Authorization Model**: Permission-Based (RolePermission table)
