# 🚀 World-Class Email Notification System

## Overview

The Ironclad APIs now includes a **premium, production-ready email notification system** that automatically sends professional emails when users are created, roles are assigned, courses are added, and more.

### Key Features

✅ **Automatic User Welcome Emails** - Beautiful HTML template with login credentials  
✅ **Role Assignment Notifications** - Inform users of new permissions  
✅ **Course Assignment Emails** - Notify users of course assignments with due dates  
✅ **Password Reset Emails** - Secure password reset flow  
✅ **Account Verification Emails** - Confirm account activation  
✅ **Bulk Email Support** - Send emails to multiple users with rate limiting  
✅ **HTML & Text Versions** - Professional templates with fallback text  
✅ **SMTP Configuration** - Works with Gmail, AWS SES, and any SMTP provider  
✅ **Error Handling** - Graceful failures (email issues won't block user creation)  
✅ **Logging & Monitoring** - Full audit trail of sent emails

---

## Email Flows & Triggers

### 1. User Creation Welcome Email ✨

**Trigger:** When a new user is created  
**Recipient:** The newly created user  
**Content:**

- Personalized greeting
- Login credentials (email & temporary password)
- Secure login link
- Features overview
- Getting started guide
- Support contact information
- Security reminder

**Code Flow:**

```typescript
// In users.controller.ts or users.service.ts
await this.users.createUserAndAttachToTenantByName({
  email: 'newuser@company.com',
  password: 'SecurePassword123!',
  displayName: 'John Doe',
  tenantName: 'My Company',
  roles: ['learner'],
  // ✅ Welcome email automatically sent asynchronously
});
```

### 2. Role Assignment Notification 🎯

**Trigger:** When a role is assigned to a user  
**Recipient:** The user receiving the role  
**Content:**

- Role name and details
- List of new permissions
- Activation notification
- Dashboard link

**API Example:**

```bash
# Call the role assignment endpoint
# Email is automatically sent to the user
POST /api/roles/assign-role \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "userId": "user-id",
    "roleCode": "course_author",
    "tenantId": "tenant-id"
  }'
```

### 3. Course Assignment Email 🎓

**Trigger:** When a course is assigned to a user  
**Recipient:** The user assigned to the course  
**Content:**

- Course title
- Due date (if applicable)
- Link to course
- Completion expectations

**API Example:**

```bash
POST /api/courses/assign \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "courseId": "course-id",
    "userId": "user-id",
    "dueDate": "2025-12-31"
  }'
  # ✅ Email automatically sent
```

### 4. Password Reset Email 🔐

**Trigger:** When user requests password reset  
**Recipient:** The user  
**Content:**

- Reset link (expires in 24 hours)
- Security notice
- Instructions
- Support information

**API Example:**

```bash
POST /api/auth/forgot-password \
  -d '{"email": "user@company.com"}'
  # ✅ Email with reset link sent
```

### 5. Account Verification Email ✅

**Trigger:** When account is verified/activated  
**Recipient:** The user  
**Content:**

- Verification confirmation
- Dashboard link
- Features overview

---

## Email Templates

All templates are **premium, responsive, and mobile-optimized** with:

### Enhanced Welcome Email Template

- **File:** `src/common/templates/enhanced-welcome-email.template.ts`
- **Features:**
  - Gradient header with wave pattern
  - Organized credential section with monospace fonts
  - Security reminder alert box
  - Feature grid (6 features displayed)
  - Getting started instructions
  - Support section
  - Professional footer

### Additional Email Templates

- **File:** `src/common/templates/additional-email.templates.ts`
- **Includes:**
  - Password Reset Email
  - Account Verified Email
  - Role Assignment Email
  - Course Assignment Email

All templates use:

- Professional color gradients (purple/blue/green)
- Clear typography hierarchy
- Mobile-responsive design
- CSS inlined for email client compatibility
- High contrast for accessibility
- Clear call-to-action buttons

---

## Email Notification Service

### Service: `EmailNotificationService`

**Location:** `src/common/services/email-notification.service.ts`

### Available Methods

#### 1. Send Welcome Email

```typescript
async sendWelcomeEmail(
  userEmail: string,
  userName: string,
  tempPassword: string,
  tenantName: string,
  features?: string[]
): Promise<boolean>
```

#### 2. Send Password Reset Email

```typescript
async sendPasswordResetEmail(
  userEmail: string,
  userName: string,
  resetLink: string,
  expirationHours?: number
): Promise<boolean>
```

#### 3. Send Account Verified Email

```typescript
async sendAccountVerifiedEmail(
  userEmail: string,
  userName: string,
  tenantName: string
): Promise<boolean>
```

#### 4. Send Role Assignment Email

```typescript
async sendRoleAssignmentEmail(
  userEmail: string,
  userName: string,
  roleName: string,
  tenantName: string,
  rolePermissions?: string[]
): Promise<boolean>
```

#### 5. Send Course Assignment Email

```typescript
async sendCourseAssignmentEmail(
  userEmail: string,
  userName: string,
  courseTitle: string,
  dueDate?: Date,
  courseLink?: string
): Promise<boolean>
```

#### 6. Send Bulk Emails

```typescript
async sendBulkEmails(
  emails: Array<{
    to: string;
    subject: string;
    html: string;
  }>,
  delayMs?: number = 500
): Promise<{ success: number; failed: number }>
```

#### 7. Test Email Configuration

```typescript
async testEmail(testEmail: string): Promise<boolean>
```

---

## SMTP Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@ironclad.local
SUPPORT_EMAIL=support@ironclad.local

# Application URLs
APP_LOGIN_URL=https://app.yourdomain.com/login
```

### SMTP Providers

#### Gmail

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=<app-specific-password>  # Generate from Google Account settings
EMAIL_FROM=your-email@gmail.com
```

#### AWS SES

```bash
SMTP_HOST=email-smtp.<region>.amazonaws.com
SMTP_PORT=587
SMTP_USER=<SMTP username from AWS SES>
SMTP_PASSWORD=<SMTP password from AWS SES>
EMAIL_FROM=noreply@yourdomain.com  # Must be verified in SES
```

#### Office 365

```bash
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@yourdomain.com
SMTP_PASSWORD=your-office-365-password
EMAIL_FROM=your-email@yourdomain.com
```

#### Custom SMTP

```bash
SMTP_HOST=your-smtp-host.com
SMTP_PORT=587  # or 465 for SSL
SMTP_USER=your-username
SMTP_PASSWORD=your-password
EMAIL_FROM=noreply@yourdomain.com
```

---

## Usage Examples

### Example 1: Create User with Automatic Welcome Email

```typescript
// In your controller or service
import { EmailNotificationService } from './common/services/email-notification.service';

@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private emailNotification: EmailNotificationService,
  ) {}

  @Post()
  async createUser(@Body() dto: CreateUserDto) {
    // User is created and welcome email is sent automatically
    const user = await this.usersService.createUserAndAttachToTenantByName({
      email: dto.email,
      password: dto.password,
      displayName: dto.displayName,
      tenantName: dto.tenantName,
      roles: dto.roles,
    });

    return user;
  }
}
```

### Example 2: Send Custom Role Assignment Email

```typescript
// When assigning a role to a user
const permissions = [
  'courses.create',
  'courses.update',
  'courses.delete',
  'quizzes.create',
];

await this.emailNotification.sendRoleAssignmentEmail(
  user.email,
  user.displayName,
  'Course Author',
  tenant.name,
  permissions,
);
```

### Example 3: Send Bulk Emails to Multiple Users

```typescript
const emails = users.map((user) => ({
  to: user.email,
  subject: `Welcome to ${tenant.name}!`,
  html: generateWelcomeHtml(user.displayName),
}));

const result = await this.emailNotification.sendBulkEmails(emails, 1000);
console.log(`Sent: ${result.success}, Failed: ${result.failed}`);
```

### Example 4: Test Email Configuration

```typescript
// Before deploying, test your SMTP setup
const isConfigured = await this.emailNotification.testEmail(
  'admin@yourdomain.com',
);

if (isConfigured) {
  console.log('✅ Email service is ready!');
} else {
  console.error('❌ Email configuration failed');
}
```

---

## Error Handling & Logging

### Automatic Error Handling

The email system is **non-blocking** - email failures won't interrupt user creation or other operations:

```typescript
// Email sending happens asynchronously
try {
  await this.usersService.createUser(dto);
  // User created successfully even if email fails
} catch (error) {
  // Only thrown if user creation fails, not email
}
```

### Monitoring & Logging

All email events are logged with detailed information:

```
✅ Welcome email sent successfully to user@example.com, MessageId: <message-id>
✅ Email service connected successfully
📧 Initializing Email Service - SMTP: smtp.gmail.com:587
⚠️ Failed to send welcome email to user@example.com: <error details>
```

Check logs in real-time:

```bash
npm start 2>&1 | grep "EmailNotificationService"
```

---

## Best Practices

### 1. Always Use the EmailNotificationService

✅ DO:

```typescript
await this.emailNotification.sendWelcomeEmail(email, name, password, tenant);
```

❌ DON'T:

```typescript
// Don't use the old EmailService for new features
await this.emailService.sendWelcomeEmail(...); // Deprecated pattern
```

### 2. Make Email Sending Non-Blocking

✅ DO:

```typescript
// Email sends in background, doesn't wait
this.emailNotification.sendWelcomeEmail(...).catch(err => {
  console.error('Email failed:', err);
});
```

❌ DON'T:

```typescript
// Don't wait for email - will slow down API responses
await this.emailNotification.sendWelcomeEmail(...);
```

### 3. Test Before Deploying

```bash
# Test your SMTP configuration
curl -X POST http://localhost:3000/api/admin/test-email \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"testEmail": "your-email@example.com"}'
```

### 4. Customize Email Templates

Edit the template files to match your branding:

- Update colors, logos, company name
- Modify feature lists
- Adjust support contact information
- Add social media links

### 5. Monitor Email Deliverability

- Check spam/junk folders for test emails
- Verify DKIM/SPF/DMARC records if using custom domain
- Monitor bounce rates in SMTP provider
- Keep SMTP credentials secure (use environment variables)

---

## Testing & Verification

### Test Email Setup

```bash
# 1. Create a test user and verify email is sent
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "displayName": "Test User",
    "password": "TestPass123!",
    "tenantName": "Test Tenant",
    "roles": ["learner"]
  }'

# 2. Check logs for email confirmation
npm start 2>&1 | grep "✅ Welcome email sent"

# 3. Verify email received (check inbox in 1-2 minutes)
```

### Troubleshooting

| Issue                | Solution                                               |
| -------------------- | ------------------------------------------------------ |
| Emails not sent      | Check SMTP credentials in .env file                    |
| Slow API response    | Email already runs async, check network                |
| Email in spam folder | Verify DKIM/SPF records with email provider            |
| Connection timeout   | Verify firewall allows outbound SMTP (port 587 or 465) |
| Gmail auth failed    | Use app-specific password, not regular password        |
| AWS SES not working  | Verify email is verified in SES, check IAM permissions |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    User Creation Flow                    │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │ Users.Controller     │
                   │ POST /api/users      │
                   └──────────┬───────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │ Users.Service        │
                   │ createUser()         │
                   └──────────┬───────────┘
                              │
                  ┌───────────┴───────────┐
                  ▼                       ▼
         ┌──────────────────┐    ┌─────────────────────┐
         │ Create User      │    │ Send Email          │
         │ in Database      │    │ (Async)             │
         └──────────────────┘    └──────────┬──────────┘
                  │                         ▼
         Return User Object      EmailNotificationService
                                           │
                        ┌──────────────────┴──────────────┐
                        ▼                                 ▼
                   Select Template          SMTP Provider
              (enhanced-welcome-email)     (Gmail/AWS SES)
                        │                        │
                        └────────────┬───────────┘
                                    ▼
                            User Receives Email
                                   (✅ Inbox)
```

---

## File Structure

```
src/
├── common/
│   ├── services/
│   │   ├── email.service.ts                    (Original Email Service)
│   │   ├── email-notification.service.ts       (✨ NEW - World-Class Service)
│   │   └── s3.service.ts
│   ├── templates/
│   │   ├── welcome-email.template.ts
│   │   ├── enhanced-welcome-email.template.ts  (✨ NEW - Premium Template)
│   │   └── additional-email.templates.ts       (✨ NEW - Extra Templates)
│   ├── guards/
│   └── decorators/
├── users/
│   ├── users.controller.ts                     (Updated to use new service)
│   └── users.service.ts                        (Updated to use new service)
└── app.module.ts
```

---

## Deployment Checklist

- [ ] SMTP credentials configured in `.env`
- [ ] Email templates tested and branded
- [ ] Support email address configured
- [ ] APP_LOGIN_URL set correctly
- [ ] Test email sent successfully
- [ ] Email service logs verified
- [ ] DKIM/SPF records configured (if using custom domain)
- [ ] Reviewed email logs in staging environment
- [ ] Confirmed emails in spam folder mitigation
- [ ] All email templates reviewed for branding

---

## Support & Documentation

For more information:

- SMTP Provider Docs: See your provider's documentation
- Email Client Compatibility: Test with major clients (Gmail, Outlook, Apple Mail)
- Advanced Customization: See template files for HTML/CSS details

---

**Status:** ✅ Production Ready  
**Last Updated:** December 5, 2025  
**Version:** 1.0.0
