import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { QuizzesService } from './quizzes.service';
import {
  CreateQuizDto,
  UpdateQuizDto,
  CreateQuizQuestionDto,
  UpdateQuizQuestionDto,
  CreateQuizOptionDto,
  UpdateQuizOptionDto,
  SubmitQuizAnswerDto,
} from './dto/quizzes.dto';

@ApiTags('quizzes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('lessons/:lessonId/quizzes')
export class QuizzesController {
  constructor(private quizzesService: QuizzesService) {}

  // Quiz Management Endpoints
  @Post()
  @RequirePermission('courses.publish')
  @ApiOperation({ summary: 'Create a new quiz for a lesson' })
  async createQuiz(
    @Param('lessonId') lessonId: string,
    @Body() dto: CreateQuizDto,
  ) {
    return this.quizzesService.createQuiz(lessonId, dto);
  }

  @Get()
  @RequirePermission('courses.read')
  @ApiOperation({ summary: 'Get all quizzes for a lesson' })
  async getQuizzes(@Param('lessonId') lessonId: string) {
    return this.quizzesService.getQuizzes(lessonId);
  }

  @Get(':quizId')
  @RequirePermission('courses.read')
  @ApiOperation({ summary: 'Get quiz details with questions and options' })
  async getQuiz(@Param('quizId') quizId: string) {
    return this.quizzesService.getQuiz(quizId);
  }

  @Put(':quizId')
  @RequirePermission('courses.update')
  @ApiOperation({ summary: 'Update quiz settings' })
  async updateQuiz(
    @Param('quizId') quizId: string,
    @Body() dto: UpdateQuizDto,
  ) {
    return this.quizzesService.updateQuiz(quizId, dto);
  }

  @Post(':quizId/publish')
  @RequirePermission('courses.publish')
  @ApiOperation({ summary: 'Publish quiz (must have questions)' })
  async publishQuiz(@Param('quizId') quizId: string) {
    return this.quizzesService.publishQuiz(quizId);
  }

  @Delete(':quizId')
  @RequirePermission('courses.delete')
  @ApiOperation({ summary: 'Delete a quiz' })
  async deleteQuiz(@Param('quizId') quizId: string) {
    return this.quizzesService.deleteQuiz(quizId);
  }

  // Question Management Endpoints
  @Post(':quizId/questions')
  @RequirePermission('courses.publish')
  @ApiOperation({ summary: 'Add a question to the quiz' })
  async addQuestion(
    @Param('quizId') quizId: string,
    @Body() dto: CreateQuizQuestionDto,
  ) {
    return this.quizzesService.addQuestion(quizId, dto);
  }

  @Put(':quizId/questions/:questionId')
  @RequirePermission('courses.update')
  @ApiOperation({ summary: 'Update a question' })
  async updateQuestion(
    @Param('questionId') questionId: string,
    @Body() dto: UpdateQuizQuestionDto,
  ) {
    return this.quizzesService.updateQuestion(questionId, dto);
  }

  @Delete(':quizId/questions/:questionId')
  @RequirePermission('courses.delete')
  @ApiOperation({ summary: 'Delete a question' })
  async deleteQuestion(@Param('questionId') questionId: string) {
    return this.quizzesService.deleteQuestion(questionId);
  }

  // Option Management Endpoints
  @Post(':quizId/questions/:questionId/options')
  @RequirePermission('courses.publish')
  @ApiOperation({ summary: 'Add an option to a question' })
  async addOption(
    @Param('questionId') questionId: string,
    @Body() dto: CreateQuizOptionDto,
  ) {
    return this.quizzesService.addOption(questionId, dto);
  }

  @Put(':quizId/questions/:questionId/options/:optionId')
  @RequirePermission('courses.update')
  @ApiOperation({ summary: 'Update an option' })
  async updateOption(
    @Param('optionId') optionId: string,
    @Body() dto: UpdateQuizOptionDto,
  ) {
    return this.quizzesService.updateOption(optionId, dto);
  }

  @Delete(':quizId/questions/:questionId/options/:optionId')
  @RequirePermission('courses.delete')
  @ApiOperation({ summary: 'Delete an option' })
  async deleteOption(@Param('optionId') optionId: string) {
    return this.quizzesService.deleteOption(optionId);
  }

  // Quiz Attempt Endpoints
  @Post(':quizId/start')
  @RequirePermission('courses.read')
  @ApiOperation({ summary: 'Start a quiz attempt' })
  async startAttempt(
    @Param('quizId') quizId: string,
    @Request() req,
  ) {
    return this.quizzesService.startQuizAttempt(quizId, req.user.id);
  }

  @Get(':quizId/attempts/:attemptId')
  @RequirePermission('courses.read')
  @ApiOperation({ summary: 'Get attempt details' })
  async getAttempt(@Param('attemptId') attemptId: string) {
    return this.quizzesService.getAttempt(attemptId);
  }

  @Post(':quizId/attempts/:attemptId/answers')
  @RequirePermission('courses.read')
  @ApiOperation({ summary: 'Submit an answer to a question' })
  async submitAnswer(
    @Param('attemptId') attemptId: string,
    @Body() dto: SubmitQuizAnswerDto,
  ) {
    return this.quizzesService.submitAnswer(
      attemptId,
      dto.questionId,
      dto.selectedOption,
    );
  }

  @Post(':quizId/attempts/:attemptId/submit')
  @RequirePermission('courses.read')
  @ApiOperation({ summary: 'Submit the entire quiz (calculate score)' })
  async submitQuiz(@Param('attemptId') attemptId: string) {
    return this.quizzesService.submitQuiz(attemptId);
  }

  @Get(':quizId/my-attempts')
  @RequirePermission('courses.read')
  @ApiOperation({ summary: 'Get my quiz attempts' })
  async getMyAttempts(
    @Param('quizId') quizId: string,
    @Request() req,
  ) {
    return this.quizzesService.getUserAttempts(quizId, req.user.id);
  }

  @Get(':quizId/results')
  @RequirePermission('courses.read')
  @ApiOperation({ summary: 'Get all quiz results' })
  async getQuizResults(@Param('quizId') quizId: string) {
    return this.quizzesService.getQuizResults(quizId);
  }
}
