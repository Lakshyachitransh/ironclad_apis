#!/usr/bin/env pwsh
# Test video upload and verify presignedVideoUrl is returned

param(
    [string]$VideoPath = "./test-video.mp4"
)

$apiUrl = "http://localhost:3000/api"

# Colors for output
$green = "`e[32m"
$red = "`e[31m"
$yellow = "`e[33m"
$blue = "`e[34m"
$reset = "`e[0m"

function Write-Success { Write-Host "$green✅ $args $reset" }
function Write-Failure { Write-Host "$red❌ $args $reset" }
function Write-Warning { Write-Host "$yellow⚠️ $args $reset" }
function Write-Info { Write-Host "$blue ℹ️ $args $reset" }

Write-Host "`n$blue=== VIDEO UPLOAD TEST ===$reset`n"

try {
    # Create a test video file if it doesn't exist
    if (-not (Test-Path $VideoPath)) {
        Write-Warning "Test video not found at $VideoPath. Creating minimal test video..."
        
        # Create a minimal MP4 file
        $bytes = @(
            0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70,
            0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x00, 0x00,
            0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32,
            0x6d, 0x70, 0x34, 0x31, 0x69, 0x73, 0x6f, 0x6d
        )
        [System.IO.File]::WriteAllBytes($VideoPath, $bytes)
        Write-Success "Created test video at $VideoPath"
    }
    
    $fileSize = (Get-Item $VideoPath).Length
    Write-Info "Video file size: $fileSize bytes"

    # Step 1: Login
    Write-Host "`n$blue[Step 1]$reset Authenticating..."
    $loginResponse = Invoke-RestMethod -Uri "$apiUrl/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body (@{
            email = "admin@example.com"
            password = "password123"
            tenantId = "default"
        } | ConvertTo-Json) -ErrorAction SilentlyContinue

    if ($loginResponse.access_token) {
        Write-Success "Authenticated successfully"
        $token = $loginResponse.access_token
    } else {
        Write-Failure "Authentication failed"
        exit 1
    }

    $headers = @{ Authorization = "Bearer $token" }

    # Step 2: Get courses
    Write-Host "`n$blue[Step 2]$reset Getting courses..."
    $coursesResponse = Invoke-RestMethod -Uri "$apiUrl/courses" `
        -Method Get `
        -Headers $headers

    if ($coursesResponse.Count -eq 0) {
        Write-Failure "No courses found. Please create a course first."
        exit 1
    }

    $courseId = $coursesResponse[0].id
    Write-Success "Found course: $courseId"

    # Step 3: Get modules
    Write-Host "`n$blue[Step 3]$reset Getting modules..."
    $modulesResponse = Invoke-RestMethod -Uri "$apiUrl/courses/course/$courseId/modules" `
        -Method Get `
        -Headers $headers

    if ($modulesResponse.Count -eq 0) {
        Write-Failure "No modules found. Please create a module first."
        exit 1
    }

    $moduleId = $modulesResponse[0].id
    Write-Success "Found module: $moduleId"

    # Step 4: Get lessons
    Write-Host "`n$blue[Step 4]$reset Getting lessons..."
    $moduleDetailsResponse = Invoke-RestMethod -Uri "$apiUrl/courses/modules/$moduleId" `
        -Method Get `
        -Headers $headers

    if ($moduleDetailsResponse.lessons.Count -eq 0) {
        Write-Failure "No lessons found. Please create a lesson first."
        exit 1
    }

    $lessonId = $moduleDetailsResponse.lessons[0].id
    Write-Success "Found lesson: $lessonId"

    # Step 5: Upload video using curl
    Write-Host "`n$blue[Step 5]$reset Uploading video..."
    
    $uploadCurl = & curl -s -X POST `
        -H "Authorization: Bearer $token" `
        -F "video=@$VideoPath" `
        -F "videoDuration=60" `
        "$apiUrl/courses/lessons/$lessonId/upload-video" 2>&1
    
    $uploadResponse = $uploadCurl | ConvertFrom-Json
    
    if ($uploadResponse.lesson.videoFileName) {
        Write-Success "Video uploaded successfully"
        Write-Info "Video filename: $($uploadResponse.lesson.videoFileName)"
    } else {
        Write-Failure "Video upload failed"
        Write-Host $uploadResponse
        exit 1
    }

    # Step 6: Retrieve lesson and check presignedVideoUrl
    Write-Host "`n$blue[Step 6]$reset Retrieving lesson with presigned URL..."
    
    $lessonDetailsResponse = Invoke-RestMethod -Uri "$apiUrl/courses/lessons/$lessonId" `
        -Method Get `
        -Headers $headers

    if ($lessonDetailsResponse.presignedVideoUrl) {
        Write-Success "presignedVideoUrl is NOT null!"
        Write-Info "Presigned URL (first 100 chars): $($lessonDetailsResponse.presignedVideoUrl.Substring(0, [Math]::Min(100, $lessonDetailsResponse.presignedVideoUrl.Length)))..."
        Write-Info "Video URL: $($lessonDetailsResponse.videoUrl)"
        
        Write-Host "`n$green════════════════════════════════════════$reset"
        Write-Host "$green SUCCESS! VIDEO FIX IS WORKING!$reset"
        Write-Host "$green   Presigned URL generated successfully$reset"
        Write-Host "$green   Video should display in player$reset"
        Write-Host "$green════════════════════════════════════════$reset`n"
        
    } else {
        Write-Failure "presignedVideoUrl is NULL!"
        Write-Failure "This means the video won't display in the player"
        Write-Host "`nFull response:"
        Write-Host ($lessonDetailsResponse | ConvertTo-Json)
        exit 1
    }

} catch {
    Write-Failure "Test failed: $_"
    exit 1
}


