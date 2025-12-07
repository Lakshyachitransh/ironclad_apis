# API Usage Examples: Delete User & Test Email

## Quick Reference

### Token

Use this platform admin token for testing:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAxOWQ5MWZkLTY4ZDMtNzAwMC1hMGRhLWQzZjJlZjI4MzQ1MCIsImVtYWlsIjoic2VjbnVvQGlyb25jbGFkLmNvbSIsInRlbmFudElkIjoiZTQ5MmU0N2UtMzNkYi00OTAzLWI0ZGEtOTc2OWI2ZTI0ZjFmIiwidGVuYW50TmFtZSI6Iklyb25jbGFkIiwiY29tcGFueU5hbWUiOiJJcm9uY2xhZCBJbmMiLCJwbGF0Zm9ybVJvbGVzIjpbInBsYXRmb3JtX2FkbWluIl0sImlhdCI6MTczMzM5ODEyMn0.dP-b2EZjO1l-L1-8hV-H2NfXhqk-xIGZ9DhfPKzljN0
```

---

## 1. TEST EMAIL ENDPOINT

### Send Test Email to Gmail

**cURL:**

```bash
curl -X POST http://localhost:3000/api/users/send-test-email \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAxOWQ5MWZkLTY4ZDMtNzAwMC1hMGRhLWQzZjJlZjI4MzQ1MCIsImVtYWlsIjoic2VjbnVvQGlyb25jbGFkLmNvbSIsInRlbmFudElkIjoiZTQ5MmU0N2UtMzNkYi00OTAzLWI0ZGEtOTc2OWI2ZTI0ZjFmIiwidGVuYW50TmFtZSI6Iklyb25jbGFkIiwiY29tcGFueU5hbWUiOiJJcm9uY2xhZCBJbmMiLCJwbGF0Zm9ybVJvbGVzIjpbInBsYXRmb3JtX2FkbWluIl0sImlhdCI6MTczMzM5ODEyMn0.dP-b2EZjO1l-L1-8hV-H2NfXhqk-xIGZ9DhfPKzljN0" \
  -H "Content-Type: application/json" \
  -d '{"email":"srivastavalakshya1103@GMAIL.COM"}'
```

**PowerShell:**

```powershell
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAxOWQ5MWZkLTY4ZDMtNzAwMC1hMGRhLWQzZjJlZjI4MzQ1MCIsImVtYWlsIjoic2VjbnVvQGlyb25jbGFkLmNvbSIsInRlbmFudElkIjoiZTQ5MmU0N2UtMzNkYi00OTAzLWI0ZGEtOTc2OWI2ZTI0ZjFmIiwidGVuYW50TmFtZSI6Iklyb25jbGFkIiwiY29tcGFueU5hbWUiOiJJcm9uY2xhZCBJbmMiLCJwbGF0Zm9ybVJvbGVzIjpbInBsYXRmb3JtX2FkbWluIl0sImlhdCI6MTczMzM5ODEyMn0.dP-b2EZjO1l-L1-8hV-H2NfXhqk-xIGZ9DhfPKzljN0"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}
$body = '{"email":"srivastavalakshya1103@GMAIL.COM"}'

$response = Invoke-WebRequest -Uri "http://localhost:3000/api/users/send-test-email" `
    -Method POST `
    -Headers $headers `
    -Body $body

Write-Host $response.Content
```

**JavaScript (Fetch):**

```javascript
const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAxOWQ5MWZkLTY4ZDMtNzAwMC1hMGRhLWQzZjJlZjI4MzQ1MCIsImVtYWlsIjoic2VjbnVvQGlyb25jbGFkLmNvbSIsInRlbmFudElkIjoiZTQ5MmU0N2UtMzNkYi00OTAzLWI0ZGEtOTc2OWI2ZTI0ZjFmIiwidGVuYW50TmFtZSI6Iklyb25jbGFkIiwiY29tcGFueU5hbWUiOiJJcm9uY2xhZCBJbmMiLCJwbGF0Zm9ybVJvbGVzIjpbInBsYXRmb3JtX2FkbWluIl0sImlhdCI6MTczMzM5ODEyMn0.dP-b2EZjO1l-L1-8hV-H2NfXhqk-xIGZ9DhfPKzljN0';

fetch('http://localhost:3000/api/users/send-test-email', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'srivastavalakshya1103@GMAIL.COM',
  }),
})
  .then((res) => res.json())
  .then((data) => {
    console.log('✅ Email sent:', data);
    console.log('Message:', data.message);
    console.log('Sent to:', data.emailSentTo);
    console.log('Timestamp:', data.timestamp);
  })
  .catch((err) => console.error('❌ Error:', err));
```

