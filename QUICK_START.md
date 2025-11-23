# Quick Start Guide - Complete Learning Management System

## 📋 Overview

This guide walks you through the complete end-to-end flow of the Learning Management System including:

- Tenant and user management
- Course structure (modules, lessons)
- Course assignment
- Progress tracking
- Analytics

---

## 🚀 Quick Start (5 minutes)

### 1. Start the API Server

```bash
cd ironclad_apis

# Start development server
npm run start:dev

# Server will run on http://localhost:3000
```

### 2. Run the E2E Test

In a new terminal:

```bash
cd ironclad_apis

# Run comprehensive end-to-end test
npx ts-node test-e2e.ts
```

This will automatically:

- ✅ Create a new tenant
- ✅ Create 10 users
- ✅ Create a course with 2 modules and 6 lessons
- ✅ Assign the course to all users
- ✅ Simulate different user progress levels
- ✅ Check progress for all users
- ✅ Display tenant statistics
- ✅ Show user course views

---

## 📊 Key Endpoints

### Course Management

```
POST   /courses                           Create course
GET    /courses                           List courses
GET    /courses/:id                       Get course details
POST   /courses/modules/create            Create module
POST   /courses/lessons/create            Create lesson
```

### Course Assignment

```
POST   /courses/assign                    Assign course to users
POST   /courses/assign-bulk               Bulk assign multiple courses
GET    /courses/my-courses                Get user's assigned courses
```

### Progress Tracking

```
POST   /courses/lessons/:id/progress      Update lesson progress
GET    /courses/progress/:courseId        Get user progress for course
GET    /courses/tenant-stats              Get tenant statistics
```

---

## 🎯 Workflow Example

### Step 1: Create Tenant and Admin

```bash
# Create tenant
curl -X POST http://localhost:3000/tenants \
  -H "Content-Type: application/json" \
  -d '{"name": "Acme Corp"}'

# Create admin user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acme.com",
    "password": "Admin123!",
    "displayName": "Admin User"
  }'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@acme.com", "password": "Admin123!"}'
```

### Step 2: Create Users

```bash
# Create learner user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "learner@acme.com",
    "password": "Learner123!",
    "displayName": "Learner User"
  }'

# Add to tenant
curl -X POST http://localhost:3000/users/{userId}/add-to-tenant \
  -H "Authorization: Bearer {adminToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "{tenantId}",
    "roles": ["learner"]
  }'
```

### Step 3: Create Course Structure

```bash
# Create course
curl -X POST http://localhost:3000/courses \
  -H "Authorization: Bearer {adminToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "{tenantId}",
    "title": "JavaScript Fundamentals",
    "summary": "Learn JavaScript basics",
    "level": "Beginner"
  }'

# Create module
curl -X POST http://localhost:3000/courses/modules/create \
  -H "Authorization: Bearer {adminToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "{courseId}",
    "title": "Module 1: Basics",
    "displayOrder": 1
  }'

# Create lesson
curl -X POST http://localhost:3000/courses/lessons/create \
  -H "Authorization: Bearer {adminToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "moduleId": "{moduleId}",
    "title": "Lesson 1: Variables",
    "displayOrder": 1
  }'
```

### Step 4: Assign Course to User

```bash
curl -X POST http://localhost:3000/courses/assign \
  -H "Authorization: Bearer {adminToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "{tenantId}",
    "courseId": "{courseId}",
    "assignToUserIds": ["{userId}"],
    "dueDate": "2025-12-31T23:59:59Z"
  }'
```

### Step 5: User Watches Lesson and Records Progress

```bash
# Simulate user watching lesson for 30 minutes
curl -X POST http://localhost:3000/courses/lessons/{lessonId}/progress \
  -H "Authorization: Bearer {learnerToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "watchedDuration": 1800,
    "isCompleted": false
  }'

# Mark lesson as completed
curl -X POST http://localhost:3000/courses/lessons/{lessonId}/progress \
  -H "Authorization: Bearer {learnerToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "watchedDuration": 3600,
    "isCompleted": true
  }'
```

### Step 6: Check User Progress

```bash
# Get progress as learner
curl -X GET http://localhost:3000/courses/progress/{courseId} \
  -H "Authorization: Bearer {learnerToken}"

# Response:
{
  "userId": "...",
  "overallProgress": {
    "progressPercentage": 100,
    "lessonsCompleted": 1,
    "lessonsTotal": 6,
    "status": "in_progress"
  },
  "moduleProgress": [ ... ]
}
```

### Step 7: Get Tenant Statistics

```bash
# Get admin statistics
curl -X GET http://localhost:3000/courses/tenant-stats \
  -H "Authorization: Bearer {adminToken}"

# Response:
{
  "totalCourses": 1,
  "totalAssignments": 50,
  "totalUsers": 50,
  "averageProgress": 65,
  "userProgressByStatus": {
    "not_started": 15,
    "in_progress": 30,
    "completed": 5
  },
  "overdueAssignments": 2
}
```

---

## 📈 Data Models

### Tenant