Write-Host "`n$blue=== VIDEO UPLOAD TEST ===$reset`n"

try {
    # Create a test video file if it doesn't exist
    if (-not (Test-Path $VideoPath)) {
        Write-Warning "Test video not found at $VideoPath. Creating minimal test video..."
        
        # Create a minimal MP4 file
        $bytes = @(
            0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70,
            0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x00, 0x00,
            0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32,
            0x6d, 0x70, 0x34, 0x31, 0x69, 0x73, 0x6f, 0x6d
        )
        [System.IO.File]::WriteAllBytes($VideoPath, $bytes)
        Write-Success "Created test video at $VideoPath"
    }
    
    $fileSize = (Get-Item $VideoPath).Length
    Write-Info "Video file size: $fileSize bytes"

    # Step 1: Login
    Write-Host "`n$blue[Step 1]$reset Authenticating..."
    $loginResponse = Invoke-RestMethod -Uri "$apiUrl/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body @{
            email = "admin@example.com"
            password = "password123"
            tenantId = "default"
        } -ErrorAction SilentlyContinue

    if ($loginResponse.access_token) {
        Write-Success "Authenticated successfully"
        $token = $loginResponse.access_token
    } else {
        Write-Failure "Authentication failed"
        exit 1
    }

    $headers = @{ Authorization = "Bearer $token" }

    # Step 2: Get courses
    Write-Host "`n$blue[Step 2]$reset Getting courses..."
    $coursesResponse = Invoke-RestMethod -Uri "$apiUrl/courses" `
        -Method Get `
        -Headers $headers

    if ($coursesResponse.Count -eq 0) {
        Write-Failure "No courses found. Please create a course first."
        exit 1
    }

    $courseId = $coursesResponse[0].id
    Write-Success "Found course: $courseId"

    # Step 3: Get modules
    Write-Host "`n$blue[Step 3]$reset Getting modules..."
    $modulesResponse = Invoke-RestMethod -Uri "$apiUrl/courses/course/$courseId/modules" `
        -Method Get `
        -Headers $headers

    if ($modulesResponse.Count -eq 0) {
        Write-Failure "No modules found. Please create a module first."
        exit 1
    }

    $moduleId = $modulesResponse[0].id
    Write-Success "Found module: $moduleId"

    # Step 4: Get lessons
    Write-Host "`n$blue[Step 4]$reset Getting lessons..."
    $moduleDetailsResponse = Invoke-RestMethod -Uri "$apiUrl/courses/modules/$moduleId" `
        -Method Get `
        -Headers $headers

    if ($moduleDetailsResponse.lessons.Count -eq 0) {
        Write-Failure "No lessons found. Please create a lesson first."
        exit 1
    }

    $lessonId = $moduleDetailsResponse.lessons[0].id
    Write-Success "Found lesson: $lessonId"

    # Step 5: Upload video
    Write-Host "`n$blue[Step 5]$reset Uploading video..."
    
    $fileContent = [System.IO.File]::ReadAllBytes($VideoPath)
    
    # Create multipart form data
    $boundary = [System.Guid]::NewGuid().ToString()
    $body = @()
    
    # Add video file
    $body += "--$boundary`r`n"
    $body += "Content-Disposition: form-data; name=`"video`"; filename=`"test-video.mp4`"`r`n"
    $body += "Content-Type: video/mp4`r`n`r`n"
    $body += [System.Text.Encoding]::GetEncoding('ISO-8859-1').GetString($fileContent)
    $body += "`r`n"
    
    # Add duration
    $body += "--$boundary`r`n"
    $body += "Content-Disposition: form-data; name=`"videoDuration`"`r`n`r`n"
    $body += "60`r`n"
    $body += "--$boundary--`r`n"
    
    $bodyBytes = [System.Text.Encoding]::GetEncoding('ISO-8859-1').GetBytes($bodyText -join '')
    
    # Use curl for multipart upload
    $uploadResponse = & curl -s -X POST `
        -H "Authorization: Bearer $token" `
        -F "video=@$VideoPath" `
        -F "videoDuration=60" `
        "$apiUrl/courses/lessons/$lessonId/upload-video" | ConvertFrom-Json

    if ($uploadResponse.lesson.videoFileName) {
        Write-Success "Video uploaded successfully"
        Write-Info "Video filename: $($uploadResponse.lesson.videoFileName)"
    } else {
        Write-Failure "Video upload failed"
        Write-Host $uploadResponse
        exit 1
    }

    # Step 6: Retrieve lesson and check presignedVideoUrl
    Write-Host "`n$blue[Step 6]$reset Retrieving lesson with presigned URL..."
    
    $lessonDetailsResponse = Invoke-RestMethod -Uri "$apiUrl/courses/lessons/$lessonId" `
        -Method Get `
        -Headers $headers

    if ($lessonDetailsResponse.presignedVideoUrl) {
        Write-Success "✅ presignedVideoUrl is NOT null!"
        Write-Info "Presigned URL (first 100 chars): $($lessonDetailsResponse.presignedVideoUrl.Substring(0, [Math]::Min(100, $lessonDetailsResponse.presignedVideoUrl.Length)))..."
        Write-Info "Video URL: $($lessonDetailsResponse.videoUrl)"
        
        # Step 7: Check if the presigned URL is accessible
        Write-Host "`n$blue[Step 7]$reset Testing presigned URL accessibility..."
        
        $headResponse = & curl -s -I "$($lessonDetailsResponse.presignedVideoUrl)" 2>&1
        
        if ($headResponse -match "200|206") {
            Write-Success "Presigned URL is accessible (HTTP 200/206)"
        } else {
            Write-Warning "Unexpected response from presigned URL"
            Write-Info "Response: $(($headResponse | Select-Object -First 3) -join ', ')"
        }
        
        Write-Host "`n$green════════════════════════════════════════$reset"
        Write-Host "$green✅ VIDEO UPLOAD FIX IS WORKING!$reset"
        Write-Host "$green   → Presigned URL generated successfully$reset"
        Write-Host "$green   → Video should display in player$reset"
        Write-Host "$green════════════════════════════════════════$reset`n"
        
    } else {
        Write-Failure "presignedVideoUrl is NULL!"
        Write-Failure "This means the video will not display in the player"
        Write-Host "`nFull response:"
        Write-Host ($lessonDetailsResponse | ConvertTo-Json)
        exit 1
    }

} catch {
    Write-Failure "Test failed: $_"
    exit 1
}
