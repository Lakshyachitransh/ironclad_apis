# End-to-End Testing Guide

## Overview

This E2E test validates the complete workflow of the course assignment and progress tracking system.

## What the Test Does

### Phase 1: Create Tenant & Admin

- Creates a new tenant
- Creates an admin user
- Assigns admin roles to the user

### Phase 2: Create 10 Users

- Registers 10 new users
- Adds each user to the tenant as learners

### Phase 3: Create Course Structure

- Creates 1 course: "Advanced JavaScript - E2E Test"
- Creates 2 modules in the course
- Creates 3 lessons per module (6 lessons total)
- Each lesson has a video duration (~60 min + increments)

### Phase 4: Assign Course to All Users

- Assigns the course to all 10 users
- Sets a 30-day due date
- Shows assignment summary

### Phase 5: Simulate User Progress

- Distributes users across progress levels:
  - Users 1-2: Not started (0%)
  - Users 3-4: Started (25%)
  - Users 5-7: In Progress (50%)
  - Users 8-9: Almost Complete (90%)
  - User 10: Not simulated

### Phase 6: Check User Progress

- Retrieves progress for all 10 users
- Shows detailed breakdown:
  - Progress percentage with visual bar
  - Lessons completed vs total
  - Start date and due date
  - Status (not_started, in_progress, completed)

### Phase 7: Check Tenant Statistics

- Retrieves tenant-wide analytics:
  - Total courses, assignments, users
  - Average progress percentage
  - Progress distribution (not_started, in_progress, completed)
  - Overdue assignments

### Phase 8: Check "My Courses" View

- Shows courses as seen by users
- Displays progress and due dates
- Validates user-facing API

---

## Prerequisites

1. **API Server Running**

   ```bash
   npm run start:dev
   ```

   Server should be running on `http://localhost:3000`

2. **Database Connected**
   - PostgreSQL should be running
   - `DATABASE_URL` environment variable set
   - Migrations should be applied

3. **Node & TypeScript**
   ```bash
   npm install
   ```

---

## Running the Test

### Option 1: Run with ts-node (Direct TypeScript)

```bash
npx ts-node test-e2e.ts
```

### Option 2: Compile and Run

```bash
# Compile TypeScript
npx tsc test-e2e.ts

# Run compiled JavaScript
node test-e2e.js
```

### Option 3: Add to npm scripts

Edit `package.json`:

```json
{
  "scripts": {
    "test:e2e": "ts-node test-e2e.ts"
  }
}
```

Then run:

```bash
npm run test:e2e
```

---

## Expected Output

### Successful Run

```
================================================================================
              END-TO-END TESTING - COURSE ASSIGNMENT & PROGRESS TRACKING
================================================================================

[→ TENANT] Creating new tenant... (4:35:42 PM)
[✓ TENANT] Created tenant: e2e-test-1734624942000 (ID: 550e8400-e29b-41d4-a716-446655440000) (4:35:42 PM)

[→ AUTH] Creating admin user... (4:35:43 PM)
[✓ AUTH] Admin user registered: admin-e2e-1734624942000@test.com (4:35:43 PM)

[→ AUTH] Admin logged in successfully (4:35:44 PM)
[✓ TENANT] Admin roles assigned (4:35:45 PM)

================================================================================
                            PHASE 2: CREATE 10 USERS
================================================================================

[→ USERS] [1/10] Registering user1...
[✓ USERS] [1/10] User1 created and added to tenant
[→ USERS] [2/10] Registering user2...
[✓ USERS] [2/10] User2 created and added to tenant
...

[✓ USERS] All 10 users created successfully!

================================================================================
                    PHASE 3: CREATE COURSE WITH MODULES & LESSONS
================================================================================

[→ COURSE] Creating course...
[✓ COURSE] Course created: Advanced JavaScript - E2E Test (ID: 123e4567-e89b-12d3-a456-426614174000)

[→ MODULE] Creating Module 1...
[→ LESSON]   Creating Lesson 1 in Module 1...
[✓ LESSON]     Lesson created: Lesson 1: Introduction
...

[✓ COURSE] Course structure complete: 2 modules × 3 lessons = 6 lessons total

================================================================================
                        PHASE 4: ASSIGN COURSE TO USERS
================================================================================

[→ ASSIGNMENT] Assigning course to 10 users...
[✓ ASSIGNMENT] Course assigned to all users
[ℹ ASSIGNMENT] Assignment ID: assignment-id-1
[✓ ASSIGNMENT] Summary: 10 newly assigned, 0 already assigned

================================================================================
                      PHASE 5: SIMULATE USER PROGRESS
================================================================================

[→ PROGRESS] User 1: Simulating Not Started (0/6 lessons)
[→ PROGRESS] User 2: Simulating Not Started (0/6 lessons)
[→ PROGRESS] User 3: Simulating Started (25%) (1/6 lessons)
  [✓ PROGRESS]   Lesson 1: COMPLETED
[→ PROGRESS] User 4: Simulating Started (25%) (1/6 lessons)
...

================================================================================
                        PHASE 6: CHECK USER PROGRESS
================================================================================

[→ PROGRESS] Retrieving progress for all users...

[→ PROGRESS] User 1: user1
           Status: NOT_STARTED
           Progress: ░░░░░░░░░░░░░░░░░░░░ 0%
           Lessons: 0/6
           Started: Not started

[→ PROGRESS] User 2: user2
           Status: NOT_STARTED
           Progress: ░░░░░░░░░░░░░░░░░░░░ 0%
           Lessons: 0/6
           Started: Not started

[→ PROGRESS] User 3: user3
           Status: IN_PROGRESS
           Progress: ████░░░░░░░░░░░░░░░░ 25%
           Lessons: 1/6
           Started: 11/19/2025
           Due: 12/19/2025 (30 days left)
...

================================================================================
                      PHASE 7: CHECK TENANT STATISTICS
================================================================================

[→ STATS] Retrieving tenant-wide statistics...

=== TENANT STATISTICS ===

Total Courses:        1
Total Assignments:    10
Total Users:          10
Average Progress:     40
Overdue:              0

Progress Distribution:
  Not Started:       2
  In Progress:       3
  Completed:         0

================================================================================
                    PHASE 8: CHECK MY COURSES (USER VIEW)
================================================================================

[→ COURSES] Checking "My Courses" for each user...

[→ COURSES] User 1 Assigned Courses: 1
  [1] Advanced JavaScript - E2E Test
      ░░░░░░░░░░░░░░░░░░░░ 0% (0/6)
      Status: not_started

[→ COURSES] User 2 Assigned Courses: 1
  [1] Advanced JavaScript - E2E Test
      ░░░░░░░░░░░░░░░░░░░░ 0% (0/6)
      Status: not_started

[→ COURSES] User 3 Assigned Courses: 1
  [1] Advanced JavaScript - E2E Test
      ████░░░░░░░░░░░░░░░░ 25% (1/6)
      Status: in_progress

================================================================================
                    ✓ ALL TESTS COMPLETED SUCCESSFULLY
================================================================================

Test Summary:
  Tenant ID:        550e8400-e29b-41d4-a716-446655440000
  Course ID:        123e4567-e89b-12d3-a456-426614174000
  Users Created:    10
  Lessons Created:  6
  Progress Tracked: ✓
```

