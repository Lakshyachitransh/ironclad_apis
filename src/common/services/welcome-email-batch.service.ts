import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailNotificationService } from './email-notification.service';

@Injectable()
export class WelcomeEmailBatchService {
  private readonly logger = new Logger(WelcomeEmailBatchService.name);

  constructor(
    private prisma: PrismaService,
    private emailNotification: EmailNotificationService
  ) {}

  /**
   * Batch job to send welcome emails to users who haven't received them yet
   * Runs every hour (configurable via environment variable WELCOME_EMAIL_BATCH_CRON)
   * Default: 0 * * * * (every hour at minute 0)
   */
  @Cron(process.env.WELCOME_EMAIL_BATCH_CRON || CronExpression.EVERY_HOUR, {
    name: 'welcome-email-batch',
  })
  async sendPendingWelcomeEmails() {
    this.logger.log('🚀 Starting welcome email batch job...');
    
    try {
      // Send welcome emails for TenantUsers
      const tenantUserCount = await this.sendTenantUserWelcomeEmails();
      
      // Send welcome emails for PlatformUsers
      const platformUserCount = await this.sendPlatformUserWelcomeEmails();
      
      // Send welcome emails for Users (old model for backward compatibility)
      const userCount = await this.sendRegularUserWelcomeEmails();
      
      const totalSent = tenantUserCount + platformUserCount + userCount;
      
      if (totalSent > 0) {
        this.logger.log(
          `✅ Welcome email batch completed. Sent ${totalSent} emails ` +
          `(TenantUsers: ${tenantUserCount}, PlatformUsers: ${platformUserCount}, Users: ${userCount})`
        );
      } else {
        this.logger.debug('ℹ️  No pending welcome emails to send');
      }

      return {
        success: true,
        totalSent,
        breakdown: {
          tenantUsers: tenantUserCount,
          platformUsers: platformUserCount,
          users: userCount,
        },
      };
    } catch (error) {
      this.logger.error('❌ Welcome email batch job failed:', error);
      throw error;
    }
  }

  /**
   * Send welcome emails to TenantUsers who haven't received them
   */
  private async sendTenantUserWelcomeEmails(): Promise<number> {
    try {
      // Find TenantUsers without welcome email sent
      const pendingUsers = await this.prisma.tenantUser.findMany({
        where: {
          welcomeEmailSent: false,
          status: 'active', // Only send to active users
        },
        include: {
          tenant: {
            select: {
              name: true,
            },
          },
        },
        take: 100, // Process max 100 users per batch to avoid overload
      });

      if (pendingUsers.length === 0) {
        return 0;
      }

      this.logger.debug(`Found ${pendingUsers.length} TenantUsers without welcome email`);

      let successCount = 0;

      for (const user of pendingUsers) {
        try {
          // Note: We don't have the password anymore, so we'll note that in the email
          await this.emailNotification.sendWelcomeEmail(
            user.email,
            user.displayName || user.email.split('@')[0],
            '[Password set during account creation]', // Placeholder
            user.tenant.name
          );

          // Mark as sent
          await this.prisma.tenantUser.update({
            where: { id: user.id },
            data: {
              welcomeEmailSent: true,
              welcomeEmailSentAt: new Date(),
            },
          });

          successCount++;
          this.logger.debug(`✓ Welcome email sent to TenantUser: ${user.email}`);
        } catch (error) {
          this.logger.error(`✗ Failed to send welcome email to TenantUser ${user.email}:`, error);
          // Continue with next user
        }
      }

      return successCount;
    } catch (error) {
      this.logger.error('Error processing TenantUsers:', error);
      return 0;
    }
  }

