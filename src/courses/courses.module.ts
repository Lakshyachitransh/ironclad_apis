import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { QuizzesService } from './quizzes.service';
import { QuizzesController } from './quizzes.controller';
import { QuizGeneratorService } from './services/quiz-generator.service';
import { VideoTranscriptionService } from './services/video-transcription.service';
import { VideoProcessingService } from './services/video-processing.service';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../common/services/s3.service';
import { EmailService } from '../common/services/email.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    CommonModule,
    MulterModule.register({
      storage: require('multer').memoryStorage(),
      limits: {
        fileSize: 500 * 1024 * 1024, // 500MB
      },
    }),
  ],
  providers: [CoursesService, QuizzesService, QuizGeneratorService, VideoTranscriptionService, VideoProcessingService, PrismaService, S3Service, EmailService],
  controllers: [CoursesController, QuizzesController]
})
export class CoursesModule {}
