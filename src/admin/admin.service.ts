import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

const execAsync = promisify(exec);

@Injectable()
export class AdminService {
  private readonly envFilePath = path.join(process.cwd(), '.env');

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {}

  /**
   * Update PostgreSQL connection details and run Prisma migrations
   */
  async updateDatabaseConfig(
    host: string,
    port: number,
    username: string,
    password: string,
    database: string
  ) {
    try {
      // Validate inputs
      if (!host || !username || !password || !database) {
        throw new BadRequestException('All database fields are required: host, port, username, password, database');
      }

      if (port < 1 || port > 65535) {
        throw new BadRequestException('Invalid port number. Port must be between 1 and 65535');
      }

      // Build connection string
      const connectionString = `postgresql://${username}:${encodeURIComponent(password)}@${host}:${port}/${database}`;

      // Read current .env file
      let envContent = fs.readFileSync(this.envFilePath, 'utf-8');

      // Update or add DATABASE_URL
      if (envContent.includes('DATABASE_URL=')) {
        envContent = envContent.replace(
          /DATABASE_URL=.*/,
          `DATABASE_URL="${connectionString}"`
        );
      } else {
        envContent += `\nDATABASE_URL="${connectionString}"`;
      }

      // Write updated .env file
      fs.writeFileSync(this.envFilePath, envContent, 'utf-8');

      // Update process.env so it takes effect immediately
      process.env.DATABASE_URL = connectionString;

      return {
        success: true,
        message: 'Database configuration updated successfully',
        host,
        port,
        username,
        database,
        connectionString: connectionString.replace(password, '****')
      };
    } catch (error) {
      throw new BadRequestException(`Failed to update database config: ${error.message}`);
    }
  }

