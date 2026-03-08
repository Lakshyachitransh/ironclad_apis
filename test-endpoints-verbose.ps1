$email = "learner1@lakme.com"
$password = "1103@"
$baseUrl = "http://localhost:3000/api"

Write-Host "Testing debug endpoint..." -ForegroundColor Yellow

$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

try {
    $loginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
    $token = $loginRes.access_token
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    Write-Host "Calling: $baseUrl/courses/debug-assignments" -ForegroundColor Gray
    
    $response = Invoke-WebRequest -Uri "$baseUrl/courses/debug-assignments" -Method Get -Headers $headers -Verbose
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Content Length: $($response.Content.Length)" -ForegroundColor Gray
    Write-Host "Content Type: $($response.Headers.'Content-Type')" -ForegroundColor Gray
    Write-Host "Content:" -ForegroundColor Yellow
    $response.Content
    
    Write-Host "`n`nTrying /courses/my-courses..." -ForegroundColor Yellow
    Write-Host "Calling: $baseUrl/courses/my-courses?status=assigned" -ForegroundColor Gray
    
    $response2 = Invoke-WebRequest -Uri "$baseUrl/courses/my-courses?status=assigned" -Method Get -Headers $headers -Verbose
    Write-Host "Status: $($response2.StatusCode)" -ForegroundColor Green
    Write-Host "Content Length: $($response2.Content.Length)" -ForegroundColor Gray
    Write-Host "Content:" -ForegroundColor Yellow
    $response2.Content
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}
