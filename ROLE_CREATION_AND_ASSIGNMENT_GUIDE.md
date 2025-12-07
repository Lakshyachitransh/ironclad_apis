# Role Creation & Assignment System - Complete Explanation

## Overview

The system has **two types of role creators** with different scopes and permissions:

1. **platform_admin** - Creates platform-wide system roles
2. **tenant_admin** - Creates tenant-specific roles

Both use the **same underlying mechanism** but operate in different scopes and with different available permissions.

---

## High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ROLE CREATION & ASSIGNMENT                   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────┐         ┌─────────────────────────────┐
│   PLATFORM ADMIN            │         │    TENANT ADMIN             │
│   (Scope: Platform-wide)    │         │    (Scope: Tenant-only)     │
└─────────────────────────────┘         └─────────────────────────────┘
           │                                       │
           ├─ Can assign to:                       ├─ Can assign to:
           │  • Platform users                     │  • Tenant users only
           │  • All tenants                        │  • Their tenant only
           │                                       │
           └─> CREATE ROLE #1 ────────────────────┤
               (e.g., "Support Team Lead")         │
                                                   └─> CREATE ROLE #2
                                                       (e.g., "Course Reviewer")

           ↓                                       ↓
    ┌──────────────────────────┐          ┌──────────────────────────┐
    │  2. Assign Permissions   │          │ 2. Assign Permissions    │
    │  (from predefined pool)  │          │ (from predefined pool)   │
    │                          │          │                          │
    │  - tenants.create        │          │ - courses.create         │
    │  - licenses.tenants.view │          │ - modules.update         │
    │  - users.list            │          │ - quizzes.view           │
    └──────────────────────────┘          └──────────────────────────┘

           ↓                                       ↓
    ┌──────────────────────────┐          ┌──────────────────────────┐
    │  3. Assign Role to User  │          │ 3. Assign Role to User   │
    │                          │          │                          │
    │  POST /api/roles/assign  │          │ POST /api/roles/assign   │
    │  {                       │          │ {                        │
    │    userId: "user-123",   │          │   userId: "user-456",    │
    │    tenantId: "tenant-x", │          │   tenantId: "tenant-y",  │
    │    roles: ["Support..."] │          │   roles: ["Course Rev"]  │
    │  }                       │          │ }                        │
    └──────────────────────────┘          └──────────────────────────┘

           ↓                                       ↓
    ┌──────────────────────────┐          ┌──────────────────────────┐
    │ User has role & can now  │          │ User has role & can now  │
    │ perform actions based on │          │ perform actions based on │
    │ role's permissions       │          │ role's permissions       │
    └──────────────────────────┘          └──────────────────────────┘
```

---

## Detailed Step-by-Step Process

### **STEP 1: Create Role (RoleCode + Name)**

#### What Happens:

A new role is created in the `Role` table with a unique code and display name.

#### Database Schema:

```prisma
model Role {
  id          String           @id @default(uuid())           // Auto-generated ID
  code        String           @unique                         // Unique role identifier
  name        String                                          // Display name
  permissions RolePermission[]                                // Links to permissions
}
```

#### Example - Platform Admin Creates a Role:

```typescript
// Request
POST /api/roles
Authorization: Bearer <platform_admin_jwt>
{
  "code": "support_lead",
  "name": "Support Team Lead",
  "description": "Manages support tickets and escalations"
}

// Response
{
  "id": "role-abc123",
  "code": "support_lead",
  "name": "Support Team Lead"
}
```

#### Example - Tenant Admin Creates a Role:

```typescript
// Request
POST /api/roles
Authorization: Bearer <tenant_admin_jwt>
{
  "code": "course_reviewer",
  "name": "Course Content Reviewer",
  "description": "Reviews and approves course content"
}

