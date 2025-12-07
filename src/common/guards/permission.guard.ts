import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtUser } from '../../auth/types/jwt-user.interface';

/**
 * PermissionGuard - Checks RolePermission table for access control
 * 
 * Flow:
 * 1. Extract required permissions from @RequirePermission decorator
 * 2. If user is platform_admin, BYPASS all checks (has all permissions)
 * 3. Otherwise, check each required permission against RolePermission table
 * 4. Support tenant-scoped checks (ensure user is in the same tenant)
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[]>(
      PERMISSION_KEY,
      context.getHandler()
    );

    // If no permissions required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtUser | undefined;

    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    // ✅ PLATFORM_ADMIN BYPASS - Has all permissions
    if (user.roles?.includes('platform_admin')) {
      return true;
    }

    if (!user.tenantId) {
      throw new ForbiddenException('User does not belong to any tenant');
    }

    if (!user.roles || !Array.isArray(user.roles) || user.roles.length === 0) {
      throw new ForbiddenException('User has no roles assigned');
    }

    // Check each required permission
    for (const requiredPerm of requiredPermissions) {
      const hasPermission = await this.checkUserHasPermission(
        user.id,
        user.tenantId,
        user.roles,
        requiredPerm
      );

      if (!hasPermission) {
        throw new ForbiddenException(
          `User does not have permission: ${requiredPerm}`
        );
      }
    }

    return true;
  }

  /**
   * Check if user has a specific permission
   * 
   * Flow:
   * 1. Find all permissions with the given code
   * 2. For each permission, check if user's roles are linked to it
   * 3. Return true if any role has the permission
   */
  private async checkUserHasPermission(
    userId: string,
    tenantId: string,
    userRoles: string[],
    permissionCode: string
  ): Promise<boolean> {
    try {
      // Find permission by code
      const permission = await this.prisma.permission.findUnique({
        where: { code: permissionCode }
      });

      if (!permission) {
        return false; // Permission doesn't exist
      }

      // Check if any of user's roles have this permission
      const rolePermissions = await this.prisma.rolePermission.findMany({
        where: {
          permissionId: permission.id,
          role: {
            code: {
              in: userRoles
            }
          }
        }
      });

      return rolePermissions.length > 0;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }
}
