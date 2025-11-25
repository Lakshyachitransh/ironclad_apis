import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  BadRequestException,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantAdminGuard } from '../common/guards/tenant-admin.guard';
import { CreateUserDto } from './dto/create-user.dto';
import type { Request } from 'express';

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  /**
   * Create a user and attach to a tenant by name.
   * - Accepts tenantName in the DTO
   * - Looks up tenant by name
   * - Creates user and automatically creates UserTenant relationship
   * - Returns the created user with tenant details
   */
  @UseGuards(JwtAuthGuard, TenantAdminGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create a new user',
    description: 'Creates a new user and attaches them to the specified tenant by name. User is automatically added to the tenant and returns full user details.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'User created successfully and attached to tenant',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
        email: { type: 'string', example: 'newuser@example.com' },
        displayName: { type: 'string', example: 'John Doe' },
        status: { type: 'string', example: 'active' },
        createdAt: { type: 'string', format: 'date-time', example: '2025-11-22T19:00:00Z' },
        tenantName: { type: 'string', example: 'Tech Academy' },
        roles: { type: 'array', items: { type: 'string' }, example: ['learner'] },
        userTenantId: { type: 'string', example: '223e4567-e89b-12d3-a456-426614174001' }
      },
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'newuser@example.com',
        displayName: 'John Doe',
        status: 'active',
        createdAt: '2025-11-22T19:00:00Z',
        tenantName: 'Tech Academy',
        roles: ['learner'],
        userTenantId: '223e4567-e89b-12d3-a456-426614174001'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid input, user already exists, or tenant not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async create(@Body() dto: CreateUserDto, @Req() req: Request) {
    // req.user should be set by JwtAuthGuard and validated by TenantAdminGuard
    // @ts-ignore
    const actor = req.user as JwtUser | undefined;
    if (!actor?.tenantId) {
      throw new BadRequestException('No tenant information in token');
    }

    // Create user and get tenant details by name
    const user = await this.users.createUserAndAttachToTenantByName({
      email: dto.email,
      password: dto.password,
      displayName: dto.displayName,
      tenantName: dto.tenantName,
      roles: dto.roles ?? ['learner'],
    });

    return user;
  }

  /**
   * List users for the tenant of the authenticated admin (no header/trust).
   */
  @UseGuards(JwtAuthGuard, TenantAdminGuard)
  @Get()
  @ApiOperation({ 
    summary: 'List all users in tenant',
    description: 'Retrieves all users in the authenticated admin\'s tenant with their roles.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of users in tenant',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
          email: { type: 'string', example: 'user@example.com' },
          displayName: { type: 'string', example: 'John Doe' },
          roles: { type: 'array', items: { type: 'string' }, example: ['learner'] },
          createdAt: { type: 'string', format: 'date-time', example: '2025-11-19T10:00:00Z' }
        }
      },
      example: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'john@example.com',
          displayName: 'John Doe',
          roles: ['learner'],
          createdAt: '2025-11-19T10:00:00Z'
        },
        {
          id: '223e4567-e89b-12d3-a456-426614174001',
          email: 'jane@example.com',
          displayName: 'Jane Smith',
          roles: ['learner', 'viewer'],
          createdAt: '2025-11-20T14:30:00Z'
        }
      ]
    }
  })
  async list(@Req() req: Request) {
    // @ts-ignore
    const actor = req.user as JwtUser | undefined;
    if (!actor?.tenantId) return { users: [] };

    const rows = await this.users.listUsers(actor.tenantId);
    return rows.map((r) => ({
      id: r.user.id,
      email: r.user.email,
      displayName: r.user.displayName,
      roles: r.roles,
      createdAt: r.user.createdAt,
    }));
  }

  /**
   * Bulk upload users from CSV file
   * Requires org_admin or tenant_admin role
   * CSV Format: email, displayName, password (optional), roles (optional - pipe separated)
   * Example: user@example.com, John Doe, myPassword123, learner|viewer
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('org_admin', 'tenant_admin')
  @Post('bulk-upload')
  @UseInterceptors(FileInterceptor('csv', {
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
  }))
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ 
    summary: 'Bulk upload users from CSV',
    description: `Uploads a CSV file to create multiple users at once. Requires org_admin or tenant_admin role.
    
CSV Format:
- Column 1: email (required)
- Column 2: displayName (optional, defaults to "User {n}")
- Column 3: password (optional, auto-generated if missing)
- Column 4: roles (optional, pipe-separated like "learner|viewer", defaults to "learner")

Example CSV:
email,displayName,password,roles
user1@example.com,John Doe,,learner
user2@example.com,Jane Smith,,learner|viewer
user3@example.com,Bob Johnson,SecurePass123,training_manager`
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        csv: {
          type: 'string',
          format: 'binary',
          description: 'CSV file with user data'
        },
        defaultRoles: {
          type: 'string',
          description: 'Default roles if not specified in CSV (pipe-separated, e.g., "learner|viewer")',
          example: 'learner'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Bulk upload completed with results',
    schema: {
      type: 'object',
      properties: {
        tenantId: { type: 'string', example: '456e7890-e89b-12d3-a456-426614174000' },
        total: { type: 'number', example: 3 },
        successful: { type: 'number', example: 2 },
        failed: { type: 'number', example: 1 },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              email: { type: 'string', example: 'user@example.com' },
              displayName: { type: 'string', example: 'John Doe' },
              userId: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
              roles: { type: 'array', items: { type: 'string' }, example: ['learner'] },
              password: { type: 'string', example: 'abc123def456Aa1!' },
              status: { type: 'string', enum: ['created', 'failed'], example: 'created' }
            }
          }
        },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              row: { type: 'number', example: 4 },
              email: { type: 'string', example: 'invalid-email' },
              error: { type: 'string', example: 'Invalid or missing email' }
            }
          }
        }
      },
      example: {
        tenantId: '456e7890-e89b-12d3-a456-426614174000',
        total: 3,
        successful: 2,
        failed: 1,
        results: [
          {
            email: 'user1@example.com',
            displayName: 'John Doe',
            userId: '123e4567-e89b-12d3-a456-426614174000',
            roles: ['learner'],
            password: 'abc123def456Aa1!',
            status: 'created'
          },
          {
            email: 'user2@example.com',
            displayName: 'Jane Smith',
            userId: '223e4567-e89b-12d3-a456-426614174001',
            roles: ['learner', 'viewer'],
            password: 'xyz789uvw012Aa1!',
            status: 'created'
          }
        ],
        errors: [
          {
            row: 4,
            email: 'invalid-email',
            error: 'Invalid or missing email'
          }
        ]
      }
    }
  })
  @ApiResponse({ status: 400, description: 'CSV file missing or invalid format' })
  @ApiResponse({ status: 413, description: 'File size exceeds 5MB limit' })
  async bulkUploadCsv(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { defaultRoles?: string },
    @Req() req: Request
  ) {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }

    if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
      throw new BadRequestException('Only CSV files are accepted');
    }

    // @ts-ignore
    const actor = req.user as JwtUser | undefined;
    if (!actor?.tenantId) {
      throw new BadRequestException('No tenant information in token');
    }

    // Parse default roles if provided
    const defaultRoles = body.defaultRoles 
      ? body.defaultRoles.split('|').map(r => r.trim()).filter(r => r)
      : ['learner'];

    // Convert file buffer to string
    const csvContent = file.buffer.toString('utf-8');

    // Call bulk create service
    const result = await this.users.bulkCreateUsersFromCsv(
      csvContent,
      actor.tenantId,
      defaultRoles
    );

    return {
      tenantId: actor.tenantId,
      ...result,
    };
  }
}

