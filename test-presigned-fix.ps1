$URI = "http://localhost:3000/api/courses/lessons/8b428177-3c0c-426e-a23c-d4042629c7ed"
$Token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5MTZmMzY5NC0wYjE5LTQwMTAtODE1Ni05OGFhMzJkYjQzOWUiLCJ0ZW5hbnRJZCI6IjMzNTZhZDdiLWY0OTAtNDY0NC05OTk0LWYwY2QzODNiMzExZCIsImlhdCI6MTczMjcyODI0OCwiZXhwIjoxNzMyODEwMjQ4fQ.S8hf_2B6Kh2qd_7H2jPp5X4sLp1jJ5gH2m3nK6aG4Z8"

$response = $null
try {
    $response = Invoke-WebRequest -Uri $URI -Headers @{ "Authorization" = "Bearer $Token" } -UseBasicParsing
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
    if ($data.presignedVideoUrl) {
        Write-Host $($data.presignedVideoUrl) -ForegroundColor Green
        Write-Host "✅ PRESIGNED URL IS NOW POPULATED!" -ForegroundColor Green
    } else {
        Write-Host "null" -ForegroundColor Red
        Write-Host "❌ Presigned URL is still null" -ForegroundColor Red
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
