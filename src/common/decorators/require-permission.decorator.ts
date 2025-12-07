import { SetMetadata } from '@nestjs/common';

/**
 * RequirePermission Decorator
 * 
 * Usage: @RequirePermission('courses.create', 'courses.update')
 * 
 * This decorator marks which permissions are required for an endpoint.
 * The PermissionGuard will check if user's roles have these permissions.
 */
export const PERMISSION_KEY = 'required_permissions';

export const RequirePermission = (...permissions: string[]) => 
  SetMetadata(PERMISSION_KEY, permissions);
