# Exercise & AI Tutor API - Complete Schema Reference

## Table of Contents
1. [Shared Schemas](#shared-schemas)
2. [Exercise Templates](#exercise-templates)
3. [Exercise Management](#exercise-management)
4. [Code Submissions](#code-submissions)
5. [AI Tutor Endpoints](#ai-tutor-endpoints)

---

## Shared Schemas

### User Context (from JWT)
```typescript
{
  id: string (UUID);           // User ID
  email: string;               // User email
  tenantId: string (UUID);     // Tenant ID (organization)
  roles?: string[];            // User roles
}
```

### Standard Response Wrapper
```typescript
{
  data: T;                     // The actual response data (varies by endpoint)
  status?: number;             // HTTP status code
  message?: string;            // Optional success message
  timestamp?: string (ISO);    // Response timestamp
}
```

### Error Response
```typescript
{
  error: string;               // Error message
  status: number;              // HTTP status code
  details?: Record<string, any>; // Additional error details
  timestamp?: string (ISO);    // Error timestamp
}
```

### Pagination
```typescript
{
  total: number;               // Total items available
  limit: number;               // Items per page
  offset: number;              // Current offset
  hasMore: boolean;            // Whether more items exist
}
```

---

## Exercise Templates

### 1. Create Exercise Template

**POST** `/api/exercises/templates`

#### Request Schema
```typescript
{
  name: string (required);                    // Template name, 1-255 chars
  description?: string;                       // Optional template description
  category: string (enum, required);          // One of: "bug-fix", "code-completion", "code-refactoring", "debug"
  structure: string (required);               // JSON string with template structure
}
```

**Structure field example:**
```typescript
{
  type: "bug-fix" | "code-completion" | "refactoring" | "debug";
  title?: string;
  description?: string;
  buggyCode?: string;            // For bug-fix templates
  incompleteCode?: string;       // For code-completion templates
  workingCode?: string;          // For refactoring templates
  expectedBehavior?: string;
  hints?: string[];
  blanks?: Array<{ position: number; hint: string }>;
  improvementAreas?: string[];
  questions?: string[];
  testCases?: Array<{ input: string; expectedOutput: string }>;
}
```

#### Response Schema
```typescript
{
  data: {
    id: string (UUID);
    tenantId: string (UUID);
    name: string;
    description?: string;
    category: string;
    status: "active" | "archived";
    structure: object;
    createdBy: string (UUID);
    createdAt: string (ISO 8601);
    updatedAt: string (ISO 8601);
  }
}
```

---

### 2. Get Exercise Templates

**GET** `/api/exercises/templates?category=bug-fix`

#### Query Parameters
```typescript
{
  category?: string;            // Filter by: "bug-fix", "code-completion", "code-refactoring", "debug"
  limit?: number;               // Default: 10, Max: 100
  offset?: number;              // Default: 0
}
```

#### Response Schema
```typescript
{
  data: Array<{
    id: string (UUID);
    name: string;
    description?: string;
    category: string;
    status: "active" | "archived";
    createdBy: string (UUID);
    createdAt: string (ISO 8601);
  }>,
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  }
}
```

---

## Exercise Management

### 3. Create Hands-On Exercise

**POST** `/api/exercises`

#### Request Schema
```typescript
{
  lessonId: string (UUID, required);          // Lesson this exercise belongs to
  templateId?: string (UUID);                 // Optional template to use
  title: string (required);                   // Exercise title, 1-255 chars
  description?: string;                       // Optional long description
  instructions: string (required);            // How to complete the exercise
  difficulty: string (enum, required);        // One of: "beginner", "intermediate", "advanced"
  category: string (enum, required);          // One of: "bug-fix", "code-completion", "code-refactoring", "debug"
  startingCode: string (required);            // Initial code provided to student
  expectedOutput?: string;                    // What the correct output should be
  testCases: string (JSON, required);         // JSON string array of test cases
  highlightedSections: string (JSON, required); // JSON string array of highlighted sections
  multipleChoiceOptions?: string (JSON);      // JSON string array for multiple choice exercises
}
```

**testCases format:**
```typescript
[
  {
    id?: string;
    input: string;
    expectedOutput: string;
    description?: string;
    hidden?: boolean;           // Whether to hide from student
  }
]
```

**highlightedSections format:**
```typescript
[
  {
    startLine: number;
    endLine: number;
    hint: string;               // Hint for this section
    explanation?: string;
  }
]
```

**multipleChoiceOptions format:**
```typescript
[
  {
    id: string;
    text: string;               // Option text
    isCorrect: boolean;
    explanation?: string;       // Why this is/isn't correct
  }
]
```

#### Response Schema
```typescript
{
  data: {
    id: string (UUID);
    lessonId: string (UUID);
    tenantId: string (UUID);
    title: string;
    description?: string;
    instructions: string;
    difficulty: string;
    category: string;
    startingCode: string;
    expectedOutput?: string;
    testCases: Array<{ id: string; input: string; expectedOutput: string; ... }>;
    highlightedSections: Array<{ startLine: number; endLine: number; hint: string; ... }>;
    multipleChoiceOptions?: Array<{ id: string; text: string; isCorrect: boolean; ... }>;
    status: "draft" | "published" | "archived";
    createdBy: string (UUID);
    createdAt: string (ISO 8601);
    updatedAt: string (ISO 8601);
  }
}
```

---

### 4. Get Exercises for Lesson

**GET** `/api/exercises/lesson/{lessonId}?limit=20&offset=0`

#### Path Parameters
```typescript
{
  lessonId: string (UUID, required);
}
```

#### Query Parameters
```typescript
{
  limit?: number;               // Default: 20, Max: 100
  offset?: number;              // Default: 0
  status?: string;              // Filter: "draft", "published", "archived"
}
```

#### Response Schema
```typescript
{
  data: Array<{
    id: string (UUID);
    lessonId: string (UUID);
    title: string;
    difficulty: string;
    category: string;
    status: string;
    createdAt: string (ISO 8601);
  }>,
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  }
}
```

---

### 5. Get Exercise Details

**GET** `/api/exercises/{exerciseId}`

#### Path Parameters
```typescript
{
  exerciseId: string (UUID, required);
}
```

#### Response Schema
```typescript
{
  data: {
    id: string (UUID);
    lessonId: string (UUID);
    tenantId: string (UUID);
    title: string;
    description?: string;
    instructions: string;
    difficulty: string;
    category: string;
    startingCode: string;
    expectedOutput?: string;
    testCases: Array<{
      id: string;
      input: string;
      expectedOutput: string;
      description?: string;
      hidden?: boolean;
    }>;
    highlightedSections: Array<{
      startLine: number;
      endLine: number;
      hint: string;
      explanation?: string;
    }>;
    multipleChoiceOptions?: Array<{
      id: string;
      text: string;
      isCorrect: boolean;
      explanation?: string;
    }>;
    status: "draft" | "published" | "archived";
    createdBy: string (UUID);
    createdAt: string (ISO 8601);
    updatedAt: string (ISO 8601);
  }
}
```

---

### 6. Update Exercise

**PUT** `/api/exercises/{exerciseId}`

#### Path Parameters
```typescript
{
  exerciseId: string (UUID, required);
}
```

#### Request Schema (All fields optional)
```typescript
{
  title?: string;
  description?: string;
  instructions?: string;
  difficulty?: string;
  startingCode?: string;
  expectedOutput?: string;
  testCases?: string (JSON);
  highlightedSections?: string (JSON);
  multipleChoiceOptions?: string (JSON);
  status?: "draft" | "published" | "archived";
}
```

#### Response Schema
```typescript
{
  data: {
    id: string (UUID);
    title: string;
    status: string;
    updatedAt: string (ISO 8601);
    ...same as Get Exercise Details
  }
}
```

---

### 7. Generate Exercise from Template

**POST** `/api/exercises/generate-from-template`

#### Request Schema
```typescript
{
  templateId: string (UUID, required);
  lessonId: string (UUID, required);
  title: string (required);
  description?: string;
  difficulty: string (enum, required);      // "beginner", "intermediate", "advanced"
  startingCode: string (required);
  expectedOutput: string (required);
  testCases: string (JSON, required);
}
```

#### Response Schema
```typescript
{
  data: {
    id: string (UUID);
    lessonId: string (UUID);
    templateId: string (UUID);
    title: string;
    difficulty: string;
    status: "published";
    createdAt: string (ISO 8601);
    ...other exercise fields
  }
}
```

---

## Code Submissions

### 8. Submit Exercise Code

**POST** `/api/exercises/{exerciseId}/submit`

#### Path Parameters
```typescript
{
  exerciseId: string (UUID, required);
}
```

#### Request Schema
```typescript
{
  submittedCode: string (required);          // The code submitted by student
  selectedOption?: string;                   // For multiple choice exercises
  output?: string;                           // Optional expected output
}
```

#### Response Schema
```typescript
{
  data: {
    submission: {
      id: string (UUID);
      exerciseId: string (UUID);
      userId: string (UUID);
      score: number (0-100);
      status: "pending" | "reviewed" | "graded";
      submittedAt: string (ISO 8601);
      reviewedAt?: string (ISO 8601);
    },
    testResults: Array<{
      testId: string;
      passed: boolean;
      input: string;
      expectedOutput: string;
      actualOutput: string;
      error?: string;
    }>,
    feedback: {
      isCorrect: boolean;
      score: number (0-100);
      feedback: string;                      // AI-generated feedback
      suggestions: string[];
      commonMistakes: string[];
      nextSteps: string[];
    },
    qualityAnalysis: {
      score: number (0-100);
      issues: Array<{
        type: string;
        message: string;
        line?: number;
      }>;
    }
  }
}
```

---

### 9. Get My Submissions

**GET** `/api/exercises/submissions/my?exerciseId=xxx&limit=10&offset=0`

#### Query Parameters
```typescript
{
  exerciseId?: string (UUID);                // Filter by specific exercise
  limit?: number;                            // Default: 10, Max: 100
  offset?: number;                           // Default: 0
  status?: string;                           // Filter: "pending", "reviewed", "graded"
}
```

#### Response Schema
```typescript
{
  data: Array<{
    id: string (UUID);
    exerciseId: string (UUID);
    exerciseTitle: string;
    score: number (0-100);
    status: string;
    feedback: string;
    submittedAt: string (ISO 8601);
  }>,
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  }
}
```

---

### 10. Get Submission Details

**GET** `/api/exercises/submissions/{submissionId}`

#### Path Parameters
```typescript
{
  submissionId: string (UUID, required);
}
```

#### Response Schema
```typescript
{
  data: {
    id: string (UUID);
    exerciseId: string (UUID);
    userId: string (UUID);
    exerciseTitle: string;
    submittedCode: string;
    score: number (0-100);
    status: "pending" | "reviewed" | "graded";
    testResults: Array<{
      testId: string;
      passed: boolean;
      input: string;
      expectedOutput: string;
      actualOutput: string;
      error?: string;
    }>,
    feedback: {
      isCorrect: boolean;
      score: number (0-100);
      feedback: string;
      suggestions: string[];
      commonMistakes: string[];
      nextSteps: string[];
    },
    submittedAt: string (ISO 8601);
    reviewedAt?: string (ISO 8601);
  }
}
```

---

### 11. Get AI Hint

**POST** `/api/exercises/{exerciseId}/hint`

#### Path Parameters
```typescript
{
  exerciseId: string (UUID, required);
}
```

#### Request Schema
```typescript
{
  lastAttemptCode?: string;                  // Student's previous attempt
}
```

#### Response Schema
```typescript
{
  data: {
    hint: string;
    relatedConcept?: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    tipCount?: number;
  }
}
```

---

### 12. Suggest Edge Cases

**GET** `/api/exercises/{exerciseId}/edge-cases`

#### Path Parameters
```typescript
{
  exerciseId: string (UUID, required);
}
```

#### Request Body (Optional)
```typescript
{
  lastAttemptCode?: string;
}
```

#### Response Schema
```typescript
{
  data: {
    suggestions: string[];                  // Array of edge case suggestions
    explanation: string;
    count: number;
  }
}
```

---

## AI Tutor Endpoints

### 13. Ask AI Tutor Question

**POST** `/api/ai-tutor/ask-question`

#### Request Schema
```typescript
{
  question: string (required);               // The question to ask
  context?: string;                          // Code or exercise context
  questionType?: string (enum);              // "concept", "debugging", "optimization", "best-practices", "general"
  exerciseId?: string (UUID);                // Related exercise (if any)
}
```

#### Response Schema
```typescript
{
  data: {
    answer: string;                          // AI-generated answer
    difficulty: "beginner" | "intermediate" | "advanced";
    relatedConcepts: string[];               // Related programming concepts
    codeExample?: string;                    // Example code if applicable
    resources?: Array<{
      title: string;
      url: string;
      type: "tutorial" | "documentation" | "article";
    }>;
  }
}
```

---

### 14. Generate Exercise Dynamically

**POST** `/api/ai-tutor/generate-exercise`

#### Request Schema (Flexible - supports multiple formats)
```typescript
{
  topic: string (required);                  // Topic to generate exercise on
  difficulty: string (enum, required);       // "beginner", "intermediate", "advanced"
  category?: string (enum);                  // "bug-fix", "code-completion", "code-refactoring", "debug"
  description?: string;
  programmingLanguage?: string;              // Defaults to "javascript"
  language?: string;                         // Alias for programmingLanguage
  lessonId?: string (UUID);
  courseId?: string (UUID);
  course_id?: string (UUID);                 // Snake case alias
}
```

#### Response Schema
```typescript
{
  data: {
    exercise: {
      title: string;
      description: string;
      instructions: string;
      difficulty: string;
      category: string;
      programmingLanguage: string;
      startingCode: string;
      expectedOutput: string;
      testCases: Array<{
        input: string;
        expectedOutput: string;
      }>;
      highlightedSections: Array<{
        startLine: number;
        endLine: number;
        hint: string;
      }>;
    },
    savedExerciseId?: string (UUID);         // If saved to database
    message: string;
  }
}
```

---

### 15. Analyze Student Progress

**GET** `/api/ai-tutor/analyze-progress`

#### Query Parameters
```typescript
{
  userId?: string (UUID);                    // Defaults to current user
  lessonId?: string (UUID);
  courseId?: string (UUID);
}
```

#### Response Schema
```typescript
{
  data: {
    totalExercises: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    successRate: number (0-100);
    averageScore: number (0-100);
    totalAttempts: number;
    weakAreas: Array<{
      topic: string;
      successRate: number (0-100);
      attempts: number;
    }>;
    strongAreas: Array<{
      topic: string;
      successRate: number (0-100);
      attempts: number;
    }>;
    recommendedTopics: string[];
    timeSpentHours: number;
    lastActivityAt: string (ISO 8601);
    nextMilestone: string;
  }
}
```

---

### 16. Get Personalized Exercise

**POST** `/api/ai-tutor/personalized-exercise`

#### Request Schema
```typescript
{
  userId: string (UUID, required);
  lessonId: string (UUID, required);
  difficulty: string (enum, required);      // "beginner", "intermediate", "advanced"
  weakAreas?: string[];                      // Topics to focus on
}
```

#### Response Schema
```typescript
{
  data: {
    exercise: {
      title: string;
      description: string;
      instructions: string;
      difficulty: string;
      category: string;
      startingCode: string;
      expectedOutput: string;
      testCases: Array<{ input: string; expectedOutput: string }>;
      highlightedSections: Array<{ startLine: number; endLine: number; hint: string }>;
    },
    personalizationReason: string;           // Why this exercise was chosen
    estimatedDifficulty: string;
    suggestedTimeMinutes: number;
  }
}
```

---

### 17. Compare Code Solutions

**POST** `/api/ai-tutor/compare-solutions`

#### Request Schema
```typescript
{
  studentCode: string (required);
  referenceCode: string (required);
  exerciseTitle: string (required);
  expectedOutput?: string;
}
```

#### Response Schema
```typescript
{
  data: {
    comparison: {
      studentApproach: string;
      referenceApproach: string;
      codeSmells: Array<{
        issue: string;
        suggestion: string;
      }>;
    },
    improvements: string[];
    whatWentWell: string[];
    performanceComparison: {
      studentCodeTime: string;               // Big-O notation
      referenceCodeTime: string;
      studentCodeSpace: string;
      referenceCodeSpace: string;
      conclusion: string;
    },
    relatedConcepts: string[];
  }
}
```

---

### 18. Debug Assistance

**POST** `/api/ai-tutor/debug-help`

#### Request Schema
```typescript
{
  errorMessage: string (required);
  code: string (required);
  programmingLanguage: string (required);    // "javascript", "python", "java", etc.
  stackTrace?: string;
}
```

#### Response Schema
```typescript
{
  data: {
    errorExplanation: string;
    whyItHappens: string;
    debuggingSteps: string[];
    solutions: Array<{
      approach: string;
      code: string;
    }>;
    commonMistakes: string[];
    preventionTips: string[];
  }
}
```

---

### 19. Explain Code

**POST** `/api/ai-tutor/explain-code`

#### Request Schema
```typescript
{
  code: string (required);
  programmingLanguage: string (required);
  detailLevel?: "beginner" | "intermediate" | "advanced";  // Default: "intermediate"
}
```

#### Response Schema
```typescript
{
  data: {
    summary: string;
    lineByLineExplanation: Array<{
      line: number;
      code: string;
      explanation: string;
    }>;
    conceptsUsed: string[];
    keyTakeaways: string[];
    relatedTopics: string[];
    visualDiagram?: string;                  // ASCII diagram if applicable
  }
}
```

---

### 20. Generate Interactive Quiz

**POST** `/api/ai-tutor/generate-quiz`

#### Request Schema
```typescript
{
  topicOrCode: string (required);            // Topic name or code snippet
  difficulty: string (enum, required);       // "beginner", "intermediate", "advanced"
  exerciseId?: string (UUID);
  numberOfQuestions?: number;                // Default: 5, Max: 20
}
```

#### Response Schema
```typescript
{
  data: {
    quiz: {
      title: string;
      totalQuestions: number;
      questions: Array<{
        id: string;
        question: string;
        options: Array<{
          id: string;
          text: string;
          isCorrect: boolean;
        }>;
        explanation: string;
        difficulty: string;
      }>;
    },
    estimatedTime: string;                   // e.g., "10 minutes"
    difficulty: string;
    passingScore: number;                    // Usually 70-80
  }
}
```

---

### 21. Get Concept Explanation

**GET** `/api/ai-tutor/concept/{concept}`

#### Path Parameters
```typescript
{
  concept: string (required);                // Programming concept name
}
```

#### Query Parameters
```typescript
{
  programmingLanguage?: string;              // "javascript", "python", etc.
  detailLevel?: "beginner" | "intermediate" | "advanced";
}
```

#### Response Schema
```typescript
{
  data: {
    concept: string;
    definition: string;
    explanation: string;
    codeExamples: Array<{
      title: string;
      code: string;
      explanation: string;
      programmingLanguage: string;
    }>;
    commonUses: string[];
    advantages: string[];
    disadvantages: string[];
    relatedConcepts: string[];
    resources: Array<{
      title: string;
      url: string;
      type: "tutorial" | "documentation" | "article";
    }>;
  }
}
```

---

## Enum Values Reference

### Difficulty Levels
```typescript
"beginner"       // For beginners, basic concepts
"intermediate"   // Intermediate level, more complex
"advanced"       // Advanced level, complex topics
```

### Exercise Categories
```typescript
"bug-fix"        // Find and fix bugs in code
"code-completion"// Complete partial code
"code-refactoring" // Improve existing code
"debug"          // Trace and debug code execution
```

### Question Types
```typescript
"concept"        // Questions about programming concepts
"debugging"      // Debugging and error handling
"optimization"   // Performance optimization
"best-practices" // Best practices and standards
"general"        // General programming questions
```

### Submission Status
```typescript
"pending"        // Submitted, awaiting review
"reviewed"       // Reviewed by AI tutor
"graded"         // Final grade assigned
```

### Exercise Status
```typescript
"draft"          // In progress, not published
"published"      // Published and available to students
"archived"       // Archived, hidden from students
```

### Template Status
```typescript
"active"         // Available for use
"archived"       // No longer available
```

---

## Common Field Types

| Type | Format | Example |
|------|--------|---------|
| UUID | String (36 chars) | `550e8400-e29b-41d4-a716-446655440000` |
| ISO 8601 | String | `2024-01-29T11:30:00.000Z` |
| Email | String | `user@example.com` |
| URL | String | `https://example.com/resource` |
| JSON String | String (valid JSON) | `"[{\"id\": 1}]"` |
| Number | Integer or Float | `0` to `100` |
| Enum | String (one of predefined) | `"beginner"` |
| Boolean | true/false | `true` |

---

## Authentication Header

All endpoints require this header:
```
Authorization: Bearer <jwt_token>
```

The JWT token is obtained from the login endpoint:
```
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "user": { "id": "...", "email": "...", "tenantId": "..." }
  }
}
```

---

## Validation Rules

### String Fields
- Min length: Usually 1-3 characters
- Max length: Usually 255-1000 characters
- Pattern: No special validation unless noted

### Number Fields
- Score: 0-100 (percentage)
- Pagination limit: 1-100
- Pagination offset: >= 0

### UUID Fields
- Must be valid UUID v4 format
- Example: `550e8400-e29b-41d4-a716-446655440000`

### Enum Fields
- Must be one of predefined values
- Case-sensitive
- No other values accepted

### JSON String Fields
- Must be valid JSON when parsed
- Will be validated and stored as JSON in database
- Common fields: testCases, highlightedSections, multipleChoiceOptions

---

## Error Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful GET request |
| 201 | Created | Resource successfully created |
| 400 | Bad Request | Invalid input, missing required fields |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | User lacks required permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists (duplicate) |
| 422 | Unprocessable Entity | Validation failed on submitted data |
| 500 | Internal Server Error | Server error during processing |
| 503 | Service Unavailable | AI service (OpenAI) temporarily unavailable |

---

## Rate Limiting (if applicable)

```
X-RateLimit-Limit: 100       // Max requests per window
X-RateLimit-Remaining: 95    // Remaining requests
X-RateLimit-Reset: 1706545400 // Unix timestamp when limit resets
```

---

## Example Request/Response Flow

### Creating and Submitting an Exercise

**Step 1: Create Exercise**
```
POST /api/exercises

Request:
{
  "lessonId": "lesson-123",
  "title": "Fix the Bug",
  "instructions": "Find and fix the bug",
  "difficulty": "beginner",
  "category": "bug-fix",
  "startingCode": "function add(a, b) { return a - b; }",
  "expectedOutput": "5",
  "testCases": "[{\"input\": \"2, 3\", \"expectedOutput\": \"5\"}]",
  "highlightedSections": "[{\"startLine\": 1, \"endLine\": 1, \"hint\": \"Check the operator\"}]"
}

Response (201 Created):
{
  "data": {
    "id": "exercise-456",
    "lessonId": "lesson-123",
    "title": "Fix the Bug",
    "status": "published",
    ...
  }
}
```

**Step 2: Submit Code**
```
POST /api/exercises/exercise-456/submit

Request:
{
  "submittedCode": "function add(a, b) { return a + b; }"
}

Response (200 OK):
{
  "data": {
    "submission": {
      "id": "sub-789",
      "score": 100,
      "status": "reviewed"
    },
    "testResults": [
      {"testId": "test-1", "passed": true}
    ],
    "feedback": {
      "isCorrect": true,
      "score": 100,
      "feedback": "Perfect! You fixed the bug."
    }
  }
}
```

**Step 3: Get Submission Details**
```
GET /api/exercises/submissions/sub-789

Response (200 OK):
{
  "data": {
    "id": "sub-789",
    "exerciseId": "exercise-456",
    "score": 100,
    "feedback": {...},
    "submittedAt": "2024-01-29T12:00:00Z"
  }
}
```
