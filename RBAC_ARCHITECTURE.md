# RBAC Architecture Documentation

## System Overview

This is a **two-tier Role-Based Access Control (RBAC)** system:

### **Tier 1: Platform Level** (@ironclad, @secnuo teams)

- Manage entire system
- Create and manage tenants
- Manage licenses
- Administer all platform operations
- **Roles**: `superadmin`, `platform_admin`

### **Tier 2: Tenant Level** (Other organizations)

- Manage their own LMS instance
- Create courses, lessons, quizzes
- Manage users and team members
- **Roles**: `tenant_admin`, `training_manager`, `instructor`, `learner`

---

## Permission Model

### **Permissions**

- **Predefined**: Fixed set of granular permissions (e.g., `courses.create`, `users.list`)
- **Immutable**: Cannot be modified after system initialization
- **Granular**: Specific to each action/endpoint
- **Total**: 71 predefined permissions

### **Permission Categories**

```
- auth.*           → Authentication (4 permissions)
- users.*          → User management (6 permissions)
- tenants.*        → Tenant management (5 permissions)
- roles.*          → Role management (7 permissions)
- courses.*        → Course management (8 permissions)
- modules.*        → Module management (4 permissions)
- lessons.*        → Lesson management (6 permissions)
- quizzes.*        → Quiz management (8 permissions)
- live-classes.*   → Live class management (8 permissions)
- licenses.*       → License management (9 permissions)
- admin.*          → Admin operations (4 permissions)
```

---

## Role Model

### **Predefined System Roles**

#### 1. **superadmin** (Platform)

- **Description**: Full system access
- **Use Case**: Only @ironclad & @secnuo teams
- **Permissions**: ALL 71 permissions
- **Scope**: Platform-wide

#### 2. **platform_admin** (Platform)

- **Description**: Manage tenants, licenses, and platform operations
- **Use Case**: Platform operations team
- **Permissions**: 18 permissions
  - Tenants: create, list, view, update, delete
  - Licenses: applications (list, view), tenants (create, list, view, renew), users (assign, revoke)
  - Users: list, view, delete
  - Roles: list, view
  - Admin: users (view), tenants (manage)
- **Scope**: Platform-wide

#### 3. **tenant_admin** (Tenant)

- **Description**: Full control over tenant resources
- **Use Case**: Organization leadership
- **Permissions**: 38 permissions
  - Users: full CRUD + bulk upload
  - Roles: full management (create, update, delete, assign)
  - Courses: full management
  - Modules: full management
  - Lessons: full management
  - Quizzes: full management
  - Live Classes: create, start, end, attendance, recording
- **Scope**: Tenant-only
- **Special**: Can create custom roles (must have `roles.create` permission)

#### 4. **training_manager** (Tenant)

- **Description**: Create and manage courses, modules, lessons, quizzes
- **Use Case**: Course creators/content managers
- **Permissions**: 25 permissions
  - Courses: full management (except cannot manage user assignments directly)
  - Modules: full management
  - Lessons: full management (including video upload, summaries)
  - Quizzes: full management (create, update, publish, view results)
  - Users: list, view (read-only)
  - Roles: list, view (read-only)
- **Scope**: Tenant-only

#### 5. **instructor** (Tenant)

- **Description**: Conduct live classes and view student progress
- **Use Case**: Subject matter experts, trainers
- **Permissions**: 10 permissions
  - Courses: list, view, progress
  - Lessons: view
  - Live Classes: create, start, end, attendance, recording
  - Users: list, view
- **Scope**: Tenant-only

#### 6. **learner** (Tenant)

- **Description**: View courses, attempt quizzes, join live classes
- **Use Case**: Students, employees taking training
- **Permissions**: 10 permissions
  - Courses: list, view, progress
  - Lessons: view
  - Quizzes: view, attempt
  - Live Classes: join, leave, view
- **Scope**: Tenant-only

---

## Endpoint Authorization Flow

Every endpoint follows this 3-step authorization:

```
Request → [1. JWT Validation] → [2. Role Check] → [3. Permission Check] → Response
```

### **Step 1: JWT Validation**

- Extract token from `Authorization: Bearer <token>`
- Verify signature and expiration
- Extract user info (id, email, tenantId, roles)

### **Step 2: Role Check**

- Verify user has required role(s) for the endpoint
- Example: `@Roles('tenant_admin', 'training_manager')`

### **Step 3: Permission Check**

