/**
 * Seed RBAC Data Script
 * Creates roles, permissions, and associations
 * Run: npx ts-node prisma/seed-rbac.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RoleWithPermissions {
  code: string;
  name: string;
  permissions: string[];
}

async function main() {
  console.log('🌱 Starting RBAC seeding...\n');

  try {
    // Define all permissions
    const permissionsToCreate = [
      // Admin permissions
      { code: 'manage_database', name: 'Manage Database Configuration' },
      { code: 'manage_tenants', name: 'Manage Tenants' },
      { code: 'view_all_users', name: 'View All Users Across Tenants' },
      { code: 'create_tenant_admin', name: 'Create Tenant Admin Users' },
      { code: 'manage_roles', name: 'Manage Roles and Permissions' },

      // Course management permissions
      { code: 'create_course', name: 'Create Courses' },
      { code: 'edit_course', name: 'Edit Courses' },
      { code: 'delete_course', name: 'Delete Courses' },
      { code: 'manage_course_assignments', name: 'Manage Course Assignments' },

      // User management permissions
      { code: 'manage_users', name: 'Manage Users' },
      { code: 'view_users', name: 'View Users' },
      { code: 'create_user', name: 'Create Users' },

      // Live class permissions
      { code: 'create_live_class', name: 'Create Live Classes' },
      { code: 'manage_live_classes', name: 'Manage Live Classes' },
      { code: 'view_live_classes', name: 'View Live Classes' },
      { code: 'participate_live_class', name: 'Participate in Live Classes' },

      // View permissions
      { code: 'view_courses', name: 'View Courses' },
      { code: 'view_lessons', name: 'View Lessons' },
      { code: 'view_my_progress', name: 'View My Progress' },
    ];

    console.log('📝 Creating permissions...');
    const permissions = await Promise.all(
      permissionsToCreate.map((perm) =>
        prisma.permission.create({
          data: {
            code: perm.code,
            name: perm.name,
          },
        })
      )
    );
    console.log(`✅ Created ${permissions.length} permissions\n`);

    // Define roles with their permissions
    const rolesToCreate: RoleWithPermissions[] = [
      {
        code: 'org_admin',
        name: 'Organization Admin',
        permissions: [
          'manage_database',
          'manage_tenants',
          'view_all_users',
          'create_tenant_admin',
          'manage_roles',
        ],
      },
      {
        code: 'tenant_admin',
        name: 'Tenant Admin',
        permissions: [
          'manage_users',
          'view_users',
          'create_user',
          'manage_course_assignments',
          'view_courses',
          'manage_live_classes',
          'view_live_classes',
        ],
      },
      {
        code: 'training_manager',
        name: 'Training Manager',
        permissions: [
          'create_course',
          'edit_course',
          'delete_course',
          'manage_course_assignments',
          'create_live_class',
          'manage_live_classes',
          'view_live_classes',
          'view_courses',
        ],
      },
      {
        code: 'instructor',
        name: 'Instructor',
        permissions: [
          'view_courses',
          'view_lessons',
          'create_live_class',
          'manage_live_classes',
          'view_live_classes',
          'view_my_progress',
        ],
      },
      {
        code: 'learner',
        name: 'Learner',
        permissions: [
          'view_courses',
          'view_lessons',
          'view_my_progress',
          'participate_live_class',
        ],
      },
      {
        code: 'viewer',
        name: 'Viewer',
        permissions: ['view_courses', 'view_lessons'],
      },
    ];

    console.log('🔐 Creating roles with permissions...\n');

    for (const roleData of rolesToCreate) {
      // Create role
      const role = await prisma.role.create({
        data: {
          code: roleData.code,
          name: roleData.name,
        },
      });
      console.log(`  ✅ Created role: ${role.name} (${role.code})`);

      // Assign permissions to role
      const rolePermissions = roleData.permissions
        .map((permCode) => {
          const perm = permissions.find((p) => p.code === permCode);
          return perm
            ? {
                roleId: role.id,
                permissionId: perm.id,
              }
            : null;
        })
        .filter((x) => x !== null);

      if (rolePermissions.length > 0) {
        await Promise.all(
          rolePermissions.map((rp) =>
            prisma.rolePermission.create({
              data: rp as any,
            })
          )
        );
        console.log(`     → Assigned ${rolePermissions.length} permissions`);
      }
    }

    console.log('\n✨ RBAC seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   • ${permissions.length} permissions created`);
    console.log(`   • ${rolesToCreate.length} roles created`);
    console.log(
      `   • Total role-permission associations: ${rolesToCreate.reduce((sum, r) => sum + r.permissions.length, 0)}`
    );
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
