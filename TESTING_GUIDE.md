# Course, Module, Lesson & Video Upload API Testing Guide

## Setup Instructions

### 1. AWS S3 Configuration

Before testing video uploads, configure your AWS credentials in `.env`:

```env
AWS_ACCESS_KEY_ID="your_aws_access_key_id"
AWS_SECRET_ACCESS_KEY="your_aws_secret_access_key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your_bucket_name"
```

### 2. API Base URL

```
http://localhost:3000/api
```

---

## Authentication Flow

### Step 1: Register User

**POST** `/auth/register`

```json
{
  "email": "trainer@example.com",
  "password": "SecurePassword123!",
  "displayName": "Training Manager"
}
```

**Response:**

```json
{
  "id": "user_id_here",
  "email": "trainer@example.com",
  "displayName": "Training Manager",
  "status": "active",
  "createdAt": "2025-11-19T..."
}
```

---

### Step 2: Create Tenant

**POST** `/tenants`

```json
{
  "name": "Tech Training Corp"
}
```

**Response:**

```json
{
  "id": "tenant_id_here",
  "name": "Tech Training Corp",
  "status": "active",
  "createdAt": "2025-11-19T..."
}
```

---

### Step 3: Assign User to Tenant with training_manager Role

**POST** `/roles/assign-role`

```json
{
  "userId": "user_id_here",
  "tenantId": "tenant_id_here",
  "roles": ["training_manager"]
}
```

---

### Step 4: Login

**POST** `/auth/login`

```json
{
  "email": "trainer@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**

```json
{
  "accessToken": "jwt_token_here",
  "refreshToken": "refresh_token_here",
  "user": {
    "id": "user_id_here",
    "email": "trainer@example.com",
    "tenantId": "tenant_id_here",
    "roles": ["training_manager"]
  }
}
```

**Note:** Use the `accessToken` for all subsequent requests in the `Authorization: Bearer <token>` header.

---

## Course Management

### Create Course

**POST** `/courses`

```json
{
  "tenantId": "tenant_id_here",
  "title": "Advanced TypeScript",
  "summary": "Learn advanced TypeScript patterns and best practices",
  "level": "advanced",
  "ownerUserId": "user_id_here"
}
```

**Response:**

```json
{
  "id": "course_id_here",
  "tenantId": "tenant_id_here",
  "title": "Advanced TypeScript",
  "summary": "Learn advanced TypeScript patterns and best practices",
  "level": "advanced",
  "status": "draft",
  "ownerUserId": "user_id_here",
  "createdAt": "2025-11-19T...",
  "updatedAt": "2025-11-19T...",
  "modules": []
}
```

### List Courses

**GET** `/courses?tenantId=tenant_id_here`

**Response:** Array of courses with modules

### Get Course Details

**GET** `/courses/course_id_here`

**Response:** Course with full module and lesson hierarchy

---

## Module Management

### Create Module

**POST** `/courses/modules/create`

```json
{
  "courseId": "course_id_here",
  "title": "Module 1: Basics",
  "description": "Learn TypeScript basics",
  "displayOrder": 1
}
```

**Response:**

```json
{
  "id": "module_id_here",
  "courseId": "course_id_here",
  "title": "Module 1: Basics",
  "description": "Learn TypeScript basics",
  "displayOrder": 1,
  "status": "draft",
  "createdAt": "2025-11-19T...",
  "updatedAt": "2025-11-19T...",
  "lessons": []
}
```

### Get Modules for Course

**GET** `/courses/course/course_id_here/modules`

**Response:** Array of modules with lessons

### Get Module Details

**GET** `/courses/modules/module_id_here`

**Response:** Module with lessons

### Update Module

**PATCH** `/courses/modules/module_id_here`

```json
{
  "title": "Module 1: TypeScript Basics",
  "description": "Updated description",
  "displayOrder": 1
}
```

---

## Lesson Management

### Create Lesson

**POST** `/courses/lessons/create`

```json
{
  "moduleId": "module_id_here",
  "title": "Lesson 1: Types & Interfaces",
  "description": "Understanding types and interfaces in TypeScript",
  "displayOrder": 1
}
```

**Response:**

```json
{
  "id": "lesson_id_here",
  "moduleId": "module_id_here",
  "title": "Lesson 1: Types & Interfaces",
  "description": "Understanding types and interfaces in TypeScript",
  "videoUrl": null,
  "videoDuration": null,
  "videoFileName": null,
  "displayOrder": 1,
  "status": "draft",
  "createdAt": "2025-11-19T...",
  "updatedAt": "2025-11-19T..."
}
```

### Get Lesson Details

**GET** `/courses/lessons/lesson_id_here`

**Response:** Lesson details including video URL if uploaded

### Update Lesson

**PATCH** `/courses/lessons/lesson_id_here`

```json
{
  "title": "Lesson 1: Types, Interfaces & Generics",
  "description": "Updated description"
}
```

---

## Video Upload to S3

### Upload Video

**POST** `/courses/lessons/lesson_id_here/upload-video`

**Method:** Form Data (multipart/form-data)

**Fields:**

- `video`: File (required) - Video file (mp4, webm, mov, avi)
- `videoDuration`: Number (optional) - Duration in seconds

**Example using curl:**

```bash
curl -X POST "http://localhost:3000/api/courses/lessons/lesson_id_here/upload-video" \
  -H "Authorization: Bearer your_jwt_token" \
  -F "video=@/path/to/video.mp4" \
  -F "videoDuration=3600"
