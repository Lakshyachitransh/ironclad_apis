# Hands-On Exercises System Documentation

## Overview

The Hands-On Exercises system is a comprehensive platform for creating, managing, and grading programming exercises with AI-powered tutoring capabilities. It enables teachers to create consistent, high-quality exercises without writing repetitive code, and provides students with intelligent feedback and guidance.

## Features

### 1. **Exercise Templates**
Teachers can create reusable templates for different exercise types:
- **Bug Fix**: Students fix bugs in provided code
- **Code Completion**: Students complete code with missing sections
- **Code Refactoring**: Students improve existing code
- **Debug/Trace**: Students trace code execution and answer questions
- **Multiple Choice**: Students select the correct code or concept

### 2. **Template Generation System**
The `ExerciseTemplateGeneratorService` provides methods to generate consistent templates:

```typescript
// Bug Fix Template
generateBugFixTemplate({
  title: "Fix Login Bug",
  buggyCode: "...code with bugs...",
  hints: ["Check variable initialization", "Review loop condition"]
});

// Code Completion Template
generateCodeCompletionTemplate({
  title: "Complete Array Filter",
  incompleteCode: "...code with blanks...",
  blanks: [{ position: 0, hint: "Check if item > 5" }]
});

// Refactoring Template
generateRefactoringTemplate({
  title: "Refactor Function",
  workingCode: "...current code...",
  improvementAreas: ["Extract magic numbers", "Add comments"]
});
```

### 3. **Code Submission & Validation**
- **Syntax Validation**: Automatically check JavaScript, TypeScript, Python syntax
- **Test Case Execution**: Run multiple test cases against submissions
- **Code Quality Analysis**: Identify console logs, unused variables, potential infinite loops
- **Edge Case Suggestions**: AI recommends edge cases to test

### 4. **AI Tutor Service**
Provides intelligent feedback using OpenAI:

#### Code Evaluation
```typescript
evaluateCodeSubmission({
  studentCode: "...submitted code...",
  expectedCode: "...reference code...",
  testResults: [...],
  instructions: "...",
  difficulty: "intermediate",
  category: "bug-fix"
});
```

**Response includes:**
- `isCorrect`: Whether the submission is fully correct
- `score`: 0-100 score
- `feedback`: Constructive feedback message
- `suggestions`: List of improvement suggestions
- `commonMistakes`: Identified common mistakes
- `nextSteps`: Steps to improve

#### AI Hint Generation
```typescript
generateHint({
  exerciseTitle: "Fix the Login Bug",
  studentCode: "...current code...",
  highlightedHints: [...],
  category: "bug-fix"
});
```

#### Concept Explanation
```typescript
explainConcept({
  concept: "closure",
  difficulty: "intermediate",
  codeExample: "...code..."
});
```

## API Routes

### Exercise Templates

#### Create Template
```
POST /api/exercises/templates
Requires: admin.manage permission
Body: CreateExerciseTemplateDto
```

#### Get Templates
```
GET /api/exercises/templates?category=bug-fix
Returns: List of templates for the tenant
```

### Exercises

#### Create Exercise
```
POST /api/exercises
Requires: admin.manage permission
Body: CreateExerciseDto
```

**Request Body Example:**
```json
{
  "lessonId": "lesson-123",
  "title": "Fix the Login Bug",
  "description": "Find and fix the authentication bug",
  "instructions": "Review the code and identify the bug...",
  "difficulty": "intermediate",
  "category": "bug-fix",
  "startingCode": "function login(user, pass) { ... }",
  "expectedOutput": "User logged in successfully",
  "testCases": "[{\"input\": \"admin:password\", \"expectedOutput\": \"success\"}]",
  "highlightedSections": "[{\"start\": 0, \"end\": 50, \"hint\": \"Check this section\"}]"
}
```

#### Get Exercises for Lesson
```
GET /api/exercises/lesson/:lessonId
Returns: List of published exercises
```

