import { PrismaClient } from '../generated/prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function seedRolesAndPermissions() {
  console.log('🔐 Seeding Roles and Permissions...\n');

  try {
    // Step 1: Define all permissions
    const permissions = [
      // Auth
      { code: 'auth.register', name: 'Register user', resource: 'auth', action: 'register', category: 'Authentication' },
      { code: 'auth.login', name: 'Login user', resource: 'auth', action: 'login', category: 'Authentication' },
      { code: 'auth.refresh', name: 'Refresh token', resource: 'auth', action: 'refresh', category: 'Authentication' },
      { code: 'auth.logout', name: 'Logout user', resource: 'auth', action: 'logout', category: 'Authentication' },

      // Users
      { code: 'users.create', name: 'Create user', resource: 'users', action: 'create', category: 'User Management' },
      { code: 'users.read', name: 'View users', resource: 'users', action: 'read', category: 'User Management' },
      { code: 'users.update', name: 'Update user', resource: 'users', action: 'update', category: 'User Management' },
      { code: 'users.delete', name: 'Delete user', resource: 'users', action: 'delete', category: 'User Management' },

      // Tenants
      { code: 'tenants.create', name: 'Create tenant', resource: 'tenants', action: 'create', category: 'Tenant Management' },
      { code: 'tenants.read', name: 'View tenants', resource: 'tenants', action: 'read', category: 'Tenant Management' },
      { code: 'tenants.update', name: 'Update tenant', resource: 'tenants', action: 'update', category: 'Tenant Management' },
      { code: 'tenants.delete', name: 'Delete tenant', resource: 'tenants', action: 'delete', category: 'Tenant Management' },

      // Roles
      { code: 'roles.create', name: 'Create role', resource: 'roles', action: 'create', category: 'Access Control' },
      { code: 'roles.read', name: 'View roles', resource: 'roles', action: 'read', category: 'Access Control' },
      { code: 'roles.update', name: 'Update role', resource: 'roles', action: 'update', category: 'Access Control' },
      { code: 'roles.delete', name: 'Delete role', resource: 'roles', action: 'delete', category: 'Access Control' },
      { code: 'roles.assign-permission', name: 'Assign permissions to role', resource: 'roles', action: 'manage', category: 'Access Control' },

      // Permissions
      { code: 'permissions.create', name: 'Create permission', resource: 'permissions', action: 'create', category: 'Access Control' },
      { code: 'permissions.read', name: 'View permissions', resource: 'permissions', action: 'read', category: 'Access Control' },

      // Courses
      { code: 'courses.create', name: 'Create course', resource: 'courses', action: 'create', category: 'Content Management' },
      { code: 'courses.read', name: 'View courses', resource: 'courses', action: 'read', category: 'Content Management' },
      { code: 'courses.update', name: 'Update course', resource: 'courses', action: 'update', category: 'Content Management' },
      { code: 'courses.delete', name: 'Delete course', resource: 'courses', action: 'delete', category: 'Content Management' },
      { code: 'courses.publish', name: 'Publish course', resource: 'courses', action: 'manage', category: 'Content Management' },
      { code: 'courses.assign', name: 'Assign course', resource: 'courses', action: 'manage', category: 'Content Management' },
      { code: 'courses.export', name: 'Export course', resource: 'courses', action: 'manage', category: 'Content Management' },

      // Modules
      { code: 'modules.create', name: 'Create module', resource: 'modules', action: 'create', category: 'Content Management' },
      { code: 'modules.read', name: 'View modules', resource: 'modules', action: 'read', category: 'Content Management' },
      { code: 'modules.update', name: 'Update module', resource: 'modules', action: 'update', category: 'Content Management' },
      { code: 'modules.delete', name: 'Delete module', resource: 'modules', action: 'delete', category: 'Content Management' },

      // Lessons
      { code: 'lessons.create', name: 'Create lesson', resource: 'lessons', action: 'create', category: 'Content Management' },
      { code: 'lessons.read', name: 'View lessons', resource: 'lessons', action: 'read', category: 'Content Management' },
      { code: 'lessons.update', name: 'Update lesson', resource: 'lessons', action: 'update', category: 'Content Management' },
      { code: 'lessons.delete', name: 'Delete lesson', resource: 'lessons', action: 'delete', category: 'Content Management' },

      // Quizzes
      { code: 'quizzes.create', name: 'Create quiz', resource: 'quizzes', action: 'create', category: 'Content Management' },
      { code: 'quizzes.read', name: 'View quiz', resource: 'quizzes', action: 'read', category: 'Content Management' },
      { code: 'quizzes.update', name: 'Update quiz', resource: 'quizzes', action: 'update', category: 'Content Management' },
      { code: 'quizzes.delete', name: 'Delete quiz', resource: 'quizzes', action: 'delete', category: 'Content Management' },
      { code: 'quizzes.publish', name: 'Publish quiz', resource: 'quizzes', action: 'manage', category: 'Content Management' },
      { code: 'quizzes.grade', name: 'Grade quiz', resource: 'quizzes', action: 'manage', category: 'Content Management' },

      // Live Classes
      { code: 'live-classes.create', name: 'Create live class', resource: 'live-class', action: 'create', category: 'Learning Events' },
      { code: 'live-classes.read', name: 'View live class', resource: 'live-class', action: 'read', category: 'Learning Events' },
      { code: 'live-classes.update', name: 'Update live class', resource: 'live-class', action: 'update', category: 'Learning Events' },
      { code: 'live-classes.delete', name: 'Delete live class', resource: 'live-class', action: 'delete', category: 'Learning Events' },
      { code: 'live-classes.start', name: 'Start live class', resource: 'live-class', action: 'manage', category: 'Learning Events' },
      { code: 'live-classes.end', name: 'End live class', resource: 'live-class', action: 'manage', category: 'Learning Events' },
      { code: 'live-classes.join', name: 'Join live class', resource: 'live-class', action: 'read', category: 'Learning Events' },

      // Licenses
      { code: 'licenses.create', name: 'Create license', resource: 'licenses', action: 'create', category: 'License Management' },
      { code: 'licenses.read', name: 'View licenses', resource: 'licenses', action: 'read', category: 'License Management' },
      { code: 'licenses.update', name: 'Update license', resource: 'licenses', action: 'update', category: 'License Management' },
      { code: 'licenses.assign', name: 'Assign license', resource: 'licenses', action: 'manage', category: 'License Management' },
      { code: 'licenses.revoke', name: 'Revoke license', resource: 'licenses', action: 'delete', category: 'License Management' },

      // Admin
      { code: 'admin.manage', name: 'Manage admin', resource: 'admin', action: 'manage', category: 'Administration' },
    ];

    // Step 2: Create/update all permissions
    console.log(`📝 Creating ${permissions.length} permissions...\n`);
    const createdPermissions = [];
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
            isSystemDefined: true,
          },
        });
        createdPermissions.push(permission);
        console.log(`✓ ${permission.code}`);
      } catch (error: any) {
        console.error(`✗ Failed to create ${perm.code}:`, error.message);
      }
    }

    console.log(`\n✅ Created/Updated ${createdPermissions.length} permissions\n`);

    // Step 3: Define roles with their permission codes
    const rolesConfig = [
      {
        code: 'platform_admin',
        name: 'Platform Administrator',
        description: 'Full system access - manages all tenants and users',
        category: 'system',
        permissionCodes: permissions.map(p => p.code), // All permissions
      },
      {
        code: 'tenant_admin',
        name: 'Tenant Administrator',
        description: 'Administrator for their tenant - manages users and roles',
        category: 'system',
        permissionCodes: [
          'users.create', 'users.read', 'users.update', 'users.delete',
          'roles.create', 'roles.read', 'roles.update', 'roles.delete', 'roles.assign-permission',
          'courses.create', 'courses.read', 'courses.update', 'courses.delete', 'courses.publish', 'courses.assign',
          'modules.create', 'modules.read', 'modules.update', 'modules.delete',
          'lessons.create', 'lessons.read', 'lessons.update', 'lessons.delete',
          'quizzes.create', 'quizzes.read', 'quizzes.update', 'quizzes.delete', 'quizzes.publish',
          'live-classes.create', 'live-classes.read', 'live-classes.update', 'live-classes.delete', 'live-classes.start', 'live-classes.end',
          'licenses.read', 'licenses.assign',
        ],
      },
      {
        code: 'org_admin',
        name: 'Organization Administrator',
        description: 'Administrator for their organization - similar to tenant admin',
        category: 'system',
        permissionCodes: [
          'users.create', 'users.read', 'users.update', 'users.delete',
          'roles.create', 'roles.read', 'roles.update', 'roles.delete', 'roles.assign-permission',
          'courses.create', 'courses.read', 'courses.update', 'courses.delete', 'courses.publish', 'courses.assign',
          'modules.create', 'modules.read', 'modules.update', 'modules.delete',
          'lessons.create', 'lessons.read', 'lessons.update', 'lessons.delete',
          'quizzes.create', 'quizzes.read', 'quizzes.update', 'quizzes.delete', 'quizzes.publish',
          'live-classes.create', 'live-classes.read', 'live-classes.update', 'live-classes.delete', 'live-classes.start', 'live-classes.end',
          'licenses.read',
        ],
      },
      {
        code: 'trainer',
        name: 'Trainer / Instructor',
        description: 'Can create and manage courses and live classes',
        category: 'system',
        permissionCodes: [
          'courses.create', 'courses.read', 'courses.update', 'courses.delete', 'courses.publish',
          'modules.create', 'modules.read', 'modules.update', 'modules.delete',
          'lessons.create', 'lessons.read', 'lessons.update', 'lessons.delete',
          'quizzes.create', 'quizzes.read', 'quizzes.update', 'quizzes.delete', 'quizzes.publish', 'quizzes.grade',
          'live-classes.create', 'live-classes.read', 'live-classes.update', 'live-classes.delete', 'live-classes.start', 'live-classes.end',
        ],
      },
      {
        code: 'learner',
        name: 'Learner / Student',
        description: 'Can access and complete courses',
        category: 'system',
        permissionCodes: [
          'courses.read',
          'modules.read',
          'lessons.read',
          'quizzes.read',
          'live-classes.join',
        ],
      },
      {
        code: 'viewer',
        name: 'Viewer',
        description: 'Read-only access to content',
        category: 'system',
        permissionCodes: [
          'courses.read',
          'modules.read',
          'lessons.read',
          'quizzes.read',
        ],
      },
    ];

    // Step 4: Create/update roles
    console.log('📌 Creating roles...\n');
    const createdRoles = [];
    for (const roleConfig of rolesConfig) {
      try {
        const role = await prisma.role.upsert({
          where: { code: roleConfig.code },
          update: { name: roleConfig.name, description: roleConfig.description },
          create: {
            code: roleConfig.code,
            name: roleConfig.name,
            description: roleConfig.description,
            category: roleConfig.category,
            isSystem: true,
          },
        });
        createdRoles.push(role);
        console.log(`✓ ${role.code} - ${role.name}`);
      } catch (error: any) {
        console.error(`✗ Failed to create ${roleConfig.code}:`, error.message);
      }
    }

    console.log(`\n✅ Created/Updated ${createdRoles.length} roles\n`);

    // Step 5: Assign permissions to roles
    console.log('🔗 Assigning permissions to roles...\n');
    for (const roleConfig of rolesConfig) {
      try {
        const role = await prisma.role.findUnique({
          where: { code: roleConfig.code },
        });

        if (!role) continue;

        console.log(`\n📋 ${roleConfig.code}:`);

        // Get all permission IDs for this role
        const rolePermissions = await prisma.permission.findMany({
          where: { code: { in: roleConfig.permissionCodes } },
          select: { id: true, code: true },
        });

        // Check which permissions are not yet assigned
        const assignedPermissions = await prisma.rolePermission.findMany({
          where: { roleId: role.id },
          select: { permissionId: true },
        });

        const assignedPermissionIds = new Set(assignedPermissions.map(rp => rp.permissionId));

        // Assign missing permissions
        const permissionsToAssign = rolePermissions.filter(
          p => !assignedPermissionIds.has(p.id)
        );

        if (permissionsToAssign.length > 0) {
          await prisma.rolePermission.createMany({
            data: permissionsToAssign.map(p => ({
              roleId: role.id,
              permissionId: p.id,
            })),
          });

          console.log(`   ✓ Assigned ${permissionsToAssign.length} new permissions`);
        }

        const totalAssigned = rolePermissions.length;
        console.log(`   📊 Total permissions: ${totalAssigned}`);

      } catch (error: any) {
        console.error(`✗ Error assigning permissions to ${roleConfig.code}:`, error.message);
      }
    }

    console.log('\n✅ All roles and permissions seeded successfully!\n');
    console.log('📊 Summary:');
    console.log(`   Total Permissions: ${createdPermissions.length}`);
    console.log(`   Total Roles: ${createdRoles.length}`);
    console.log('\n Available Roles:');
    rolesConfig.forEach(rc => {
      console.log(`   • ${rc.code} - ${rc.name}`);
    });

  } catch (error) {
    console.error('❌ Error seeding roles and permissions:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedRolesAndPermissions();
