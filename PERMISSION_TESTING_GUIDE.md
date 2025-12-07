# Permission-Based Access Control - Testing Guide

## Quick Reference

### Get Your Token

First, get authentication tokens for testing with different roles:

```bash
# Platform Admin Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password"
  }'

# Save the token from response
# export ADMIN_TOKEN="<token_from_response>"
```

---

## Test Scenarios

### Scenario 1: Fix Duplicate Permission Creation

**Before (Would Fail):**

```bash
# First attempt - creates successfully
curl -X POST http://localhost:3000/api/roles/permission \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "content.read",
    "name": "Read Content",
    "resource": "content",
    "action": "read",
    "category": "content"
  }'

# Second attempt with same code - WOULD CRASH (P2002 error)
curl -X POST http://localhost:3000/api/roles/permission \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "content.read",
    "name": "Read Content",
    "resource": "content",
    "action": "read",
    "category": "content"
  }'
```

**After (Now Fails Gracefully):**

```json
{
  "statusCode": 400,
  "message": "Permission with code 'content.read' already exists",
  "error": "Bad Request"
}
```

---

### Scenario 2: Permission-Based Access Control

#### Test 1: Admin Can Create Permissions

```bash
curl -X POST http://localhost:3000/api/roles/permission \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "content.manage",
    "name": "Manage Content",
    "resource": "content",
    "action": "manage",
    "category": "content"
  }'
```

**Expected: ✅ 201 Created**

---

#### Test 2: Trainer Cannot Create Permissions

```bash
# Get trainer token first
TRAINER_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "trainer@example.com", "password": "password"}' \
  | jq -r '.accessToken')

# Try to create permission (requires permissions.create)
curl -X POST http://localhost:3000/api/roles/permission \
  -H "Authorization: Bearer $TRAINER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "content.delete",
    "name": "Delete Content",
    "resource": "content",
    "action": "delete",
    "category": "content"
  }'
```

**Expected: ❌ 403 Forbidden**

```json
{
  "statusCode": 403,
  "message": "User does not have permission: permissions.create",
  "error": "Forbidden"
}
```

---

#### Test 3: Admin Can Assign Permissions by Category

```bash
curl -X POST http://localhost:3000/api/roles/assign-permissions-by-category \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleCode": "trainer",
    "category": "courses"
  }'
```

**Expected: ✅ 200 OK**

```json
{
  "roleCode": "trainer",
  "category": "courses",
  "assignedCount": 7,
  "permissions": [
    { "code": "courses.create", "name": "Create Course" },
    { "code": "courses.read", "name": "View Courses" },
    { "code": "courses.update", "name": "Update Course" },
    { "code": "courses.delete", "name": "Delete Course" },
    { "code": "courses.publish", "name": "Publish Course" },
    { "code": "courses.assign", "name": "Assign Course" },
    { "code": "courses.export", "name": "Export Course" }
  ]
}
```

---

#### Test 4: Learner Cannot Assign Permissions

```bash
# Get learner token
LEARNER_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "learner@example.com", "password": "password"}' \
  | jq -r '.accessToken')

# Try to assign permissions (requires roles.assign-permission)
curl -X POST http://localhost:3000/api/roles/assign-permissions-by-category \
  -H "Authorization: Bearer $LEARNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleCode": "trainer",
    "category": "courses"
  }'
```

**Expected: ❌ 403 Forbidden**

```json
{
  "statusCode": 403,
  "message": "User does not have permission: roles.assign-permission",
  "error": "Forbidden"
}
```

---

### Scenario 3: Check Role Permissions

```bash
# Anyone can view role permissions (requires roles.read)
curl -X GET "http://localhost:3000/api/roles/trainer/permissions" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Expected: ✅ 200 OK** (Shows all permissions assigned to trainer role)

---

## PowerShell Complete Test Suite

```powershell
# Variables
$BASE_URL = "http://localhost:3000"
$ADMIN_EMAIL = "admin@example.com"
$ADMIN_PASS = "password"
$TRAINER_EMAIL = "trainer@example.com"
$TRAINER_PASS = "password"

# Function to get token
function Get-Token($email, $password) {
  $body = @{
    email = $email
    password = $password
  } | ConvertTo-Json

  $response = Invoke-WebRequest -Uri "$BASE_URL/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

  return ($response.Content | ConvertFrom-Json).accessToken
}

# Get tokens
Write-Host "Getting authentication tokens..." -ForegroundColor Cyan
$ADMIN_TOKEN = Get-Token $ADMIN_EMAIL $ADMIN_PASS
$TRAINER_TOKEN = Get-Token $TRAINER_EMAIL $TRAINER_PASS

