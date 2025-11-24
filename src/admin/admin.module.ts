import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { RolesModule } from '../roles/roles.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [RolesModule],
  controllers: [AdminController],
  providers: [AdminService, PrismaService],
})
export class AdminModule {}
