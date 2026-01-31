import {
  Controller,
  Post,
  Get,
  Put,
  UseGuards,
  Body,
  Param,
  Req,
  HttpStatus,
  HttpCode,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ExercisesService } from './exercises.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import {
  CreateExerciseTemplateDto,
  CreateExerciseDto,
  UpdateExerciseDto,
  SubmitExerciseDto,
  GenerateExerciseFromTemplateDto,
  GenerateExercisesFromCourseDto,
} from './exercises.dto';

interface JwtUser {
  id: string;
  email: string;
  tenantId?: string;
  roles?: string[];
}

interface ExpressRequest extends Request {
  user?: JwtUser;
}

@ApiTags('Exercises')
@ApiBearerAuth('access-token')
@Controller('exercises')
export class ExercisesController {
  constructor(private exercisesService: ExercisesService) {}

  // ============================================================================
  // Exercise Templates - For creating reusable templates
  // ============================================================================

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('admin.manage')
  @Post('templates')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create exercise template',
    description:
      'Teachers and platform admins can create reusable exercise templates to ensure consistency',
  })
  @ApiResponse({
    status: 201,
    description: 'Template created successfully',
    schema: {
      example: {
        id: 'template-123',
        name: 'Bug Fix Exercise Template',
        category: 'bug-fix',
        status: 'active',
      },
    },
  })
  async createExerciseTemplate(
    @Body() dto: CreateExerciseTemplateDto,
    @Req() req: ExpressRequest,
  ) {
    // @ts-ignore
    const actor = req.user as JwtUser;
    if (!actor?.tenantId) {
      throw new BadRequestException('No tenant information in token');
    }

    return this.exercisesService.createExerciseTemplate({
      tenantId: actor.tenantId,
      name: dto.name,
      description: dto.description,
      category: dto.category,
      structure: dto.structure,
      createdBy: actor.id,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('templates')
  @ApiOperation({
    summary: 'Get exercise templates',
    description: 'Retrieve all available exercise templates for the tenant',
  })
  @ApiResponse({
    status: 200,
    description: 'Templates retrieved successfully',
  })
  async getExerciseTemplates(@Req() req: ExpressRequest, @Query('category') category?: string) {
    // @ts-ignore
    const actor = req.user as JwtUser;
    if (!actor?.tenantId) {
      throw new BadRequestException('No tenant information in token');
    }

    return this.exercisesService.getExerciseTemplates({
      tenantId: actor.tenantId,
      category,
    });
  }

  // ============================================================================
  // Exercises - Create, manage, and retrieve exercises
  // ============================================================================

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('admin.manage')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create hands-on exercise',
    description:
      'Create a new hands-on exercise with code validation, test cases, and highlighted sections',
  })
  @ApiResponse({
    status: 201,
    description: 'Exercise created successfully',
    schema: {
      example: {
        id: 'ex-123',
        lessonId: 'lesson-123',
        title: 'Fix the Login Bug',
        category: 'bug-fix',
        difficulty: 'intermediate',
        status: 'draft',
      },
    },
  })
  async createExercise(@Body() dto: CreateExerciseDto, @Req() req: ExpressRequest) {
    // @ts-ignore
    const actor = req.user as JwtUser;
    if (!actor?.tenantId) {
      throw new BadRequestException('No tenant information in token');
    }

    return this.exercisesService.createExercise({
      tenantId: actor.tenantId,
      lessonId: dto.lessonId,
      createdBy: actor.id,
      dto,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('lesson/:lessonId')
  @ApiOperation({
    summary: 'Get exercises for a lesson',
    description: 'Retrieve all published exercises for a specific lesson',
  })
  @ApiResponse({
    status: 200,
    description: 'Exercises retrieved successfully',
  })
  async getExercisesByLesson(@Param('lessonId') lessonId: string, @Req() req: ExpressRequest) {
    // @ts-ignore
    const actor = req.user as JwtUser;
    if (!actor?.tenantId) {
      throw new BadRequestException('No tenant information in token');
    }

    return this.exercisesService.getExercisesByLesson({
      lessonId,
      tenantId: actor.tenantId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':exerciseId')
  @ApiOperation({
    summary: 'Get exercise details',
    description: 'Retrieve full details of an exercise including code template and test cases',
  })
  @ApiResponse({
    status: 200,
    description: 'Exercise details retrieved',
  })
  async getExercise(@Param('exerciseId') exerciseId: string, @Req() req: ExpressRequest) {
    // @ts-ignore
    const actor = req.user as JwtUser;
    if (!actor?.tenantId) {
      throw new BadRequestException('No tenant information in token');
    }

    return this.exercisesService.getExercise({
      exerciseId,
      tenantId: actor.tenantId,
    });
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('admin.manage')
  @Put(':exerciseId')
  @ApiOperation({
    summary: 'Update exercise',
    description: 'Update exercise details (teachers and admins only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Exercise updated successfully',
  })
  async updateExercise(
    @Param('exerciseId') exerciseId: string,
    @Body() dto: UpdateExerciseDto,
    @Req() req: ExpressRequest,
  ) {
    // @ts-ignore
    const actor = req.user as JwtUser;
    if (!actor?.tenantId) {
      throw new BadRequestException('No tenant information in token');
    }

    return this.exercisesService.updateExercise({
      exerciseId,
      tenantId: actor.tenantId,
      dto,
    });
  }

  // ============================================================================
  // Code Submissions and Validation
  // ============================================================================

  @UseGuards(JwtAuthGuard)
  @Post(':exerciseId/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit exercise code',
    description:
      'Submit code for validation. AI tutor will check syntax, run tests, and provide feedback',
  })
  @ApiResponse({
    status: 200,
    description: 'Code submitted and validated',
    schema: {
      example: {
        submission: {
          id: 'sub-123',
          score: 75,
          status: 'reviewed',
        },
        testResults: [
          { testId: 'test-1', passed: true },
          { testId: 'test-2', passed: false, error: 'Output mismatch' },
        ],
        feedback: {
          isCorrect: false,
          score: 75,
          feedback: 'Good effort! You passed 3 out of 4 tests.',
          suggestions: ['Check the edge case handling', 'Review the error message'],
          commonMistakes: ['Off-by-one error in loop'],
          nextSteps: ['Debug the failing test case', 'Consider boundary conditions'],
        },
        qualityAnalysis: {
          score: 85,
          issues: [],
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Syntax error or validation failed',
  })
  async submitExercise(
    @Param('exerciseId') exerciseId: string,
    @Body() dto: SubmitExerciseDto,
    @Req() req: ExpressRequest,
  ) {
    // @ts-ignore
    const actor = req.user as JwtUser;
    if (!actor?.tenantId) {
      throw new BadRequestException('No tenant information in token');
    }

    return this.exercisesService.submitExercise({
      exerciseId,
      userId: actor.id,
      tenantId: actor.tenantId,
      dto,
    });
  }

  // ============================================================================
  // Submission Tracking
  // ============================================================================

  @UseGuards(JwtAuthGuard)
  @Get('submissions/my')
  @ApiOperation({
    summary: 'Get my submissions',
    description:
      'Retrieve all code submissions for the current user with scores and status',
  })
  @ApiResponse({
    status: 200,
    description: 'Submissions retrieved',
  })
  async getUserSubmissions(
    @Req() req: ExpressRequest,
    @Query('exerciseId') exerciseId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    // @ts-ignore
    const actor = req.user as JwtUser;
    if (!actor?.tenantId) {
      throw new BadRequestException('No tenant information in token');
    }

    return this.exercisesService.getUserSubmissions({
      userId: actor.id,
      tenantId: actor.tenantId,
      exerciseId,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('submissions/:submissionId')
  @ApiOperation({
    summary: 'Get submission details',
    description: 'Retrieve detailed feedback and test results for a specific submission',
  })
  @ApiResponse({
    status: 200,
    description: 'Submission details retrieved',
  })
  async getSubmissionDetails(
    @Param('submissionId') submissionId: string,
    @Req() req: ExpressRequest,
  ) {
    // @ts-ignore
    const actor = req.user as JwtUser;
    if (!actor?.tenantId) {
      throw new BadRequestException('No tenant information in token');
    }

    return this.exercisesService.getSubmissionDetails({
      submissionId,
      userId: actor.id,
      tenantId: actor.tenantId,
    });
  }

  // ============================================================================
  // AI Tutor Features
  // ============================================================================

  @UseGuards(JwtAuthGuard)
  @Post(':exerciseId/hint')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get AI hint',
    description:
      'Get an AI-generated hint tailored to the exercise and your current progress',
  })
  @ApiResponse({
    status: 200,
    description: 'Hint generated',
    schema: {
      example: {
        hint: 'Think about what the function should return when the input is empty. Have you considered that edge case?',
      },
    },
  })
  async getHint(
    @Param('exerciseId') exerciseId: string,
    @Req() req: ExpressRequest,
    @Body('lastAttemptCode') lastAttemptCode?: string,
  ) {
    // @ts-ignore
    const actor = req.user as JwtUser;
    if (!actor?.tenantId) {
      throw new BadRequestException('No tenant information in token');
    }

    return this.exercisesService.getHint({
      exerciseId,
      userId: actor.id,
      tenantId: actor.tenantId,
      lastAttemptCode,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':exerciseId/edge-cases')
  @ApiOperation({
    summary: 'Suggest edge cases',
    description: 'Get AI suggestions for edge cases your code should handle',
  })
  @ApiResponse({
    status: 200,
    description: 'Edge case suggestions provided',
    schema: {
      example: {
        suggestions: [
          'Test with empty arrays',
          'Test with single-element arrays',
          'Test with negative numbers',
        ],
      },
    },
  })
  async suggestEdgeCases(
    @Param('exerciseId') exerciseId: string,
    @Req() req: ExpressRequest,
    @Body('lastAttemptCode') lastAttemptCode?: string,
  ) {
    // @ts-ignore
    const actor = req.user as JwtUser;
    if (!actor?.tenantId) {
      throw new BadRequestException('No tenant information in token');
    }

    return this.exercisesService.suggestEdgeCases({
      exerciseId,
      tenantId: actor.tenantId,
      lastAttemptCode,
    });
  }

  // ============================================================================
  // Template-based Exercise Generation
  // ============================================================================

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('admin.manage')
  @Post('generate-from-template')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate exercise from template',
    description:
      'Create a new exercise quickly using a predefined template. Teachers just need to provide the code and test cases.',
  })
  @ApiResponse({
    status: 201,
    description: 'Exercise generated successfully',
  })
  async generateExerciseFromTemplate(
    @Body() dto: GenerateExerciseFromTemplateDto,
    @Req() req: ExpressRequest,
  ) {
    // @ts-ignore
    const actor = req.user as JwtUser;
    if (!actor?.tenantId) {
      throw new BadRequestException('No tenant information in token');
    }

    return this.exercisesService.generateExerciseFromTemplate({
      tenantId: actor.tenantId,
      templateId: dto.templateId,
      lessonId: dto.lessonId,
      title: dto.title,
      startingCode: dto.startingCode,
      expectedOutput: dto.expectedOutput,
      testCases: dto.testCases,
      difficulty: dto.difficulty,
      createdBy: actor.id,
    });
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('admin.manage')
  @Post('generate-from-course')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate exercises from course content',
    description: 'Teacher/Admin provides difficulty, category, courseId, tenantId and system generates exercises based on course content'
  })
  @ApiResponse({
    status: 201,
    description: 'Exercises generated successfully',
    schema: {
      example: {
        success: true,
        courseId: '956296e4-91b4-460e-a928-2ffbb7903c22',
        course: 'JavaScript Fundamentals',
        difficulty: 'beginner',
        category: 'code-completion',
        generatedCount: 3,
        exercises: [
          {
            id: 'ex-1',
            title: 'Complete the function',
            difficulty: 'beginner',
            category: 'code-completion',
            lesson: 'Introduction to Variables'
          }
        ]
      }
    }
  })
  async generateExercisesFromCourse(
    @Req() req: ExpressRequest,
    @Body() dto: GenerateExercisesFromCourseDto,
  ) {
    const actor = req.user;
    if (!actor?.tenantId) {
      throw new BadRequestException('Tenant ID required');
    }

    return this.exercisesService.generateExercisesFromCourse({
      courseId: dto.courseId,
      tenantId: actor.tenantId,
      difficulty: dto.difficulty,
      category: dto.category,
      count: dto.count || 3,
      lessonId: dto.lessonId,
    });
  }
}
