# Test my-courses endpoint with learner1 credentials

$email = "learner1@lakme.com"
$password = "1103@"
$baseUrl = "http://localhost:3000/api"

Write-Host "=== TESTING MY-COURSES ENDPOINT ===" -ForegroundColor Cyan

# Step 1: Login
Write-Host "`n1. Logging in with $email ..." -ForegroundColor Yellow
$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

try {
    $loginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
    $token = $loginRes.access_token
    Write-Host "Token received" -ForegroundColor Green
    Write-Host "User ID: $($loginRes.user.id)" -ForegroundColor Gray
    Write-Host "Tenant ID: $($loginRes.user.tenantId)" -ForegroundColor Gray
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    # Step 2: Call debug endpoint
    Write-Host "`n2. Calling debug-assignments endpoint..." -ForegroundColor Yellow
    $debugRes = Invoke-RestMethod -Uri "$baseUrl/courses/debug-assignments" -Method Get -Headers $headers
    
    Write-Host "`n=== DEBUG OUTPUT ===" -ForegroundColor Cyan
    $debugRes | ConvertTo-Json -Depth 10
    
    # Step 3: Call my-courses endpoint
    Write-Host "`n`n3. Calling my-courses endpoint..." -ForegroundColor Yellow
    $myCoursesRes = Invoke-RestMethod -Uri "$baseUrl/courses/my-courses?status=assigned" -Method Get -Headers $headers
    
    Write-Host "`n=== MY-COURSES OUTPUT ===" -ForegroundColor Cyan
    $myCoursesRes | ConvertTo-Json -Depth 10
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
