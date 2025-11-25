import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * OrgAdminGuard - Only allows org_admin role, doesn't require tenant context
 * Use this for admin endpoints that operate across all tenants
 */
@Injectable()
export class OrgAdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    if (!user.roles || !Array.isArray(user.roles) || !user.roles.includes('org_admin')) {
      throw new ForbiddenException('Only org_admin users can access this endpoint');
    }

    return true;
  }
}
