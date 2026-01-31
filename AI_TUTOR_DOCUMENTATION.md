# Comprehensive AI Tutor & Hands-On Exercise System

## Overview

The AI Tutor system is a comprehensive learning platform that combines intelligent code evaluation, dynamic exercise generation, and personalized learning paths. It helps students learn programming through interactive exercises, AI-powered feedback, and guidance.

## Architecture

### Core Components

1. **AI Tutor Service** (`ai-tutor.service.ts`)
   - Intelligent code evaluation using GPT-4
   - Dynamic exercise generation
   - Student progress analysis
   - Code comparison and debugging assistance
   - Interactive quiz generation

2. **AI Tutor Controller** (`ai-tutor.controller.ts`)
   - RESTful endpoints for all AI tutor features
   - Student question answering
   - Dynamic exercise generation
   - Progress tracking
   - Learning resource access

3. **Exercises Service** (`exercises.service.ts`)
   - Exercise CRUD operations
   - Code submission handling
   - Test case execution
   - Attempt tracking

4. **Code Validation Service** (`code-validation.service.ts`)
   - Syntax validation
   - Code quality analysis
   - Edge case suggestions

5. **Template Generator Service** (`exercise-template-generator.service.ts`)
   - Bug-fix template generation
   - Code completion templates
   - Refactoring templates
   - Debug/trace templates
   - Multiple-choice code templates

## Key Features

### 1. Question Answering
Students can ask any programming question and get detailed, educational responses.

**Endpoint:** `POST /api/ai-tutor/ask-question`

```json
{
  "question": "What is a callback function in JavaScript?",
  "context": "JavaScript async programming",
  "questionType": "concept"
}
```

### 2. Dynamic Exercise Generation
Generate unlimited exercises on any topic with automatic test cases and hints.

**Endpoint:** `POST /api/ai-tutor/generate-exercise`

```json
{
  "topic": "Array manipulation and loops",
  "difficulty": "beginner",
  "category": "code-completion",
  "description": "Learn to work with arrays",
  "programmingLanguage": "javascript",
  "lessonId": "lesson-123",
  "courseId": "course-456"
}
```

### 3. Code Submission & Evaluation
Submit code for automatic evaluation with:
- Syntax validation
- Test case execution
- AI-powered feedback
- Code quality scoring

**Endpoint:** `POST /api/exercises/{exerciseId}/submit`

```json
{
  "submittedCode": "function sum(arr) { return arr.reduce((a, b) => a + b, 0); }",
  "output": "15"
}
```

**Response:**
```json
{
  "submission": {
    "id": "sub-123",
    "score": 95,
    "status": "reviewed"
  },
  "testResults": [
    { "testId": "test-1", "passed": true },
    { "testId": "test-2", "passed": true }
  ],
  "feedback": {
    "isCorrect": true,
    "score": 95,
    "feedback": "Great job!",
    "suggestions": [],
    "commonMistakes": [],
    "nextSteps": []
  },
  "qualityAnalysis": {
    "score": 85,
    "issues": []
  }
}
```

### 4. Progress Analysis
Get AI-generated insights about learning progress.

**Endpoint:** `GET /api/ai-tutor/analyze-progress`

```json
{
  "totalExercises": 15,
  "completed": 12,
  "successRate": 80,
  "weakAreas": ["recursion", "dynamic-programming"],
  "strongAreas": ["arrays", "strings"],
  "recommendedTopics": ["Advanced recursion", "Algorithm optimization"]
}
```

### 5. Code Comparison
Compare your solution with the reference solution.

**Endpoint:** `POST /api/ai-tutor/compare-solutions`

```json
{
  "studentCode": "function sum(arr) { let s = 0; for(let i=0; i<arr.length; i++) s += arr[i]; return s; }",
  "referenceCode": "function sum(arr) { return arr.reduce((a, b) => a + b, 0); }",
  "exerciseTitle": "Array Sum"
}
```

### 6. Debug Assistance
Get help debugging errors.

**Endpoint:** `POST /api/ai-tutor/debug-help`

```json
{
  "errorMessage": "TypeError: Cannot read property 'length' of undefined",
  "code": "function process(arr) { return arr.length; }",
  "programmingLanguage": "javascript"
}
```

### 7. Code Explanation
Get detailed explanations of code.

**Endpoint:** `POST /api/ai-tutor/explain-code`

```json
{
  "code": "const nums = [1,2,3]; const doubled = nums.map(n => n * 2);",
  "programmingLanguage": "javascript",
  "detailLevel": "beginner"
}
```

### 8. Interactive Quiz Generation
Generate quizzes to test understanding.

**Endpoint:** `POST /api/ai-tutor/generate-quiz`

```json
{
  "topicOrCode": "Array methods in JavaScript",
  "difficulty": "intermediate",
  "numberOfQuestions": 5
}
```

### 9. Personalized Exercise Generation
Get exercises tailored to weak areas.

**Endpoint:** `POST /api/ai-tutor/personalized-exercise`

```json
{
  "userId": "user-123",
  "lessonId": "lesson-456",
  "difficulty": "intermediate",
  "weakAreas": ["recursion", "closures"]
}
```

### 10. Hint System
Get AI-generated hints when stuck.

**Endpoint:** `POST /api/exercises/{exerciseId}/hint`

```json
{
  "lastAttemptCode": "function factorial(n) { ... }"
}
```

## Database Models

