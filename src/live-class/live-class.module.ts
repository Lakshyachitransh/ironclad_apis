import { Module } from '@nestjs/common';
import { LiveClassService } from './live-class.service';
import { AttendanceService } from './services/attendance.service';
import { LiveClassController } from './live-class.controller';
import { PrismaService } from '../prisma/prisma.service';
import { LiveClassGateway } from './gateways/live-class.gateway';

@Module({
  controllers: [LiveClassController],
  providers: [LiveClassService, AttendanceService, PrismaService, LiveClassGateway],
  exports: [LiveClassService, AttendanceService]
})
export class LiveClassModule {}
