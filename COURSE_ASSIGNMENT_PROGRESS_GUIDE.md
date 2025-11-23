# Course Assignment & Progress Tracking API Guide

## Overview

The Course Assignment and Progress Tracking system allows organizations to assign courses to users, track their learning progress in real-time, and gather analytics on course completion.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              Course Assignment & Progress System                │
└─────────────────────────────────────────────────────────────────┘

ASSIGNMENT FLOW:
├─ Admin assigns course(s) to user(s)
├─ System creates CourseAssignment records
├─ System creates UserProgress records (one per user per course)
└─ System creates LessonProgress records (one per user per lesson)

PROGRESS TRACKING:
├─ User watches lesson video
├─ Frontend sends progress update
├─ System tracks:
│  ├─ Watched duration (seconds)
│  ├─ Completion status
│  └─ Timestamps
└─ System auto-calculates:
   ├─ Lesson completion %
   ├─ Module completion %
   └─ Course completion %

ANALYTICS:
├─ Individual user progress
├─ Per-course statistics
├─ Tenant-wide statistics
└─ Overdue assignment tracking
```

---

## Database Models

### CourseAssignment

```typescript
{
  id: UUID,
  tenantId: UUID,
  courseId: UUID,
  assignedTo: UUID (user ID),
  assignedBy: UUID (admin/manager user ID),
  status: 'assigned' | 'started' | 'completed' | 'expired',
  dueDate: Date (optional),
  assignedAt: Date,
  completedAt: Date (null until completed),
  createdAt: Date,
  updatedAt: Date
}
```

### UserProgress

```typescript
{
  id: UUID,
  tenantId: UUID,
  userId: UUID,
  courseId: UUID,
  courseAssignmentId: UUID,
  lessonsCompleted: Int,
  lessonsTotal: Int,
  progressPercentage: Float (0-100),
  status: 'not_started' | 'in_progress' | 'completed',
  startedAt: Date (null until first lesson started),
  completedAt: Date (null until 100% complete),
  lastAccessedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### LessonProgress

```typescript
{
  id: UUID,
  tenantId: UUID,
  userId: UUID,
  lessonId: UUID,
  userProgressId: UUID,
  watchedDuration: Int (seconds),
  isCompleted: Boolean,
  status: 'not_started' | 'in_progress' | 'completed',
  startedAt: Date,
  completedAt: Date (null until completion),
  lastAccessedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Endpoints

### 1. Assign Course to Users

**Endpoint:**

```
POST /courses/assign
Authorization: Bearer <token>
Content-Type: application/json
```

**Required Role:** `training_manager` or `org_admin`

**Request Body:**

```json
{
  "tenantId": "456e7890-e89b-12d3-a456-426614174000",
  "courseId": "123e4567-e89b-12d3-a456-426614174000",
  "assignToUserIds": ["user-id-1", "user-id-2", "user-id-3"],
  "dueDate": "2025-12-31T23:59:59Z"
}
```

**Response (201):**

```json
{
  "courseId": "123e4567-e89b-12d3-a456-426614174000",
  "course": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Advanced JavaScript",
    "lessonsTotal": 24
  },
  "assignedToCount": 3,
  "results": [
    {
      "userId": "user-id-1",
      "status": "assigned",
      "assignmentId": "assignment-id-1",
      "progressId": "progress-id-1"
    },
    {
      "userId": "user-id-2",
      "status": "already_assigned",
      "assignmentId": "assignment-id-2"
    },
    {
      "userId": "user-id-3",
      "status": "assigned",
      "assignmentId": "assignment-id-3",
      "progressId": "progress-id-3"
    }
  ],
  "dueDate": "2025-12-31T23:59:59Z"
}
```

**Features:**

- ✅ Bulk assignment to multiple users
- ✅ Duplicate detection (returns 'already_assigned')
- ✅ Automatic UserProgress creation
- ✅ Optional due date
- ✅ Tracks who assigned it (assignedBy)

---

### 2. Bulk Assign Multiple Courses

**Endpoint:**

```
POST /courses/assign-bulk
Authorization: Bearer <token>
Content-Type: application/json
```

**Required Role:** `training_manager` or `org_admin`

**Request Body:**

```json
{
  "tenantId": "456e7890-e89b-12d3-a456-426614174000",
  "courseIds": ["course-id-1", "course-id-2", "course-id-3"],
  "assignToUserIds": ["user-id-1", "user-id-2"],
  "dueDate": "2025-12-31T23:59:59Z"
}
```

**Response (201):**

```json
{
  "totalCoursesAssigned": 3,
  "totalUsersAssigned": 2,
  "results": [
    {
      "courseId": "course-id-1",
      "course": { ... },
      "assignedToCount": 2,
      "results": [ ... ]
    },
    ...
  ]
}
```

---

### 3. Get User Course Progress

**Endpoint:**

```
GET /courses/progress/:courseId
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "userId": "user-id-123",
  "course": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Advanced JavaScript"
  },
  "overallProgress": {
    "status": "in_progress",
    "progressPercentage": 45,
    "lessonsCompleted": 11,
    "lessonsTotal": 24,
    "startedAt": "2025-11-15T10:00:00Z",
    "completedAt": null,
    "lastAccessedAt": "2025-11-19T14:30:00Z"
  },
  "assignment": {
    "dueDate": "2025-12-31T23:59:59Z",
    "assignedAt": "2025-11-15T09:00:00Z",
    "completedAt": null,
    "status": "assigned"
  },
  "moduleProgress": [
    {
      "module": {
        "id": "mod-1",
        "title": "Module 1: Basics"
      },
      "lessons": [
        {
          "lessonId": "les-1",
          "lessonTitle": "Lesson 1: Introduction",
          "status": "completed",
          "watchedDuration": 3600,
          "totalDuration": 3600,
          "isCompleted": true,
          "completedAt": "2025-11-15T11:00:00Z",
          "startedAt": "2025-11-15T10:00:00Z"
        },
        {
          "lessonId": "les-2",
          "lessonTitle": "Lesson 2: Deep Dive",
          "status": "in_progress",
          "watchedDuration": 1200,
          "totalDuration": 3600,
          "isCompleted": false,
          "completedAt": null,
          "startedAt": "2025-11-19T14:00:00Z"
        }
      ]
    }
  ]
}
```

**Details:**

- Shows per-module breakdown
- Shows per-lesson progress
- Includes watched duration vs total video length
- Shows completion timestamps

---

### 4. Get User's Assigned Courses

**Endpoint:**

```
GET /courses/my-courses?status=in_progress
Authorization: Bearer <token>
```

**Query Parameters:**

- `status` (optional): Filter by `assigned`, `started`, `completed`, or `expired`

**Response (200):**

```json
[
  {
    "assignmentId": "assignment-id-1",
    "course": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Advanced JavaScript",
      "summary": "Master advanced JS concepts",
      "level": "Advanced"
    },
    "assignmentStatus": "started",
    "dueDate": "2025-12-31T23:59:59Z",
    "assignedAt": "2025-11-15T09:00:00Z",
    "completedAt": null,
    "progress": {
      "progressPercentage": 45,
      "lessonsCompleted": 11,
      "lessonsTotal": 24,
      "status": "in_progress"
    }
  },
  {
    "assignmentId": "assignment-id-2",
    "course": {
      "id": "course-id-2",
      "title": "React Fundamentals",
      "summary": "Learn React basics",
      "level": "Beginner"
    },
    "assignmentStatus": "assigned",
    "dueDate": "2025-12-15T23:59:59Z",
    "assignedAt": "2025-11-10T09:00:00Z",
    "completedAt": null,
    "progress": {
      "progressPercentage": 0,
      "lessonsCompleted": 0,
      "lessonsTotal": 18,
      "status": "not_started"
    }
  }
]
```

---

### 5. Update Lesson Progress

**Endpoint:**

```
POST /courses/lessons/:lessonId/progress
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "watchedDuration": 1800,
  "isCompleted": false
}
```

**Response (200):**

```json
{
  "lessonProgress": {
    "lessonId": "les-1",
    "status": "in_progress",
    "watchedDuration": 1800,
    "isCompleted": false,
    "completedAt": null
  },
  "courseProgress": {
    "progressPercentage": 25,
    "lessonsCompleted": 6,
    "lessonsTotal": 24,
    "status": "in_progress"
  }
}
```

**Features:**

- ✅ Tracks seconds watched
- ✅ Marks completion when video fully watched
- ✅ Auto-calculates course progress
- ✅ Updates timestamps
- ✅ Takes max of current vs previous watched duration

---

### 6. Get Tenant Statistics

**Endpoint:**

```
GET /courses/tenant-stats
Authorization: Bearer <token>
```

**Required Role:** `training_manager` or `org_admin`

**Response (200):**

```json
{
  "totalCourses": 15,
  "totalAssignments": 150,
  "totalUsers": 50,
  "averageProgress": 62,
  "userProgressByStatus": {
    "not_started": 25,
    "in_progress": 20,
    "completed": 5
  },
  "overdueAssignments": 8
}
```

**Metrics:**

- **totalCourses**: Active courses in the tenant
- **totalAssignments**: Total course assignments
- **totalUsers**: Users with at least one course assignment
- **averageProgress**: Average completion percentage across all users
- **userProgressByStatus**: Distribution of users by status
- **overdueAssignments**: Assignments with past due date and not completed

---

## Workflow Examples

### Example 1: Admin Assigns Course to Training Group

```bash
# 1. Admin gets tenant and course info
GET /courses?tenantId=tenant-1

