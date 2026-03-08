import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../common/services/s3.service';
import { EmailService } from '../common/services/email.service';
import { QuizGeneratorService } from './services/quiz-generator.service';
import { VideoTranscriptionService } from './services/video-transcription.service';
import * as path from 'path';

// AWS SigV4 enforces a 7-day maximum expiration for presigned URLs
const MAX_PRESIGNED_URL_EXPIRY = 604800; // 7 days in seconds

@Injectable()
export class CoursesService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
    private emailService: EmailService,
    private quizGeneratorService: QuizGeneratorService,
    private videoTranscriptionService: VideoTranscriptionService
  ) {}

  private async verifyTenantAccess(tenantId: string, entityId: string, entityType: 'course' | 'module' | 'lesson') {
    if (entityType === 'course') {
      const course = await this.prisma.course.findUnique({ where: { id: entityId }});
      if (!course) {
        throw new BadRequestException('Course not found or access denied');
      }
      // If tenantId is null, skip tenant check (platform_admin bypass)
      if (tenantId && course.tenantId !== tenantId) {
        throw new BadRequestException('Course not found or access denied');
      }
      return course;
    } else if (entityType === 'module') {
      const module = await this.prisma.module.findUnique({ 
        where: { id: entityId },
        include: { course: true }
      });
      if (!module) {
        throw new BadRequestException('Module not found or access denied');
      }
      // If tenantId is null, skip tenant check (platform_admin bypass)
      if (tenantId && module.course.tenantId !== tenantId) {
        throw new BadRequestException('Module not found or access denied');
      }
      return module;
    } else if (entityType === 'lesson') {
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: entityId },
        include: { module: { include: { course: true } } }
      });
      if (!lesson) {
        throw new BadRequestException('Lesson not found or access denied');
      }
      // If tenantId is null, skip tenant check (platform_admin bypass)
      if (tenantId && lesson.module.course.tenantId !== tenantId) {
        throw new BadRequestException('Lesson not found or access denied');
      }
      return lesson;
    }
  }

  async create(tenantId: string, title: string, summary?: string, level?: string, ownerUserId?: string) {
    return this.prisma.course.create({ data: { tenantId, title, summary, level, ownerUserId }});
  }

  async list(tenantId: string) {
    return this.prisma.course.findMany({ where: { tenantId }, include: { modules: true }});
  }

  async get(id: string) {
    const course = await this.prisma.course.findUnique({ 
      where: { id }, 
      include: { modules: { include: { lessons: true } } }
    });

    if (!course) {
      throw new BadRequestException('Course not found');
    }

    // Generate pre-signed URLs for all lessons with videos
    const modulesWithPresignedUrls = await Promise.all(course.modules.map(async (module) => ({
      ...module,
      lessons: await Promise.all(module.lessons.map(async (lesson) => {
        let presignedVideoUrl = null;
        if (lesson.videoUrl) {
          try {
            const s3Key = this.s3Service.extractKeyFromUrl(lesson.videoUrl);
            presignedVideoUrl = await this.s3Service.generatePresignedUrl(s3Key, MAX_PRESIGNED_URL_EXPIRY);
          } catch (error) {
            console.error('[Get Course] Error generating presigned URL:', error.message);
            presignedVideoUrl = lesson.videoUrl;
          }
        }
        return {
          ...lesson,
          presignedVideoUrl,
        };
      })),
    })));

    return {
      ...course,
      modules: modulesWithPresignedUrls,
    };
  }

  async update(id: string, data: Partial<{ title: string; summary: string; status: string }>) {
    return this.prisma.course.update({ where: { id }, data });
  }

  // Module methods
  async createModule(courseId: string, title: string, description?: string, displayOrder?: number, tenantId?: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId }});
    if (!course) {
      throw new BadRequestException('Course not found');
    }

    if (tenantId && course.tenantId !== tenantId) {
      throw new BadRequestException('You do not have access to this course');
    }

    return this.prisma.module.create({
      data: {
        courseId,
        title,
        description,
        displayOrder: displayOrder || 0,
      },
    });
  }

  async getModulesByCourse(courseId: string) {
    const modules = await this.prisma.module.findMany({
      where: { courseId },
      include: { lessons: true },
      orderBy: { displayOrder: 'asc' },
    });

    // Generate pre-signed URLs for all lessons with videos
    const result = await Promise.all(modules.map(async (module) => ({
      ...module,
      lessons: await Promise.all(module.lessons.map(async (lesson) => {
        let presignedVideoUrl = null;
        if (lesson.videoUrl) {
          try {
            const s3Key = this.s3Service.extractKeyFromUrl(lesson.videoUrl);
            presignedVideoUrl = await this.s3Service.generatePresignedUrl(s3Key, 604800); // 7 days
          } catch (error) {
            console.error('Error generating pre-signed URL:', error);
            presignedVideoUrl = lesson.videoUrl; // Fallback to original URL
          }
        }
        return {
          ...lesson,
          presignedVideoUrl,
        };
      })),
    })));

    console.log('📦 [GET /courses/:id/modules] Returning modules with lessons');
    return result;
  }

  async getModule(moduleId: string, tenantId?: string) {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      include: { lessons: { orderBy: { displayOrder: 'asc' } }, course: true },
    });

    if (!module) {
      throw new BadRequestException('Module not found');
    }

    // If tenantId is provided and not null, check access; null tenantId = platform_admin (skip check)
    if (tenantId && module.course.tenantId !== tenantId) {
      throw new BadRequestException('You do not have access to this module');
    }

    // Generate pre-signed URLs for all lessons with videos
    const lessonsWithPresignedUrls = await Promise.all(module.lessons.map(async (lesson) => {
      let presignedVideoUrl = null;
      if (lesson.videoUrl) {
        try {
          const s3Key = this.s3Service.extractKeyFromUrl(lesson.videoUrl);
          presignedVideoUrl = await this.s3Service.generatePresignedUrl(s3Key, MAX_PRESIGNED_URL_EXPIRY);
        } catch (error) {
          console.error('Error generating pre-signed URL:', error);
          presignedVideoUrl = lesson.videoUrl; // Fallback to original URL
        }
      }
      return {
        ...lesson,
        presignedVideoUrl,
      };
    }));

    const result = {
      ...module,
      lessons: lessonsWithPresignedUrls,
    };

    console.log('📦 [GET /courses/:id/modules/:moduleId] Returning module with lessons:', JSON.stringify(result, null, 2));
    return result;
  }

  async updateModule(moduleId: string, data: Partial<{ title: string; description: string; displayOrder: number }>, tenantId?: string) {
    if (tenantId) {
      await this.verifyTenantAccess(tenantId, moduleId, 'module');
    }
    return this.prisma.module.update({ where: { id: moduleId }, data });
  }

  // Lesson methods
  async createLesson(moduleId: string, title: string, description?: string, displayOrder?: number, tenantId?: string) {
    const module = await this.prisma.module.findUnique({ 
      where: { id: moduleId },
      include: { course: true }
    });
    if (!module) {
      throw new BadRequestException('Module not found');
    }

    if (tenantId && module.course.tenantId !== tenantId) {
      throw new BadRequestException('You do not have access to this module');
    }

    return this.prisma.lesson.create({
      data: {
        moduleId,
        title,
        description,
        displayOrder: displayOrder || 0,
      },
    });
  }

  async getLesson(lessonId: string, tenantId?: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: true } } }
    });

    if (!lesson) {
      throw new BadRequestException('Lesson not found');
    }

    // If tenantId is provided and not null, check access; null tenantId = platform_admin (skip check)
    if (tenantId && lesson.module.course.tenantId !== tenantId) {
      throw new BadRequestException('You do not have access to this lesson');
    }

    // Generate pre-signed URL if video exists
    let presignedVideoUrl = null;
    let videoUrl = null;
    
    if (lesson.videoUrl) {
      console.log('[GET Lesson] Video URL found:', lesson.videoUrl.substring(0, 80) + '...');
      
      try {
        // Extract the S3 key from the stored URL
        const s3Key = this.s3Service.extractKeyFromUrl(lesson.videoUrl);
        
        // Generate a fresh presigned URL (valid for 7 days)
        console.log('[GET Lesson] Generating fresh presigned URL for key:', s3Key);
        presignedVideoUrl = await this.s3Service.generatePresignedUrl(s3Key, MAX_PRESIGNED_URL_EXPIRY);
        console.log('[GET Lesson] ✅ Generated presigned URL successfully');
        
        // Also return the base URL for reference
        videoUrl = lesson.videoUrl;
      } catch (error) {
        console.error('[GET Lesson] ❌ Error generating presigned URL:', {
          message: error?.message,
          errorType: error?.code,
          originalUrl: lesson.videoUrl
        });
        
        // Fallback: Return the stored video URL as-is
        // Note: This might not work if it's a private S3 URL
        console.warn('[GET Lesson] ⚠️ Falling back to original video URL');
        presignedVideoUrl = lesson.videoUrl;
        videoUrl = lesson.videoUrl;
      }
    } else {
      console.log('[GET Lesson] No video URL found for lesson:', lessonId);
    }

    const result = {
      ...lesson,
      videoUrl,
      presignedVideoUrl,
    };

    console.log('[GET Lesson] ✅ Returning lesson with video URLs');
    return result;
  }

  async updateLesson(lessonId: string, data: Partial<{ title: string; description: string; displayOrder: number }>, tenantId?: string) {
    if (tenantId) {
      await this.verifyTenantAccess(tenantId, lessonId, 'lesson');
    }
    return this.prisma.lesson.update({ where: { id: lessonId }, data });
  }

  // Video upload method - S3
  async uploadVideo(lessonId: string, file: Express.Multer.File, videoDuration?: number | string, tenantId?: string) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type - check both MIME type and extension
    const allowedMimeTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'application/octet-stream'];
    const allowedExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    const isValidMimeType = allowedMimeTypes.includes(file.mimetype);
    const isValidExtension = allowedExtensions.includes(fileExtension);

    if (!isValidMimeType && !isValidExtension) {
      console.error('[Video Upload] Invalid video format:', {
        filename: file.originalname,
        mimetype: file.mimetype,
        extension: fileExtension,
        size: file.size
      });
      throw new BadRequestException(`Invalid video format. Allowed formats: ${allowedExtensions.join(', ')}`);
    }

    if (!isValidMimeType) {
      console.warn('[Video Upload] MIME type not recognized, relying on file extension:', {
        filename: file.originalname,
        mimetype: file.mimetype,
        extension: fileExtension
      });
    }

    // Find lesson and verify access
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: true } } }
    });
    
    if (!lesson) {
      throw new BadRequestException('Lesson not found');
    }

    if (tenantId && lesson.module.course.tenantId !== tenantId) {
      throw new BadRequestException('You do not have access to this lesson');
    }

    try {
      // Generate unique key for S3
      const timestamp = Date.now();
      const fileName = `${lessonId}-${timestamp}${fileExtension}`;
      const s3Key = `videos/${lesson.module.courseId}/${fileName}`;

      console.log('[Video Upload] Uploading to S3:', {
        lessonId,
        fileName,
        s3Key,
        fileSize: file.size,
        mimetype: file.mimetype,
        extension: fileExtension
      });

      // Upload to S3 (returns pre-signed URL)
      const videoUrl = await this.s3Service.uploadFile(file, s3Key);

      // Convert videoDuration to integer if provided
      const duration = videoDuration ? parseInt(String(videoDuration), 10) : null;

      // Update lesson with video information
      const updatedLesson = await this.prisma.lesson.update({
        where: { id: lessonId },
        data: {
          videoFileName: fileName,
          videoUrl: videoUrl,
          videoDuration: duration,
        },
      });

      console.log('[Video Upload] Video uploaded successfully:', {
        lessonId,
        videoUrl: videoUrl.split('?')[0] // Log URL without presigned signature
      });

      return {
        message: 'Video uploaded successfully to S3',
        lesson: updatedLesson,
        fileSize: file.size,
        presignedUrl: videoUrl,
        expiresIn: '1 year',
        note: 'Use POST /lessons/:lessonId/generate-summary-openai to generate video summary',
      };
    } catch (error) {
      throw new BadRequestException(`Failed to upload video: ${error.message}`);
    }
  }

  async deleteVideo(lessonId: string, tenantId?: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: true } } }
    });
    
    if (!lesson || !lesson.videoFileName) {
      throw new BadRequestException('Video not found');
    }

    if (tenantId && lesson.module.course.tenantId !== tenantId) {
      throw new BadRequestException('You do not have access to this lesson');
    }

    try {
      // Extract S3 key from URL
      const s3Key = `videos/${lesson.module.courseId}/${lesson.videoFileName}`;
      await this.s3Service.deleteFile(s3Key);

      // Clear video info from lesson
      return this.prisma.lesson.update({
        where: { id: lessonId },
        data: {
          videoFileName: null,
          videoUrl: null,
          videoDuration: null,
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to delete video: ${error.message}`);
    }
  }

  // ============================================================================
  // Course Assignment Methods
  // ============================================================================

  /**
   * Assign a course to one or more users
   */
  async assignCourseToUsers(
    tenantId: string,
    courseId: string,
    assignToUserIds: string[],
    assignedBy: string,
    dueDate?: Date,
    user?: any // User object for authorization checks
  ) {
    // Validate inputs
    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }
    if (!courseId) {
      throw new BadRequestException('courseId is required');
    }
    if (!assignedBy) {
      throw new BadRequestException('assignedBy is required');
    }
    if (!assignToUserIds || !Array.isArray(assignToUserIds) || assignToUserIds.length === 0) {
      throw new BadRequestException('assignToUserIds must be a non-empty array');
    }

    // Verify course exists and belongs to the specified tenant
    const course = await this.prisma.course.findUnique({ 
      where: { id: courseId },
      include: { modules: { include: { lessons: true } } }
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Verify course belongs to the specified tenant
    if (course.tenantId !== tenantId) {
      throw new ForbiddenException(`Course does not belong to tenant ${tenantId}`);
    }

    // Authorization checks: Verify user can assign courses
    if (user) {
      const isPlatformAdmin = user.roles && user.roles.includes('platform_admin');
      const isTenantAdmin = user.tenantId === tenantId && user.roles && (
        user.roles.includes('tenant_admin') || 
        user.roles.includes('org_admin')
      );

      if (!isPlatformAdmin && !isTenantAdmin) {
        throw new ForbiddenException(
          'Only platform_admin or tenant_admin can assign courses'
        );
      }

      // If tenant admin, can only assign to users in their own tenant
      if (!isPlatformAdmin && isTenantAdmin) {
        // Already verified user.tenantId === tenantId above
        // The assignment will be restricted to this tenant users via findMany query below
      }
    }

    // Get total lesson count
    const lessonsTotal = Array.isArray(course.modules)
      ? course.modules.reduce((sum, m) => sum + m.lessons.length, 0)
      : 0;

    // Fetch TenantUser records for the given user IDs
    // If tenant admin, verify all users belong to their tenant
    const tenantUsers = await this.prisma.tenantUser.findMany({
      where: { 
        tenantId,
        id: { in: assignToUserIds }
      }
    });

    if (!tenantUsers || tenantUsers.length === 0) {
      throw new BadRequestException('No valid tenant users found for the provided user IDs');
    }

    if (tenantUsers.length !== assignToUserIds.length) {
      throw new BadRequestException('Some user IDs do not exist in this tenant');
    }

    // For each TenantUser, create or get a corresponding User record
    const userIds: string[] = [];
    for (const tenantUser of tenantUsers) {
      let user = await this.prisma.user.findUnique({
        where: { email: tenantUser.email }
      });
      
      if (!user) {
        // Create a User record if it doesn't exist
        user = await this.prisma.user.create({
          data: {
            email: tenantUser.email,
            passwordHash: tenantUser.passwordHash,
            displayName: tenantUser.displayName,
            status: tenantUser.status
          }
        });
      }
      userIds.push(user.id);
    }

    const tenantUserMap = new Map(tenantUsers.map((tu, idx) => [tu.id, { tenantUser: tu, userId: userIds[idx] }]));

    // Assign course to each tenant user
    const assignments = await Promise.all(
      assignToUserIds.map(async (tenantUserId, idx) => {
        // Check if already assigned
        const existing = await this.prisma.courseAssignment.findFirst({
          where: {
            courseId,
            tenantUserId,
            tenantId
          }
        });

        if (existing) {
          return {
            userId: tenantUserId,
            status: 'already_assigned',
            assignmentId: existing.id
          };
        }

        const mapping = tenantUserMap.get(tenantUserId);
        if (!mapping) {
          throw new InternalServerErrorException('User mapping not found');
        }

        // Create course assignment
        const assignment = await this.prisma.courseAssignment.create({
          data: {
            tenantId,
            courseId,
            tenantUserId,
            assignedBy,
            dueDate: dueDate || null,
            status: 'assigned',
            assignedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        // Create user progress record
        const userProgress = await this.prisma.userProgress.create({
          data: {
            tenantId,
            userId: mapping.userId,
            tenantUserId,
            courseId,
            courseAssignmentId: assignment.id,
            lessonsTotal,
            lessonsCompleted: 0,
            progressPercentage: 0,
            status: 'not_started'
          }
        });

        // Send assignment email notification (without courseLink)
        const tenantUser = mapping.tenantUser;
        if (tenantUser?.email) {
          this.emailService.sendCourseAssignmentEmail(
            tenantUser.email,
            tenantUser.displayName || tenantUser.email,
            course.title,
            dueDate
          ).catch(error => {
            // Log error but don't fail assignment if email fails
            console.error(`Failed to send email to ${tenantUser.email}:`, error);
          });
        }

        return {
          userId: tenantUserId,
          status: 'assigned',
          assignmentId: assignment.id,
          progressId: userProgress.id
        };
      })
    );

    return {
      courseId,
      course: {
        id: course.id,
        title: course.title,
        lessonsTotal
      },
      assignedToCount: assignToUserIds.length,
      results: assignments,
      dueDate: dueDate || null
    };
  }

  /**
   * Get course progress for a user
   */
  async getUserCourseProgress(userId: string, courseId: string, tenantId: string) {
    const progress = await this.prisma.userProgress.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      },
      include: {
        lessonProgress: {
          include: {
            lesson: {
              include: {
                module: true
              }
            }
          }
        },
        courseAssignment: {
          select: {
            dueDate: true,
            assignedAt: true,
            completedAt: true,
            status: true
          }
        }
      }
    });

    if (!progress) {
      throw new NotFoundException('User has not been assigned this course');
    }

    if (progress.tenantId !== tenantId) {
      throw new BadRequestException('Access denied');
    }

    // Group lessons by module
    const moduleProgress = {};
    progress.lessonProgress.forEach((lp) => {
      const moduleId = lp.lesson.module.id;
      if (!moduleProgress[moduleId]) {
        moduleProgress[moduleId] = {
          module: lp.lesson.module,
          lessons: []
        };
      }
      moduleProgress[moduleId].lessons.push({
        lessonId: lp.lesson.id,
        lessonTitle: lp.lesson.title,
        status: lp.status,
        watchedDuration: lp.watchedDuration,
        totalDuration: lp.lesson.videoDuration,
        isCompleted: lp.isCompleted,
        completedAt: lp.completedAt,
        startedAt: lp.startedAt,
        lastAccessedAt: lp.lastAccessedAt
      });
    });

    return {
      userId,
      course: {
        id: courseId,
        title: (await this.prisma.course.findUnique({ where: { id: courseId } }))?.title
      },
      overallProgress: {
        status: progress.status,
        progressPercentage: progress.progressPercentage,
        lessonsCompleted: progress.lessonsCompleted,
        lessonsTotal: progress.lessonsTotal,
        startedAt: progress.startedAt,
        completedAt: progress.completedAt,
        lastAccessedAt: progress.lastAccessedAt
      },
      assignment: progress.courseAssignment,
      moduleProgress: Object.values(moduleProgress),
      createdAt: progress.createdAt,
      updatedAt: progress.updatedAt
    };
  }

  /**
   * Get all courses assigned to a user
   */
  /**
   * Get all courses assigned to a user
   * The userId from JWT is already the TenantUser.id for tenant users
   */
  async getUserAssignedCourses(userId: string, tenantId: string, status?: string) {
    // If no tenantId, user is likely platform_admin - cannot view courses
    if (!tenantId) {
      return [];
    }

    // For tenant users, userId from JWT is already the TenantUser.id
    // Query assignments directly using this ID
    const where: any = {
      tenantId,
      tenantUserId: userId  // userId here is already TenantUser.id
    };

    if (status) {
      where.status = status;
    }

    const assignments = await this.prisma.courseAssignment.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            summary: true,
            level: true,
            modules: {
              select: {
                lessons: {
                  select: { id: true }
                }
              }
            }
          }
        }
      },
      orderBy: { assignedAt: 'desc' }
    });

    return Promise.all(
      assignments.map(async (assignment) => {
        const totalLessons = assignment.course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
        
        // Query userProgress using the TenantUser ID from JWT
        const progress = await this.prisma.userProgress.findFirst({
          where: {
            tenantUserId: userId,
            courseId: assignment.courseId
          }
        });

        return {
          assignmentId: assignment.id,
          course: {
            id: assignment.course.id,
            title: assignment.course.title,
            summary: assignment.course.summary,
            level: assignment.course.level
          },
          assignmentStatus: assignment.status,
          dueDate: assignment.dueDate,
          assignedAt: assignment.assignedAt,
          completedAt: assignment.completedAt,
          progress: progress ? {
            progressPercentage: progress.progressPercentage,
            lessonsCompleted: progress.lessonsCompleted,
            lessonsTotal: progress.lessonsTotal,
            status: progress.status
          } : {
            progressPercentage: 0,
            lessonsCompleted: 0,
            lessonsTotal: totalLessons,
            status: 'not_started'
          }
        };
      })
    );
  }

  /**
   * Update lesson progress for a user
   */
  async updateLessonProgress(
    userId: string,
    lessonId: string,
    tenantId: string,
    watchedDuration: number,
    isCompleted: boolean
  ) {
    // Get lesson with full hierarchy
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: true,
            lessons: true
          }
        }
      }
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // If tenantId is provided and not null, check access; null tenantId = platform_admin (skip check)
    if (tenantId && lesson.module.course.tenantId !== tenantId) {
      throw new BadRequestException('Access denied');
    }

    // Get or create user progress
    let userProgress = await this.prisma.userProgress.findFirst({
      where: {
        userId,
        courseId: lesson.module.courseId
      }
    });

    if (!userProgress) {
      throw new NotFoundException('User not assigned to this course');
    }

    // Update or create lesson progress
    let lessonProgress = await this.prisma.lessonProgress.findUnique({
      where: {
        tenantUserId_lessonId: {
          tenantUserId: userId,
          lessonId
        }
      }
    });

    if (!lessonProgress) {
      lessonProgress = await this.prisma.lessonProgress.create({
        data: {
          tenantId,
          userId,
          tenantUserId: userId,
          lessonId,
          userProgressId: userProgress.id,
          watchedDuration,
          isCompleted,
          startedAt: new Date(),
          lastAccessedAt: new Date(),
          completedAt: isCompleted ? new Date() : null,
          status: isCompleted ? 'completed' : 'in_progress'
        }
      });
    } else {
      lessonProgress = await this.prisma.lessonProgress.update({
        where: { id: lessonProgress.id },
        data: {
          watchedDuration: Math.max(lessonProgress.watchedDuration, watchedDuration),
          isCompleted,
          lastAccessedAt: new Date(),
          completedAt: isCompleted && !lessonProgress.completedAt ? new Date() : lessonProgress.completedAt,
          status: isCompleted ? 'completed' : 'in_progress'
        }
      });
    }

    // Recalculate user progress
    const allLessonProgress = await this.prisma.lessonProgress.findMany({
      where: {
        userProgressId: userProgress.id
      }
    });

    const completedCount = allLessonProgress.filter(lp => lp.isCompleted).length;
    const totalCount = lesson.module.lessons.length;
    const progressPercentage = (completedCount / totalCount) * 100;

    // Update user progress
    userProgress = await this.prisma.userProgress.update({
      where: { id: userProgress.id },
      data: {
        lessonsCompleted: completedCount,
        progressPercentage: Math.round(progressPercentage),
        status: progressPercentage === 100 ? 'completed' : 'in_progress',
        startedAt: userProgress.startedAt || new Date(),
        completedAt: progressPercentage === 100 ? new Date() : null,
        lastAccessedAt: new Date()
      }
    });

    return {
      lessonProgress: {
        lessonId,
        status: lessonProgress.status,
        watchedDuration: lessonProgress.watchedDuration,
        isCompleted: lessonProgress.isCompleted,
        completedAt: lessonProgress.completedAt
      },
      courseProgress: {
        progressPercentage: userProgress.progressPercentage,
        lessonsCompleted: userProgress.lessonsCompleted,
        lessonsTotal: totalCount,
        status: userProgress.status
      }
    };
  }

  /**
   * Get course statistics for a tenant
   */
  async getCourseTenantStats(tenantId: string) {
    const [totalCourses, totalAssignments, userProgressStats, completionStats] = await Promise.all([
      this.prisma.course.count({ where: { tenantId } }),
      this.prisma.courseAssignment.count({ where: { tenantId } }),
      this.prisma.userProgress.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: {
          id: true
        }
      }),
      this.prisma.userProgress.aggregate({
        where: { tenantId },
        _avg: {
          progressPercentage: true
        },
        _sum: {
          progressPercentage: true
        },
        _count: {
          id: true
        }
      })
    ]);

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() - 0);

    const overdueAssignments = await this.prisma.courseAssignment.count({
      where: {
        tenantId,
        dueDate: {
          lt: dueDate
        },
        status: { in: ['assigned', 'started'] }
      }
    });

    return {
      totalCourses,
      totalAssignments,
      totalUsers: completionStats._count,
      averageProgress: Math.round(completionStats._avg.progressPercentage || 0),
      userProgressByStatus: userProgressStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.id;
        return acc;
      }, {}),
      overdueAssignments
    };
  }

  /**
   * Save manually entered lesson summary
   * User provides summary text for a lesson, which is used for quiz generation
   */
  async saveLessonSummary(lessonId: string, courseId: string, summary: string, tenantId: string): Promise<any> {
    // Verify lesson exists and belongs to tenant
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: true } } }
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found or access denied');
    }

    // If tenantId is provided and not null, check access; null tenantId = platform_admin (skip check)
    if (tenantId && lesson.module.course.tenantId !== tenantId) {
      throw new NotFoundException('Lesson not found or access denied');
    }

    // Update lesson with provided summary
    const updatedLesson = await this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        videoSummary: summary,
      },
    });

    return {
      lessonId,
      message: 'Summary added successfully',
      summaryLength: summary.length,
      saved: true,
      addedAt: new Date().toISOString(),
    };
  }

  /**
   * Save generated quiz from AI video processing
   * Stores quiz and questions to database after AI generation
   */
  async saveGeneratedQuiz(lessonId: string, courseId: string, quizData: any, tenantId: string): Promise<any> {
    // Verify lesson exists and belongs to course and tenant
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: {
              select: { id: true, tenantId: true }
            }
          }
        }
      }
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    if (lesson.module.course.id !== courseId) {
      throw new BadRequestException('Lesson does not belong to this course');
    }

    // If tenantId is provided and not null, check access; null tenantId = platform_admin (skip check)
    if (tenantId && lesson.module.course.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied to this course');
    }

    try {
      // Create quiz record
      const quiz = await this.prisma.quiz.create({
        data: {
          title: quizData.topic || `Quiz: ${quizData.topic}`,
          description: `AI-generated quiz from video`,
          lessonId,
          instructions: `This quiz was automatically generated from the video content`,
          passingScore: 70,
          attemptsAllowed: 3,
          timeLimit: 1800, // 30 minutes
          shuffleQuestions: true,
          status: 'draft',
        },
      });

      // Create quiz questions
      if (quizData.questions && Array.isArray(quizData.questions)) {
        for (let i = 0; i < quizData.questions.length; i++) {
          const question = quizData.questions[i];
          
          const createdQuestion = await this.prisma.quizQuestion.create({
            data: {
              quizId: quiz.id,
              questionText: question.questionText || question.question || '',
              type: 'multiple_choice',
              points: question.difficulty === 'hard' ? 3 : question.difficulty === 'medium' ? 2 : 1,
              displayOrder: i,
              explanation: question.explanation || '',
            },
          });

          // Create quiz options (answers)
          if (question.options && Array.isArray(question.options)) {
            for (let j = 0; j < question.options.length; j++) {
              const option = question.options[j];
              const isCorrect = j === question.correctOption;
              
              await this.prisma.quizOption.create({
                data: {
                  questionId: createdQuestion.id,
                  optionText: option,
                  isCorrect,
                  displayOrder: j,
                },
              });
            }
          }
        }
      }

      return {
        quizId: quiz.id,
        totalQuestions: quizData.questions?.length || 0,
        saved: true,
        message: 'Quiz generated and saved successfully',
        topic: quizData.topic,
      };
    } catch (error) {
      console.error(`Error saving generated quiz: ${error.message}`);
      throw new BadRequestException('Failed to save generated quiz');
    }
  }

  /**
   * Generate quizzes from stored video summary
   * Uses the summary that was manually added to the lesson
   */
  async generateQuizzesFromStoredSummary(lessonId: string, courseId: string, tenantId: string): Promise<any> {
    // Verify lesson exists and belongs to tenant
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: true } } }
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found or access denied');
    }

    // If tenantId is provided and not null, check access; null tenantId = platform_admin (skip check)
    if (tenantId && lesson.module.course.tenantId !== tenantId) {
      throw new NotFoundException('Lesson not found or access denied');
    }

    if (!lesson.videoSummary) {
      throw new BadRequestException('This lesson does not have a video summary. Please add a summary first using the /add-summary endpoint.');
    }

    // Generate quizzes using stored summary
    const generatedQuizzes = await this.quizGeneratorService.generateQuizzesFromStoredSummary(
      lesson.videoSummary,
      lessonId,
      courseId
    );

    return generatedQuizzes;
  }

  /**
   * Get all quizzes for a lesson
   */
  async getQuizzesForLesson(lessonId: string, tenantId: string): Promise<any> {
    // Verify lesson exists
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: true } } }
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found or access denied');
    }

    // If tenantId is provided and not null, check access; null tenantId = platform_admin (skip check)
    if (tenantId && lesson.module.course.tenantId !== tenantId) {
      throw new NotFoundException('Lesson not found or access denied');
    }

    // Get all quizzes for this lesson
    return this.prisma.quiz.findMany({
      where: { lessonId },
      include: {
        questions: {
          include: { options: true },
          orderBy: { displayOrder: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get quiz details with questions and options
   */
  async getQuizDetails(quizId: string, tenantId: string): Promise<any> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        lesson: {
          include: { module: { include: { course: true } } }
        },
        questions: {
          include: { options: true },
          orderBy: { displayOrder: 'asc' }
        }
      }
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found or access denied');
    }

    // If tenantId is provided and not null, check access; null tenantId = platform_admin (skip check)
    if (tenantId && quiz.lesson.module.course.tenantId !== tenantId) {
      throw new NotFoundException('Quiz not found or access denied');
    }

    // Remove sensitive fields before returning
    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      passingScore: quiz.passingScore,
      questionCount: quiz.questions.length,
      questions: quiz.questions.map(q => ({
        id: q.id,
        questionText: q.questionText,
        explanation: q.explanation,
        order: q.displayOrder,
        options: q.options.map(o => ({
          id: o.id,
          optionText: o.optionText,
          order: o.displayOrder
          // Don't expose isCorrect here - only server-side
        }))
      }))
    };
  }
}
