import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { addDays } from 'date-fns';
import { RolesService } from '../roles/roles.service';

type RefreshToken = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revoked: boolean;
  replacedById?: string | null;
  createdAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
};


@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private rolesService: RolesService
  ) {}

  /**
   * Validate user credentials
   * Checks both PlatformUser and TenantUser tables
   * Returns user object with type indicator
   */
  async validateUser(email: string, password: string) {
    // Try platform user first
    const platformUser = await this.prisma.platformUser.findUnique({ where: { email } });
    if (platformUser) {
      const ok = await bcrypt.compare(password, platformUser.passwordHash);
      if (!ok) return null;
      return { ...platformUser, userType: 'platform' };
    }

    // Try tenant user (check any tenant, will be validated in JWT)
    const tenantUser = await this.prisma.tenantUser.findFirst({
      where: { email },
    });
    if (tenantUser) {
      const ok = await bcrypt.compare(password, tenantUser.passwordHash);
      if (!ok) return null;
      return { ...tenantUser, userType: 'tenant' };
    }

    return null;
  }

  /**
   * Get user tenant and roles
   * For PlatformUser: returns null tenantId and platformRoles
   * For TenantUser: returns tenantId and tenantRoles
   */
  async getUserTenantAndRoles(userId: string) {
    // Try platform user first
    const platformUser = await this.prisma.platformUser.findUnique({
      where: { id: userId },
      select: { platformRoles: true }
    });

    if (platformUser?.platformRoles && platformUser.platformRoles.length > 0) {
      return { tenantId: null, roles: platformUser.platformRoles, userType: 'platform' };
    }

    // Try tenant user
    const tenantUser = await this.prisma.tenantUser.findUnique({
      where: { id: userId },
      select: { tenantId: true, tenantRoles: true }
    });

    if (tenantUser) {
      return { 
        tenantId: tenantUser.tenantId, 
        roles: tenantUser.tenantRoles, 
        userType: 'tenant' 
      };
    }

    return { tenantId: null, roles: [], userType: null };
  }

  async signAccessToken(user: { id: string; email: string; tenantId?: string | null; tenantName?: string | null; roles?: string[] }) {
    // Gather permissions for all roles
    let permissions: string[] = [];
    if (user.roles && user.roles.length > 0) {
      const permsSet = new Set<string>();
      for (const role of user.roles) {
        const rolePerms = await this.rolesService.getPermissionsForRole(role);
        for (const rp of rolePerms) {
          if (rp.permission && rp.permission.code) {
            permsSet.add(rp.permission.code);
          }
        }
      }
      permissions = Array.from(permsSet);
    }
    return this.jwtService.sign({ 
      sub: user.id, 
      id: user.id,
      email: user.email,
      tenantId: user.tenantId ?? null,
      tenantName: user.tenantName ?? null,
      roles: user.roles ?? [],
      permissions
    });
  }

  async createRefreshToken(userId: string, userType: 'platform' | 'tenant' = 'tenant', ip?: string, ua?: string) {
    const secret = process.env.JWT_ACCESS_SECRET!;
    const days = parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS || '30', 10);
    const refresh = this.jwtService.sign({ sub: userId, email: undefined }, { expiresIn: `${days}d` });
    const hash = await bcrypt.hash(refresh, parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10));
    const expiresAt = addDays(new Date(), days);
    
    // Create refresh token with appropriate foreign key based on user type
    const data: any = { tokenHash: hash, expiresAt, ip, ua };
    if (userType === 'platform') {
      data.platformUserId = userId;
    } else {
      data.tenantUserId = userId;
    }
    
    await this.prisma.refreshToken.create({ data });
    return refresh;
  }

  async rotateRefreshToken(oldToken: string) {
    try {
      const payload: any = this.jwtService.verify(oldToken, { secret: process.env.JWT_ACCESS_SECRET });
      const userId = payload.sub;

      // Find refresh tokens for the user (could be in any user type field)
      const tokens = await this.prisma.refreshToken.findMany({
        where: {
          OR: [
            { platformUserId: userId },
            { tenantUserId: userId },
            { userId: userId }
          ],
          revoked: false
        }
      });

      let matched: any = null;
      for (const t of tokens) {
        const ok = await bcrypt.compare(oldToken, t.tokenHash);
        if (ok) { matched = t; break; }
      }

      if (!matched) throw new BadRequestException('refresh token invalid');

      await this.prisma.refreshToken.update({
        where: { id: matched.id },
        data: { revoked: true }
      });

      // Determine user type from matched token
      const userType: 'platform' | 'tenant' = matched.platformUserId ? 'platform' : 'tenant';
      const newRefresh = await this.createRefreshToken(userId, userType);
      return newRefresh;
    } catch (e) {
      throw new BadRequestException('invalid refresh token');
    }
  }

  async revokeRefreshToken(token: string) {
    try {
      const payload: any = this.jwtService.verify(token, { secret: process.env.JWT_ACCESS_SECRET });
      const userId = payload.sub;
      
      // Find refresh tokens for the user (could be in any user type field)
      const tokens = await this.prisma.refreshToken.findMany({ 
        where: { 
          OR: [
            { platformUserId: userId },
            { tenantUserId: userId },
            { userId: userId }
          ],
          revoked: false
        }
      });
      
      for (const t of tokens) {
        const ok = await bcrypt.compare(token, t.tokenHash);
        if (ok) {
          await this.prisma.refreshToken.update({ where: { id: t.id }, data: { revoked: true }});
        }
      }
      return true;
    } catch {
      return false;
    }
  }
}