#### Get Exercise Details
```
GET /api/exercises/:exerciseId
Returns: Full exercise with code template and test cases
```

#### Update Exercise
```
PUT /api/exercises/:exerciseId
Requires: admin.manage permission
Body: UpdateExerciseDto
```

### Code Submissions

#### Submit Exercise
```
POST /api/exercises/:exerciseId/submit
Body: SubmitExerciseDto

Response includes:
- submission: { id, score, status }
- testResults: [{ testId, passed, error }]
- feedback: { isCorrect, score, feedback, suggestions, commonMistakes, nextSteps }
- qualityAnalysis: { score, issues }
```

#### Get User Submissions
```
GET /api/exercises/submissions/my?limit=10&offset=0
Returns: User's submission history
```

#### Get Submission Details
```
GET /api/exercises/submissions/:submissionId
Returns: Full submission with feedback and test results
```

### AI Tutor Features

#### Get Hint
```
POST /api/exercises/:exerciseId/hint
Body: { "lastAttemptCode": "...code..." }
Returns: { hint: "..." }
```

#### Get Edge Case Suggestions
```
GET /api/exercises/:exerciseId/edge-cases
Returns: { suggestions: ["Test with empty arrays", "..."] }
```

### Template-Based Generation

#### Generate Exercise from Template
```
POST /api/exercises/generate-from-template
Requires: admin.manage permission
Body: GenerateExerciseFromTemplateDto

This allows teachers to quickly create exercises without writing full descriptions.
```

## Data Models

