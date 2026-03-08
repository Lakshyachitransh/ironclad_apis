
# First get a fresh token
Write-Host "Getting fresh authentication token..." -ForegroundColor Cyan

try {
    $loginResponse = Invoke-WebRequest `
        -Uri "http://localhost:3000/api/auth/tenant-login" `
        -Method Post `
        -ContentType "application/json" `
        -Body '{"email":"learner1@example.com","password":"password"}' `
        -UseBasicParsing
    
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $token = $loginData.access_token
    
    if (-not $token) {
        Write-Host "❌ No token returned from login" -ForegroundColor Red
        Write-Host $loginResponse.Content
        exit 1
    }
    
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0, 50))..." -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    exit 1
}

# Now test the lesson endpoint with fresh token
Write-Host "`nTesting lesson endpoint with fresh token..." -ForegroundColor Cyan
$uri = 'http://localhost:3000/api/courses/lessons/8b428177-3c0c-426e-a23c-d4042629c7ed'

try {
    $response = Invoke-WebRequest -Uri $uri -Headers @{ 'Authorization' = "Bearer $token" } -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "`n✅ Response received (Status: $($response.StatusCode))" -ForegroundColor Green
    Write-Host "`nLesson: $($data.title)"
    
    Write-Host "`n📹 VIDEO URL:" -ForegroundColor Cyan
    if ($data.videoUrl) {
        Write-Host "✅ $($data.videoUrl.Substring(0, 80))..."
    } else {
        Write-Host "❌ Missing"
    }
    
    Write-Host "`n🔗 PRESIGNED VIDEO URL:" -ForegroundColor Cyan
    if ($data.presignedVideoUrl -and $data.presignedVideoUrl -ne "null") {
        Write-Host "✅ POPULATED!" -ForegroundColor Green
        Write-Host "URL: $($data.presignedVideoUrl.Substring(0, 100))..."
        Write-Host "`n🎉 SUCCESS - Presigned URL is now working!" -ForegroundColor Green
    } else {
        Write-Host "❌ Still null" -ForegroundColor Red
        Write-Host "Value: $($data.presignedVideoUrl)"
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