**Postman:**

1. Create new POST request
2. URL: `http://localhost:3000/api/users/send-test-email`
3. Headers Tab:
   - `Authorization`: `Bearer {token}`
   - `Content-Type`: `application/json`
4. Body (raw JSON):
   ```json
   {
     "email": "srivastavalakshya1103@GMAIL.COM"
   }
   ```
5. Send

**Success Response (200):**

```json
{
  "success": true,
  "message": "Test email sent successfully to srivastavalakshya1103@GMAIL.COM",
  "emailSentTo": "srivastavalakshya1103@GMAIL.COM",
  "timestamp": "2025-12-05T10:35:22.123Z"
}
```

**Error Response (400):**

```json
{
  "statusCode": 400,
  "message": "Valid email address is required",
  "error": "Bad Request"
}
```

---

## 2. DELETE USER ENDPOINT

### Delete User by ID

**cURL:**

```bash
curl -X DELETE http://localhost:3000/api/users/{userId} \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAxOWQ5MWZkLTY4ZDMtNzAwMC1hMGRhLWQzZjJlZjI4MzQ1MCIsImVtYWlsIjoic2VjbnVvQGlyb25jbGFkLmNvbSIsInRlbmFudElkIjoiZTQ5MmU0N2UtMzNkYi00OTAzLWI0ZGEtOTc2OWI2ZTI0ZjFmIiwidGVuYW50TmFtZSI6Iklyb25jbGFkIiwiY29tcGFueU5hbWUiOiJJcm9uY2xhZCBJbmMiLCJwbGF0Zm9ybVJvbGVzIjpbInBsYXRmb3JtX2FkbWluIl0sImlhdCI6MTczMzM5ODEyMn0.dP-b2EZjO1l-L1-8hV-H2NfXhqk-xIGZ9DhfPKzljN0" \
  -H "Content-Type: application/json"
```

Replace `{userId}` with actual user ID.

**PowerShell:**

```powershell
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAxOWQ5MWZkLTY4ZDMtNzAwMC1hMGRhLWQzZjJlZjI4MzQ1MCIsImVtYWlsIjoic2VjbnVvQGlyb25jbGFkLmNvbSIsInRlbmFudElkIjoiZTQ5MmU0N2UtMzNkYi00OTAzLWI0ZGEtOTc2OWI2ZTI0ZjFmIiwidGVuYW50TmFtZSI6Iklyb25jbGFkIiwiY29tcGFueU5hbWUiOiJJcm9uY2xhZCBJbmMiLCJwbGF0Zm9ybVJvbGVzIjpbInBsYXRmb3JtX2FkbWluIl0sImlhdCI6MTczMzM5ODEyMn0.dP-b2EZjO1l-L1-8hV-H2NfXhqk-xIGZ9DhfPKzljN0"
$userId = "123e4567-e89b-12d3-a456-426614174000"  # Replace with actual user ID
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$response = Invoke-WebRequest -Uri "http://localhost:3000/api/users/$userId" `
    -Method DELETE `
    -Headers $headers

Write-Host $response.Content
```

**JavaScript (Fetch):**

```javascript
const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAxOWQ5MWZkLTY4ZDMtNzAwMC1hMGRhLWQzZjJlZjI4MzQ1MCIsImVtYWlsIjoic2VjbnVvQGlyb25jbGFkLmNvbSIsInRlbmFudElkIjoiZTQ5MmU0N2UtMzNkYi00OTAzLWI0ZGEtOTc2OWI2ZTI0ZjFmIiwidGVuYW50TmFtZSI6Iklyb25jbGFkIiwiY29tcGFueU5hbWUiOiJJcm9uY2xhZCBJbmMiLCJwbGF0Zm9ybVJvbGVzIjpbInBsYXRmb3JtX2FkbWluIl0sImlhdCI6MTczMzM5ODEyMn0.dP-b2EZjO1l-L1-8hV-H2NfXhqk-xIGZ9DhfPKzljN0';
const userId = '123e4567-e89b-12d3-a456-426614174000'; // Replace with actual user ID

fetch(`http://localhost:3000/api/users/${userId}`, {
  method: 'DELETE',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
})
  .then((res) => res.json())
  .then((data) => {
    console.log('✅ User deleted:', data);
    console.log('Deleted email:', data.deletedUser.email);
    console.log('Deleted at:', data.deletedUser.deletedAt);
  })
  .catch((err) => console.error('❌ Error:', err));
