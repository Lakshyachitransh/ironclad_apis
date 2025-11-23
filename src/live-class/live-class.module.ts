import { Module } from '@nestjs/common';
import { LiveClassService } from './live-class.service';
import { LiveClassController } from './live-class.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [LiveClassController],
  providers: [LiveClassService, PrismaService],
  exports: [LiveClassService]
})
export class LiveClassModule {}
