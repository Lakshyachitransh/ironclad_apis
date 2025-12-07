import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus, Param, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CreateTenantAdminDto } from './dto/create-tenant-admin.dto';

@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @RequirePermission('admin.manage')
  @Post('database/update-config')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update PostgreSQL database configuration',
    description: `Updates the PostgreSQL connection details and saves them to .env file.
    
Only org_admin role can access this endpoint.

Example:
{
  "host": "localhost",
  "port": 5432,
  "username": "postgres",
  "password": "your_password",
  "database": "ironclad"
}`
  })
  @ApiResponse({
    status: 200,
    description: 'Database configuration updated successfully',
    schema: {
      example: {
        success: true,
        message: 'Database configuration updated successfully',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        database: 'ironclad',
        connectionString: 'postgresql://postgres:****@localhost:5432/ironclad'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid database configuration' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async updateDatabaseConfig(
    @Body()
    body: {
      host: string;
      port: number;
      username: string;
      password: string;
      database: string;
    }
  ) {
    return this.adminService.updateDatabaseConfig(
      body.host,
      body.port,
      body.username,
      body.password,
      body.database
    );
  }

  @RequirePermission('admin.manage')
  @Post('database/migrate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Run Prisma migrations',
    description: `Executes pending Prisma migrations on the current database.
    
This runs 'npx prisma migrate deploy' which applies all pending migrations.
Only org_admin role can access this endpoint.`
  })
  @ApiResponse({
    status: 200,
    description: 'Migrations completed successfully',
    schema: {
      example: {
        success: true,
        message: 'Prisma migrations deployed successfully',
        output: 'Migrations log output...'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Migration failed' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async runMigrations() {
    return this.adminService.runMigrations();
  }

  @RequirePermission('admin.manage')
  @Post('database/update-and-migrate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update database config and run migrations',
    description: `Updates PostgreSQL connection details and automatically runs migrations.
    
This is a convenience endpoint that combines updateDatabaseConfig and runMigrations in one call.
Only org_admin role can access this endpoint.

Example:
{
  "host": "localhost",
  "port": 5432,
  "username": "postgres",
  "password": "your_password",
  "database": "ironclad"
}`
  })
  @ApiResponse({
    status: 200,
    description: 'Database configuration updated and migrations completed',
    schema: {
      example: {
        success: true,
        message: 'Database configuration updated and migrations completed',
        config: {
          success: true,
          message: 'Database configuration updated successfully',
          host: 'localhost',
          port: 5432,
          username: 'postgres',
          database: 'ironclad',
          connectionString: 'postgresql://postgres:****@localhost:5432/ironclad'
        },
        migration: {
          success: true,
          message: 'Prisma migrations deployed successfully',
          output: 'Migrations log output...'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Failed to update or migrate' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async updateAndMigrate(
    @Body()
    body: {
      host: string;
      port: number;
      username: string;
      password: string;
      database: string;
    }
  ) {
    return this.adminService.updateDatabaseAndMigrate(
      body.host,
      body.port,
      body.username,
      body.password,
      body.database
    );
  }

  @RequirePermission('admin.read')
  @Get('database/current-config')
  @ApiOperation({
    summary: 'Get current database configuration',
    description: `Retrieves the current PostgreSQL connection configuration (password is masked).
    
Only org_admin role can access this endpoint.`
  })
  @ApiResponse({
    status: 200,
    description: 'Current database configuration',
    schema: {
      example: {
        configured: true,
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        database: 'ironclad',
        connectionString: 'postgresql://postgres:****@localhost:5432/ironclad'
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getCurrentConfig() {
    return this.adminService.getCurrentDatabaseConfig();
  }

  @RequirePermission('admin.read')
  @Get('users/all-with-courses')
  @ApiOperation({
    summary: 'Get all users across all tenants with course assignments',
    description: `Retrieves all users from all tenants along with their course assignment details.
    
Includes:
- User information (email, display name, status)
- Course assignments per user
- Course progress (percentage, status, lessons completed)
- Tenant information
- Assignment dates and status

Only org_admin role can access this endpoint.`
  })
  @ApiResponse({
    status: 200,
    description: 'All users with course assignments',
    schema: {
      example: {
        success: true,
        totalUsers: 5,
        data: [
          {
            userId: 'user-123',
            email: 'john@example.com',
            displayName: 'John Doe',
            status: 'active',
            totalCoursesAssigned: 3,
            coursesCompleted: 1,
            courseAssignments: [
              {
                courseAssignmentId: 'ca-123',
                tenantName: 'Acme Corp',
                tenantId: 'tenant-123',
                courseTitle: 'JavaScript Basics',
                courseId: 'course-123',
                assignmentStatus: 'assigned',
                dueDate: '2025-12-31T00:00:00Z',
                assignedAt: '2025-11-24T10:00:00Z',
                progress: {
                  progressPercentage: 75,
                  status: 'in_progress',
                  lessonsCompleted: 3,
                  lessonsTotal: 4,
                  startedAt: '2025-11-24T10:30:00Z',
                  completedAt: null
                }
              }
            ]
          }
        ]
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getAllUsersWithCourses() {
    return this.adminService.getAllUsersWithCourseAssignments();
  }

  @RequirePermission('admin.read')
  @Get('users/tenant/:tenantId/with-courses')
  @ApiOperation({
    summary: 'Get users for a specific tenant with course assignments',
    description: `Retrieves all users from a specific tenant along with their course assignment details.
    
Only org_admin role can access this endpoint.`
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant users with course assignments',
    schema: {
      example: {
        success: true,
        totalUsers: 3,
        data: [
          {
            userId: 'user-123',
            email: 'john@example.com',
            displayName: 'John Doe',
            status: 'active',
            totalCoursesAssigned: 2,
            coursesCompleted: 1,
            courseAssignments: [
              {
                courseAssignmentId: 'ca-123',
                tenantName: 'Acme Corp',
                tenantId: 'tenant-123',
                courseTitle: 'JavaScript Basics',
                courseId: 'course-123',
                assignmentStatus: 'assigned',
                dueDate: '2025-12-31T00:00:00Z',
                assignedAt: '2025-11-24T10:00:00Z',
                progress: {
                  progressPercentage: 75,
                  status: 'in_progress',
                  lessonsCompleted: 3,
                  lessonsTotal: 4,
                  startedAt: '2025-11-24T10:30:00Z',
                  completedAt: null
                }
              }
            ]
          }
        ]
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 400, description: 'Tenant not found' })
  async getTenantUsersWithCourses(@Param('tenantId') tenantId: string) {
    return this.adminService.getTenantUsersWithCourseAssignments(tenantId);
  }

  @RequirePermission('admin.create')
  @Post('tenants/:tenantId/create-admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a tenant admin user',
    description: `Creates a new user with tenant_admin role for a specific tenant.
    
Only org_admin role can access this endpoint.

This endpoint allows organization admins to create administrative users for each tenant. The created user will automatically have the tenant_admin role and can manage users, courses, and content within that tenant.`
  })
  @ApiResponse({
    status: 201,
    description: 'Tenant admin created successfully',
    schema: {
      example: {
        success: true,
        message: 'Tenant admin created successfully',
        user: {
          id: 'user-789',
          email: 'admin@acmecorp.com',
          displayName: 'Acme Corp Admin',
          status: 'active',
          createdAt: '2025-11-25T10:00:00Z'
        },
        tenant: {
          id: 'tenant-456',
          name: 'Acme Corporation'
        },
        roles: ['tenant_admin'],
        userTenantId: 'ut-789'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid input or tenant not found' })
  @ApiResponse({ status: 409, description: 'User with this email already exists' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async createTenantAdmin(
    @Param('tenantId') tenantId: string,
    @Body() body: CreateTenantAdminDto
  ) {
    if (!body || !body.email || !body.displayName || !body.password) {
      throw new BadRequestException('Email, displayName, and password are required');
    }
    
    return this.adminService.createTenantAdmin({
      tenantId,
      email: body.email,
      displayName: body.displayName,
      password: body.password
    });
  }

  @RequirePermission('admin.read')
  @Get('users/all-organized')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all users organized by tenant + platform admins',
    description: `Retrieves all users in the system organized by tenant and platform administrators.
    
Shows:
- All platform admin users across the system
- All users grouped by their respective tenants
- User count per tenant
- Summary statistics

Only platform_admin role can access this endpoint.`
  })
  @ApiResponse({
    status: 200,
    description: 'All users organized by tenant and platform admins',
    schema: {
      example: {
        success: true,
        summary: {
          totalTenants: 2,
          totalPlatformAdmins: 1,
          totalUsersAcrossAllTenants: 15
        },
        platformAdmins: [
          {
            id: 'user-123',
            email: 'lakshya.srivastava@secnuo.com',
            displayName: 'Platform Admin',
            status: 'active',
            roles: ['platform_admin', 'superadmin'],
            userTenantId: 'ut-001',
            type: 'platform_admin',
            createdAt: '2025-12-05T10:00:00Z'
          }
        ],
        tenants: [
          {
            tenantId: 'tenant-001',
            tenantName: 'Tech Academy',
            userCount: 8,
            users: [
              {
                id: 'user-456',
                email: 'admin@techacademy.com',
                displayName: 'Academy Admin',
                status: 'active',
                roles: ['tenant_admin'],
                userTenantId: 'ut-002',
                createdAt: '2025-11-20T10:00:00Z'
              },
              {
                id: 'user-789',
                email: 'trainer@techacademy.com',
                displayName: 'John Trainer',
                status: 'active',
                roles: ['training_manager'],
                userTenantId: 'ut-003',
                createdAt: '2025-11-21T10:00:00Z'
              }
            ]
          }
        ]
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 400, description: 'Failed to fetch users' })
  async getAllUsersOrganized() {
    return this.adminService.getAllUsersOrganized();
  }

  @RequirePermission('admin.read')
  @Get('permissions/predefined')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all predefined permissions',
    description: `Retrieves the complete list of predefined system permissions.
    
These are immutable permissions that define all possible actions in the system.
Permissions are organized by category and are used to control access to endpoints.

Only platform_admin role can access this endpoint.`
  })
  @ApiResponse({
    status: 200,
    description: 'List of all predefined permissions',
    schema: {
      example: {
        success: true,
        totalPermissions: 71,
        categories: {
          auth: 4,
          users: 6,
          tenants: 5,
          roles: 7,
          courses: 8,
          modules: 4,
          lessons: 6,
          quizzes: 8,
          'live-classes': 8,
          licenses: 9,
          admin: 4
        },
        permissions: [
          {
            id: 'perm-123',
            code: 'courses.create',
            name: 'Create new course',
            category: 'courses'
          },
          {
            id: 'perm-124',
            code: 'courses.list',
            name: 'List all courses',
            category: 'courses'
          }
        ]
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getPredefinedPermissions() {
    return this.adminService.getPredefinedPermissions();
  }

  @RequirePermission('admin.manage')
  @Post('permissions/seed-world-class')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed world-class permission system',
    description: `Creates 115 predefined permissions across 11 categories and 5 system roles with intelligent permission scoping.
    
This endpoint initializes:
- 115 granular permissions (resource.action format)
- 5 predefined system roles (platform_admin, tenant_admin, trainer, instructor, learner)
- Role-permission mappings for each role

Only platform_admin can execute this endpoint.`
  })
  @ApiResponse({
    status: 200,
    description: 'Permissions and roles seeded successfully',
    schema: {
      example: {
        success: true,
        message: 'World-class permission system seeded successfully',
        summary: {
          permissionsCreated: 115,
          rolesCreated: 5,
          rolePermissionAssignments: 215,
          categories: 11,
          permissionsByCategory: {
            'User Management': 8,
            'Course Management': 12,
            'Module Management': 6,
            'Lesson Management': 8,
            'Quiz Management': 12,
            'Live Class Management': 8,
            'Content Management': 10,
            'Role Management': 6,
            'Permission Management': 8,
            'Reporting & Analytics': 12,
            'System Administration': 5
          }
        }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async seedWorldClassPermissions() {
    return this.adminService.seedWorldClassPermissions();
  }
}