```

**Postman:**

1. Create new DELETE request
2. URL: `http://localhost:3000/api/users/{userId}`
3. Replace `{userId}` with actual user ID
4. Headers Tab:
   - `Authorization`: `Bearer {token}`
   - `Content-Type`: `application/json`
5. Send

**Success Response (200):**

```json
{
  "success": true,
  "message": "User user@example.com deleted successfully",
  "deletedUser": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "displayName": "John Doe",
    "deletedAt": "2025-12-05T10:30:00.000Z"
  }
}
```

**Error Response - User Not Found (400):**

```json
{
  "statusCode": 400,
  "message": "User not found",
  "error": "Bad Request"
}
```

**Error Response - Unauthorized (403):**

```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

---

## 3. BROWSER-BASED TESTING

### HTML Form for Test Email

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Test Email Endpoint</title>
    <style>
      body {
        font-family: Arial;
        margin: 40px;
      }
      .container {
        max-width: 500px;
      }
      input,
      button {
        padding: 10px;
        margin: 10px 0;
        width: 100%;
      }
      button {
        background: #667eea;
        color: white;
        border: none;
        cursor: pointer;
      }
      .response {
        background: #f0f0f0;
        padding: 15px;
        margin-top: 20px;
        border-radius: 5px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>📧 Test Email Endpoint</h2>

      <input
        type="email"
        id="email"
        placeholder="Enter email address"
        value="srivastavalakshya1103@GMAIL.COM"
      />
      <button onclick="sendTestEmail()">Send Test Email</button>

      <div id="response" class="response" style="display:none;">
        <h3>Response:</h3>
        <pre id="responseBody"></pre>
      </div>
    </div>

    <script>
      const TOKEN =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAxOWQ5MWZkLTY4ZDMtNzAwMC1hMGRhLWQzZjJlZjI4MzQ1MCIsImVtYWlsIjoic2VjbnVvQGlyb25jbGFkLmNvbSIsInRlbmFudElkIjoiZTQ5MmU0N2UtMzNkYi00OTAzLWI0ZGEtOTc2OWI2ZTI0ZjFmIiwidGVuYW50TmFtZSI6Iklyb25jbGFkIiwiY29tcGFueU5hbWUiOiJJcm9uY2xhZCBJbmMiLCJwbGF0Zm9ybVJvbGVzIjpbInBsYXRmb3JtX2FkbWluIl0sImlhdCI6MTczMzM5ODEyMn0.dP-b2EZjO1l-L1-8hV-H2NfXhqk-xIGZ9DhfPKzljN0';

      async function sendTestEmail() {
        const email = document.getElementById('email').value;

        try {
          const response = await fetch(
            'http://localhost:3000/api/users/send-test-email',
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${TOKEN}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email }),
            },
          );

          const data = await response.json();
          document.getElementById('responseBody').textContent = JSON.stringify(
            data,
            null,
            2,
          );
          document.getElementById('response').style.display = 'block';
        } catch (error) {
          document.getElementById('responseBody').textContent =
            `Error: ${error.message}`;
          document.getElementById('response').style.display = 'block';
        }
      }
    </script>
  </body>
</html>
```

---

## 4. SWAGGER/OPENAPI

### View in Browser

Open http://localhost:3000/api/docs to see interactive Swagger documentation with:

- ✅ Full endpoint details
- ✅ Request/response schemas
- ✅ Example payloads
- ✅ Try it out feature
- ✅ Authorization headers

---

## ENVIRONMENT SETUP

### Required Token Claims

The token must have:

- `id`: User ID
- `email`: User email
- `tenantId`: Tenant ID
- `platformRoles`: Should include either `platform_admin` or `tenant_admin`

### Required Permissions

For **Delete User**: `users.delete`
For **Test Email**: `admin.manage`

---

## TROUBLESHOOTING

### Connection Refused

- Verify server is running: `npm start`
- Check http://localhost:3000/api is accessible

### Unauthorized (401)

- Verify token is valid and not expired
- Include Bearer prefix in Authorization header

### Forbidden (403)

- Verify user has required permissions
- Check user has platform_admin or tenant_admin role

### Email Not Sending

- Check SMTP credentials in .env
- Verify Hostinger account is active
- Check server logs for detailed errors

---

**Last Updated:** December 5, 2025
**Status:** ✅ Production Ready
