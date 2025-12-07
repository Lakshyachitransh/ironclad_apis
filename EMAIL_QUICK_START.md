# 🎉 Email System Quick Start

## Setup (2 minutes)

### 1. Configure SMTP in `.env`

```bash
# Gmail Example
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
EMAIL_FROM=noreply@yourcompany.com
SUPPORT_EMAIL=support@yourcompany.com
APP_LOGIN_URL=https://app.yourcompany.com/login

# OR AWS SES Example
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=<your-ses-smtp-username>
SMTP_PASSWORD=<your-ses-smtp-password>
EMAIL_FROM=noreply@yourdomain.com
```

### 2. Server automatically initializes the email service on startup

```
✅ Email service connected successfully
📧 Initializing Email Service - SMTP: smtp.gmail.com:587
```

---

## Usage Examples

### Create a User (Welcome Email Sent Automatically)

```bash
# Email is automatically sent when user is created!
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@company.com",
    "displayName": "John Doe",
    "password": "SecurePass123!",
    "tenantName": "My Company",
    "roles": ["learner"]
  }'

# ✅ Welcome email sent automatically in background
# User receives: login credentials, setup guide, welcome message
```

### What User Receives

📧 **Email Subject:** `🎉 Welcome to My Company! Your Account is Ready`

📝 **Email Content:**

- Professional gradient header
- Personalized greeting
- Email and temporary password
- Secure login link
- 6 feature highlights
- Getting started guide (3 steps)
- Support contact info
- Security reminder

---

## Email Templates (Pre-Built)

All templates are professional, mobile-responsive, and branded:

### 1. **Enhanced Welcome Email** ✨

- Status: ✅ Automatically sent on user creation
- Features: Credentials, getting started guide, security info
- File: `src/common/templates/enhanced-welcome-email.template.ts`

### 2. **Password Reset Email** 🔐

- Trigger: When user requests password reset
- Features: 24-hour expiring reset link, security notice
- File: `src/common/templates/additional-email.templates.ts`

### 3. **Account Verification Email** ✅

- Trigger: When account is verified
- Features: Confirmation, dashboard link

### 4. **Role Assignment Email** 🎯

- Trigger: When role assigned to user
- Features: Role name, permissions list, activation notice

### 5. **Course Assignment Email** 🎓

- Trigger: When course assigned to user
- Features: Course title, due date, course link

---

## Email Notification Service API

Location: `src/common/services/email-notification.service.ts`

### Available Methods

```typescript
// Send welcome email
await this.emailNotification.sendWelcomeEmail(
  email: string,
  userName: string,
  tempPassword: string,
  tenantName: string,
  features?: string[]
);

// Send password reset
await this.emailNotification.sendPasswordResetEmail(
  email: string,
  userName: string,
  resetLink: string,
  expirationHours?: number
);

// Send role assignment
await this.emailNotification.sendRoleAssignmentEmail(
  email: string,
  userName: string,
  roleName: string,
  tenantName: string,
  rolePermissions?: string[]
);

// Send course assignment
await this.emailNotification.sendCourseAssignmentEmail(
  email: string,
  userName: string,
  courseTitle: string,
  dueDate?: Date,
  courseLink?: string
);

// Send bulk emails
await this.emailNotification.sendBulkEmails(
  emails: Array<{ to: string; subject: string; html: string }>,
  delayMs?: number
);

// Test configuration
await this.emailNotification.testEmail(testEmail: string);
```

---

## Common Scenarios

### Scenario 1: New User Onboarding

```
1. Admin creates user via POST /api/users
   ↓
2. ✅ Welcome email automatically sent
   ↓
3. User receives: credentials, login link, setup guide
   ↓
4. User logs in within 2-3 minutes
```

### Scenario 2: Bulk User Import

```
1. Admin uploads CSV via POST /api/users/bulk-upload
   ↓
2. ✅ Welcome email sent to each user (with rate limiting)
   ↓
3. Users receive: personalized credentials, login link
   ↓
4. Team onboarded efficiently
```

### Scenario 3: Role Changes

```
1. Admin assigns new role to user via POST /api/roles/assign-role
   ↓
2. ✅ Role assignment email sent automatically
   ↓
3. User receives: role name, new permissions, activation notice
```

---

## Monitoring & Logs

### View Email Logs

```bash
# All email service logs
npm start 2>&1 | grep "Email"

# Email sent successfully
npm start 2>&1 | grep "✅ Welcome email"

# Email failed
npm start 2>&1 | grep "❌ Failed to send"
```

### Log Examples

```
✅ Email service connected successfully
📧 Email sent successfully to user@example.com, MessageId: <msg-id>
⚠️ Failed to send welcome email to invalid@email: Invalid email
```

---

## Troubleshooting

### Issue: "Email service verification failed"

**Solution:** Check SMTP credentials in .env

```bash
# Verify SMTP is working
SMTP_USER=correct-email@gmail.com
SMTP_PASSWORD=your-app-password  # NOT your Gmail password
```

### Issue: Emails arriving in spam

**Solution:** Configure email provider records

```bash
# For Gmail: Enable "Less secure apps" OR use app-specific password
# For AWS SES: Verify domain/email in SES console
# For any SMTP: Add SPF, DKIM, DMARC records
```

### Issue: Timeout errors

**Solution:** Check firewall allows outbound SMTP

```bash
# Verify port 587 (TLS) or 465 (SSL) is open
# Some networks block outgoing mail
```

### Issue: "User already exists"

**Solution:** Email must be unique per user

```bash
# Use different email for each user
# Or check if user was already created
```

---

## Testing Checklist

- [ ] SMTP credentials configured in `.env`
- [ ] Test email received successfully
- [ ] Welcome email has correct branding
- [ ] Temporary password visible in email
- [ ] Login link works
- [ ] Password reset email working
- [ ] Role assignment email working
- [ ] No emails in spam folder
- [ ] Email timestamps correct

---

## Performance Notes

✅ **Non-blocking:** Email sending happens in background - doesn't delay API responses  
✅ **Rate limiting:** Bulk emails have 500ms delay between sends by default  
✅ **Error handling:** Email failures won't block user creation  
✅ **Logging:** All emails logged for audit trail

---

## Next Steps

1. ✅ Configure SMTP in `.env` (see Setup section)
2. ✅ Test email service: `npm start && check logs`
3. ✅ Create test user to receive welcome email
4. ✅ Customize email templates (add your logo, colors, company name)
5. ✅ Deploy to production with SMTP credentials

---

## File Structure

```
src/common/
├── services/
│   ├── email-notification.service.ts  ← Main service (NEW!)
│   └── email.service.ts               ← Original service (still works)
├── templates/
│   ├── enhanced-welcome-email.template.ts  ← Welcome template (NEW!)
│   └── additional-email.templates.ts       ← Other templates (NEW!)
└── common.module.ts                   ← Updated to export new service
```

---

## Full Documentation

For complete details, see: `EMAIL_NOTIFICATION_SYSTEM.md`

---

**Status:** ✅ Production Ready  
**Last Updated:** December 5, 2025
