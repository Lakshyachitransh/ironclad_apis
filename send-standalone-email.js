#!/usr/bin/env node

/**
 * Standalone Email Sender
 * Sends a test email without starting the full NestJS server
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

// SMTP Configuration
const smtpHost = process.env.SMTP_HOST || 'smtp.hostinger.com';
const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;
const emailFrom = process.env.EMAIL_FROM || 'no-reply@compliance-verify.com';

// Email Configuration
const targetEmail = 'srivastavalakshya1103@gmail.com';

console.log('\n' + '='.repeat(60));
console.log('📧 STANDALONE EMAIL SENDER');
console.log('='.repeat(60));
console.log('\nConfiguration:');
console.log(`  SMTP Host: ${smtpHost}:${smtpPort}`);
console.log(`  From: ${emailFrom}`);
console.log(`  To: ${targetEmail}`);
console.log('\n' + '-'.repeat(60) + '\n');

// Create transporter
const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: smtpUser,
    pass: smtpPassword
  },
  logger: true,
  debug: true,
});

// Email HTML template
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
    .header h1 { font-size: 28px; margin-bottom: 10px; }
    .header p { font-size: 14px; opacity: 0.9; }
    .content { padding: 40px 20px; }
    .section { margin-bottom: 30px; }
    .section h2 { color: #333; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
    .section p { color: #555; line-height: 1.6; margin-bottom: 10px; }
    .badge { display: inline-block; background: #4CAF50; color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; margin: 5px 0; }
    .info-box { background: #f9f9f9; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0; border-radius: 4px; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #777; font-size: 12px; border-top: 1px solid #ddd; }
    .timestamp { color: #999; font-size: 12px; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Test Email Successful</h1>
      <p>Sent from Ironclad APIs - Standalone Email Service</p>
    </div>
    
    <div class="content">
      <div class="section">
        <h2>🎉 Email Configuration Test</h2>
        <p>Congratulations! If you received this email, your SMTP configuration is working correctly.</p>
        <p class="badge">✓ Email Service Verified</p>
      </div>

      <div class="section">
        <h2>📋 Test Details</h2>
        <div class="info-box">
          <p><strong>Service:</strong> Ironclad APIs Standalone Sender</p>
          <p><strong>Provider:</strong> Hostinger SMTP</p>
          <p><strong>Status:</strong> <span class="badge">Success</span></p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        </div>
      </div>

      <div class="section">
        <h2>🔧 SMTP Configuration</h2>
        <div class="info-box">
          <p><strong>Host:</strong> ${smtpHost}</p>
          <p><strong>Port:</strong> ${smtpPort}</p>
          <p><strong>Security:</strong> TLS</p>
          <p><strong>From:</strong> ${emailFrom}</p>
        </div>
      </div>

      <div class="section">
        <h2>✨ What's Next?</h2>
        <p>Your email system is ready to:</p>
        <ul style="margin-left: 20px; color: #555; line-height: 1.8;">
          <li>Send welcome emails to new users</li>
          <li>Send password reset notifications</li>
          <li>Send role assignment confirmations</li>
          <li>Send course assignment emails</li>
          <li>Send bulk email campaigns</li>
        </ul>
      </div>

      <div class="section">
        <h2>📧 Quick API Reference</h2>
        <div class="info-box">
          <p><strong>Test Email Endpoint:</strong></p>
          <p style="font-family: monospace; background: #f0f0f0; padding: 8px; border-radius: 4px; margin: 5px 0;">
            POST /api/users/send-test-email
          </p>
          <p style="margin-top: 10px;"><strong>Required Permission:</strong> admin.manage</p>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>Ironclad APIs © 2025 | Email Service Test</p>
      <p class="timestamp">Generated: ${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>
`;

async function sendEmail() {
  try {
    console.log('🔌 Connecting to SMTP server...');
    
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully\n');

    console.log('📤 Sending email...\n');
    
    // Send email
    const info = await transporter.sendMail({
      from: emailFrom,
      to: targetEmail,
      subject: '✅ Test Email - Ironclad APIs SMTP Configuration',
      html: htmlContent,
      replyTo: 'support@compliance-verify.com',
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ EMAIL SENT SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log('\nResponse Details:');
    console.log(`  Message ID: ${info.messageId}`);
    console.log(`  Response: ${info.response}`);
    console.log(`  Accepted: ${info.accepted.join(', ')}`);
    console.log(`  Rejected: ${info.rejected.length > 0 ? info.rejected.join(', ') : 'None'}`);
    console.log(`\nTimestamp: ${new Date().toISOString()}`);
    console.log('\n' + '='.repeat(60));
    console.log('\n📧 Email successfully sent to: ' + targetEmail);
    console.log('Check your inbox in the next few minutes.\n');

    process.exit(0);
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ EMAIL SENDING FAILED');
    console.error('='.repeat(60));
    console.error('\nError Details:');
    console.error(`  Code: ${error.code}`);
    console.error(`  Message: ${error.message}`);
    console.error(`  Response: ${error.response}`);
    console.error('\n' + '='.repeat(60));
    console.error('\n⚠️  Troubleshooting:');
    console.error('  1. Verify SMTP credentials in .env file');
    console.error('  2. Check Hostinger account is active');
    console.error('  3. Ensure port 587 is not blocked');
    console.error('  4. Verify email address format\n');
    
    process.exit(1);
  }
}

// Run the email sender
sendEmail();
