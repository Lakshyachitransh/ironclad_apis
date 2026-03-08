import { Controller, Post, Body, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import type { Response, Request } from 'express';
import { EmailNotificationService } from '../common/services/email-notification.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private prisma: PrismaService,
    private emailNotification: EmailNotificationService
  ) {}

  @Post('register')
  @ApiOperation({ 
    summary: 'Register a new user',
    description: 'Creates a new platform user account with email, password, and optional display name. Returns access and refresh tokens.'
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ 
    status: 201, 
    description: 'User registered successfully',
    schema: {
      example: {
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'user@example.com',
          displayName: 'User Name',
          roles: ['platform_admin']
        },
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'User already exists or validation failed' })
  async register(@Body() dto: RegisterDto) {
    const exists = await this.prisma.platformUser.findUnique({ where: { email: dto.email } });
    if (exists) throw new UnauthorizedException('user exists');
    
    const salt = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
    const passwordHash = await bcrypt.hash(dto.password, salt);
    
    // Check if email domain is platform admin domain (@secnuo or @ironclad)
    const platformAdminDomains = ['@secnuo', '@ironclad'];
    const isPlatformAdminDomain = platformAdminDomains.some(domain => 
      dto.email.toLowerCase().includes(domain)
    );
    
    // Create platform user with platform_admin role if email domain matches
    const user = await this.prisma.platformUser.create({
      data: {
        email: dto.email,
        passwordHash,
        displayName: dto.displayName || null,
        platformRoles: isPlatformAdminDomain ? ['platform_admin'] : ['viewer']
      }
    });
    
    // Send welcome email asynchronously (don't wait for it)
    const displayName = dto.displayName || user.email.split('@')[0];
    const tenantName = 'Ironclad Platform';
    this.emailNotification.sendWelcomeEmail(
      user.email,
      displayName,
      dto.password,
      tenantName
    ).then(async () => {
      // Mark as sent in database
      await this.prisma.platformUser.update({
        where: { id: user.id },
        data: {
          welcomeEmailSent: true,
          welcomeEmailSentAt: new Date(),
        },
      });
    }).catch(err => {
      console.error('Failed to send welcome email:', err);
    });
    
    const access = this.auth.signAccessToken({ id: user.id, email: user.email, tenantId: null, roles: user.platformRoles });
    const refresh = await this.auth.createRefreshToken(user.id, 'platform');
    return { user: { id: user.id, email: user.email, displayName: user.displayName, roles: user.platformRoles }, access_token: access, refresh_token: refresh };
  }

  @Post('login')
  @ApiOperation({ 
    summary: 'User login',
    description: 'Authenticates user (platform or tenant) with email and password. Returns access and refresh tokens. Refresh token is also set as HTTP-only cookie.'
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'user@example.com',
          tenantId: null,
          roles: ['platform_admin']
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    // Log login attempt
    console.log('🔐 Login Attempt:');
    console.log(`   📧 Email: ${dto.email}`);
    console.log(`   🔑 Password: ${dto.password}`);
    console.log('---');

    const user = await this.auth.validateUser(dto.email, dto.password);
    if (!user) throw new UnauthorizedException('invalid credentials');
    
    // Fetch tenant and roles
    const { tenantId, roles, userType } = await this.auth.getUserTenantAndRoles(user.id);
    
    // Fetch tenant name if tenantId exists
    let tenantName: string | null = null;
    if (tenantId) {
      const tenant = await this.auth['prisma'].tenant.findUnique({
        where: { id: tenantId },
        select: { name: true }
      });
      tenantName = tenant?.name ?? null;
    }
    
    // Get permissions for roles
    let permissions: string[] = [];
    if (roles && roles.length > 0) {
      const permsSet = new Set<string>();
      for (const role of roles) {
        const rolePerms = await this.auth['rolesService'].getPermissionsForRole(role);
        for (const rp of rolePerms) {
          if (rp.permission && rp.permission.code) {
            permsSet.add(rp.permission.code);
          }
        }
      }
      permissions = Array.from(permsSet);
    }
    
    const access = await this.auth.signAccessToken({ id: user.id, email: user.email, tenantId, tenantName, roles });
    const refresh = await this.auth.createRefreshToken(user.id, (userType || 'tenant') as 'platform' | 'tenant', undefined, undefined);
    
    // set HTTP-only cookie for refresh token
    res.cookie('refresh_token', refresh, { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS || '30', 10) });
    
    console.log('✅ Login Success:');
    console.log(`   👤 User ID: ${user.id}`);
    console.log(`   🏢 Tenant ID: ${tenantId}`);
    console.log(`   🏢 Tenant Name: ${tenantName}`);
    console.log(`   🎭 Roles: ${roles.join(', ')}`);
    console.log('---');
    
    return { 
      access_token: access, 
      user: { 
        id: user.id, 
        email: user.email, 
        displayName: user.displayName,
        tenantId, 
        tenantName,
        roles, 
        permissions,
        userType
      } 
    };
  }

  @Post('refresh')
  @ApiBearerAuth('access-token')
  @ApiOperation({ 
    summary: 'Refresh access token',
    description: 'Rotates the refresh token and returns a new access token. Requires refresh token in body or cookies.'
  })
  @ApiBody({ 
    schema: {
      example: {
        refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'New access token generated',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'No refresh token provided or invalid token' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.refresh_token || req.body?.refresh_token || req.headers.cookie;
    console.log('req.headers.cookie =', req.headers.cookie);
    console.log('req.cookies =', (req as any).cookies);
    console.log(token.refresh_token);
    if (!token) throw new UnauthorizedException('no refresh token');
    const newRefresh = await this.auth.rotateRefreshToken(token);
    const payload: any = this.auth['jwtService'].verify(newRefresh, { secret: process.env.JWT_ACCESS_SECRET });
    
    // Fetch tenant and roles
    const { tenantId, roles } = await this.auth.getUserTenantAndRoles(payload.sub);
    
    // Fetch tenant name if tenantId exists
    let tenantName: string | null = null;
    if (tenantId) {
      const tenant = await this.auth['prisma'].tenant.findUnique({
        where: { id: tenantId },
        select: { name: true }
      });
      tenantName = tenant?.name ?? null;
    }
    
    const access = this.auth.signAccessToken({ id: payload.sub, email: payload.email, tenantId, tenantName, roles });
    res.cookie('refresh_token', newRefresh, { httpOnly: true });
    return { access_token: access };
  }

  @Post('logout')
  @ApiBearerAuth('access-token')
  @ApiOperation({ 
    summary: 'User logout',
    description: 'Revokes the refresh token and clears the refresh_token cookie.'
  })
  @ApiBody({ 
    schema: {
      example: {
        refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Logout successful',
    schema: {
      example: { ok: true }
    }
  })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.refresh_token || req.body?.refresh_token;
    console.log('req.headers.cookie =', req.headers.cookie);
    console.log('req.cookies =', (req as any).cookies);

    if (token) await this.auth.revokeRefreshToken(token);
    res.clearCookie('refresh_token');
    return { ok: true };
  }
}

