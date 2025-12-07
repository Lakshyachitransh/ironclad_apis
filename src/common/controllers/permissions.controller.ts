import { Controller, Get, Post, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionGuard } from '../guards/permission.guard';
import { RequirePermission } from '../decorators/require-permission.decorator';
import { PermissionsService } from '../services/permissions.service';

@ApiTags('permissions')
@ApiBearerAuth('access-token')
@Controller('permissions')
export class PermissionsController {
  constructor(private permissionsService: PermissionsService) {}

  /**
   * Get all available permissions - list of permissions that can be assigned to roles
   * Used when creating or updating roles to show which permissions user can assign
   * Requires: permissions.read
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('permissions.read')
  @Get('available')
  @ApiOperation({
    summary: 'Get all available permissions',
    description: `Get complete list of permissions organized by category.
When creating or assigning permissions to a role, use this endpoint to show which permissions the role creator can assign.

Returns permissions grouped by category with full details including:
- Permission code (format: resource.action)
- Permission name and description
- Resource and action details
- Category grouping

Useful for:
- Building permission assignment UIs
- Validating permission codes before assignment
- Showing users what permissions they can grant`
  })
  @ApiResponse({
    status: 200,
    description: 'List of all available permissions grouped by category',
    schema: {
      type: 'object',
      properties: {
        categories: {
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'users.create' },
                name: { type: 'string', example: 'Create User' },
                description: { type: 'string' },
                resource: { type: 'string', example: 'users' },
                action: { type: 'string', example: 'create' },
                category: { type: 'string', example: 'User Management' },
              },
            },
          },
        },
        total: { type: 'number', example: 115 },
        categoryCount: { type: 'number', example: 11 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Missing permissions.read' })
  async getAvailablePermissions() {
    return this.permissionsService.getAvailablePermissions();
  }

  /**
   * Get permissions by category
   * Requires: permissions.read
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('permissions.read')
  @Get('by-category')
  @ApiOperation({
    summary: 'Get permissions by category',
    description: `Get permissions filtered by specific category.
Useful for building category-based permission selection UIs.`
  })
  @ApiResponse({ status: 200, description: 'Permissions in category' })
  async getPermissionsByCategory(@Query('category') category: string) {
    return this.permissionsService.getPermissionsByCategory(category);
  }

  /**
   * Get permissions by resource
   * Requires: permissions.read
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('permissions.read')
  @Get('by-resource')
  @ApiOperation({
    summary: 'Get permissions by resource',
    description: `Get permissions filtered by resource (e.g., 'users', 'courses', 'admin').
Useful for showing resource-specific permissions.`
  })
  @ApiResponse({ status: 200, description: 'Permissions for resource' })
  async getPermissionsByResource(@Query('resource') resource: string) {
    return this.permissionsService.getPermissionsByResource(resource);
  }

  /**
   * Get single permission details
   * Requires: permissions.read
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('permissions.read')
  @Get(':code')
  @ApiOperation({
    summary: 'Get permission details',
    description: `Get detailed information about a specific permission.`
  })
  @ApiResponse({ status: 200, description: 'Permission details' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async getPermissionByCode(@Query('code') code: string) {
    return this.permissionsService.getPermissionByCode(code);
  }

  /**
   * Get permissions summary statistics
   * Requires: permissions.read
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('permissions.read')
  @Get('stats/summary')
  @ApiOperation({
    summary: 'Get permissions statistics',
    description: `Get summary statistics about the permission system including:
- Total permissions
- Permissions per category
- Permissions per resource
- System-defined vs custom permissions`
  })
  @ApiResponse({ status: 200, description: 'Permission statistics' })
  async getPermissionsStats() {
    return this.permissionsService.getPermissionsStats();
  }

  /**
   * Validate if permission code exists
   * Requires: permissions.read
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('permissions.read')
  @Post('validate')
  @ApiOperation({
    summary: 'Validate permission code',
    description: `Check if a permission code exists and is valid.
Useful for validating permission codes before role assignment.`
  })
  @ApiResponse({ status: 200, description: 'Permission validation result' })
  async validatePermission(@Query('code') code: string) {
    return this.permissionsService.validatePermissionCode(code);
  }
}
