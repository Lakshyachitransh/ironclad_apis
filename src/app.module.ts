import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TenantsModule } from './tenants/tenants.module';
import { RolesModule } from './roles/roles.module';
import { ConfigModule } from '@nestjs/config';
import { CoursesModule } from './courses/courses.module';
import { LiveClassModule } from './live-class/live-class.module';
import { AdminModule } from './admin/admin.module';
import { LicensesModule } from './licenses/licenses.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    TenantsModule,
    RolesModule,
    CoursesModule,
    LiveClassModule,
    AdminModule,
    LicensesModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    })
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
