import { Controller, Post, Body, UseGuards, Get, Query, Param, Patch, UseInterceptors, UploadedFile, Delete, Request, BadRequestException, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiConsumes, ApiParam, ApiQuery } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UploadVideoDto } from './dto/upload-video.dto';
import { AssignCourseDto, AssignBulkCourseDto } from './dto/assign-course.dto';
import { GenerateQuizFromVideoDto } from './dto/generate-quiz.dto';


@ApiTags('courses')
@ApiBearerAuth('access-token')
@Controller('courses')
export class CoursesController {
  constructor(private svc: CoursesService) {}

  private validateTenantAccess(userTenantId: string, requestedTenantId: string) {
    if (userTenantId !== requestedTenantId) {
      throw new BadRequestException('You do not have access to this tenant');
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('training_manager', 'org_admin')
  @Post()
  @ApiOperation({ 
    summary: 'Create a new course',
    description: 'Creates a new course. Requires training_manager role.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Course created successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        tenantId: '456e7890-e89b-12d3-a456-426614174000',
        title: 'Advanced JavaScript',
        summary: 'Learn advanced JavaScript concepts',
        level: 'Advanced',
        ownerUserId: '789f0123-e89b-12d3-a456-426614174000',
        createdAt: '2025-11-19T10:00:00Z',
        updatedAt: '2025-11-19T10:00:00Z'
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions or tenant mismatch' })
  async create(@Request() req, @Body() dto: CreateCourseDto) {
    this.validateTenantAccess(req.user.tenantId, dto.tenantId);
    return this.svc.create(dto.tenantId, dto.title, dto.summary, dto.level, dto.ownerUserId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('training_manager','org_admin','learner')
  @Get()
  @ApiOperation({ 
    summary: 'List all courses for a tenant',
    description: 'Retrieves all courses for the specified tenant.'
  })
  @ApiQuery({ name: 'tenantId', type: String, description: 'Tenant ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of courses',
    schema: {
      example: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          tenantId: '456e7890-e89b-12d3-a456-426614174000',
          title: 'Advanced JavaScript',
          summary: 'Learn advanced JavaScript concepts',
          level: 'Advanced',
          ownerUserId: '789f0123-e89b-12d3-a456-426614174000',
          createdAt: '2025-11-19T10:00:00Z'
        }
      ]
    }
  })
  async list(@Request() req, @Query('tenantId') tenantId: string) {
    this.validateTenantAccess(req.user.tenantId, tenantId);
    return this.svc.list(tenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('training_manager','org_admin','learner')
  @Get(':id')
  @ApiOperation({ 
    summary: 'Get course details with modules and lessons',
    description: 'Retrieves a single course with all its modules and lessons.'
  })
  @ApiParam({ name: 'id', type: String, description: 'Course ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Course details with hierarchy',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Advanced JavaScript',
        summary: 'Learn advanced JavaScript concepts',
        modules: [
          {
            id: 'mod-001',
            title: 'Module 1: Basics',
            lessons: [
              {
                id: 'les-001',
                title: 'Lesson 1: Introduction',
                description: 'Introduction to the module',
                videoUrl: 's3://bucket/videos/123e4567-e89b-12d3-a456-426614174000/les-001-timestamp.mp4',
                videoDuration: 3600,
                videoFileName: 'intro.mp4'
              }
            ]
          }
        ]
      }
    }
  })
  async get(@Request() req, @Param('id') id: string) {
    const course = await this.svc.get(id);
    if (course && req.user.tenantId !== course.tenantId) {
      throw new BadRequestException('You do not have access to this course');
    }
    return course;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('training_manager', 'org_admin')
  @Patch(':id')
  @ApiOperation({ 
    summary: 'Update course details',
    description: 'Updates course title, summary, and level.'
  })
  @ApiParam({ name: 'id', type: String, description: 'Course ID' })
  @ApiBody({ 
    schema: {
      example: {
        title: 'Updated Course Title',
        summary: 'Updated summary',
        level: 'Intermediate'
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Course updated successfully' })
  async update(@Request() req, @Param('id') id: string, @Body() body: any) {
    const course = await this.svc.get(id);
    if (course && req.user.tenantId !== course.tenantId) {
      throw new BadRequestException('You do not have access to this course');
    }
    return this.svc.update(id, body);
  }

  // Module endpoints
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('training_manager', 'org_admin')
  @Post('modules/create')
  @ApiOperation({ 
    summary: 'Create a new module in a course',
    description: 'Creates a new module within a course. Requires training_manager role.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Module created successfully',
    schema: {
      example: {
        id: 'mod-001',
        courseId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Module 1: Fundamentals',
        description: 'Learn the fundamentals',
        displayOrder: 1,
        status: 'active',
        createdAt: '2025-11-19T10:00:00Z'
      }
    }
  })
  async createModule(@Request() req, @Body() dto: CreateModuleDto) {
    return this.svc.createModule(dto.courseId, dto.title, dto.description, dto.displayOrder, req.user.tenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('training_manager','org_admin','learner')
  @Get('course/:courseId/modules')
  @ApiOperation({ 
    summary: 'List all modules in a course',
    description: 'Retrieves all modules for a specific course.'
  })
  @ApiParam({ name: 'courseId', type: String, description: 'Course ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of modules',
    schema: {
      example: [
        {
          id: 'mod-001',
          courseId: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Module 1: Fundamentals',
          description: 'Learn the fundamentals',
          displayOrder: 1,
          status: 'active',
          lessons: []
        }
      ]
    }
  })
  async getModulesByCourse(@Request() req, @Param('courseId') courseId: string) {
    const course = await this.svc.get(courseId);
    if (course && req.user.tenantId !== course.tenantId) {
      throw new BadRequestException('You do not have access to this course');
    }
    return this.svc.getModulesByCourse(courseId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('training_manager','org_admin','learner')
  @Get('modules/:moduleId')
  @ApiOperation({ 
    summary: 'Get module details with lessons',
    description: 'Retrieves a single module with all its lessons.'
  })
  @ApiParam({ name: 'moduleId', type: String, description: 'Module ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Module details with lessons'
  })
  async getModule(@Request() req, @Param('moduleId') moduleId: string) {
    return this.svc.getModule(moduleId, req.user.tenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('training_manager', 'org_admin')
  @Patch('modules/:moduleId')
  @ApiOperation({ 
    summary: 'Update module details',
    description: 'Updates module title, description, or display order.'
  })
  @ApiParam({ name: 'moduleId', type: String, description: 'Module ID' })
  @ApiResponse({ status: 200, description: 'Module updated successfully' })
  async updateModule(@Request() req, @Param('moduleId') moduleId: string, @Body() body: any) {
    return this.svc.updateModule(moduleId, body, req.user.tenantId);
  }

  // Lesson endpoints
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('training_manager', 'org_admin')
  @Post('lessons/create')
  @ApiOperation({ 
    summary: 'Create a new lesson in a module',
    description: 'Creates a new lesson within a module. Requires training_manager role.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Lesson created successfully',
    schema: {
      example: {
        id: 'les-001',
        moduleId: 'mod-001',
        title: 'Lesson 1: Getting Started',
        description: 'Introduction to the topic',
        displayOrder: 1,
        status: 'active',
        videoUrl: null,
        videoDuration: null,
        videoFileName: null,
        createdAt: '2025-11-19T10:00:00Z'
      }
    }
  })
  async createLesson(@Request() req, @Body() dto: CreateLessonDto) {
    return this.svc.createLesson(dto.moduleId, dto.title, dto.description, dto.displayOrder, req.user.tenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('training_manager','org_admin','learner')
  @Get('lessons/:lessonId')
  @ApiOperation({ 
    summary: 'Get lesson details',
    description: 'Retrieves a single lesson with its video information.'
  })
  @ApiParam({ name: 'lessonId', type: String, description: 'Lesson ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lesson details including video'
  })
  async getLesson(@Request() req, @Param('lessonId') lessonId: string) {
    return this.svc.getLesson(lessonId, req.user.tenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('training_manager', 'org_admin')
  @Patch('lessons/:lessonId')
  @ApiOperation({ 
    summary: 'Update lesson details',
    description: 'Updates lesson title, description, or display order.'
  })
  @ApiParam({ name: 'lessonId', type: String, description: 'Lesson ID' })
  @ApiResponse({ status: 200, description: 'Lesson updated successfully' })
  async updateLesson(@Request() req, @Param('lessonId') lessonId: string, @Body() body: any) {
    return this.svc.updateLesson(lessonId, body, req.user.tenantId);
  }

  // Video upload endpoints
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('training_manager', 'org_admin')
  @Post('lessons/:lessonId/upload-video')
  @UseInterceptors(FileInterceptor('video', {
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ 
    summary: 'Upload video for a lesson',
    description: 'Uploads a video file to S3 and associates it with a lesson. Max file size: 500MB.'
  })
  @ApiParam({ name: 'lessonId', type: String, description: 'Lesson ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        video: {
          type: 'string',
          format: 'binary',
          description: 'Video file (mp4, webm, etc.)'
        },
        videoDuration: {
          type: 'number',
          description: 'Video duration in seconds (optional)',
          example: 3600
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Video uploaded successfully',
    schema: {
      example: {
        lessonId: 'les-001',
        videoUrl: 's3://bucket/videos/123e4567-e89b-12d3-a456-426614174000/les-001-1637324400000.mp4',
        videoFileName: 'lecture.mp4',
        videoDuration: 3600,
        message: 'Video uploaded successfully'
      }
    }
  })
  @ApiResponse({ status: 413, description: 'File size exceeds 500MB limit' })
  async uploadVideo(
    @Request() req,
    @Param('lessonId') lessonId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadVideoDto,
  ) {
    return this.svc.uploadVideo(lessonId, file, dto.videoDuration, req.user.tenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('training_manager', 'org_admin')
  @Delete('lessons/:lessonId/video')
  @ApiOperation({ 
    summary: 'Delete video from a lesson',
    description: 'Removes the video file from S3 and the lesson.'
  })
  @ApiParam({ name: 'lessonId', type: String, description: 'Lesson ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Video deleted successfully',
    schema: {
      example: {
        message: 'Video deleted successfully'
      }
    }
  })
  async deleteVideo(@Request() req, @Param('lessonId') lessonId: string) {
    return this.svc.deleteVideo(lessonId, req.user.tenantId);
  }

  // ============================================================================
  // Course Assignment & Progress Endpoints
  // ============================================================================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('training_manager', 'org_admin')
  @Post('assign')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Assign a course to users',
    description: `Assigns a course to one or more users in the tenant.
    
Features:
- Bulk assignment to multiple users
- Optional due date
- Automatic progress tracking initialization
- Prevents duplicate assignments
- Creates UserProgress records for tracking

Only training_manager and org_admin roles can assign courses.`
  })
  @ApiBody({ type: AssignCourseDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Course assigned successfully',
    schema: {
      example: {
        courseId: '123e4567-e89b-12d3-a456-426614174000',
        course: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Advanced JavaScript',
          lessonsTotal: 24
        },
        assignedToCount: 3,
        results: [
          {
            userId: 'user-1',
            status: 'assigned',
            assignmentId: 'assignment-id-1',
            progressId: 'progress-id-1'
          },
          {
            userId: 'user-2',
            status: 'already_assigned',
            assignmentId: 'assignment-id-2'
          }
        ],
        dueDate: '2025-12-31T23:59:59Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async assignCourse(@Request() req, @Body() dto: AssignCourseDto) {
    this.validateTenantAccess(req.user.tenantId, dto.tenantId);
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : undefined;
    const courseLink = dto.courseLink;
    return this.svc.assignCourseToUsers(dto.tenantId, dto.courseId, dto.assignToUserIds, req.user.id, dueDate, courseLink);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('training_manager', 'org_admin')
  @Post('assign-bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Bulk assign multiple courses to users',
    description: 'Assigns multiple courses to multiple users in a single operation.'
  })
  @ApiBody({ type: AssignBulkCourseDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Courses assigned successfully'
  })
  async assignBulkCourses(@Request() req, @Body() dto: AssignBulkCourseDto) {
    this.validateTenantAccess(req.user.tenantId, dto.tenantId);
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : undefined;
    
    const results = await Promise.all(
      dto.courseIds.map(courseId => 
        this.svc.assignCourseToUsers(dto.tenantId, courseId, dto.assignToUserIds, req.user.id, dueDate)
      )
    );

    return {
      totalCoursesAssigned: dto.courseIds.length,
      totalUsersAssigned: dto.assignToUserIds.length,
      results
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('progress/:courseId')
  @ApiOperation({ 
    summary: 'Get user progress for a course',
    description: `Retrieves detailed progress tracking for a user in a specific course.
    
Returns:
- Overall progress percentage
- Lessons completed vs total
- Per-module and per-lesson progress
- Video watched duration
- Completion dates and timestamps`
  })
  @ApiParam({ name: 'courseId', type: String, description: 'Course ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'User course progress',
    schema: {
      example: {
        userId: 'user-id-123',
        course: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Advanced JavaScript'
        },
        overallProgress: {
          status: 'in_progress',
          progressPercentage: 45,
          lessonsCompleted: 11,
          lessonsTotal: 24,
          startedAt: '2025-11-15T10:00:00Z',
          completedAt: null,
          lastAccessedAt: '2025-11-19T14:30:00Z'
        },
        assignment: {
          dueDate: '2025-12-31T23:59:59Z',
          assignedAt: '2025-11-15T09:00:00Z',
          completedAt: null,
          status: 'assigned'
        },
        moduleProgress: [
          {
            module: {
              id: 'mod-1',
              title: 'Module 1: Basics'
            },
            lessons: [
              {
                lessonId: 'les-1',
                lessonTitle: 'Lesson 1: Introduction',
                status: 'completed',
                watchedDuration: 3600,
                totalDuration: 3600,
                isCompleted: true,
                completedAt: '2025-11-15T11:00:00Z',
                startedAt: '2025-11-15T10:00:00Z'
              }
            ]
          }
        ]
      }
    }
  })
  @ApiResponse({ status: 404, description: 'User not assigned to course' })
  async getUserCourseProgress(@Request() req, @Param('courseId') courseId: string) {
    return this.svc.getUserCourseProgress(req.user.id, courseId, req.user.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-courses')
  @ApiOperation({ 
    summary: 'Get all courses assigned to authenticated user',
    description: 'Lists all courses assigned to the current user with progress information.'
  })
  @ApiQuery({ name: 'status', type: String, required: false, description: 'Filter by assignment status (assigned, started, completed, expired)' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of assigned courses with progress',
    schema: {
      example: [
        {
          assignmentId: 'assignment-id-1',
          course: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            title: 'Advanced JavaScript',
            summary: 'Master advanced JS concepts',
            level: 'Advanced'
          },
          assignmentStatus: 'started',
          dueDate: '2025-12-31T23:59:59Z',
          assignedAt: '2025-11-15T09:00:00Z',
          completedAt: null,
          progress: {
            progressPercentage: 45,
            lessonsCompleted: 11,
            lessonsTotal: 24,
            status: 'in_progress'
          }
        }
      ]
    }
  })
  async getMyAssignedCourses(@Request() req, @Query('status') status?: string) {
    return this.svc.getUserAssignedCourses(req.user.id, req.user.tenantId, status);
  }

  @UseGuards(JwtAuthGuard)
  @Post('lessons/:lessonId/progress')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Update user progress for a lesson',
    description: `Records user progress when watching a lesson video.
    
Tracks:
- Video watched duration in seconds
- Lesson completion status
- Auto-calculates course progress percentage
- Updates module completion status`
  })
  @ApiParam({ name: 'lessonId', type: String, description: 'Lesson ID' })
  @ApiBody({
    schema: {
      example: {
        watchedDuration: 1800,
        isCompleted: false
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Progress updated successfully',
    schema: {
      example: {
        lessonProgress: {
          lessonId: 'les-1',
          status: 'in_progress',
          watchedDuration: 1800,
          isCompleted: false,
          completedAt: null
        },
        courseProgress: {
          progressPercentage: 25,
          lessonsCompleted: 6,
          lessonsTotal: 24,
          status: 'in_progress'
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Lesson or course assignment not found' })
  async updateLessonProgress(
    @Request() req,
    @Param('lessonId') lessonId: string,
    @Body() body: { watchedDuration: number; isCompleted: boolean }
  ) {
    if (body.watchedDuration === undefined || body.isCompleted === undefined) {
      throw new BadRequestException('watchedDuration and isCompleted are required');
    }
    return this.svc.updateLessonProgress(req.user.id, lessonId, req.user.tenantId, body.watchedDuration, body.isCompleted);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('training_manager', 'org_admin')
  @Get('tenant-stats')
  @ApiOperation({ 
    summary: 'Get course statistics for tenant',
    description: `Returns aggregate statistics about course assignments and completion.
    
Statistics include:
- Total courses and assignments
- User progress distribution
- Average completion percentage
- Overdue assignments`
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Tenant course statistics',
    schema: {
      example: {
        totalCourses: 15,
        totalAssignments: 150,
        totalUsers: 50,
        averageProgress: 62,
        userProgressByStatus: {
          'not_started': 25,
          'in_progress': 20,
          'completed': 5
        },
        overdueAssignments: 8
      }
    }
  })
  async getTenantStats(@Request() req) {
    return this.svc.getCourseTenantStats(req.user.tenantId);
  }

  // ============================================================================
  // Quiz Generation Endpoints (AI-Powered)
  // ============================================================================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('training_manager', 'instructor', 'org_admin')
  @Post('lessons/:lessonId/generate-quizzes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Generate quizzes from video content using AI',
    description: `Generates 6 multiple-choice quizzes from video content using OpenAI's GPT-4 model.
    
Features:
- Automatically generates exactly 6 quizzes
- Each quiz has 4 multiple-choice options
- Includes difficulty levels (easy, medium, hard)
- Provides explanations for correct answers
- Saves generated quizzes to database
- Returns structured quiz data with questions and options

The video content can be:
1. Raw transcript/subtitles
2. Lesson summary
3. Video description

Generated quizzes are immediately available for student attempts.`
  })
  @ApiParam({ name: 'lessonId', type: String, description: 'Lesson ID to generate quizzes for' })
  @ApiBody({ type: GenerateQuizFromVideoDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Quizzes generated successfully',
    schema: {
      example: {
        quizzes: [
          {
            id: 'quiz-id-1',
            title: 'Quiz 1: Fundamentals',
            description: 'Assessment of fundamental concepts',
            passingScore: 70,
            questionCount: 1,
            questions: [
              {
                id: 'question-1',
                questionText: 'What is the primary purpose of...?',
                explanation: 'The correct answer is B because...',
                order: 1,
                options: [
                  {
                    id: 'option-1',
                    optionText: 'Option A',
                    order: 0
                  },
                  {
                    id: 'option-2',
                    optionText: 'Option B (Correct)',
                    order: 1
                  },
                  {
                    id: 'option-3',
                    optionText: 'Option C',
                    order: 2
                  },
                  {
                    id: 'option-4',
                    optionText: 'Option D',
                    order: 3
                  }
                ]
              }
            ]
          }
        ],
        generatedAt: '2025-11-27T10:30:00Z',
        lessonId: 'les-001',
        videoContentSummary: 'First 200 characters of processed content...'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Missing video content or invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  @ApiResponse({ status: 500, description: 'OpenAI API error or database error' })
  async generateQuizzesFromVideo(
    @Request() req,
    @Param('lessonId') lessonId: string,
    @Body() dto: GenerateQuizFromVideoDto
  ): Promise<any> {
    if (!dto.videoContent || dto.videoContent.trim().length === 0) {
      throw new BadRequestException('videoContent is required and cannot be empty');
    }

    const course = await this.svc.get(dto.courseId);
    if (!course || req.user.tenantId !== course.tenantId) {
      throw new BadRequestException('You do not have access to this course');
    }

    return this.svc.generateQuizzesFromVideo(lessonId, dto.videoContent, dto.courseId, req.user.tenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('training_manager', 'org_admin')
  @Post('lessons/:lessonId/generate-quizzes-from-summary')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Generate quizzes from stored video summary',
    description: `Generates 6 multiple-choice quizzes from the video summary that was automatically created during video upload.
    
This is more efficient than the raw video content method:
- Uses AI-processed video summary
- Faster generation
- Better quiz quality
- No need to provide raw transcript

Note: Video summary is automatically generated when you upload a video using the /upload-video endpoint.`
  })
  @ApiParam({ name: 'lessonId', type: String, description: 'Lesson ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        courseId: {
          type: 'string',
          description: 'Course ID',
          example: 'course-123'
        }
      },
      required: ['courseId']
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Quizzes generated from summary successfully'
  })
  @ApiResponse({ status: 400, description: 'Lesson has no video summary' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  async generateQuizzesFromStoredSummary(
    @Request() req,
    @Param('lessonId') lessonId: string,
    @Body('courseId') courseId: string
  ): Promise<any> {
    if (!courseId) {
      throw new BadRequestException('courseId is required');
    }

    const course = await this.svc.get(courseId);
    if (!course || req.user.tenantId !== course.tenantId) {
      throw new BadRequestException('You do not have access to this course');
    }

    return this.svc.generateQuizzesFromStoredSummary(lessonId, courseId, req.user.tenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('training_manager', 'instructor', 'org_admin', 'learner', 'viewer')
  @Get('lessons/:lessonId/quizzes')
  @ApiOperation({ 
    summary: 'List all quizzes for a lesson',
    description: 'Retrieves all quizzes associated with a specific lesson.'
  })
  @ApiParam({ name: 'lessonId', type: String, description: 'Lesson ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of quizzes for the lesson',
    schema: {
      example: [
        {
          id: 'quiz-id-1',
          title: 'Quiz 1',
          passingScore: 70,
          questionCount: 1
        }
      ]
    }
  })
  async getQuizzesForLesson(
    @Request() req,
    @Param('lessonId') lessonId: string
  ) {
    return this.svc.getQuizzesForLesson(lessonId, req.user.tenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('training_manager', 'instructor', 'org_admin', 'learner', 'viewer')
  @Get('quizzes/:quizId')
  @ApiOperation({ 
    summary: 'Get quiz details with questions and options',
    description: 'Retrieves full quiz structure including all questions and answer options.'
  })
  @ApiParam({ name: 'quizId', type: String, description: 'Quiz ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Quiz details',
    schema: {
      example: {
        id: 'quiz-id-1',
        title: 'Quiz 1: Fundamentals',
        description: 'Assessment quiz for the lesson',
        passingScore: 70,
        questions: [
          {
            id: 'question-1',
            questionText: 'What is the primary purpose...?',
            explanation: 'Explanation for the correct answer',
            options: [
              {
                id: 'option-1',
                optionText: 'Option A',
                order: 0
              }
            ]
          }
        ]
      }
    }
  })
  async getQuizDetails(
    @Request() req,
    @Param('quizId') quizId: string
  ) {
    return this.svc.getQuizDetails(quizId, req.user.tenantId);
  }

  // ============================================================================
  // Video Content Generation (OpenAI Only)
  // ============================================================================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('training_manager', 'instructor', 'org_admin')
  @Post('lessons/:lessonId/generate-summary-openai')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Generate video summary using OpenAI (No Transcribe)',
    description: `Generate video summary directly from video file using OpenAI Vision API.
    
⚡ FASTER ALTERNATIVE to AWS Transcribe:
- Generates summary in 1-2 minutes (vs 5-30 minutes for Transcribe)
- Perfect when you just need a summary, not full transcript
- Uses OpenAI's vision capabilities to analyze video content
- Automatically includes suggested quiz topics

Response includes:
- Comprehensive educational summary (300-500 words)
- Suggested quiz topics extracted from the video
- Generated timestamp

Process:
1. Sends video from S3 directly to OpenAI
2. OpenAI analyzes video and generates summary
3. Summary saved to lesson's videoSummary field
4. Returns both summary and quiz topics`,
  })
  @ApiParam({ name: 'lessonId', type: String, description: 'Lesson ID with uploaded video' })
  @ApiQuery({ name: 'courseId', type: String, description: 'Course ID for access validation' })
  @ApiResponse({ 
    status: 200, 
    description: 'Video summary generated successfully via OpenAI',
    schema: {
      example: {
        lessonId: 'les-001',
        videoUrl: 's3://bucket/video.mp4',
        summary: `SUMMARY:
JavaScript is a versatile programming language that runs in web browsers and on servers. Key concepts include variables, functions, and event handling. This video covers the fundamentals needed for web development...

QUIZ TOPICS:
- JavaScript basics and variable types
- Functions and scope in JavaScript
- DOM manipulation and event listeners
- Promises and async/await patterns
...`,
        message: 'Video summary generated successfully using OpenAI',
        generatedAt: '2025-12-04T10:00:00Z',
        saved: true,
        videoSummaryUpdated: true
      }
    }
  })
  @ApiResponse({ status: 400, description: 'No video found for lesson' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'OpenAI API error' })
  async generateSummaryFromVideoOpenAI(
    @Request() req,
    @Param('lessonId') lessonId: string,
    @Query('courseId') courseId: string
  ): Promise<any> {
    if (!courseId) {
      throw new BadRequestException('courseId query parameter is required');
    }

    const course = await this.svc.get(courseId);
    if (!course || req.user.tenantId !== course.tenantId) {
      throw new BadRequestException('You do not have access to this course');
    }

    return this.svc.generateSummaryFromVideoFile(lessonId, courseId, req.user.tenantId);
  }
}
