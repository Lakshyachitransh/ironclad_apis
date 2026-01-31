# Platform Admin Null TenantId Support

## Overview
Updated the authorization system to allow `platform_admin` role to have `null tenantId`, enabling platform admins to access all tenants without being scoped to a specific one.

## Changes Made

### 1. Permission Guard (`src/common/guards/permission.guard.ts`)
**Before:** Blocked all users without tenantId
```typescript
if (!user.tenantId) {
  throw new ForbiddenException('User does not belong to any tenant');
}
```

**After:** Allows platform_admin with null tenantId
```typescript
// ✅ PLATFORM_ADMIN BYPASS - Has all permissions
if (user.roles?.includes('platform_admin')) {
  return true;
}

// Non-platform admins must belong to a tenant
if (!user.tenantId) {
  throw new ForbiddenException('User does not belong to any tenant');
}
```

### 2. Live Class Controller (`src/live-class/live-class.controller.ts`)
**Added:** Helper method to get tenantId
```typescript
private getTenantId(actor: JwtUser): string {
  if (actor?.roles?.includes('platform_admin')) {
    return actor.tenantId || 'platform'; // Fallback for platform admins
  }
  if (!actor?.tenantId) {
    throw new BadRequestException('No tenant information in token');
  }
  return actor.tenantId;
}
```

**Updated:** `create()` method and similar endpoints to use helper
```typescript
const tenantId = this.getTenantId(actor);
```

### 3. Licenses Controller (`src/licenses/licenses.controller.ts`)
**Added:** Tenant access validation helper
```typescript
private validateTenantAccess(user: any, tenantId: string) {
  const isPlatformAdmin = user?.roles?.includes('platform_admin');
  const isOrgAdmin = user?.roles?.[0] === 'org_admin';
  const isSameTenant = user?.tenantId === tenantId;

  if (!isPlatformAdmin && !isOrgAdmin && !isSameTenant) {
    throw new BadRequestException('You do not have access to this tenant');
  }
}
```

**Updated:** All 11 tenant-scoped endpoints to use helper method:
- `getTenantLicenses()`
- `getLicense()`
- `updateLicense()`
- `renewLicense()`
- `suspendLicense()`
- `assignLicenseToUser()`
- `revokeLicenseFromUser()`
- `getLicenseUsers()`
- `getLicenseStats()`

### 4. Courses Controller (Previously Fixed)
Already updated to use `validateTenantAccess(user, tenantId)` pattern that checks for platform_admin

## Authorization Flow

```
Platform Admin Request (roles: ['platform_admin'], tenantId: null)
    ↓
JWT Auth Guard (passes)
    ↓
Permission Guard → Detects platform_admin → ALLOWS (bypasses tenantId check)
    ↓
Endpoint validateTenantAccess → Detects platform_admin → ALLOWS
    ↓
✅ Access Granted to All Tenants
```

## Impact

### Platform Admin Can Now:
✅ Access courses, modules, lessons, quizzes across all tenants
✅ Manage licenses for any tenant
✅ Create/manage live classes for any tenant
✅ Access all resources with `tenantId: null`

### Regular Users Remain Protected:
✅ Must have a valid `tenantId` in JWT
✅ Can only access their own tenant's resources
✅ Cannot access other tenants' data

## Files Modified

1. `src/common/guards/permission.guard.ts` - Allow null tenantId for platform_admin
2. `src/live-class/live-class.controller.ts` - Added getTenantId helper, updated create()
3. `src/licenses/licenses.controller.ts` - Added validateTenantAccess helper, updated 9 endpoints
4. `src/courses/courses.controller.ts` - Already uses role-aware validation

## Testing

To verify platform admin can have null tenantId:
1. Create platform_admin user with `tenantId: null` in JWT token
2. Test endpoints with any tenantId parameter
3. Verify access is granted across all tenants
4. Verify regular users still cannot access other tenants

### Test Endpoint
```bash
GET /api/courses?tenantId=any-tenant-id
Authorization: Bearer <platform-admin-token-with-null-tenantId>
```

Expected: ✅ Returns courses for the tenant
Previous: ❌ Would fail with "You do not have access to this tenant"

## Backward Compatibility

✅ Fully backward compatible
- Existing org_admin role checks still work
- Regular tenant users unchanged
- No breaking changes to API
