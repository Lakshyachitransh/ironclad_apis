import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExerciseDto, UpdateExerciseDto, SubmitExerciseDto } from './exercises.dto';
import { AITutorService, AIFeedbackResponse } from './ai-tutor.service';
import { CodeValidationService, TestResult } from './code-validation.service';
import { ExerciseTemplateGeneratorService, ExerciseTemplateStructure } from './exercise-template-generator.service';

@Injectable()
export class ExercisesService {
  constructor(
    private prisma: PrismaService,
    private aiTutor: AITutorService,
    private codeValidator: CodeValidationService,
    private templateGenerator: ExerciseTemplateGeneratorService,
  ) {}

  /**
   * Create a new exercise template
   */
  async createExerciseTemplate(params: {
    tenantId: string;
    name: string;
    description?: string;
    category: string;
    structure: string;
    createdBy: string;
  }) {
    try {
      const structure = JSON.parse(params.structure);
      const validation = this.templateGenerator.validateTemplate(structure);

      if (!validation.valid) {
        throw new BadRequestException(`Invalid template: ${validation.errors.join(', ')}`);
      }

      return await this.prisma.exerciseTemplate.create({
        data: {
          tenantId: params.tenantId,
          name: params.name,
          description: params.description,
          category: params.category,
          structure: params.structure,
          createdBy: params.createdBy,
        },
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to create exercise template');
    }
  }

  /**
   * Get all exercise templates for a tenant
   */
  async getExerciseTemplates(params: { tenantId: string; category?: string }) {
    return await this.prisma.exerciseTemplate.findMany({
      where: {
        tenantId: params.tenantId,
        status: 'active',
        ...(params.category && { category: params.category }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        createdAt: true,
        createdBy: true,
      },
    });
  }

  /**
   * Create a new exercise
   */
  async createExercise(params: {
    tenantId: string;
    lessonId: string;
    createdBy: string;
    dto: CreateExerciseDto;
  }) {
    // Validate lesson exists
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: params.dto.lessonId },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // Validate template if provided
    if (params.dto.templateId) {
      const template = await this.prisma.exerciseTemplate.findUnique({
        where: { id: params.dto.templateId },
      });

      if (!template || template.tenantId !== params.tenantId) {
        throw new NotFoundException('Template not found');
      }
    }

    // Parse and validate JSON fields
    try {
      JSON.parse(params.dto.testCases);
      JSON.parse(params.dto.highlightedSections);
      if (params.dto.multipleChoiceOptions) {
        JSON.parse(params.dto.multipleChoiceOptions);
      }
    } catch (error) {
      throw new BadRequestException('Invalid JSON in test cases, highlights, or options');
    }

    return await this.prisma.exercise.create({
      data: {
        lessonId: params.dto.lessonId,
        tenantId: params.tenantId,
        templateId: params.dto.templateId,
        title: params.dto.title,
        description: params.dto.description,
        instructions: typeof params.dto.instructions === 'string' ? params.dto.instructions : JSON.stringify(params.dto.instructions),
        difficulty: params.dto.difficulty,
        category: params.dto.category,
        startingCode: params.dto.startingCode,
        expectedOutput: params.dto.expectedOutput,
        testCases: params.dto.testCases,
        highlightedSections: params.dto.highlightedSections,
        multipleChoiceOptions: params.dto.multipleChoiceOptions,
        createdBy: params.createdBy,
      },
      include: {
        lesson: {
          select: { id: true, title: true },
        },
      },
    });
  }

  /**
   * Get exercise by ID
   */
  async getExercise(params: { exerciseId: string; tenantId: string }) {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id: params.exerciseId },
      include: {
        lesson: {
          select: { id: true, title: true, moduleId: true },
        },
        template: {
          select: { id: true, name: true, category: true },
        },
      },
    });

    if (!exercise || exercise.tenantId !== params.tenantId) {
      throw new NotFoundException('Exercise not found');
    }