### Exercise
- `id`: UUID
- `lessonId`: Foreign key to Lesson
- `tenantId`: Tenant ID
- `title`: Exercise title
- `instructions`: How to complete
- `difficulty`: beginner | intermediate | advanced
- `category`: bug-fix | code-completion | code-refactoring | debug
- `startingCode`: Initial code provided
- `testCases`: JSON array of test cases
- `highlightedSections`: JSON array of hints

### ExerciseTemplate
- `id`: UUID
- `tenantId`: Tenant ID
- `name`: Template name
- `structure`: JSON template structure
- `category`: Template category
- `status`: active | archived

### ExerciseSubmission
- `id`: UUID
- `exerciseId`: Foreign key
- `userId`: Learner ID
- `submittedCode`: Student's code
- `score`: 0-100
- `feedback`: AI-generated feedback
- `testResults`: JSON array of test results
- `status`: pending | reviewed | graded

### ExerciseAttempt
- `id`: UUID
- `exerciseId`: Foreign key
- `userId`: Learner ID
- `attemptCount`: Number of attempts
- `passed`: Whether attempt was successful

## Template Types

### 1. Bug Fix Template
```
const template = templateGenerator.generateBugFixTemplate({
  title: "Fix the Login Bug",
  buggyCode: "function login() { if (user = email) { ... } }",
  hints: ["Check the comparison operator", "Look at the if condition"]
});
```

### 2. Code Completion Template
```
const template = templateGenerator.generateCodeCompletionTemplate({
  title: "Complete the Sort Function",
  incompleteCode: "function sort(arr) { // TODO: implement }",
  blanks: [
    { position: 25, hint: "Compare adjacent elements" }
  ]
});
```

### 3. Refactoring Template
```
const template = templateGenerator.generateRefactoringTemplate({
  title: "Refactor for Readability",
  workingCode: "...",
  improvementAreas: ["Use ES6 syntax", "Extract helper functions"]
});
```

### 4. Debug/Trace Template
```
const template = templateGenerator.generateDebugTemplate({
  title: "Trace Execution",
  code: "...",
  expectedBehavior: "Should return 10",
  questions: ["What is the value after line 5?"]
});
```

## Permissions Required

All AI tutor endpoints require:
- `JwtAuthGuard`: User must be authenticated
- Exercise creation requires: `admin.manage` permission
- Students can access their own submissions

## API Response Formats

### Success Response
```json
{
  "data": { ... },
  "status": 200,
  "message": "Success"
}
```

### Error Response
```json
{
  "error": "Error message",
  "status": 400,
  "details": { ... }
}
```

## Workflow Example

### Student Learning Journey

1. **Student asks question:**
   ```
   POST /api/ai-tutor/ask-question
   { "question": "What is recursion?" }
   ```

2. **AI Tutor provides explanation:**
   ```
   Gets educational response with examples
   ```

3. **Student generates practice exercise:**
   ```
   POST /api/ai-tutor/generate-exercise
   { "topic": "Recursion basics", "difficulty": "beginner" }
   ```

4. **Student submits code:**
   ```
   POST /api/exercises/{exerciseId}/submit
   { "submittedCode": "function factorial(n) { ... }" }
   ```

5. **AI evaluates and provides feedback:**
   - Runs test cases
   - Analyzes code quality
   - Provides AI-generated feedback

6. **Student can request hints:**
   ```
   POST /api/exercises/{exerciseId}/hint
   ```

7. **System tracks progress:**
   ```
   GET /api/ai-tutor/analyze-progress
   ```

## Configuration

### Environment Variables
```
OPENAI_API_KEY=sk-proj-xxxxx
DATABASE_URL=postgresql://...
JWT_SECRET=xxxxx
```

### AI Model Configuration
- Model: GPT-4
- Temperature: 0.6-0.8 (adjustable per endpoint)
- Max tokens: 500-1500 (varies by endpoint)

## Performance Considerations

1. **Exercise Generation**: ~5-10 seconds (API call to OpenAI)
2. **Feedback Generation**: ~3-8 seconds
3. **Progress Analysis**: ~2-5 seconds
4. **Question Answering**: ~4-7 seconds

## Caching Strategy
- Cache generated exercises for 24 hours
- Cache progress analysis for 1 hour
- Real-time feedback (no cache)

## Error Handling

### Common Errors
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: AI service unavailable

### Fallback Behavior
If OpenAI API fails:
- Provide rule-based feedback instead of AI
- Use cached templates
- Return helpful error message

## Testing

### Test Cases
```typescript
// Test exercise creation
POST /api/exercises
{ lessonId, title, instructions, ... }

// Test code submission
POST /api/exercises/{exerciseId}/submit
{ submittedCode, ... }

// Test question answering
POST /api/ai-tutor/ask-question
{ question: "..." }
```

## Future Enhancements

1. **Code Execution Environment**: Integrate Piston API for safe code execution
2. **Peer Review**: Allow students to review each other's code
3. **Badges & Gamification**: Reward progress with achievements
4. **Video Integration**: Generate video explanations
5. **Multi-language Support**: Support more programming languages
6. **Real-time Collaboration**: Pair programming exercises
7. **Mobile App**: Native mobile experience

## Security Considerations

1. **API Key Protection**: Never expose OPENAI_API_KEY
2. **Rate Limiting**: Limit AI calls per user
3. **Code Sandboxing**: Run user code safely
4. **Input Validation**: Validate all inputs
5. **Authentication**: Require JWT for all endpoints

## Support & Resources

- API Documentation: `/api/docs`
- Contact: support@ironclad.local
- Help Center: https://help.ironclad.local
