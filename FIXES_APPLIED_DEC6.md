# Fixed Issues - December 6, 2025

## 1. ✅ FIXED: Duplicate Permission Code Error

### Problem

When creating a permission with a code that already exists in the database, the endpoint returned:

```
Unique constraint failed on the fields: (`code`)
Error Code: P2002
```

### Solution

Updated `src/roles/roles.service.ts` - `createPermission()` method:

- Now checks if permission code already exists before attempting creation
- Returns `BadRequestException` with clear error message if duplicate found
- Prevents crashes and provides better user feedback

### Code Change

```typescript
async createPermission(code: string, name: string, resource: string, action: string, category: string) {
  // Check if permission already exists
  const existing = await this.prisma.permission.findUnique({
    where: { code }
  });

  if (existing) {
    throw new BadRequestException(`Permission with code '${code}' already exists`);
  }

  return this.prisma.permission.create({
    data: {
      code,
      name,
      resource,
      action,
      category,
      description: `${resource}.${action}`,
      isSystemDefined: false
    }
  });
}
```

---

## 2. ✅ ADDED: Permission-Based Access Control to All Role Endpoints

### Problem

Endpoints had JWT authentication but lacked granular permission checks. Any authenticated user could create/modify roles and permissions.

### Solution

Added permission guards to all endpoints in `src/roles/roles.controller.ts`:

**Imports Added:**

```typescript
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
```

**Endpoints Protected:**

1. **POST /api/roles** - Requires `roles.create`
2. **GET /api/roles** - Requires `roles.read`
3. **POST /api/roles/permission** - Requires `permissions.create`
4. **POST /api/roles/assign-permission** - Requires `roles.assign-permission`
5. **POST /api/roles/assign-permissions-by-category** - Requires `roles.assign-permission`
6. **GET /api/roles/:roleCode/permissions** - Requires `roles.read`

**Example:**

```typescript
@UseGuards(JwtAuthGuard, PermissionGuard)
@RequirePermission('roles.create')
@Post()
@ApiOperation({ summary: 'Create a new role (requires roles.create permission)' })
createRole(@Body() dto: CreateRoleDto) {
  return this.svc.createRole(dto.code, dto.name, dto.description);
}
```

### How It Works

```
User Request with JWT Token
         ↓
JwtAuthGuard validates token & extracts user
         ↓
PermissionGuard checks @RequirePermission decorator
         ↓
If user is 'platform_admin' → ✅ BYPASS (has all perms)
Else → Query RolePermission table
         ↓
If user's roles linked to required permission → ✅ ALLOW
Else → ❌ FORBIDDEN (403)
```

---

## 3. ✅ ACCESS CONTROL MATRIX

### Who Can Do What?

| Action                | platform_admin | tenant_admin | trainer | instructor | learner |
| --------------------- | :------------: | :----------: | :-----: | :--------: | :-----: |
| Create role           |       ✅       |      ❌      |   ❌    |     ❌     |   ❌    |
| View roles            |       ✅       |      ✅      |   ✅    |     ✅     |   ✅    |
| Create permission     |       ✅       |      ❌      |   ❌    |     ❌     |   ❌    |
| Assign permissions    |       ✅       |      ✅      |   ❌    |     ❌     |   ❌    |
| Assign by category    |       ✅       |      ✅      |   ❌    |     ❌     |   ❌    |
| View role permissions |       ✅       |      ✅      |   ✅    |     ✅     |   ✅    |

---

## 4. ✅ FILES MODIFIED

1. **src/roles/roles.service.ts**
   - Updated `createPermission()` to check for duplicates

2. **src/roles/roles.controller.ts**
   - Added imports for PermissionGuard and RequirePermission
   - Applied guards and decorators to all 6 endpoints
   - Updated Swagger documentation

3. **NEW: RBAC_ENDPOINT_ACCESS_CONTROL.md**
   - Comprehensive guide on permission-based access
   - Examples and error handling
   - Testing scripts

---

## 5. ✅ TESTING

### Test Creating Duplicate Permission (Should Fail)

```bash
curl -X POST http://localhost:3000/api/roles/permission \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "courses.create",
    "name": "Create Course",
    "resource": "courses",
    "action": "create",
    "category": "courses"
  }'
```

**Expected Response (400 Bad Request):**

```json
{
  "statusCode": 400,
  "message": "Permission with code 'courses.create' already exists",
  "error": "Bad Request"
}
```

### Test Unauthorized Access (Should Fail)

```bash
# Trainer token trying to create permission (requires permissions.create)
curl -X POST http://localhost:3000/api/roles/permission \
  -H "Authorization: Bearer <trainer_token>" \
  -H "Content-Type: application/json" \
  -d '{"code": "test", ...}'
```

**Expected Response (403 Forbidden):**

```json
{
  "statusCode": 403,
  "message": "User does not have permission: permissions.create",
  "error": "Forbidden"
}
```

### Test Authorized Access (Should Succeed)

```bash
# Platform admin token
curl -X POST http://localhost:3000/api/roles/permission \
  -H "Authorization: Bearer <platform_admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"code": "test.read", ...}'
```

**Expected Response (201 Created):**

```json
{
  "id": "uuid",
  "code": "test.read",
  "name": "Test Read",
  "resource": "test",
  "action": "read",
  "category": "Custom",
  ...
}
```

---

## 6. ✅ PERMISSION GUARD LOGIC

The `PermissionGuard` in `src/common/guards/permission.guard.ts`:

1. **Checks @RequirePermission decorator** on the endpoint
2. **Extracts user from JWT token** → Gets id, roles, tenantId
3. **Platform Admin Bypass:**
   - If user.roles includes 'platform_admin' → Allow (skip checks)
4. **Regular User Check:**
   - For each required permission, checks RolePermission table
   - Query: `WHERE roleId IN (user's role IDs) AND permissionId = required`
   - If ANY role has permission → Allow
   - Otherwise → Forbidden (403)

---

## 7. ✅ NEXT STEPS (OPTIONAL)

- Apply same permission guards to other controllers (courses, users, tenants, etc.)
- Create endpoint permission matrix documentation
- Add audit logging for permission-denied attempts
- Implement role-specific response filtering
- Add permission requirements to Swagger/API docs
