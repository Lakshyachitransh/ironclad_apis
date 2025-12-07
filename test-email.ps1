# Test Email API Endpoint

$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAxOWQ5MWZkLTY4ZDMtNzAwMC1hMGRhLWQzZjJlZjI4MzQ1MCIsImVtYWlsIjoic2VjbnVvQGlyb25jbGFkLmNvbSIsInRlbmFudElkIjoiZTQ5MmU0N2UtMzNkYi00OTAzLWI0ZGEtOTc2OWI2ZTI0ZjFmIiwidGVuYW50TmFtZSI6Iklyb25jbGFkIiwiY29tcGFueU5hbWUiOiJJcm9uY2xhZCBJbmMiLCJwbGF0Zm9ybVJvbGVzIjpbInBsYXRmb3JtX2FkbWluIl0sImlhdCI6MTczMzM5ODEyMn0.dP-b2EZjO1l-L1-8hV-H2NfXhqk-xIGZ9DhfPKzljN0"
$email = "srivastavalakshya1103@GMAIL.COM"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}
$body = @{
    "email" = $email
} | ConvertTo-Json

Write-Host "================================" -ForegroundColor Cyan
Write-Host "📧 Sending Test Email" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Email: $email" -ForegroundColor Yellow
Write-Host "Endpoint: POST /api/users/send-test-email" -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/users/send-test-email" `
        -Method POST `
        -Headers $headers `
        -Body $body
    
    Write-Host "✅ Email Test Successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json | Write-Host -ForegroundColor Green
}
catch {
    Write-Host "❌ Error sending email:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