// Response (same structure)
{
  "id": "role-xyz789",
  "code": "course_reviewer",
  "name": "Course Content Reviewer"
}
```

#### Key Difference:

- **platform_admin**: Creates roles that can be used across all tenants
- **tenant_admin**: Creates roles that only exist within their tenant

---

### **STEP 2: Link Permissions to Role**

#### What Happens:

The system creates `RolePermission` records linking the role to predefined permissions.

#### Database Schema:

```prisma
model Permission {
  id              String           @id @default(uuid())
  code            String           @unique                    // e.g., "courses.create"
  name            String
  rolePermissions RolePermission[]
}

model RolePermission {
  id           String     @id @default(uuid())
  role         Role       @relation(fields: [roleId], references: [id])
  roleId       String     // References Role.id
  permission   Permission @relation(fields: [permissionId], references: [id])
  permissionId String     // References Permission.id
}
```

#### Visual Representation:

```
┌─────────────────┐         ┌──────────────────┐
│   Role          │         │   Permission     │
├─────────────────┤         ├──────────────────┤
│ id: role-123    │         │ id: perm-001     │
│ code: editor    │         │ code: posts.edit │
│ name: Editor    │         │ name: Edit posts │
└─────────────────┘         └──────────────────┘
        │ 1                           │ 1
        │ (roleId)                    │ (permissionId)
        └──────────────────┬──────────┘
                           │
                    ┌──────▼───────┐
                    │RolePermission│
                    ├──────────────┤
                    │ roleId       │ ──────> role-123
                    │ permissionId │ ──────> perm-001
                    └──────────────┘
```

#### Example - Platform Admin Assigns Permissions:

```typescript
// Code to link permissions to the support_lead role
const permissions = [
  'users.list', // Can view all users
  'users.view', // Can view user details
  'tenants.view', // Can view tenant info
  'admin.users.view', // Can view system users
];

for (const permCode of permissions) {
  // POST /api/roles/assign-permission
  rolesService.assignPermissionToRole('support_lead', permCode);
}

// Result in Database:
// RolePermission table gets 4 new rows:
// 1. roleId=role-abc123, permissionId=perm-users-list
// 2. roleId=role-abc123, permissionId=perm-users-view
// 3. roleId=role-abc123, permissionId=perm-tenants-view
// 4. roleId=role-abc123, permissionId=perm-admin-users-view
```

#### Example - Tenant Admin Assigns Permissions:

```typescript
// Code to link permissions to the course_reviewer role
const permissions = [
  'courses.view', // Can view courses
  'modules.view', // Can view modules
  'lessons.view', // Can view lessons
  'quizzes.view', // Can view quizzes
];

for (const permCode of permissions) {
  rolesService.assignPermissionToRole('course_reviewer', permCode);
}

// Result in Database:
// RolePermission table gets 4 new rows with tenant context
```

#### Difference Between Admins:

- **platform_admin**: Can assign ANY of the 71 predefined permissions
- **tenant_admin**: Can only assign tenant-level permissions (courses, modules, lessons, quizzes, users, roles, live-classes)
  - ❌ Cannot assign: tenants._, licenses._, admin.\* permissions

---

### **STEP 3: Assign Role to User (Tenant-Scoped)**

#### What Happens:

User gets assigned to the role FOR A SPECIFIC TENANT.

#### Database Schema:

```prisma
model UserTenant {
  id        String   @id @default(uuid())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  tenantId  String
  roles     String[] @default([])    // Array of role codes assigned to user
  createdAt DateTime @default(now())

  // Ensures each user can only be in a tenant once
  @@unique([userId, tenantId], name: "user_id_tenant_id")
}
```

#### Key Concept:

**User roles are TENANT-SCOPED!**

A user can have:

- Role **A** in Tenant **X**
- Role **B** in Tenant **Y**
- Different roles in different tenants

#### Example - Assigning Role to User:

```typescript
// Platform Admin assigning user to support_lead role
const userId = 'user-456';
const tenantId = 'tenant-main'; // Some tenant
const roles = ['support_lead'];

