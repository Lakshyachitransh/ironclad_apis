import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/services/email.service';
import { EmailNotificationService } from '../common/services/email-notification.service';
import { RolesService } from '../roles/roles.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private emailNotification: EmailNotificationService,
    private rolesService: RolesService
  ) {}

  // inside UsersService class

/**
 * Create tenant user and attach to tenant in a single transaction.
 * User can only be assigned ONE role at a time.
 * Returns the created tenant user (with id & email).
 * Throws if email already exists in the tenant or role is invalid.
 */
async createUserAndAttachToTenant(opts: {
  email: string;
  password: string;
  displayName?: string | null;
  tenantId: string;
  role: string; // Single role code
  sendWelcomeEmail?: boolean;
}) {
  // Validate required fields
  if (!opts.role || opts.role.trim() === '') {
    throw new BadRequestException('Role is required and cannot be empty');
  }

  const salt = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
  const passwordHash = await bcrypt.hash(opts.password, salt);

  try {
    const result = await this.prisma.$transaction(async (tx) => {
      // 1) Verify role exists in Role table
      const roleExists = await tx.role.findUnique({ where: { code: opts.role } });
      if (!roleExists) {
        throw new BadRequestException(`Role "${opts.role}" does not exist`);
      }

      // 2) verify tenant exists
      const tenant = await tx.tenant.findUnique({ where: { id: opts.tenantId } });
      if (!tenant) throw new BadRequestException('Tenant not found');

      // 3) check email uniqueness within tenant
      const existing = await tx.tenantUser.findFirst({
        where: {
          email: opts.email,
          tenantId: opts.tenantId,
        },
      });
      if (existing) {
        throw new BadRequestException('Email already exists in this tenant');
      }

      // 4) create tenant user with single role
      const created = await tx.tenantUser.create({
        data: {
          email: opts.email,
          passwordHash,
          displayName: opts.displayName ?? null,
          status: 'active',
          tenantId: opts.tenantId,
          tenantRoles: [opts.role], // Single role in array format
        },
      });

      // return created user with password for email sending
      return { ...created, tempPassword: opts.password, tenant };
    });

    // 4) Send welcome email asynchronously (don't wait for it)
    if (opts.sendWelcomeEmail !== false) {
      this.emailNotification.sendWelcomeEmail(
        result.email,
        result.displayName || result.email.split('@')[0],
        result.tempPassword,
        result.tenant.name
      ).then(async () => {
        // Mark as sent in database
        await this.prisma.tenantUser.update({
          where: { id: result.id },
          data: {
            welcomeEmailSent: true,
            welcomeEmailSentAt: new Date(),
          },
        });
      }).catch(err => {
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
   * User can only be assigned ONE role at a time.
   * - Looks up tenant by name
   * - Creates user and user record in single transaction
   * - Returns full user details with tenant information
   */
  async createUserAndAttachToTenantByName(opts: {
    email: string;
    password: string;
    displayName?: string | null;
    tenantName: string;
    role: string; // Single role code
  }) {
    // Validate required fields
    if (!opts.role || (typeof opts.role === 'string' && opts.role.trim() === '')) {
      throw new BadRequestException('Role is required and cannot be empty. Available roles: "tenant_admin", "instructor", "trainer", "learner", "training_manager"');
    }

    if (!opts.tenantName || (typeof opts.tenantName === 'string' && opts.tenantName.trim() === '')) {
      throw new BadRequestException('Tenant name is required and cannot be empty');
    }

    const salt = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
    const passwordHash = await bcrypt.hash(opts.password, salt);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // 1) Look up tenant by name
        const tenant = await tx.tenant.findUnique({ where: { name: opts.tenantName } });
        if (!tenant) {
          throw new BadRequestException(`Tenant "${opts.tenantName}" not found`);
        }

        // 2) Verify role exists in Role table
        const roleExists = await tx.role.findUnique({ where: { code: opts.role } });
        if (!roleExists) {
          throw new BadRequestException(`Role "${opts.role}" does not exist`);
        }

        // 3) Check email uniqueness within tenant
        const existing = await tx.tenantUser.findFirst({
          where: {
            email: opts.email,
            tenantId: tenant.id,
          },
        });
        if (existing) {
          throw new BadRequestException('Email already exists in this tenant');
        }

        // 4) Create tenant user with single role
        const created = await tx.tenantUser.create({
          data: {
            email: opts.email,
            passwordHash,
            displayName: opts.displayName ?? null,
            status: 'active',
            tenantId: tenant.id,
            tenantRoles: [opts.role], // Single role in array format
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
          tenantRoles: created.tenantRoles,
          updatedAt: created.updatedAt,
        };
      });

      // Send welcome email asynchronously (don't wait for it)
      this.emailNotification.sendWelcomeEmail(
        result.email,
        result.displayName || result.email.split('@')[0],
        opts.password,
        result.tenantName
      ).then(async () => {
        // Mark as sent in database
        await this.prisma.tenantUser.update({
          where: { id: result.id },
          data: {
            welcomeEmailSent: true,
            welcomeEmailSentAt: new Date(),
          },
        });
      }).catch(err => {
        console.error('Failed to send welcome email:', err);
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
   * CSV format: email, displayName, password (optional), role (required - single role per user)
   * Each user gets assigned exactly one role
   */
  async bulkCreateUsersFromCsv(csvContent: string, tenantId: string, defaultRole: string = 'learner') {
    const lines = csvContent.trim().split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new BadRequestException('CSV must have at least a header row and one data row');
    }

    // Parse CSV header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const emailIdx = headers.indexOf('email');
    const nameIdx = headers.indexOf('displayname');
    const passwordIdx = headers.indexOf('password');
    const roleIdx = headers.indexOf('role');

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
        const role = roleIdx !== -1 && values[roleIdx] ? values[roleIdx].trim() : defaultRole;

        // Validate role exists
        const roleExists = await this.prisma.role.findUnique({ where: { code: role } });
        if (!roleExists) {
          errors.push({ 
            row: i + 1, 
            email,
            error: `Role "${role}" does not exist` 
          });
          continue;
        }

        // Create user with single role
        const user = await this.createUserAndAttachToTenant({
          email,
          password,
          displayName,
          tenantId,
          role, // Single role
        });

        results.push({
          email,
          displayName,
          userId: user.id,
          role, // Single role
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

  // find user by id (searches both TenantUser and PlatformUser)
  async findById(id: string) {
    // Try tenant user first
    const tenantUser = await this.prisma.tenantUser.findUnique({ where: { id } });
    if (tenantUser) return { ...tenantUser, userType: 'tenant' };

    // Try platform user
    const platformUser = await this.prisma.platformUser.findUnique({ where: { id } });
    if (platformUser) return { ...platformUser, userType: 'platform' };

    return null;
  }

  // find user by email (searches both TenantUser and PlatformUser)
  async findByEmail(email: string) {
    // Try platform user first (must be unique)
    const platformUser = await this.prisma.platformUser.findUnique({ where: { email } });
    if (platformUser) return { ...platformUser, userType: 'platform' };

    // Try tenant user (search all tenants)
    const tenantUser = await this.prisma.tenantUser.findFirst({ where: { email } });
    if (tenantUser) return { ...tenantUser, userType: 'tenant' };

    return null;
  }

  // create a user (no tenant linkage) — returns created user
  /**
   * @deprecated use createUserAndAttachToTenant or createPlatformUser instead
   */
  async createUser(email: string, password: string, displayName?: string) {
    throw new BadRequestException('Use createUserAndAttachToTenant() or createPlatformUser() instead');
  }

  /**
   * @deprecated TenantUser is created directly with tenantId, no need to attach separately
   */
  async attachUserToTenant(userId: string, tenantId: string, roles: string[] = ['learner']) {
    throw new BadRequestException('Use createUserAndAttachToTenant() instead. TenantUser includes tenantId by design.');
  }

  /**
   * List tenant users for a specific tenant
   */
  async listUsers(tenantId: string) {
    const users = await this.prisma.tenantUser.findMany({
      where: { tenantId },
      select: {
        id: true,
        email: true,
        displayName: true,
        status: true,
        tenantRoles: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return users;
  }

  /**
   * Get tenant user by ID and tenant
   */
  async getTenantUser(userId: string, tenantId: string) {
    return await this.prisma.tenantUser.findFirst({
      where: {
        id: userId,
        tenantId,
      },
    });
  }

  /**
   * Delete a user by ID
   * Can delete either a TenantUser or PlatformUser
   */
  async deleteUserById(userId: string) {
    try {
      // Try to delete as TenantUser first
      const tenantUser = await this.prisma.tenantUser.findUnique({
        where: { id: userId },
      });

      if (tenantUser) {
        const deleted = await this.prisma.tenantUser.delete({
          where: { id: userId },
        });

        return {
          success: true,
          message: `Tenant user ${deleted.email} deleted successfully`,
          deletedUser: {
            id: deleted.id,
            email: deleted.email,
            displayName: deleted.displayName,
            type: 'tenant',
            deletedAt: new Date().toISOString(),
          },
        };
      }

      // Try to delete as PlatformUser
      const platformUser = await this.prisma.platformUser.findUnique({
        where: { id: userId },
      });

      if (platformUser) {
        const deleted = await this.prisma.platformUser.delete({
          where: { id: userId },
        });

        return {
          success: true,
          message: `Platform user ${deleted.email} deleted successfully`,
          deletedUser: {
            id: deleted.id,
            email: deleted.email,
            displayName: deleted.displayName,
            type: 'platform',
            deletedAt: new Date().toISOString(),
          },
        };
      }

      throw new BadRequestException('User not found');
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('Failed to delete user: ' + (err?.message || 'Unknown error'));
    }
  }

  /**
   * Get all users - both tenant users and platform users
   * Public endpoint accessible to anyone
   */
  async getAllUsers() {
    // Fetch all tenant users directly from TenantUser table
    const tenantUsers = await this.prisma.tenantUser.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        status: true,
        tenantId: true,
        tenantRoles: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch all platform users directly from PlatformUser table
    const platformUsers = await this.prisma.platformUser.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        status: true,
        platformRoles: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      tenantUsers,
      platformUsers,
      total: {
        tenantUsers: tenantUsers.length,
        platformUsers: platformUsers.length,
        combinedTotal: tenantUsers.length + platformUsers.length,
      },
    };
  }

  /**
   * Create a platform user (admin user)
   * User can only be assigned ONE platform role at a time
   * Platform users are not tied to any tenant
   */
  async createPlatformUser(opts: {
    email: string;
    password: string;
    displayName: string;
    platformRole: string; // Single platform role code
  }) {
    // Validate required fields
    if (!opts.platformRole || opts.platformRole.trim() === '') {
      throw new BadRequestException('Platform role is required and cannot be empty');
    }

    const salt = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
    const passwordHash = await bcrypt.hash(opts.password, salt);

    try {
      // 1) Check if role exists in Role table
      const roleExists = await this.prisma.role.findUnique({
        where: { code: opts.platformRole },
      });

      if (!roleExists) {
        throw new BadRequestException(`Role "${opts.platformRole}" does not exist`);
      }

      // 2) Check if email already exists in platform users
      const existing = await this.prisma.platformUser.findUnique({
        where: { email: opts.email },
      });

      if (existing) {
        throw new ConflictException('Platform user with this email already exists');
      }

      // 3) Create platform user with single role
      const created = await this.prisma.platformUser.create({
        data: {
          email: opts.email,
          passwordHash,
          displayName: opts.displayName,
          status: 'active',
          platformRoles: [opts.platformRole], // Single role in array format
        },
      });

      // 4) Send welcome email asynchronously (don't wait for it)
      const tenantName = 'Ironclad Platform';
      this.emailNotification.sendWelcomeEmail(
        created.email,
        created.displayName || created.email.split('@')[0],
        opts.password,
        tenantName
      ).then(async () => {
        // Mark as sent in database
        await this.prisma.platformUser.update({
          where: { id: created.id },
          data: {
            welcomeEmailSent: true,
            welcomeEmailSentAt: new Date(),
          },
        });
      }).catch(err => {
        console.error('Failed to send welcome email:', err);
      });

      return {
        id: created.id,
        email: created.email,
        displayName: created.displayName,
        status: created.status,
        platformRoles: created.platformRoles,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      };
    } catch (err) {
      if (err instanceof ConflictException || err instanceof BadRequestException) throw err;
      throw new BadRequestException('Failed to create platform user: ' + (err?.message || 'Unknown error'));
    }
  }
}

