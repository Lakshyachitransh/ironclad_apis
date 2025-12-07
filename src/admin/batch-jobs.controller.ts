import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WelcomeEmailBatchService } from '../common/services/welcome-email-batch.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';

@ApiTags('batch-jobs')
@Controller('batch-jobs')
export class BatchJobsController {
  constructor(private welcomeEmailBatch: WelcomeEmailBatchService) {}

  /**
   * Manually trigger the welcome email batch job
   * Requires: admin.manage permission
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('admin.manage')
  @Post('send-pending-welcome-emails')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Trigger welcome email batch job',
    description: `Manually trigger the batch job to send welcome emails to all users who haven't received them yet.
    
This endpoint allows admins to process pending welcome emails on-demand without waiting for the scheduled cron job.
Processes up to 100 users per user type (TenantUsers, PlatformUsers, regular Users) to prevent overload.

Requires: admin.manage permission`
  })
  @ApiResponse({
    status: 200,
    description: 'Batch job executed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        totalSent: { type: 'number', example: 15 },
        breakdown: {
          type: 'object',
          properties: {
            tenantUsers: { type: 'number', example: 10 },
            platformUsers: { type: 'number', example: 3 },
            users: { type: 'number', example: 2 },
          },
        },
      },
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Missing admin.manage permission' })
  async triggerWelcomeEmailBatch() {
    return await this.welcomeEmailBatch.sendPendingWelcomeEmails();
  }

  /**
   * Manually send welcome email to a specific user
   * Requires: admin.manage permission
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('admin.manage')
  @Post('send-welcome-email/:userId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Send welcome email to specific user',
    description: `Manually send or resend a welcome email to a specific user.
    
Specify the user type (tenant, platform, or regular) in the request body.
Useful for sending missed or resending welcome emails on demand.

Requires: admin.manage permission`
  })
  @ApiResponse({
    status: 200,
    description: 'Welcome email sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Welcome email sent to user@example.com' },
      },
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid user type' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Missing admin.manage permission' })
  async sendWelcomeEmailToUser(
    @Param('userId') userId: string,
    @Body() body: { userType: 'tenant' | 'platform' | 'regular' }
  ) {
    const validTypes = ['tenant', 'platform', 'regular'];
    if (!validTypes.includes(body.userType)) {
      throw new Error('Invalid userType. Must be one of: tenant, platform, regular');
    }

    return await this.welcomeEmailBatch.sendWelcomeEmailForUser(userId, body.userType);
  }
}