rolesService.assignRolesToUserTenant(userId, tenantId, roles);

// Result in Database (UserTenant table):
// ┌──────────┬──────────┬────────────────┐
// │ userId   │ tenantId │ roles          │
// ├──────────┼──────────┼────────────────┤
// │ user-456 │ tenant-m │ ["support_.."] │
// └──────────┴──────────┴────────────────┘
```

#### Multi-Tenant Example:

```typescript
// Same user in different tenants with different roles

// In Tenant A: User is a Course Reviewer
rolesService.assignRolesToUserTenant('user-456', 'tenant-A', [
  'course_reviewer',
]);

// In Tenant B: User is an Instructor
rolesService.assignRolesToUserTenant('user-456', 'tenant-B', ['instructor']);

// Result in Database:
// UserTenant table now has TWO rows for same user:
// ┌──────────┬──────────┬──────────────────┐
// │ userId   │ tenantId │ roles            │
// ├──────────┼──────────┼──────────────────┤
// │ user-456 │ tenant-A │ ["course_rev..."]│
// │ user-456 │ tenant-B │ ["instructor"]   │
// └──────────┴──────────┴──────────────────┘
```

#### Assigning Multiple Roles:

```typescript
// A user can have multiple roles in the same tenant
rolesService.assignRolesToUserTenant('user-789', 'tenant-X', [
  'instructor',
  'course_reviewer',
  'training_manager',
]);

// Result:
// User-789 has ALL THREE roles simultaneously in Tenant-X
// User can perform actions allowed by ANY of these roles
```

---

## Complete Data Flow Example

### Scenario: Platform Admin Creates Custom "Support Specialist" Role

#### **Step 1: Create the Role**

```
USER ACTION:
POST /api/roles
{
  "code": "support_specialist",
  "name": "Support Specialist",
  "description": "Handles customer support"
}

DATABASE CHANGE:
Role table:
┌───────────────────────────────┐
│ id: 'role-sp-001'             │
│ code: 'support_specialist'    │
│ name: 'Support Specialist'    │
└───────────────────────────────┘
```

#### **Step 2: Assign Permissions to Role**

**Platform admin selects these permissions:**

```
USER ACTIONS:
POST /api/roles/assign-permission { roleCode: 'support_specialist', permissionCode: 'users.list' }
POST /api/roles/assign-permission { roleCode: 'support_specialist', permissionCode: 'users.view' }
POST /api/roles/assign-permission { roleCode: 'support_specialist', permissionCode: 'tenants.view' }
POST /api/roles/assign-permission { roleCode: 'support_specialist', permissionCode: 'courses.view' }

DATABASE CHANGE:
RolePermission table gets 4 rows:
┌─────────────────────────────────────────┐
│ roleId: 'role-sp-001'                   │
│ permissionId: 'perm-users-list'         │ ──> users.list
├─────────────────────────────────────────┤
│ roleId: 'role-sp-001'                   │
│ permissionId: 'perm-users-view'         │ ──> users.view
├─────────────────────────────────────────┤
│ roleId: 'role-sp-001'                   │
│ permissionId: 'perm-tenants-view'       │ ──> tenants.view
├─────────────────────────────────────────┤
│ roleId: 'role-sp-001'                   │
│ permissionId: 'perm-courses-view'       │ ──> courses.view
└─────────────────────────────────────────┘
```

#### **Step 3: Assign Role to User**

**Platform admin assigns the role to a support team member:**

```
USER ACTION:
POST /api/roles/assign
{
  "userId": "user-support-01",
  "tenantId": "tenant-main",
  "roles": ["support_specialist"]
}

DATABASE CHANGE:
UserTenant table:
┌─────────────────────────────────────────┐
│ userId: 'user-support-01'               │
│ tenantId: 'tenant-main'                 │
│ roles: ['support_specialist']           │
└─────────────────────────────────────────┘
```

#### **Step 4: User Attempts an Action**

**User tries to list all users:**

```
USER REQUEST:
GET /api/users
Authorization: Bearer <jwt_token>

