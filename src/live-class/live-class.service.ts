import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLiveClassDto } from './dto/create-live-class.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LiveClassService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new live class
   * Accepts tenant name instead of tenant ID
   * Looks up tenant by name and creates live class
   */
  async createLiveClass(
    dto: CreateLiveClassDto,
    userId: string,
    userTenantId: string,
    userRoles?: string[]
  ) {
    // Look up tenant by name
    const tenant = await this.prisma.tenant.findUnique({
      where: { name: dto.tenantName }
    });
    if (!tenant) {
      throw new NotFoundException(`Tenant "${dto.tenantName}" not found`);
    }

    // Skip tenant membership check for org_admin users
    const isOrgAdmin = userRoles && Array.isArray(userRoles) && userRoles.includes('org_admin');
    
    if (!isOrgAdmin) {
      // Verify user belongs to this tenant (for non-org_admin users)
      const userTenant = await this.prisma.userTenant.findFirst({
        where: {
          userId,
          tenantId: tenant.id
        }
      });
      if (!userTenant) {
        throw new ForbiddenException('You do not belong to this tenant');
      }
    }

    // Generate unique room ID
    const roomId = `room-${uuidv4()}`;

    // Create live class
    const liveClass = await this.prisma.liveClass.create({
      data: {
        tenantId: tenant.id,
        createdBy: userId,
        title: dto.title,
        description: dto.description,
        scheduledAt: new Date(dto.scheduledAt),
        maxParticipants: dto.maxParticipants || 200,
        roomId,
        status: 'scheduled'
      },
      include: {
        participants: true,
        tenant: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return {
      id: liveClass.id,
      title: liveClass.title,
      description: liveClass.description,
      status: liveClass.status,
      roomId: liveClass.roomId,
      scheduledAt: liveClass.scheduledAt,
      maxParticipants: liveClass.maxParticipants,
      participantCount: liveClass.participants.length,
      tenantName: liveClass.tenant.name,
      tenantId: liveClass.tenant.id,
      createdAt: liveClass.createdAt
    };
  }

  /**
   * Get live class details
   */
  async getLiveClass(liveClassId: string, tenantId: string) {
    const liveClass = await this.prisma.liveClass.findUnique({
      where: { id: liveClassId },
      include: {
        participants: {
          select: {
            id: true,
            userId: true,
            role: true,
            joinedAt: true,
            leftAt: true
          }
        }
      }
    });

    if (!liveClass) {
      throw new NotFoundException('Live class not found');
    }

    if (liveClass.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    return {
      id: liveClass.id,
      title: liveClass.title,
      description: liveClass.description,
      status: liveClass.status,
      roomId: liveClass.roomId,
      scheduledAt: liveClass.scheduledAt,
      startedAt: liveClass.startedAt,
      endedAt: liveClass.endedAt,
      maxParticipants: liveClass.maxParticipants,
      participantCount: liveClass.participants.length,
      activeParticipants: liveClass.participants.filter(p => !p.leftAt).length,
      participants: liveClass.participants,
      recordingUrl: liveClass.recordingUrl,
      createdAt: liveClass.createdAt
    };
  }

  /**
   * List all live classes for a tenant
   */
  async listLiveClasses(
    tenantId: string,
    status?: string,
    limit: number = 50,
    offset: number = 0
  ) {
    const where: any = { tenantId };
    if (status) {
      where.status = status;
    }

    const [liveClasses, total] = await Promise.all([
      this.prisma.liveClass.findMany({
        where,
        include: {
          participants: true
        },
        orderBy: { scheduledAt: 'desc' },
        take: limit,
        skip: offset
      }),
      this.prisma.liveClass.count({ where })
    ]);

    return {
      total,
      limit,
      offset,
      liveClasses: liveClasses.map(lc => ({
        id: lc.id,
        title: lc.title,
        description: lc.description,
        status: lc.status,
        roomId: lc.roomId,
        scheduledAt: lc.scheduledAt,
        startedAt: lc.startedAt,
        endedAt: lc.endedAt,
        maxParticipants: lc.maxParticipants,
        participantCount: lc.participants.length,
        activeParticipants: lc.participants.filter(p => !p.leftAt).length,
        createdAt: lc.createdAt
      }))
    };
  }

  /**
   * Start a live class (change status from scheduled to live)
   */
  async startLiveClass(liveClassId: string, userId: string, tenantId: string) {
    const liveClass = await this.prisma.liveClass.findUnique({
      where: { id: liveClassId }
    });

    if (!liveClass) {
      throw new NotFoundException('Live class not found');
    }

    if (liveClass.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    if (liveClass.createdBy !== userId) {
      throw new ForbiddenException('Only the class creator can start the class');
    }

    if (liveClass.status !== 'scheduled') {
      throw new BadRequestException(`Cannot start class with status: ${liveClass.status}`);
    }

    const updated = await this.prisma.liveClass.update({
      where: { id: liveClassId },
      data: {
        status: 'live',
        startedAt: new Date()
      }
    });

    return {
      id: updated.id,
      status: updated.status,
      startedAt: updated.startedAt,
      message: 'Live class started successfully'
    };
  }

  /**
   * End a live class
   */
  async endLiveClass(liveClassId: string, userId: string, tenantId: string) {
    const liveClass = await this.prisma.liveClass.findUnique({
      where: { id: liveClassId }
    });

    if (!liveClass) {
      throw new NotFoundException('Live class not found');
    }

    if (liveClass.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    if (liveClass.createdBy !== userId) {
      throw new ForbiddenException('Only the class creator can end the class');
    }

    if (liveClass.status !== 'live') {
      throw new BadRequestException(`Cannot end class with status: ${liveClass.status}`);
    }

    const updated = await this.prisma.liveClass.update({
      where: { id: liveClassId },
      data: {
        status: 'ended',
        endedAt: new Date()
      }
    });

    return {
      id: updated.id,
      status: updated.status,
      endedAt: updated.endedAt,
      message: 'Live class ended successfully'
    };
  }

  /**
   * Join a live class as participant
   */
  async joinLiveClass(liveClassId: string, userId: string, tenantId: string) {
    const liveClass = await this.prisma.liveClass.findUnique({
      where: { id: liveClassId },
      include: {
        participants: true
      }
    });

    if (!liveClass) {
      throw new NotFoundException('Live class not found');
    }

    if (liveClass.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    if (liveClass.status !== 'live') {
      throw new BadRequestException(`Class is not live. Status: ${liveClass.status}`);
    }

    // Check if at capacity (max 150+)
    const activeParticipants = liveClass.participants.filter(p => !p.leftAt).length;
    if (activeParticipants >= liveClass.maxParticipants) {
      throw new BadRequestException(
        `Live class is at maximum capacity (${liveClass.maxParticipants} participants)`
      );
    }

    // Check if already joined
    const existingParticipant = liveClass.participants.find(p => p.userId === userId && !p.leftAt);
    if (existingParticipant) {
      return {
        id: existingParticipant.id,
        liveClassId,
        userId,
        roomId: liveClass.roomId,
        message: 'Already joined this live class'
      };
    }

    // Create participant record
    const participant = await this.prisma.liveClassParticipant.create({
      data: {
        liveClassId,
        userId,
        role: liveClass.createdBy === userId ? 'teacher' : 'participant'
      }
    });

    return {
      id: participant.id,
      liveClassId,
      userId,
      roomId: liveClass.roomId,
      joinedAt: participant.joinedAt,
      message: 'Joined live class successfully'
    };
  }

  /**
   * Leave a live class
   */
  async leaveLiveClass(liveClassId: string, userId: string, tenantId: string) {
    const liveClass = await this.prisma.liveClass.findUnique({
      where: { id: liveClassId }
    });

    if (!liveClass) {
      throw new NotFoundException('Live class not found');
    }

    if (liveClass.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    const participant = await this.prisma.liveClassParticipant.findFirst({
      where: {
        liveClassId,
        userId,
        leftAt: null
      }
    });

    if (!participant) {
      throw new NotFoundException('Not currently in this live class');
    }

    const updated = await this.prisma.liveClassParticipant.update({
      where: { id: participant.id },
      data: { leftAt: new Date() }
    });

    return {
      id: updated.id,
      liveClassId,
      userId,
      leftAt: updated.leftAt,
      message: 'Left live class successfully'
    };
  }

  /**
   * Get active participants count
   */
  async getActiveParticipants(liveClassId: string, tenantId: string) {
    const liveClass = await this.prisma.liveClass.findUnique({
      where: { id: liveClassId }
    });

    if (!liveClass) {
      throw new NotFoundException('Live class not found');
    }

    if (liveClass.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    const participants = await this.prisma.liveClassParticipant.findMany({
      where: {
        liveClassId,
        leftAt: null
      },
      select: {
        userId: true,
        role: true,
        joinedAt: true
      }
    });

    return {
      liveClassId,
      activeCount: participants.length,
      maxCapacity: liveClass.maxParticipants,
      isFull: participants.length >= liveClass.maxParticipants,
      participants
    };
  }

  /**
   * Update recording URL (called after recording is uploaded to S3)
   */
  async setRecordingUrl(liveClassId: string, recordingUrl: string, tenantId: string) {
    const liveClass = await this.prisma.liveClass.findUnique({
      where: { id: liveClassId }
    });

    if (!liveClass) {
      throw new NotFoundException('Live class not found');
    }

    if (liveClass.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    const updated = await this.prisma.liveClass.update({
      where: { id: liveClassId },
      data: { recordingUrl }
    });

    return {
      id: updated.id,
      recordingUrl: updated.recordingUrl,
      message: 'Recording URL updated successfully'
    };
  }
}
