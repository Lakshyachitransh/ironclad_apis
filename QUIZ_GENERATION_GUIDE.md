# AI-Powered Quiz Generation Guide

## Overview

The AI-powered quiz generation feature automatically generates 6 multiple-choice quizzes from video content using OpenAI's GPT-4 model. This feature streamlines the process of creating assessments for course lessons.

## Architecture

### Components

1. **QuizGeneratorService** (`src/courses/services/quiz-generator.service.ts`)
   - Core service for AI quiz generation
   - Integrates with OpenAI API
   - Handles database persistence

2. **CoursesController** (Updated)
   - Exposes quiz generation endpoints
   - Implements role-based access control
   - Validates tenant access

3. **CoursesService** (Updated)
   - Orchestrates quiz generation workflow
   - Manages quiz retrieval and access control

4. **GenerateQuizFromVideoDto** (`src/courses/dto/generate-quiz.dto.ts`)
   - Request/response DTOs for quiz operations
   - Input validation with class-validator

## Environment Setup

### Required Environment Variables

```bash
# OpenAI API Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ironclad

# JWT
JWT_SECRET=your-jwt-secret
```

### Installation

The OpenAI package is already installed:

```bash
npm install openai
```

If you need to reinstall:

```bash
npm install openai@latest
```

## API Endpoints

### 1. Generate Quizzes from Video Content

**Endpoint:** `POST /api/courses/lessons/:lessonId/generate-quizzes`

**Authentication:** Required (Bearer Token)

**Role Requirements:** `training_manager` or `instructor`

**Request Body:**

```json
{
  "videoContent": "Your video transcript or content here...",
  "lessonId": "les-001",
  "courseId": "course-001"
}
```

**Video Content Formats Supported:**

- Raw video transcripts
- Lesson summaries
- Video descriptions
- Course notes

**Response (201 Created):**

```json
{
  "quizzes": [
    {
      "id": "quiz-question-1",
      "questionText": "What is the primary concept discussed in the video?",
      "explanation": "The video emphasizes...",
      "order": 1,
      "options": [
        {
          "id": "option-1",
          "optionText": "Option A",
          "order": 0
        },
        {
          "id": "option-2",
          "optionText": "Option B (Correct Answer)",
          "order": 1
        },
        {
          "id": "option-3",
          "optionText": "Option C",
          "order": 2
        },
        {
          "id": "option-4",
          "optionText": "Option D",
          "order": 3
        }
      ]
    }
    // ... 5 more quizzes
  ],
  "generatedAt": "2025-11-27T10:30:00Z",
  "lessonId": "les-001",
  "videoContentSummary": "First 200 characters of the video content..."
}
```

**Error Responses:**

- `400 Bad Request` - Missing or invalid video content
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Lesson or course not found
- `500 Internal Server Error` - OpenAI API error

### 2. List Quizzes for a Lesson

**Endpoint:** `GET /api/courses/lessons/:lessonId/quizzes`

**Authentication:** Required (Bearer Token)

**Role Requirements:** Any authenticated user

**Response (200 OK):**

```json
[
  {
    "id": "quiz-1",
    "title": "Quiz from Lesson",
    "description": "Quiz automatically generated from video content",
    "passingScore": 70,
    "questionCount": 6,
    "questions": [
      {
        "id": "question-1",
        "questionText": "First question...",
        "explanation": "Explanation...",
        "displayOrder": 1,
        "options": [...]
      }
    ]
  }
]
```

### 3. Get Quiz Details

**Endpoint:** `GET /api/courses/quizzes/:quizId`

**Authentication:** Required (Bearer Token)

**Role Requirements:** Any authenticated user

**Response (200 OK):**

```json
{
  "id": "quiz-1",
  "title": "Quiz from Lesson",
  "description": "Quiz automatically generated from video content",
  "passingScore": 70,
  "questionCount": 6,
  "questions": [
    {
      "id": "question-1",
      "questionText": "What is the main topic?",
      "explanation": "The answer is B because...",
      "order": 1,
      "options": [
        {
          "id": "option-1",
          "optionText": "Option A",
          "order": 0
        },
        {
          "id": "option-2",
          "optionText": "Option B",
          "order": 1
        },
        {
          "id": "option-3",
          "optionText": "Option C",
          "order": 2
        },
        {
          "id": "option-4",
          "optionText": "Option D",
          "order": 3
        }
      ]
    }
  ]
}
```

