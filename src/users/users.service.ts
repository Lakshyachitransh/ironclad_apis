import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/services/email.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService
  ) {}

  // inside UsersService class

/**
 * Create user and attach to tenant in a single transaction.
 * Returns the created user (with id & email).
 * Throws if email already exists or user already attached to any tenant (enforces 1-user->1-tenant).
 */
async createUserAndAttachToTenant(opts: {
  email: string;
  password: string;
  displayName?: string | null;
  tenantId: string;
  roles?: string[];
  sendWelcomeEmail?: boolean;
}) {
  const salt = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
  const passwordHash = await bcrypt.hash(opts.password, salt);

  try {
    const result = await this.prisma.$transaction(async (tx) => {
      // 1) check email uniqueness
      const existing = await tx.user.findUnique({ where: { email: opts.email } });
      if (existing) {
        // If user exists, check their tenant membership
        const existingMembership = await tx.userTenant.findFirst({ where: { userId: existing.id } });
        if (existingMembership) {
          throw new BadRequestException('User already exists and is attached to a tenant');
        }
        // If user exists but without tenant, you might choose to attach them instead of failing.
        // For now, we treat as conflict.
        throw new BadRequestException('Email already exists');
      }

      // 2) create user
      const created = await tx.user.create({
        data: {
          email: opts.email,
          passwordHash,
          displayName: opts.displayName ?? null,
          status: 'active',
        },
      });

      // 3) verify tenant exists
      const tenant = await tx.tenant.findUnique({ where: { id: opts.tenantId } });
      if (!tenant) throw new BadRequestException('Tenant not found');

      // 4) create UserTenant linking the user
      await tx.userTenant.create({
        data: {
          userId: created.id,
          tenantId: opts.tenantId,
          roles: opts.roles ?? ['learner'],
        },
      });

      // return minimal created user with password for email sending
      return { ...created, tempPassword: opts.password, tenant };
    });

    // 5) Send welcome email asynchronously (don't wait for it)
    if (opts.sendWelcomeEmail !== false) {
      const loginUrl = process.env.APP_LOGIN_URL || 'https://app.ironclad.local/login';
      this.emailService.sendWelcomeEmail(
        result.email,
        result.displayName || result.email.split('@')[0],
        result.tempPassword,
        result.tenant.name,
        loginUrl
      ).catch(err => {
        console.error('Failed to send welcome email:', err);
      });
    }

    return result;
  } catch (err) {
    // rethrow known exceptions, otherwise normalize
    if (err instanceof BadRequestException) throw err;
    // handle Prisma unique constraint errors
    if (err?.code === 'P2002' && String(err.meta?.target).includes('email')) {
      throw new BadRequestException('Email already exists');
    }
    throw err;
  }
}

  /**
   * Create user and attach to tenant by tenant name.
   * - Looks up tenant by name
   * - Creates user and UserTenant relationship in single transaction
   * - Returns full user details with tenant information
   */
  async createUserAndAttachToTenantByName(opts: {
    email: string;
    password: string;
    displayName?: string | null;
    tenantName: string;
    roles?: string[];
  }) {
    const salt = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
    const passwordHash = await bcrypt.hash(opts.password, salt);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // 1) Check email uniqueness
        const existing = await tx.user.findUnique({ where: { email: opts.email } });
        if (existing) {
          const existingMembership = await tx.userTenant.findFirst({ where: { userId: existing.id } });
          if (existingMembership) {
            throw new BadRequestException('User already exists and is attached to a tenant');
          }
          throw new BadRequestException('Email already exists');
        }

        // 2) Look up tenant by name
        const tenant = await tx.tenant.findUnique({ where: { name: opts.tenantName } });
        if (!tenant) {
          throw new BadRequestException(`Tenant "${opts.tenantName}" not found`);
        }

        // 3) Create user
        const created = await tx.user.create({
          data: {
            email: opts.email,
            passwordHash,
            displayName: opts.displayName ?? null,
            status: 'active',
          },
        });

        // 4) Create UserTenant linking the user
        const userTenant = await tx.userTenant.create({
          data: {
            userId: created.id,
            tenantId: tenant.id,
            roles: opts.roles ?? ['learner'],
          },
        });

        // 5) Return full user details with tenant information
        return {
          id: created.id,
          email: created.email,
          displayName: created.displayName,
          status: created.status,
          createdAt: created.createdAt,
          tenantName: tenant.name,
          tenantId: tenant.id,
          roles: userTenant.roles,
          userTenantId: userTenant.id,
        };
      });

      return result;
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      if (err?.code === 'P2002' && String(err.meta?.target).includes('email')) {
        throw new BadRequestException('Email already exists');
      }
      throw err;
    }
  }

  /**
   * Bulk create users from CSV
   * CSV format: email, displayName, password (optional), roles (optional)
   */
  async bulkCreateUsersFromCsv(csvContent: string, tenantId: string, defaultRoles: string[] = ['learner']) {
    const lines = csvContent.trim().split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new BadRequestException('CSV must have at least a header row and one data row');
    }

    // Parse CSV header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const emailIdx = headers.indexOf('email');
    const nameIdx = headers.indexOf('displayname');
    const passwordIdx = headers.indexOf('password');
    const rolesIdx = headers.indexOf('roles');

    if (emailIdx === -1) {
      throw new BadRequestException('CSV must have an "email" column');
    }

    // Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    const results: any[] = [];
    const errors: any[] = [];

    // Process each data row
    for (let i = 1; i < lines.length; i++) {
      let values: string[] = [];
      try {
        values = lines[i].split(',').map(v => v.trim());
        
        const email = values[emailIdx];
        if (!email || !this.isValidEmail(email)) {
          errors.push({ row: i + 1, error: 'Invalid or missing email' });
          continue;
        }

        const displayName = nameIdx !== -1 ? values[nameIdx] : `User ${i}`;
        const password = passwordIdx !== -1 && values[passwordIdx] ? values[passwordIdx] : this.generateRandomPassword();
        const rolesStr = rolesIdx !== -1 ? values[rolesIdx] : null;
        const roles = rolesStr ? rolesStr.split('|').map(r => r.trim()).filter(r => r) : defaultRoles;

        // Create user
        const user = await this.createUserAndAttachToTenant({
          email,
          password,
          displayName,
          tenantId,
          roles,
        });

        results.push({
          email,
          displayName,
          userId: user.id,
          roles,
          password, // return generated password only
          status: 'created'
        });
      } catch (err: any) {
        errors.push({ 
          row: i + 1, 
          email: values[emailIdx] || 'N/A',
          error: err?.message || 'Unknown error' 
        });
      }
    }

    return {
      total: lines.length - 1,
      successful: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private generateRandomPassword(): string {
    return crypto.randomBytes(8).toString('hex') + 'Aa1!';
  }

  // find user by id
  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  // find user by email
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  // create a user (no tenant linkage) — returns created user
  async createUser(email: string, password: string, displayName?: string) {
    const salt = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
    const hash = await bcrypt.hash(password, salt);
    try {
      const user = await this.prisma.user.create({
        data: { email, passwordHash: hash, displayName },
      });
      return user;
    } catch (err: any) {
      if (err?.code === 'P2002' && String(err.meta?.target)?.includes('email')) {
        throw new ConflictException('Email already exists');
      }
      throw err;
    }
  }

  /**
   * Attach a user to a tenant.
   * Enforces "one user -> one tenant" rule by checking any existing membership.
   * Optionally accepts initial roles (role codes) which will be validated by the caller.
   */
  async attachUserToTenant(userId: string, tenantId: string, roles: string[] = ['learner']) {
    // 1) check if user exists
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { tenants: true }});
    if (!user) throw new BadRequestException('User not found');

    // 2) enforce single-tenant-per-user rule
    if (Array.isArray(user.tenants) && user.tenants.length > 0) {
      // user already attached to a tenant — deny
      throw new BadRequestException('User already attached to a tenant');
    }

    // 3) ensure tenant exists
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }});
    if (!tenant) throw new BadRequestException('Tenant not found');

    // 4) create UserTenant entry
    const userTenant = await this.prisma.userTenant.create({
      data: {
        userId,
        tenantId,
        roles,
      },
    });

    return userTenant;
  }

  /**
   * List users for tenant (returns user + roles)
   */
  async listUsers(tenantId: string) {
    const rows = await this.prisma.userTenant.findMany({
      where: { tenantId },
      include: { user: true },
    });
    return rows;
  }

  /**
   * Get the tenant membership and role codes for a user
   * Returns null if user has no tenant membership
   */
  async getUserTenantMembership(userId: string) {
    const ut = await this.prisma.userTenant.findFirst({
      where: { userId },
    });
    return ut;
  }
}

