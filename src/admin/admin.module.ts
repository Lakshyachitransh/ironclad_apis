import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { BatchJobsController } from './batch-jobs.controller';
import { AdminService } from './admin.service';
import { RolesModule } from '../roles/roles.module';
import { PrismaService } from '../prisma/prisma.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [RolesModule, CommonModule],
  controllers: [AdminController, BatchJobsController],
  providers: [AdminService, PrismaService],
})
export class AdminModule {}
