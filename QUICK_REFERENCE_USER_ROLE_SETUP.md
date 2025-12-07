# ⚡ Quick Reference: User, Role & Permission Setup

## 5-Minute Setup Checklist

### ✅ Phase 1: Bootstrap (2 minutes)

- [ ] Register with @secnuo.com or @ironclad.com email (auto gets platform_admin)
- [ ] Login and save the access_token
- [ ] Create a tenant: `POST /api/tenants`

### ✅ Phase 2: Create Tenant Admin (1 minute)

- [ ] Create tenant admin via: `POST /api/admin/tenants/{tenantId}/create-admin`
- [ ] Login as tenant admin and save token

### ✅ Phase 3: Create Users (1 minute)

- [ ] Create users via: `POST /api/users` (use tenant admin token)
- [ ] Or bulk upload via: `POST /api/users/bulk-upload`

### ✅ Phase 4: Setup Permissions (1 minute)

- [ ] View all permissions: `GET /api/admin/permissions/predefined`
- [ ] Create custom roles: `POST /api/roles`
- [ ] Assign permissions to roles: `POST /api/roles/assign-permission`
- [ ] Assign roles to users: `POST /api/roles/assign-role`

---

## Command Cheat Sheet

### Get Platform Admin Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@secnuo.com", "password": "SecNuoAdmin123!"}'
```

### Create Tenant

```bash
curl -X POST http://localhost:3000/api/tenants \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Tenant", "code": "my-tenant"}'
```

### Create Tenant Admin

```bash
curl -X POST http://localhost:3000/api/admin/tenants/$TENANT_ID/create-admin \
  -H "Authorization: Bearer $PLATFORM_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mytenant.com",
    "displayName": "Tenant Admin",
    "password": "AdminPass123!"
  }'
```

### Create User

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer $TENANT_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@mytenant.com",
    "displayName": "User Name",
    "password": "UserPass123!",
    "tenantName": "My Tenant",
    "roles": ["learner"]
  }'
```

### Get All Permissions

```bash
curl -X GET http://localhost:3000/api/admin/permissions/predefined \
  -H "Authorization: Bearer $PLATFORM_TOKEN"
```

### Create Role

```bash
curl -X POST http://localhost:3000/api/roles \
  -H "Authorization: Bearer $PLATFORM_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "my_role",
    "name": "My Role",
    "description": "Role description"
  }'
```

### Assign Permission to Role

```bash
curl -X POST http://localhost:3000/api/roles/assign-permission \
  -H "Authorization: Bearer $PLATFORM_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleCode": "my_role",
    "permissionCode": "courses.create"
  }'
```

### Assign Role to User

```bash
curl -X POST http://localhost:3000/api/roles/assign-role \
  -H "Authorization: Bearer $TENANT_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "$USER_ID",
    "roleCode": "my_role",
    "tenantId": "$TENANT_ID"
  }'
```

---

## Permission Reference

### 15 Core Permissions

#### Users (4)

- `users.read` - View users
- `users.create` - Create user
- `users.update` - Update user
- `users.delete` - Delete user

#### Courses (4)

- `courses.read` - View courses
- `courses.create` - Create course
- `courses.update` - Update course
- `courses.delete` - Delete course

#### Roles (4)

- `roles.read` - View roles
- `roles.create` - Create role
- `roles.update` - Update role
- `roles.delete` - Delete role

#### Admin (3)

- `admin.read` - Read admin data
- `admin.create` - Create admin resources
- `admin.manage` - Manage system

---

## System Roles

### Platform Admin

- **Email**: @secnuo.com or @ironclad.com
- **Permissions**: All 15 permissions
- **Scope**: Platform-wide
- **Auto-assigned**: Yes (on registration)

### Tenant Admin

- **Assigned by**: Platform Admin
- **Permissions**: 12 (all except admin.\*)
- **Scope**: Single tenant
- **Auto-assigned**: No (via `create-admin` endpoint)

### Trainer

- **Assigned by**: Tenant Admin
- **Permissions**: 5 (read + basic management)
- **Scope**: Tenant
- **Default role**: Yes (assigned to new users)

### Custom Roles

- **Created by**: Platform Admin
- **Permissions**: Assign any subset of 15 core permissions
- **Scope**: Tenant or Platform
- **Examples**: Content Manager, Course Creator, Evaluator

