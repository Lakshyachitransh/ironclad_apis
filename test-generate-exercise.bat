@echo off
REM Test Exercise Generation with AI Tutor
REM This script tests the exercise generation endpoint with your specific parameters

echo.
echo ========================================
echo  AI Tutor Exercise Generation Test
echo ========================================
echo.

REM Test data as you provided
set COURSE_ID=8b7bc0ee-aac7-4b53-809d-1f893de0e439
set DIFFICULTY=medium
set LANGUAGE=javascript
set TOPIC=async and await

echo [1] Logging in...
for /f "tokens=*" %%A in ('powershell -Command "
$response = Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/login' -Method Post -Headers @{'Content-Type'='application/json'} -Body '{\"email\":\"admin@ironclad.local\",\"password\":\"Test123!@#\"}' -ErrorAction SilentlyContinue; 
$response.data.accessToken
"') do set TOKEN=%%A

if "%TOKEN%"=="" (
    echo [ERROR] Login failed. Make sure the server is running.
    pause
    exit /b 1
)

echo [OK] Token received: %TOKEN:~0,30%...
echo.

echo [2] Generating exercise...
echo Request:
echo   Topic: %TOPIC%
echo   Difficulty: %DIFFICULTY%
echo   Language: %LANGUAGE%
echo   Course ID: %COURSE_ID%
echo.

powershell -Command "
$headers = @{
    'Authorization' = 'Bearer %TOKEN%'
    'Content-Type' = 'application/json'
}

$body = @{
    topic = '%TOPIC%'
    difficulty = '%DIFFICULTY%'
    language = '%LANGUAGE%'
    course_id = '%COURSE_ID%'
} | ConvertTo-Json

Write-Host 'Sending request to API...' -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri 'http://localhost:3000/api/ai-tutor/generate-exercise' -Method Post -Headers `$headers -Body `$body -ErrorAction Stop
    
    Write-Host '[OK] Exercise generated successfully!' -ForegroundColor Green
    Write-Host ''
    
    if (`$response.exercise) {
        `$ex = `$response.exercise
        Write-Host '== GENERATED EXERCISE ==' -ForegroundColor Cyan
        Write-Host 'Title:' `$ex.title
        Write-Host 'Difficulty:' `$ex.difficulty
        Write-Host 'Category:' `$ex.category
        Write-Host 'Language:' `$ex.programmingLanguage
        Write-Host ''
        Write-Host 'Instructions:' -ForegroundColor Yellow
        Write-Host `$ex.instructions
        Write-Host ''
        Write-Host 'Starting Code:' -ForegroundColor Yellow
        Write-Host `$ex.startingCode
        Write-Host ''
        
        if (`$ex.testCases) {
            Write-Host 'Test Cases:' -ForegroundColor Yellow
            Write-Host (`$ex.testCases | ConvertTo-Json -Depth 5)
        }
    }
} catch {
    Write-Host '[ERROR] Failed to generate exercise' -ForegroundColor Red
    Write-Host `$_.Exception.Message
}
"

echo.
pause
