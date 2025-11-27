import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { QuizzesService } from './quizzes.service';
import { QuizzesController } from './quizzes.controller';
import { QuizGeneratorService } from './services/quiz-generator.service';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../common/services/s3.service';

@Module({
  imports: [
    MulterModule.register({
      storage: require('multer').memoryStorage(),
      limits: {
        fileSize: 500 * 1024 * 1024, // 500MB
      },
    }),
  ],
  providers: [CoursesService, QuizzesService, QuizGeneratorService, PrismaService, S3Service],
  controllers: [CoursesController, QuizzesController]
})
export class CoursesModule {}
