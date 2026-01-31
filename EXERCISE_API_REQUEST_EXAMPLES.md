# Exercise & AI Tutor - Complete Request Body Examples

## 📋 Table of Contents
1. [Exercise Templates](#exercise-templates)
2. [Exercise Management](#exercise-management)
3. [Code Submissions](#code-submissions)
4. [AI Tutor - Questions](#ai-tutor---questions)
5. [AI Tutor - Exercise Generation](#ai-tutor---exercise-generation)
6. [AI Tutor - Analysis & Learning](#ai-tutor---analysis--learning)
7. [AI Tutor - Code Tools](#ai-tutor---code-tools)

---

## Exercise Templates

### 1. Create Exercise Template
**Endpoint:** `POST /api/exercises/templates`

**Description:** Teachers and platform admins create reusable exercise templates

**Request Body:**
```json
{
  "name": "Bug Fix Exercise Template",
  "description": "Template for creating bug fixing exercises",
  "category": "bug-fix",
  "structure": {
    "type": "bug-fix",
    "title": "{title}",
    "buggyCode": "{code}",
    "hints": ["{hint1}", "{hint2}"],
    "expectedBehavior": "{expected}",
    "testCases": "{tests}"
  }
}
```

**Alternative Examples:**

**Code Completion Template:**
```json
{
  "name": "Code Completion Template",
  "description": "Complete the function implementation",
  "category": "code-completion",
  "structure": {
    "type": "code-completion",
    "incompleteCode": "function sum(arr) {\n  // TODO: implement\n}",
    "blanks": [
      { "position": 25, "hint": "Compare adjacent elements" }
    ],
    "expectedOutput": "Sum of all array elements"
  }
}
```

**Refactoring Template:**
```json
{
  "name": "Code Refactoring Template",
  "description": "Refactor code for better performance",
  "category": "code-refactoring",
  "structure": {
    "type": "refactoring",
    "workingCode": "function process(arr) { for(let i=0; i<arr.length; i++) { console.log(arr[i]); } }",
    "improvementAreas": [
      "Use ES6 syntax",
      "Use map or forEach instead of loop"
    ]
  }
}
```

**Debug/Trace Template:**
```json
{
  "name": "Debug Trace Template",
  "description": "Trace execution and find bugs",
  "category": "debug",
  "structure": {
    "type": "debug",
    "code": "function fibonacci(n) { if (n <= 1) return n; return fibonacci(n-1) + fibonacci(n-2); }",
    "expectedBehavior": "Should return nth Fibonacci number",
    "questions": [
      "What is the value after line 5?",
      "Why is this inefficient?"
    ]
  }
}
```

**Response:**
```json
{
  "data": {
    "id": "template-uuid-123",
    "tenantId": "tenant-123",
    "name": "Bug Fix Exercise Template",
    "category": "bug-fix",
    "status": "active",
    "createdAt": "2024-01-29T10:30:00Z",
    "updatedAt": "2024-01-29T10:30:00Z"
  }
}
```

---

### 2. Get Exercise Templates
**Endpoint:** `GET /api/exercises/templates?category=bug-fix`

**Query Parameters:**
- `category` (optional): Filter by category (bug-fix, code-completion, code-refactoring, debug)

**Response:**
```json
{
  "data": [
    {
      "id": "template-uuid-123",
      "name": "Bug Fix Exercise Template",
      "description": "Template for creating bug fixing exercises",
      "category": "bug-fix",
      "status": "active",
      "createdBy": "user-uuid-456"
    }
  ]
}
```

---

## Exercise Management

### 3. Create Hands-On Exercise
**Endpoint:** `POST /api/exercises`

**Description:** Create a new hands-on exercise with code validation and test cases

**Request Body:**
```json
{
  "lessonId": "lesson-uuid-123",
  "title": "Fix the Login Authentication Bug",
  "description": "Debug and fix the authentication logic",
  "instructions": "The login function is not working correctly. Find and fix the bug. Make sure to handle edge cases.",
  "difficulty": "intermediate",
  "category": "bug-fix",
  "startingCode": "function login(email, password) {\n  if (user = email) {\n    if (pwd == password) {\n      return { success: true };\n    }\n  }\n  return { success: false };\n}",
  "expectedOutput": "Should return success: true only with correct credentials",
  "testCases": "[{\"input\": \"test@example.com, pass123\", \"expectedOutput\": \"success: true\"}, {\"input\": \"wrong@example.com, wrong\", \"expectedOutput\": \"success: false\"}]",
  "highlightedSections": "[{\"start\": 20, \"end\": 25, \"hint\": \"Check the comparison operator\"}, {\"start\": 30, \"end\": 40, \"hint\": \"Verify the password check\"}]"
}
```

**Alternative - Code Completion Exercise:**
```json
{
  "lessonId": "lesson-uuid-123",
  "title": "Complete the Array Sum Function",
  "description": "Write a function that sums all elements in an array",
  "instructions": "Complete the sum function to calculate the total of all numbers in the array.",
  "difficulty": "beginner",
  "category": "code-completion",
  "startingCode": "function sum(arr) {\n  let total = 0;\n  // TODO: complete this\n  return total;\n}",
  "expectedOutput": "15",
  "testCases": "[{\"input\": \"[1,2,3,4,5]\", \"expectedOutput\": \"15\"}, {\"input\": \"[10]\", \"expectedOutput\": \"10\"}, {\"input\": \"[]\", \"expectedOutput\": \"0\"}]",
  "highlightedSections": "[{\"start\": 30, \"end\": 50, \"hint\": \"Use a loop or array methods\"}]"
}
```

**Alternative - Refactoring Exercise:**
```json
{
  "lessonId": "lesson-uuid-123",
  "title": "Refactor to ES6 Syntax",
  "description": "Convert the code to modern JavaScript",
  "instructions": "Refactor this code to use ES6 features like arrow functions, const/let, and template literals.",
  "difficulty": "intermediate",
  "category": "code-refactoring",
  "startingCode": "var multiply = function(a, b) {\n  return a * b;\n};\nfor (var i = 0; i < 10; i++) {\n  console.log(multiply(i, 2));\n}",
  "expectedOutput": "Same output but using modern syntax",
  "testCases": "[{\"input\": \"multiply(5, 3)\", \"expectedOutput\": \"15\"}]",
  "highlightedSections": "[{\"start\": 0, \"end\": 20, \"hint\": \"Use arrow functions\"}]"
}
```

**Alternative - Debug/Trace Exercise:**
```json
{
  "lessonId": "lesson-uuid-123",
  "title": "Trace Execution and Find the Bug",
  "description": "Debug by tracing through code execution",
  "instructions": "Step through this recursive function and identify where the bug occurs.",
  "difficulty": "advanced",
  "category": "debug",
  "startingCode": "function factorial(n) {\n  if (n === 0) return 1;\n  return n * factorial(n-1);\n}",
  "expectedOutput": "120 for factorial(5)",
  "testCases": "[{\"input\": \"factorial(5)\", \"expectedOutput\": \"120\"}, {\"input\": \"factorial(0)\", \"expectedOutput\": \"1\"}]",
  "highlightedSections": "[{\"start\": 15, \"end\": 25, \"hint\": \"Check the base case\"}]"
}
```

**Response:**
```json
{
  "data": {
    "id": "exercise-uuid-789",
    "lessonId": "lesson-uuid-123",
    "tenantId": "tenant-123",
    "title": "Fix the Login Authentication Bug",
    "category": "bug-fix",
    "difficulty": "intermediate",
    "status": "published",
    "createdAt": "2024-01-29T10:30:00Z"
  }
}
```

---

### 4. Get Exercises for Lesson
**Endpoint:** `GET /api/exercises/lesson/{lessonId}`

**Path Parameters:**
- `lessonId`: The UUID of the lesson

**Response:**
```json
{
  "data": [
    {
      "id": "exercise-uuid-789",
      "lessonId": "lesson-uuid-123",
      "title": "Fix the Login Authentication Bug",
      "difficulty": "intermediate",
      "category": "bug-fix",
      "status": "published"
    }
  ]
}
```

---

### 5. Get Exercise Details
**Endpoint:** `GET /api/exercises/{exerciseId}`

**Path Parameters:**
- `exerciseId`: The UUID of the exercise

**Response:**
```json
{
  "data": {
    "id": "exercise-uuid-789",
    "lessonId": "lesson-uuid-123",
    "title": "Fix the Login Authentication Bug",
    "description": "Debug and fix the authentication logic",
    "instructions": "The login function is not working correctly. Find and fix the bug.",
    "difficulty": "intermediate",
    "category": "bug-fix",
    "startingCode": "function login(email, password) { ... }",
    "expectedOutput": "Should return success: true only with correct credentials",
    "testCases": [
      { "input": "test@example.com, pass123", "expectedOutput": "success: true" },
      { "input": "wrong@example.com, wrong", "expectedOutput": "success: false" }
    ],
    "highlightedSections": [
      { "start": 20, "end": 25, "hint": "Check the comparison operator" }
    ],
    "status": "published"
  }
}
```

---

### 6. Update Exercise
**Endpoint:** `PUT /api/exercises/{exerciseId}`

**Path Parameters:**
- `exerciseId`: The UUID of the exercise

**Request Body (All fields optional):**
```json
{
  "title": "Updated Exercise Title",
  "description": "Updated description",
  "instructions": "Updated instructions",
  "difficulty": "advanced",
  "startingCode": "function newCode() { ... }",
  "expectedOutput": "New expected output",
  "testCases": "[{\"input\": \"test\", \"expectedOutput\": \"result\"}]",
  "highlightedSections": "[{\"start\": 0, \"end\": 10, \"hint\": \"Focus here\"}]",
  "status": "archived"
}
```

**Response:**
```json
{
  "data": {
    "id": "exercise-uuid-789",
    "title": "Updated Exercise Title",
    "updatedAt": "2024-01-29T11:00:00Z"
  }
}
```

---

### 7. Generate Exercise from Template
**Endpoint:** `POST /api/exercises/generate-from-template`

**Description:** Quickly create an exercise using a predefined template

**Request Body:**
```json
{
  "templateId": "template-uuid-123",
  "lessonId": "lesson-uuid-123",
  "title": "Debug the Sorting Algorithm",
  "description": "Fix the sorting bug",
  "difficulty": "intermediate",
  "startingCode": "function sort(arr) {\n  for(let i=0; i<arr.length-1; i++) {\n    for(let j=0; j<arr.length-i-1; j++) {\n      if (arr[j] < arr[j+1]) {\n        [arr[j], arr[j+1]] = [arr[j+1], arr[j]];\n      }\n    }\n  }\n  return arr;\n}",
  "expectedOutput": "[5, 4, 3, 2, 1] sorted to [1, 2, 3, 4, 5]",
  "testCases": "[{\"input\": \"[5,2,8,1,9]\", \"expectedOutput\": \"[1,2,5,8,9]\"}, {\"input\": \"[1,2,3]\", \"expectedOutput\": \"[1,2,3]\"}]"
}
```

**Response:**
```json
{
  "data": {
    "id": "exercise-uuid-new",
    "lessonId": "lesson-uuid-123",
    "templateId": "template-uuid-123",
    "title": "Debug the Sorting Algorithm",
    "difficulty": "intermediate",
    "status": "published",
    "createdAt": "2024-01-29T10:30:00Z"
  }
}
```

---

## Code Submissions

### 8. Submit Exercise Code
**Endpoint:** `POST /api/exercises/{exerciseId}/submit`

**Description:** Submit code for validation, testing, and AI feedback

**Request Body:**
```json
{
  "submittedCode": "function login(email, password) {\n  if (user == email) {\n    if (password == password) {\n      return { success: true };\n    }\n  }\n  return { success: false };\n}",
  "output": "success: true"
}
```

**Alternative - Multiple Choice:**
```json
{
  "submittedCode": "function login(email, password) { ... }",
  "selectedOption": "option-2",
  "output": "correct"
}
```

**Response:**
```json
{
  "data": {
    "submission": {
      "id": "submission-uuid-123",
      "exerciseId": "exercise-uuid-789",
      "userId": "user-uuid-456",
      "score": 75,
      "status": "reviewed",
      "submittedAt": "2024-01-29T11:15:00Z"
    },
    "testResults": [
      { "testId": "test-1", "passed": true, "input": "test@example.com", "expectedOutput": "success: true", "actualOutput": "success: true" },
      { "testId": "test-2", "passed": false, "input": "wrong@example.com", "expectedOutput": "success: false", "actualOutput": "success: true", "error": "Output mismatch" }
    ],
    "feedback": {
      "isCorrect": false,
      "score": 75,
      "feedback": "Good effort! You fixed the comparison operator but there's still one issue with the password validation.",
      "suggestions": [
        "Check the second if condition - you're comparing password with itself",
        "Add debugging with console.log to trace values"
      ],
      "commonMistakes": [
        "Not updating the password comparison operator"
      ],
      "nextSteps": [
        "Debug the failing test case",
        "Print variable values to understand the flow"
      ]
    },
    "qualityAnalysis": {
      "score": 85,
      "issues": [
        "Unused variable",
        "Could use more meaningful variable names"
      ]
    }
  }
}
```

---

### 9. Get My Submissions
**Endpoint:** `GET /api/exercises/submissions/my?exerciseId=xxx&limit=10&offset=0`

**Query Parameters:**
- `exerciseId` (optional): Filter by specific exercise
- `limit` (optional): Number of results (default: 10)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "data": [
    {
      "id": "submission-uuid-123",
      "exerciseId": "exercise-uuid-789",
      "exerciseTitle": "Fix the Login Bug",
      "score": 75,
      "status": "reviewed",
      "submittedAt": "2024-01-29T11:15:00Z",
      "feedback": "Good effort! You're on the right track."
    },
    {
      "id": "submission-uuid-124",
      "exerciseId": "exercise-uuid-790",
      "exerciseTitle": "Array Sum Function",
      "score": 100,
      "status": "reviewed",
      "submittedAt": "2024-01-29T10:45:00Z",
      "feedback": "Perfect! All tests passed."
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 10,
    "offset": 0
  }
}
```

---

### 10. Get Submission Details
**Endpoint:** `GET /api/exercises/submissions/{submissionId}`

**Path Parameters:**
- `submissionId`: The UUID of the submission

**Response:**
```json
{
  "data": {
    "id": "submission-uuid-123",
    "exerciseId": "exercise-uuid-789",
    "userId": "user-uuid-456",
    "exerciseTitle": "Fix the Login Bug",
    "submittedCode": "function login(email, password) { ... }",
    "score": 75,
    "status": "reviewed",
    "testResults": [
      { "testId": "test-1", "passed": true },
      { "testId": "test-2", "passed": false, "error": "Output mismatch" }
    ],
    "feedback": {
      "isCorrect": false,
      "score": 75,
      "feedback": "Good effort! You're on the right track.",
      "suggestions": [
        "Check line 5 - comparison operator issue",
        "Test with different inputs"
      ],
      "commonMistakes": [
        "Using assignment (=) instead of equality (==)"
      ],
      "nextSteps": [
        "Debug the failing test",
        "Add console.log statements"
      ]
    },
    "submittedAt": "2024-01-29T11:15:00Z",
    "reviewedAt": "2024-01-29T11:20:00Z"
  }
}
```

---

### 11. Get AI Hint
**Endpoint:** `POST /api/exercises/{exerciseId}/hint`

**Path Parameters:**
- `exerciseId`: The UUID of the exercise

**Request Body:**
```json
{
  "lastAttemptCode": "function login(email, password) {\n  if (user = email) {\n    return { success: true };\n  }\n}"
}
```

**Response:**
```json
{
  "data": {
    "hint": "Look at line 2: you're using the assignment operator (=) instead of a comparison operator. What operator should you use to compare the email with the user parameter?",
    "relatedConcept": "Comparison operators in JavaScript",
    "difficulty": "beginner"
  }
}
```

---

### 12. Suggest Edge Cases
**Endpoint:** `GET /api/exercises/{exerciseId}/edge-cases`

**Path Parameters:**
- `exerciseId`: The UUID of the exercise

**Request Body (Optional):**
```json
{
  "lastAttemptCode": "function sum(arr) {\n  let total = 0;\n  for(let i=0; i<arr.length; i++) {\n    total += arr[i];\n  }\n  return total;\n}"
}
```

**Response:**
```json
{
  "data": {
    "suggestions": [
      "Test with empty arrays: []",
      "Test with single-element arrays: [5]",
      "Test with negative numbers: [-1, -2, -3]",
      "Test with large numbers: [1000000, 2000000]",
      "Test with decimal numbers: [1.5, 2.5, 3.5]",
      "Test with zero: [0, 0, 0]"
    ],
    "explanation": "These edge cases help ensure your function handles all possible inputs correctly"
  }
}
```

---

## AI Tutor - Questions

### 13. Ask AI Tutor Question
**Endpoint:** `POST /api/ai-tutor/ask-question`

**Description:** Ask any programming question and get an intelligent answer

**Request Body:**
```json
{
  "question": "What is a callback function in JavaScript?",
  "context": "I'm learning about asynchronous JavaScript",
  "questionType": "concept"
}
```

**Alternative Examples:**

**Debugging Question:**
```json
{
  "question": "Why is my function returning undefined?",
  "context": "function getData() {\n  setTimeout(() => {\n    return { id: 1, name: 'John' };\n  }, 1000);\n}",
  "questionType": "debugging"
}
```

**Optimization Question:**
```json
{
  "question": "How can I optimize this nested loop?",
  "context": "for(let i=0; i<1000; i++) {\n  for(let j=0; j<1000; j++) {\n    console.log(i * j);\n  }\n}",
  "questionType": "optimization"
}
```

**Best Practices Question:**
```json
{
  "question": "What's the best way to handle errors in promises?",
  "questionType": "best-practices"
}
```

**General Question:**
```json
{
  "question": "What's the difference between null and undefined?",
  "questionType": "general"
}
```

**Response:**
```json
{
  "data": {
    "answer": "A callback function is a function that you pass to another function, and that function will call it at some point.\n\nHere's a simple example:\n```javascript\nfunction greet(name, callback) {\n  console.log('Hello, ' + name);\n  callback();\n}\n\ngreet('John', function() {\n  console.log('This is the callback!');\n});\n```\n\nCallbacks are commonly used for:\n- Event handling\n- Asynchronous operations (file reading, API calls)\n- Array methods like map, filter, forEach\n\nHowever, for complex async operations, Promises and async/await are often better choices.",
    "difficulty": "beginner",
    "relatedConcepts": [
      "Promises",
      "Async/Await",
      "Arrow Functions",
      "Higher-Order Functions"
    ],
    "codeExample": "function fetchUser(userId, callback) {\n  // Simulating API call\n  setTimeout(() => {\n    callback({ id: userId, name: 'John' });\n  }, 1000);\n}\n\nfetchUser(1, (user) => {\n  console.log('User:', user);\n});"
  }
}
```

---

## AI Tutor - Exercise Generation

### 14. Generate Exercise Dynamically
**Endpoint:** `POST /api/ai-tutor/generate-exercise`

**Description:** Generate unlimited exercises on any topic with test cases and hints

**Request Body - Using camelCase:**
```json
{
  "topic": "async and await",
  "difficulty": "intermediate",
  "category": "code-completion",
  "description": "Learn async/await patterns and promise handling",
  "programmingLanguage": "javascript",
  "courseId": "8b7bc0ee-aac7-4b53-809d-1f893de0e439",
  "lessonId": "lesson-uuid-123"
}
```

**Request Body - Using snake_case (also supported):**
```json
{
  "topic": "async and await",
  "difficulty": "medium",
  "language": "javascript",
  "course_id": "8b7bc0ee-aac7-4b53-809d-1f893de0e439",
  "description": "Learn async/await patterns"
}
```

**Alternative - Bug Fix:**
```json
{
  "topic": "Array manipulation",
  "difficulty": "beginner",
  "category": "bug-fix",
  "description": "Find and fix array bugs",
  "programmingLanguage": "javascript",
  "courseId": "course-uuid-123"
}
```

**Alternative - Refactoring:**
```json
{
  "topic": "ES6 features",
  "difficulty": "intermediate",
  "category": "code-refactoring",
  "description": "Modernize JavaScript code",
  "programmingLanguage": "javascript",
  "lessonId": "lesson-uuid-456"
}
```

**Alternative - Debug:**
```json
{
  "topic": "Recursion",
  "difficulty": "advanced",
  "category": "debug",
  "description": "Debug recursive functions",
  "programmingLanguage": "javascript"
}
```

**Response:**
```json
{
  "data": {
    "exercise": {
      "title": "Build an Async Data Fetcher with Error Handling",
      "description": "Create an async function that fetches data with proper error handling",
      "instructions": "Write an async function that fetches user data from an API and handles errors gracefully. The function should:\n1. Accept a userId parameter\n2. Use await with a fetch call\n3. Handle both network errors and JSON parsing errors\n4. Return the parsed data or a meaningful error message",
      "difficulty": "intermediate",
      "category": "code-completion",
      "programmingLanguage": "javascript",
      "startingCode": "async function fetchUser(userId) {\n  // TODO: Implement\n}\n\n// Test it\nfetchUser(1).then(data => console.log(data)).catch(err => console.error(err));",
      "expectedOutput": "User data object with id, name, email fields or meaningful error message",
      "testCases": [
        {
          "input": "Valid userId: 1",
          "expectedOutput": "{ id: 1, name: 'John', email: 'john@example.com' }"
        },
        {
          "input": "Invalid userId: 'abc'",
          "expectedOutput": "Error message about invalid ID"
        },
        {
          "input": "Network timeout",
          "expectedOutput": "Error message about network failure"
        }
      ],
      "highlightedSections": [
        { "startLine": 1, "endLine": 1, "hint": "Make sure the function is declared as async" },
        { "startLine": 2, "endLine": 2, "hint": "Use await when calling the API" },
        { "startLine": 3, "endLine": 3, "hint": "Add try-catch for error handling" }
      ]
    },
    "savedExerciseId": "exercise-uuid-new",
    "message": "Exercise generated and saved successfully"
  }
}
```

---

## AI Tutor - Analysis & Learning

### 15. Analyze Student Progress
**Endpoint:** `GET /api/ai-tutor/analyze-progress`

**Query Parameters:**
- `userId` (optional): User ID to analyze (defaults to current user)
- `lessonId` (optional): Filter by lesson
- `courseId` (optional): Filter by course

**Response:**
```json
{
  "data": {
    "totalExercises": 15,
    "completed": 12,
    "inProgress": 2,
    "notStarted": 1,
    "successRate": 80,
    "averageScore": 82,
    "totalAttempts": 24,
    "weakAreas": [
      { "topic": "recursion", "successRate": 60, "attempts": 5 },
      { "topic": "dynamic-programming", "successRate": 65, "attempts": 3 }
    ],
    "strongAreas": [
      { "topic": "arrays", "successRate": 95, "attempts": 4 },
      { "topic": "strings", "successRate": 90, "attempts": 3 }
    ],
    "recommendedTopics": [
      "Advanced recursion techniques",
      "Dynamic programming for beginners",
      "Memoization strategies"
    ],
    "timeSpentHours": 12.5,
    "lastActivityAt": "2024-01-29T11:15:00Z",
    "nextMilestone": "Complete 20 exercises"
  }
}
```

---

### 16. Get Personalized Exercise
**Endpoint:** `POST /api/ai-tutor/personalized-exercise`

**Description:** Generate an exercise tailored to a student's weak areas

**Request Body:**
```json
{
  "userId": "user-uuid-456",
  "lessonId": "lesson-uuid-123",
  "difficulty": "intermediate",
  "weakAreas": ["recursion", "closures"]
}
```

**Response:**
```json
{
  "data": {
    "exercise": {
      "title": "Recursion with Closure - Calculate Factorial",
      "description": "Master recursion and closures together",
      "instructions": "Write a recursive function that calculates factorial, and create a closure wrapper that memoizes results to avoid recalculation.",
      "difficulty": "intermediate",
      "category": "code-completion",
      "startingCode": "function createFactorial() {\n  const cache = {};\n  \n  return function factorial(n) {\n    if (cache[n]) return cache[n];\n    // TODO: implement\n  };\n}\n\nconst factorial = createFactorial();\nconsole.log(factorial(5));",
      "expectedOutput": "120 and cached values to improve performance",
      "testCases": [
        { "input": "factorial(5)", "expectedOutput": "120" },
        { "input": "factorial(10)", "expectedOutput": "3628800" },
        { "input": "factorial(0)", "expectedOutput": "1" }
      ],
      "highlightedSections": [
        { "startLine": 2, "endLine": 2, "hint": "This is a closure - it remembers the cache" },
        { "startLine": 6, "endLine": 6, "hint": "Implement the recursive case" }
      ]
    },
    "personalizationReason": "Based on your weak areas (recursion and closures), this exercise combines both concepts",
    "estimatedDifficulty": "intermediate",
    "suggestedTimeMinutes": 25
  }
}
```

---

## AI Tutor - Code Tools

### 17. Compare Code Solutions
**Endpoint:** `POST /api/ai-tutor/compare-solutions`

**Description:** Compare student code with reference solution

**Request Body:**
```json
{
  "studentCode": "function sum(arr) {\n  let total = 0;\n  for(let i = 0; i < arr.length; i++) {\n    total = total + arr[i];\n  }\n  return total;\n}",
  "referenceCode": "function sum(arr) {\n  return arr.reduce((acc, val) => acc + val, 0);\n}",
  "exerciseTitle": "Calculate Array Sum",
  "expectedOutput": "Return the sum of all array elements"
}
```

**Response:**
```json
{
  "data": {
    "comparison": {
      "studentApproach": "Iterative approach using a for loop",
      "referenceApproach": "Functional approach using reduce",
      "codeSmells": [
        {
          "issue": "Verbose loop syntax",
          "suggestion": "Consider using array methods like reduce or forEach"
        },
        {
          "issue": "Redundant variable initialization",
          "suggestion": "Could use array method directly"
        }
      ]
    },
    "improvements": [
      "Use ES6 arrow functions for more concise syntax",
      "Consider functional programming approaches for array operations",
      "Learn about the reduce method for array aggregation"
    ],
    "whatWentWell": [
      "Correct logic and algorithm",
      "Proper handling of edge cases",
      "Clear variable naming"
    ],
    "performanceComparison": {
      "studentCodeTime": "O(n)",
      "referenceCodeTime": "O(n)",
      "studentCodeSpace": "O(1)",
      "referenceCodeSpace": "O(1)",
      "conclusion": "Both solutions have equivalent performance"
    },
    "relatedConcepts": [
      "Array methods (map, filter, reduce)",
      "Functional programming",
      "Higher-order functions"
    ]
  }
}
```

---

### 18. Debug Assistance
**Endpoint:** `POST /api/ai-tutor/debug-help`

**Description:** Get help debugging errors

**Request Body:**
```json
{
  "errorMessage": "TypeError: Cannot read property 'length' of undefined",
  "code": "function getLength(str) {\n  return str.length;\n}\n\ngetLength(null);",
  "programmingLanguage": "javascript",
  "stackTrace": "at getLength (file.js:2:20)\nat Object.<anonymous> (file.js:5:8)"
}
```

**Alternative - Python:**
```json
{
  "errorMessage": "IndexError: list index out of range",
  "code": "numbers = [1, 2, 3]\nprint(numbers[5])",
  "programmingLanguage": "python"
}
```

**Response:**
```json
{
  "data": {
    "errorExplanation": "You're trying to access the 'length' property on a null or undefined value. The function expects a string, but received null.",
    "whyItHappens": "In your code, you passed 'null' to getLength(). Null doesn't have properties like strings do.",
    "debuggingSteps": [
      "Check the input: Is it actually a string?",
      "Add a type check before accessing properties",
      "Use console.log to print the parameter value",
      "Consider what should happen if the input is null"
    ],
    "solutions": [
      {
        "approach": "Add input validation",
        "code": "function getLength(str) {\n  if (typeof str !== 'string') return 0;\n  return str.length;\n}"
      },
      {
        "approach": "Use optional chaining",
        "code": "function getLength(str) {\n  return str?.length ?? 0;\n}"
      },
      {
        "approach": "Use try-catch",
        "code": "function getLength(str) {\n  try {\n    return str.length;\n  } catch (e) {\n    console.log('Invalid input:', e);\n    return 0;\n  }\n}"
      }
    ],
    "commonMistakes": [
      "Not checking for null/undefined before accessing properties",
      "Assuming input will always be the expected type",
      "Not reading the error message carefully"
    ],
    "preventionTips": [
      "Always validate input types",
      "Use TypeScript for better type safety",
      "Write unit tests to catch these errors early"
    ]
  }
}
```

---

### 19. Explain Code
**Endpoint:** `POST /api/ai-tutor/explain-code`

**Description:** Get detailed explanation of code

**Request Body - Beginner Level:**
```json
{
  "code": "const nums = [1, 2, 3, 4, 5];\nconst doubled = nums.map(n => n * 2);\nconsole.log(doubled);",
  "programmingLanguage": "javascript",
  "detailLevel": "beginner"
}
```

**Request Body - Intermediate Level:**
```json
{
  "code": "const fetchData = async () => {\n  try {\n    const response = await fetch('/api/data');\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error('Error:', error);\n  }\n}",
  "programmingLanguage": "javascript",
  "detailLevel": "intermediate"
}
```

**Request Body - Advanced Level:**
```json
{
  "code": "const compose = (...fns) => x => fns.reduceRight((v, f) => f(v), x);\nconst add = x => x + 1;\nconst mul = x => x * 2;\nconst result = compose(add, mul)(5);",
  "programmingLanguage": "javascript",
  "detailLevel": "advanced"
}
```

**Response:**
```json
{
  "data": {
    "summary": "This code creates an array of numbers, transforms each number by doubling it, and prints the result.",
    "lineByLineExplanation": [
      {
        "line": 1,
        "code": "const nums = [1, 2, 3, 4, 5];",
        "explanation": "Creates a constant array named 'nums' containing five numbers from 1 to 5"
      },
      {
        "line": 2,
        "code": "const doubled = nums.map(n => n * 2);",
        "explanation": "Uses the map() method to create a new array. For each number 'n' in nums, it multiplies by 2. Arrow function (n => n * 2) is shorthand for function(n) { return n * 2; }"
      },
      {
        "line": 3,
        "code": "console.log(doubled);",
        "explanation": "Prints the new array to the console. Result: [2, 4, 6, 8, 10]"
      }
    ],
    "conceptsUsed": [
      "Arrays",
      "Array methods (map)",
      "Arrow functions",
      "Immutability"
    ],
    "keyTakeaways": [
      "map() creates a new array without modifying the original",
      "Arrow functions are a modern, concise way to write functions",
      "Functional programming patterns are common in JavaScript"
    ],
    "relatedTopics": [
      "Array methods: filter, reduce, forEach",
      "Functional programming",
      "Immutable data"
    ]
  }
}
```

---

### 20. Generate Interactive Quiz
**Endpoint:** `POST /api/ai-tutor/generate-quiz`

**Description:** Generate quizzes to test understanding

**Request Body - Topic-based:**
```json
{
  "topicOrCode": "Array methods in JavaScript: map, filter, reduce",
  "difficulty": "intermediate",
  "numberOfQuestions": 5
}
```

**Request Body - Code-based:**
```json
{
  "topicOrCode": "async function fetchData() {\n  const response = await fetch('/api/data');\n  const data = await response.json();\n  return data;\n}",
  "difficulty": "intermediate",
  "exerciseId": "exercise-uuid-789",
  "numberOfQuestions": 3
}
```

**Response:**
```json
{
  "data": {
    "quiz": {
      "title": "Array Methods Mastery",
      "totalQuestions": 5,
      "questions": [
        {
          "id": "q-1",
          "question": "What does the map() method do?",
          "options": [
            { "id": "opt-1", "text": "Creates a new array by transforming each element", "isCorrect": true },
            { "id": "opt-2", "text": "Filters out elements that don't meet criteria", "isCorrect": false },
            { "id": "opt-3", "text": "Combines all elements into a single value", "isCorrect": false },
            { "id": "opt-4", "text": "Sorts the array in ascending order", "isCorrect": false }
          ],
          "explanation": "map() applies a transformation function to each element and returns a new array with the results."
        },
        {
          "id": "q-2",
          "question": "What will this code output?\nconst result = [1,2,3].filter(x => x > 1);\nconsole.log(result);",
          "options": [
            { "id": "opt-1", "text": "[1, 2, 3]", "isCorrect": false },
            { "id": "opt-2", "text": "[2, 3]", "isCorrect": true },
            { "id": "opt-3", "text": "[1]", "isCorrect": false },
            { "id": "opt-4", "text": "Error", "isCorrect": false }
          ],
          "explanation": "filter() keeps only elements where the condition (x > 1) is true, so only 2 and 3 remain."
        },
        {
          "id": "q-3",
          "question": "Which method is best for summing array values?",
          "options": [
            { "id": "opt-1", "text": "map()", "isCorrect": false },
            { "id": "opt-2", "text": "filter()", "isCorrect": false },
            { "id": "opt-3", "text": "reduce()", "isCorrect": true },
            { "id": "opt-4", "text": "forEach()", "isCorrect": false }
          ],
          "explanation": "reduce() accumulates values into a single result, making it perfect for summing array elements."
        }
      ]
    },
    "estimatedTime": "10 minutes",
    "difficulty": "intermediate",
    "passingScore": 70
  }
}
```

---

## Authentication Note

**All endpoints require JWT Authentication:**

Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

Get a token by logging in:
```
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Not authenticated |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error - Server error |

---

## Error Response Format

```json
{
  "error": "Exercise not found",
  "status": 404,
  "timestamp": "2024-01-29T11:30:00Z"
}
```

---

## Testing Checklist

- [ ] Can create exercise templates
- [ ] Can create exercises with all categories
- [ ] Can submit code and receive feedback
- [ ] Can ask AI tutor questions
- [ ] Can generate exercises on demand
- [ ] Can analyze progress
- [ ] Can get personalized exercises
- [ ] Can compare code solutions
- [ ] Can get debugging help
- [ ] Can generate quizzes
