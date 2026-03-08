$uri = 'http://localhost:3000/api/courses/lessons/8b428177-3c0c-426e-a23c-d4042629c7ed'
$token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAxOWQ5MWZkLTY4ZDMtNzAwMC1hMGRhLWQzZjJlZjI4MzQ1MCIsImVtYWlsIjoic2VjbnVvQGlyb25jbGFkLmNvbSIsInRlbmFudElkIjoiZTQ5MmU0N2UtMzNkYi00OTAzLWI0ZGEtOTc2OWI2ZTI0ZjFmIiwidGVuYW50TmFtZSI6Iklyb25jbGFkIiwiY29tcGFueU5hbWUiOiJJcm9uY2xhZCBJbmMiLCJwbGF0Zm9ybVJvbGVzIjpbInBsYXRmb3JtX2FkbWluIl0sImlhdCI6MTczMzM5ODEyMn0.dP-b2EZjO1l-L1-8hV-H2NfXhqk-xIGZ9DhfPKzljN0'

try {
    Write-Host "Testing lesson endpoint..." -ForegroundColor Cyan
    $response = Invoke-WebRequest -Uri $uri -Headers @{ 'Authorization' = "Bearer $token" } -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "`n✅ Response received (Status: $($response.StatusCode))" -ForegroundColor Green
    Write-Host "`nLesson Title: $($data.title)"
    Write-Host "Lesson ID: $($data.id)"
    
    Write-Host "`n📹 VIDEO URL:" -ForegroundColor Cyan
    if ($data.videoUrl) {
        Write-Host "✅ Present" -ForegroundColor Green
        Write-Host "$($data.videoUrl.Substring(0, 80))..."
    } else {
        Write-Host "❌ Missing" -ForegroundColor Red
    }
    
    Write-Host "`n🔗 PRESIGNED URL:" -ForegroundColor Cyan
    if ($data.presignedVideoUrl -and $data.presignedVideoUrl -ne "null") {
        Write-Host "✅ SUCCESS!" -ForegroundColor Green
        Write-Host "$($data.presignedVideoUrl.Substring(0, 100))..."
    } else {
        Write-Host "❌ Still NULL" -ForegroundColor Red
        Write-Host "Value: $($data.presignedVideoUrl)"
    }
    
    # Output raw JSON for debugging
    Write-Host "`nRaw response fields:" -ForegroundColor Gray
    Write-Host "presignedVideoUrl field exists: $($data | Get-Member -Name presignedVideoUrl -ErrorAction SilentlyContinue -is [PSMemberInfo])"
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode)"
    }
}
