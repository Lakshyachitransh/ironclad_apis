# Complete Permissions List - Ironclad APIs

## Overview

The application contains **71 predefined, immutable permissions** across **11 categories**. These permissions define all possible actions in the system and are used to control access to endpoints.

---

## Permissions by Category

### 1. **AUTH** (4 permissions)

Authentication and session management

| Code            | Permission Name              | Description                               |
| --------------- | ---------------------------- | ----------------------------------------- |
| `auth.register` | Register new user            | Allow user registration in the system     |
| `auth.login`    | Login to system              | Allow user authentication and login       |
| `auth.refresh`  | Refresh authentication token | Allow JWT token refresh                   |
| `auth.logout`   | Logout from system           | Allow user logout and session termination |

---

### 2. **USERS** (6 permissions)

User management and administration

| Code                | Permission Name         | Description                              |
| ------------------- | ----------------------- | ---------------------------------------- |
| `users.create`      | Create new user         | Create new user accounts in the system   |
| `users.list`        | List all users          | View list of all users                   |
| `users.view`        | View user details       | View individual user profile information |
| `users.update`      | Update user information | Modify user account details              |
| `users.delete`      | Delete user             | Remove user from the system              |
| `users.bulk-upload` | Bulk upload users       | Upload multiple users at once via file   |

---

### 3. **TENANTS** (5 permissions)

Tenant/Organization management - Platform only

| Code             | Permission Name           | Description                        |
| ---------------- | ------------------------- | ---------------------------------- |
| `tenants.create` | Create new tenant         | Create new tenant organization     |
| `tenants.list`   | List all tenants          | View all tenants in the system     |
| `tenants.view`   | View tenant details       | View specific tenant information   |
| `tenants.update` | Update tenant information | Modify tenant details and settings |
| `tenants.delete` | Delete tenant             | Remove tenant from the system      |

---

### 4. **ROLES** (7 permissions)

Role and permission management

| Code                    | Permission Name           | Description                                   |
| ----------------------- | ------------------------- | --------------------------------------------- |
| `roles.create`          | Create new role           | Create custom roles with selected permissions |
| `roles.list`            | List all roles            | View all available roles                      |
| `roles.view`            | View role details         | View role configuration and permissions       |
| `roles.update`          | Update role               | Modify role properties and permissions        |
| `roles.delete`          | Delete role               | Remove custom roles from system               |
| `roles.assign`          | Assign role to user       | Assign roles to user accounts                 |
| `roles.permission-list` | View permissions for role | View what permissions a role has              |

---

### 5. **COURSES** (8 permissions)

Course creation and management

| Code               | Permission Name        | Description                                |
| ------------------ | ---------------------- | ------------------------------------------ |
| `courses.create`   | Create new course      | Create new training courses                |
| `courses.list`     | List all courses       | View list of all courses                   |
| `courses.view`     | View course details    | View specific course information           |
| `courses.update`   | Update course          | Modify course content and settings         |
| `courses.delete`   | Delete course          | Remove course from the system              |
| `courses.publish`  | Publish course         | Make course available to learners          |
| `courses.assign`   | Assign course to users | Assign courses to specific users or groups |
| `courses.progress` | View course progress   | Track learner progress in courses          |

---

### 6. **MODULES** (4 permissions)

Course module management

| Code             | Permission Name      | Description                        |
| ---------------- | -------------------- | ---------------------------------- |
| `modules.create` | Create course module | Create modules within courses      |
| `modules.update` | Update module        | Modify module content and settings |
| `modules.delete` | Delete module        | Remove module from course          |
| `modules.list`   | List modules         | View all modules in a course       |

---

### 7. **LESSONS** (6 permissions)

Lesson creation and content management

| Code                   | Permission Name     | Description                                     |
| ---------------------- | ------------------- | ----------------------------------------------- |
| `lessons.create`       | Create lesson       | Create new lessons within modules               |
| `lessons.update`       | Update lesson       | Modify lesson content                           |
| `lessons.delete`       | Delete lesson       | Remove lesson from module                       |
| `lessons.upload-video` | Upload lesson video | Upload video content for lessons                |
| `lessons.add-summary`  | Add lesson summary  | Add AI-generated or manual summaries to lessons |
| `lessons.view`         | View lesson         | Access and view lesson content                  |

