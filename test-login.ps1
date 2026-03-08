$email = "learner1@lakme.com"
$password = "1103@"
$baseUrl = "http://localhost:3000/api"

Write-Host "Testing login endpoint..." -ForegroundColor Yellow

$body = @{
    email = $email
    password = $password
} | ConvertTo-Json

Write-Host "Request body: $body" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body $body -Verbose
    Write-Host "Login successful!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    Write-Host "Login failed!" -ForegroundColor Red
    Write-Host "Exception: $($_.Exception)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $body = $reader.ReadToEnd()
            Write-Host "Response body: $body" -ForegroundColor Red
        } catch {}
    }
}
