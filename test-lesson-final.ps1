
# First get a fresh token using correct endpoint
Write-Host "Logging in..." -ForegroundColor Cyan

try {
    $loginResponse = Invoke-WebRequest `
        -Uri "http://localhost:3000/api/auth/login" `
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
    
} catch {
    Write-Host "❌ Login failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Response: $errorBody"
    }
    exit 1
}

# Now test the lesson endpoint
Write-Host "`nCalling lesson endpoint..." -ForegroundColor Cyan
$uri = 'http://localhost:3000/api/courses/lessons/8b428177-3c0c-426e-a23c-d4042629c7ed'

try {
    $response = Invoke-WebRequest -Uri $uri -Headers @{ 'Authorization' = "Bearer $token" } -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "✅ Response received successfully" -ForegroundColor Green
    Write-Host ""
    Write-Host "Lesson: $($data.title)"
    Write-Host "Video URL: $($data.videoUrl.Substring(0, 80))..." -ForegroundColor Cyan
    Write-Host ""
    
    if ($data.presignedVideoUrl -and $data.presignedVideoUrl -ne "null") {
        Write-Host "✅ PRESIGNED URL: POPULATED!" -ForegroundColor Green
        Write-Host "Value: $($data.presignedVideoUrl.Substring(0, 100))..."
    } else {
        Write-Host "❌ PRESIGNED URL: NULL" -ForegroundColor Red
        Write-Host "Value: $($data.presignedVideoUrl)"
    }
    
} catch {
    Write-Host "❌ Error getting lesson: $($_.Exception.Message)" -ForegroundColor Red
}