```

**Response:**

```json
{
  "message": "Video uploaded successfully to S3",
  "lesson": {
    "id": "lesson_id_here",
    "moduleId": "module_id_here",
    "title": "Lesson 1: Types & Interfaces",
    "description": "Understanding types and interfaces in TypeScript",
    "videoUrl": "https://your-bucket.s3.amazonaws.com/videos/course_id_here/lesson_id_here-1234567890.mp4",
    "videoDuration": 3600,
    "videoFileName": "lesson_id_here-1234567890.mp4",
    "displayOrder": 1,
    "status": "draft",
    "createdAt": "2025-11-19T...",
    "updatedAt": "2025-11-19T..."
  },
  "fileSize": 52428800,
  "s3Url": "https://your-bucket.s3.amazonaws.com/videos/course_id_here/lesson_id_here-1234567890.mp4"
}
```

### Delete Video

**DELETE** `/courses/lessons/lesson_id_here/video`

**Response:**

```json
{
  "id": "lesson_id_here",
  "moduleId": "module_id_here",
  "title": "Lesson 1: Types & Interfaces",
  "videoUrl": null,
  "videoDuration": null,
  "videoFileName": null,
  ...
}
```

---

## Tenant Isolation

### Security Features:

✅ Only users from the same tenant can create/access resources
✅ Cross-tenant access is blocked with `BadRequestException`
✅ Video uploads are namespaced by tenant/course hierarchy
✅ All operations require JWT authentication

### Example: Accessing Another Tenant's Course

If `user_from_tenant_b` tries to create a module in `tenant_a`'s course:

```json
{
  "statusCode": 400,
  "message": "You do not have access to this course",
  "error": "Bad Request"
}
```

---

## Error Responses

### Invalid Video Format

```json
{
  "statusCode": 400,
  "message": "Invalid video format. Allowed formats: mp4, webm, mov, avi",
  "error": "Bad Request"
}
```

### File Size Exceeds Limit

```json
{
  "statusCode": 413,
  "message": "Payload too large",
  "error": "Request Entity Too Large"
}
```

### Lesson Not Found

```json
{
  "statusCode": 400,
  "message": "Lesson not found",
  "error": "Bad Request"
}
```

---

## Testing Workflow Summary

1. ✅ Register user
2. ✅ Create tenant
3. ✅ Assign user to tenant with training_manager role
4. ✅ Login
5. ✅ Create course
6. ✅ Create module
7. ✅ Create lesson
8. ✅ Upload video to S3
9. ✅ Verify video URL in lesson
10. ✅ Delete video (optional)

---

## Required Headers

All authenticated requests must include:

```
Authorization: Bearer <jwt_access_token>
Content-Type: application/json (except for file uploads)
```

---

## Notes

- Videos are stored in S3 at: `videos/{courseId}/{lessonId}-{timestamp}.{ext}`
- Maximum file size: 500MB
- Videos are public-read accessible via the S3 URL
- Cross-tenant access is strictly prevented
