# First, login to get a fresh token
Write-Host "Logging in to get a fresh JWT token..." -ForegroundColor Cyan

try {
    $loginResponse = Invoke-WebRequest `
        -Uri "http://localhost:3000/api/auth/tenant-login" `
        -Method Post `
        -Headers @{ "Content-Type" = "application/json" } `
        -Body '{"email":"learner1@example.com","password":"password"}' `
        -UseBasicParsing
    
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $token = $loginData.access_token
    
    Write-Host "✅ Login successful! Token obtained." -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0, 50))..." -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Now test the lesson endpoint
Write-Host "`nTesting lesson endpoint..." -ForegroundColor Cyan
$URI = "http://localhost:3000/api/courses/lessons/8b428177-3c0c-426e-a23c-d4042629c7ed"

try {
    $response = Invoke-WebRequest -Uri $URI -Headers @{ "Authorization" = "Bearer $token" } -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "=========== LESSON ENDPOINT TEST RESULTS ===========" -ForegroundColor Green
    Write-Host "Response Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Lesson ID: $($data.id)"
    Write-Host "Title: $($data.title)"
    Write-Host ""
    Write-Host "Video URL:" -ForegroundColor Cyan
    Write-Host $($data.videoUrl)
    Write-Host ""
    Write-Host "Presigned Video URL:" -ForegroundColor Cyan
    if ($data.presignedVideoUrl -and $data.presignedVideoUrl -ne "null") {
        Write-Host $($data.presignedVideoUrl) -ForegroundColor Green
        Write-Host "✅ PRESIGNED URL IS NOW POPULATED!" -ForegroundColor Green
    } else {
        Write-Host "null" -ForegroundColor Red
        Write-Host "❌ Presigned URL is still null (fallback to original URL working)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error testing endpoint: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host $_.Exception.Response.StatusCode
}
