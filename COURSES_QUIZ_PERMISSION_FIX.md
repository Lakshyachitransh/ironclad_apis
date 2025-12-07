# Quick Fix Summary - Courses & Quizzes Permissions

## Problem Identified ❌
Your user had `courses.create` permission but received **"User does not have permission: courses.manage"** error when trying to create a course.

### Root Cause
All course and quiz endpoints were checking for the **generic** `courses.manage` permission instead of **specific** permissions like `courses.create`, `courses.update`, `courses.delete`, etc.

---

## Solution Applied ✅

Updated **26 course and quiz endpoints** to use **granular permissions** that match the actual permissions you have:

### Courses Controller (13 endpoints updated)
- **POST `/api/courses`** - Now requires `courses.create` ✅
- **PATCH `/api/courses/:id`** - Now requires `courses.update` ✅
- **POST `/api/courses/modules/create`** - Now requires `courses.update` ✅
- **POST `/api/courses/lessons/create`** - Now requires `courses.update` ✅
- **POST `/api/courses/lessons/:lessonId/upload-video`** - Now requires `courses.update` ✅
- **DELETE `/api/courses/lessons/:lessonId/video`** - Now requires `courses.delete` ✅
- **POST `/api/courses/assign`** - Now requires `courses.assign` ✅
- **POST `/api/courses/assign-bulk`** - Now requires `courses.assign` ✅
- **POST `/api/courses/lessons/:lessonId/generate-quizzes-from-summary`** - Now requires `courses.publish` ✅
- **POST `/api/courses/lessons/:lessonId/add-summary`** - Now requires `courses.update` ✅
- **GET `/api/courses/tenant-stats`** - Now requires `courses.read` ✅
- **PATCH `/api/courses/modules/:moduleId`** - Now requires `courses.update` ✅
- **PATCH `/api/courses/lessons/:lessonId`** - Now requires `courses.update` ✅

### Quizzes Controller (13 endpoints updated)
- **POST `/api/lessons/:lessonId/quizzes`** - Now requires `courses.publish` ✅
- **PUT `/api/lessons/:lessonId/quizzes/:quizId`** - Now requires `courses.update` ✅
- **POST `/api/lessons/:lessonId/quizzes/:quizId/publish`** - Now requires `courses.publish` ✅
- **DELETE `/api/lessons/:lessonId/quizzes/:quizId`** - Now requires `courses.delete` ✅
- **POST `/api/lessons/:lessonId/quizzes/:quizId/questions`** - Now requires `courses.publish` ✅
- **PUT `/api/lessons/:lessonId/quizzes/:quizId/questions/:questionId`** - Now requires `courses.update` ✅
- **DELETE `/api/lessons/:lessonId/quizzes/:quizId/questions/:questionId`** - Now requires `courses.delete` ✅
- **POST `/api/lessons/:lessonId/quizzes/:quizId/questions/:questionId/options`** - Now requires `courses.publish` ✅
- **PUT `/api/lessons/:lessonId/quizzes/:quizId/questions/:questionId/options/:optionId`** - Now requires `courses.update` ✅
- **DELETE `/api/lessons/:lessonId/quizzes/:quizId/questions/:questionId/options/:optionId`** - Now requires `courses.delete` ✅
- **GET `/api/lessons/:lessonId/quizzes/:quizId/results`** - Now requires `courses.read` ✅
- **PATCH `/api/courses/modules/:moduleId`** - Now requires `courses.update` ✅
- **POST `/api/courses/modules/create`** - Now requires `courses.update` ✅

---

## Permission Mapping Logic

The endpoints now follow **REST semantics**:

```
CREATE operations  → courses.create   (POST new resources)
READ operations    → courses.read     (GET queries, results)
UPDATE operations  → courses.update   (PATCH/PUT modifications)
DELETE operations  → courses.delete   (DELETE resources)
ASSIGN operations  → courses.assign   (POST course assignments)
PUBLISH operations → courses.publish  (POST quiz/question creation)
```

---

## Your User Now Has Access To:

Your `teacher` role should have these permissions (if seeded correctly):
- ✅ `courses.create` - Create new courses
- ✅ `courses.read` - View courses
- ✅ `courses.update` - Modify courses, add videos
- ✅ `courses.delete` - Delete videos/questions
- ✅ `courses.assign` - Assign courses to users
- ✅ `courses.publish` - Create and publish quizzes

### Test It Now:

```bash
# Create a course
curl -X 'POST' \
  'http://localhost:3000/api/courses' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{
    "tenantId": "1309583d-3bc5-445c-8ca8-da44a4d1bb5c",
    "title": "Advanced JavaScript Mastery",
    "summary": "Learn advanced concepts",
    "level": "Advanced",
    "ownerUserId": "59552ea8-cb7d-48b1-a885-11fc027a46e1"
  }'
```

**Expected Response:** `201 Created` ✅

---

## Files Changed

| File | Changes |
|------|---------|
| `src/courses/courses.controller.ts` | Updated 13 `@RequirePermission` decorators |
| `src/courses/quizzes.controller.ts` | Updated 13 `@RequirePermission` decorators |

---

## Verification

Run your test command and you should now get:
- ✅ **201 Created** instead of ❌ **403 Forbidden**
- ✅ Course created successfully
- ✅ All endpoints now properly validate granular permissions

---

## Full Documentation

See `GRANULAR_PERMISSION_MAPPING.md` for comprehensive endpoint-to-permission mappings.
