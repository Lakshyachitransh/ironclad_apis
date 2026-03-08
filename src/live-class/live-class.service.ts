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
    console.log(`🎬 Starting Live Class Creation:`);
    console.log(`   📝 Title: ${dto.title}`);
    console.log(`   🏢 Tenant Name: ${dto.tenantName}`);
    console.log(`   👤 User ID: ${userId}`);
    console.log(`   🎭 Roles: ${userRoles?.join(', ')}`);

    // Look up tenant by name
    const tenant = await this.prisma.tenant.findUnique({
      where: { name: dto.tenantName }
    });
    
    if (!tenant) {
      console.log(`   ✗ ERROR: Tenant "${dto.tenantName}" not found in database`);
      throw new NotFoundException(`Tenant "${dto.tenantName}" not found`);
    }
    
    console.log(`   ✓ Tenant found: ${tenant.name} (ID: ${tenant.id})`);

    // Skip tenant membership check for platform_admin or org_admin users
    const isPlatformAdmin = userRoles && Array.isArray(userRoles) && userRoles.includes('platform_admin');
    const isOrgAdmin = userRoles && Array.isArray(userRoles) && userRoles.includes('org_admin');
    
    if (isPlatformAdmin) console.log(`   ⭐ User is platform_admin - skipping tenant check`);
    if (isOrgAdmin) console.log(`   ⭐ User is org_admin - skipping tenant check`);
    
    if (!isPlatformAdmin && !isOrgAdmin) {
      console.log(`   🔍 Checking tenant membership...`);
      // Verify user belongs to this tenant (for regular tenant users)
      // Check both UserTenant (legacy) and TenantUser (current) tables
      const userTenant = await this.prisma.userTenant.findFirst({
        where: {
          userId,
          tenantId: tenant.id
        }
      });

      const tenantUser = await this.prisma.tenantUser.findFirst({
        where: {
          id: userId,
          tenantId: tenant.id
        }
      });

      console.log(`   ✓ UserTenant check: ${userTenant ? 'FOUND' : 'NOT FOUND'}`);
      console.log(`   ✓ TenantUser check: ${tenantUser ? 'FOUND' : 'NOT FOUND'}`);

      if (!userTenant && !tenantUser) {
        console.log(`   ✗ ERROR: User ${userId} does not belong to tenant ${tenant.id}`);
        throw new ForbiddenException(`You do not belong to tenant "${dto.tenantName}". User ID: ${userId}, Tenant ID: ${tenant.id}`);
      }

      console.log(`   ✓ User ${userId} is valid member of tenant ${tenant.id}`);
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

    console.log(`   ✅ Live Class Created Successfully:`);
    console.log(`      ID: ${liveClass.id}`);
    console.log(`      Room ID: ${liveClass.roomId}`);
    console.log(`      Status: ${liveClass.status}`);

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
            tenantUserId: true,
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
   * Check if a live class room exists (for WebSocket validation)
   * Used by WebSocket gateway to validate room before allowing join
   */
  async roomExists(roomId: string): Promise<boolean> {
    try {
      const liveClass = await this.prisma.liveClass.findUnique({
        where: { roomId },
        select: { id: true }
      });
      return !!liveClass;
    } catch (error) {
      return false;
    }
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
    const existingParticipant = liveClass.participants.find(p => p.tenantUserId === userId && !p.leftAt);
    if (existingParticipant) {
      return {
        id: existingParticipant.id,
        liveClassId,
        tenantUserId: userId,
        roomId: liveClass.roomId,
        message: 'Already joined this live class'
      };
    }

    // Create participant record
    const participant = await this.prisma.liveClassParticipant.create({
      data: {
        liveClassId,
        tenantUserId: userId,
        role: liveClass.createdBy === userId ? 'teacher' : 'participant'
      }
    });

    return {
      id: participant.id,
      liveClassId,
      tenantUserId: userId,
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
        tenantUserId: userId,
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
      tenantUserId: userId,
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
        tenantUserId: true,
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

  /**
   * List all users in a tenant (for selection in UI)
   * Returns all active users that can be assigned to the live class
   */
  async listTenantUsers(tenantId: string) {
    const users = await this.prisma.tenantUser.findMany({
      where: {
        tenantId,
        status: 'active'
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        tenantRoles: true,
        createdAt: true
      },
      orderBy: {
        displayName: 'asc'
      }
    });

    return {
      total: users.length,
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        roles: user.tenantRoles,
        createdAt: user.createdAt
      }))
    };
  }

  /**
   * Assign users to a live class
   * Bulk-add participants to a live class
   */
  async assignUsersToLiveClass(
    liveClassId: string,
    userIds: string[],
    tenantId: string,
    role: string = 'participant'
  ) {
    // Validate live class exists and belongs to tenant
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

    // Validate all users exist in the tenant
    const validUsers = await this.prisma.tenantUser.findMany({
      where: {
        id: { in: userIds },
        tenantId,
        status: 'active'
      },
      select: {
        id: true,
        email: true,
        displayName: true
      }
    });

    if (validUsers.length !== userIds.length) {
      const invalidUserCount = userIds.length - validUsers.length;
      throw new BadRequestException(
        `${invalidUserCount} user(s) not found or not active in this tenant`
      );
    }

    // Check capacity
    const currentParticipants = liveClass.participants.filter(p => !p.leftAt).length;
    const availableCapacity = liveClass.maxParticipants - currentParticipants;

    if (userIds.length > availableCapacity) {
      throw new BadRequestException(
        `Cannot assign ${userIds.length} users. Only ${availableCapacity} slots available (class capacity: ${liveClass.maxParticipants})`
      );
    }

    // Get already assigned users
    const alreadyAssigned = liveClass.participants
      .filter(p => !p.leftAt)
      .map(p => p.tenantUserId);

    // Filter out already assigned users
    const usersToAssign = userIds.filter(userId => !alreadyAssigned.includes(userId));

    if (usersToAssign.length === 0) {
      return {
        liveClassId,
        assigned: 0,
        skipped: userIds.length,
        alreadyAssigned: userIds,
        message: 'All users are already assigned to this live class'
      };
    }

    // Assign users (create participant records)
    const assignedUsers = await Promise.all(
      usersToAssign.map(userId =>
        this.prisma.liveClassParticipant.create({
          data: {
            liveClassId,
            tenantUserId: userId,
            role: role || 'participant'
          },
          select: {
            id: true,
            tenantUserId: true,
            role: true,
            joinedAt: true
          }
        })
      )
    );

    return {
      liveClassId,
      assigned: assignedUsers.length,
      skipped: alreadyAssigned.length,
      alreadyAssigned,
      participants: assignedUsers.map(p => ({
        id: p.id,
        userId: p.tenantUserId,
        role: p.role,
        joinedAt: p.joinedAt
      })),
      message: `Successfully assigned ${assignedUsers.length} user(s) to the live class`
    };
  }
}