---

### 8. **QUIZZES** (8 permissions)

Quiz and assessment management

| Code               | Permission Name            | Description                                        |
| ------------------ | -------------------------- | -------------------------------------------------- |
| `quizzes.create`   | Create quiz                | Create new quizzes for courses                     |
| `quizzes.update`   | Update quiz                | Modify quiz questions and settings                 |
| `quizzes.delete`   | Delete quiz                | Remove quiz from system                            |
| `quizzes.publish`  | Publish quiz               | Make quiz available to learners                    |
| `quizzes.view`     | View quiz                  | View quiz content and questions                    |
| `quizzes.attempt`  | Attempt quiz               | Take/complete quizzes as a learner                 |
| `quizzes.results`  | View quiz results          | View quiz scores and answer reviews                |
| `quizzes.generate` | Generate quiz from summary | Auto-generate quiz questions from lesson summaries |

---

### 9. **LIVE-CLASSES** (8 permissions)

Live class/synchronous session management

| Code                      | Permission Name        | Description                                 |
| ------------------------- | ---------------------- | ------------------------------------------- |
| `live-classes.create`     | Create live class      | Schedule new live sessions                  |
| `live-classes.start`      | Start live class       | Begin a scheduled live session              |
| `live-classes.end`        | End live class         | Conclude a live session                     |
| `live-classes.join`       | Join live class        | Participate in a live class session         |
| `live-classes.leave`      | Leave live class       | Exit a live class session                   |
| `live-classes.view`       | View live class        | Access live class details and resources     |
| `live-classes.attendance` | View/manage attendance | Track and manage attendance in live classes |
| `live-classes.recording`  | Record live class      | Record live sessions for later playback     |

---

### 10. **LICENSES** (9 permissions)

License and application management - Platform only

| Code                           | Permission Name          | Description                             |
| ------------------------------ | ------------------------ | --------------------------------------- |
| `licenses.applications.create` | Create application       | Register new applications for licensing |
| `licenses.applications.list`   | List applications        | View all registered applications        |
| `licenses.applications.view`   | View application         | View application license details        |
| `licenses.tenants.create`      | Create tenant license    | Issue licenses to tenants               |
| `licenses.tenants.list`        | List tenant licenses     | View all active tenant licenses         |
| `licenses.tenants.view`        | View tenant license      | View specific tenant license details    |
| `licenses.tenants.renew`       | Renew tenant license     | Extend tenant license validity          |
| `licenses.users.assign`        | Assign license to user   | Assign user-level licenses              |
| `licenses.users.revoke`        | Revoke license from user | Remove user licenses                    |

---

### 11. **ADMIN** (4 permissions)

Administrative and system management - Platform only

| Code                     | Permission Name         | Description                              |
| ------------------------ | ----------------------- | ---------------------------------------- |
| `admin.database.update`  | Update database config  | Modify database configuration settings   |
| `admin.database.migrate` | Run database migrations | Execute Prisma migrations                |
| `admin.users.view`       | View all system users   | View all users across all tenants        |
| `admin.tenants.manage`   | Manage all tenants      | Full administrative control over tenants |

---

## Permissions Summary by Category

```
┌─────────────────┬───────────┐
│ Category        │ Count     │
├─────────────────┼───────────┤
│ auth            │ 4         │
│ users           │ 6         │
│ tenants         │ 5         │
│ roles           │ 7         │
│ courses         │ 8         │
│ modules         │ 4         │
│ lessons         │ 6         │
│ quizzes         │ 8         │
│ live-classes    │ 8         │
│ licenses        │ 9         │
│ admin           │ 4         │
├─────────────────┼───────────┤
│ TOTAL           │ 71        │
└─────────────────┴───────────┘
```

---

## System Roles & Their Permissions

### 1. **superadmin** 🔴 (71 permissions)

Full system access - Only for @ironclad & @secnuo teams

