# End-to-End Testing Complete Guide

This guide covers comprehensive end-to-end testing for the IronClad APIs system, including authentication, courses, lessons, video processing, quizzes, permissions, and AI features.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Authentication Flow](#authentication-flow)
3. [Course Management](#course-management)
4. [Lesson Management](#lesson-management)
5. [Video Processing & Summaries](#video-processing--summaries)
6. [Quiz Generation](#quiz-generation)
7. [Permission Testing](#permission-testing)
8. [Complete User Journey](#complete-user-journey)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js** 18+ with npm
- **FFmpeg** (for video processing)
  ```powershell
  winget install BtbN.FFmpeg.GPL.8.0
  ```
- **PostMan** or **Insomnia** (for API testing)
- **PostgreSQL** (for database)

### Environment Setup
```bash
cd c:\Users\DELL\OneDrive\Desktop\ironclad_apis\ironclad_apis

# Install dependencies
npm install

# Configure environment variables
# Create .env file with:
OPENAI_API_KEY=your_openai_key_here
DATABASE_URL=postgresql://user:password@localhost:5432/ironclad
AWS_REGION=eu-north-1
# (AWS credentials will use default profile from system)

# Run migrations
npm run migrate

# Start the server
npm run start:dev
```

### Base URLs
- **Local Development**: `http://localhost:3000`
- **API Documentation**: `http://localhost:3000/api/docs`
- **Production**: Your deployed URL

---

## Authentication Flow

### 1. User Registration

**Endpoint**: `POST /api/auth/register`

```json
{
  "email": "testuser@example.com",
  "password": "SecurePassword123!",
  "firstName": "Test",
  "lastName": "User",
  "tenantId": "tenant-001"
}
```

**Expected Response** (201 Created):
```json
{
  "id": "user-uuid",
  "email": "testuser@example.com",
  "firstName": "Test",
  "lastName": "User",
  "tenantId": "tenant-001",
  "roles": ["student"]
}
```

### 2. User Login

**Endpoint**: `POST /api/auth/login`

```json
{
  "email": "testuser@example.com",
  "password": "SecurePassword123!"
}
```

**Expected Response** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "email": "testuser@example.com",
    "roles": ["student"],
    "tenantId": "tenant-001"
  }
}
```

### 3. Save Tokens for Subsequent Requests

Use the `accessToken` in the `Authorization` header for all authenticated requests:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Refresh Token (when access token expires)

**Endpoint**: `POST /api/auth/refresh`

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Course Management

### 1. Create a Course

**Endpoint**: `POST /api/courses`

**Headers**:
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Body**:
```json
{
  "title": "Advanced TypeScript",
  "description": "Learn advanced TypeScript concepts and patterns",
  "category": "Programming",
  "difficulty": "advanced",
  "tenantId": "tenant-001"
}
```

**Expected Response** (201 Created):
```json
{
  "id": "course-uuid",
  "title": "Advanced TypeScript",
  "description": "Learn advanced TypeScript concepts and patterns",
  "category": "Programming",
  "difficulty": "advanced",
  "tenantId": "tenant-001",
  "createdAt": "2025-12-07T10:00:00Z",
  "modules": []
}
```

**Save**: Course ID for use in subsequent tests

### 2. Get All Courses

**Endpoint**: `GET /api/courses`

**Expected Response**: List of all courses with pagination

### 3. Get Course by ID

**Endpoint**: `GET /api/courses/{courseId}`

### 4. Update Course

**Endpoint**: `PATCH /api/courses/{courseId}`

```json
{
  "title": "Advanced TypeScript - Updated",
  "description": "Updated description"
}
```

---

## Lesson Management

### 1. Create Module

**Endpoint**: `POST /api/courses/modules/create`

**Body**:
```json
{
  "courseId": "course-uuid",
  "title": "Module 1: Basics",
  "description": "Introduction to TypeScript basics",
  "displayOrder": 1,
  "tenantId": "tenant-001"
}
```

**Expected Response** (201 Created):
```json
{
  "id": "module-uuid",
  "courseId": "course-uuid",
  "title": "Module 1: Basics",
  "description": "Introduction to TypeScript basics",
  "displayOrder": 1,
  "lessons": []
}
```

**Save**: Module ID

### 2. Create Lesson

**Endpoint**: `POST /api/courses/lessons/create`

**Body**:
```json
{
  "moduleId": "module-uuid",
  "title": "Lesson 1: Type Basics",
  "description": "Understanding basic types in TypeScript",
  "content": "TypeScript introduces type annotations...",
  "displayOrder": 1,
  "tenantId": "tenant-001"
}
```

**Expected Response** (201 Created):
```json
{
  "id": "lesson-uuid",
  "moduleId": "module-uuid",
  "title": "Lesson 1: Type Basics",
  "description": "Understanding basic types in TypeScript",
  "content": "TypeScript introduces type annotations...",
  "displayOrder": 1,
  "videoUrl": null,
  "videoSummary": null,
  "createdAt": "2025-12-07T10:05:00Z"
}
```

**Save**: Lesson ID

### 3. Upload Video to Lesson

**Endpoint**: `POST /api/courses/lessons/{lessonId}/upload-video`

**Headers**:
```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Form Data**:
- `file`: Select video file from your system
- `videoUrl`: (Alternative) S3 URL if uploading to S3

**Expected Response**:
```json
{
  "id": "lesson-uuid",
  "videoUrl": "https://iron-clad-lesson.s3.eu-north-1.amazonaws.com/videos/...",
  "message": "Video uploaded successfully"
}
```

**Save**: Video URL (if using S3)

---

## Video Processing & Summaries

### 1. Generate Video Summary from S3 URL

**Endpoint**: `POST /api/courses/ai/video-summary`

**Body**:
```json
{
  "videoUrl": "https://iron-clad-lesson.s3.eu-north-1.amazonaws.com/videos/cc698829-cff8-40b0-a058-7c901e01d4ec/ef17688d-19c1-48e1-9b4f-3d4038f236b8-1765034832084.mp4",
  "videoTitle": "Advanced TypeScript Concepts"
}
```

**Processing Steps**:
1. Downloads video from S3 (using AWS SDK authentication)
2. Extracts audio with FFmpeg
3. Transcribes with OpenAI Whisper API
4. Generates summary with GPT-4-turbo

**Expected Response** (200 OK):
```json
{
  "summary": "This video covers advanced TypeScript concepts including generics, decorators, and utility types...",
  "duration": 45,
  "keyPoints": [
    "Generics allow writing reusable components",
    "Decorators are a powerful metaprogramming feature",
    "Utility types simplify type manipulation"
  ]
}
```

**Time**: ~60-120 seconds depending on video length

**Save**: Summary text for later use

### 2. Save Summary to Lesson

**Endpoint**: `POST /api/courses/lessons/{lessonId}/add-summary`

**Body**:
```json
{
  "summary": "This video covers advanced TypeScript concepts including generics, decorators, and utility types...",
  "courseId": "course-uuid"
}
```

**Expected Response** (200 OK):
```json
{
  "id": "lesson-uuid",
  "videoSummary": "This video covers advanced TypeScript concepts...",
  "message": "Summary added successfully"
}
```

---

## Quiz Generation

### Option 1: Generate from Stored Summary (Recommended)

**Endpoint**: `POST /api/courses/ai/video-quiz`

**Prerequisites**:
- Lesson must have a stored `videoSummary` (added via `/add-summary` endpoint)

**Body**:
```json
{
  "lessonId": "lesson-uuid",
  "courseId": "course-uuid"
}
```

**Expected Response** (201 Created):
```json
{
  "quizzes": [
    {
      "question": "What is a generic in TypeScript?",
      "options": [
        "A way to write reusable components",
        "A design pattern",
        "A programming language",
        "An error handler"
      ],
      "correctAnswer": 0,
      "explanation": "Generics allow writing components that work with various types while maintaining type safety"
    },
    {
      "question": "How are decorators applied in TypeScript?",
      "options": [
        "Using the @ symbol",
        "Using the # symbol",
        "Using the $ symbol",
        "Using the & symbol"
      ],
      "correctAnswer": 0,
      "explanation": "Decorators in TypeScript use the @ symbol prefix when applied to classes, methods, or properties"
    }
  ]
}
```

**Time**: ~10-20 seconds (much faster than from video)

### Option 2: Generate Quizzes from Summary Endpoint

**Endpoint**: `POST /api/courses/lessons/{lessonId}/generate-quizzes-from-summary`

**Body**:
```json
{
  "courseId": "course-uuid"
}
```

---

## Quiz Management

### 1. Get All Quizzes for Lesson

**Endpoint**: `GET /api/courses/lessons/{lessonId}/quizzes`

**Expected Response**:
```json
[
  {
    "id": "quiz-uuid",
    "lessonId": "lesson-uuid",
    "topic": "Advanced TypeScript",
    "totalQuestions": 6,
    "published": false,
    "questions": [
      {
        "id": "question-uuid",
        "questionText": "What is a generic in TypeScript?",
        "displayOrder": 1,
        "options": [...]
      }
    ],
    "createdAt": "2025-12-07T10:15:00Z"
  }
]
```

### 2. Get Specific Quiz

**Endpoint**: `GET /api/courses/quizzes/{quizId}`

### 3. Publish Quiz

**Endpoint**: `POST /api/courses/quizzes/{quizId}/publish`

```json
{
  "lessonId": "lesson-uuid"
}
```

### 4. Take Quiz (Start Attempt)

**Endpoint**: `POST /api/lessons/{lessonId}/quizzes/{quizId}/start`

**Expected Response**:
```json
{
  "attemptId": "attempt-uuid",
  "quizId": "quiz-uuid",
  "userId": "user-uuid",
  "startedAt": "2025-12-07T10:20:00Z",
  "questions": [
    {
      "id": "question-uuid",
      "questionText": "What is a generic in TypeScript?",
      "options": ["Option A", "Option B", "Option C", "Option D"]
    }
  ]
}
```

**Save**: Attempt ID

### 5. Submit Quiz Answers

**Endpoint**: `POST /api/lessons/{lessonId}/quizzes/{quizId}/attempts/{attemptId}/answers`

**Body**:
```json
{
  "answers": [
    {
      "questionId": "question-uuid-1",
      "selectedOption": 0
    },
    {
      "questionId": "question-uuid-2",
      "selectedOption": 2
    }
  ]
}
```

### 6. Submit Quiz (Complete Attempt)

**Endpoint**: `POST /api/lessons/{lessonId}/quizzes/{quizId}/attempts/{attemptId}/submit`

**Expected Response**:
```json
{
  "attemptId": "attempt-uuid",
  "score": 75,
  "totalQuestions": 6,
  "correctAnswers": 4,
  "passed": true,
  "completedAt": "2025-12-07T10:25:00Z",
  "results": [
    {
      "questionId": "question-uuid-1",
      "userAnswer": 0,
      "correctAnswer": 0,
      "isCorrect": true
    }
  ]
}
```

---

## Permission Testing

### 1. Check Available Permissions

**Endpoint**: `GET /api/permissions/available`

**Expected Response**:
```json
{
  "permissions": [
    {
      "code": "courses.create",
      "description": "Create new courses",
      "category": "courses"
    },
    {
      "code": "courses.read",
      "description": "View courses",
      "category": "courses"
    },
    {
      "code": "courses.update",
      "description": "Update courses",
      "category": "courses"
    },
    {
      "code": "courses.delete",
      "description": "Delete courses",
      "category": "courses"
    }
  ]
}
```

### 2. Get Permissions by Category

**Endpoint**: `GET /api/permissions/by-category?category=courses`

### 3. Validate Permission

**Endpoint**: `POST /api/permissions/validate`

**Body**:
```json
{
  "permission": "courses.create",
  "userId": "user-uuid",
  "courseId": "course-uuid"
}
```

---

## Complete User Journey

### Full Test Scenario: Create Course → Add Video → Generate Summary → Create Quizzes → Take Quiz

#### Step 1: Register User (30 seconds)
```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "e2e.test@example.com",
  "password": "TestPassword123!",
  "firstName": "E2E",
  "lastName": "Tester",
  "tenantId": "tenant-e2e-001"
}
```

Save the returned user ID and tokens.

#### Step 2: Create Course (5 seconds)
```bash
POST http://localhost:3000/api/courses
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "title": "E2E Test Course",
  "description": "Full end-to-end testing course",
  "category": "Testing",
  "difficulty": "beginner",
  "tenantId": "tenant-e2e-001"
}
```

Save course ID.

#### Step 3: Create Module (5 seconds)
```bash
POST http://localhost:3000/api/courses/modules/create
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "courseId": "{courseId}",
  "title": "Module 1: Testing Basics",
  "description": "Introduction to E2E testing",
  "displayOrder": 1,
  "tenantId": "tenant-e2e-001"
}
```

Save module ID.

#### Step 4: Create Lesson (5 seconds)
```bash
POST http://localhost:3000/api/courses/lessons/create
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "moduleId": "{moduleId}",
  "title": "Lesson 1: E2E Testing Fundamentals",
  "description": "Learn the basics of E2E testing",
  "content": "E2E testing ensures your application works end-to-end...",
  "displayOrder": 1,
  "tenantId": "tenant-e2e-001"
}
```

Save lesson ID.

#### Step 5: Generate Video Summary (60-120 seconds)
```bash
POST http://localhost:3000/api/courses/ai/video-summary
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "videoUrl": "https://iron-clad-lesson.s3.eu-north-1.amazonaws.com/videos/cc698829-cff8-40b0-a058-7c901e01d4ec/ef17688d-19c1-48e1-9b4f-3d4038f236b8-1765034832084.mp4",
  "videoTitle": "E2E Testing Masterclass"
}
```

Save the summary.

#### Step 6: Save Summary to Lesson (5 seconds)
```bash
POST http://localhost:3000/api/courses/lessons/{lessonId}/add-summary
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "summary": "{summaryFromStep5}",
  "courseId": "{courseId}"
}
```

#### Step 7: Generate Quizzes from Summary (10-20 seconds)
```bash
POST http://localhost:3000/api/courses/ai/video-quiz
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "lessonId": "{lessonId}",
  "courseId": "{courseId}"
}
```

Save the quiz ID from response.

#### Step 8: Get Quizzes (5 seconds)
```bash
GET http://localhost:3000/api/courses/lessons/{lessonId}/quizzes
Authorization: Bearer {accessToken}
```

Verify quizzes were created.

#### Step 9: Publish Quiz (5 seconds)
```bash
POST http://localhost:3000/api/courses/quizzes/{quizId}/publish
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "lessonId": "{lessonId}"
}
```

#### Step 10: Start Quiz (5 seconds)
```bash
POST http://localhost:3000/api/lessons/{lessonId}/quizzes/{quizId}/start
Authorization: Bearer {accessToken}
```

Save attempt ID.

#### Step 11: Submit Answers (5 seconds)
```bash
POST http://localhost:3000/api/lessons/{lessonId}/quizzes/{quizId}/attempts/{attemptId}/answers
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "answers": [
    {
      "questionId": "{questionId1}",
      "selectedOption": 0
    },
    {
      "questionId": "{questionId2}",
      "selectedOption": 1
    }
  ]
}
```

#### Step 12: Complete Quiz (5 seconds)
```bash
POST http://localhost:3000/api/lessons/{lessonId}/quizzes/{quizId}/attempts/{attemptId}/submit
Authorization: Bearer {accessToken}
```

Verify score and results.

**Total Time**: ~250 seconds (~4 minutes)

---

## Automated Testing with Postman

### Import Collection

1. Open Postman
2. Create a new Collection named "IronClad E2E Tests"
3. Add the following requests in sequence

### Set Environment Variables

Create a Postman environment with these variables:

```
{
  "baseUrl": "http://localhost:3000",
  "accessToken": "",
  "refreshToken": "",
  "userId": "",
  "tenantId": "tenant-e2e-001",
  "courseId": "",
  "moduleId": "",
  "lessonId": "",
  "quizId": "",
  "attemptId": ""
}
```

### Pre-request Scripts

Add this to automatically update tokens:

```javascript
// For login requests - save tokens
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.environment.set("accessToken", jsonData.accessToken);
    pm.environment.set("refreshToken", jsonData.refreshToken);
    pm.environment.set("userId", jsonData.user.id);
}
```

### Test Scripts

Add validation after each request:

```javascript
// Test: Status code is 200 or 201
pm.test("Status is success", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 201]);
});

// Test: Response has required fields
pm.test("Response has required fields", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("id");
});
```

---

## Troubleshooting

### Common Issues

#### 1. **401 Unauthorized**
- **Cause**: Missing or expired access token
- **Solution**: 
  - Verify token is in Authorization header
  - Use refresh endpoint to get new token
  - Check token hasn't expired

#### 2. **403 Forbidden**
- **Cause**: User lacks required permission
- **Solution**:
  - Check user role using `/api/users/{userId}`
  - Verify permission assignment in database
  - Request admin to assign required role

#### 3. **Video Download Fails (403 Forbidden)**
- **Cause**: S3 bucket authentication issue
- **Solution**:
  - Verify AWS credentials are configured
  - Check bucket name and region in environment
  - Ensure IAM policy allows S3:GetObject

#### 4. **FFmpeg Not Found**
- **Cause**: FFmpeg not installed or not in PATH
- **Solution**:
  ```powershell
  winget install BtbN.FFmpeg.GPL.8.0
  # Verify installation
  ffmpeg -version
  ```

#### 5. **OpenAI API Error**
- **Cause**: Missing or invalid API key
- **Solution**:
  - Verify `OPENAI_API_KEY` in `.env` file
  - Check API key is valid and has quota
  - Review OpenAI account for any rate limits

#### 6. **Database Connection Error**
- **Cause**: PostgreSQL not running or connection string invalid
- **Solution**:
  ```bash
  # Check if PostgreSQL is running
  psql --version
  
  # Verify connection string format
  postgresql://user:password@localhost:5432/database_name
  
  # Test connection
  psql postgresql://user:password@localhost:5432/ironclad
  ```

#### 7. **Quiz Generation Takes Too Long**
- **Cause**: Large video or slow internet
- **Solution**:
  - Use smaller test videos (1-5 minutes)
  - Check network connectivity
  - Monitor OpenAI API quota

---

## Performance Metrics

Expected response times:

| Endpoint | Time |
|----------|------|
| Register/Login | 0.5-1s |
| Create Course | 1-2s |
| Create Module/Lesson | 1-2s |
| Video Upload | 5-30s (depends on size) |
| Generate Summary | 60-120s (depends on video length) |
| Save Summary | 1-2s |
| Generate Quiz | 10-20s |
| Publish Quiz | 1-2s |
| Start Quiz | 0.5-1s |
| Submit Answers | 0.5-1s |
| Complete Quiz | 1-2s |

---

## Best Practices

### 1. **Use Unique Test Data**
```javascript
const timestamp = Date.now();
const uniqueEmail = `test.${timestamp}@example.com`;
```

### 2. **Clean Up Test Data**
After tests, delete created resources to avoid database clutter.

### 3. **Test Error Cases**
- Invalid permissions
- Missing required fields
- Invalid data formats
- Concurrent requests

### 4. **Monitor Logs**
```bash
# Watch server logs for errors
npm run start:dev

# Check database logs
pg_dump -U postgres ironclad > backup.sql
```

### 5. **Use Test Accounts**
Create dedicated test accounts for E2E testing instead of using production accounts.

---

## Next Steps

1. **Run full E2E test suite**: 15-20 minutes
2. **Verify all endpoints respond correctly**: ~5 minutes
3. **Test permission restrictions**: ~10 minutes
4. **Load testing**: Use tools like Apache JMeter
5. **Security testing**: OWASP ZAP scanning

---

## Support

For issues or questions:
1. Check server logs: `npm run start:dev`
2. Review database state: `psql` queries
3. Check API documentation: `http://localhost:3000/api/docs`
4. Review environment configuration: `.env` file