# 2. Admin gets list of users to assign to
GET /users?tenantId=tenant-1

# 3. Admin assigns course to group
POST /courses/assign
{
  "tenantId": "tenant-1",
  "courseId": "course-1",
  "assignToUserIds": ["user-1", "user-2", "user-3", "user-4"],
  "dueDate": "2025-12-31T23:59:59Z"
}

# System creates:
# - 4x CourseAssignment records
# - 4x UserProgress records (one per user per course)
# - 4x 24 LessonProgress records (one per user per lesson)
```

### Example 2: User Tracks Progress While Watching

```bash
# 1. User starts course
GET /courses/my-courses
# Shows: 0% complete, 0/24 lessons

# 2. User watches first lesson (30 minutes in)
POST /courses/lessons/les-1/progress
{
  "watchedDuration": 1800,
  "isCompleted": false
}
# Response: 4% complete, 0/24 lessons

# 3. User finishes first lesson
POST /courses/lessons/les-1/progress
{
  "watchedDuration": 3600,
  "isCompleted": true
}
# Response: 4% complete, 1/24 lessons, lesson marked completed

# 4. User checks progress
GET /courses/progress/course-1
# Returns:
# - Overall: 4% complete
# - Module 1: 1 of 3 lessons done
# - Lesson 1: 100% watched, completed
```

### Example 3: Admin Reviews Completion Stats

```bash
# Get overall tenant statistics
GET /courses/tenant-stats
# Returns:
# - 15 courses active
# - 150 total assignments
# - 50 users assigned
# - 62% average completion
# - 25 users not started
# - 20 users in progress
# - 5 users completed
# - 8 assignments overdue
```

---

## Progress Calculation Logic

### Lesson Completion

```
A lesson is "completed" when:
- isCompleted = true
- watchedDuration >= videoDuration (or manually marked complete)
```

### Module Completion

```
Calculated from all lessons in module:
moduleProgress = (lessonsCompleted / lessonsTotal) * 100%
```

### Course Completion

```
Calculated from all lessons in all modules:
courseProgress = (lessonsCompleted / lessonsTotal) * 100%
Status changes:
- 0% → "not_started"
- 1-99% → "in_progress"
- 100% → "completed"
```

---

## Error Handling

### Common Errors

```json
// 400: Course not in tenant
{
  "statusCode": 400,
  "message": "Course does not belong to this tenant",
  "error": "Bad Request"
}

