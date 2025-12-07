/**
 * RBAC Seed Script: Initialize Predefined Permissions and System Roles
 * 
 * Architecture:
 * - PERMISSIONS: Predefined, immutable system-wide permissions
 * - ROLES: Can be created by platform_admin or tenant_admin
 * - SYSTEM ROLES: Platform-wide predefined roles (superadmin, platform_admin, tenant_admin, etc.)
 * 
 * Two-tier system:
 * 1. Platform Tier (@ironclad, @secnuo teams) - manage licenses, tenants, system
 * 2. Tenant Tier (other organizations) - manage their own courses, users, content
 */

import { PrismaClient } from '../generated/prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

// ============================================================================
// PREDEFINED PERMISSIONS (IMMUTABLE)
// ============================================================================
const PREDEFINED_PERMISSIONS = [
  // Auth Permissions
  { code: 'auth.register', name: 'Register new user', category: 'auth' },
  { code: 'auth.login', name: 'Login to system', category: 'auth' },
  { code: 'auth.refresh', name: 'Refresh authentication token', category: 'auth' },
  { code: 'auth.logout', name: 'Logout from system', category: 'auth' },

  // Users Management Permissions
  { code: 'users.create', name: 'Create new user', category: 'users' },
  { code: 'users.list', name: 'List all users', category: 'users' },
  { code: 'users.view', name: 'View user details', category: 'users' },
  { code: 'users.update', name: 'Update user information', category: 'users' },
  { code: 'users.delete', name: 'Delete user', category: 'users' },
  { code: 'users.bulk-upload', name: 'Bulk upload users', category: 'users' },

  // Tenants Management Permissions (Platform Only)
  { code: 'tenants.create', name: 'Create new tenant', category: 'tenants' },
  { code: 'tenants.list', name: 'List all tenants', category: 'tenants' },
  { code: 'tenants.view', name: 'View tenant details', category: 'tenants' },
  { code: 'tenants.update', name: 'Update tenant information', category: 'tenants' },
  { code: 'tenants.delete', name: 'Delete tenant', category: 'tenants' },

  // Roles & Permissions Management
  { code: 'roles.create', name: 'Create new role', category: 'roles' },
  { code: 'roles.list', name: 'List all roles', category: 'roles' },
  { code: 'roles.view', name: 'View role details', category: 'roles' },
  { code: 'roles.update', name: 'Update role', category: 'roles' },
  { code: 'roles.delete', name: 'Delete role', category: 'roles' },
  { code: 'roles.assign', name: 'Assign role to user', category: 'roles' },
  { code: 'roles.permission-list', name: 'View permissions for role', category: 'roles' },

  // Courses Management Permissions
  { code: 'courses.create', name: 'Create new course', category: 'courses' },
  { code: 'courses.list', name: 'List all courses', category: 'courses' },
  { code: 'courses.view', name: 'View course details', category: 'courses' },
  { code: 'courses.update', name: 'Update course', category: 'courses' },
  { code: 'courses.delete', name: 'Delete course', category: 'courses' },
  { code: 'courses.publish', name: 'Publish course', category: 'courses' },
  { code: 'courses.assign', name: 'Assign course to users', category: 'courses' },
  { code: 'courses.progress', name: 'View course progress', category: 'courses' },

  // Modules Management Permissions
  { code: 'modules.create', name: 'Create course module', category: 'modules' },
  { code: 'modules.update', name: 'Update module', category: 'modules' },
  { code: 'modules.delete', name: 'Delete module', category: 'modules' },
  { code: 'modules.list', name: 'List modules', category: 'modules' },

  // Lessons Management Permissions
  { code: 'lessons.create', name: 'Create lesson', category: 'lessons' },
  { code: 'lessons.update', name: 'Update lesson', category: 'lessons' },
  { code: 'lessons.delete', name: 'Delete lesson', category: 'lessons' },
  { code: 'lessons.upload-video', name: 'Upload lesson video', category: 'lessons' },
  { code: 'lessons.add-summary', name: 'Add lesson summary', category: 'lessons' },
  { code: 'lessons.view', name: 'View lesson', category: 'lessons' },

  // Quizzes Management Permissions
  { code: 'quizzes.create', name: 'Create quiz', category: 'quizzes' },
  { code: 'quizzes.update', name: 'Update quiz', category: 'quizzes' },
  { code: 'quizzes.delete', name: 'Delete quiz', category: 'quizzes' },
  { code: 'quizzes.publish', name: 'Publish quiz', category: 'quizzes' },
  { code: 'quizzes.view', name: 'View quiz', category: 'quizzes' },
  { code: 'quizzes.attempt', name: 'Attempt quiz', category: 'quizzes' },
  { code: 'quizzes.results', name: 'View quiz results', category: 'quizzes' },
  { code: 'quizzes.generate', name: 'Generate quiz from summary', category: 'quizzes' },

  // Live Classes Management Permissions
  { code: 'live-classes.create', name: 'Create live class', category: 'live-classes' },
  { code: 'live-classes.start', name: 'Start live class', category: 'live-classes' },
  { code: 'live-classes.end', name: 'End live class', category: 'live-classes' },
  { code: 'live-classes.join', name: 'Join live class', category: 'live-classes' },
  { code: 'live-classes.leave', name: 'Leave live class', category: 'live-classes' },
  { code: 'live-classes.view', name: 'View live class', category: 'live-classes' },
  { code: 'live-classes.attendance', name: 'View/manage attendance', category: 'live-classes' },
  { code: 'live-classes.recording', name: 'Record live class', category: 'live-classes' },

  // Licenses Management Permissions (Platform Only)
  { code: 'licenses.applications.create', name: 'Create application', category: 'licenses' },
  { code: 'licenses.applications.list', name: 'List applications', category: 'licenses' },
  { code: 'licenses.applications.view', name: 'View application', category: 'licenses' },
  { code: 'licenses.tenants.create', name: 'Create tenant license', category: 'licenses' },
  { code: 'licenses.tenants.list', name: 'List tenant licenses', category: 'licenses' },
  { code: 'licenses.tenants.view', name: 'View tenant license', category: 'licenses' },
  { code: 'licenses.tenants.renew', name: 'Renew tenant license', category: 'licenses' },
  { code: 'licenses.users.assign', name: 'Assign license to user', category: 'licenses' },
  { code: 'licenses.users.revoke', name: 'Revoke license from user', category: 'licenses' },

  // Admin Permissions (Platform Only)
  { code: 'admin.database.update', name: 'Update database config', category: 'admin' },
  { code: 'admin.database.migrate', name: 'Run database migrations', category: 'admin' },
  { code: 'admin.users.view', name: 'View all system users', category: 'admin' },
  { code: 'admin.tenants.manage', name: 'Manage all tenants', category: 'admin' },
];