```typescript
{
  id: UUID,
  name: string,
  status: "active",
  createdAt: Date
}
```

### Course

```typescript
{
  id: UUID,
  tenantId: UUID,
  title: string,
  summary?: string,
  level?: string,
  modules: Module[]
}
```

### Module

```typescript
{
  id: UUID,
  courseId: UUID,
  title: string,
  lessons: Lesson[]
}
```

### Lesson

```typescript
{
  id: UUID,
  moduleId: UUID,
  title: string,
  videoUrl?: string,
  videoDuration?: number
}
```

### CourseAssignment

```typescript
{
  id: UUID,
  courseId: UUID,
  assignedTo: UUID (userId),
  status: "assigned" | "started" | "completed",
  dueDate?: Date,
  assignedAt: Date,
  completedAt?: Date
}
```

### UserProgress

```typescript
{
  id: UUID,
  userId: UUID,
  courseId: UUID,
  progressPercentage: 0-100,
  lessonsCompleted: number,
  lessonsTotal: number,
  status: "not_started" | "in_progress" | "completed",
  startedAt?: Date,
  completedAt?: Date
}
```

### LessonProgress

```typescript
{
  id: UUID,
  userId: UUID,
  lessonId: UUID,
  watchedDuration: number (seconds),
  isCompleted: boolean,
  status: "not_started" | "in_progress" | "completed",
  completedAt?: Date
}
```

---

## 🔐 Authentication

All endpoints (except `/auth/register` and `/auth/login`) require a Bearer token.

### Get Token

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "...",
  "tenantId": "..."
}
```

### Use Token

```bash
curl -X GET http://localhost:3000/courses/my-courses \
  -H "Authorization: Bearer {token}"
```

---

## 👥 Roles

### Admin Roles

- `superadmin` - Full system access
- `org_admin` - Organization admin
- `training_manager` - Can create/manage courses and assign them

### User Roles

- `learner` - Can view assigned courses and track progress

---

## 📊 Progress Calculation

Progress is **automatically calculated** by the system:

```
Lesson Completion:
  - isCompleted when watchedDuration >= videoDuration
  - OR manually marked as complete

Module Completion:
  - (lessonsCompleted / lessonsTotal) * 100%

Course Completion:
  - (allLessonsCompleted / allLessonsTotal) * 100%
  - Status: 0% = not_started, 1-99% = in_progress, 100% = completed
```

---

## 🧪 Testing Endpoints

### Postman Collection

Import this collection into Postman for easy testing:

```json
{
  "info": { "name": "Learning Management System" },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/auth/register",
            "body": {
              "email": "user@test.com",
              "password": "Pass123!"
            }
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/auth/login",
            "body": {
              "email": "user@test.com",
              "password": "Pass123!"
            }
          }
        }
      ]
    }
  ]
}
```

---

## 🐛 Debugging

### Enable Verbose Logging

```bash
# Set debug flag
DEBUG=* npm run start:dev
```

### Check Database

```bash
# Open Prisma Studio
npx prisma studio

# Then navigate to http://localhost:5555
```

### View Logs

```bash
# Check last 100 lines of application logs
tail -100 logs/app.log
```

---

## 📚 Documentation

- **Course Management**: See `LIVE_CLASS_GUIDE.md`
- **Progress Tracking**: See `COURSE_ASSIGNMENT_PROGRESS_GUIDE.md`
- **E2E Testing**: See `E2E_TESTING_GUIDE.md`
- **API Reference**: Access `/api/docs` when server is running

---

## ✅ Verification Checklist

After following this guide, verify:

- [ ] API server running on port 3000
- [ ] Database connected and migrations applied
- [ ] Authentication working (can login)
- [ ] Can create tenant
- [ ] Can create users
- [ ] Can create course structure
- [ ] Can assign courses
- [ ] Can track progress
- [ ] Can retrieve progress
- [ ] Can view tenant statistics
- [ ] E2E test passes

---

## 🆘 Common Issues

| Issue                        | Solution                                             |
| ---------------------------- | ---------------------------------------------------- |
| "Connection refused"         | Start API server: `npm run start:dev`                |
| "Database connection failed" | Verify PostgreSQL is running and DATABASE_URL is set |
| "Auth token expired"         | Get new token by logging in again                    |
| "Tenant not found"           | Verify tenant ID is correct and belongs to user      |
| "User not assigned"          | Assign course first using `/courses/assign`          |
| "Progress not updating"      | Verify lesson exists and user is assigned to course  |

---

## 🎓 Learning Path

Follow this order to understand the system:

1. Read overview (this file)
2. Create a tenant and admin user
3. Create users and add to tenant
4. Create course structure (course → module → lesson)
5. Assign course to users
6. Simulate user progress
7. Check progress and statistics
8. Run full E2E test

---

## 📞 Support

For issues or questions:

1. Check the error message and documentation
2. Review E2E test for example implementation
3. Use Postman to test individual endpoints
4. Open Prisma Studio to inspect database
5. Check server logs for details

---

Generated: November 2025
Version: 1.0
