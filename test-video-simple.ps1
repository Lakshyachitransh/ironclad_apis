# Test video upload fix
$apiUrl = "http://localhost:3000/api"

Write-Host "`n=== TESTING VIDEO UPLOAD FIX ===" -ForegroundColor Cyan

# Login
Write-Host "`n[1] Authenticating..." -ForegroundColor Blue
$loginResponse = Invoke-RestMethod -Uri "$apiUrl/auth/login" `
    -Method Post -ContentType "application/json" `
    -Body (@{email="admin@example.com"; password="password123"; tenantId="default"} | ConvertTo-Json) `
    -ErrorAction SilentlyContinue

if (-not $loginResponse.access_token) {
    Write-Host "ERROR: Authentication failed" -ForegroundColor Red
    exit 1
}
Write-Host "SUCCESS: Authenticated" -ForegroundColor Green
$token = $loginResponse.access_token
$headers = @{ Authorization = "Bearer $token" }

# Get courses
Write-Host "`n[2] Getting courses..." -ForegroundColor Blue
$courses = Invoke-RestMethod -Uri "$apiUrl/courses" -Method Get -Headers $headers
if ($courses.Count -eq 0) { Write-Host "ERROR: No courses" -ForegroundColor Red; exit 1 }
$courseId = $courses[0].id
Write-Host "SUCCESS: Found course $courseId" -ForegroundColor Green

# Get modules
Write-Host "`n[3] Getting modules..." -ForegroundColor Blue
$modules = Invoke-RestMethod -Uri "$apiUrl/courses/course/$courseId/modules" -Method Get -Headers $headers
if ($modules.Count -eq 0) { Write-Host "ERROR: No modules" -ForegroundColor Red; exit 1 }
$moduleId = $modules[0].id
Write-Host "SUCCESS: Found module $moduleId" -ForegroundColor Green

# Get lessons
Write-Host "`n[4] Getting lessons..." -ForegroundColor Blue
$moduleDetails = Invoke-RestMethod -Uri "$apiUrl/courses/modules/$moduleId" -Method Get -Headers $headers
if ($moduleDetails.lessons.Count -eq 0) { Write-Host "ERROR: No lessons" -ForegroundColor Red; exit 1 }
$lessonId = $moduleDetails.lessons[0].id
Write-Host "SUCCESS: Found lesson $lessonId" -ForegroundColor Green

# Create test video if needed
Write-Host "`n[5] Checking test video..." -ForegroundColor Blue
if (-not (Test-Path "./test-video.mp4")) {
    $bytes = @(0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x00, 0x00, 0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32, 0x6d, 0x70, 0x34, 0x31, 0x69, 0x73, 0x6f, 0x6d)
    [System.IO.File]::WriteAllBytes("./test-video.mp4", $bytes)
}
Write-Host "SUCCESS: Test video ready" -ForegroundColor Green

# Upload video
Write-Host "`n[6] Uploading video..." -ForegroundColor Blue
$uploadResult = curl -s -X POST `
    -H "Authorization: Bearer $token" `
    -F "video=@./test-video.mp4" `
    -F "videoDuration=60" `
    "$apiUrl/courses/lessons/$lessonId/upload-video" | ConvertFrom-Json

if ($uploadResult.lesson.videoFileName) {
    Write-Host "SUCCESS: Video uploaded - $($uploadResult.lesson.videoFileName)" -ForegroundColor Green
} else {
    Write-Host "ERROR: Video upload failed" -ForegroundColor Red
    Write-Host $uploadResult
    exit 1
}

# Get lesson and check presignedVideoUrl
Write-Host "`n[7] Checking presigned URL..." -ForegroundColor Blue
$lessonData = Invoke-RestMethod -Uri "$apiUrl/courses/lessons/$lessonId" -Method Get -Headers $headers

if ($lessonData.presignedVideoUrl) {
    Write-Host "`n=====================================" -ForegroundColor Green
    Write-Host "SUCCESS! VIDEO FIX IS WORKING!" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "PresignedVideoUrl exists (NOT null)" -ForegroundColor Green
    Write-Host "URL preview: $($lessonData.presignedVideoUrl.Substring(0, 80))..." -ForegroundColor Green
    Write-Host "`nYour video should display with both audio and video now!" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
} else {
    Write-Host "`nERROR: presignedVideoUrl is NULL" -ForegroundColor Red
    Write-Host "Video will not display in player" -ForegroundColor Red
    Write-Host "`nResponse: $($lessonData | ConvertTo-Json)" -ForegroundColor Yellow
    exit 1
}
