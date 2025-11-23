// src/common/guards/tenant-admin.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtUser } from '../../auth/types/jwt-user.interface';

@Injectable()
export class TenantAdminGuard implements CanActivate {
  private readonly adminRoles = ['admin', 'owner', 'org_admin', 'super_admin'];

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user as JwtUser | undefined;

    if (!user) throw new ForbiddenException('Not authenticated');

    const { tenantId, roles } = user;

    if (!tenantId) throw new ForbiddenException('User does not belong to any tenant');

    if (!roles || !Array.isArray(roles)) throw new ForbiddenException('User has no roles');

    const isAdmin = roles.some((r) => this.adminRoles.includes(r));
    if (!isAdmin) throw new ForbiddenException('User is not a tenant admin');

    return true;
  }
}