  /**
   * Run Prisma migrations
   */
  async runMigrations() {
    try {
      console.log('Starting Prisma migrations...');
      
      const { stdout, stderr } = await execAsync('npx prisma migrate deploy', {
        cwd: process.cwd(),
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      if (stderr && !stderr.includes('warn')) {
        console.error('Migration stderr:', stderr);
      }

      console.log('Migrations completed successfully');

      return {
        success: true,
        message: 'Prisma migrations deployed successfully',
        output: stdout
      };
    } catch (error) {
      console.error('Migration error:', error);
      throw new BadRequestException(`Failed to run migrations: ${error.message}`);
    }
  }

  /**
   * Run migrations and push schema
   */
  async updateDatabaseAndMigrate(
    host: string,
    port: number,
    username: string,
    password: string,
    database: string
  ) {
    try {
      // First update the config
      const configResult = await this.updateDatabaseConfig(host, port, username, password, database);

      // Wait a moment for environment to update
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Then run migrations
      const migrationResult = await this.runMigrations();

      return {
        success: true,
        message: 'Database configuration updated and migrations completed',
        config: configResult,
        migration: migrationResult
      };
    } catch (error) {
      throw new BadRequestException(`Failed to update database and run migrations: ${error.message}`);
    }
  }

  /**
   * Get current database configuration (without password)
   */
  async getCurrentDatabaseConfig() {
    try {
      const databaseUrl = process.env.DATABASE_URL || '';
      
      if (!databaseUrl) {
        return {
          configured: false,
          message: 'No DATABASE_URL configured'
        };
      }

      // Parse connection string
      const urlRegex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
      const match = databaseUrl.match(urlRegex);

      if (!match) {
        return {
          configured: true,
          connectionString: '****',
          message: 'DATABASE_URL is configured but unable to parse'
        };
      }

      const [, username, , host, port, database] = match;

      return {
        configured: true,
        host,
        port: parseInt(port),
        username,
        database,
        connectionString: databaseUrl.replace(/:[^@]+@/, ':****@')
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get database config: ${error.message}`);
    }
  }

  /**
   * Get all users across all tenants with their course assignment details
   * Only org_admin can access this
   */
  async getAllUsersWithCourseAssignments(tenantId?: string) {
    try {
      // Get all users first
      let allUsers;
      if (tenantId) {
        // Get users for specific tenant
        allUsers = await this.prisma.user.findMany({
          where: {
            tenants: {
              some: {
                tenantId: tenantId
              }
            }
          },
          select: {
            id: true,
            email: true,
            displayName: true,
            status: true
          }
        });
      } else {
        // Get all users
        allUsers = await this.prisma.user.findMany({
          select: {
            id: true,
            email: true,
            displayName: true,
            status: true
          }
        });
      }

      const userIds = allUsers.map(u => u.id);
      const whereClause = tenantId 
        ? { tenantId, assignedTo: { in: userIds } }
        : { assignedTo: { in: userIds } };

      // Get all course assignments with related data
      const courseAssignments = await this.prisma.courseAssignment.findMany({
        where: whereClause,
        include: {
          tenant: {
            select: {
              id: true,
              name: true
            }
          },
          course: {
            select: {
              id: true,
              title: true
            }
          },
          userProgress: {
            select: {
              userId: true,
              progressPercentage: true,
              status: true,
              lessonsCompleted: true,
              lessonsTotal: true,
              startedAt: true,
              completedAt: true
            }
          }
        }
      });

      const userMap = new Map<string, {id: string; email: string; displayName: string | null; status: string}>(allUsers.map(u => [u.id, u]));

      // Group by user and build response - include all users
      const groupedByUser: Record<string, any> = {};

      // Initialize all users first
      allUsers.forEach(user => {
        groupedByUser[user.id] = {
          userId: user.id,
          email: user.email,
          displayName: user.displayName,
          status: user.status,
          totalCoursesAssigned: 0,
          coursesCompleted: 0,
          courseAssignments: []
        };
      });

      // Add course assignments
      courseAssignments.forEach(ca => {
        if (!groupedByUser[ca.assignedTo]) {
          const userData = userMap.get(ca.assignedTo);
          if (userData) {
            groupedByUser[ca.assignedTo] = {
              userId: ca.assignedTo,
              email: userData.email,
              displayName: userData.displayName,
              status: userData.status,
              totalCoursesAssigned: 0,
              coursesCompleted: 0,
              courseAssignments: []
            };
          }
        }

        const userProgress = ca.userProgress[0];
        groupedByUser[ca.assignedTo].courseAssignments.push({
          courseAssignmentId: ca.id,
          tenantName: ca.tenant.name,
          tenantId: ca.tenant.id,
          courseTitle: ca.course.title,
          courseId: ca.course.id,
          assignmentStatus: ca.status,
          dueDate: ca.dueDate,
          assignedAt: ca.assignedAt,
          progress: userProgress ? {
            progressPercentage: userProgress.progressPercentage,
            status: userProgress.status,
            lessonsCompleted: userProgress.lessonsCompleted,
            lessonsTotal: userProgress.lessonsTotal,
            startedAt: userProgress.startedAt,
            completedAt: userProgress.completedAt
          } : null
        });

        groupedByUser[ca.assignedTo].totalCoursesAssigned++;
        if (userProgress?.status === 'completed') {
          groupedByUser[ca.assignedTo].coursesCompleted++;
        }
      });

      return {
        success: true,
        totalUsers: Object.keys(groupedByUser).length,
        data: Object.values(groupedByUser)
      };
    } catch (error) {
      throw new BadRequestException(`Failed to fetch users with course assignments: ${error.message}`);
    }
  }

  /**
   * Get users for a specific tenant with their course assignments
   */
  async getTenantUsersWithCourseAssignments(tenantId: string) {
    try {
      if (!tenantId) {
        throw new BadRequestException('Tenant ID is required');
      }

      // Verify tenant exists
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        throw new BadRequestException('Tenant not found');
      }

      return this.getAllUsersWithCourseAssignments(tenantId);
    } catch (error) {
      throw new BadRequestException(`Failed to fetch tenant users: ${error.message}`);
    }
  }

  /**
   * Create a tenant admin user for a specific tenant
   * org_admin only endpoint
   */
  async createTenantAdmin(data: {
    tenantId: string;
    email: string;
    displayName: string;
    password: string;
  }) {
    try {
      const { tenantId, email, displayName, password } = data;

      if (!tenantId || !email || !displayName || !password) {
        throw new BadRequestException('tenantId, email, displayName, and password are required');
      }

      // Verify tenant exists
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        throw new BadRequestException('Tenant not found');
      }

      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Hash password
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          email,
          displayName,
          passwordHash,
          status: 'active'
        }
      });

      // Assign user to tenant with tenant_admin role
      const userTenant = await this.prisma.userTenant.create({
        data: {
          userId: user.id,
          tenantId,
          roles: ['tenant_admin']
        }
      });

      return {
        success: true,
        message: 'Tenant admin created successfully',
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          status: user.status,
          createdAt: user.createdAt
        },
        tenant: {
          id: tenant.id,
          name: tenant.name
        },
        roles: ['tenant_admin'],
        userTenantId: userTenant.id
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create tenant admin: ${error.message}`);
    }
  }
}