- Query database: Get user's roles → Get role permissions
- Check if user has required permission
- Example: `users.create`, `courses.list`

### **Example Endpoint**

```typescript
@Post('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('tenant_admin', 'training_manager')  // Step 2: Role check
@RequirePermission('courses.create')        // Step 3: Permission check
async createCourse(@Body() dto: CreateCourseDto) {
  // Step 1 already done by JwtAuthGuard
  // If control reaches here, all checks passed
  return this.coursesService.create(dto);
}
```

---

## User Creation & Role Assignment

### **How Users Get Permissions**

1. **User Creation**: Admin creates user via POST `/api/users`

   ```json
   {
     "email": "trainer@company.com",
     "displayName": "John Trainer",
     "password": "SecurePass123!",
     "tenantName": "My Company",
     "roles": ["training_manager"] // Assign role(s)
   }
   ```

2. **Database Lookup**:
   - Find role by code: `SELECT * FROM roles WHERE code = 'training_manager'`
   - Get role's permissions: `SELECT permissions FROM role_permissions WHERE roleId = ?`

3. **Permission Check on Endpoint**:
   - User requests: `POST /api/courses` (create course)
   - System checks: Does 'training_manager' role have 'courses.create' permission?
   - Result: ✅ Yes → Request processed, ❌ No → 403 Forbidden

---

## Custom Roles (Admin Feature)

### **tenant_admin Can Create Custom Roles**

```typescript
// Endpoint: POST /api/roles
// Required permission: roles.create
// Allowed for: tenant_admin, platform_admin (if platform-level)

POST /api/roles
{
  "code": "content_reviewer",
  "name": "Content Reviewer",
  "permissions": [
    "courses.view",
    "lessons.view",
    "quizzes.view",
    "roles.permission-list"
  ]
}
```

**Important**: Only predefined permissions can be assigned to custom roles.

---

## Permission Categories & Use Cases

### **Authentication Permissions**

- `auth.register`: Open to everyone (public endpoint)
- `auth.login`: Open to everyone (public endpoint)
- `auth.refresh`: For JWT token refresh
- `auth.logout`: For session cleanup

### **User Management Permissions**

- `users.create`: Create new users (tenant_admin, training_manager can use)
- `users.list`: List users in tenant
- `users.view`: View individual user
- `users.update`: Modify user details
- `users.delete`: Remove user
- `users.bulk-upload`: Import multiple users

### **Course Management Permissions**

- `courses.create`: Create new course
- `courses.update`: Modify course
- `courses.delete`: Remove course
- `courses.publish`: Make course public/available
- `courses.assign`: Assign to users
- `courses.progress`: View learner progress

### **Quiz Permissions**

- `quizzes.create`: Create new quiz
- `quizzes.publish`: Make quiz available
- `quizzes.attempt`: Take the quiz
- `quizzes.results`: View scores/results
- `quizzes.generate`: Auto-generate from lesson summary

### **Live Class Permissions**

- `live-classes.create`: Schedule a live session
- `live-classes.start`: Begin the session
- `live-classes.join`: Participate as attendee
- `live-classes.attendance`: Record/manage attendance
- `live-classes.recording`: Record the session

---

## Database Schema

### **Permission Table**

```sql
permissions:
  - id (UUID, PK)
  - code (String, unique) - e.g., "courses.create"
  - name (String) - "Create new course"
```

### **Role Table**

```sql
roles:
  - id (UUID, PK)
  - code (String, unique) - e.g., "training_manager"
  - name (String) - "Training Manager"
```

### **RolePermission Table** (Many-to-Many)

```sql
role_permissions:
  - id (UUID, PK)
  - roleId (UUID, FK) → roles
  - permissionId (UUID, FK) → permissions
```

### **UserTenant Table** (User-Tenant-Roles)

```sql
user_tenants:
  - id (UUID, PK)
  - userId (UUID, FK) → users
  - tenantId (UUID, FK) → tenants
  - roles (String[]) - e.g., ["training_manager", "instructor"]
  - @@unique([userId, tenantId])
```

---

## Implementation Steps

### **1. Initialize RBAC**

```bash
# Reset database and create all predefined permissions + system roles
npx prisma db push --force-reset --skip-generate
npx ts-node prisma/seed-rbac.ts
npx ts-node prisma/seed.ts  # Create platform admin user
```

### **2. Verify Setup**

