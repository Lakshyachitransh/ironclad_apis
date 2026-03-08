$loginResp = Invoke-WebRequest `
    -Uri "http://localhost:3000/api/auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body '{"email":"learner1@lakme.com","password":"password"}' `
    -UseBasicParsing

$loginData = $loginResp.Content | ConvertFrom-Json
$token = $loginData.access_token

Write-Host "✅ Login: Success" -ForegroundColor Green

$lessonResp = Invoke-WebRequest `
    -Uri "http://localhost:3000/api/courses/lessons/8b428177-3c0c-426e-a23c-d4042629c7ed" `
    -Headers @{"Authorization" = "Bearer $token"} `
    -UseBasicParsing

$lesson = $lessonResp.Content | ConvertFrom-Json

Write-Host "✅ Lesson Endpoint: 200 OK" -ForegroundColor Green
Write-Host ""
Write-Host "Lesson Title: $($lesson.title)"
Write-Host "Video URL exists: $($null -ne $lesson.videoUrl)"
Write-Host ""

if ($lesson.presignedVideoUrl) {
    Write-Host "✅ PRESIGNED URL: $($lesson.presignedVideoUrl)" -ForegroundColor Green
} else {
    Write-Host "❌ PRESIGNED URL: $($lesson.presignedVideoUrl)" -ForegroundColor Red
}
