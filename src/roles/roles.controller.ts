import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';

@ApiTags('roles')
@ApiBearerAuth('access-token')
@Controller('roles')
export class RolesController {
  constructor(private svc: RolesService) {}

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('roles.create')
  @Post()
  @ApiOperation({ summary: 'Create a new role (requires roles.create permission)' })
  @ApiBody({ 
    schema: {
      example: {
        code: 'training_manager',
        name: 'Training Manager',
        description: 'Can manage courses, modules, and lessons'
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Role created successfully',
    schema: {
      example: {
        code: 'training_manager',
        name: 'Training Manager',
        description: 'Can manage courses, modules, and lessons'
      }
    }
  })
  createRole(@Body() dto: CreateRoleDto) {
    return this.svc.createRole(dto.code, dto.name, dto.description);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('roles.read')
  @Get()
  @ApiOperation({ summary: 'List all available roles (requires roles.read permission)' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of roles',
    schema: {
      example: [
        {
          code: 'learner',
          name: 'Learner',
          description: 'Can view courses and lessons'
        },
        {
          code: 'training_manager',
          name: 'Training Manager',
          description: 'Can manage courses'
        }
      ]
    }
  })
  listRoles() {
    return this.svc.getRoles();
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('permissions.create')
  @Post('permission')
  @ApiOperation({ summary: 'Create a new permission (requires permissions.create permission)' })
  @ApiBody({ 
    schema: {
      example: {
        id: 'create_course',
        description: 'Permission to create courses'
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Permission created successfully'
  })
  createPermission(@Body() dto: CreatePermissionDto) {
    const code = dto.code || dto.id || 'custom.permission';
    const name = dto.name || dto.description || code;
    const resource = dto.resource || 'custom';
    const action = dto.action || 'manage';
    const category = dto.category || 'Custom';

    return this.svc.createPermission(code, name, resource, action, category);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('roles.assign-permission')
  @Post('assign-permission')
  @ApiOperation({ summary: 'Assign a permission to a role (requires roles.assign-permission permission)' })
  @ApiBody({ 
    schema: {
      example: {
        roleCode: 'training_manager',
        permissionId: 'users.create'
      },
      description: 'Can use permission code (e.g., "users.create") or permission UUID (e.g., "5deb5f91-9a89-4f8a-a733-1fe947043aed")'
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Permission assigned successfully'
  })
  assignPermission(@Body() body: { roleCode: string; permissionId: string }) {
    return this.svc.assignPermissionToRole(body.roleCode, body.permissionId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('assign-role')
  @ApiOperation({ summary: 'Assign roles to a user in a tenant' })
  @ApiBody({ 
    schema: {
      example: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        tenantId: '456e7890-e89b-12d3-a456-426614174000',
        roles: ['learner', 'viewer']
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Roles assigned successfully to user'
  })
  assignRole(@Body() dto: AssignRoleDto) {
    return this.svc.assignRolesToUserTenant(dto.userId, dto.tenantId, dto.roles);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('roles.assign-permission')
  @Post('assign-permissions-by-category')
  @ApiOperation({ summary: 'Assign all permissions of a category to a role (requires roles.assign-permission permission)' })
  @ApiBody({ 
    schema: {
      example: {
        roleCode: 'training_manager',
        category: 'courses'
      },
      description: 'Available categories: users, roles, courses, modules, lessons, content, quizzes, live-class, licenses, admin, tenants, permissions, reports, attendance, analytics, progress'
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'All permissions in category assigned to role',
    schema: {
      example: {
        roleCode: 'training_manager',
        category: 'courses',
        assignedCount: 7,
        permissions: [
          { code: 'courses.create', name: 'Create Course' },
          { code: 'courses.read', name: 'View Courses' },
          { code: 'courses.update', name: 'Update Course' },
          { code: 'courses.delete', name: 'Delete Course' },
          { code: 'courses.publish', name: 'Publish Course' },
          { code: 'courses.assign', name: 'Assign Course' },
          { code: 'courses.export', name: 'Export Course' }
        ]
      }
    }
  })
  assignPermissionsByCategory(@Body() body: { roleCode: string; category: string }) {
    return this.svc.assignPermissionsByCategory(body.roleCode, body.category);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('roles.read')
  @Get(':roleCode/permissions')
  @ApiOperation({ summary: 'Get all permissions for a role (requires roles.read permission)' })
  @ApiParam({ name: 'roleCode', type: String, description: 'Role code' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of permissions for the role',
    schema: {
      example: {
        roleCode: 'training_manager',
        permissions: [
          {
            id: 'create_course',
            description: 'Permission to create courses'
          },
          {
            id: 'edit_course',
            description: 'Permission to edit courses'
          }
        ]
      }
    }
  })
  getRolePermissions(@Param('roleCode') roleCode: string) {
    return this.svc.getPermissionsForRole(roleCode);
  }
}
