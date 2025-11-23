import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  Param, 
  Query,
  UseGuards, 
  Request, 
  BadRequestException,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody, 
  ApiBearerAuth, 
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';
import { LiveClassService } from './live-class.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateLiveClassDto } from './dto/create-live-class.dto';
import type { Request as ExpressRequest } from 'express';

@ApiTags('live-classes')
@ApiBearerAuth('access-token')
@Controller('live-classes')
export class LiveClassController {
  constructor(private readonly liveClassService: LiveClassService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('training_manager', 'org_admin')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create a new live class',
    description: `Creates a new live class that can handle 150+ participants.
    
Features:
- Scalable architecture supporting up to 500 concurrent participants
- Unique room IDs for seamless WebSocket connection
- Scheduled live classes with start/end times
- Real-time participant tracking
- Teacher and participant roles
- Automatic capacity management

Send tenantName instead of tenantId - the backend will automatically look up the tenant ID.
Only training_manager and org_admin roles can create live classes.`
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Live class created successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Advanced JavaScript Live Session',
        description: 'Interactive Q&A session',
        status: 'scheduled',
        roomId: 'room-789f0123-e89b-12d3-a456-426614174000',
        scheduledAt: '2025-11-20T14:00:00Z',
        maxParticipants: 150,
        participantCount: 0,
        tenantName: 'Tech Academy',
        tenantId: '456e7890-e89b-12d3-a456-426614174000',
        createdAt: '2025-11-19T10:00:00Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async create(@Body() dto: CreateLiveClassDto, @Request() req: ExpressRequest) {
    // @ts-ignore
    const actor = req.user as JwtUser;
    if (!actor?.tenantId) {
      throw new BadRequestException('No tenant information in token');
    }

    return this.liveClassService.createLiveClass(dto, actor.id, actor.tenantId, actor.roles);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':liveClassId')
  @ApiOperation({ 
    summary: 'Get live class details',
    description: 'Retrieves full details of a live class including participant information.'
  })
  @ApiParam({ name: 'liveClassId', type: String, description: 'Live class ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Live class details',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Advanced JavaScript Live Session',
        description: 'Interactive Q&A session',
        status: 'live',
        roomId: 'room-789f0123-e89b-12d3-a456-426614174000',
        scheduledAt: '2025-11-20T14:00:00Z',
        startedAt: '2025-11-20T14:05:00Z',
        endedAt: null,
        maxParticipants: 150,
        participantCount: 42,
        activeParticipants: 42,
        participants: [
          {
            id: 'participant-id',
            userId: 'user-id',
            role: 'teacher',
            joinedAt: '2025-11-20T14:05:00Z',
            leftAt: null
          }
        ],
        recordingUrl: null,
        createdAt: '2025-11-19T10:00:00Z'
      }
    }
  })
  async getLiveClass(
    @Param('liveClassId') liveClassId: string,
    @Request() req: ExpressRequest
  ) {
    // @ts-ignore
    const actor = req.user as JwtUser;
    if (!actor?.tenantId) {
      throw new BadRequestException('No tenant information in token');
    }

    return this.liveClassService.getLiveClass(liveClassId, actor.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ 
    summary: 'List all live classes for tenant',
    description: 'Retrieves all live classes for the authenticated user\'s tenant.'
  })
  @ApiQuery({ name: 'status', type: String, required: false, description: 'Filter by status (scheduled, live, ended, cancelled)' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Max results per page (default: 50)', example: 50 })
  @ApiQuery({ name: 'offset', type: Number, required: false, description: 'Pagination offset (default: 0)', example: 0 })
  @ApiResponse({ 
    status: 200, 
    description: 'List of live classes',
    schema: {
      example: {
        total: 5,
        limit: 50,
        offset: 0,
        liveClasses: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            title: 'Advanced JavaScript Live Session',
            status: 'live',
            roomId: 'room-789f0123-e89b-12d3-a456-426614174000',
            scheduledAt: '2025-11-20T14:00:00Z',
            startedAt: '2025-11-20T14:05:00Z',
            endedAt: null,
            maxParticipants: 150,
            participantCount: 42,
            activeParticipants: 42,
            createdAt: '2025-11-19T10:00:00Z'
          }
        ]
      }
    }
  })
  async listLiveClasses(
    @Request() req: ExpressRequest,
    @Query('status') status?: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0
  ) {
    // @ts-ignore
    const actor = req.user as JwtUser;
    if (!actor?.tenantId) {
      throw new BadRequestException('No tenant information in token');
    }

    return this.liveClassService.listLiveClasses(actor.tenantId, status, limit, offset);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('training_manager', 'org_admin')
  @Post(':liveClassId/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Start a live class',
    description: 'Changes class status from "scheduled" to "live". Only the creator can start the class.'
  })
  @ApiParam({ name: 'liveClassId', type: String, description: 'Live class ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Live class started',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        status: 'live',
        startedAt: '2025-11-20T14:05:00Z',
        message: 'Live class started successfully'
      }
    }
  })
  async startLiveClass(
    @Param('liveClassId') liveClassId: string,
    @Request() req: ExpressRequest
  ) {
    // @ts-ignore
    const actor = req.user as JwtUser;
    if (!actor?.tenantId) {
      throw new BadRequestException('No tenant information in token');
    }

    return this.liveClassService.startLiveClass(liveClassId, actor.id, actor.tenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('training_manager', 'org_admin')
  @Post(':liveClassId/end')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'End a live class',
    description: 'Changes class status from "live" to "ended". Only the creator can end the class.'
  })
  @ApiParam({ name: 'liveClassId', type: String, description: 'Live class ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Live class ended',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        status: 'ended',
        endedAt: '2025-11-20T15:00:00Z',
        message: 'Live class ended successfully'
      }
    }
  })
  async endLiveClass(
    @Param('liveClassId') liveClassId: string,
    @Request() req: ExpressRequest
  ) {
    // @ts-ignore
    const actor = req.user as JwtUser;
    if (!actor?.tenantId) {
      throw new BadRequestException('No tenant information in token');
    }

    return this.liveClassService.endLiveClass(liveClassId, actor.id, actor.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':liveClassId/join')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Join a live class',
    description: `Joins an active live class and returns the room ID for WebSocket connection.
    
Returns:
- Room ID for WebSocket connection
- Participant role (teacher or participant)
- Join timestamp

Constraints:
- Class must be in "live" status
- Cannot exceed maximum participant capacity (150-500)
- Each user can only join once (duplicate join attempts are handled gracefully)`
  })
  @ApiParam({ name: 'liveClassId', type: String, description: 'Live class ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully joined live class',
    schema: {
      example: {
        id: 'participant-id',
        liveClassId: '123e4567-e89b-12d3-a456-426614174000',
        userId: 'user-id',
        roomId: 'room-789f0123-e89b-12d3-a456-426614174000',
        joinedAt: '2025-11-20T14:05:00Z',
        message: 'Joined live class successfully'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Class not live or at capacity' })
  @ApiResponse({ status: 404, description: 'Live class not found' })
  async joinLiveClass(
    @Param('liveClassId') liveClassId: string,
    @Request() req: ExpressRequest
  ) {
    // @ts-ignore
    const actor = req.user as JwtUser;
    if (!actor?.tenantId) {
      throw new BadRequestException('No tenant information in token');
    }

    return this.liveClassService.joinLiveClass(liveClassId, actor.id, actor.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':liveClassId/leave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Leave a live class',
    description: 'Removes the user from a live class. Can be called multiple times safely.'
  })
  @ApiParam({ name: 'liveClassId', type: String, description: 'Live class ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully left live class',
    schema: {
      example: {
        id: 'participant-id',
        liveClassId: '123e4567-e89b-12d3-a456-426614174000',
        userId: 'user-id',
        leftAt: '2025-11-20T15:00:00Z',
        message: 'Left live class successfully'
      }
    }
  })
  async leaveLiveClass(
    @Param('liveClassId') liveClassId: string,
    @Request() req: ExpressRequest
  ) {
    // @ts-ignore
    const actor = req.user as JwtUser;
    if (!actor?.tenantId) {
      throw new BadRequestException('No tenant information in token');
    }

    return this.liveClassService.leaveLiveClass(liveClassId, actor.id, actor.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':liveClassId/participants')
  @ApiOperation({ 
    summary: 'Get active participants count',
    description: 'Returns real-time count of active participants and capacity status.'
  })
  @ApiParam({ name: 'liveClassId', type: String, description: 'Live class ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Participant statistics',
    schema: {
      example: {
        liveClassId: '123e4567-e89b-12d3-a456-426614174000',
        activeCount: 42,
        maxCapacity: 150,
        isFull: false,
        participants: [
          {
            userId: 'user-id-1',
            role: 'teacher',
            joinedAt: '2025-11-20T14:05:00Z'
          },
          {
            userId: 'user-id-2',
            role: 'participant',
            joinedAt: '2025-11-20T14:06:00Z'
          }
        ]
      }
    }
  })
  async getActiveParticipants(
    @Param('liveClassId') liveClassId: string,
    @Request() req: ExpressRequest
  ) {
    // @ts-ignore
    const actor = req.user as JwtUser;
    if (!actor?.tenantId) {
      throw new BadRequestException('No tenant information in token');
    }

    return this.liveClassService.getActiveParticipants(liveClassId, actor.tenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('training_manager', 'org_admin')
  @Post(':liveClassId/recording')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Set recording URL',
    description: 'Associates a recording (uploaded to S3) with the live class.'
  })
  @ApiParam({ name: 'liveClassId', type: String, description: 'Live class ID' })
  @ApiBody({ 
    schema: {
      example: {
        recordingUrl: 's3://bucket/live-classes/123e4567-e89b-12d3-a456-426614174000/recording.mp4'
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Recording URL set successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        recordingUrl: 's3://bucket/live-classes/123e4567-e89b-12d3-a456-426614174000/recording.mp4',
        message: 'Recording URL updated successfully'
      }
    }
  })
  async setRecordingUrl(
    @Param('liveClassId') liveClassId: string,
    @Body() body: { recordingUrl: string },
    @Request() req: ExpressRequest
  ) {
    if (!body.recordingUrl) {
      throw new BadRequestException('recordingUrl is required');
    }

    // @ts-ignore
    const actor = req.user as JwtUser;
    if (!actor?.tenantId) {
      throw new BadRequestException('No tenant information in token');
    }

    return this.liveClassService.setRecordingUrl(liveClassId, body.recordingUrl, actor.tenantId);
  }
}
