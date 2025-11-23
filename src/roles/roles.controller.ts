import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('roles')
@ApiBearerAuth('access-token')
@Controller('roles')
export class RolesController {
  constructor(private svc: RolesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new role (admin only)' })
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

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'List all available roles' })
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

  @UseGuards(JwtAuthGuard)
  @Post('permission')
  @ApiOperation({ summary: 'Create a new permission' })
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
    return this.svc.createPermission(dto.id, dto.description);
  }

  @UseGuards(JwtAuthGuard)
  @Post('assign-permission')
  @ApiOperation({ summary: 'Assign a permission to a role' })
  @ApiBody({ 
    schema: {
      example: {
        roleCode: 'training_manager',
        permissionId: 'create_course'
      }
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

  @UseGuards(JwtAuthGuard)
  @Get(':roleCode/permissions')
  @ApiOperation({ summary: 'Get all permissions for a role' })
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
