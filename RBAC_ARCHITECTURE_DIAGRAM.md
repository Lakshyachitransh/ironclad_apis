# RBAC Architecture Diagram

## 1. Request Flow with RBAC

```
┌─────────────────────────────────────────────────────────────────┐
│                     Client Request                              │
│  GET /api/admin/users/all-with-courses                          │
│  Authorization: Bearer eyJhbGciOiJIUzI1NiIs...                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                   NestJS Middleware                              │
│                                                                  │
│  1. JwtAuthGuard (@UseGuards)                                   │
│     ├─ Validates JWT token signature                            │
│     ├─ Decodes payload: {userId, email, roles, tenantId}       │
│     └─ Sets req.user with decoded data                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                   RolesGuard (@UseGuards)                        │
│                                                                  │
│  2. Check endpoint metadata                                      │
│     └─ @Roles('org_admin') → requiredRoles = ['org_admin']     │
│                                                                  │
│  3. Extract user roles                                           │
│     └─ userRoles = req.user.roles = ['org_admin']              │
│                                                                  │
│  4. Compare                                                      │
│     ├─ requiredRoles ∩ userRoles = ['org_admin']               │
│     ├─ Match found? YES ✅                                       │
│     └─ Allow request                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                 AdminController Handler                          │
│                                                                  │
│  getAllUsersWithCourses() {                                      │
│    return this.adminService.getAllUsersWithCourseAssignments()  │
│  }                                                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Response to Client                            │
│  {                                                               │
│    "success": true,                                              │
│    "totalUsers": 5,                                              │
│    "data": [...]                                                 │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Rejection Flow (Non-Admin User)

```
┌─────────────────────────────────────────────────────────────────┐
│                     Client Request                              │
│  GET /api/admin/users/all-with-courses                          │
│  Authorization: Bearer eyJhbGciOiJIUzI1NiIs...                 │
│  (Token payload: {userId, email, roles: ['learner']})          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                   JwtAuthGuard                                   │
│  ✅ Valid token → Sets req.user = {roles: ['learner']}         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                   RolesGuard                                     │
│                                                                  │
│  Compare: ['org_admin'] ∩ ['learner'] = ∅                      │
│           requiredRoles   userRoles                              │
│                                                                  │
│  NO MATCH ❌ → Throw ForbiddenException                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                  HTTP 403 Forbidden                              │
│  {                                                               │
│    "statusCode": 403,                                            │
│    "message": "Access denied. Required roles: org_admin",       │
│    "error": "Forbidden"                                          │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

## 3. Database Schema

```
┌─────────────────────────┐
│        User             │
├─────────────────────────┤
│ id (UUID)               │
│ email (STRING)          │
│ displayName (STRING)    │
│ status (STRING)         │
│ createdAt (DATETIME)    │
└────────────┬────────────┘
             │ 1:N
             │
    ┌────────▼──────────────────────┐
    │      UserTenant               │
    ├───────────────────────────────┤
    │ id (UUID)                     │
    │ userId (UUID) → User          │
    │ tenantId (UUID) → Tenant      │
    │ roles (STRING[])              │ ◄── Stores array of role codes
    │ createdAt (DATETIME)          │
    └────────┬─────────────┬────────┘
             │             │
             │             └──────────┐
             │                        │
    ┌────────▼──────────────┐         │
    │      Role             │         │
    ├───────────────────────┤         │
    │ id (UUID)             │         │
    │ code (STRING)         │◄────────┤─── role codes matched with
    │ name (STRING)         │         │    UserTenant.roles array
    └────────┬──────────────┘         │
             │ 1:N (via RolePermission)
             │
    ┌────────▼────────────────────┐  │
    │    RolePermission           │  │
    ├─────────────────────────────┤  │
    │ id (UUID)                   │  │
    │ roleId (UUID) → Role        │  │
    │ permissionId (UUID)         │  │
    │    → Permission             │  │
    └─────────────────────────────┘  │
             │                        │
    ┌────────▼──────────────────┐    │
    │     Permission            │    │
    ├───────────────────────────┤    │
    │ id (UUID)                 │    │
    │ code (STRING)             │    │
    │ name (STRING)             │    │
    └───────────────────────────┘    │
                                     │
                    ┌────────────────┘
                    │ Tenant
                    ├─────────────────────────┐
                    │ id (UUID)               │
                    │ name (STRING)           │
                    │ status (STRING)         │
                    │ createdAt (DATETIME)    │
                    └─────────────────────────┘
```

## 4. Role Permission Matrix

```
┌──────────────────┬─────────┬────────────┬──────────────┬──────────┬────────┐
│ Permission       │ org_    │ tenant_    │ training_    │ instruct │ learn  │
│                  │ admin   │ admin      │ manager      │ or       │ er     │
├──────────────────┼─────────┼────────────┼──────────────┼──────────┼────────┤
│ manage_database  │    ✅   │     ❌     │      ❌      │    ❌    │   ❌   │
│ manage_tenants   │    ✅   │     ❌     │      ❌      │    ❌    │   ❌   │
│ view_all_users   │    ✅   │     ❌     │      ❌      │    ❌    │   ❌   │
│ create_tenant... │    ✅   │     ❌     │      ❌      │    ❌    │   ❌   │
├──────────────────┼─────────┼────────────┼──────────────┼──────────┼────────┤
│ manage_users     │    ✅   │     ✅     │      ❌      │    ❌    │   ❌   │
│ view_users       │    ✅   │     ✅     │      ❌      │    ❌    │   ❌   │
│ create_user      │    ✅   │     ✅     │      ❌      │    ❌    │   ❌   │
├──────────────────┼─────────┼────────────┼──────────────┼──────────┼────────┤
│ create_course    │    ✅   │     ❌     │      ✅      │    ❌    │   ❌   │
│ edit_course      │    ✅   │     ❌     │      ✅      │    ❌    │   ❌   │
│ delete_course    │    ✅   │     ❌     │      ✅      │    ❌    │   ❌   │
│ manage_course... │    ✅   │     ✅     │      ✅      │    ❌    │   ❌   │
├──────────────────┼─────────┼────────────┼──────────────┼──────────┼────────┤
│ create_live_...  │    ✅   │     ❌     │      ✅      │    ✅    │   ❌   │
│ manage_live_...  │    ✅   │     ✅     │      ✅      │    ✅    │   ❌   │
│ view_live_class  │    ✅   │     ✅     │      ✅      │    ✅    │   ❌   │
│ participate_...  │    ✅   │     ❌     │      ❌      │    ❌    │   ✅   │
├──────────────────┼─────────┼────────────┼──────────────┼──────────┼────────┤
│ view_courses     │    ✅   │     ✅     │      ✅      │    ✅    │   ✅   │
│ view_lessons     │    ✅   │     ✅     │      ✅      │    ✅    │   ✅   │
│ view_my_progress │    ✅   │     ❌     │      ❌      │    ✅    │   ✅   │
└──────────────────┴─────────┴────────────┴──────────────┴──────────┴────────┘
```

## 5. Admin Endpoints Protection

```
┌──────────────────────────────────────────────────────────────────┐
│                    AdminController                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  @UseGuards(JwtAuthGuard, RolesGuard)                            │
│  export class AdminController {                                  │
│                                                                  │
│    @Roles('org_admin')                                           │
│    @Post('database/update-config')                               │
│    updateDatabaseConfig()  ────────────► ✅ org_admin only       │
│                                                                  │
│    @Roles('org_admin')                                           │
│    @Post('database/migrate')                                     │
│    runMigrations()         ────────────► ✅ org_admin only       │
│                                                                  │
│    @Roles('org_admin')                                           │
│    @Post('database/update-and-migrate')                          │
│    updateAndMigrate()      ────────────► ✅ org_admin only       │
│                                                                  │
│    @Roles('org_admin')                                           │
│    @Get('database/current-config')                               │
│    getCurrentConfig()      ────────────► ✅ org_admin only       │
│                                                                  │
│    @Roles('org_admin')                                           │
│    @Get('users/all-with-courses')                                │
│    getAllUsersWithCourses() ───────────► ✅ org_admin only       │
│                                                                  │
│    @Roles('org_admin')                                           │
│    @Get('users/tenant/:tenantId/with-courses')                   │
│    getTenantUsersWithCourses() ────────► ✅ org_admin only       │
│                                                                  │
│    @Roles('org_admin')                                           │
│    @Post('tenants/:tenantId/create-admin')                       │
│    createTenantAdmin()     ────────────► ✅ org_admin only       │
│                                                                  │
│  }                                                               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

All 7 endpoints protected with @Roles('org_admin')
```

## 6. Authentication & Authorization Chain

```
Request Lifecycle:
═════════════════════════════════════════════════════════════════

1️⃣  AUTHENTICATION (JwtAuthGuard)
    ├─ Verify token signature is valid
    ├─ Verify token hasn't expired
    ├─ Extract claims (userId, email, roles)
    └─ Set req.user with user data
    
    ❌ If fails → 401 Unauthorized
    ✅ If passes → Continue to next guard

2️⃣  AUTHORIZATION (RolesGuard)
    ├─ Read @Roles() metadata from route
    ├─ Check if user has ANY required role
    ├─ Compare user.roles with required roles
    └─ Allow or deny based on match
    
    ❌ If no match → 403 Forbidden
    ✅ If match → Execute handler

3️⃣  ENDPOINT EXECUTION
    ├─ Run business logic in service
    ├─ Access database (Prisma)
    └─ Return response
    
    ✅ 200 OK or appropriate status code
    ❌ If error → Error response
```

## 7. Role Hierarchy

```
Organization Level
│
└─── org_admin ✨ (Super Admin)
     ├─ Can manage all tenants
     ├─ Can create/delete tenants
     ├─ Can assign tenant admins
     ├─ Can update database
     └─ Can run migrations
     
     └─ Tenant Level (belongs to multiple tenants)
        │
        ├─── tenant_admin (Tenant Admin)
        │    ├─ Can manage users in tenant
        │    ├─ Can create courses (delegated to training_manager)
        │    └─ Can view all reports
        │
        ├─── training_manager (Course Manager)
        │    ├─ Can create/edit courses
        │    ├─ Can manage assignments
        │    └─ Can create live classes
        │
        ├─── instructor (Teacher)
        │    ├─ Can teach live classes
        │    ├─ Can view student progress
        │    └─ Can access courses
        │
        ├─── learner (Student)
        │    ├─ Can view assigned courses
        │    ├─ Can track progress
        │    └─ Can join live classes
        │
        └─── viewer (Observer)
             └─ Can view courses and lessons (read-only)
```

## 8. Guard Execution Order

```
Request → NestJS Pipeline
         │
         ├─ Global Pipes
         │
         ├─ Guard 1: JwtAuthGuard
         │   ├─ Check: Is JWT valid?
         │   ├─ Yes ✅ → Continue to next guard
         │   └─ No ❌ → 401 Unauthorized
         │
         ├─ Guard 2: RolesGuard
         │   ├─ Read @Roles() decorator
         │   ├─ Check: Does user have role?
         │   ├─ Yes ✅ → Continue to handler
         │   └─ No ❌ → 403 Forbidden
         │
         ├─ Handler (Endpoint Method)
         │   └─ Execute business logic
         │
         └─ Response
```

## Quick Reference

```
Role                 Min Permissions  Max Permissions  Use Case
──────────────────────────────────────────────────────────────
org_admin            5               ∞               Platform owner
tenant_admin         7               +10             Tenant owner
training_manager     5               +8              Course creator
instructor           6               +2              Teacher
learner              4               +1              Student
viewer               2               0               Observer
```

This architecture ensures:
✅ **Security**: Multi-layer verification
✅ **Flexibility**: Easy to add roles/permissions
✅ **Auditability**: Track who can do what
✅ **Scalability**: Supports multi-tenant hierarchy
