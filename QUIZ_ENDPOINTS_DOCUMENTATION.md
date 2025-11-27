# Quiz Endpoints Documentation

## Overview

Complete quiz management system for LMS platform with support for:
- Quiz CRUD operations (Create, Read, Update, Delete)
- Question management (multiple choice, true/false, short answer)
- Option management for questions
- Quiz attempt tracking
- Automatic grading for objective questions
- Progress and results tracking

## Database Models

### Quiz Model
```prisma
model Quiz {
  id               String
  lesson           Lesson
  lessonId         String
  title            String
  description      String?
  instructions     String?
  passingScore     Int              @default(70)
  attemptsAllowed  Int              @default(1)
  timeLimit        Int?             // in minutes
  displayOrder     Int              @default(0)
  shuffleQuestions Boolean          @default(false)
  status           String           @default("draft")
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
  questions        QuizQuestion[]
  attempts         QuizAttempt[]
}
```

### QuizQuestion Model
```prisma
model QuizQuestion {
  id           String
  quiz         Quiz
  quizId       String
  type         String           @default("multiple_choice")
  questionText String
  explanation  String?
  points       Int              @default(1)
  displayOrder Int              @default(0)
  options      QuizOption[]
  answers      QuizAnswer[]
}
```

### QuizOption Model
```prisma
model QuizOption {
  id           String
  question     QuizQuestion
  questionId   String
  optionText   String
  isCorrect    Boolean          @default(false)
  displayOrder Int              @default(0)
}
```

### QuizAttempt Model
```prisma
model QuizAttempt {
  id          String
  quiz        Quiz
  quizId      String
  userId      String
  score       Int?
  percentage  Float?
  status      String           @default("in_progress")
  startedAt   DateTime         @default(now())
  completedAt DateTime?
  answers     QuizAnswer[]
}
```

### QuizAnswer Model
```prisma
model QuizAnswer {
  id            String
  attempt       QuizAttempt
  attemptId     String
  question      QuizQuestion
  questionId    String
  selectedOption String?
  isCorrect     Boolean?
  pointsEarned  Int?
}
```

## API Endpoints

### Base URL
```
POST/GET/PUT/DELETE /lessons/:lessonId/quizzes
```

---

## Quiz Management Endpoints

### 1. Create Quiz
**POST** `/lessons/:lessonId/quizzes`

**Authorization**: `training_manager`, `org_admin`

**Request Body**:
```json
{
  "title": "Module 1 Assessment",
  "description": "Test your knowledge of Module 1 concepts",
  "instructions": "Answer all questions. You have 30 minutes.",
  "passingScore": 70,
  "attemptsAllowed": 2,
  "timeLimit": 30,
  "shuffleQuestions": true
}
```