---

## Test Validation

The test validates:

✅ **Tenant Management**

- Create new tenant
- Assign users to tenant
- Assign roles to users

✅ **User Management**

- Register multiple users
- Login and token generation
- Tenant association

✅ **Course Structure**

- Create courses
- Create modules
- Create lessons
- Hierarchical organization

✅ **Course Assignment**

- Bulk assign to multiple users
- Auto-create progress records
- Duplicate prevention
- Due date handling

✅ **Progress Tracking**

- Lesson progress updates
- Automatic percentage calculation
- Per-module tracking
- Timestamp recording

✅ **User Progress Retrieval**

- Get detailed progress per course
- Show module breakdown
- Show lesson details
- Show assignment info

✅ **Tenant Analytics**

- Count courses, assignments, users
- Calculate average progress
- Show progress distribution
- Track overdue assignments

✅ **User View**

- Get assigned courses list
- Show progress per course
- Show due dates
- Show status

---

## Troubleshooting

### "Connection refused"

- Check if API server is running on port 3000
- Start with: `npm run start:dev`

### "User already exists" errors

- These are expected if running test multiple times
- Test automatically skips existing users

### "Tenant not found" errors

- Verify database connection
- Check migrations have been applied
- Run: `npx prisma migrate deploy`

### "Auth token expired"

- Test reuses tokens within a single run
- Each phase completes within a few minutes
- If test takes >24 hours, tokens may expire

### No progress showing

- Verify lesson progress API is working
- Check database has progress records
- Run: `npx prisma studio` to inspect data

---

## Database Inspection

To manually verify test data:

```bash
# Open Prisma Studio
npx prisma studio

# Or query directly with psql
psql -U postgres -d ironclad

-- View courses
SELECT * FROM "Course";

-- View assignments
SELECT * FROM "CourseAssignment";

-- View user progress
SELECT * FROM "UserProgress";

-- View lesson progress
SELECT * FROM "LessonProgress";
```

---

## Performance Notes

- Test takes ~2-3 minutes to complete
- 10 users + 6 lessons = 60 progress records created
- ~50+ API calls executed
- Database queries optimized with indexes

---

## Next Steps

After successful E2E test:

1. **Integration Testing**
   - Test error scenarios
   - Test permission boundaries
   - Test data validation

2. **Load Testing**
   - Test with 100+ users
   - Test with 1000+ lessons
   - Measure response times

3. **Monitoring**
   - Set up logging
   - Track API response times
   - Monitor database queries

---

## Support

If test fails:

1. Check error message in console
2. Verify all prerequisites are met
3. Check API server logs for details
4. Review database with Prisma Studio
5. Check network connectivity
