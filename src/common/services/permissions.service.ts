import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSION_CATEGORIES } from '../constants/permissions.constant';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all available permissions grouped by category
   */
  async getAvailablePermissions() {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ category: 'asc' }, { resource: 'asc' }, { action: 'asc' }],
    });

    // Group by category
    const grouped = permissions.reduce((acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = [];
      }
      acc[perm.category].push({
        code: perm.code,
        name: perm.name,
        description: perm.description,
        resource: perm.resource,
        action: perm.action,
        category: perm.category,
        isSystemDefined: perm.isSystemDefined,
      });
      return acc;
    }, {} as Record<string, any[]>);

    // Get unique categories and resources
    const categories = Object.keys(grouped);
    const resources = new Set(permissions.map(p => p.resource));

    return {
      categories: grouped,
      total: permissions.length,
      categoryCount: categories.length,
      resourceCount: resources.size,
      resources: Array.from(resources),
      summary: {
        systemDefined: permissions.filter(p => p.isSystemDefined).length,
        custom: permissions.filter(p => !p.isSystemDefined).length,
      },
    };
  }

  /**
   * Get permissions by category
   */
  async getPermissionsByCategory(category: string) {
    const permissions = await this.prisma.permission.findMany({
      where: { category: { contains: category, mode: 'insensitive' } },
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });

    if (permissions.length === 0) {
      throw new NotFoundException(`No permissions found for category: ${category}`);
    }

    return {
      category,
      permissions: permissions.map(p => ({
        code: p.code,
        name: p.name,
        description: p.description,
        resource: p.resource,
        action: p.action,
      })),
      total: permissions.length,
    };
  }

  /**
   * Get permissions by resource
   */
  async getPermissionsByResource(resource: string) {
    const permissions = await this.prisma.permission.findMany({
      where: { resource: { equals: resource, mode: 'insensitive' } },
      orderBy: { action: 'asc' },
    });

    if (permissions.length === 0) {
      throw new NotFoundException(`No permissions found for resource: ${resource}`);
    }

    return {
      resource,
      permissions: permissions.map(p => ({
        code: p.code,
        name: p.name,
        description: p.description,
        category: p.category,
        action: p.action,
      })),
      total: permissions.length,
    };
  }

  /**
   * Get permission by code
   */
  async getPermissionByCode(code: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { code },
    });

    if (!permission) {
      throw new NotFoundException(`Permission not found: ${code}`);
    }

    return permission;
  }

  /**
   * Get permissions statistics
   */
  async getPermissionsStats() {
    const permissions = await this.prisma.permission.findMany();

    const stats = {
      total: permissions.length,
      byCategory: {} as Record<string, number>,
      byResource: {} as Record<string, number>,
      systemDefined: permissions.filter(p => p.isSystemDefined).length,
      custom: permissions.filter(p => !p.isSystemDefined).length,
    };

    // Count by category
    permissions.forEach(p => {
      stats.byCategory[p.category] = (stats.byCategory[p.category] || 0) + 1;
      stats.byResource[p.resource] = (stats.byResource[p.resource] || 0) + 1;
    });

    return stats;
  }

  /**
   * Validate permission code exists
   */
  async validatePermissionCode(code: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { code },
    });

    return {
      code,
      exists: !!permission,
      valid: !!permission,
      permission: permission || null,
    };
  }

  /**
   * Check if user can assign a specific permission
   * platform_admin can assign all permissions
   * tenant_admin can assign only certain permissions
   */
  async canUserAssignPermission(userRoles: string[], permissionCode: string): Promise<boolean> {
    // platform_admin can assign any permission
    if (userRoles.includes('platform_admin')) {
      return true;
    }

    // For other roles, check if permission is assigned to them
    const permission = await this.getPermissionByCode(permissionCode);

    // tenant_admin can assign user, course, content, assessment, live-class permissions
    if (userRoles.includes('tenant_admin')) {
      const allowedResources = ['users', 'courses', 'modules', 'lessons', 'quizzes', 'live-class', 'content', 'roles', 'permissions'];
      return allowedResources.includes(permission.resource);
    }

    return false;
  }

  /**
   * Get assignable permissions for a user based on their roles
   */
  async getAssignablePermissionsForUser(userRoles: string[]) {
    const allPermissions = await this.prisma.permission.findMany();

    // platform_admin can assign all
    if (userRoles.includes('platform_admin')) {
      return {
        assignableCount: allPermissions.length,
        permissions: allPermissions,
        allPermissions: true,
      };
    }

    // tenant_admin can assign specific resource permissions
    if (userRoles.includes('tenant_admin')) {
      const allowedResources = ['users', 'courses', 'modules', 'lessons', 'quizzes', 'live-class', 'content', 'roles', 'permissions', 'reports', 'progress', 'attendance'];
      const assignable = allPermissions.filter(p => allowedResources.includes(p.resource));

      return {
        assignableCount: assignable.length,
        permissions: assignable,
        allPermissions: false,
        restriction: 'Tenant admin can only assign resource-specific permissions',
      };
    }

    return {
      assignableCount: 0,
      permissions: [],
      allPermissions: false,
      restriction: 'Your role cannot assign permissions',
    };
  }
}
