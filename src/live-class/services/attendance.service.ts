import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Track participant activity in live class
   * Called when user is actively participating (mouse/keyboard activity)
   */
  async trackActivity(
    liveClassId: string,
    tenantUserId: string,
    tenantId: string,
  ): Promise<void> {
    // Verify participant exists in this live class
    const participant = await this.prisma.liveClassParticipant.findUnique({
      where: {
        liveClassId_tenantUserId: { liveClassId, tenantUserId },
      },
      include: { liveClass: true },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found in this live class');
    }

    // Verify tenant access
    if (participant.liveClass.tenantId !== tenantId) {
      throw new BadRequestException('You do not have access to this live class');
    }

    // Update last activity timestamp (we'll store this in a separate tracking table)
    // For now, we just acknowledge the activity was recorded
  }

  /**
   * Calculate active duration and attendance percentage when participant leaves
   */
  async recordParticipantLeave(
    liveClassId: string,
    tenantUserId: string,
    tenantId: string,
  ): Promise<{
    activeDurationSeconds: number;
    activePercentage: number;
    isCompleted: boolean;
  }> {
    // Get the live class and participant details
    const liveClass = await this.prisma.liveClass.findUnique({
      where: { id: liveClassId },
      include: { participants: { where: { tenantUserId } } },
    });

    if (!liveClass) {
      throw new NotFoundException('Live class not found');
    }

    if (liveClass.tenantId !== tenantId) {
      throw new BadRequestException('You do not have access to this live class');
    }

    const participant = liveClass.participants[0];
    if (!participant) {
      throw new NotFoundException('Participant not found in this live class');
    }

    // Calculate total class duration (from start to end)
    const classStartTime = liveClass.startedAt || liveClass.scheduledAt;
    const classEndTime = liveClass.endedAt || new Date();
    const totalClassDurationSeconds =
      Math.floor((classEndTime.getTime() - classStartTime.getTime()) / 1000);

    // Calculate participant's active duration
    const participantJoinTime = participant.joinedAt;
    const participantLeaveTime = new Date();
    const participationDurationSeconds = Math.floor(
      (participantLeaveTime.getTime() - participantJoinTime.getTime()) / 1000,
    );

    // For now, assume the user was active for the entire duration they were in the class
    // In production, you'd track actual activity events
    const activeDurationSeconds = Math.max(
      0,
      Math.min(participationDurationSeconds, totalClassDurationSeconds),
    );

    // Calculate active percentage
    const activePercentage = totalClassDurationSeconds > 0
      ? Math.round((activeDurationSeconds / totalClassDurationSeconds) * 100)
      : 0;

    // Determine if attendance threshold (80%) is met
    const isCompleted = activePercentage >= 80;

    // Update participant record
    await this.prisma.liveClassParticipant.update({
      where: {
        liveClassId_tenantUserId: { liveClassId, tenantUserId },
      },
      data: {
        leftAt: participantLeaveTime,
        activeDurationSeconds,
        activePercentage,
        isCompleted,
        completedAt: isCompleted ? participantLeaveTime : null,
      },
    });

    return {
      activeDurationSeconds,
      activePercentage,
      isCompleted,
    };
  }

  /**
   * Calculate and update attendance for all participants when live class ends
   */
  async calculateClassAttendance(liveClassId: string, tenantId: string): Promise<void> {
    // Get the live class
    const liveClass = await this.prisma.liveClass.findUnique({
      where: { id: liveClassId },
      include: { participants: true },
    });

    if (!liveClass) {
      throw new NotFoundException('Live class not found');
    }

    if (liveClass.tenantId !== tenantId) {
      throw new BadRequestException('You do not have access to this live class');
    }

    // Calculate total class duration
    const classStartTime = liveClass.startedAt || liveClass.scheduledAt;
    const classEndTime = liveClass.endedAt || new Date();
    const totalClassDurationSeconds = Math.floor(
      (classEndTime.getTime() - classStartTime.getTime()) / 1000,
    );

    // Update all participants with attendance calculations
    for (const participant of liveClass.participants) {
      const participationStart = participant.joinedAt;
      const participationEnd = participant.leftAt || classEndTime;

      // Calculate active duration (time from join to leave, capped at class duration)
      const participationDurationSeconds = Math.floor(
        (participationEnd.getTime() - participationStart.getTime()) / 1000,
      );
      const activeDurationSeconds = Math.max(
        0,
        Math.min(participationDurationSeconds, totalClassDurationSeconds),
      );

      // Calculate active percentage
      const activePercentage = totalClassDurationSeconds > 0
        ? Math.round((activeDurationSeconds / totalClassDurationSeconds) * 100)
        : 0;

      const isCompleted = activePercentage >= 80;

      await this.prisma.liveClassParticipant.update({
        where: { id: participant.id },
        data: {
          activeDurationSeconds,
          activePercentage,
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
        },
      });
    }
  }

  /**
   * Get attendance report for a live class
   */
  async getAttendanceReport(
    liveClassId: string,
    tenantId: string,
  ): Promise<any> {
    const liveClass = await this.prisma.liveClass.findUnique({
      where: { id: liveClassId },
      include: {
        participants: {
          orderBy: { activePercentage: 'desc' },
        },
      },
    });

    if (!liveClass) {
      throw new NotFoundException('Live class not found');
    }

    if (liveClass.tenantId !== tenantId) {
      throw new BadRequestException('You do not have access to this live class');
    }

    const classStartTime = liveClass.startedAt || liveClass.scheduledAt;
    const classEndTime = liveClass.endedAt || new Date();
    const totalClassDurationSeconds = Math.floor(
      (classEndTime.getTime() - classStartTime.getTime()) / 1000,
    );

    const totalParticipants = liveClass.participants.length;
    const completedParticipants = liveClass.participants.filter(
      (p) => p.isCompleted,
    ).length;
    const averageAttendance =
      liveClass.participants.length > 0
        ? Math.round(
            liveClass.participants.reduce(
              (sum, p) => sum + p.activePercentage,
              0,
            ) / liveClass.participants.length,
          )
        : 0;

    return {
      liveClassId,
      title: liveClass.title,
      scheduledAt: liveClass.scheduledAt,
      startedAt: liveClass.startedAt,
      endedAt: liveClass.endedAt,
      totalClassDurationSeconds,
      totalClassDurationMinutes: Math.round(totalClassDurationSeconds / 60),
      summary: {
        totalParticipants,
        completedParticipants,
        incompletedParticipants: totalParticipants - completedParticipants,
        completionRate: totalParticipants > 0
          ? Math.round((completedParticipants / totalParticipants) * 100)
          : 0,
        averageAttendance,
      },
      participants: liveClass.participants.map((p) => ({
        tenantUserId: p.tenantUserId,
        joinedAt: p.joinedAt,
        leftAt: p.leftAt,
        role: p.role,
        activeDurationSeconds: p.activeDurationSeconds,
        activeDurationMinutes: Math.round(p.activeDurationSeconds / 60),
        activePercentage: p.activePercentage,
        isCompleted: p.isCompleted,
        completedAt: p.completedAt,
      })),
    };
  }

  /**
   * Get attendance details for a specific participant
   */
  async getParticipantAttendance(
    liveClassId: string,
    tenantUserId: string,
    tenantId: string,
  ): Promise<any> {
    const participant = await this.prisma.liveClassParticipant.findUnique({
      where: {
        liveClassId_tenantUserId: { liveClassId, tenantUserId },
      },
      include: { liveClass: true },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    if (participant.liveClass.tenantId !== tenantId) {
      throw new BadRequestException('You do not have access to this live class');
    }

    const classStartTime = participant.liveClass.startedAt || participant.liveClass.scheduledAt;
    const classEndTime = participant.liveClass.endedAt || new Date();
    const totalClassDurationSeconds = Math.floor(
      (classEndTime.getTime() - classStartTime.getTime()) / 1000,
    );

    return {
      liveClassId,
      liveClassTitle: participant.liveClass.title,
      tenantUserId,
      role: participant.role,
      joinedAt: participant.joinedAt,
      leftAt: participant.leftAt,
      activeDurationSeconds: participant.activeDurationSeconds,
      activeDurationMinutes: Math.round(participant.activeDurationSeconds / 60),
      activePercentage: participant.activePercentage,
      totalClassDurationSeconds,
      totalClassDurationMinutes: Math.round(totalClassDurationSeconds / 60),
      isCompleted: participant.isCompleted,
      completedAt: participant.completedAt,
      status: participant.isCompleted ? 'COMPLETED' : 'INCOMPLETE',
      message: participant.isCompleted
        ? `Training completed with ${participant.activePercentage}% attendance`
        : `Attendance: ${participant.activePercentage}%. Need ${Math.max(0, 80 - participant.activePercentage)}% more for completion`,
    };
  }

  /**
   * Get training progress for user across all live classes in a course
   */
  async getTrainingProgress(
    tenantUserId: string,
    courseId: string,
    tenantId: string,
  ): Promise<any> {
    // Get all live classes for the course
    const liveClasses = await this.prisma.liveClass.findMany({
      where: {
        tenantId,
        // In a real scenario, you'd have a courseId field in LiveClass
        // For now, we'll get all live classes for the tenant
      },
      include: {
        participants: {
          where: { tenantUserId },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    const userSessions = liveClasses
      .filter((lc) => lc.participants.length > 0)
      .map((lc) => {
        const participant = lc.participants[0];
        return {
          liveClassId: lc.id,
          title: lc.title,
          scheduledAt: lc.scheduledAt,
          startedAt: lc.startedAt,
          endedAt: lc.endedAt,
          activeDurationMinutes: Math.round(participant.activeDurationSeconds / 60),
          activePercentage: participant.activePercentage,
          isCompleted: participant.isCompleted,
          status: participant.isCompleted ? 'COMPLETED' : 'INCOMPLETE',
        };
      });

    const totalSessions = userSessions.length;
    const completedSessions = userSessions.filter((s) => s.isCompleted).length;
    const averageAttendance =
      totalSessions > 0
        ? Math.round(
            userSessions.reduce((sum, s) => sum + s.activePercentage, 0) / totalSessions,
          )
        : 0;

    return {
      tenantUserId,
      courseId,
      summary: {
        totalSessions,
        completedSessions,
        incompletedSessions: totalSessions - completedSessions,
        completionRate: totalSessions > 0
          ? Math.round((completedSessions / totalSessions) * 100)
          : 0,
        averageAttendance,
      },
      sessions: userSessions,
    };
  }
}