**Response** (201 Created):
```json
{
  "id": "quiz_123",
  "lessonId": "lesson_456",
  "title": "Module 1 Assessment",
  "description": "Test your knowledge of Module 1 concepts",
  "instructions": "Answer all questions. You have 30 minutes.",
  "passingScore": 70,
  "attemptsAllowed": 2,
  "timeLimit": 30,
  "displayOrder": 0,
  "shuffleQuestions": true,
  "status": "draft",
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

---

### 2. Get All Quizzes for Lesson
**GET** `/lessons/:lessonId/quizzes`

**Authorization**: `training_manager`, `org_admin`, `learner`

**Response** (200 OK):
```json
[
  {
    "id": "quiz_123",
    "lessonId": "lesson_456",
    "title": "Module 1 Assessment",
    "status": "published",
    "passingScore": 70,
    "attemptsAllowed": 2,
    "questions": [
      {
        "id": "q_1",
        "questionText": "What is NestJS?",
        "type": "multiple_choice",
        "points": 1,
        "options": [
          {
            "id": "opt_1",
            "optionText": "A JavaScript framework",
            "isCorrect": true
          },
          {
            "id": "opt_2",
            "optionText": "A database",
            "isCorrect": false
          }
        ]
      }
    ]
  }
]
```

---

### 3. Get Quiz Details
**GET** `/lessons/:lessonId/quizzes/:quizId`

**Authorization**: `training_manager`, `org_admin`, `learner`

**Response** (200 OK): Returns full quiz with all questions and options

---

### 4. Update Quiz Settings
**PUT** `/lessons/:lessonId/quizzes/:quizId`

**Authorization**: `training_manager`, `org_admin`

**Request Body**:
```json
{
  "title": "Updated Title",
  "passingScore": 75,
  "attemptsAllowed": 3
}
```

**Response** (200 OK): Updated quiz object

---

### 5. Publish Quiz
**POST** `/lessons/:lessonId/quizzes/:quizId/publish`

**Authorization**: `training_manager`, `org_admin`

**Requirements**: 
- Quiz must have at least one question
- Status changes from "draft" to "published"

**Response** (200 OK):
```json
{
  "id": "quiz_123",
  "status": "published",
  "...": "..."
}
```

**Error** (400 Bad Request):
```json
{
  "message": "Cannot publish quiz without questions"
}
```

---

### 6. Delete Quiz
**DELETE** `/lessons/:lessonId/quizzes/:quizId`

**Authorization**: `training_manager`, `org_admin`

**Response** (200 OK): Deleted quiz object

---

## Question Management Endpoints

### 7. Add Question to Quiz
**POST** `/lessons/:lessonId/quizzes/:quizId/questions`

**Authorization**: `training_manager`, `org_admin`

**Request Body**:
```json
{
  "type": "multiple_choice",
  "questionText": "What is the capital of France?",
  "explanation": "Paris is the capital and largest city of France.",
  "points": 2
}
```

**Question Types**:
- `multiple_choice` - Multiple choice questions
- `true_false` - True/False questions
- `short_answer` - Short answer questions (manual grading)

**Response** (201 Created):
```json
{
  "id": "q_1",
  "quizId": "quiz_123",
  "type": "multiple_choice",
  "questionText": "What is the capital of France?",
  "explanation": "Paris is the capital and largest city of France.",
  "points": 2,
  "displayOrder": 0
}
```

---

### 8. Update Question
**PUT** `/lessons/:lessonId/quizzes/:quizId/questions/:questionId`

**Authorization**: `training_manager`, `org_admin`

**Request Body**:
```json
{
  "questionText": "Updated question text",
  "points": 3
}
```

**Response** (200 OK): Updated question with options

---

### 9. Delete Question
**DELETE** `/lessons/:lessonId/quizzes/:quizId/questions/:questionId`

**Authorization**: `training_manager`, `org_admin`

**Response** (200 OK): Deleted question object

---

## Option Management Endpoints

### 10. Add Option to Question
**POST** `/lessons/:lessonId/quizzes/:quizId/questions/:questionId/options`

**Authorization**: `training_manager`, `org_admin`

**Request Body**:
```json
{
  "optionText": "Paris",
  "isCorrect": true
}
```

**Response** (201 Created):
```json
{
  "id": "opt_1",
  "questionId": "q_1",
  "optionText": "Paris",
  "isCorrect": true,
  "displayOrder": 0
}
```

---

### 11. Update Option
**PUT** `/lessons/:lessonId/quizzes/:quizId/questions/:questionId/options/:optionId`

**Authorization**: `training_manager`, `org_admin`

**Request Body**:
```json
{
  "optionText": "Paris, France",
  "isCorrect": true
}
```

**Response** (200 OK): Updated option

---

### 12. Delete Option
**DELETE** `/lessons/:lessonId/quizzes/:quizId/questions/:questionId/options/:optionId`

**Authorization**: `training_manager`, `org_admin`

**Response** (200 OK): Deleted option

---

## Quiz Attempt Endpoints

### 13. Start Quiz Attempt
**POST** `/lessons/:lessonId/quizzes/:quizId/start`

**Authorization**: `learner`

**Requirements**:
- Quiz must be published
- User must not have exceeded maximum attempts
- Automatically creates a `QuizAttempt` record

**Response** (201 Created):
```json
{
  "id": "attempt_1",
  "quizId": "quiz_123",
  "userId": "user_456",
  "status": "in_progress",
  "score": null,
  "percentage": null,
  "startedAt": "2025-01-15T11:00:00Z",
  "completedAt": null,
  "quiz": {
    "id": "quiz_123",
    "title": "Module 1 Assessment",
    "timeLimit": 30,
    "questions": [
      {
        "id": "q_1",
        "questionText": "What is NestJS?",
        "type": "multiple_choice",
        "options": [
          {
            "id": "opt_1",
            "optionText": "A JavaScript framework"
          },
          {
            "id": "opt_2",
            "optionText": "A database"
          }
        ]
      }
    ]
  }
}
```

**Error** (400 Bad Request):
```json
{
  "message": "Maximum attempts (2) reached"
}
```

---

### 14. Get Attempt Details
**GET** `/lessons/:lessonId/quizzes/:quizId/attempts/:attemptId`

**Authorization**: `learner`, `training_manager`, `org_admin`

**Response** (200 OK): Full attempt with all submitted answers

---

### 15. Submit Answer to Question
**POST** `/lessons/:lessonId/quizzes/:quizId/attempts/:attemptId/answers`

**Authorization**: `learner`

**Request Body**:
```json
{
  "questionId": "q_1",
  "selectedOption": "opt_1"
}
```

**Response** (201 Created):
```json
{
  "id": "answer_1",
  "attemptId": "attempt_1",
  "questionId": "q_1",
  "selectedOption": "opt_1",
  "isCorrect": true,
  "pointsEarned": 1
}
```

**Automatic Grading Logic**:
- **Multiple Choice**: Compares selectedOption ID with correct option
- **True/False**: Evaluates boolean value against correct answer
- **Short Answer**: Marks as null, requires manual grading

---

### 16. Submit Quiz (Calculate Score)
**POST** `/lessons/:lessonId/quizzes/:quizId/attempts/:attemptId/submit`

**Authorization**: `learner`

**Calculation**:
- Sums pointsEarned from all QuizAnswers
- Calculates percentage: (earnedPoints / totalPoints) * 100
- Changes status to "submitted"
- Records completion timestamp

**Response** (200 OK):
```json
{
  "id": "attempt_1",
  "quizId": "quiz_123",
  "userId": "user_456",
  "score": 8,
  "percentage": 80,
  "status": "submitted",
  "startedAt": "2025-01-15T11:00:00Z",
  "completedAt": "2025-01-15T11:25:00Z",
  "answers": [
    {
      "id": "answer_1",
      "questionId": "q_1",
      "selectedOption": "opt_1",
      "isCorrect": true,
      "pointsEarned": 1
    },
    {
      "id": "answer_2",
      "questionId": "q_2",
      "selectedOption": "opt_4",
      "isCorrect": true,
      "pointsEarned": 2
    }
  ]
}
```

---

### 17. Get My Quiz Attempts
**GET** `/lessons/:lessonId/quizzes/:quizId/my-attempts`

**Authorization**: `learner`

**Response** (200 OK): Array of user's attempts (newest first)
```json
[
  {
    "id": "attempt_2",
    "quizId": "quiz_123",
    "userId": "user_456",
    "score": 9,
    "percentage": 90,
    "status": "submitted",
    "startedAt": "2025-01-16T10:00:00Z",
    "completedAt": "2025-01-16T10:20:00Z"
  },
  {
    "id": "attempt_1",
    "quizId": "quiz_123",
    "userId": "user_456",
    "score": 8,
    "percentage": 80,
    "status": "submitted",
    "startedAt": "2025-01-15T11:00:00Z",
    "completedAt": "2025-01-15T11:25:00Z"
  }
]
```

---

### 18. Get Quiz Results (Admin View)
**GET** `/lessons/:lessonId/quizzes/:quizId/results`

**Authorization**: `training_manager`, `org_admin`

**Response** (200 OK): All quiz attempts from all users
```json
[
  {
    "id": "attempt_2",
    "quizId": "quiz_123",
    "userId": "user_789",
    "score": 9,
    "percentage": 90,
    "status": "submitted",
    "startedAt": "2025-01-16T10:00:00Z",
    "completedAt": "2025-01-16T10:20:00Z"
  },
  {
    "id": "attempt_1",
    "quizId": "quiz_123",
    "userId": "user_456",
    "score": 8,
    "percentage": 80,
    "status": "submitted",
    "startedAt": "2025-01-15T11:00:00Z",
    "completedAt": "2025-01-15T11:25:00Z"
  }
]
```

---

## Data Transfer Objects (DTOs)

### CreateQuizDto
```typescript
{
  title: string;
  description?: string;
  instructions?: string;
  passingScore?: number;           // default: 70
  attemptsAllowed?: number;        // default: 1
  timeLimit?: number;              // in minutes
  shuffleQuestions?: boolean;      // default: false
}
```

### CreateQuizQuestionDto
```typescript
{
  type: string;                    // 'multiple_choice' | 'true_false' | 'short_answer'
  questionText: string;
  explanation?: string;
  points?: number;                 // default: 1
}
```

### CreateQuizOptionDto
```typescript
{
  optionText: string;
  isCorrect: boolean;
}
```

### SubmitQuizAnswerDto
```typescript
{
  questionId: string;
  selectedOption: string;          // ID of selected option or boolean/text value
}
```

---

## Error Handling

### Common HTTP Status Codes

| Status | Meaning | Example |
|--------|---------|---------|
| 201 | Created successfully | Quiz, question, option created |
| 200 | OK | Successful GET/PUT/DELETE |
| 400 | Bad Request | Invalid input, can't publish empty quiz |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Quiz/question/attempt not found |
| 500 | Server Error | Database/server issues |

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Cannot publish quiz without questions",
  "error": "Bad Request"
}
```

