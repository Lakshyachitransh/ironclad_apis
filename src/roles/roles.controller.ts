import { Controller, Post, Body, Get, Param, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { CreateTenantRoleDto } from './dto/create-tenant-role.dto';
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
  @RequirePermission('roles.read')
  @Get('my-tenant/all')
  @ApiOperation({ 
    summary: 'Get all roles in your current tenant',
    description: `Convenience endpoint to get all roles (both system and custom) for the current user's tenant.
    
**Returns:**
- System roles assigned to users in this tenant
- Custom tenant-specific roles
- All associated permissions for each role`
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of all roles in your tenant',
    schema: {
      example: {
        systemRoles: [
          {
            id: 'role-uuid-1',
            code: 'learner',
            name: 'Learner',
            description: 'Can access and complete courses',
            category: 'system',
            isSystem: true,
            createdAt: '2025-11-01T00:00:00Z',
            permissions: []
          }
        ],
        customRoles: [
          {
            id: 'custom-role-uuid-1',
            tenantId: 'tenant-uuid-1',
            roleCode: 'course_manager',
            roleName: 'Course Manager',
            description: 'Can create and manage courses for the tenant',
            category: 'custom',
            isSystem: false,
            createdAt: '2026-02-25T11:07:28.954Z',
            updatedAt: '2026-02-25T11:07:28.954Z'
          }
        ],
        total: 2
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Tenant not found for current user' })
  async getMyTenantRoles(@Request() req) {
    // @ts-ignore
    const user = req.user;
    const tenantId = user?.tenantId;

    if (!tenantId) {
      throw new BadRequestException('❌ No tenant associated with your account');
    }

    return this.svc.getTenantRoles(tenantId);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('roles.create')
  @Post('my-tenant')
  @ApiOperation({ 
    summary: 'Create a custom role in your current tenant',
    description: `Creates a custom role for your current tenant.
    
**Who can use this:**
- Tenant Admin in their own tenant
- Org Admin in their own tenant
- Platform Admin (can create in any tenant via the specific tenant endpoint)

The role code must be unique within the tenant.`
  })
  @ApiBody({ type: CreateTenantRoleDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Role created successfully',
    schema: {
      example: {
        id: 'role-uuid-1',
        tenantId: 'tenant-uuid',
        roleCode: 'course_manager',
        roleName: 'Course Manager',
        description: 'Can create and manage courses for the tenant',
        category: 'custom',
        isSystem: false,
        createdAt: '2025-11-25T10:00:00Z',
        updatedAt: '2025-11-25T10:00:00Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid input, role already exists, or tenant not found' })
  @ApiResponse({ status: 403, description: 'Unauthorized: Only tenant admin, org admin, or platform admin can create roles' })
  async createRoleInMyTenant(
    @Request() req,
    @Body() dto: CreateTenantRoleDto
  ) {
    // @ts-ignore
    const user = req.user;
    const userRoles = user?.roles || [];
    const userTenantId = user?.tenantId;
    const isPlatformAdmin = userRoles.includes('platform_admin');
    const isTenantAdmin = userRoles.includes('tenant_admin');
    const isOrgAdmin = userRoles.includes('org_admin');

    if (!userTenantId) {
      throw new BadRequestException('❌ No tenant associated with your account');
    }

    // Check authorization
    const isAuthorized = isPlatformAdmin || isTenantAdmin || isOrgAdmin;
    
    if (!isAuthorized) {
      throw new BadRequestException(
        '❌ Unauthorized: Only tenant admin, org admin, or platform admin can create roles'
      );
    }

    return this.svc.createTenantRole(
      userTenantId,
      dto.roleCode,
      dto.roleName,
      dto.description
    );
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

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('roles.read')
  @Get('tenant/:tenantId')
  @ApiOperation({ 
    summary: 'Get all roles in a specific tenant',
    description: `Returns both system roles assigned to users AND custom tenant-scoped roles.
    
**Access Control:**
- **Platform Admin**: Can view all tenant roles
- **Tenant Admin / Org Admin**: Can view roles only in their own tenant
- **Other Users**: Can view roles only in their own tenant`
  })
  @ApiParam({ name: 'tenantId', type: String, description: 'Tenant ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of tenant roles (system and custom)',
    schema: {
      example: {
        systemRoles: [
          {
            id: 'role-uuid-1',
            code: 'learner',
            name: 'Learner',
            description: 'Can access and complete courses',
            category: 'system',
            isSystem: true,
            createdAt: '2025-11-01T00:00:00Z',
            permissions: []
          }
        ],
        customRoles: [
          {
            id: 'custom-role-uuid-1',
            tenantId: 'tenant-uuid-1',
            roleCode: 'course_manager',
            roleName: 'Course Manager',
            description: 'Can create and manage courses for the tenant',
            category: 'custom',
            isSystem: false,
            createdAt: '2026-02-25T11:07:28.954Z',
            updatedAt: '2026-02-25T11:07:28.954Z'
          }
        ],
        total: 2
      }
    }
  })
  @ApiResponse({ status: 403, description: 'You do not have access to this tenant' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async getTenantRoles(@Request() req, @Param('tenantId') tenantId: string) {
    // @ts-ignore
    const user = req.user;
    const userRoles = user?.roles || [];
    const userTenantId = user?.tenantId;
    const isPlatformAdmin = userRoles.includes('platform_admin');
    const isTenantAdmin = userRoles.includes('tenant_admin');
    const isOrgAdmin = userRoles.includes('org_admin');

    // Platform admin can access any tenant, others only their own tenant
    if (!isPlatformAdmin && userTenantId !== tenantId) {
      throw new BadRequestException('❌ You do not have access to view roles in this tenant');
    }

    return this.svc.getTenantRoles(tenantId);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('roles.create')
  @Post('tenant/:tenantId')
  @ApiOperation({ 
    summary: 'Create a custom role for a specific tenant',
    description: `Creates a custom role for a specific tenant.
    
**Access Control:**
- **Platform Admin**: Can create roles in any tenant
- **Tenant Admin / Org Admin**: Can create roles only in their own tenant
- **Other Users**: Cannot create roles

The role code must be unique within the tenant. This role can then be assigned to tenant users.`
  })
  @ApiParam({ name: 'tenantId', type: String, description: 'Tenant ID' })
  @ApiBody({ type: CreateTenantRoleDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Role created successfully',
    schema: {
      example: {
        id: 'role-uuid-1',
        tenantId: 'tenant-uuid',
        roleCode: 'course_manager',
        roleName: 'Course Manager',
        description: 'Can create and manage courses for the tenant',
        category: 'custom',
        isSystem: false,
        createdAt: '2025-11-25T10:00:00Z',
        updatedAt: '2025-11-25T10:00:00Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid input or role already exists' })
  @ApiResponse({ status: 403, description: 'Unauthorized: Only tenant admin, org admin, or platform admin can create roles' })
  async createTenantRole(
    @Request() req,
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateTenantRoleDto
  ) {
    // @ts-ignore
    const user = req.user;
    const userRoles = user?.roles || [];
    const userTenantId = user?.tenantId;
    const isPlatformAdmin = userRoles.includes('platform_admin');
    const isTenantAdmin = userRoles.includes('tenant_admin');
    const isOrgAdmin = userRoles.includes('org_admin');

    // Check authorization
    const isAuthorized = isPlatformAdmin || (isTenantAdmin && userTenantId === tenantId) || (isOrgAdmin && userTenantId === tenantId);
    
    if (!isAuthorized) {
      throw new BadRequestException(
        '❌ Unauthorized: Only tenant admin, org admin, or platform admin can create roles in this tenant'
      );
    }

    return this.svc.createTenantRole(
      tenantId,
      dto.roleCode,
      dto.roleName,
      dto.description
    );
  }
}