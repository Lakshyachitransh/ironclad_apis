# Role-Based Access Control (RBAC) - Endpoint Permissions

## Overview

All endpoints now require specific permissions. Users must have the required permission through their assigned roles to access each endpoint.

## Roles Controller Endpoints

### 1. Create Role

- **Endpoint:** `POST /api/roles`
- **Required Permission:** `roles.create`
- **Description:** Create a new role
- **Who Can Access:** Users with `roles.create` permission (typically tenant_admin, platform_admin)

### 2. List Roles

- **Endpoint:** `GET /api/roles`
- **Required Permission:** `roles.read`
- **Description:** List all available roles
- **Who Can Access:** Users with `roles.read` permission (all authenticated users typically)

### 3. Create Permission

- **Endpoint:** `POST /api/roles/permission`
- **Required Permission:** `permissions.create`
- **Description:** Create a new custom permission
- **Who Can Access:** Users with `permissions.create` permission (typically platform_admin)
- **Error Handling:** Now throws `BadRequestException` if permission code already exists

### 4. Assign Permission to Role

- **Endpoint:** `POST /api/roles/assign-permission`
- **Required Permission:** `roles.assign-permission`
- **Description:** Assign a specific permission to a role
- **Request Body:**

```json
{
  "roleCode": "trainer",
  "permissionId": "courses.create" // Can use code or UUID
}
```

- **Who Can Access:** Users with `roles.assign-permission` permission (typically platform_admin)

### 5. Assign Permissions by Category

- **Endpoint:** `POST /api/roles/assign-permissions-by-category`
- **Required Permission:** `roles.assign-permission`
- **Description:** Assign all permissions of a specific category to a role
- **Request Body:**

```json
{
  "roleCode": "trainer",
  "category": "courses"
}
```

- **Available Categories:**
  - admin, analytics, attendance, content, courses, lessons, licenses, live-class
  - modules, permissions, progress, quizzes, reports, roles, tenants, users
- **Who Can Access:** Users with `roles.assign-permission` permission

### 6. Get Role Permissions

- **Endpoint:** `GET /api/roles/:roleCode/permissions`
- **Required Permission:** `roles.read`
- **Description:** Get all permissions assigned to a specific role
- **Who Can Access:** Users with `roles.read` permission

## Permission Check Flow

1. **User sends request with JWT token**
2. **JwtAuthGuard validates token** → Extracts user info (id, roles, tenantId)
3. **PermissionGuard checks required permission:**
   - If user is `platform_admin` → ✅ Allow (bypass all checks)
   - Otherwise → Check if user's roles have the required permission
4. **If permission found in RolePermission table** → ✅ Allow access
5. **If permission NOT found** → ❌ Return 403 Forbidden

## Example: Assigning Permissions to a Trainer

### Step 1: Trainer wants to assign courses permissions to a trainer role

```bash
curl -X POST http://localhost:3000/api/roles/assign-permissions-by-category \
  -H "Authorization: Bearer <trainer_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "roleCode": "trainer",
    "category": "courses"
  }'
```

**What happens:**

1. Token is validated → Gets trainer user info
2. PermissionGuard checks if trainer has `roles.assign-permission`
3. If NO → Returns 403 Forbidden ❌
4. If YES → Assigns all 7 courses permissions to trainer role ✅

## Error Examples

### Missing Permission

```json
{
  "statusCode": 403,
  "message": "User does not have permission: roles.assign-permission",
  "error": "Forbidden"
}
```

### Duplicate Permission Code

```json
{
  "statusCode": 400,
  "message": "Permission with code 'courses.create' already exists",
  "error": "Bad Request"
}
```

### Missing Tenant (Platform Admin Only)

```json
{
  "statusCode": 403,
  "message": "User does not belong to any tenant",
  "error": "Forbidden"
}
```

## Permission Requirements by Role

| Endpoint             | platform_admin | tenant_admin | trainer | instructor | learner |
| -------------------- | :------------: | :----------: | :-----: | :--------: | :-----: |
| Create Role          |       ✅       |      ❌      |   ❌    |     ❌     |   ❌    |
| List Roles           |       ✅       |      ✅      |   ✅    |     ✅     |   ✅    |
| Create Permission    |       ✅       |      ❌      |   ❌    |     ❌     |   ❌    |
| Assign Permission    |       ✅       |      ✅      |   ❌    |     ❌     |   ❌    |
| Assign by Category   |       ✅       |      ✅      |   ❌    |     ❌     |   ❌    |
| Get Role Permissions |       ✅       |      ✅      |   ✅    |     ✅     |   ✅    |

## Implementation Details

### Guards Applied

- **JwtAuthGuard** - Validates JWT token and extracts user info
- **PermissionGuard** - Checks RolePermission table for access

### Decorator Used

```typescript
@RequirePermission('roles.create')  // Specify required permission
```

### Flow in Permission Guard

```
User has roles: ['trainer', 'content_manager']
                        ↓
Check if role has permission in RolePermission table
                        ↓
Query: RolePermission where roleId IN (trainer.id, content_manager.id)
              AND permissionId = courses.create.id
                        ↓
If found → ✅ Allow | If not found → ❌ Deny
```

## Testing

### PowerShell Script to Test Permissions

```powershell
$token = "<platform_admin_token>"
$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type" = "application/json"
}

# This should succeed (platform_admin has roles.assign-permission)
$body = @{
  roleCode = "trainer"
  category = "courses"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3000/api/roles/assign-permissions-by-category" `
  -Method POST -Headers $headers -Body $body

$response.Content | ConvertFrom-Json
```

## Summary

✅ **Fixed Error:** `createPermission` now handles duplicate codes gracefully
✅ **Added Permission Checks:** All role/permission endpoints now require specific permissions
✅ **User Protection:** Users can only access endpoints they have permission for
✅ **Role-Based Access:** Permissions are checked against user's roles in RolePermission table
✅ **Platform Admin Bypass:** platform_admin role bypasses all permission checks
