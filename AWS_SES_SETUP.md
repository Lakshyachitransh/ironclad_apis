# AWS SES SMTP Credentials Setup Guide

## ⚠️ Issue

You're getting "Invalid login: 535 Authentication Credentials Invalid"

## 🔧 Root Cause

AWS Access Key ID and AWS Secret Access Key are **NOT** SES SMTP credentials. SES requires separate SMTP credentials.

## ✅ Solution

### Option 1: Generate SES SMTP Credentials (Recommended)

1. Go to AWS Console
2. Search for **SES (Simple Email Service)**
3. In the SES Dashboard, go to **SMTP Settings** (or Account Dashboard)
4. Click **Create My SMTP Credentials**
5. You'll receive:
   - **SMTP Username**: (looks like AKIA...)
   - **SMTP Password**: (a long encrypted string - very different from AWS Secret Key)

### Option 2: Add to .env

After generating SMTP credentials, update your `.env`:

```env
# AWS SES SMTP Credentials (NOT the same as AWS_ACCESS_KEY_ID/SECRET)
AWS_SES_SMTP_USERNAME=your-smtp-username-from-SES
AWS_SES_SMTP_PASSWORD=your-smtp-password-from-SES

# AWS Region
AWS_REGION=eu-north-1

# SES From Email (must be verified in SES!)
SES_FROM_EMAIL=noreply@yourdomain.com

# App Login URL
APP_LOGIN_URL=https://app.example.com/login
```

### Important Points:

1. **SES SMTP Password is different from AWS Secret Key** ⚠️
   - AWS Secret Key: `cBGWHZRni3X34v1s50gWOCRUr7zO2FKFDzOZRcMj`
   - SES SMTP Password: Looks completely different when generated

2. **Verify your email in SES** ✅
   - Go to SES → Verified Identities/Sender Email Addresses
   - Your `SES_FROM_EMAIL` must be in the verified list
   - Check your email inbox for verification link

3. **IAM Permissions** 🔐
   - User must have `ses:SendEmail` and `ses:SendRawEmail` permissions

4. **SES Sending Limits** 📊
   - By default, SES starts in "Sandbox Mode" with 200 emails/day limit
   - Request production access to send unlimited emails

## 🧪 Test Connection

The email service will log:

- ✅ "Email transporter verified successfully" = Working
- ❌ "Email transporter verification failed" = Issue exists

## 🔗 AWS SES Documentation

https://docs.aws.amazon.com/ses/latest/dg/send-email-smtp.html

## 📝 Troubleshooting

| Error              | Cause                             | Solution                                       |
| ------------------ | --------------------------------- | ---------------------------------------------- |
| Invalid login: 535 | Wrong SMTP credentials            | Generate new SMTP credentials from SES console |
| Email not sent     | Sender email not verified         | Verify email in SES verified identities        |
| Rate limit         | Sending too fast or sandbox limit | Request production access in SES               |
| Permission denied  | IAM policy missing                | Add ses:SendEmail permission to IAM user       |
