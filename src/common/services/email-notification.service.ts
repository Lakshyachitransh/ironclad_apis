import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { enhancedWelcomeEmailTemplate } from '../templates/enhanced-welcome-email.template';
import { passwordResetEmailTemplate, accountVerifiedEmailTemplate } from '../templates/additional-email.templates';

interface EmailConfig {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}

/**
 * World-Class Email Notification Service
 * Handles all email communications with premium templates and tracking
 */
@Injectable()
export class EmailNotificationService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger('EmailNotificationService');
  private readonly emailFrom = process.env.EMAIL_FROM || 'noreply@ironclad.local';
  private readonly appLoginUrl = process.env.APP_LOGIN_URL || 'https://app.ironclad.local/login';
  private readonly supportEmail = process.env.SUPPORT_EMAIL || 'support@ironclad.local';

  constructor() {
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;

    this.logger.log(`📧 Initializing Email Service - SMTP: ${smtpHost}:${smtpPort}`);

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPassword
      },
      logger: false,
      debug: false,
    });

    this.verifyConnection().catch(err => {
      this.logger.warn(`⚠️ Email service verification failed: ${err.message}`);
    });
  }

  /**
   * Verify SMTP connection on initialization
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('✅ Email service connected successfully');
      return true;
    } catch (error) {
      this.logger.error('❌ Email service connection failed:', error);
      return false;
    }
  }

  /**
   * Send welcome email to newly created user
   * This is the primary email for user onboarding
   */
  async sendWelcomeEmail(
    userEmail: string,
    userName: string,
    tempPassword: string,
    tenantName: string,
    features?: string[]
  ): Promise<boolean> {
    try {
      const htmlContent = enhancedWelcomeEmailTemplate(
        userName,
        userEmail,
        tempPassword,
        tenantName,
        this.appLoginUrl,
        this.supportEmail,
        features
      );

      await this.sendEmail({
        to: userEmail,
        subject: `🎉 Welcome to ${tenantName}! Your Account is Ready`,
        html: htmlContent
      });

      this.logger.log(`✅ Welcome email sent to ${userEmail}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to send welcome email to ${userEmail}:`, error);
      return false;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    userEmail: string,
    userName: string,
    resetLink: string,
    expirationHours?: number
  ): Promise<boolean> {
    try {
      const htmlContent = passwordResetEmailTemplate(
        userName,
        resetLink,
        expirationHours || 24,
        this.supportEmail
      );

      await this.sendEmail({
        to: userEmail,
        subject: '🔐 Reset Your Password',
        html: htmlContent
      });

      this.logger.log(`✅ Password reset email sent to ${userEmail}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to send password reset email to ${userEmail}:`, error);
      return false;
    }
  }

  /**
   * Send account verification email
   */
  async sendAccountVerifiedEmail(
    userEmail: string,
    userName: string,
    tenantName: string
  ): Promise<boolean> {
    try {
      const htmlContent = accountVerifiedEmailTemplate(
        userName,
        tenantName,
        this.appLoginUrl
      );

      await this.sendEmail({
        to: userEmail,
        subject: `✅ Account Verified - Welcome to ${tenantName}`,
        html: htmlContent
      });

      this.logger.log(`✅ Account verification email sent to ${userEmail}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to send account verification email to ${userEmail}:`, error);
      return false;
    }
  }

  /**
   * Send role assignment notification
   */
  async sendRoleAssignmentEmail(
    userEmail: string,
    userName: string,
    roleName: string,
    tenantName: string,
    rolePermissions?: string[]
  ): Promise<boolean> {
    try {
      const permissionsText = rolePermissions?.length
        ? `<p><strong>Your new permissions include:</strong></p><ul>${rolePermissions.map(p => `<li>${p}</li>`).join('')}</ul>`
        : '';

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #2d3748; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; color: white; text-align: center; }
        .content { padding: 40px 30px; }
        .role-badge { background: #667eea; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 20px 0; font-weight: 600; }
        .permissions-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { background: #2d3748; color: white; padding: 20px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Role Assignment</h1>
        </div>
        <div class="content">
            <p>Hi ${userName},</p>
            <p>You have been assigned a new role in ${tenantName}:</p>
            <div class="role-badge">${roleName}</div>
            <div class="permissions-box">
                ${permissionsText}
            </div>
            <p>This role change is now active. You can access your dashboard to see your updated permissions.</p>
        </div>
        <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
        </div>
    </div>
</body>
</html>
      `;

      await this.sendEmail({
        to: userEmail,
        subject: `🎯 Your Role Has Been Updated - ${roleName}`,
        html: htmlContent
      });

      this.logger.log(`✅ Role assignment email sent to ${userEmail} for role: ${roleName}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to send role assignment email to ${userEmail}:`, error);
      return false;
    }
  }

  /**
   * Send course assignment email
   */
  async sendCourseAssignmentEmail(
    userEmail: string,
    userName: string,
    courseTitle: string,
    dueDate?: Date,
    courseLink?: string
  ): Promise<boolean> {
    try {
      const dueDateText = dueDate 
        ? `<strong>Due Date:</strong> ${dueDate.toLocaleDateString()} ${dueDate.toLocaleTimeString()}`
        : 'No specific due date';

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #2d3748; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; color: white; text-align: center; }
        .content { padding: 40px 30px; }
        .course-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .course-box h3 { color: #059669; margin-bottom: 10px; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; }
        .footer { background: #2d3748; color: white; padding: 20px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎓 Course Assignment</h1>
        </div>
        <div class="content">
            <p>Hi ${userName},</p>
            <p>You have been assigned to a new course:</p>
            <div class="course-box">
                <h3>${courseTitle}</h3>
                <p>${dueDateText}</p>
            </div>
            ${courseLink ? `<p style="text-align: center;"><a href="${courseLink}" class="cta-button">View Course</a></p>` : ''}
            <p>Please review the course materials and complete all lessons on time.</p>
        </div>
        <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
        </div>
    </div>
</body>
</html>
      `;

      await this.sendEmail({
        to: userEmail,
        subject: `🎓 New Course Assignment: ${courseTitle}`,
        html: htmlContent
      });

      this.logger.log(`✅ Course assignment email sent to ${userEmail}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to send course assignment email to ${userEmail}:`, error);
      return false;
    }
  }

  /**
   * Send bulk emails with rate limiting
   */
  async sendBulkEmails(
    emails: Array<{
      to: string;
      subject: string;
      html: string;
    }>,
    delayMs: number = 500
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const email of emails) {
      try {
        await this.sendEmail(email);
        success++;
      } catch (error) {
        this.logger.error(`Failed to send bulk email to ${email.to}:`, error);
        failed++;
      }
      
      // Add delay between sends to avoid rate limiting
      if (emails.indexOf(email) < emails.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    this.logger.log(`📬 Bulk email sent: ${success} success, ${failed} failed`);
    return { success, failed };
  }

  /**
   * Core email sending method
   */
  private async sendEmail(config: EmailConfig): Promise<void> {
    try {
      const mailOptions = {
        from: this.emailFrom,
        to: config.to,
        subject: config.subject,
        html: config.html,
        replyTo: this.supportEmail,
        ...config.attachments && { attachments: config.attachments }
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      this.logger.log(
        `✅ Email sent successfully - To: ${config.to}, MessageId: ${info.messageId}, Status: ${info.response}`
      );
    } catch (error) {
      this.logger.error(`Failed to send email to ${config.to}:`, error);
      throw error;
    }
  }

  /**
   * Test email configuration
   */
  async testEmail(testEmail: string): Promise<boolean> {
    try {
      const htmlContent = `
<!DOCTYPE html>
<html>
<head><style>
  body { font-family: Arial, sans-serif; padding: 20px; background: #f0f0f0; }
  .box { background: white; padding: 20px; border-radius: 8px; max-width: 500px; margin: 0 auto; }
  h1 { color: #667eea; }
</style></head>
<body>
  <div class="box">
    <h1>✅ Email Configuration Test</h1>
    <p>If you received this email, your email service is properly configured!</p>
    <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
  </div>
</body>
</html>
      `;

      await this.sendEmail({
        to: testEmail,
        subject: '✅ Email Service Test',
        html: htmlContent
      });

      return true;
    } catch (error) {
      this.logger.error('Email test failed:', error);
      return false;
    }
  }
}
