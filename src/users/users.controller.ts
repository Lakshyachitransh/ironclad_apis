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
  Delete,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { TenantAdminGuard } from '../common/guards/tenant-admin.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { CreatePlatformUserDto } from './dto/create-platform-user.dto';
import { EmailNotificationService } from '../common/services/email-notification.service';
import type { Request } from 'express';

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(
    private users: UsersService,
    private emailNotification: EmailNotificationService
  ) {}

  /**
   * Get tenant ID for user - handles both platform_admin (null) and regular users
   * Platform admins can have null tenantId and access all tenants
   */
  private getTenantId(actor: any): string | null {
    if (actor?.roles?.includes('platform_admin')) {
      return null; // Platform admin can work across all tenants
    }
    if (!actor?.tenantId) {
      throw new BadRequestException('No tenant information in token');
    }
    return actor.tenantId;
  }

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
    summary: 'Create a new tenant user',
    description: 'Creates a new user and attaches them to the specified tenant by name. User is automatically added to the tenant and returns full user details. Requires tenant_admin role.'
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password', 'tenantName', 'role'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'newuser@example.com',
          description: 'User email address (must be unique within tenant)'
        },
        password: {
          type: 'string',
          minLength: 8,
          example: 'SecurePassword123!',
          description: 'Password (minimum 8 characters)'
        },
        displayName: {
          type: 'string',
          example: 'John Doe',
          description: 'User display name (optional)'
        },
        tenantName: {
          type: 'string',
          example: 'Tech Academy',
          description: 'Name of the tenant to attach user to (required)'
        },
        role: {
          type: 'string',
          example: 'learner',
          description: 'Tenant role for the user (required). Available roles: "tenant_admin", "instructor", "trainer", "learner", "training_manager"'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'User created successfully and attached to tenant',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000', description: 'User ID' },
        email: { type: 'string', example: 'newuser@example.com', description: 'User email' },
        displayName: { type: 'string', example: 'John Doe', description: 'User display name' },
        status: { type: 'string', example: 'active', description: 'User status' },
        createdAt: { type: 'string', format: 'date-time', example: '2025-11-22T19:00:00Z', description: 'Creation timestamp' },
        tenantName: { type: 'string', example: 'Tech Academy', description: 'Tenant name' },
        roles: { type: 'array', items: { type: 'string' }, example: ['learner'], description: 'Assigned roles' },
        userTenantId: { type: 'string', example: '223e4567-e89b-12d3-a456-426614174001', description: 'UserTenant relationship ID' }
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
    // Log the incoming request
    console.log('👤 Creating User:');
    console.log(`   📧 Email: ${dto.email}`);
    console.log(`   🏢 Tenant: ${dto.tenantName}`);
    console.log(`   🎭 Role: ${dto.role}`);
    console.log(`   👤 Display Name: ${dto.displayName || 'N/A'}`);
    console.log('---');

    // req.user should be set by JwtAuthGuard and validated by TenantAdminGuard
    // @ts-ignore
    const actor = req.user as JwtUser | undefined;
    
    // Platform admin can create users without tenantId check
    if (!actor?.roles?.includes('platform_admin') && !actor?.tenantId) {
      throw new BadRequestException('No tenant information in token');
    }

    // Create user and get tenant details by name
    const user = await this.users.createUserAndAttachToTenantByName({
      email: dto.email,
      password: dto.password,
      displayName: dto.displayName,
      tenantName: dto.tenantName,
      role: dto.role,
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
    
    // For platform_admin without tenant, return empty or fetch specific tenant users
    // For now, return empty list for cross-tenant access to avoid loading all users at once
    if (actor?.roles?.includes('platform_admin')) {
      return { users: [] };
    }
    
    if (!actor?.tenantId) return { users: [] };

    const rows = await this.users.listUsers(actor.tenantId);
    return rows.map((r) => ({
      id: r.id,
      email: r.email,
      displayName: r.displayName,
      roles: r.tenantRoles,
      createdAt: r.createdAt,
    }));
  }

  /**
   * Create a platform user (admin user)
   * - Creates a platform-level user (not tenant-specific)
   * - Requires platform_admin role
   * - Can assign platform roles like platform_admin
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('admin.manage')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('admin.manage')
  @Post('platform')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a platform user',
    description: 'Creates a platform-level user (admin) with a single platform role. Requires admin.manage permission. Platform users are not tied to any specific tenant.'
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password', 'platformRole'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'admin@example.com',
          description: 'User email address (must be unique)'
        },
        password: {
          type: 'string',
          minLength: 8,
          example: 'SecurePassword123!',
          description: 'Password (minimum 8 characters)'
        },
        displayName: {
          type: 'string',
          example: 'Platform Admin',
          description: 'User display name (optional)'
        },
        platformRole: {
          type: 'string',
          example: 'platform_admin',
          description: 'Single platform role code (e.g., platform_admin, platform_moderator, viewer). Must exist in Role table.'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Platform user created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '456e4567-e89b-12d3-a456-426614174001', description: 'Platform user ID' },
        email: { type: 'string', example: 'admin@example.com', description: 'User email' },
        displayName: { type: 'string', example: 'Platform Admin', description: 'User display name' },
        status: { type: 'string', example: 'active', description: 'User status' },
        platformRoles: { type: 'array', items: { type: 'string' }, example: ['platform_admin'], description: 'Platform roles' },
        createdAt: { type: 'string', format: 'date-time', example: '2025-12-06T10:00:00Z', description: 'Creation timestamp' },
        updatedAt: { type: 'string', format: 'date-time', example: '2025-12-06T10:00:00Z', description: 'Last update timestamp' }
      },
      example: {
        id: '456e4567-e89b-12d3-a456-426614174001',
        email: 'admin@example.com',
        displayName: 'Platform Admin',
        status: 'active',
        platformRoles: ['platform_admin'],
        createdAt: '2025-12-06T10:00:00Z',
        updatedAt: '2025-12-06T10:00:00Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid input, user already exists, or role does not exist' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async createPlatformUser(@Body() dto: CreatePlatformUserDto) {
    return await this.users.createPlatformUser({
      email: dto.email,
      password: dto.password,
      displayName: dto.displayName ?? dto.email.split('@')[0],
      platformRole: dto.platformRole, // Single role required
    });
  }

  /**
   * Bulk upload users from CSV file
   * Requires org_admin or tenant_admin role
   * CSV Format: email, displayName, password (optional), role (required - single role per user)
   * Example: user@example.com, John Doe, myPassword123, learner
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('users.create')
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
        defaultRole: {
          type: 'string',
          description: 'Default role if not specified in CSV (e.g., \"learner\")',
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
    @Body() body: { defaultRole?: string; tenantId?: string },
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
    
    // Platform admin can bulk create without tenantId check
    if (!actor?.roles?.includes('platform_admin') && !actor?.tenantId) {
      throw new BadRequestException('No tenant information in token');
    }

    // For regular users, use their tenantId; for platform_admin, require tenantId in body
    const tenantId = actor?.tenantId || (actor?.roles?.includes('platform_admin') ? body.tenantId : null);
    
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required for bulk user creation');
    }

    // Get default role if provided, otherwise use 'learner'
    const defaultRole = body.defaultRole || 'learner';

    // Convert file buffer to string
    const csvContent = file.buffer.toString('utf-8');

    // Call bulk create service
    const result = await this.users.bulkCreateUsersFromCsv(
      csvContent,
      tenantId,
      defaultRole
    );

    return {
      tenantId: actor.tenantId,
      ...result,
    };
  }

  /**
   * Delete a user by ID
   * Requires platform_admin or tenant_admin role
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('users.delete')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a user',
    description: 'Deletes a user from the system. Requires users.delete permission (platform_admin or tenant_admin).'
  })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'User user@example.com deleted successfully' },
        deletedUser: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
            email: { type: 'string', example: 'user@example.com' },
            displayName: { type: 'string', example: 'John Doe' },
            deletedAt: { type: 'string', format: 'date-time', example: '2025-12-05T10:30:00.000Z' }
          }
        }
      },
      example: {
        success: true,
        message: 'User user@example.com deleted successfully',
        deletedUser: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'user@example.com',
          displayName: 'John Doe',
          deletedAt: '2025-12-05T10:30:00.000Z'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async deleteUser(@Param('id') userId: string) {
    return await this.users.deleteUserById(userId);
  }

  /**
   * Send test email to verify SMTP configuration
   * Accessible to platform_admin and tenant_admin
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('admin.manage')
  @Post('send-test-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send test email',
    description: 'Sends a test email to verify SMTP configuration. Requires admin.manage permission.'
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          description: 'Email address to send test email to',
          example: 'test@example.com'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Test email sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Test email sent successfully to test@example.com' },
        emailSentTo: { type: 'string', example: 'test@example.com' },
        timestamp: { type: 'string', format: 'date-time', example: '2025-12-05T10:30:00.000Z' }
      },
      example: {
        success: true,
        message: 'Test email sent successfully to test@example.com',
        emailSentTo: 'test@example.com',
        timestamp: '2025-12-05T10:30:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid email address' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 500, description: 'Failed to send email' })
  async sendTestEmail(@Body() body: { email: string }) {
    if (!body.email || !this.isValidEmail(body.email)) {
      throw new BadRequestException('Valid email address is required');
    }

    try {
      const result = await this.emailNotification.testEmail(body.email);

      if (!result) {
        throw new BadRequestException('Failed to send test email - check logs for details');
      }

      return {
        success: true,
        message: `Test email sent successfully to ${body.email}`,
        emailSentTo: body.email,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new BadRequestException(`Failed to send email: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Get all users - both tenant users and platform users
   * Accessible to anyone (no authentication required)
   */
  @Get('all-users')
  @ApiOperation({
    summary: 'Get all users (public endpoint)',
    description: 'Returns all users in the system including tenant users and platform users. No authentication required.'
  })
  @ApiResponse({
    status: 200,
    description: 'List of all users',
    schema: {
      type: 'object',
      properties: {
        tenantUsers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
              email: { type: 'string', example: 'tenant@example.com' },
              displayName: { type: 'string', example: 'Tenant User' },
              status: { type: 'string', example: 'active' },
              tenantId: { type: 'string', example: '789e4567-e89b-12d3-a456-426614174002' },
              tenantRoles: { type: 'array', items: { type: 'string' }, example: ['learner'] },
              createdAt: { type: 'string', format: 'date-time', example: '2025-12-06T10:00:00Z' },
              updatedAt: { type: 'string', format: 'date-time', example: '2025-12-06T10:00:00Z' }
            }
          }
        },
        platformUsers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '456e4567-e89b-12d3-a456-426614174001' },
              email: { type: 'string', example: 'admin@example.com' },
              displayName: { type: 'string', example: 'Platform Admin' },
              status: { type: 'string', example: 'active' },
              platformRoles: { type: 'array', items: { type: 'string' }, example: ['platform_admin'] },
              createdAt: { type: 'string', format: 'date-time', example: '2025-12-06T09:00:00Z' },
              updatedAt: { type: 'string', format: 'date-time', example: '2025-12-06T09:00:00Z' }
            }
          }
        },
        total: {
          type: 'object',
          properties: {
            tenantUsers: { type: 'number', example: 5 },
            platformUsers: { type: 'number', example: 2 },
            combinedTotal: { type: 'number', example: 7 }
          }
        }
      },
      example: {
        tenantUsers: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'john@example.com',
            displayName: 'John Doe',
            status: 'active',
            tenantId: '789e4567-e89b-12d3-a456-426614174002',
            tenantRoles: ['learner'],
            createdAt: '2025-12-06T10:00:00Z',
            updatedAt: '2025-12-06T10:00:00Z'
          }
        ],
        platformUsers: [
          {
            id: '456e4567-e89b-12d3-a456-426614174001',
            email: 'admin@example.com',
            displayName: 'Platform Admin',
            status: 'active',
            platformRoles: ['platform_admin'],
            createdAt: '2025-12-06T09:00:00Z',
            updatedAt: '2025-12-06T09:00:00Z'
          }
        ],
        total: {
          tenantUsers: 1,
          platformUsers: 1,
          combinedTotal: 2
        }
      }
    }
  })
  async getAllUsers() {
    return await this.users.getAllUsers();
  }

  /**
   * Helper method to validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