```bash
# Check permissions created
SELECT COUNT(*) FROM permissions;  # Should be 71

# Check system roles
SELECT code, name FROM roles;  # Should see all 6 system roles

# Check role permissions
SELECT r.code, COUNT(p.code) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.roleId
LEFT JOIN permissions p ON rp.permissionId = p.id
GROUP BY r.code;
```

### **3. Create Users with Roles**

```bash
# POST /api/users
# Body:
{
  "email": "trainer@company.com",
  "displayName": "John Trainer",
  "password": "SecurePass123!",
  "tenantName": "My Company",
  "roles": ["training_manager"]
}

# Response:
{
  "id": "user-123",
  "email": "trainer@company.com",
  "roles": ["training_manager"],
  "permissions": [
    "courses.create",
    "courses.update",
    ...
  ]
}
```

### **4. Endpoint Access Control**

Every endpoint checks:

1. ✅ Is JWT valid?
2. ✅ Does user have required role?
3. ✅ Does user's role have required permission?

---

## Migration from Old System

### **Changes Required on Endpoints**

```typescript
// OLD (Role-only check)
@Roles('tenant_admin')
async createCourse() { }

// NEW (Role + Permission check)
@Roles('tenant_admin', 'training_manager')
@RequirePermission('courses.create')
async createCourse() { }
```

### **Backward Compatibility**

- Existing roles keep their names and behavior
- Permission codes are standardized (e.g., `courses.create`)
- Multiple roles can have same permission

---

## Testing & Validation

### **Test User Scenarios**

#### **Scenario 1: Platform Admin**

```
User: platform_admin
Tenant: platform (system tenant)
Permissions: tenants.*, licenses.*, admin.*

Can: Manage all tenants, view all users, manage licenses
Cannot: Create courses, manage live classes
```

#### **Scenario 2: Tenant Admin**

```
User: tenant_admin
Tenant: My Company
Permissions: users.*, roles.*, courses.*, lessons.*, quizzes.*, live-classes.*

Can: Create/manage everything in their tenant
Cannot: Create custom permissions, manage other tenants
```

#### **Scenario 3: Training Manager**

```
User: training_manager
Tenant: My Company
Permissions: courses.*, lessons.*, quizzes.*, (users & roles view-only)

Can: Create courses, upload videos, publish quizzes
Cannot: Create/delete users, create custom roles, manage licenses
```

#### **Scenario 4: Learner**

```
User: learner
Tenant: My Company
Permissions: courses.list, courses.view, quizzes.attempt, live-classes.join

Can: View available courses, take quizzes, join live classes
Cannot: Create content, view other learners' progress, delete anything
```

---

## Security Considerations

### **Permission Validation**

- Every endpoint validates both role AND permission
- Permissions checked at database level (not hardcoded)
- No direct access to unauthorized data

### **Token Security**

- JWT tokens contain user ID, tenant ID, roles
- Tokens do NOT contain permission codes (fetched at runtime)
- Tokens expire after configurable period
- Refresh tokens used to get new access tokens

### **Data Isolation**

- Tenant-scoped endpoints verify `req.user.tenantId` matches resource
- Platform-level endpoints verify superadmin/platform_admin role
- Cross-tenant data access impossible (403 Forbidden)

### **Audit Trail**

- Log all permission-based actions
- Track role assignments and removals
- Monitor failed authorization attempts

---

## Configuration Reference

### **Environment Variables**

```env
# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRATION=24h
JWT_REFRESH_EXPIRATION=7d

# Platform Admin Tenant
PLATFORM_TENANT_NAME=platform

# Admin Users (created on seed)
ADMIN_EMAIL=lakshya.srivastava@secnuo.com
ADMIN_PASSWORD=ChangeMe123!
```

### **Role Hierarchy**

```
superadmin (all permissions)
├── platform_admin (platform operations)
│   ├── tenant_admin (per tenant)
│   │   ├── training_manager (content creation)
│   │   │   └── instructor (live teaching)
│   │   │       └── learner (content consumption)
```

---

## Summary

| Aspect             | Details                                                                                              |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| **Permissions**    | 71 predefined, immutable, granular                                                                   |
| **System Roles**   | 6 predefined roles (superadmin, platform_admin, tenant_admin, training_manager, instructor, learner) |
| **Custom Roles**   | Can be created by tenant_admin (uses predefined permissions)                                         |
| **Authorization**  | JWT validation → Role check → Permission check                                                       |
| **Data Isolation** | Tenant-scoped (verified at endpoint level)                                                           |
| **Auditing**       | All actions logged with user, role, permission, timestamp                                            |
