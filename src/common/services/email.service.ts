import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as AWS from 'aws-sdk';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger('EmailService');

  constructor() {
    // Configure AWS SES
    const ses = new AWS.SES({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });

    // Create nodemailer transporter using AWS SES
    this.transporter = nodemailer.createTransport({
      SES: { ses, aws: AWS }
    } as any);
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