---

## Role-Based Access Control

### Role Permissions

| Endpoint | Learner | Training Manager | Org Admin |
|----------|---------|------------------|-----------|
| Create Quiz | ✗ | ✓ | ✓ |
| Get Quizzes | ✓ | ✓ | ✓ |
| Update Quiz | ✗ | ✓ | ✓ |
| Publish Quiz | ✗ | ✓ | ✓ |
| Delete Quiz | ✗ | ✓ | ✓ |
| Add/Update Questions | ✗ | ✓ | ✓ |
| Start Attempt | ✓ | ✗ | ✗ |
| Submit Answers | ✓ | ✗ | ✗ |
| View My Attempts | ✓ | ✗ | ✗ |
| View All Results | ✗ | ✓ | ✓ |

---

## Complete Example: Creating and Completing a Quiz

### Step 1: Create Quiz (Trainer)
```bash
POST /lessons/lesson_456/quizzes
Authorization: Bearer <trainer_token>

{
  "title": "JavaScript Fundamentals",
  "description": "Test your JavaScript knowledge",
  "passingScore": 70,
  "attemptsAllowed": 2,
  "timeLimit": 30
}
```

### Step 2: Add Question (Trainer)
```bash
POST /lessons/lesson_456/quizzes/quiz_123/questions
Authorization: Bearer <trainer_token>

{
  "type": "multiple_choice",
  "questionText": "What is the output of console.log(typeof undefined)?",
  "explanation": "typeof undefined returns the string 'undefined'",
  "points": 1
}
```

