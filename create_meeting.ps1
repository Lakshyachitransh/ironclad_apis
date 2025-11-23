# Create Tenant, Teacher, and Live Class Meeting

Write-Host "🚀 Starting setup..." -ForegroundColor Cyan

# Step 1: Create Tenant
Write-Host "📌 Creating tenant..." -ForegroundColor Yellow
$tenantResponse = curl -s -X POST http://localhost:3000/tenants/create `
  -H "Content-Type: application/json" `
  -d '{"name":"Tech Academy","description":"Online Learning Platform"}' | ConvertFrom-Json

$tenantId = $tenantResponse.data.id
Write-Host "✅ Tenant Created: $tenantId" -ForegroundColor Green

# Step 2: Create Admin User
Write-Host "📌 Creating admin user..." -ForegroundColor Yellow
$adminResponse = curl -s -X POST http://localhost:3000/auth/register `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@techacademy.com","password":"Admin@123","firstName":"Admin","lastName":"User"}' | ConvertFrom-Json

$adminId = $adminResponse.data.id
$adminToken = $adminResponse.data.accessToken
Write-Host "✅ Admin Created: $adminId" -ForegroundColor Green

# Step 3: Add Admin to Tenant
Write-Host "📌 Adding admin to tenant..." -ForegroundColor Yellow
curl -s -X POST "http://localhost:3000/tenants/$tenantId/add-user" `
  -H "Authorization: Bearer $adminToken" `
  -H "Content-Type: application/json" `
  -d "{`"userId`":`"$adminId`",`"role`":`"org_admin`"}" | Out-Null
Write-Host "✅ Admin assigned to tenant" -ForegroundColor Green

# Step 4: Create Teacher User
Write-Host "📌 Creating teacher user..." -ForegroundColor Yellow
$teacherResponse = curl -s -X POST http://localhost:3000/auth/register `
  -H "Content-Type: application/json" `
  -d '{"email":"teacher@techacademy.com","password":"Teacher@123","firstName":"John","lastName":"Teacher"}' | ConvertFrom-Json

$teacherId = $teacherResponse.data.id
$teacherToken = $teacherResponse.data.accessToken
Write-Host "✅ Teacher Created: $teacherId" -ForegroundColor Green

# Step 5: Add Teacher to Tenant
Write-Host "📌 Adding teacher to tenant..." -ForegroundColor Yellow
curl -s -X POST "http://localhost:3000/tenants/$tenantId/add-user" `
  -H "Authorization: Bearer $adminToken" `
  -H "Content-Type: application/json" `
  -d "{`"userId`":`"$teacherId`",`"role`":`"instructor`"}" | Out-Null
Write-Host "✅ Teacher assigned to tenant" -ForegroundColor Green

# Step 6: Create Live Class Meeting
Write-Host "📌 Creating live class meeting..." -ForegroundColor Yellow
$now = Get-Date -AsUTC -Format 'yyyy-MM-ddTHH:mm:ssZ'
$meetingResponse = curl -s -X POST http://localhost:3000/live-class/create `
  -H "Authorization: Bearer $teacherToken" `
  -H "Content-Type: application/json" `
  -d "{`"tenantId`":`"$tenantId`",`"title`":`"Introduction to Web Development`",`"description`":`"Learn the basics of HTML, CSS, and JavaScript`",`"scheduledAt`":`"$now`",`"meetingUrl`":`"https://meet.google.com/abc-defg-hij`",`"maxParticipants`":50}" | ConvertFrom-Json

$meetingId = $meetingResponse.data.id
$meetingUrl = $meetingResponse.data.meetingUrl
Write-Host "✅ Meeting Created: $meetingId" -ForegroundColor Green

# Step 7: Start the Meeting
Write-Host "📌 Starting live class meeting..." -ForegroundColor Yellow
curl -s -X POST "http://localhost:3000/live-class/$meetingId/start" `
  -H "Authorization: Bearer $teacherToken" `
  -H "Content-Type: application/json" `
  -d '{}' | Out-Null
Write-Host "✅ Meeting Started" -ForegroundColor Green

# Step 8: Display Results
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ SETUP COMPLETE" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "🏢 Tenant: Tech Academy" -ForegroundColor White
Write-Host "👨‍🏫 Teacher: John Teacher (teacher@techacademy.com)" -ForegroundColor White
Write-Host "📚 Meeting: Introduction to Web Development" -ForegroundColor White
Write-Host ""
Write-Host "🔗 MEETING LINK TO SHARE:" -ForegroundColor Yellow
Write-Host "   $meetingUrl" -ForegroundColor Green -BackgroundColor Black
Write-Host ""
Write-Host "📋 Details:" -ForegroundColor White
Write-Host "   Tenant ID: $tenantId" -ForegroundColor Gray
Write-Host "   Teacher ID: $teacherId" -ForegroundColor Gray
Write-Host "   Meeting ID: $meetingId" -ForegroundColor Gray
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