// 400: Duplicate assignment
{
  "statusCode": 200,
  "results": [
    {
      "userId": "user-1",
      "status": "already_assigned",
      "assignmentId": "existing-id"
    }
  ]
}

// 404: User not assigned
{
  "statusCode": 404,
  "message": "User has not been assigned this course",
  "error": "Not Found"
}

// 403: Tenant access denied
{
  "statusCode": 403,
  "message": "Access denied",
  "error": "Forbidden"
}
```

---

## Best Practices

1. **Bulk Assignment**
   - Use `/courses/assign-bulk` for multiple courses
   - More efficient than multiple individual requests

2. **Progress Tracking**
   - Update progress every 30-60 seconds while watching
   - Send final update when user completes lesson
   - Include watchedDuration to resume where user left off

3. **User Experience**
   - Show progress percentage in UI
   - Display lessons by module
   - Allow resume from last watched position

4. **Analytics**
   - Check `/courses/tenant-stats` regularly
   - Monitor overdueAssignments
   - Review userProgressByStatus distribution

5. **Data Integrity**
   - Progress is auto-calculated, never manually set
   - Completion is immutable (no reverting)
   - Due dates help with assignment lifecycle

---

## Real-Time Dashboard Example

```typescript
// Frontend polling for user progress
async function refreshUserProgress(courseId: string) {
  const progress = await fetch(`/courses/progress/${courseId}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());

  return {
    overall: `${progress.overallProgress.progressPercentage}% complete`,
    lessons: `${progress.overallProgress.lessonsCompleted} of ${progress.overallProgress.lessonsTotal}`,
    modules: progress.moduleProgress.map((m) => ({
      name: m.module.title,
      completed: m.lessons.filter((l) => l.isCompleted).length,
      total: m.lessons.length,
      progress: `${Math.round((m.lessons.filter((l) => l.isCompleted).length / m.lessons.length) * 100)}%`,
    })),
    nextLesson: progress.moduleProgress
      .flatMap((m) => m.lessons)
      .find((l) => !l.isCompleted),
    daysUntilDue: Math.ceil(
      (new Date(progress.assignment.dueDate) - new Date()) /
        (1000 * 60 * 60 * 24),
    ),
  };
}
```

---

## Summary

The Course Assignment & Progress Tracking system provides:

✅ **Course Assignment**

- Single and bulk assignment to users
- Optional due dates
- Duplicate prevention

✅ **Progress Tracking**

- Per-lesson video tracking
- Module completion calculation
- Auto-calculated course progress

✅ **Analytics**

- Individual user progress views
- Tenant-wide statistics
- Overdue assignment tracking

✅ **Real-time Updates**

- Watched duration tracking
- Live progress percentage
- Timestamp recording

✅ **Scalability**

- Supports thousands of users
- Efficient database queries with indexing
- Bulk operations for large assignments
