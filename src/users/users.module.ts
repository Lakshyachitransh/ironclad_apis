import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersController } from './users.controller';
import { EmailService } from '../common/services/email.service';

@Module({
  imports: [
    MulterModule.register({
      storage: require('multer').memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  ],
  providers: [UsersService, PrismaService, EmailService],
  controllers: [UsersController],
  exports: [UsersService]
})
export class UsersModule {}
