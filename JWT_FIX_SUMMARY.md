# JWT Strategy - Roles & Permissions Fix

## Problem Identified

The JWT token was not including `tenantId` and `roles` in the payload, so they were not available in the JWT strategy validation.

## Root Causes

1. **AuthService** `signAccessToken()` method was only signing `sub` and `email` without fetching tenant and role info
2. **AuthController** was not fetching `tenantId` and `roles` from the `UserTenant` table before signing tokens
3. Token payload missing these fields meant `req.user` in the JWT strategy would not have these values

## Solution Implemented

### 1. Updated `AuthService` (`src/auth/auth.service.ts`)

Added new method to fetch user's tenant and roles:

```typescript
async getUserTenantAndRoles(userId: string) {
  const userTenant = await this.prisma.userTenant.findFirst({
    where: { userId },
    select: { tenantId: true, roles: true }
  });
  return userTenant ? { tenantId: userTenant.tenantId, roles: userTenant.roles } : { tenantId: null, roles: [] };
}
```

Updated `signAccessToken()` to include tenant and roles:

```typescript
signAccessToken(user: { id: string; email: string; tenantId?: string | null; roles?: string[] }) {
  return this.jwtService.sign({
    sub: user.id,
    id: user.id,
    email: user.email,
    tenantId: user.tenantId ?? null,
    roles: user.roles ?? []
  });
}
```

### 2. Updated `AuthController` (`src/auth/auth.controller.ts`)

Modified three endpoints to fetch and include tenant/roles:

**Register endpoint:**

```typescript
const { tenantId, roles } = await this.auth.getUserTenantAndRoles(user.id);
const access = this.auth.signAccessToken({
  id: user.id,
  email: user.email,
  tenantId,
  roles,
});
return {
  user: { id: user.id, email: user.email, tenantId, roles },
  access_token: access,
  refresh_token: refresh,
};
```

**Login endpoint:**

```typescript
const { tenantId, roles } = await this.auth.getUserTenantAndRoles(user.id);
const access = this.auth.signAccessToken({
  id: user.id,
  email: user.email,
  tenantId,
  roles,
});
return {
  access_token: access,
  user: { id: user.id, email: user.email, tenantId, roles },
};
```

**Refresh endpoint:**

```typescript
const { tenantId, roles } = await this.auth.getUserTenantAndRoles(payload.sub);
const access = this.auth.signAccessToken({
  id: payload.sub,
  email: payload.email,
  tenantId,
  roles,
});
```

## Result

Now the JWT token payload includes:

```json
{
  "sub": "user_id",
  "id": "user_id",
  "email": "user@example.com",
  "tenantId": "tenant_id_or_null",
  "roles": ["training_manager", "org_admin"],
  "iat": 1700416371,
  "exp": 1700416401
}
```

The JWT Strategy's `validate()` method now receives this complete payload with `tenantId` and `roles`:

```typescript
async validate(payload: any): Promise<JwtUser> {
  if (!payload || !payload.sub) {
    throw new UnauthorizedException();
  }

  return {
    sub: payload.sub,
    id: payload.id,
    email: payload.email,
    tenantId: payload.tenantId ?? null,     // ✅ Now available
    roles: payload.roles ?? [],              // ✅ Now available
    iat: payload.iat,
    exp: payload.exp,
  };
}
```

## Benefits

✅ `req.user` now has `tenantId` and `roles` in all protected routes
✅ Tenant isolation works correctly
✅ Role-based access control (RBAC) functions properly
✅ Courses, modules, lessons can validate tenant ownership
✅ Video upload endpoints have proper tenant context

## Testing

After login, you'll receive:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "trainer@example.com",
    "tenantId": "tenant_id",
    "roles": ["training_manager"]
  }
}
```

Use this `access_token` in the `Authorization: Bearer` header for subsequent requests.