---

## Role Assignment Workflows

### Workflow 1: Platform Admin → Tenant Admin

```
Platform Admin
    ↓
creates Tenant
    ↓
creates Tenant Admin via /admin/tenants/{id}/create-admin
    ↓
Tenant Admin user has: platform_admin role + tenant_admin role
```

### Workflow 2: Tenant Admin → Regular User

```
Tenant Admin (via POST /api/users)
    ↓
creates User in tenant
    ↓
assigns role (learner, trainer, or custom)
    ↓
User has: tenant-specific roles only
```

### Workflow 3: Platform Admin → Custom Role

```
Platform Admin
    ↓
creates Role (POST /api/roles)
    ↓
assigns Permissions (POST /api/roles/assign-permission)
    ↓
Tenant Admin assigns Role to User (POST /api/roles/assign-role)
```

---

## Common Tasks

### Task: Give User Permission to Create Courses

```bash
# 1. Create custom role (as platform admin)
curl -X POST http://localhost:3000/api/roles \
  -H "Authorization: Bearer $PLATFORM_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "course_author",
    "name": "Course Author",
    "description": "Can create and manage courses"
  }'

# 2. Assign permissions to role
for permission in "courses.read" "courses.create" "courses.update"; do
  curl -X POST http://localhost:3000/api/roles/assign-permission \
    -H "Authorization: Bearer $PLATFORM_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"roleCode\": \"course_author\", \"permissionCode\": \"$permission\"}"
done

# 3. Assign role to user (as tenant admin)
curl -X POST http://localhost:3000/api/roles/assign-role \
  -H "Authorization: Bearer $TENANT_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "$USER_ID",
    "roleCode": "course_author",
    "tenantId": "$TENANT_ID"
  }'
```

### Task: Remove User Permission

```bash
# Currently: Reassign user to a different role with fewer permissions
# Future: Add /api/roles/revoke-permission endpoint

# Workaround: Create new role without permission and assign it
```

### Task: View What a User Can Do

```bash
# 1. Get user's roles
curl -X GET http://localhost:3000/api/users/$USER_ID \
  -H "Authorization: Bearer $TOKEN"

# 2. For each role, get permissions
curl -X GET http://localhost:3000/api/roles/$ROLE_CODE/permissions \
  -H "Authorization: Bearer $TOKEN"
```

### Task: Audit User Permissions

```bash
# Get all users with their roles (admin endpoint)
curl -X GET http://localhost:3000/api/admin/users/all-organized \
  -H "Authorization: Bearer $PLATFORM_ADMIN_TOKEN"

# Get all roles with their permissions
curl -X GET http://localhost:3000/api/roles \
  -H "Authorization: Bearer $TOKEN"

# For each role, get permissions
curl -X GET http://localhost:3000/api/roles/$ROLE_CODE/permissions \
  -H "Authorization: Bearer $PLATFORM_ADMIN_TOKEN"
```

---

## Troubleshooting Quick Guide

| Problem                 | Solution                                         |
| ----------------------- | ------------------------------------------------ |
| 403 Forbidden           | User missing permission - check role permissions |
| 401 Unauthorized        | Token expired - get new token via login          |
| Role not found          | Create role or check role code spelling          |
| User already exists     | Use different email or update existing user      |
| Tenant not found        | Create tenant or check tenant name spelling      |
| Permission not assigned | Use `/api/roles/assign-permission` endpoint      |
| User not in tenant      | Create user with tenant name or assign manually  |

---

## Environment Variables

```bash
# API Base URL
API_BASE_URL=http://localhost:3000

# Platform Admin Credentials (default seed users)
PLATFORM_ADMIN_EMAIL=admin@secnuo.com
PLATFORM_ADMIN_PASSWORD=SecNuoAdmin123!

# Or
PLATFORM_ADMIN_EMAIL=admin@ironclad.com
PLATFORM_ADMIN_PASSWORD=IroncladAdmin123!
```

---

**Pro Tip**: Save your tokens in shell variables for easy use:

```bash
export PLATFORM_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@secnuo.com","password":"SecNuoAdmin123!"}' | jq -r '.access_token')

export TENANT_ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mytenant.com","password":"AdminPass123!"}' | jq -r '.access_token')

# Now use: -H "Authorization: Bearer $PLATFORM_TOKEN"
```
