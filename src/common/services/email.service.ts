import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger('EmailService');

  constructor() {
    // Configure SMTP transporter for AWS SES
    // SES SMTP endpoint format: email-smtp.{region}.amazonaws.com
    const sesSmtpEndpoint = `email-smtp.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`;
    
    // Try to get SES SMTP credentials from environment
    const sesSmtpUsername = process.env.AWS_SES_SMTP_USERNAME || process.env.AWS_ACCESS_KEY_ID;
    const sesSmtpPassword = process.env.AWS_SES_SMTP_PASSWORD || process.env.AWS_SECRET_ACCESS_KEY;

    this.logger.log(`Initializing email service with SES endpoint: ${sesSmtpEndpoint}`);
    this.logger.debug(`Using username: ${sesSmtpUsername ? sesSmtpUsername.substring(0, 10) + '***' : 'NOT SET'}`);
    
    this.transporter = nodemailer.createTransport({
      host: sesSmtpEndpoint,
      port: 587, // TLS port for SES
      secure: false, // Use STARTTLS, not SSL
      auth: {
        user: sesSmtpUsername,
        pass: sesSmtpPassword
      },
      logger: false,
      debug: false,
    });

    // Verify connection asynchronously
    this.verifyConnection().catch(err => {
      this.logger.warn(`Email transporter verification failed: ${err.message}`);
    });
  }

  /**
   * Verify SES connection
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('✅ Email transporter verified successfully');
      return true;
    } catch (error) {
      this.logger.warn(`❌ Email transporter verification failed: ${error.message}`);
      this.logger.warn('Possible causes:');
      this.logger.warn('1. AWS_SES_SMTP_PASSWORD is not set correctly (should be different from AWS_SECRET_ACCESS_KEY)');
      this.logger.warn('2. AWS credentials do not have SES permissions');
      this.logger.warn('3. Email not verified in SES (check sender email in SES verified emails)');
      this.logger.warn('4. SES sending limit reached or account in sandbox mode');
      return false;
    }
  }

  /**
   * Send course assignment email to user
   * @param userEmail - Recipient email address
   * @param userName - User's full name
   * @param courseTitle - Title of assigned course
   * @param dueDate - Optional due date for completion
   * @param courseLink - Optional link to course (e.g., https://yourapp.com/courses/course-id)
   */
  async sendCourseAssignmentEmail(
    userEmail: string,
    userName: string,
    courseTitle: string,
    dueDate?: Date,
    courseLink?: string
  ): Promise<void> {
    try {
      const dueDateText = dueDate 
        ? `<p><strong>Due Date:</strong> ${dueDate.toLocaleDateString()} ${dueDate.toLocaleTimeString()}</p>`
        : '';

      const courseButton = courseLink
        ? `<a href="${courseLink}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">View Course</a>`
        : '';

      const htmlContent = `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
              
              <h2 style="color: #2c3e50;">🎓 New Course Assignment</h2>
              
              <p>Hi <strong>${userName}</strong>,</p>
              
              <p>You have been assigned a new course:</p>
              
              <div style="background-color: #fff; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #4CAF50;">${courseTitle}</h3>
                ${dueDateText}
              </div>

              <p>Please review the course materials and complete all lessons by the due date.</p>

              ${courseButton ? `<p style="text-align: center; margin: 30px 0;">${courseButton}</p>` : ''}

              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
              
              <p style="font-size: 12px; color: #666;">
                If you have any questions about this course, please contact your training manager or administrator.
              </p>
              
              <p style="font-size: 12px; color: #666;">
                <strong>Note:</strong> This is an automated email. Please do not reply to this message.
              </p>
            </div>
          </body>
        </html>
      `;

      const textContent = `
New Course Assignment

Hi ${userName},

You have been assigned a new course: ${courseTitle}
${dueDateText ? `Due Date: ${dueDate.toLocaleDateString()} ${dueDate.toLocaleTimeString()}` : ''}

Please review the course materials and complete all lessons by the due date.
${courseLink ? `View Course: ${courseLink}` : ''}

If you have any questions about this course, please contact your training manager or administrator.

This is an automated email. Please do not reply to this message.
      `;

      await this.transporter.sendMail({
        from: process.env.SES_FROM_EMAIL || 'noreply@yourdomain.com',
        to: userEmail,
        subject: `Course Assignment: ${courseTitle}`,
        text: textContent,
        html: htmlContent
      });

      this.logger.log(`Course assignment email sent to ${userEmail} for course: ${courseTitle}`);
    } catch (error) {
      this.logger.error(`Failed to send course assignment email to ${userEmail}:`, error);
      // Don't throw - email failure shouldn't block course assignment
    }
  }

  /**
   * Send bulk course assignment emails
   * @param assignments - Array of user email and course details
   */
  async sendBulkCourseAssignmentEmails(
    assignments: Array<{
      userEmail: string;
      userName: string;
      courseTitle: string;
      dueDate?: Date;
      courseLink?: string;
    }>
  ): Promise<void> {
    try {
      const promises = assignments.map(assignment =>
        this.sendCourseAssignmentEmail(
          assignment.userEmail,
          assignment.userName,
          assignment.courseTitle,
          assignment.dueDate,
          assignment.courseLink
        )
      );

      await Promise.allSettled(promises);
      this.logger.log(`Bulk course assignment emails sent to ${assignments.length} users`);
    } catch (error) {
      this.logger.error('Failed to send bulk course assignment emails:', error);
    }
  }

  /**
   * Send course completion notification
   */
  async sendCourseCompletionEmail(
    userEmail: string,
    userName: string,
    courseTitle: string,
    completionDate?: Date
  ): Promise<void> {
    try {
      const completionText = completionDate
        ? `<p><strong>Completed on:</strong> ${completionDate.toLocaleDateString()}</p>`
        : '';

      const htmlContent = `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
              
              <h2 style="color: #2c3e50;">🎉 Course Completed!</h2>
              
              <p>Hi <strong>${userName}</strong>,</p>
              
              <p>Congratulations! You have successfully completed the course:</p>
              
              <div style="background-color: #fff; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #4CAF50;">${courseTitle}</h3>
                ${completionText}
              </div>

              <p>Great job! Your progress has been recorded in the system.</p>

              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
              
              <p style="font-size: 12px; color: #666;">
                <strong>Note:</strong> This is an automated email. Please do not reply to this message.
              </p>
            </div>
          </body>
        </html>
      `;

      await this.transporter.sendMail({
        from: process.env.SES_FROM_EMAIL || 'noreply@yourdomain.com',
        to: userEmail,
        subject: `Course Completed: ${courseTitle}`,
        html: htmlContent
      });

      this.logger.log(`Course completion email sent to ${userEmail} for course: ${courseTitle}`);
    } catch (error) {
      this.logger.error(`Failed to send course completion email to ${userEmail}:`, error);
    }
  }

  /**
   * Send welcome email to new user with modern design
   * @param userEmail - New user's email
   * @param userName - User's display name
   * @param tempPassword - Temporary password for first login
   * @param tenantName - Organization/tenant name
   * @param loginUrl - URL to login page
   */
  async sendWelcomeEmail(
    userEmail: string,
    userName: string,
    tempPassword: string,
    tenantName: string,
    loginUrl: string = 'https://app.ironclad.local/login'
  ): Promise<void> {
    try {
      // Import template dynamically to avoid circular dependencies
      const { welcomeEmailTemplate } = await import('../templates/welcome-email.template');
      
      const htmlContent = welcomeEmailTemplate(
        userName,
        userEmail,
        tempPassword,
        tenantName,
        loginUrl
      );

      await this.transporter.sendMail({
        from: process.env.SES_FROM_EMAIL || 'noreply@ironclad.local',
        to: userEmail,
        subject: `🎉 Welcome to ${tenantName}! Your Account is Ready`,
        html: htmlContent,
        replyTo: process.env.SES_FROM_EMAIL || 'noreply@ironclad.local'
      });

      this.logger.log(`Welcome email sent successfully to ${userEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${userEmail}:`, error);
      // Don't throw - email failure shouldn't block user creation
    }
  }

  /**
   * Test SES configuration
   */
  async testConnection(testEmail: string): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: process.env.SES_FROM_EMAIL || 'noreply@yourdomain.com',
        to: testEmail,
        subject: 'Email Service Test',
        text: 'If you received this email, your email service is working correctly!'
      });
      this.logger.log('Email service test successful');
      return true;
    } catch (error) {
      this.logger.error('Email service test failed:', error);
      return false;
    }
  }
}