AUTHORIZATION CHECK (3-Layer):
┌─────────────────────────────────────┐
│ Layer 1: JWT Validation             │
│ ✅ Token is valid                   │
│    userId: "user-support-01"        │
│    tenantId: "tenant-main"          │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ Layer 2: Role Check                 │
│ ✅ User has role in tenant          │
│    Role: "support_specialist"       │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ Layer 3: Permission Check           │
│ Query: Does "support_specialist"    │
│        role have "users.list"?      │
│                                     │
│ Database Query:                     │
│ SELECT * FROM RolePermission        │
│ WHERE roleId = 'role-sp-001'        │
│ AND permissionId = 'perm-users-list'│
│                                     │
│ ✅ YES - Record exists!             │
└─────────────────────────────────────┘
        ↓
✅ ACTION ALLOWED - Return user list

USER RESPONSE:
[
  { id: "user-1", email: "...", roles: [...] },
  { id: "user-2", email: "...", roles: [...] }
]
```

---

## System Roles vs Custom Roles

### System Roles (Predefined)

These are created during RBAC seed and cannot be deleted:

```
✅ superadmin        (71 permissions)  - @ironclad & @secnuo only
✅ platform_admin    (18 permissions)  - Manage tenants & licenses
✅ tenant_admin      (38 permissions)  - Full tenant control
✅ training_manager  (25 permissions)  - Create courses & content
✅ instructor        (10 permissions)  - Teach & track progress
✅ learner           (10 permissions)  - Learn & take quizzes
```

### Custom Roles (User-Created)

These are created by admins as needed:

```
Tenant Admin Creates:
  • course_reviewer     - Reviews course content
  • content_moderator   - Moderates forum posts
  • mentee_coordinator  - Manages mentees

Platform Admin Creates:
  • partner_manager     - Manages partner tenants
  • billing_admin       - Manages billing
  • compliance_officer  - Monitors compliance
```

---

## Permission Restrictions

### Platform Admin Can Assign:

✅ ALL 71 predefined permissions across all 11 categories

### Tenant Admin Can Assign:

✅ Tenant-level permissions only:

- `courses.*`
- `modules.*`
- `lessons.*`
- `quizzes.*`
- `live-classes.*`
- `users.*` (within tenant)
- `roles.*` (within tenant)

❌ Cannot assign platform-level:

- `tenants.*`
- `licenses.*`
- `admin.*`

---

## API Endpoints for Role Management

### Create Role

```
POST /api/roles
Authorization: Bearer <jwt>
Body: { code, name, description }
Response: 201 Created
```

### List Roles

```
GET /api/roles
Authorization: Bearer <jwt>
Response: 200 [{ code, name, description }]
```

### Get Role Details

```
GET /api/roles/{code}
Authorization: Bearer <jwt>
Response: 200 { code, name, permissions: [...] }
```

### Assign Permission to Role

```
POST /api/roles/assign-permission
Authorization: Bearer <jwt>
Body: { roleCode, permissionCode }
Response: 200 Assigned
```

### Assign Role to User (Tenant-Scoped)

```
POST /api/roles/assign
Authorization: Bearer <jwt>
Body: { userId, tenantId, roles: [...] }
Response: 200 Assigned
```

### Check User Permission

```
GET /api/roles/check-permission/{permissionCode}
Authorization: Bearer <jwt>
Query: ?tenantId=xxx
Response: 200 { hasPermission: true/false }
```

---

## Key Takeaways

| Aspect                  | Platform Admin         | Tenant Admin                       |
| ----------------------- | ---------------------- | ---------------------------------- |
| **Role Scope**          | Platform-wide          | Tenant-only                        |
| **Can Create Roles**    | ✅ Yes                 | ✅ Yes (in their tenant)           |
| **Can Assign Roles**    | ✅ All users & tenants | ✅ Users in their tenant           |
| **Permission Pool**     | All 71 permissions     | Only tenant-level (50 permissions) |
| **Can Create Users**    | ❌ No                  | ✅ Yes (in their tenant)           |
| **Can Delete Tenants**  | ✅ Yes                 | ❌ No                              |
| **Can Manage Licenses** | ✅ Yes                 | ❌ No                              |

---

## Code Examples

### Creating Role and Assigning Permissions (Platform Admin):

```typescript
// 1. Create role
const role = await rolesService.createRole(
  'support_lead',
  'Support Team Lead',
  'Leads support operations',
);

