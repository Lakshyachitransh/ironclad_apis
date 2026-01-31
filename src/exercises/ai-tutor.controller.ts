import {
  Controller,
  Post,
  Get,
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
import { AITutorService } from './ai-tutor.service';
import { ExercisesService } from './exercises.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  AskTutorQuestionDto,
  GenerateExerciseDynamicDto,
  AnalyzeStudentProgressDto,
  GeneratePersonalizedExerciseDto,
  ReviewCodeSubmissionDto,
  CompareCodeSolutionsDto,
  GenerateInteractiveQuizDto,
  DebugAssistanceDto,
  GenerateCodeExplanationDto,
} from './ai-tutor.dto';

interface JwtUser {
  id: string;
  email: string;
  tenantId?: string;
  roles?: string[];
}

interface ExpressRequest extends Request {
  user?: JwtUser;
}

@ApiTags('AI Tutor')
@ApiBearerAuth('access-token')
@Controller('ai-tutor')
export class AITutorController {
  constructor(
    private aiTutorService: AITutorService,
    private exercisesService: ExercisesService,
    private prisma: PrismaService,
  ) {}

  // ============================================================================
  // Question Answering - Students can ask programming questions
  // ============================================================================

  @UseGuards(JwtAuthGuard)
  @Post('ask-question')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ask AI tutor a question',
    description: 'Ask any programming question and get an intelligent, educational answer',
  })
  @ApiResponse({
    status: 200,
    description: 'Answer provided',
    schema: {
      example: {
        answer: 'A callback function is a function that is passed to another function...',
      },
    },
  })
  async askQuestion(@Body() dto: AskTutorQuestionDto, @Req() req: ExpressRequest) {
    // @ts-ignore
    const actor = req.user as JwtUser;
    console.log('Actor:', actor);
    const isPlatformAdmin = actor?.roles?.includes('platform_admin');
    if (!isPlatformAdmin && !actor?.tenantId) {
      throw new BadRequestException('No tenant information in token');
    }

    const answer = await this.aiTutorService.answerStudentQuestion({
      question: dto.question,
      context: dto.context,
      difficulty: 'intermediate', // default
    });

    return { answer };
  }

  // ============================================================================
  // Dynamic Exercise Generation - Generate exercises on-demand
  // ============================================================================

  @UseGuards(JwtAuthGuard)
  @Post('generate-exercise')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate exercise dynamically',
    description:
      'Create a new exercise on any topic with automatic test cases and hints. Perfect for practice.',
  })
  @ApiResponse({
    status: 201,
    description: 'Exercise generated successfully',
    schema: {
      example: {
        title: 'Array Sum Calculator',
        description: 'Learn to work with arrays and loops',
        difficulty: 'beginner',
        startingCode: 'function sumArray(arr) {',
        expectedOutput: 'sum of all numbers in array',
      },
    },
  })
  async generateExerciseDynamic(
    @Body() dto: GenerateExerciseDynamicDto,
    @Req() req: ExpressRequest,
  ) {
    // @ts-ignore
    const actor = req.user as JwtUser;
    console.log('Actor:', actor);
    const isPlatformAdmin = actor?.roles?.includes('platform_admin');
    let tenantId = isPlatformAdmin ? dto.tenantId : actor?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('No tenantId provided (required in token for regular users, in body for platform_admin)');
    }

    // Handle field name aliases (snake_case -> camelCase)
    const courseId = dto.courseId || dto.course_id;
    const programmingLanguage = dto.programmingLanguage || dto.language || 'javascript';
    const category = dto.category || 'code-completion'; // default if not provided
    const lessonId = dto.lessonId || courseId; // use courseId as fallback if lessonId not provided

    // Only require lessonId if we have a database exercise to link to
    if (!lessonId) {
      // If no lessonId, we can still generate the exercise without saving
      const generatedExercise = await this.aiTutorService.generateExerciseDynamic({
        topic: dto.topic,
        difficulty: dto.difficulty as string,
        category: category as string,
        description: dto.description,
        programmingLanguage: programmingLanguage,
      });

      return {
        exercise: generatedExercise,
        note: 'Exercise generated but not saved. Provide lessonId to save to database.',
      };
    }

    // Verify lesson exists
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      // If lesson doesn't exist, just generate the exercise without saving
      const generatedExercise = await this.aiTutorService.generateExerciseDynamic({
        topic: dto.topic,
        difficulty: dto.difficulty as string,
        category: category as string,
        description: dto.description,
        programmingLanguage: programmingLanguage,
      });

      return {
        exercise: generatedExercise,
        note: 'Exercise generated but not saved. Lesson not found.',
      };
    }

    // Generate exercise using AI
    const generatedExercise = await this.aiTutorService.generateExerciseDynamic({
      topic: dto.topic,
      difficulty: dto.difficulty as string,
      category: category as string,
      description: dto.description,
      programmingLanguage: programmingLanguage,
    });



    // Save the generated exercise to database
    const savedExercise = await this.exercisesService.createExercise({
      tenantId: tenantId,
      lessonId: lessonId,
      createdBy: actor.id,
      dto: {
        lessonId: lessonId,
        title: generatedExercise.title,
        description: generatedExercise.description,
        instructions: generatedExercise.instructions,
        difficulty: dto.difficulty as any,
        category: category as any,
        startingCode: generatedExercise.startingCode,
        expectedOutput: generatedExercise.expectedOutput,
        testCases: JSON.stringify(generatedExercise.testCases),
        highlightedSections: JSON.stringify(generatedExercise.highlightedSections),
      },
    });

    return {
      exercise: generatedExercise,
      savedExerciseId: savedExercise.id,
      message: 'Exercise generated and saved successfully',
    };
  }

  // ============================================================================
  // Progress Analysis - Analyze student performance
  // ============================================================================

  @UseGuards(JwtAuthGuard)
  @Get('analyze-progress')
  @ApiOperation({
    summary: 'Analyze your progress',
    description: 'Get AI-generated insights about your learning progress and weak areas',
  })
  @ApiResponse({
    status: 200,
    description: 'Progress analysis provided',
    schema: {
      example: {
        totalExercises: 15,
        completed: 12,
        successRate: 80,
        weakAreas: ['recursion', 'dynamic-programming'],
        strongAreas: ['arrays', 'strings'],
        recommendedTopics: ['Advanced recursion', 'Algorithm optimization'],
      },
    },
  })
  async analyzeProgress(@Req() req: ExpressRequest) {
    // @ts-ignore
    const actor = req.user as JwtUser;
    const isPlatformAdmin = actor?.roles?.includes('platform_admin');
    if (!isPlatformAdmin && !actor?.tenantId) {
      throw new BadRequestException('No tenant information in token');
    }

    // Get all submissions for the user
    const submissions = await this.prisma.exerciseSubmission.findMany({
      where: {
        userId: actor.id,
        tenantId: actor.tenantId,
      },
      include: {
        exercise: {
          select: { title: true, category: true },
        },
      },
    });

    if (submissions.length === 0) {
      return {
        totalExercises: 0,
        completed: 0,
        successRate: 0,
        weakAreas: [],
        strongAreas: [],
        recommendedTopics: ['Start with the fundamentals'],
      };
    }

    const analysis = await this.aiTutorService.analyzeStudentProgress({
      userId: actor.id,
      submissions: submissions.map(s => ({
        exerciseTitle: s.exercise.title,
        category: s.exercise.category,
        score: s.score || 0,
      })),
    });

    return analysis;
  }

  // ============================================================================
  // Code Comparison - Compare solutions
  // ============================================================================

  @UseGuards(JwtAuthGuard)
  @Post('compare-solutions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Compare your code with reference solution',
    description: 'See how your solution compares with the ideal solution',
  })
  @ApiResponse({
    status: 200,
    description: 'Comparison provided',
    schema: {
      example: {
        similarities: ['Both use a loop', 'Similar variable naming'],
        differences: ['Reference uses ES6 syntax', 'Your solution has more comments'],
        improvements: ['Use const instead of let', 'Consider arrow functions'],
        codeSmellsDetected: ['Unused variable x', 'Nested loop could be optimized'],
        performanceAnalysis: 'Both solutions have O(n) time complexity',
      },
    },
  })
  async compareCodeSolutions(
    @Body() dto: CompareCodeSolutionsDto,
    @Req() req: ExpressRequest,
  ) {
    // @ts-ignore
    const actor = req.user as JwtUser;
    const isPlatformAdmin = actor?.roles?.includes('platform_admin');
    if (!isPlatformAdmin && !actor?.tenantId) {
      throw new BadRequestException('No tenant information in token');
    }

    const comparison = await this.aiTutorService.compareCodeSolutions({
      studentCode: dto.studentCode,
      referenceCode: dto.referenceCode,
      exerciseTitle: dto.exerciseTitle,
      expectedOutput: dto.expectedOutput,
    });

    return comparison;
  }

  // ============================================================================
  // Debug Assistance - Help debug code
  // ============================================================================

  @UseGuards(JwtAuthGuard)
  @Post('debug-help')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get debugging help',
    description: 'Explain an error and get help fixing it',
  })
  @ApiResponse({
    status: 200,
    description: 'Debug solution provided',
    schema: {
      example: {
        errorExplanation: 'TypeError: Cannot read property of undefined',
        rootCause: 'You are trying to access a property on a null/undefined object',
        solution: 'Check if the object exists before accessing its properties',
        codeExample: 'if (obj && obj.property) { ... }',
        preventionTips: ['Use optional chaining', 'Add null checks', 'Test with null values'],
      },
    },
  })
  async debugHelp(@Body() dto: DebugAssistanceDto, @Req() req: ExpressRequest) {
    // @ts-ignore
    const actor = req.user as JwtUser;
    const isPlatformAdmin = actor?.roles?.includes('platform_admin');
    if (!isPlatformAdmin && !actor?.tenantId) {
      throw new BadRequestException('No tenant information in token');
    }

    const solution = await this.aiTutorService.debugAssistance({
      errorMessage: dto.errorMessage,
      code: dto.code,
      stackTrace: dto.stackTrace,
      programmingLanguage: dto.programmingLanguage,
    });

    return solution;
  }

  // ============================================================================
  // Code Explanation - Explain code concepts
  // ============================================================================

  @UseGuards(JwtAuthGuard)
  @Post('explain-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Explain code',
    description: 'Get a detailed explanation of how code works',
  })
  @ApiResponse({
    status: 200,
    description: 'Code explanation provided',
    schema: {
      example: {
        explanation:
          '1. Overall purpose: This function calculates the sum of array elements\n2. Line breakdown: ...',
      },
    },
  })
  async explainCode(@Body() dto: GenerateCodeExplanationDto, @Req() req: ExpressRequest) {
    // @ts-ignore
    const actor = req.user as JwtUser;
    const isPlatformAdmin = actor?.roles?.includes('platform_admin');
    if (!isPlatformAdmin && !actor?.tenantId) {
      throw new BadRequestException('No tenant information in token');
    }

    const explanation = await this.aiTutorService.explainCodeDetailed({
      code: dto.code,
      programmingLanguage: dto.programmingLanguage,
      detailLevel: dto.detailLevel as 'beginner' | 'intermediate' | 'advanced',
      specificPart: dto.specificPart,
    });

    return { explanation };
  }

  // ============================================================================
  // Interactive Quiz - Generate quizzes
  // ============================================================================

  @UseGuards(JwtAuthGuard)
  @Post('generate-quiz')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate interactive quiz',
    description:
      'Generate a multiple-choice quiz about a topic or code to test your understanding',
  })
  @ApiResponse({
    status: 201,
    description: 'Quiz generated',
    schema: {
      example: {
        quiz: [
          {
            id: 'q1',
            question: 'What does this code do?',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 1,
            explanation: 'Because...',
          },
        ],
      },
    },
  })
  async generateQuiz(@Body() dto: GenerateInteractiveQuizDto, @Req() req: ExpressRequest) {
    // @ts-ignore
    const actor = req.user as JwtUser;
    const isPlatformAdmin = actor?.roles?.includes('platform_admin');
    if (!isPlatformAdmin && !actor?.tenantId) {
      throw new BadRequestException('No tenant information in token');
    }

    const quiz = await this.aiTutorService.generateInteractiveQuiz({
      topicOrCode: dto.topicOrCode,
      difficulty: dto.difficulty,
      numberOfQuestions: dto.numberOfQuestions,
    });

    return { quiz };
  }

  // ============================================================================
  // Personalized Learning Path
  // ============================================================================

  @UseGuards(JwtAuthGuard)
  @Post('personalized-exercise')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate personalized exercise',
    description:
      'Get an exercise tailored to your weak areas and learning level to improve faster',
  })
  @ApiResponse({
    status: 201,
    description: 'Personalized exercise generated',
  })
  async generatePersonalizedExercise(
    @Body() dto: GeneratePersonalizedExerciseDto,
    @Req() req: ExpressRequest,
  ) {
    // @ts-ignore
    const actor = req.user as JwtUser;
    const isPlatformAdmin = actor?.roles?.includes('platform_admin');
    if (!isPlatformAdmin && !actor?.tenantId) {
      throw new BadRequestException('No tenant information in token');
    }

    // If no weak areas provided, analyze user progress
    let weakAreas = dto.weakAreas;
    if (!weakAreas || weakAreas.length === 0) {
      const submissions = await this.prisma.exerciseSubmission.findMany({
        where: {
          userId: actor.id,
          tenantId: actor.tenantId,
        },
        include: {
          exercise: { select: { category: true } },
        },
      });

      const categories: { [key: string]: number[] } = {};
      submissions.forEach(s => {
        if (!categories[s.exercise.category]) categories[s.exercise.category] = [];
        categories[s.exercise.category].push(s.score || 0);
      });

      weakAreas = Object.entries(categories)
        .filter(([_, scores]) => scores.reduce((a, b) => a + b, 0) / scores.length < 70)
        .map(([cat]) => cat);
    }

    const topic = weakAreas.length > 0 ? weakAreas[0] : 'fundamentals';
    const prompt = `Generate a ${dto.difficulty} level exercise about ${topic} for a student working on weak areas`;

    const generatedExercise = await this.aiTutorService.generateExerciseDynamic({
      topic,
      difficulty: dto.difficulty as string,
      category: 'code-completion' as string,
      description: `Personalized exercise to improve: ${weakAreas.join(', ')}`,
    });

    // Save the generated exercise
    const savedExercise = await this.exercisesService.createExercise({
      tenantId: actor.tenantId,
      lessonId: dto.lessonId,
      createdBy: actor.id,
      dto: {
        lessonId: dto.lessonId,
        title: `Personalized: ${generatedExercise.title}`,
        description: generatedExercise.description,
        instructions: generatedExercise.instructions,
        difficulty: dto.difficulty as any,
        category: 'code-completion' as any,
        startingCode: generatedExercise.startingCode,
        expectedOutput: generatedExercise.expectedOutput,
        testCases: JSON.stringify(generatedExercise.testCases),
        highlightedSections: JSON.stringify(generatedExercise.highlightedSections),
      },
    });

    return {
      exercise: generatedExercise,
      exerciseId: savedExercise.id,
      personalizedFor: weakAreas,
    };
  }

  // ============================================================================
  // Learning Resources - Get explanations on concepts
  // ============================================================================

  @UseGuards(JwtAuthGuard)
  @Get('concept/:concept')
  @ApiOperation({
    summary: 'Learn a programming concept',
    description: 'Get an explanation and examples of a programming concept',
  })
  @ApiResponse({
    status: 200,
    description: 'Concept explanation provided',
  })
  async learnConcept(
    @Param('concept') concept: string,
    @Query('level') level: string = 'intermediate',
    @Req() req: ExpressRequest,
  ) {
    // @ts-ignore
    const actor = req.user as JwtUser;
    const isPlatformAdmin = actor?.roles?.includes('platform_admin');
    if (!isPlatformAdmin && !actor?.tenantId) {
      throw new BadRequestException('No tenant information in token');
    }

    const explanation = await this.aiTutorService.explainConcept({
      concept,
      difficulty: level,
    });

    return { concept, explanation };
  }

  /**
   * Explain a programming concept (legacy method for reference)
   */
  private async explainConcept(params: {
    concept: string;
    difficulty: string;
  }): Promise<string> {
    const prompt = `Explain the concept of "${params.concept}" at a ${params.difficulty} level.

Provide a clear, concise explanation with:
1. What it is
2. Why it matters
3. How to use it
4. Common examples

Keep the explanation to 3-4 paragraphs maximum.`;

    const completion = await (this.aiTutorService as any).openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert programming educator. Explain concepts clearly and concisely.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0].message.content || 'Unable to generate explanation at this time.';
  }

  // ============================================================================
  // Conversation Management
  // ============================================================================

  @UseGuards(JwtAuthGuard)
  @Post('conversations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({ status: 201, description: 'Conversation created successfully' })
  async createConversation(
    @Body() dto: any,
    @Req() req: ExpressRequest,
  ) {
    const user = req.user;
    const isPlatformAdmin = user?.roles?.includes('platform_admin');
    if (!isPlatformAdmin && !user?.tenantId) {
      throw new BadRequestException('TenantId is required');
    }

    return this.prisma.conversation.create({
      data: {
        id: require('uuid').v4(),
        tenantId: user.tenantId,
        userId: user.id,
        courseId: dto.courseId,
        lessonId: dto.lessonId,
        topic: dto.topic,
        title: `${dto.topic || 'Discussion'} - ${new Date().toLocaleDateString()}`,
      },
      include: {
        messages: true,
      },
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('conversations/:conversationId')
  @ApiOperation({ summary: 'Get conversation with message history' })
  async getConversation(
    @Param('conversationId') conversationId: string,
    @Req() req: ExpressRequest,
  ) {
    const user = req.user;
    const isPlatformAdmin = user?.roles?.includes('platform_admin');
    if (!isPlatformAdmin && !user?.tenantId) {
      throw new BadRequestException('TenantId is required');
    }

    return this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        tenantId: user.tenantId,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('conversations/:conversationId/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add message to conversation' })
  async addMessageToConversation(
    @Param('conversationId') conversationId: string,
    @Body() dto: any,
    @Req() req: ExpressRequest,
  ) {
    const user = req.user;
    const isPlatformAdmin = user?.roles?.includes('platform_admin');
    if (!isPlatformAdmin && !user?.tenantId) {
      throw new BadRequestException('TenantId is required');
    }

    // Verify conversation exists
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        tenantId: user.tenantId,
      },
    });

    if (!conversation) {
      throw new BadRequestException('Conversation not found');
    }

    const message = await this.prisma.message.create({
      data: {
        id: require('uuid').v4(),
        conversationId,
        role: dto.role,
        content: dto.content,
        metadata: dto.metadata,
      },
    });

    // Update conversation updated time
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  @UseGuards(JwtAuthGuard)
  @Get('conversations')
  @ApiOperation({ summary: 'List user conversations' })
  async listConversations(
    @Query('courseId') courseId?: string,
    @Req() req?: ExpressRequest,
  ) {
    const user = req?.user;
    const isPlatformAdmin = user?.roles?.includes('platform_admin');
    if (!isPlatformAdmin && !user?.tenantId) {
      throw new BadRequestException('TenantId is required');
    }

    return this.prisma.conversation.findMany({
      where: {
        tenantId: user.tenantId,
        userId: user.id,
        ...(courseId && { courseId }),
      },
      include: {
        messages: {
          select: {
            id: true,
            role: true,
            createdAt: true,
          },
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 50,
    });
  }

  // ============================================================================
  // Highlights/Annotations
  // ============================================================================

  @UseGuards(JwtAuthGuard)
  @Post('highlights')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a highlight/annotation' })
  async createHighlight(
    @Body() dto: any,
    @Req() req: ExpressRequest,
  ) {
    const user = req.user;
    const isPlatformAdmin = user?.roles?.includes('platform_admin');
    if (!isPlatformAdmin && !user?.tenantId) {
      throw new BadRequestException('TenantId is required');
    }

    return this.prisma.highlight.create({
      data: {
        id: require('uuid').v4(),
        tenantId: user.tenantId,
        lessonId: dto.lessonId,
        userId: user.id,
        text: dto.text,
        startPosition: dto.startPosition,
        endPosition: dto.endPosition,
        color: dto.color || 'yellow',
        notes: dto.notes,
      },
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('highlights/lesson/:lessonId')
  @ApiOperation({ summary: 'Get highlights for a lesson' })
  async getLessonHighlights(
    @Param('lessonId') lessonId: string,
    @Req() req: ExpressRequest,
  ) {
    const user = req.user;
    const isPlatformAdmin = user?.roles?.includes('platform_admin');
    if (!isPlatformAdmin && !user?.tenantId) {
      throw new BadRequestException('TenantId is required');
    }

    return this.prisma.highlight.findMany({
      where: {
        lessonId,
        tenantId: user.tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('highlights/my')
  @ApiOperation({ summary: 'Get current user highlights' })
  async getUserHighlights(
    @Req() req: ExpressRequest,
  ) {
    const user = req.user;
    const isPlatformAdmin = user?.roles?.includes('platform_admin');
    if (!isPlatformAdmin && !user?.tenantId) {
      throw new BadRequestException('TenantId is required');
    }

    return this.prisma.highlight.findMany({
      where: {
        tenantId: user.tenantId,
        userId: user.id,
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('highlights/:highlightId')
  @ApiOperation({ summary: 'Update a highlight' })
  async updateHighlight(
    @Param('highlightId') highlightId: string,
    @Body() dto: any,
    @Req() req: ExpressRequest,
  ) {
    const user = req.user;
    const isPlatformAdmin = user?.roles?.includes('platform_admin');
    if (!isPlatformAdmin && !user?.tenantId) {
      throw new BadRequestException('TenantId is required');
    }

    const highlight = await this.prisma.highlight.findFirst({
      where: {
        id: highlightId,
        tenantId: user.tenantId,
      },
    });

    if (!highlight) {
      throw new BadRequestException('Highlight not found');
    }

    return this.prisma.highlight.update({
      where: { id: highlightId },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
    });
  }
}

