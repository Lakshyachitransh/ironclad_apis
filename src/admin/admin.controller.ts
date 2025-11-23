import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('org_admin')
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
}