// ============================================================================
// SYSTEM ROLES (Predefined with specific permissions)
// ============================================================================
interface RolePermissionSet {
  code: string;
  name: string;
  description: string;
  type: 'platform' | 'tenant'; // platform-wide or tenant-scoped
  permissions: string[]; // permission codes
}

const SYSTEM_ROLES: RolePermissionSet[] = [
  {
    code: 'superadmin',
    name: 'Super Admin',
    description: 'Full system access - only for @ironclad & @secnuo teams',
    type: 'platform',
    permissions: PREDEFINED_PERMISSIONS.map(p => p.code) // All permissions
  },
  {
    code: 'platform_admin',
    name: 'Platform Admin',
    description: 'Manage tenants, licenses, and platform operations',
    type: 'platform',
    permissions: [
      // Tenants
      'tenants.create', 'tenants.list', 'tenants.view', 'tenants.update', 'tenants.delete',
      // Licenses
      'licenses.applications.list', 'licenses.applications.view',
      'licenses.tenants.create', 'licenses.tenants.list', 'licenses.tenants.view', 'licenses.tenants.renew',
      'licenses.users.assign', 'licenses.users.revoke',
      // Users
      'users.list', 'users.view', 'users.delete',
      // Roles
      'roles.list', 'roles.view',
      // Admin
      'admin.users.view', 'admin.tenants.manage'
    ]
  },
  {
    code: 'tenant_admin',
    name: 'Tenant Admin',
    description: 'Full control over tenant resources - courses, users, roles',
    type: 'tenant',
    permissions: [
      // Users
      'users.create', 'users.list', 'users.view', 'users.update', 'users.delete', 'users.bulk-upload',
      // Roles
      'roles.create', 'roles.list', 'roles.view', 'roles.update', 'roles.delete', 'roles.assign',
      // Courses
      'courses.create', 'courses.list', 'courses.view', 'courses.update', 'courses.delete', 'courses.publish', 'courses.assign', 'courses.progress',
      // Modules
      'modules.create', 'modules.update', 'modules.delete', 'modules.list',
      // Lessons
      'lessons.create', 'lessons.update', 'lessons.delete', 'lessons.upload-video', 'lessons.add-summary', 'lessons.view',
      // Quizzes
      'quizzes.create', 'quizzes.update', 'quizzes.delete', 'quizzes.publish', 'quizzes.view', 'quizzes.results', 'quizzes.generate',
      // Live Classes
      'live-classes.create', 'live-classes.start', 'live-classes.end', 'live-classes.attendance', 'live-classes.recording'
    ]
  },
  {
    code: 'training_manager',
    name: 'Training Manager',
    description: 'Create and manage courses, modules, lessons, and quizzes',
    type: 'tenant',
    permissions: [
      // Courses
      'courses.create', 'courses.list', 'courses.view', 'courses.update', 'courses.delete', 'courses.publish', 'courses.assign', 'courses.progress',
      // Modules
      'modules.create', 'modules.update', 'modules.delete', 'modules.list',
      // Lessons
      'lessons.create', 'lessons.update', 'lessons.delete', 'lessons.upload-video', 'lessons.add-summary', 'lessons.view',
      // Quizzes
      'quizzes.create', 'quizzes.update', 'quizzes.delete', 'quizzes.publish', 'quizzes.view', 'quizzes.results', 'quizzes.generate',
      // Users (view only)
      'users.list', 'users.view',
      // Roles (view only)
      'roles.list', 'roles.view'
    ]
  },
  {
    code: 'instructor',
    name: 'Instructor',
    description: 'Can conduct live classes and view student progress',
    type: 'tenant',
    permissions: [
      // Courses
      'courses.list', 'courses.view', 'courses.progress',
      // Lessons
      'lessons.view',
      // Live Classes
      'live-classes.create', 'live-classes.start', 'live-classes.end', 'live-classes.attendance', 'live-classes.recording',
      // Users (view only)
      'users.list', 'users.view'
    ]
  },
  {
    code: 'learner',
    name: 'Learner',
    description: 'Can view courses, lessons, and attempt quizzes',
    type: 'tenant',
    permissions: [
      // Courses
      'courses.list', 'courses.view', 'courses.progress',
      // Lessons
      'lessons.view',
      // Quizzes
      'quizzes.view', 'quizzes.attempt',
      // Live Classes
      'live-classes.join', 'live-classes.leave', 'live-classes.view'
    ]
  }
];

