import { PrismaClient } from '../generated/prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function seedPermissionsForPlatformAdmin() {
  console.log('🔐 Seeding permissions for platform_admin role...\n');

  try {
    // Define all permissions
    const permissions = [
      // Auth
      { code: 'auth.register', name: 'Register user', resource: 'auth', action: 'register', category: 'Authentication' },
      { code: 'auth.login', name: 'Login user', resource: 'auth', action: 'login', category: 'Authentication' },
      { code: 'auth.refresh', name: 'Refresh token', resource: 'auth', action: 'refresh', category: 'Authentication' },
      { code: 'auth.logout', name: 'Logout user', resource: 'auth', action: 'logout', category: 'Authentication' },

      // Users
      { code: 'users.create', name: 'Create user', resource: 'users', action: 'create', category: 'User Management' },
      { code: 'users.list', name: 'List users', resource: 'users', action: 'read', category: 'User Management' },
      { code: 'users.view', name: 'View user', resource: 'users', action: 'read', category: 'User Management' },
      { code: 'users.update', name: 'Update user', resource: 'users', action: 'update', category: 'User Management' },
      { code: 'users.delete', name: 'Delete user', resource: 'users', action: 'delete', category: 'User Management' },
      { code: 'users.bulk-upload', name: 'Bulk upload users', resource: 'users', action: 'create', category: 'User Management' },

      // Tenants
      { code: 'tenants.create', name: 'Create tenant', resource: 'tenants', action: 'create', category: 'Tenant Management' },
      { code: 'tenants.list', name: 'List tenants', resource: 'tenants', action: 'read', category: 'Tenant Management' },
      { code: 'tenants.view', name: 'View tenant', resource: 'tenants', action: 'read', category: 'Tenant Management' },
      { code: 'tenants.update', name: 'Update tenant', resource: 'tenants', action: 'update', category: 'Tenant Management' },
      { code: 'tenants.delete', name: 'Delete tenant', resource: 'tenants', action: 'delete', category: 'Tenant Management' },

      // Roles
      { code: 'roles.create', name: 'Create role', resource: 'roles', action: 'create', category: 'Access Control' },
      { code: 'roles.list', name: 'List roles', resource: 'roles', action: 'read', category: 'Access Control' },
      { code: 'roles.view', name: 'View role', resource: 'roles', action: 'read', category: 'Access Control' },
      { code: 'roles.update', name: 'Update role', resource: 'roles', action: 'update', category: 'Access Control' },
      { code: 'roles.delete', name: 'Delete role', resource: 'roles', action: 'delete', category: 'Access Control' },
      { code: 'roles.assign', name: 'Assign role', resource: 'roles', action: 'manage', category: 'Access Control' },

      // Courses
      { code: 'courses.create', name: 'Create course', resource: 'courses', action: 'create', category: 'Content Management' },
      { code: 'courses.list', name: 'List courses', resource: 'courses', action: 'read', category: 'Content Management' },
      { code: 'courses.view', name: 'View course', resource: 'courses', action: 'read', category: 'Content Management' },
      { code: 'courses.update', name: 'Update course', resource: 'courses', action: 'update', category: 'Content Management' },
      { code: 'courses.delete', name: 'Delete course', resource: 'courses', action: 'delete', category: 'Content Management' },
      { code: 'courses.assign', name: 'Assign course', resource: 'courses', action: 'manage', category: 'Content Management' },

      // Quizzes
      { code: 'quizzes.create', name: 'Create quiz', resource: 'quizzes', action: 'create', category: 'Content Management' },
      { code: 'quizzes.update', name: 'Update quiz', resource: 'quizzes', action: 'update', category: 'Content Management' },
      { code: 'quizzes.delete', name: 'Delete quiz', resource: 'quizzes', action: 'delete', category: 'Content Management' },
      { code: 'quizzes.publish', name: 'Publish quiz', resource: 'quizzes', action: 'manage', category: 'Content Management' },

      // Live Classes
      { code: 'live-classes.create', name: 'Create live class', resource: 'live-class', action: 'create', category: 'Learning Events' },
      { code: 'live-classes.start', name: 'Start live class', resource: 'live-class', action: 'manage', category: 'Learning Events' },
      { code: 'live-classes.end', name: 'End live class', resource: 'live-class', action: 'manage', category: 'Learning Events' },
      { code: 'live-classes.join', name: 'Join live class', resource: 'live-class', action: 'read', category: 'Learning Events' },

      // Licenses
      { code: 'licenses.create', name: 'Create license', resource: 'licenses', action: 'create', category: 'License Management' },
      { code: 'licenses.list', name: 'List licenses', resource: 'licenses', action: 'read', category: 'License Management' },
      { code: 'licenses.assign', name: 'Assign license', resource: 'licenses', action: 'manage', category: 'License Management' },
      { code: 'licenses.revoke', name: 'Revoke license', resource: 'licenses', action: 'delete', category: 'License Management' },

      // Admin
      { code: 'admin.manage', name: 'Manage admin', resource: 'admin', action: 'manage', category: 'Administration' },
    ];

    // Create or update permissions
    console.log(`📝 Creating ${permissions.length} permissions...\n`);
    for (const perm of permissions) {
      try {
        const permission = await prisma.permission.upsert({
          where: { code: perm.code },
          update: { name: perm.name, category: perm.category },
          create: {
            code: perm.code,
            name: perm.name,
            resource: perm.resource,
            action: perm.action,
            category: perm.category,
          },
        });
        console.log(`✓ ${permission.code} - ${permission.name}`);
      } catch (error: any) {
        if (error.code === 'P2002') {
          // Unique constraint failed, skip
          console.log(`⚠ ${perm.code} - Already exists, skipping`);
        } else {
          throw error;
        }
      }
    }

    // Find or create platform_admin role
    console.log('\n🔍 Finding platform_admin role...');
    let platformAdminRole = await prisma.role.findUnique({
      where: { code: 'platform_admin' },
    });

    if (!platformAdminRole) {
      console.log('📌 Creating platform_admin role...');
      platformAdminRole = await prisma.role.create({
        data: {
          code: 'platform_admin',
          name: 'Platform Administrator',
          description: 'Full system access',
          isSystem: true,
        },
      });
    }

    // Assign all permissions to platform_admin role
    console.log(
      `\n🔗 Assigning ${permissions.length} permissions to platform_admin role...\n`
    );

    const rolePermissionsData = [];
    for (const perm of permissions) {
      const permission = await prisma.permission.findUnique({
        where: { code: perm.code },
      });

      if (permission) {
        // Check if this role-permission relationship already exists
        const existing = await prisma.rolePermission.findFirst({
          where: {
            roleId: platformAdminRole.id,
            permissionId: permission.id,
          },
        });

        if (!existing) {
          rolePermissionsData.push({
            roleId: platformAdminRole.id,
            permissionId: permission.id,
          });
          console.log(`✓ Assigned ${perm.code}`);
        } else {
          console.log(`⚠ ${perm.code} - Already assigned, skipping`);
        }
      }
    }

    // Bulk create role permissions
    if (rolePermissionsData.length > 0) {
      await prisma.rolePermission.createMany({
        data: rolePermissionsData,
        skipDuplicates: true,
      });
    }

    console.log('\n✅ All permissions seeded and assigned successfully!\n');
    console.log('📊 Summary:');
    console.log(`   Total Permissions: ${permissions.length}`);
    console.log(`   Role: platform_admin`);
    console.log(
      `   All permissions are now accessible to platform_admin users\n`
    );
  } catch (error) {
    console.error('❌ Error seeding permissions:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedPermissionsForPlatformAdmin();
