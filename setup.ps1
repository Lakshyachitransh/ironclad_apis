Write-Host '🚀 Starting setup...' -ForegroundColor Cyan
Write-Host ''

# Step 1: Create Tenant
Write-Host '📌 [1/6] Creating tenant...' -ForegroundColor Yellow
$tenantBody = '{"name":"Tech Academy","description":"Online Learning Platform"}'
$tenantResp = Invoke-WebRequest -Uri 'http://localhost:3000/tenants/create' -Method POST -ContentType 'application/json' -Body $tenantBody -UseBasicParsing
$tenant = $tenantResp.Content | ConvertFrom-Json
$tenantId = $tenant.data.id
Write-Host ('✅ Tenant Created: ' + $tenantId) -ForegroundColor Green
Write-Host ''

# Step 2: Create Admin User
Write-Host '📌 [2/6] Creating admin user...' -ForegroundColor Yellow
$adminBody = '{"email":"admin@techacademy.com","password":"Admin@123","firstName":"Admin","lastName":"User"}'
$adminResp = Invoke-WebRequest -Uri 'http://localhost:3000/auth/register' -Method POST -ContentType 'application/json' -Body $adminBody -UseBasicParsing
$admin = $adminResp.Content | ConvertFrom-Json
$adminId = $admin.data.id
$adminToken = $admin.data.accessToken
Write-Host '✅ Admin Created' -ForegroundColor Green
Write-Host ''

# Step 3: Add Admin to Tenant
Write-Host '📌 [3/6] Adding admin to tenant...' -ForegroundColor Yellow
$headers = @{'Authorization' = 'Bearer ' + $adminToken; 'Content-Type' = 'application/json'}
$addAdminBody = '{"userId":"'+ $adminId +'","role":"org_admin"}'
Invoke-WebRequest -Uri ('http://localhost:3000/tenants/' + $tenantId + '/add-user') -Method POST -Headers $headers -Body $addAdminBody -UseBasicParsing | Out-Null
Write-Host '✅ Admin assigned to tenant' -ForegroundColor Green
Write-Host ''

# Step 4: Create Teacher User
Write-Host '📌 [4/6] Creating teacher user...' -ForegroundColor Yellow
$teacherBody = '{"email":"teacher@techacademy.com","password":"Teacher@123","firstName":"John","lastName":"Teacher"}'
$teacherResp = Invoke-WebRequest -Uri 'http://localhost:3000/auth/register' -Method POST -ContentType 'application/json' -Body $teacherBody -UseBasicParsing
$teacher = $teacherResp.Content | ConvertFrom-Json
$teacherId = $teacher.data.id
$teacherToken = $teacher.data.accessToken
Write-Host '✅ Teacher Created: John Teacher' -ForegroundColor Green
Write-Host ''

# Step 5: Add Teacher to Tenant
Write-Host '📌 [5/6] Adding teacher to tenant...' -ForegroundColor Yellow
$headers = @{'Authorization' = 'Bearer ' + $adminToken; 'Content-Type' = 'application/json'}
$addTeacherBody = '{"userId":"'+ $teacherId +'","role":"instructor"}'
Invoke-WebRequest -Uri ('http://localhost:3000/tenants/' + $tenantId + '/add-user') -Method POST -Headers $headers -Body $addTeacherBody -UseBasicParsing | Out-Null
Write-Host '✅ Teacher assigned to tenant' -ForegroundColor Green
Write-Host ''

# Step 6: Create Live Class Meeting
Write-Host '📌 [6/6] Creating live class meeting...' -ForegroundColor Yellow
$now = [System.DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ')
$meetingBody = '{"tenantId":"'+ $tenantId +'","title":"Introduction to Web Development","description":"Learn the basics of HTML, CSS, and JavaScript","scheduledAt":"'+ $now +'","meetingUrl":"https://meet.google.com/abc-defg-hij","maxParticipants":50}'
$headers = @{'Authorization' = 'Bearer ' + $teacherToken; 'Content-Type' = 'application/json'}
$meetingResp = Invoke-WebRequest -Uri 'http://localhost:3000/live-class/create' -Method POST -Headers $headers -Body $meetingBody -UseBasicParsing
$meeting = $meetingResp.Content | ConvertFrom-Json
$meetingId = $meeting.data.id
$meetingUrl = $meeting.data.meetingUrl
Write-Host '✅ Meeting Created' -ForegroundColor Green
Write-Host ''

# Step 7: Start the Meeting
Write-Host '📌 Starting meeting...' -ForegroundColor Yellow
$headers = @{'Authorization' = 'Bearer ' + $teacherToken; 'Content-Type' = 'application/json'}
Invoke-WebRequest -Uri ('http://localhost:3000/live-class/' + $meetingId + '/start') -Method POST -Headers $headers -Body '{}' -UseBasicParsing | Out-Null
Write-Host '✅ Meeting Started' -ForegroundColor Green
Write-Host ''

# Step 8: Display Results
Write-Host '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' -ForegroundColor Cyan
Write-Host '✅ SETUP COMPLETE' -ForegroundColor Green
Write-Host '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' -ForegroundColor Cyan
Write-Host ''
Write-Host '🏢 Tenant: Tech Academy' -ForegroundColor White
Write-Host '👨‍🏫 Teacher: John Teacher (teacher@techacademy.com)' -ForegroundColor White
Write-Host '📚 Meeting: Introduction to Web Development' -ForegroundColor White
Write-Host ''
Write-Host '🔗 MEETING LINK TO SHARE:' -ForegroundColor Yellow
Write-Host ('   ' + $meetingUrl) -ForegroundColor Green
Write-Host ''
Write-Host '📋 Details:' -ForegroundColor White
Write-Host ('   Tenant ID: ' + $tenantId) -ForegroundColor Gray
Write-Host ('   Teacher ID: ' + $teacherId) -ForegroundColor Gray
Write-Host ('   Meeting ID: ' + $meetingId) -ForegroundColor Gray
Write-Host ''
Write-Host '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' -ForegroundColor Cyan
