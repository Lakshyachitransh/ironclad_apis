# Quiz Generation API Quick Reference

## Quick Start

### 1. Generate Quizzes

```bash
# Using PowerShell
$token = "your-jwt-token"
$lessonId = "les-001"
$courseId = "course-001"

$body = @{
    videoContent = "JavaScript is a programming language that allows you to add interactivity to web pages. It runs in the browser and can manipulate the DOM. Key concepts include variables, functions, events, and asynchronous programming like promises and async/await."
    lessonId = $lessonId
    courseId = $courseId
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/courses/lessons/$lessonId/generate-quizzes" `
    -Method POST `
    -Headers $headers `
    -Body $body

$response | ConvertTo-Json | Write-Host
```

### 2. List Lesson Quizzes

```bash
$token = "your-jwt-token"
$lessonId = "les-001"

$headers = @{
    "Authorization" = "Bearer $token"
}

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/courses/lessons/$lessonId/quizzes" `
    -Method GET `
    -Headers $headers

$response | ConvertTo-Json | Write-Host
```

### 3. Get Quiz Details

```bash
$token = "your-jwt-token"
$quizId = "quiz-1"

$headers = @{
    "Authorization" = "Bearer $token"
}

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/courses/quizzes/$quizId" `
    -Method GET `
    -Headers $headers

$response | ConvertTo-Json | Write-Host
```

## cURL Examples

### Generate Quizzes

```bash
curl -X POST http://localhost:3000/api/courses/lessons/les-001/generate-quizzes \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "videoContent": "Your video content or transcript here...",
    "lessonId": "les-001",
    "courseId": "course-001"
  }'
```

### List Quizzes

```bash
curl -X GET http://localhost:3000/api/courses/lessons/les-001/quizzes \
  -H "Authorization: Bearer your-jwt-token"
```

### Get Quiz

```bash
curl -X GET http://localhost:3000/api/courses/quizzes/quiz-1 \
  -H "Authorization: Bearer your-jwt-token"
```

## Response Examples

### Generate Quizzes Response

```json
{
  "quizzes": [
    {
      "id": "question-1",
      "questionText": "What is JavaScript primarily used for?",
      "explanation": "JavaScript is used to add interactivity to web pages and runs in the browser.",
      "order": 1,
      "options": [
        {
          "id": "option-1",
          "optionText": "Styling web pages",
          "order": 0
        },
        {
          "id": "option-2",
          "optionText": "Adding interactivity to web pages",
          "order": 1
        },
        {
          "id": "option-3",
          "optionText": "Creating databases",
          "order": 2
        },
        {
          "id": "option-4",
          "optionText": "Managing servers",
          "order": 3
        }
      ]
    }
  ],
  "generatedAt": "2025-11-27T10:30:00.000Z",
  "lessonId": "les-001",
  "videoContentSummary": "JavaScript is a programming language that allows you to add interactivity to web pages..."
}
```

## Test Data

### Sample Video Content

**Easy Level:**

```
HTML is the foundation of web pages. It provides structure using tags like <div>, <p>, and <h1>.
CSS is used to style HTML elements. JavaScript adds interactivity.
```

**Medium Level:**

```
JavaScript uses prototypal inheritance for object creation. Functions are first-class objects.
Closures allow functions to maintain access to outer scope variables. The event loop handles
asynchronous operations. Callbacks, Promises, and async/await are three ways to handle async code.
```

**Complex Level:**

```
React is a JavaScript library for building user interfaces with components. State management
can be handled with useState hooks or Redux. Virtual DOM optimization improves performance.
Higher-order components and render props provide reusability patterns. TypeScript adds type safety.
The Context API provides state management without external libraries. Server-side rendering
improves SEO for React applications.
```

## Status Codes

| Code | Meaning                        | Typical Cause            |
| ---- | ------------------------------ | ------------------------ |
| 201  | Quiz generated successfully    | Request processed        |
| 200  | Quizzes retrieved successfully | Data found               |
| 400  | Bad request                    | Invalid input data       |
| 401  | Unauthorized                   | Missing or invalid token |
| 403  | Forbidden                      | Insufficient permissions |
| 404  | Not found                      | Resource doesn't exist   |
| 500  | Server error                   | OpenAI API error         |

## Debugging

### Check Logs

```bash
# View server logs in real-time
npm run start:dev

# Look for:
# - "Found 0 errors. Watching for file changes."
# - "Starting Nest application"
# - "Server running on http://localhost:3000"
```

### Test OpenAI Connection

```bash
# Check if API key is set
$env:OPENAI_API_KEY

# Should output your API key (hidden for security)
```

### Check Database

```bash
# View database schema
npx prisma studio

# This opens GUI at http://localhost:5555
# You can see Quiz records and their questions
```

## Common Errors & Solutions

### Error: "Missing OPENAI_API_KEY"

```
Solution: Set environment variable
$env:OPENAI_API_KEY = "sk-your-key-here"
```

### Error: "videoContent is required"

```
Solution: Provide non-empty video content in request body
{
  "videoContent": "Your content here"
}
```

### Error: "Lesson not found"

```
Solution: Verify lessonId exists in database
# Check in Prisma Studio or database
```

### Error: "Unauthorized - insufficient permissions"

```
Solution: User needs training_manager or instructor role
# Check user roles in database
# Refresh JWT token
```

## Performance Tips

1. **Reduce Video Content Size:** Keep to 500-2000 characters for faster processing
2. **Batch Operations:** Generate quizzes for multiple lessons sequentially
3. **Cache Results:** Don't regenerate quizzes for same lesson
4. **Monitor API Usage:** Track OpenAI token usage and costs

## Next Steps

1. ✅ Test quiz generation endpoint
2. ✅ Retrieve and verify generated quizzes
3. 📋 Implement quiz attempt submission endpoint
4. 📊 Add quiz analytics and reporting
5. 🔄 Add quiz regeneration capability
6. 📱 Create frontend quiz player component