**Includes:** All 71 permissions across all categories

**Scope:** Platform-wide

**Use Case:** System administrators and platform developers

---

### 2. **platform_admin** 🟢 (18 permissions)

Manage tenants, licenses, and platform operations

**Included Permissions:**

```
Tenants (5):
  • tenants.create, tenants.list, tenants.view
  • tenants.update, tenants.delete

Licenses (8):
  • licenses.applications.list, licenses.applications.view
  • licenses.tenants.create, licenses.tenants.list
  • licenses.tenants.view, licenses.tenants.renew
  • licenses.users.assign, licenses.users.revoke

Users (3):
  • users.list, users.view, users.delete

Roles (2):
  • roles.list, roles.view

Admin (2):
  • admin.users.view, admin.tenants.manage
```

**Scope:** Platform-wide

**Use Case:** Manage organizations, licenses, and platform operations

---

### 3. **tenant_admin** 🟡 (38 permissions)

Full control over tenant resources

**Included Permissions:**

```
Users (6):
  • users.create, users.list, users.view, users.update
  • users.delete, users.bulk-upload

Roles (6):
  • roles.create, roles.list, roles.view, roles.update
  • roles.delete, roles.assign

Courses (8):
  • courses.create, courses.list, courses.view, courses.update
  • courses.delete, courses.publish, courses.assign, courses.progress

Modules (4):
  • modules.create, modules.update, modules.delete, modules.list

Lessons (6):
  • lessons.create, lessons.update, lessons.delete
  • lessons.upload-video, lessons.add-summary, lessons.view

Quizzes (7):
  • quizzes.create, quizzes.update, quizzes.delete, quizzes.publish
  • quizzes.view, quizzes.results, quizzes.generate

Live Classes (5):
  • live-classes.create, live-classes.start, live-classes.end
  • live-classes.attendance, live-classes.recording
```

**Scope:** Tenant-level

**Use Case:** Manage all tenant operations, resources, and users

---

### 4. **training_manager** 🔵 (25 permissions)

Create and manage courses, content, and assessments

**Included Permissions:**

```
Courses (8):
  • courses.create, courses.list, courses.view, courses.update
  • courses.delete, courses.publish, courses.assign, courses.progress

Modules (4):
  • modules.create, modules.update, modules.delete, modules.list

Lessons (6):
  • lessons.create, lessons.update, lessons.delete
  • lessons.upload-video, lessons.add-summary, lessons.view

Quizzes (7):
  • quizzes.create, quizzes.update, quizzes.delete, quizzes.publish
  • quizzes.view, quizzes.results, quizzes.generate

Users (2) - View Only:
  • users.list, users.view

Roles (2) - View Only:
  • roles.list, roles.view
```

**Scope:** Tenant-level

**Use Case:** Create training content and manage assessments

---

### 5. **instructor** 🟣 (10 permissions)

Conduct live classes and view student progress

**Included Permissions:**

```
Courses (3):
  • courses.list, courses.view, courses.progress

Lessons (1):
  • lessons.view

Live Classes (5):
  • live-classes.create, live-classes.start, live-classes.end
  • live-classes.attendance, live-classes.recording

Users (2) - View Only:
  • users.list, users.view
```

**Scope:** Tenant-level

**Use Case:** Conduct virtual training sessions and monitor learner participation

---

### 6. **learner** 🟠 (10 permissions)

Access courses, lessons, and complete assessments

**Included Permissions:**

```
Courses (3):
  • courses.list, courses.view, courses.progress

Lessons (1):
  • lessons.view

Quizzes (2):
  • quizzes.view, quizzes.attempt

Live Classes (3):
  • live-classes.join, live-classes.leave, live-classes.view
```

**Scope:** Tenant-level

**Use Case:** Access training content and complete assessments

---

## Permission Naming Convention

All permissions follow the pattern: `category.action`

### Examples:

- `courses.create` - Create action on courses category
- `users.bulk-upload` - Bulk upload action on users category
- `quizzes.generate` - Generate action on quizzes category

### Action Types:

