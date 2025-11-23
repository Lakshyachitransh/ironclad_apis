import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { addDays } from 'date-fns';

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
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return null;
    return user;
  }

  /**
   * Fetch user's tenant and roles from UserTenant
   */
  async getUserTenantAndRoles(userId: string) {
    const userTenant = await this.prisma.userTenant.findFirst({
      where: { userId },
      select: { tenantId: true, roles: true }
    });
    return userTenant ? { tenantId: userTenant.tenantId, roles: userTenant.roles } : { tenantId: null, roles: [] };
  }

  signAccessToken(user: { id: string; email: string; tenantId?: string | null; roles?: string[] }) {
    return this.jwtService.sign({ 
      sub: user.id, 
      id: user.id,
      email: user.email,
      tenantId: user.tenantId ?? null,
      roles: user.roles ?? []
    });
  }

  async createRefreshToken(userId: string, ip?: string, ua?: string) {
    const secret = process.env.JWT_ACCESS_SECRET!;
    const days = parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS || '30', 10);
    const refresh = this.jwtService.sign({ sub: userId, email: undefined }, { expiresIn: `${days}d` });
    const hash = await bcrypt.hash(refresh, parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10));
    const expiresAt = addDays(new Date(), days);
    await this.prisma.refreshToken.create({
      data: { userId, tokenHash: hash, expiresAt, ip, ua }
    });
    return refresh;
  }

  async rotateRefreshToken(oldToken: string) {
    try {
      const payload: any = this.jwtService.verify(oldToken, { secret: process.env.JWT_ACCESS_SECRET });
      const userId = payload.sub;

      const tokens = await this.prisma.refreshToken.findMany({
        where: { userId, revoked: false }
      });

      let matched: RefreshToken | null = null; // <- explicit typing
      for (const t of tokens) {
        const ok = await bcrypt.compare(oldToken, t.tokenHash);
        if (ok) { matched = t; break; }
      }

      if (!matched) throw new BadRequestException('refresh token invalid');

      await this.prisma.refreshToken.update({
        where: { id: matched.id },
        data: { revoked: true }
      });

      const newRefresh = await this.createRefreshToken(userId);
      return newRefresh;
    } catch (e) {
      throw new BadRequestException('invalid refresh token');
    }
  }

  async revokeRefreshToken(token: string) {
    try {
      const payload: any = this.jwtService.verify(token, { secret: process.env.JWT_ACCESS_SECRET });
      const userId = payload.sub;
      const tokens = await this.prisma.refreshToken.findMany({ where: { userId, revoked: false }});
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