Write-Host "✅ Admin Token: $($ADMIN_TOKEN.Substring(0, 20))..." -ForegroundColor Green
Write-Host "✅ Trainer Token: $($TRAINER_TOKEN.Substring(0, 20))..." -ForegroundColor Green

# Test 1: Admin can create permission
Write-Host "`n[Test 1] Admin creating permission..." -ForegroundColor Yellow
$headers = @{
  "Authorization" = "Bearer $ADMIN_TOKEN"
  "Content-Type" = "application/json"
}

$body = @{
  code = "test.permission"
  name = "Test Permission"
  resource = "test"
  action = "permission"
  category = "Custom"
} | ConvertTo-Json

try {
  $response = Invoke-WebRequest -Uri "$BASE_URL/api/roles/permission" `
    -Method POST `
    -Headers $headers `
    -Body $body
  Write-Host "✅ SUCCESS: Permission created" -ForegroundColor Green
} catch {
  Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Trainer cannot create permission
Write-Host "`n[Test 2] Trainer trying to create permission (should fail)..." -ForegroundColor Yellow
$headers = @{
  "Authorization" = "Bearer $TRAINER_TOKEN"
  "Content-Type" = "application/json"
}

$body = @{
  code = "test.permission2"
  name = "Test Permission 2"
  resource = "test"
  action = "permission"
  category = "Custom"
} | ConvertTo-Json

try {
  $response = Invoke-WebRequest -Uri "$BASE_URL/api/roles/permission" `
    -Method POST `
    -Headers $headers `
    -Body $body
  Write-Host "❌ UNEXPECTED: Trainer should not be able to create permission!" -ForegroundColor Red
} catch {
  if ($_.Exception.Response.StatusCode -eq 403) {
    Write-Host "✅ CORRECT: Access denied (403 Forbidden)" -ForegroundColor Green
    Write-Host "   Message: $(($_.ErrorDetails.Message | ConvertFrom-Json).message)" -ForegroundColor Green
  } else {
    Write-Host "❌ WRONG ERROR: Expected 403, got $($_.Exception.Response.StatusCode)" -ForegroundColor Red
  }
}

# Test 3: Admin can assign permissions by category
Write-Host "`n[Test 3] Admin assigning permissions by category..." -ForegroundColor Yellow
$headers = @{
  "Authorization" = "Bearer $ADMIN_TOKEN"
  "Content-Type" = "application/json"
}

$body = @{
  roleCode = "learner"
  category = "quizzes"
} | ConvertTo-Json

try {
  $response = Invoke-WebRequest -Uri "$BASE_URL/api/roles/assign-permissions-by-category" `
    -Method POST `
    -Headers $headers `
    -Body $body

  $result = $response.Content | ConvertFrom-Json
  Write-Host "✅ SUCCESS: Assigned $($result.assignedCount) permissions to learner role" -ForegroundColor Green
  Write-Host "   Permissions: $($result.permissions | ForEach-Object { $_.code } | Join-String -Separator ', ')" -ForegroundColor Green
} catch {
  Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✅ All tests completed!" -ForegroundColor Cyan
```

Save this as `test-rbac.ps1` and run:

```powershell
.\test-rbac.ps1
```

---

## Expected Output

```
Getting authentication tokens...
✅ Admin Token: eyJhbGciOiJIUzI1NiIs...
✅ Trainer Token: eyJhbGciOiJIUzI1NiIs...

[Test 1] Admin creating permission...
✅ SUCCESS: Permission created

[Test 2] Trainer trying to create permission (should fail)...
✅ CORRECT: Access denied (403 Forbidden)
   Message: User does not have permission: permissions.create

[Test 3] Admin assigning permissions by category...
✅ SUCCESS: Assigned 6 permissions to learner role
   Permissions: quizzes.create, quizzes.read, quizzes.update, quizzes.delete, quizzes.publish, quizzes.generate-ai

✅ All tests completed!
```

---

## Summary

| Endpoint                    | Test    | Before       | After              |
| --------------------------- | ------- | ------------ | ------------------ |
| Create Duplicate Permission | N/A     | P2002 Crash  | 400 Bad Request ✅ |
| Admin Create Permission     | Admin   | Works        | Works ✅           |
| Trainer Create Permission   | Trainer | Works (BUG!) | 403 Forbidden ✅   |
| Admin Assign Permissions    | Admin   | Works        | Works ✅           |
| Trainer Assign Permissions  | Trainer | Works (BUG!) | 403 Forbidden ✅   |