    return exercise;
  }

  /**
   * Get all exercises for a lesson
   */
  async getExercisesByLesson(params: { lessonId: string; tenantId: string }) {
    return await this.prisma.exercise.findMany({
      where: {
        lessonId: params.lessonId,
        tenantId: params.tenantId,
        status: 'published',
      },
      select: {
        id: true,
        title: true,
        description: true,
        difficulty: true,
        category: true,
        createdAt: true,
      },
    });
  }

  /**
   * Update exercise
   */
  async updateExercise(params: {
    exerciseId: string;
    tenantId: string;
    dto: UpdateExerciseDto;
  }) {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id: params.exerciseId },
    });

    if (!exercise || exercise.tenantId !== params.tenantId) {
      throw new NotFoundException('Exercise not found');
    }

    return await this.prisma.exercise.update({
      where: { id: params.exerciseId },
      data: params.dto,
    });
  }

  /**
   * Submit exercise code
   */
  async submitExercise(params: {
    exerciseId: string;
    userId: string;
    tenantId: string;
    dto: SubmitExerciseDto;
  }) {
    const exercise = await this.getExercise({ exerciseId: params.exerciseId, tenantId: params.tenantId });

    // Validate code syntax
    const syntaxCheck = await this.codeValidator.validateCodeSyntax(params.dto.submittedCode);
    if (!syntaxCheck.valid) {
      throw new BadRequestException(`Syntax error: ${syntaxCheck.errors.join(', ')}`);
    }

    // Run test cases
    const testCases = JSON.parse(exercise.testCases);
    const testResults = await this.codeValidator.runTestCases({
      submittedCode: params.dto.submittedCode,
      testCases,
    });

    // Get or create exercise attempt
    let attempt = await this.prisma.exerciseAttempt.findFirst({
      where: {
        exerciseId: params.exerciseId,
        userId: params.userId,
        completedAt: null,
      },
    });

    if (!attempt) {
      attempt = await this.prisma.exerciseAttempt.create({
        data: {
          exerciseId: params.exerciseId,
          tenantId: params.tenantId,
          userId: params.userId,
        },
      });
    }

    // Create submission
    const submission = await this.prisma.exerciseSubmission.create({
      data: {
        exerciseId: params.exerciseId,
        lessonId: exercise.lessonId,
        tenantId: params.tenantId,
        userId: params.userId,
        submittedCode: params.dto.submittedCode,
        selectedOption: params.dto.selectedOption,
        output: params.dto.output,
        testResults: JSON.stringify(testResults),
        attemptId: attempt.id,
      },
    });

    // Get AI feedback
    const feedback = await this.aiTutor.evaluateCodeSubmission({
      studentCode: params.dto.submittedCode,
      expectedCode: exercise.expectedOutput,
      testResults,
      instructions: exercise.instructions,
      difficulty: exercise.difficulty,
      category: exercise.category,
    });

    // Update submission with feedback and score
    await this.prisma.exerciseSubmission.update({
      where: { id: submission.id },
      data: {
        score: feedback.score,
        feedback: JSON.stringify(feedback),
        status: 'reviewed',
      },
    });

    // Check if all tests passed
    const allPassed = testResults.every(t => t.passed);
    if (allPassed) {
      await this.prisma.exerciseAttempt.update({
        where: { id: attempt.id },
        data: {
          passed: true,
          completedAt: new Date(),
        },
      });
    }

    return {
      submission: {
        id: submission.id,
        score: feedback.score,
        status: 'reviewed',
      },
      testResults,
      feedback,
      qualityAnalysis: this.codeValidator.analyzeCodeQuality(params.dto.submittedCode),
    };
  }

  /**
   * Get submissions for user
   */
  async getUserSubmissions(params: {
    userId: string;
    exerciseId?: string;
    tenantId: string;
    limit?: number;
    offset?: number;
  }) {
    const submissions = await this.prisma.exerciseSubmission.findMany({
      where: {
        userId: params.userId,
        tenantId: params.tenantId,
        ...(params.exerciseId && { exerciseId: params.exerciseId }),
      },
      include: {
        exercise: {
          select: { id: true, title: true, difficulty: true },
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: params.limit || 10,
      skip: params.offset || 0,
    });

    return submissions.map(s => ({
      id: s.id,
      exerciseTitle: s.exercise.title,
      exerciseDifficulty: s.exercise.difficulty,
      score: s.score,
      status: s.status,
      submittedAt: s.submittedAt,
    }));
  }

  /**
   * Get submission details
   */
  async getSubmissionDetails(params: { submissionId: string; userId: string; tenantId: string }) {
    const submission = await this.prisma.exerciseSubmission.findUnique({
      where: { id: params.submissionId },
      include: {
        exercise: true,
      },
    });

    if (!submission || submission.userId !== params.userId || submission.tenantId !== params.tenantId) {
      throw new NotFoundException('Submission not found');
    }

    return {
      id: submission.id,
      exercise: {
        id: submission.exercise.id,
        title: submission.exercise.title,
        category: submission.exercise.category,
      },
      submittedCode: submission.submittedCode,
      score: submission.score,
      feedback: submission.feedback ? JSON.parse(submission.feedback) : null,
      testResults: submission.testResults ? JSON.parse(submission.testResults) : [],
      submittedAt: submission.submittedAt,
    };
  }

  /**
   * Get AI hint for student
   */
  async getHint(params: {
    exerciseId: string;
    userId: string;
    tenantId: string;
    lastAttemptCode?: string;
  }) {
    const exercise = await this.getExercise({ exerciseId: params.exerciseId, tenantId: params.tenantId });

    const highlights = JSON.parse(exercise.highlightedSections);
    const hints = highlights.map((h: any) => h.hint || h.explanation).filter((h: any) => h);

    const hint = await this.aiTutor.generateHint({
      exerciseTitle: exercise.title,
      studentCode: params.lastAttemptCode || exercise.startingCode,
      highlightedHints: hints,
      category: exercise.category,
    });

    return { hint };
  }

  /**
   * Suggest edge cases for testing
   */
  async suggestEdgeCases(params: { exerciseId: string; tenantId: string; lastAttemptCode?: string }) {
    const exercise = await this.getExercise({ exerciseId: params.exerciseId, tenantId: params.tenantId });

    const suggestions = this.codeValidator.suggestEdgeCases(
      params.lastAttemptCode || exercise.startingCode,
    );

    return { suggestions };
  }

  /**
   * Generate exercise from template
   */
  async generateExerciseFromTemplate(params: {
    tenantId: string;
    templateId: string;
    lessonId: string;
    title: string;
    startingCode: string;
    expectedOutput: string;
    testCases: string;
    difficulty: string;
    createdBy: string;
  }) {
    const template = await this.prisma.exerciseTemplate.findUnique({
      where: { id: params.templateId },
    });

    if (!template || template.tenantId !== params.tenantId) {
      throw new NotFoundException('Template not found');
    }

    const structure = JSON.parse(template.structure);

    // Generate highlighted sections from template
    const highlightedSections = structure.highlightedTexts.map((h: any, index: number) => ({
      start: index * 10,
      end: (index + 1) * 10,
      hint: h.hint,
      explanation: h.hint,
    }));

    return await this.createExercise({
      tenantId: params.tenantId,
      lessonId: params.lessonId,
      createdBy: params.createdBy,
      dto: {
        lessonId: params.lessonId,
        templateId: params.templateId,
        title: params.title,
        instructions: structure.instructions || template.description,
        difficulty: params.difficulty as any,
        category: template.category as any,
        startingCode: params.startingCode,
        expectedOutput: params.expectedOutput,
        testCases: params.testCases,
        highlightedSections: JSON.stringify(highlightedSections),
      },
    });
  }

  /**
   * Generate exercises from course content
   * Teacher/admin provides: difficulty, category, courseId, tenantId
   * System fetches course structure and generates relevant exercises
   */
  async generateExercisesFromCourse(params: {
    courseId: string;
    tenantId: string;
    difficulty: string;
    category: string;
    count?: number;
    lessonId?: string;
  }) {
    try {
      // 1. Fetch course with modules and lessons
      const course = await this.prisma.course.findFirst({
        where: {
          id: params.courseId,
          tenantId: params.tenantId,
        },
        include: {
          modules: {
            include: {
              lessons: true,
            },
          },
        },
      });

      if (!course) {
        throw new NotFoundException('Course not found');
      }

      // 2. Get lesson content (filter if specific lesson provided)
      let lessonContent: string[] = [];
      const lessons = params.lessonId
        ? course.modules.flatMap(m => m.lessons.filter(l => l.id === params.lessonId))
        : course.modules.flatMap(m => m.lessons);

      lessonContent = lessons
        .map(lesson => `${lesson.title}: ${lesson.description || ''} (Video Summary: ${lesson.videoSummary || 'N/A'})`)
        .filter(content => content.length > 0);

      if (lessonContent.length === 0) {
        throw new BadRequestException('No lesson content found for course');
      }

      // 3. Generate exercises using AI tutor
      const exerciseCount = params.count || 3;
      const generatedExercises = [];

      for (let i = 0; i < exerciseCount; i++) {
        const exercisePrompt = `
          Course: ${course.title}
          Level: ${course.level || 'intermediate'}
          Difficulty: ${params.difficulty}
          Category: ${params.category}
          
          Based on this lesson content:
          ${lessonContent[i % lessonContent.length]}
          
          Generate a ${params.difficulty} level ${params.category} exercise.
          
          Return a JSON object with:
          {
            "title": "Exercise title",
            "description": "Detailed description",
            "instructions": "Step-by-step instructions",
            "startingCode": "Initial code provided",
            "expectedOutput": "Expected output",
            "testCases": [{"input": "...", "expectedOutput": "..."}],
            "hints": ["Hint 1", "Hint 2"]
          }
        `;

        try {
          const aiResponse = await this.aiTutor.generateExerciseDynamic({
            topic: lessonContent[i % lessonContent.length],
            difficulty: params.difficulty,
            category: params.category,
            description: course.title,
          });

          // 4. Create exercise from AI response
          const exercise = await this.prisma.exercise.create({
            data: {
              tenantId: String(params.tenantId),
              lessonId: String(lessons[i % lessons.length].id),
              title: aiResponse.title || `${params.category} Exercise ${i + 1}`,
              description: aiResponse.description || aiResponse.instructions || 'Auto-generated exercise',
              instructions: aiResponse.instructions,
              difficulty: params.difficulty as any,
              category: params.category as any,
              startingCode: aiResponse.startingCode || '',
              expectedOutput: aiResponse.expectedOutput || '',
              testCases: JSON.stringify(aiResponse.testCases || []),
              highlightedSections: JSON.stringify(aiResponse.highlightedSections || []),
              multipleChoiceOptions: null,
              status: 'draft',
              createdBy: 'system',
            },
          });

          generatedExercises.push(exercise);
        } catch (error) {
          console.error(`Error generating exercise ${i + 1}:`, error);
          // Continue with next exercise if one fails
        }
      }

      return {
        success: true,
        courseId: params.courseId,
        course: course.title,
        difficulty: params.difficulty,
        category: params.category,
        generatedCount: generatedExercises.length,
        exercises: generatedExercises.map(ex => ({
          id: ex.id,
          title: ex.title,
          difficulty: ex.difficulty,
          category: ex.category,
          lesson: lessons.find(l => l.id === ex.lessonId)?.title,
        })),
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to generate exercises from course');
    }
  }
}
