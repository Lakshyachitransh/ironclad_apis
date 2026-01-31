import { Module } from '@nestjs/common';
import { ExercisesController } from './exercises.controller';
import { AITutorController } from './ai-tutor.controller';
import { ExercisesService } from './exercises.service';
import { PrismaService } from '../prisma/prisma.service';
import { AITutorService } from './ai-tutor.service';
import { CodeValidationService } from './code-validation.service';
import { ExerciseTemplateGeneratorService } from './exercise-template-generator.service';
import { ConversationService } from './conversation.service';
import { HighlightService } from './highlight.service';
import { CodeExecutorService } from './code-executor.service';

@Module({
  controllers: [ExercisesController, AITutorController],
  providers: [
    ExercisesService,
    PrismaService,
    AITutorService,
    CodeValidationService,
    ExerciseTemplateGeneratorService,
    ConversationService,
    HighlightService,
    CodeExecutorService,
  ],
  exports: [
    ExercisesService,
    AITutorService,
    ConversationService,
    HighlightService,
    CodeExecutorService,
  ],
})
export class ExercisesModule {}