  /**
   * Send welcome emails to PlatformUsers who haven't received them
   */
  private async sendPlatformUserWelcomeEmails(): Promise<number> {
    try {
      // Find PlatformUsers without welcome email sent
      const pendingUsers = await this.prisma.platformUser.findMany({
        where: {
          welcomeEmailSent: false,
          status: 'active', // Only send to active users
        },
        take: 100, // Process max 100 users per batch
      });

      if (pendingUsers.length === 0) {
        return 0;
      }

      this.logger.debug(`Found ${pendingUsers.length} PlatformUsers without welcome email`);

      let successCount = 0;

      for (const user of pendingUsers) {
        try {
          await this.emailNotification.sendWelcomeEmail(
            user.email,
            user.displayName || user.email.split('@')[0],
            '[Password set during account creation]', // Placeholder
            'Ironclad Platform'
          );

          // Mark as sent
          await this.prisma.platformUser.update({
            where: { id: user.id },
            data: {
              welcomeEmailSent: true,
              welcomeEmailSentAt: new Date(),
            },
          });

          successCount++;
          this.logger.debug(`✓ Welcome email sent to PlatformUser: ${user.email}`);
        } catch (error) {
          this.logger.error(`✗ Failed to send welcome email to PlatformUser ${user.email}:`, error);
          // Continue with next user
        }
      }

      return successCount;
    } catch (error) {
      this.logger.error('Error processing PlatformUsers:', error);
      return 0;
    }
  }

  /**
   * Send welcome emails to Users (backward compatibility) who haven't received them
   */
  private async sendRegularUserWelcomeEmails(): Promise<number> {
    try {
      // Find Users without welcome email sent
      const pendingUsers = await this.prisma.user.findMany({
        where: {
          welcomeEmailSent: false,
          status: 'active', // Only send to active users
        },
        take: 100, // Process max 100 users per batch
      });

      if (pendingUsers.length === 0) {
        return 0;
      }

      this.logger.debug(`Found ${pendingUsers.length} Users without welcome email`);

      let successCount = 0;

      for (const user of pendingUsers) {
        try {
          await this.emailNotification.sendWelcomeEmail(
            user.email,
            user.displayName || user.email.split('@')[0],
            '[Password set during account creation]', // Placeholder
            'Ironclad'
          );

          // Mark as sent
          await this.prisma.user.update({
            where: { id: user.id },
            data: {
              welcomeEmailSent: true,
              welcomeEmailSentAt: new Date(),
            },
          });

          successCount++;
          this.logger.debug(`✓ Welcome email sent to User: ${user.email}`);
        } catch (error) {
          this.logger.error(`✗ Failed to send welcome email to User ${user.email}:`, error);
          // Continue with next user
        }
      }

      return successCount;
    } catch (error) {
      this.logger.error('Error processing Users:', error);
      return 0;
    }
  }

  /**
   * Manual trigger to send welcome emails for a specific user
   * Useful for resending welcome email on demand
   */
  async sendWelcomeEmailForUser(userId: string, userType: 'tenant' | 'platform' | 'regular') {
    try {
      if (userType === 'tenant') {
        const user = await this.prisma.tenantUser.findUnique({
          where: { id: userId },
          include: {
            tenant: { select: { name: true } },
          },
        });

        if (!user) {
          throw new Error('TenantUser not found');
        }

        await this.emailNotification.sendWelcomeEmail(
          user.email,
          user.displayName || user.email.split('@')[0],
          '[Password set during account creation]',
          user.tenant.name
        );

        await this.prisma.tenantUser.update({
          where: { id: userId },
          data: {
            welcomeEmailSent: true,
            welcomeEmailSentAt: new Date(),
          },
        });

        return { success: true, message: `Welcome email sent to ${user.email}` };
      } else if (userType === 'platform') {
        const user = await this.prisma.platformUser.findUnique({
          where: { id: userId },
        });

        if (!user) {
          throw new Error('PlatformUser not found');
        }

        await this.emailNotification.sendWelcomeEmail(
          user.email,
          user.displayName || user.email.split('@')[0],
          '[Password set during account creation]',
          'Ironclad Platform'
        );

        await this.prisma.platformUser.update({
          where: { id: userId },
          data: {
            welcomeEmailSent: true,
            welcomeEmailSentAt: new Date(),
          },
        });

        return { success: true, message: `Welcome email sent to ${user.email}` };
      } else {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          throw new Error('User not found');
        }

        await this.emailNotification.sendWelcomeEmail(
          user.email,
          user.displayName || user.email.split('@')[0],
          '[Password set during account creation]',
          'Ironclad'
        );

        await this.prisma.user.update({
          where: { id: userId },
          data: {
            welcomeEmailSent: true,
            welcomeEmailSentAt: new Date(),
          },
        });

        return { success: true, message: `Welcome email sent to ${user.email}` };
      }
    } catch (error) {
      this.logger.error(`Failed to send welcome email to user ${userId}:`, error);
      throw error;
    }
  }
}