### Step 3: Add Options (Trainer)
```bash
POST /lessons/lesson_456/quizzes/quiz_123/questions/q_1/options
Authorization: Bearer <trainer_token>

{
  "optionText": "'undefined'",
  "isCorrect": true
}
```

```bash
POST /lessons/lesson_456/quizzes/quiz_123/questions/q_1/options
Authorization: Bearer <trainer_token>

{
  "optionText": "'null'",
  "isCorrect": false
}
```

### Step 4: Publish Quiz (Trainer)
```bash
POST /lessons/lesson_456/quizzes/quiz_123/publish
Authorization: Bearer <trainer_token>
```

### Step 5: Start Attempt (Learner)
```bash
POST /lessons/lesson_456/quizzes/quiz_123/start
Authorization: Bearer <learner_token>

Response: attempt_1 with all questions
```

### Step 6: Submit Answer (Learner)
```bash
POST /lessons/lesson_456/quizzes/quiz_123/attempts/attempt_1/answers
Authorization: Bearer <learner_token>

{
  "questionId": "q_1",
  "selectedOption": "opt_1"
}
```

### Step 7: Submit Quiz (Learner)
```bash
POST /lessons/lesson_456/quizzes/quiz_123/attempts/attempt_1/submit
Authorization: Bearer <learner_token>

Response: attempt_1 with score=1, percentage=100
```

### Step 8: View Results (Trainer)
```bash
GET /lessons/lesson_456/quizzes/quiz_123/results
Authorization: Bearer <trainer_token>

Response: All attempts with learner scores
```

---

## Best Practices

1. **Quiz Creation Workflow**:
   - Create quiz in draft state
   - Add all questions
   - Add options to questions
   - Publish when ready

2. **Grading**:
   - Multiple choice questions grade automatically
   - Short answer questions need manual grading (via external system)
   - Passing score should be 50-75 for difficulty balance

3. **Attempts**:
   - Set attemptsAllowed to -1 for unlimited attempts
   - Set timeLimit to null for untimed quizzes
   - Always verify quiz status is "published" before learner attempt

4. **Question Design**:
   - Use shuffleQuestions for randomized question order
   - Provide clear explanations for learning
   - Balance points across questions proportionally to difficulty

---

## Commit Information

**Commit Hash**: 0ffe521  
**Date**: 2025-01-26  
**Files Changed**: 6  
**Insertions**: 870+  

**Files Added**:
- `src/courses/quizzes.service.ts` - Quiz business logic
- `src/courses/quizzes.controller.ts` - Quiz API endpoints
- `src/courses/dto/quizzes.dto.ts` - Data transfer objects
- `prisma/migrations/20251126120956_add_quiz_models/migration.sql` - Database migration

**Files Modified**:
- `src/courses/courses.module.ts` - Added QuizzesService and QuizzesController
- `prisma/schema.prisma` - Added 5 new models (Quiz, QuizQuestion, QuizOption, QuizAttempt, QuizAnswer)

---

## Status

✅ Quiz endpoints fully implemented  
✅ CRUD operations for all entities  
✅ Automatic grading for objective questions  
✅ Attempt tracking and progress  
✅ Role-based access control  
✅ Database migration completed  
✅ TypeScript compilation successful (0 errors)  
✅ Committed and pushed to GitHub
