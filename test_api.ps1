#!/usr/bin/env pwsh

# Login as admin user
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
  -Method Post `
  -Headers @{"Content-Type" = "application/json"} `
  -Body '{"email":"admin@ironclad.local","password":"Test@1234"}'

Write-Host "Login Response:"
Write-Host ($loginResponse | ConvertTo-Json)

$accessToken = $loginResponse.access_token
Write-Host "`nAccess Token: $accessToken`n"

# Get tenant by name
Write-Host "Testing GET /api/tenants/:name"
$tenantResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/tenants/Ironclad" `
  -Method Get `
  -Headers @{"Authorization" = "Bearer $accessToken"}

Write-Host ($tenantResponse | ConvertTo-Json)
$tenantId = $tenantResponse.id
Write-Host "`nTenant ID: $tenantId`n"

# Test bulk upload endpoint
Write-Host "Testing POST /api/users/bulk-upload"
$csvPath = "C:\Users\DELL\OneDrive\Desktop\ironclad_apis\ironclad_apis\test_users.csv"
$csvContent = Get-Content -Path $csvPath -Raw

$form = @{
  csv = @{
    filename = "test_users.csv"
    contentType = "text/csv"
    value = $csvContent
  }
}

$bulkResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/users/bulk-upload" `
  -Method Post `
  -Headers @{"Authorization" = "Bearer $accessToken"} `
  -Form $form

Write-Host ($bulkResponse | ConvertTo-Json)
