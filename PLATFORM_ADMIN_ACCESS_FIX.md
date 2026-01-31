# Platform Admin Course Access Fix

## Problem
Platform admins could not access courses for each tenant because:
1. Missing course-related permissions in the platform_admin role
2. Tenant validation blocking platform admins who don't have a `tenantId` (platform admins are not scoped to a single tenant)

## Solution Implemented

### 1. Added Missing Permissions ✅
Updated `prisma/seed-platform-admin-permissions.ts` to include all course-related permissions:
- `courses.read`, `courses.publish`, `courses.create`, `courses.update`, `courses.delete`, `courses.assign`, `courses.progress`
- `modules.read`, `modules.create`, `modules.update`, `modules.delete`
- `lessons.read`, `lessons.create`, `lessons.update`, `lessons.delete`, `lessons.upload-video`, `lessons.add-summary`
- `quizzes.read`, `quizzes.create`, `quizzes.update`, `quizzes.delete`, `quizzes.publish`, `quizzes.view`, `quizzes.attempt`, `quizzes.results`, `quizzes.generate`

**Applied via SQL:** `assign-course-permissions.sql`

### 2. Fixed Tenant Access Validation ✅
Updated `src/courses/courses.controller.ts`:
- Modified `validateTenantAccess()` method to:
  - Accept user object instead of just tenantId
  - Bypass tenant check for platform_admin role
  - Allow platform admins to access courses from any tenant
  
**Updated calls in:**
- `create()` - POST /courses
- `list()` - GET /courses
- `assignCourse()` - POST /courses/assign
- `assignBulkCourses()` - POST /courses/assign-bulk
- `generateAndSaveVideoSummary()` - POST /courses/ai/video-summary-to-lesson

### 3. Authorization Flow
```
Request from Platform Admin
    ↓
JWT Auth Guard (extracts roles: ['platform_admin'])
    ↓
Permission Guard (detects platform_admin → ALLOWS ALL)
    ↓
validateTenantAccess (detects platform_admin → BYPASSES)
    ↓
✅ Access Granted to All Tenants
```

## Result
✅ Platform admins now have **full access to courses across all tenants**
✅ Regular tenant users maintain their single-tenant access restrictions
✅ Permission inheritance and RBAC system remains intact

## How to Test
1. Login as platform_admin
2. Query courses with any tenant ID:
   ```
   GET /api/courses?tenantId=<any-tenant-id>
   Authorization: Bearer <platform-admin-token>
   ```
3. Create/assign/manage courses for any tenant
4. All endpoints should now work without "You do not have access to this tenant" error

## Files Modified
- `prisma/seed-platform-admin-permissions.ts` - Added missing permissions
- `src/courses/courses.controller.ts` - Fixed tenant validation logic
