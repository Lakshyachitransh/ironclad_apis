import { Controller, Post, Body, UseGuards, Get, Query, Param, Patch, UseInterceptors, UploadedFile, Delete, Request, BadRequestException, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiConsumes, ApiParam, ApiQuery } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UploadVideoDto } from './dto/upload-video.dto';
import { AssignCourseDto, AssignBulkCourseDto } from './dto/assign-course.dto';
import { GenerateQuizFromVideoDto } from './dto/generate-quiz.dto';
import { ProcessVideoUrlDto, GenerateVideoSummaryDto, GenerateQuizFromVideoDto as GenerateQuizFromVideoDto2 } from './dto/process-video.dto';
import { VideoProcessingService } from './services/video-processing.service';


@ApiTags('courses')
@ApiBearerAuth('access-token')
@Controller('courses')
export class CoursesController {
  constructor(
    private svc: CoursesService,
    private videoProcessing: VideoProcessingService
  ) {}

  private validateTenantAccess(userTenantId: string, requestedTenantId: string) {
    if (userTenantId !== requestedTenantId) {
      throw new BadRequestException('You do not have access to this tenant');
    }
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('courses.create')
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

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('courses.read')
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

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('courses.read')
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

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('courses.update')
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
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('courses.update')
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

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('courses.read')
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

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('courses.read')
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

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('courses.update')
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
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('courses.update')
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

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('courses.read')
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

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('courses.update')
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
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('courses.update')
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

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('courses.delete')
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

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('courses.assign')
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

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('courses.assign')
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

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('courses.read')
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

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('courses.publish')
  @Post('lessons/:lessonId/generate-quizzes-from-summary')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Generate quizzes from stored video summary',
    description: `Generates 6 multiple-choice quizzes from the manually added video summary.
    
Workflow:
1. Upload video using /upload-video endpoint
2. Manually add summary using /add-summary endpoint
3. Generate quizzes using this endpoint

Features:
- Generates exactly 6 multiple-choice quizzes
- Each quiz has 4 answer options
- Includes difficulty levels (easy, medium, hard)
- Provides explanations for correct answers
- Automatically saves quizzes to database

Note: Summary must be added first using the /add-summary endpoint before generating quizzes.`
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

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('courses.read')
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

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('courses.read')
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

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('courses.update')
  @Post('lessons/:lessonId/add-summary')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Add manual video summary to lesson',
    description: `Manually add a video summary for a lesson. This summary will be used to generate quizzes.
    
Workflow:
1. Upload video using /upload-video endpoint
2. Manually create a summary based on the video content
3. Add summary using this endpoint
4. Generate quizzes from the summary using /generate-quizzes-from-summary

Process:
- Accepts a text summary created by the course instructor
- Saves the summary to the lesson record
- Makes it available for quiz generation`,
  })
  @ApiParam({ name: 'lessonId', type: String, description: 'Lesson ID to add summary for' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        courseId: {
          type: 'string',
          description: 'Course ID for access validation',
          example: 'course-123'
        },
        summary: {
          type: 'string',
          description: 'Lesson video summary (300-500 words recommended)',
          example: 'JavaScript is a versatile programming language that runs in web browsers and on servers...'
        }
      },
      required: ['courseId', 'summary']
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Summary added successfully',
    schema: {
      example: {
        lessonId: 'les-001',
        message: 'Summary added successfully',
        summaryLength: 350,
        saved: true,
        addedAt: '2025-12-04T10:00:00Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Missing courseId or summary' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addLessonSummary(
    @Request() req,
    @Param('lessonId') lessonId: string,
    @Body('courseId') courseId: string,
    @Body('summary') summary: string
  ): Promise<any> {
    if (!courseId || !summary) {
      throw new BadRequestException('courseId and summary are required');
    }

    if (summary.trim().length === 0) {
      throw new BadRequestException('summary cannot be empty');
    }

    const course = await this.svc.get(courseId);
    if (!course || req.user.tenantId !== course.tenantId) {
      throw new BadRequestException('You do not have access to this course');
    }

    return this.svc.saveLessonSummary(lessonId, courseId, summary, req.user.tenantId);
  }

  // ============================================================================
  // AI-Powered Video Processing Endpoints (S3 Video URL)
  // ============================================================================

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('courses.update')
  @Post('ai/video-summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Generate video summary from S3 URL using OpenAI',
    description: `Analyzes a video from S3 URL and generates:
    - Comprehensive summary (300-500 words)
    - Estimated video duration
    - Key learning points
    
Uses OpenAI GPT-4 Vision API for analysis.`
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['videoUrl', 'videoTitle'],
      properties: {
        videoUrl: {
          type: 'string',
          format: 'url',
          example: 'https://s3.amazonaws.com/bucket/video.mp4',
          description: 'S3 HTTP/HTTPS URL of the video'
        },
        videoTitle: {
          type: 'string',
          example: 'Advanced JavaScript Concepts',
          description: 'Title of the video for context'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Video summary generated successfully',
    schema: {
      example: {
        summary: 'This video covers advanced JavaScript concepts including async/await, promises, and closure patterns...',
        duration: 3600,
        keyPoints: [
          'Understanding async/await syntax and benefits',
          'Promise chaining vs async/await',
          'Error handling with try-catch in async functions',
          'Closure and scope in JavaScript',
          'Performance considerations'
        ]
      }
    }
  })
  async generateVideoSummary(@Body() dto: GenerateVideoSummaryDto) {
    return this.videoProcessing.generateVideoSummary(dto.videoUrl);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('courses.publish')
  @Post('ai/video-quiz')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Generate quiz questions from lesson summary stored in database',
    description: `Generates multiple-choice quiz questions from a video summary that was previously stored in the database.
    
This endpoint uses the lesson's existing video summary (videoSummary field) to generate quizzes.
Make sure to have added a summary to the lesson first using the /add-summary endpoint.

Each question has 4 options with explanations.`
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['lessonId', 'courseId'],
      properties: {
        lessonId: {
          type: 'string',
          example: 'lesson-123',
          description: 'ID of the lesson with stored summary'
        },
        courseId: {
          type: 'string',
          example: 'course-123',
          description: 'ID of the course for access validation'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Quiz generated from database summary and saved successfully',
    schema: {
      example: {
        quizzes: [
          {
            question: 'What is the primary advantage of async/await over promises?',
            options: [
              'Better performance',
              'Cleaner, more readable syntax',
              'Supports more browsers',
              'Allows parallel execution'
            ],
            correctAnswer: 1,
            explanation: 'Async/await provides cleaner and more readable syntax for handling asynchronous operations'
          }
        ]
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Lesson has no stored summary' })
  @ApiResponse({ status: 404, description: 'Lesson or course not found' })
  async generateQuizFromVideoUrl(@Request() req, @Body() dto: any) {
    const { lessonId, courseId } = dto;

    if (!courseId) {
      throw new BadRequestException('courseId is required');
    }

    // Verify course access
    const course = await this.svc.get(courseId);
    if (!course || req.user.tenantId !== course.tenantId) {
      throw new BadRequestException('You do not have access to this course');
    }

    // Use the service method which handles lesson validation and summary check
    return this.svc.generateQuizzesFromStoredSummary(lessonId, courseId, req.user.tenantId);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('courses.update')
  @Post('ai/video-summary-to-lesson')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Generate video summary from S3 URL and save to lesson',
    description: `Analyzes a video from S3 URL, generates a summary, and automatically saves it to the lesson.
    
Perfect workflow: Upload → Generate Summary → Save to Lesson`
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['videoUrl', 'videoTitle', 'lessonId', 'courseId', 'tenantId'],
      properties: {
        videoUrl: {
          type: 'string',
          format: 'url',
          example: 'https://s3.amazonaws.com/bucket/video.mp4',
          description: 'S3 HTTP/HTTPS URL of the video'
        },
        videoTitle: {
          type: 'string',
          example: 'Advanced JavaScript Concepts',
          description: 'Title of the video'
        },
        lessonId: {
          type: 'string',
          example: 'lesson-123',
          description: 'ID of the lesson'
        },
        courseId: {
          type: 'string',
          example: 'course-123',
          description: 'ID of the course'
        },
        tenantId: {
          type: 'string',
          example: 'tenant-123',
          description: 'ID of the tenant'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Summary generated and saved to lesson',
    schema: {
      example: {
        lessonId: 'lesson-123',
        summary: 'Comprehensive video summary...',
        keyPoints: ['Point 1', 'Point 2', 'Point 3'],
        duration: 3600,
        saved: true,
        message: 'Video summary generated and saved to lesson'
      }
    }
  })
  async generateAndSaveVideoSummary(@Request() req, @Body() dto: ProcessVideoUrlDto) {
    this.validateTenantAccess(req.user.tenantId, dto.tenantId);

    // Verify course access
    const course = await this.svc.get(dto.courseId);
    if (!course || req.user.tenantId !== course.tenantId) {
      throw new BadRequestException('You do not have access to this course');
    }

    // Step 1: Generate summary
    const summaryResult = await this.videoProcessing.generateVideoSummary(dto.videoUrl);

    // Step 2: Save to lesson
    const saved = await this.svc.saveLessonSummary(
      dto.lessonId,
      dto.courseId,
      summaryResult.summary,
      req.user.tenantId
    );

    return {
      lessonId: dto.lessonId,
      summary: summaryResult.summary,
      keyPoints: summaryResult.keyPoints,
      duration: summaryResult.duration,
      saved: true,
      message: 'Video summary generated and saved to lesson'
    };
  }
}
