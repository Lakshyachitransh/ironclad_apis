import { Module } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { EmailNotificationService } from './services/email-notification.service';
import { S3Service } from './services/s3.service';
import { WelcomeEmailBatchService } from './services/welcome-email-batch.service';
import { PermissionsService } from './services/permissions.service';
import { PermissionGuard } from './guards/permission.guard';
import { PermissionsController } from './controllers/permissions.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [EmailService, EmailNotificationService, WelcomeEmailBatchService, S3Service, PermissionGuard, PermissionsService, PrismaService],
  controllers: [PermissionsController],
  exports: [EmailService, EmailNotificationService, WelcomeEmailBatchService, S3Service, PermissionGuard, PermissionsService]
})
export class CommonModule {}
