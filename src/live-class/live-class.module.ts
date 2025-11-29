import { Module } from '@nestjs/common';
import { LiveClassService } from './live-class.service';
import { AttendanceService } from './services/attendance.service';
import { LiveClassController } from './live-class.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [LiveClassController],
  providers: [LiveClassService, AttendanceService, PrismaService],
  exports: [LiveClassService, AttendanceService]
})
export class LiveClassModule {}
