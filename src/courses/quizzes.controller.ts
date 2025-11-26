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
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
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
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lessons/:lessonId/quizzes')
export class QuizzesController {
  constructor(private quizzesService: QuizzesService) {}

  // Quiz Management Endpoints
  @Post()
  @Roles('training_manager', 'org_admin')
  @ApiOperation({ summary: 'Create a new quiz for a lesson' })
  async createQuiz(
    @Param('lessonId') lessonId: string,
    @Body() dto: CreateQuizDto,
  ) {
    return this.quizzesService.createQuiz(lessonId, dto);
  }

  @Get()
  @Roles('training_manager', 'org_admin', 'learner')
  @ApiOperation({ summary: 'Get all quizzes for a lesson' })
  async getQuizzes(@Param('lessonId') lessonId: string) {
    return this.quizzesService.getQuizzes(lessonId);
  }

  @Get(':quizId')
  @Roles('training_manager', 'org_admin', 'learner')
  @ApiOperation({ summary: 'Get quiz details with questions and options' })
  async getQuiz(@Param('quizId') quizId: string) {
    return this.quizzesService.getQuiz(quizId);
  }

  @Put(':quizId')
  @Roles('training_manager', 'org_admin')
  @ApiOperation({ summary: 'Update quiz settings' })
  async updateQuiz(
    @Param('quizId') quizId: string,
    @Body() dto: UpdateQuizDto,
  ) {
    return this.quizzesService.updateQuiz(quizId, dto);
  }

  @Post(':quizId/publish')
  @Roles('training_manager', 'org_admin')
  @ApiOperation({ summary: 'Publish quiz (must have questions)' })
  async publishQuiz(@Param('quizId') quizId: string) {
    return this.quizzesService.publishQuiz(quizId);
  }

  @Delete(':quizId')
  @Roles('training_manager', 'org_admin')
  @ApiOperation({ summary: 'Delete a quiz' })
  async deleteQuiz(@Param('quizId') quizId: string) {
    return this.quizzesService.deleteQuiz(quizId);
  }

  // Question Management Endpoints
  @Post(':quizId/questions')
  @Roles('training_manager', 'org_admin')
  @ApiOperation({ summary: 'Add a question to the quiz' })
  async addQuestion(
    @Param('quizId') quizId: string,
    @Body() dto: CreateQuizQuestionDto,
  ) {
    return this.quizzesService.addQuestion(quizId, dto);
  }

  @Put(':quizId/questions/:questionId')
  @Roles('training_manager', 'org_admin')
  @ApiOperation({ summary: 'Update a question' })
  async updateQuestion(
    @Param('questionId') questionId: string,
    @Body() dto: UpdateQuizQuestionDto,
  ) {
    return this.quizzesService.updateQuestion(questionId, dto);
  }

  @Delete(':quizId/questions/:questionId')
  @Roles('training_manager', 'org_admin')
  @ApiOperation({ summary: 'Delete a question' })
  async deleteQuestion(@Param('questionId') questionId: string) {
    return this.quizzesService.deleteQuestion(questionId);
  }

  // Option Management Endpoints
  @Post(':quizId/questions/:questionId/options')
  @Roles('training_manager', 'org_admin')
  @ApiOperation({ summary: 'Add an option to a question' })
  async addOption(
    @Param('questionId') questionId: string,
    @Body() dto: CreateQuizOptionDto,
  ) {
    return this.quizzesService.addOption(questionId, dto);
  }

  @Put(':quizId/questions/:questionId/options/:optionId')
  @Roles('training_manager', 'org_admin')
  @ApiOperation({ summary: 'Update an option' })
  async updateOption(
    @Param('optionId') optionId: string,
    @Body() dto: UpdateQuizOptionDto,
  ) {
    return this.quizzesService.updateOption(optionId, dto);
  }

  @Delete(':quizId/questions/:questionId/options/:optionId')
  @Roles('training_manager', 'org_admin')
  @ApiOperation({ summary: 'Delete an option' })
  async deleteOption(@Param('optionId') optionId: string) {
    return this.quizzesService.deleteOption(optionId);
  }

  // Quiz Attempt Endpoints
  @Post(':quizId/start')
  @Roles('learner')
  @ApiOperation({ summary: 'Start a quiz attempt' })
  async startAttempt(
    @Param('quizId') quizId: string,
    @Request() req,
  ) {
    return this.quizzesService.startQuizAttempt(quizId, req.user.id);
  }

  @Get(':quizId/attempts/:attemptId')
  @Roles('learner', 'training_manager', 'org_admin')
  @ApiOperation({ summary: 'Get attempt details' })
  async getAttempt(@Param('attemptId') attemptId: string) {
    return this.quizzesService.getAttempt(attemptId);
  }

  @Post(':quizId/attempts/:attemptId/answers')
  @Roles('learner')
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
  @Roles('learner')
  @ApiOperation({ summary: 'Submit the entire quiz (calculate score)' })
  async submitQuiz(@Param('attemptId') attemptId: string) {
    return this.quizzesService.submitQuiz(attemptId);
  }

  @Get(':quizId/my-attempts')
  @Roles('learner')
  @ApiOperation({ summary: 'Get my quiz attempts' })
  async getMyAttempts(
    @Param('quizId') quizId: string,
    @Request() req,
  ) {
    return this.quizzesService.getUserAttempts(quizId, req.user.id);
  }

  @Get(':quizId/results')
  @Roles('training_manager', 'org_admin')
  @ApiOperation({ summary: 'Get all quiz results' })
  async getQuizResults(@Param('quizId') quizId: string) {
    return this.quizzesService.getQuizResults(quizId);
  }
}
