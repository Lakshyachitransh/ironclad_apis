import { Module } from '@nestjs/common';
import { LicensesService } from './licenses.service';
import { LicensesController } from './licenses.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [],
  controllers: [LicensesController],
  providers: [LicensesService, PrismaService],
  exports: [LicensesService],
})
export class LicensesModule {}
