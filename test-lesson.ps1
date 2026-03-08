$lessonId = "8b428177-3c0c-426e-a23c-d4042629c7ed"
$baseUrl = "http://localhost:3000/api"
$email = "learner1@lakme.com"
$password = "1103@"

$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

try {
    Write-Host "Logging in..." -ForegroundColor Yellow
    $loginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
    $token = $loginRes.access_token
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    Write-Host "Getting lesson details..." -ForegroundColor Yellow
    $lessonResponse = Invoke-RestMethod -Uri "$baseUrl/courses/lessons/$lessonId" -Method Get -Headers $headers
    
    Write-Host "`n=== LESSON RESPONSE ===" -ForegroundColor Cyan
    $lessonResponse | ConvertTo-Json -Depth 10
    
    Write-Host "`n=== KEY FIELDS ===" -ForegroundColor Cyan
    Write-Host "Lesson Title: $($lessonResponse.title)" -ForegroundColor Gray
    Write-Host "Video URL: $($lessonResponse.videoUrl)" -ForegroundColor Gray
    Write-Host "Video File Name: $($lessonResponse.videoFileName)" -ForegroundColor Gray
    Write-Host "Presigned Video URL: $($lessonResponse.presignedVideoUrl)" -ForegroundColor Gray
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $body = $reader.ReadToEnd()
            Write-Host "Response: $body" -ForegroundColor Red
        } catch {}
    }
}
