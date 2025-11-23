import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { PrismaService } from '../prisma/prisma.service';
//import { RolesGuard } from './roles.guard';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [],
  controllers: [RolesController],
  providers: [
    RolesService,
    PrismaService,
    // Optionally enable RolesGuard as a global guard:
    // { provide: APP_GUARD, useClass: RolesGuard }
  ],
  exports: [RolesService],
})
export class RolesModule {}
