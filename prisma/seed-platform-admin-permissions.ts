/**
 * Seed script to assign all permissions to platform_admin role
 * This grants platform_admin access to all endpoints in the system
 */
import { PrismaClient } from '../generated/prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Define all permission codes for various endpoints
const ALL_PERMISSIONS = [
  // Auth endpoints
  { code: 'auth.register', name: 'Register user' },
  { code: 'auth.login', name: 'Login user' },
  { code: 'auth.refresh', name: 'Refresh token' },
  { code: 'auth.logout', name: 'Logout user' },

  // Users endpoints
  { code: 'users.create', name: 'Create user' },
  { code: 'users.list', name: 'List users' },
  { code: 'users.bulk-upload', name: 'Bulk upload users' },
  { code: 'users.view', name: 'View user' },
  { code: 'users.update', name: 'Update user' },
  { code: 'users.delete', name: 'Delete user' },

  // Tenants endpoints
  { code: 'tenants.create', name: 'Create tenant' },
  { code: 'tenants.list', name: 'List tenants' },
  { code: 'tenants.view', name: 'View tenant' },
  { code: 'tenants.update', name: 'Update tenant' },
  { code: 'tenants.delete', name: 'Delete tenant' },

  // Roles endpoints
  { code: 'roles.create', name: 'Create role' },
  { code: 'roles.list', name: 'List roles' },
  { code: 'roles.view', name: 'View role' },
  { code: 'roles.update', name: 'Update role' },
  { code: 'roles.delete', name: 'Delete role' },
  { code: 'roles.assign', name: 'Assign role' },
  { code: 'roles.permission.create', name: 'Create permission' },
  { code: 'roles.permission.assign', name: 'Assign permission' },

  // Courses endpoints
  { code: 'courses.create', name: 'Create course' },
  { code: 'courses.list', name: 'List courses' },
  { code: 'courses.view', name: 'View course' },
  { code: 'courses.update', name: 'Update course' },
  { code: 'courses.delete', name: 'Delete course' },
  { code: 'courses.assign', name: 'Assign course' },
  { code: 'courses.progress', name: 'View course progress' },

  // Modules endpoints
  { code: 'modules.create', name: 'Create module' },
  { code: 'modules.update', name: 'Update module' },
  { code: 'modules.delete', name: 'Delete module' },

  // Lessons endpoints
  { code: 'lessons.create', name: 'Create lesson' },
  { code: 'lessons.update', name: 'Update lesson' },
  { code: 'lessons.delete', name: 'Delete lesson' },
  { code: 'lessons.upload-video', name: 'Upload lesson video' },
  { code: 'lessons.add-summary', name: 'Add lesson summary' },

  // Quizzes endpoints
  { code: 'quizzes.create', name: 'Create quiz' },
  { code: 'quizzes.update', name: 'Update quiz' },
  { code: 'quizzes.delete', name: 'Delete quiz' },
  { code: 'quizzes.publish', name: 'Publish quiz' },
  { code: 'quizzes.view', name: 'View quiz' },
  { code: 'quizzes.attempt', name: 'Attempt quiz' },
  { code: 'quizzes.results', name: 'View quiz results' },
  { code: 'quizzes.generate', name: 'Generate quiz from summary' },

  // Live classes endpoints
  { code: 'live-classes.create', name: 'Create live class' },
  { code: 'live-classes.start', name: 'Start live class' },
  { code: 'live-classes.end', name: 'End live class' },
  { code: 'live-classes.join', name: 'Join live class' },
  { code: 'live-classes.leave', name: 'Leave live class' },
  { code: 'live-classes.view', name: 'View live class' },
  { code: 'live-classes.attendance', name: 'View attendance' },
  { code: 'live-classes.recording', name: 'Record live class' },

  // Licenses endpoints
  { code: 'licenses.applications.create', name: 'Create application' },
  { code: 'licenses.applications.list', name: 'List applications' },
  { code: 'licenses.applications.view', name: 'View application' },
  { code: 'licenses.applications.update', name: 'Update application' },
  { code: 'licenses.tenants.create', name: 'Create tenant license' },
  { code: 'licenses.tenants.list', name: 'List tenant licenses' },
  { code: 'licenses.tenants.view', name: 'View tenant license' },
  { code: 'licenses.tenants.update', name: 'Update tenant license' },
  { code: 'licenses.tenants.renew', name: 'Renew tenant license' },
  { code: 'licenses.tenants.suspend', name: 'Suspend tenant license' },
  { code: 'licenses.users.assign', name: 'Assign license to user' },
  { code: 'licenses.users.revoke', name: 'Revoke license from user' },

  // Admin endpoints
  { code: 'admin.database.update', name: 'Update database config' },
  { code: 'admin.database.migrate', name: 'Run migrations' },
  { code: 'admin.users.view', name: 'View all users' },
  { code: 'admin.users.create', name: 'Create admin user' },
  { code: 'admin.tenants.manage', name: 'Manage tenants' }
];

async function main() {
  console.log('🌱 Starting seed: Assign all permissions to platform_admin...\n');

  // Find or create platform_admin role
  const platformAdminRole = await prisma.role.upsert({
    where: { code: 'platform_admin' },
    update: {},
    create: {
      code: 'platform_admin',
      name: 'Platform Admin'
    }
  });
  console.log(`✅ Platform Admin role: ${platformAdminRole.code}`);

  let createdCount = 0;
  let assignedCount = 0;

  // Create all permissions and assign to platform_admin
  for (const perm of ALL_PERMISSIONS) {
    // Upsert permission
    const permission = await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: {
        code: perm.code,
        name: perm.name
      }
    });

    // Check if already assigned
    const existing = await prisma.rolePermission.findFirst({
      where: {
        roleId: platformAdminRole.id,
        permissionId: permission.id
      }
    });

    if (!existing) {
      await prisma.rolePermission.create({
        data: {
          roleId: platformAdminRole.id,
          permissionId: permission.id
        }
      });
      assignedCount++;
      console.log(`  ✓ Assigned: ${perm.code}`);
    }
    createdCount++;
  }

  console.log(`\n📊 Summary:`);
  console.log(`  • Total permissions: ${ALL_PERMISSIONS.length}`);
  console.log(`  • Newly assigned: ${assignedCount}`);
  console.log(`  • Total assigned to platform_admin: ${createdCount}`);
  console.log(`\n✨ Seed completed successfully!\n`);
}

main()
  .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