### ExerciseTemplate
```typescript
{
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  structure: string; // JSON with template structure
  category: 'bug-fix' | 'code-completion' | 'code-refactoring' | 'debug';
  status: 'active' | 'archived';
  createdBy: string; // user ID of teacher
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

### Exercise
```typescript
{
  id: string;
  lessonId: string;
  tenantId: string;
  templateId?: string;
  title: string;
  description?: string;
  instructions: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  startingCode: string;
  expectedOutput?: string;
  testCases: string; // JSON array
  highlightedSections: string; // JSON array with hints
  multipleChoiceOptions?: string; // JSON array for MCQ
  status: 'draft' | 'published' | 'archived';
  createdBy: string;
  attempts: ExerciseAttempt[];
  submissions: ExerciseSubmission[];
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

### ExerciseSubmission
```typescript
{
  id: string;
  exerciseId: string;
  lessonId: string;
  tenantId: string;
  userId: string; // learner
  submittedCode: string;
  selectedOption?: string; // for MCQ
  output?: string;
  testResults: string; // JSON array
  score?: number; // 0-100
  feedback?: string; // AI feedback as JSON
  status: 'pending' | 'reviewed' | 'graded';
  submittedAt: DateTime;
  reviewedAt?: DateTime;
}
```

### ExerciseAttempt
```typescript
{
  id: string;
  exerciseId: string;
  tenantId: string;
  userId: string;
  attemptCount: number;
  startedAt: DateTime;
  completedAt?: DateTime;
  passed: boolean;
  submissions: ExerciseSubmission[];
}
```

## Permissions

| Feature | Required Permission | Role |
|---------|-------------------|------|
| Create Template | admin.manage | Platform Admin, Teacher |
| Create Exercise | admin.manage | Platform Admin, Teacher |
| Update Exercise | admin.manage | Platform Admin, Teacher |
| Submit Exercise | None | Learner |
| Get Hints | None | Learner |
| View Submissions | Own submissions | Learner |

## Workflow Examples

### Teacher Creates Exercise from Template

```typescript
// 1. Create template (once)
POST /api/exercises/templates
{
  "name": "Bug Fix Exercise",
  "category": "bug-fix",
  "structure": "{...template structure...}"
}
// Returns: template-123

// 2. Generate exercise using template (multiple times)
POST /api/exercises/generate-from-template
{
  "templateId": "template-123",
  "lessonId": "lesson-456",
  "title": "Fix the Login Bug",
  "startingCode": "...",
  "expectedOutput": "...",
  "testCases": "[...]",
  "difficulty": "intermediate"
}
// Returns: exercise-789
```

### Student Submits Exercise

```typescript
// 1. Get exercise details
GET /api/exercises/exercise-789
// Returns: Full exercise with code template

// 2. Request hint if needed
POST /api/exercises/exercise-789/hint
// Returns: AI-generated hint

// 3. Submit code
POST /api/exercises/exercise-789/submit
{
  "submittedCode": "...student's code...",
  "output": "..."
}
// Returns: {
//   submission: { id, score, status },
//   testResults: [...],
//   feedback: { isCorrect, score, feedback, ... },
//   qualityAnalysis: { score, issues }
// }

// 4. View submission details
GET /api/exercises/submissions/sub-123
// Returns: Full feedback with AI analysis
```

### Get Edge Case Suggestions

```typescript
GET /api/exercises/exercise-789/edge-cases
// Returns:
// {
//   suggestions: [
//     "Test with empty arrays",
//     "Test with negative numbers",
//     "Test boundary conditions"
//   ]
// }
```

## AI Integration

The system uses OpenAI's GPT-4 API for:
1. **Code Evaluation**: Analyze correctness, provide feedback
2. **Hint Generation**: Create contextual hints based on current code
3. **Mistake Identification**: Identify common programming mistakes
4. **Concept Explanation**: Explain programming concepts

### Environment Setup
```env
OPENAI_API_KEY=sk-proj-...
```

### Fallback Behavior
If OpenAI API fails, the system falls back to:
- Basic syntax validation
- Test case pass/fail status
- Generic feedback based on test results

## Code Quality Analysis

The system analyzes submitted code for:
- **Documentation**: Presence of comments
- **Debug Code**: console.log statements
- **Unused Variables**: Variables declared but not used
- **Infinite Loops**: Potential infinite loop detection
- **Edge Cases**: Suggestions for test cases

## Best Practices

### For Teachers

1. **Use Templates**: Create templates for common exercise types to ensure consistency
2. **Clear Instructions**: Provide detailed exercise instructions
3. **Multiple Test Cases**: Include edge cases in test suites
4. **Difficulty Levels**: Properly categorize exercises by difficulty
5. **Code Quality**: Provide good starting code as examples

### For Students

1. **Review Feedback**: Read AI feedback carefully
2. **Request Hints**: Use hints when stuck, not as a shortcut
3. **Edge Cases**: Follow edge case suggestions when testing
4. **Code Quality**: Clean up debug code before submission
5. **Multiple Attempts**: Learn from feedback and resubmit

## Limitations & Future Enhancements

### Current Limitations
- Code execution requires Piston API integration (placeholder implemented)
- Limited to syntax validation without actual execution environment
- Python code execution not fully supported

### Future Enhancements
- [ ] Integration with Piston API for actual code execution
- [ ] Support for multiple programming languages
- [ ] Collaborative exercises
- [ ] Code plagiarism detection
- [ ] Performance analytics and leaderboards
- [ ] Adaptive difficulty based on student progress
- [ ] Integration with GitHub Copilot suggestions
- [ ] Video walkthroughs for exercises

## Troubleshooting

### Syntax Validation Failed
- Ensure code is valid JavaScript/TypeScript/Python
- Check for missing semicolons or brackets

### Tests Not Running
- Verify test cases JSON format
- Ensure test cases are valid

### AI Feedback Timeout
- Check OpenAI API key configuration
- Review API rate limits
- System will fall back to generic feedback

### Permission Denied
- Verify user has admin.manage permission
- Check tenant association

## API Documentation

Visit `/api/docs` to view complete Swagger API documentation.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review exercise setup
3. Verify permissions and tenant configuration
4. Check logs for detailed error messages
