import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrgAdminGuard } from '../common/guards/org-admin.guard';

@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin')
@UseGuards(JwtAuthGuard, OrgAdminGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

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
    @Body() body: {
      email: string;
      displayName: string;
      password: string;
    }
  ) {
    return this.adminService.createTenantAdmin({
      tenantId,
      email: body.email,
      displayName: body.displayName,
      password: body.password
    });
  }
}