## Quiz Generation Features

### AI-Powered Generation

- **Model:** GPT-4-turbo-preview
- **Output:** Exactly 6 multiple-choice questions
- **Options per Question:** 4 (one correct, three plausible distractors)
- **Question Types:** Mix of easy, medium, and hard difficulty levels
- **Features:**
  - Tests key concepts from the video
  - Clear and unambiguous questions
  - Relevant plausible distractors
  - Detailed explanations for correct answers

### Database Schema

**Quiz Model:**

- `id` (UUID)
- `lessonId` (Foreign Key)
- `title` (String)
- `description` (Optional)
- `passingScore` (Integer, default: 70%)
- `status` (String: draft, published, archived)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**QuizQuestion Model:**

- `id` (UUID)
- `quizId` (Foreign Key)
- `questionText` (String)
- `explanation` (String, shown after answering)
- `displayOrder` (Integer)
- `type` (String: multiple_choice, true_false, short_answer)
- `points` (Integer, default: 1)

**QuizOption Model:**

- `id` (UUID)
- `questionId` (Foreign Key)
- `optionText` (String)
- `isCorrect` (Boolean)
- `displayOrder` (Integer)

**QuizAttempt Model:**

- `id` (UUID)
- `quizId` (Foreign Key)
- `userId` (String)
- `score` (Integer, null until submitted)
- `percentage` (Float)
- `status` (String: in_progress, submitted, graded)
- `startedAt` (DateTime)
- `completedAt` (Optional DateTime)

## Usage Examples

### Example 1: Generate Quizzes from Video Transcript

```bash
curl -X POST http://localhost:3000/api/courses/lessons/les-001/generate-quizzes \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "videoContent": "Today we will discuss the fundamentals of JavaScript. JavaScript is a programming language that enables interactive web pages. It is an essential part of web development alongside HTML and CSS. The most important concepts include variables, data types, functions, and asynchronous programming.",
    "lessonId": "les-001",
    "courseId": "course-001"
  }'
```

### Example 2: Retrieve Generated Quizzes

```bash
curl -X GET http://localhost:3000/api/courses/lessons/les-001/quizzes \
  -H "Authorization: Bearer your-jwt-token"
```

### Example 3: Get Quiz Details for Display

```bash
curl -X GET http://localhost:3000/api/courses/quizzes/quiz-1 \
  -H "Authorization: Bearer your-jwt-token"
```

## Security Features

### Access Control

1. **Role-Based Access:**
   - `POST` endpoint: `training_manager` or `instructor` only
   - `GET` endpoints: Any authenticated user

2. **Tenant Isolation:**
   - Quiz generation validates lesson belongs to user's tenant
   - All quiz retrieval validates tenant access
   - Cross-tenant access is blocked with 404 responses

3. **API Security:**
   - OpenAI API key stored in environment variables
   - Never exposed in responses or logs
   - Rate limiting handled by OpenAI

### Privacy & Security

- **Correct Answers:** Not exposed to students in quiz retrieval
- **Explanation Only:** Shown after quiz completion
- **Audit Trail:** All quiz generation logged with timestamps
- **Data Encryption:** Database fields can be encrypted at rest

## Performance Considerations

### OpenAI API Calls

- **Timeout:** 30 seconds per API request
- **Cost:** Varies based on token usage (typically $0.01-0.05 per quiz)
- **Rate Limits:** OpenAI enforces rate limits based on plan

### Database Operations

- **Indexing:** Automatic on `lessonId`, `quizId`, `userId`
- **Batch Operations:** Single transaction for quiz creation
- **Query Optimization:** Includes related data in single query

### Recommendations

1. **Implement Quiz Generation Caching:**

   ```typescript
   // Check if quizzes already exist for lesson
   const existingQuizzes = await getQuizzesForLesson(lessonId);
   if (existingQuizzes.length > 0) {
     return existingQuizzes;
   }
   ```

2. **Add Background Jobs:**
   - Use BullMQ for quiz generation queue
   - Prevent simultaneous generation requests

3. **Monitor API Usage:**
   - Track OpenAI token usage
   - Set usage alerts and limits

## Error Handling

### Common Errors