- **CRUD**: `create`, `list`, `view`, `update`, `delete`
- **Special**: `publish`, `assign`, `progress`, `refresh`, `logout`, `attempt`, `results`, `generate`, `renew`, `revoke`, `attendance`, `recording`, `start`, `end`, `join`, `leave`, `upload-video`, `add-summary`, `migrate`, `manage`, `permission-list`

---

## Access Control Hierarchy

### Three-Layer Authorization

Every protected endpoint follows this authorization flow:

```
1. JWT Validation
   └─> Token valid?

2. Role Check
   └─> User has role?

3. Permission Check
   └─> Role has permission?
```

### Example: Creating a Course

```
User wants: POST /api/courses
   ↓
Layer 1: Validate JWT token
   └─> Valid token? ✓
   ↓
Layer 2: Check user role
   └─> User has 'training_manager' or 'tenant_admin' role? ✓
   ↓
Layer 3: Check permission
   └─> Role 'training_manager' has 'courses.create'? ✓
   ↓
✅ Action ALLOWED - Create course
```

---

## Permission Scope

### Platform-Level Permissions

- **Applicable to**: superadmin, platform_admin
- **Categories**: tenants, licenses, admin, parts of users
- **Access**: System-wide across all tenants
- **Examples**: `tenants.create`, `licenses.tenants.renew`, `admin.users.view`

### Tenant-Level Permissions

- **Applicable to**: tenant_admin, training_manager, instructor, learner
- **Categories**: courses, modules, lessons, quizzes, live-classes, roles
- **Access**: Limited to user's tenant only
- **Examples**: `courses.create`, `quizzes.publish`, `live-classes.join`

---

## API Endpoint for Viewing Permissions

### Endpoint

```
GET /api/admin/permissions/predefined
```

### Access

- **Required Role**: `platform_admin`
- **Authentication**: JWT Bearer token required

### Response Format

```json
{
  "success": true,
  "totalPermissions": 71,
  "categories": {
    "auth": 4,
    "users": 6,
    "tenants": 5,
    "roles": 7,
    "courses": 8,
    "modules": 4,
    "lessons": 6,
    "quizzes": 8,
    "live-classes": 8,
    "licenses": 9,
    "admin": 4
  },
  "permissionsByCategory": {
    "courses": [
      {
        "id": "perm-123",
        "code": "courses.create",
        "name": "Create new course",
        "category": "courses"
      }
      // ... more permissions
    ]
    // ... other categories
  },
  "permissions": [
    // Flat array of all permissions
  ]
}
```

---

## Permission Assignment Workflow

### For Platform Admin Creating Custom Roles

1. Call `GET /api/admin/permissions/predefined` to view all 71 permissions
2. Select desired permissions by code
3. Call `POST /api/roles` to create role with selected permissions
4. Assign role to users as needed

### For Tenant Admin Creating Custom Roles

1. Can only assign permissions from tenant-level categories
2. Cannot grant platform-level permissions
3. System enforces this automatically

---

## Permission Immutability

✅ **Predefined permissions are immutable**

- Cannot be deleted
- Cannot be modified
- Cannot be created by users
- System-wide consistent

✅ **Custom Roles are mutable**

- Can be created by platform_admin or tenant_admin
- Can be modified or deleted
- Use predefined permissions as building blocks

---

## Security Notes

1. **Principle of Least Privilege**: Each role has minimum permissions needed
2. **Role Separation**: Platform vs Tenant roles are distinct
3. **Permission Granularity**: Permissions are specific to actions and categories
4. **No Direct Permission Assignment**: Users get permissions only through roles
5. **Audit Trail**: All permission assignments can be tracked through roles

---

## Related Documentation

- `RBAC_ARCHITECTURE.md` - Complete RBAC system architecture
- `PERMISSIONS_ENDPOINT_SUMMARY.md` - Permission viewing endpoint details
- Database Schema: `prisma/schema.prisma`
- Seed Script: `prisma/seed-rbac.ts`

---

**Last Updated**: December 5, 2025  
**Total Permissions**: 71  
**Total System Roles**: 6  
**Total Categories**: 11
