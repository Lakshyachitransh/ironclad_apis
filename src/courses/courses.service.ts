import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../common/services/s3.service';
import { QuizGeneratorService } from './services/quiz-generator.service';
import * as path from 'path';

@Injectable()
export class CoursesService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
    private quizGeneratorService: QuizGeneratorService
  ) {}

  private async verifyTenantAccess(tenantId: string, entityId: string, entityType: 'course' | 'module' | 'lesson') {
    if (entityType === 'course') {
      const course = await this.prisma.course.findUnique({ where: { id: entityId }});
      if (!course || course.tenantId !== tenantId) {
        throw new BadRequestException('Course not found or access denied');
      }
      return course;
    } else if (entityType === 'module') {
      const module = await this.prisma.module.findUnique({ 
        where: { id: entityId },
        include: { course: true }
      });
      if (!module || module.course.tenantId !== tenantId) {
        throw new BadRequestException('Module not found or access denied');
      }
      return module;
    } else if (entityType === 'lesson') {
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: entityId },
        include: { module: { include: { course: true } } }
      });
      if (!lesson || lesson.module.course.tenantId !== tenantId) {
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
    return this.prisma.course.findUnique({ where: { id }, include: { modules: { include: { lessons: true } } }});
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
    return this.prisma.module.findMany({
      where: { courseId },
      include: { lessons: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async getModule(moduleId: string, tenantId?: string) {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      include: { lessons: { orderBy: { displayOrder: 'asc' } }, course: true },
    });

    if (!module) {
      throw new BadRequestException('Module not found');
    }

    if (tenantId && module.course.tenantId !== tenantId) {
      throw new BadRequestException('You do not have access to this module');
    }

    return module;
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

    if (tenantId && lesson.module.course.tenantId !== tenantId) {
      throw new BadRequestException('You do not have access to this lesson');
    }

    return lesson;
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

    // Validate file type
    const allowedMimeTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid video format. Allowed formats: mp4, webm, mov, avi');
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
      const fileExtension = path.extname(file.originalname);
      const fileName = `${lessonId}-${timestamp}${fileExtension}`;
      const s3Key = `videos/${lesson.module.courseId}/${fileName}`;

      // Upload to S3
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

      return {
        message: 'Video uploaded successfully to S3',
        lesson: updatedLesson,
        fileSize: file.size,
        s3Url: videoUrl,
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
    dueDate?: Date
  ) {
    // Verify course exists and belongs to tenant
    const course = await this.prisma.course.findUnique({ 
      where: { id: courseId },
      include: { modules: { include: { lessons: true } } }
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.tenantId !== tenantId) {
      throw new BadRequestException('Course does not belong to this tenant');
    }

    // Get total lesson count
    const lessonsTotal = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);

    // Assign course to each user
    const assignments = await Promise.all(
      assignToUserIds.map(async (userId) => {
        // Check if already assigned
        const existing = await this.prisma.courseAssignment.findFirst({
          where: {
            courseId,
            assignedTo: userId,
            tenantId
          }
        });

        if (existing) {
          return {
            userId,
            status: 'already_assigned',
            assignmentId: existing.id
          };
        }

        // Create course assignment
        const assignment = await this.prisma.courseAssignment.create({
          data: {
            tenantId,
            courseId,
            assignedTo: userId,
            assignedBy,
            dueDate: dueDate || null,
            status: 'assigned'
          }
        });

        // Create user progress record
        const userProgress = await this.prisma.userProgress.create({
          data: {
            tenantId,
            userId,
            courseId,
            courseAssignmentId: assignment.id,
            lessonsTotal,
            lessonsCompleted: 0,
            progressPercentage: 0,
            status: 'not_started'
          }
        });

        return {
          userId,
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
  async getUserAssignedCourses(userId: string, tenantId: string, status?: string) {
    const where: any = {
      tenantId,
      assignedTo: userId
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
        const progress = await this.prisma.userProgress.findFirst({
          where: {
            userId,
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

    if (lesson.module.course.tenantId !== tenantId) {
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
        userId_lessonId: {
          userId,
          lessonId
        }
      }
    });

    if (!lessonProgress) {
      lessonProgress = await this.prisma.lessonProgress.create({
        data: {
          tenantId,
          userId,
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
   * Generate quizzes from video content using AI
   */
  async generateQuizzesFromVideo(lessonId: string, videoContent: string, courseId: string, tenantId: string): Promise<any> {
    // Verify lesson exists and belongs to tenant
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: true } } }
    });

    if (!lesson || lesson.module.course.tenantId !== tenantId) {
      throw new NotFoundException('Lesson not found or access denied');
    }

    // Generate quizzes using AI
    const generatedQuizzes = await this.quizGeneratorService.generateQuizzesFromVideoContent(videoContent, lessonId, courseId);

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

    if (!lesson || lesson.module.course.tenantId !== tenantId) {
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

    if (!quiz || quiz.lesson.module.course.tenantId !== tenantId) {
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