// ============================================================================
// SEED FUNCTION
// ============================================================================
async function main() {
  console.log('🌱 Starting RBAC Seed...\n');

  // Step 1: Create all predefined permissions
  console.log('📋 Creating predefined permissions...');
  const createdPermissions: Record<string, string> = {}; // code -> id mapping

  for (const perm of PREDEFINED_PERMISSIONS) {
    const permission = await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: {
        code: perm.code,
        name: perm.name
      }
    });
    createdPermissions[perm.code] = permission.id;
  }
  console.log(`✅ ${PREDEFINED_PERMISSIONS.length} permissions created/verified\n`);

  // Step 2: Create system roles with their permissions
  console.log('🎭 Creating system roles with permissions...');
  for (const roleSpec of SYSTEM_ROLES) {
    // Create or update role
    const role = await prisma.role.upsert({
      where: { code: roleSpec.code },
      update: { name: roleSpec.name },
      create: {
        code: roleSpec.code,
        name: roleSpec.name
      }
    });

    // Clear existing permissions for this role
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id }
    });

    // Assign permissions
    for (const permCode of roleSpec.permissions) {
      const permId = createdPermissions[permCode];
      if (permId) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permId
          }
        });
      }
    }

    console.log(`✅ ${role.name} (${roleSpec.permissions.length} permissions)`);
  }

  console.log('\n📊 Summary:');
  console.log(`  • Total predefined permissions: ${PREDEFINED_PERMISSIONS.length}`);
  console.log(`  • Total system roles created: ${SYSTEM_ROLES.length}`);
  console.log(`\n  System Roles:`);
  SYSTEM_ROLES.forEach(r => {
    console.log(`    - ${r.code}: ${r.permissions.length} permissions (${r.type} role)`);
  });

  console.log(`\n✨ RBAC Seed completed successfully!\n`);
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