// 2. Add permissions
const permissionsToAdd = [
  'users.list',
  'users.view',
  'tenants.view',
  'admin.users.view',
];

for (const permCode of permissionsToAdd) {
  await rolesService.assignPermissionToRole('support_lead', permCode);
}

// 3. Assign role to user in a tenant
await rolesService.assignRolesToUserTenant('user-123', 'tenant-main', [
  'support_lead',
]);
```

### Creating Role and Assigning Permissions (Tenant Admin):

```typescript
// 1. Create role (tenant-scoped automatically through context)
const role = await rolesService.createRole(
  'course_auditor',
  'Course Quality Auditor',
  'Audits course quality and compliance',
);

// 2. Add only tenant-level permissions
const permissionsToAdd = [
  'courses.view',
  'courses.progress',
  'modules.view',
  'lessons.view',
  'quizzes.view',
];

for (const permCode of permissionsToAdd) {
  await rolesService.assignPermissionToRole('course_auditor', permCode);
}

// 3. Assign role to user in their tenant
await rolesService.assignRolesToUserTenant('user-456', 'their-tenant-id', [
  'course_auditor',
]);
```

---

## Common Scenarios

### Scenario 1: Supporting Multiple Roles per User

**Question:** Can a user have multiple roles?  
**Answer:** ✅ YES! In the same tenant.

```typescript
await rolesService.assignRolesToUserTenant('user-789', 'tenant-X', [
  'instructor',
  'training_manager',
  'course_reviewer',
]);

// User-789 now has permissions from ALL THREE roles
// Total permissions = Union of all three roles' permissions
```

### Scenario 2: Same User, Different Roles in Different Tenants

**Question:** Can a user have role A in Tenant X and role B in Tenant Y?  
**Answer:** ✅ YES! Roles are tenant-scoped.

```typescript
// User in Tenant A
await rolesService.assignRolesToUserTenant('john', 'tenant-A', ['instructor']);

// Same user in Tenant B
await rolesService.assignRolesToUserTenant('john', 'tenant-B', [
  'training_manager',
]);

// John has different roles in each tenant
```

### Scenario 3: Revoking a Role

**Question:** How to remove a role from a user?  
**Answer:** Use the same endpoint with empty roles array.

```typescript
// Remove all roles
await rolesService.assignRolesToUserTenant(
  'user-123',
  'tenant-X',
  [], // Empty roles
);

// Or keep other roles while removing one
const currentRoles = ['role1', 'role2', 'role3'];
const updatedRoles = currentRoles.filter((r) => r !== 'role2');
await rolesService.assignRolesToUserTenant(
  'user-123',
  'tenant-X',
  updatedRoles,
);
```

---

## Summary

**Role Creation & Assignment** is a **three-step process**:

1. **Create Role** - Define a new role with code and name
2. **Assign Permissions** - Link predefined permissions to the role
3. **Assign Role to User** - Associate the role with a user in a tenant

**Two creators** with different capabilities:

- **platform_admin**: Creates platform-wide roles with any permissions
- **tenant_admin**: Creates tenant-specific roles with tenant-level permissions

**Key Feature: Multi-tenant Support**

- Same user can have different roles in different tenants
- Same user can have multiple roles in the same tenant
- Permissions are accumulated from all assigned roles
