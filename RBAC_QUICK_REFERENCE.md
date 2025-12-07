# RBAC Quick Reference Guide

## Overview

All endpoints now use **RolesGuard** with **@Roles()** decorator for consistent role-based access control.

## Key Commands

### Reset RBAC Tables & Seed Fresh Data

```bash
npm run rbac:reset
```

### Just Clean RBAC Tables

```bash
npm run rbac:clean
```

### Just Seed RBAC Data

```bash
npm run rbac:seed
```

## Role Hierarchy

```
Organization Level:
  └─ org_admin (Can manage all tenants, users, database, roles)

Tenant Level:
  ├─ tenant_admin (Can manage users and courses in tenant)
  ├─ training_manager (Can create/manage courses and live classes)
  ├─ instructor (Can create live classes and view progress)
  ├─ learner (Can view courses, lessons, and track progress)
  └─ viewer (Read-only access to courses and lessons)
```

## Admin Endpoints (All Require org_admin Role)

| Endpoint                                         | Method | Purpose                     |
| ------------------------------------------------ | ------ | --------------------------- |
| `/api/admin/database/update-config`              | POST   | Update PostgreSQL config    |
| `/api/admin/database/migrate`                    | POST   | Run Prisma migrations       |
| `/api/admin/database/update-and-migrate`         | POST   | Config + migrations         |
| `/api/admin/database/current-config`             | GET    | View current DB config      |
| `/api/admin/users/all-with-courses`              | GET    | View all users + courses    |
| `/api/admin/users/tenant/:tenantId/with-courses` | GET    | View tenant users + courses |
| `/api/admin/tenants/:tenantId/create-admin`      | POST   | Create tenant admin user    |

## How to Add New Permissions

1. **Edit `prisma/seed-rbac.ts`**:

   ```typescript
   const permissionsToCreate = [
     // ... existing permissions
     { code: 'new_permission', name: 'Description of new permission' },
   ];
   ```

2. **Assign to Role**:

   ```typescript
   {
     code: 'some_role',
     name: 'Some Role',
     permissions: [
       // ... existing permissions
       'new_permission'
     ],
   }
   ```

3. **Run Seed**:
   ```bash
   npm run rbac:reset
   ```

## How to Add New Role

1. **Edit `prisma/seed-rbac.ts`**:

   ```typescript
   rolesToCreate.push({
     code: 'new_role',
     name: 'New Role Name',
     permissions: ['permission1', 'permission2', 'permission3'],
   });
   ```

2. **Run Seed**:

   ```bash
   npm run rbac:reset
   ```

3. **Assign to Users**:
   ```bash
   POST /api/roles/assign-role
   {
     "userId": "user-id",
     "tenantId": "tenant-id",
     "roles": ["new_role"]
   }
   ```

## How to Protect New Endpoints

### Option 1: Single Role

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('training_manager')
@Post('courses')
createCourse() { ... }
```

### Option 2: Multiple Roles

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('training_manager', 'org_admin')
@Get('courses')
listCourses() { ... }
```

### Option 3: No Role Restriction (Auth Only)

```typescript
@UseGuards(JwtAuthGuard)
@Get('my-profile')
getProfile() { ... }
```

## API Testing

### 1. Register User

```bash
POST /api/auth/register
{
  "email": "admin@example.com",
  "password": "SecurePass123!",
  "displayName": "Admin User"
}
```

### 2. Create Tenant

```bash
POST /api/tenants
{
  "name": "Acme Corp"
}
```

### 3. Assign org_admin Role

```bash
POST /api/roles/assign-role
{
  "userId": "user-id-from-step-1",
  "tenantId": "tenant-id-from-step-2",
  "roles": ["org_admin"]
}
```

### 4. Login

```bash
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "SecurePass123!"
}
```

Response includes: `access_token`

### 5. Access Admin Endpoint

```bash
GET /api/admin/users/all-with-courses
Headers: Authorization: Bearer {access_token}
```

## Troubleshooting

### Error: "Access denied. Required roles: org_admin"

- **Cause**: User doesn't have org_admin role
- **Fix**: Assign role via `/api/roles/assign-role`

### Error: "User not found in request"

- **Cause**: JWT token is missing or invalid
- **Fix**: Include `Authorization: Bearer {token}` header

### Error: "RolePermission not found" when seeding

- **Cause**: Permission hasn't been created yet
- **Fix**: Make sure permission is in `permissionsToCreate` array before role definition

## Database Schema

```sql
-- Roles table
CREATE TABLE "Role" (
  id UUID PRIMARY KEY,
  code STRING UNIQUE,
  name STRING
);

-- Permissions table
CREATE TABLE "Permission" (
  id UUID PRIMARY KEY,
  code STRING UNIQUE,
  name STRING
);

-- Role-Permission association
CREATE TABLE "RolePermission" (
  id UUID PRIMARY KEY,
  roleId UUID REFERENCES "Role"(id),
  permissionId UUID REFERENCES "Permission"(id)
);

-- User-Tenant with roles
CREATE TABLE "UserTenant" (
  id UUID PRIMARY KEY,
  userId UUID REFERENCES "User"(id),
  tenantId UUID REFERENCES "Tenant"(id),
  roles STRING[] -- stores array of role codes
);
```

## Production Considerations

1. **Seed Data**: Run `npm run rbac:seed` after first deployment
2. **Backup**: Always backup database before running `npm run rbac:clean`
3. **Testing**: Test all role combinations in staging before production
4. **Documentation**: Keep role definitions documented in code comments
5. **Audit**: Use AuditLog table to track who accessed what

## Files to Review

- `src/admin/admin.controller.ts` - Admin endpoint implementations
- `src/roles/roles.guard.ts` - Role-checking logic
- `src/roles/roles.decorator.ts` - @Roles() decorator definition
- `prisma/seed-rbac.ts` - RBAC seed data
- `prisma/schema.prisma` - Database schema
- `RBAC_IMPLEMENTATION.md` - Detailed implementation guide
