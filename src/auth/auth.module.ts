import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsersModule } from '../users/users.module';
import { CommonModule } from '../common/common.module';
import * as dotenv from 'dotenv';
dotenv.config();

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
    secret: process.env.JWT_ACCESS_SECRET,
    signOptions: 
      {
    // prefer numeric seconds
      expiresIn: Number(process.env.JWT_ACCESS_EXPIRES_IN ?? 900),
    },
  }),
    UsersModule,
    CommonModule
  ],
  providers: [AuthService, PrismaService, JwtStrategy, JwtAuthGuard],
  controllers: [AuthController],
  exports: [AuthService]
})
export class AuthModule {}