| Error                       | Cause                             | Solution                           |
| --------------------------- | --------------------------------- | ---------------------------------- |
| 400 - Invalid video content | Empty or missing content          | Provide non-empty video transcript |
| 401 - Unauthorized          | Missing/invalid token             | Include valid Bearer token         |
| 403 - Forbidden             | Insufficient role                 | User needs `training_manager` role |
| 404 - Not found             | Lesson doesn't exist              | Verify correct lessonId            |
| 500 - OpenAI API error      | API key invalid or quota exceeded | Check OPENAI_API_KEY env var       |

### OpenAI Specific Issues

**No API Key:**

```
Error: The OPENAI_API_KEY environment variable is not set
```

**Quota Exceeded:**

```
Error: Rate limit exceeded
```

**Invalid Model:**

```
Error: The model gpt-4-turbo-preview does not exist
```

## Advanced Features

### Custom Quiz Generation

You can extend the service to generate different question types:

```typescript
// Example: Generate true/false questions
async generateTrueFalseQuestions(videoContent: string) {
  // Modify prompt for T/F questions
  // Update schema to support question type
}

// Example: Generate short-answer questions
async generateShortAnswerQuestions(videoContent: string) {
  // Modify prompt and validation
}
```

### Batch Quiz Generation

```typescript
// Generate quizzes for multiple lessons
async generateQuizzesForCourse(courseId: string) {
  const lessons = await getLessonsForCourse(courseId);
  const results = await Promise.all(
    lessons.map(lesson =>
      generateQuizzesFromVideo(lesson.id, lesson.transcript)
    )
  );
  return results;
}
```

## Testing

### Unit Tests

```bash
npm run test -- quiz-generator.service.spec.ts
```

### Integration Tests

```bash
npm run test:e2e -- quiz-endpoints.e2e-spec.ts
```

### Manual Testing

```bash
# 1. Get a valid JWT token from login endpoint
# 2. Generate quizzes
curl -X POST http://localhost:3000/api/courses/lessons/les-001/generate-quizzes \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"videoContent":"...","lessonId":"les-001","courseId":"course-001"}'

# 3. List generated quizzes
curl -X GET http://localhost:3000/api/courses/lessons/les-001/quizzes \
  -H "Authorization: Bearer ${TOKEN}"

# 4. Retrieve quiz details
curl -X GET http://localhost:3000/api/courses/quizzes/quiz-1 \
  -H "Authorization: Bearer ${TOKEN}"
```

## Deployment

### Production Checklist

- [ ] OPENAI_API_KEY environment variable set securely
- [ ] Database migrations applied (Prisma schema updated)
- [ ] API rate limiting configured
- [ ] Error logging and monitoring enabled
- [ ] Quiz generation timeout set appropriately
- [ ] Cost monitoring and alerts configured
- [ ] Backup plan for API failures

### Environment Variables

```bash
# .env.production
OPENAI_API_KEY=sk-prod-key-here
OPENAI_MODEL=gpt-4-turbo-preview
QUIZ_GENERATION_TIMEOUT=30000  # 30 seconds
QUIZ_MAX_RETRIES=3
```

## Troubleshooting

### Quiz Generation Fails

1. **Check OpenAI API Key:**

   ```bash
   echo $OPENAI_API_KEY
   ```

2. **Check Logs:**

   ```bash
   npm run start:dev
   # Look for errors in console
   ```

3. **Verify Video Content:**
   - Ensure content is not empty
   - Content should be at least 100 characters
   - Avoid special characters

### Quizzes Not Appearing

1. **Check Lesson Exists:**

   ```bash
   # Query database
   SELECT * FROM "Lesson" WHERE id = 'les-001';
   ```

2. **Check Quiz Records:**

   ```bash
   SELECT * FROM "Quiz" WHERE lessonId = 'les-001';
   ```

3. **Check Tenant Access:**
   - Verify user belongs to lesson's tenant
   - Check tenantId in JWT token

## Future Enhancements

1. **Multi-language Support:** Generate quizzes in different languages
2. **Question Type Variety:** Extend to T/F, short answer, essay questions
3. **Difficulty Levels:** Allow specifying quiz difficulty
4. **Custom Grading:** Support partial credit and rubrics
5. **Analytics:** Track quiz performance metrics
6. **AI Improvements:** Fine-tune prompts based on student feedback

## Support & Resources

- **OpenAI Documentation:** https://platform.openai.com/docs
- **NestJS Documentation:** https://docs.nestjs.com
- **Prisma Documentation:** https://www.prisma.io/docs
- **GitHub Repository:** https://github.com/Lakshyachitransh/ironclad_apis

## License

MIT License - See LICENSE file for details
