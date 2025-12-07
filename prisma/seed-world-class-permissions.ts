import { PrismaClient } from '@prisma/client';
import { PERMISSIONS, PREDEFINED_ROLE_PERMISSIONS } from '../src/common/constants/permissions.constant';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding world-class permission system...\n');

  try {
    // 1. Create all permissions
    console.log('📝 Creating permissions...');
    const createdPermissions = new Map<string, string>();

    for (const perm of PERMISSIONS) {
      const created = await prisma.permission.upsert({
        where: { code: perm.code },
        update: {
          name: perm.name,
          description: perm.description,
          resource: perm.resource,
          action: perm.action,
          category: perm.category,
          isSystemDefined: true,
        },
        create: {
          code: perm.code,
          name: perm.name,
          description: perm.description,
          resource: perm.resource,
          action: perm.action,
          category: perm.category,
          isSystemDefined: true,
        },
      });

      createdPermissions.set(perm.code, created.id);
    }

    console.log(`✅ Created/Updated ${createdPermissions.size} permissions\n`);

    // 2. Create predefined roles
    console.log('👥 Creating predefined roles...');
    const roles = new Map<string, string>();

    const roleConfigs = [
      { code: 'platform_admin', name: 'Platform Administrator', description: 'Full system access', category: 'system', isSystem: true },
      { code: 'tenant_admin', name: 'Tenant Administrator', description: 'Manage tenant and users', category: 'system', isSystem: true },
      { code: 'trainer', name: 'Trainer', description: 'Create and manage courses', category: 'system', isSystem: true },
      { code: 'instructor', name: 'Instructor', description: 'Teach courses and manage learners', category: 'system', isSystem: true },
      { code: 'learner', name: 'Learner', description: 'Take courses and complete assignments', category: 'system', isSystem: true },
    ];

    for (const roleConfig of roleConfigs) {
      const role = await prisma.role.upsert({
        where: { code: roleConfig.code },
        update: {
          name: roleConfig.name,
          description: roleConfig.description,
          category: roleConfig.category,
          isSystem: roleConfig.isSystem,
        },
        create: {
          code: roleConfig.code,
          name: roleConfig.name,
          description: roleConfig.description,
          category: roleConfig.category,
          isSystem: roleConfig.isSystem,
        },
      });

      roles.set(roleConfig.code, role.id);
      console.log(`  ✓ ${roleConfig.name} (${roleConfig.code})`);
    }

    console.log(`✅ Created ${roles.size} predefined roles\n`);

    // 3. Assign permissions to roles
    console.log('🔗 Assigning permissions to roles...');

    for (const [roleCode, permissionCodes] of Object.entries(PREDEFINED_ROLE_PERMISSIONS)) {
      const roleId = roles.get(roleCode);
      if (!roleId) {
        console.warn(`⚠️  Role ${roleCode} not found`);
        continue;
      }

      // Delete existing permissions for this role
      await prisma.rolePermission.deleteMany({
        where: { roleId },
      });

      // Add new permissions
      const assignments = permissionCodes.map(permCode => ({
        roleId,
        permissionId: createdPermissions.get(permCode) || '',
      })).filter(a => a.permissionId);

      if (assignments.length > 0) {
        await prisma.rolePermission.createMany({
          data: assignments,
          skipDuplicates: true,
        });
      }

      console.log(`  ✓ ${roleCode}: ${permissionCodes.length} permissions`);
    }

    console.log('\n✅ Permission system seeded successfully!\n');

    // 4. Print summary
    console.log('📊 Summary:');
    console.log(`  • Total Permissions: ${PERMISSIONS.length}`);
    console.log(`  • Predefined Roles: ${roleConfigs.length}`);
    console.log(`  • Categories: ${new Set(PERMISSIONS.map(p => p.category)).size}`);
    console.log('\n📋 Permission Categories:');

    const categories = new Set(PERMISSIONS.map(p => p.category));
    for (const category of Array.from(categories).sort()) {
      const count = PERMISSIONS.filter(p => p.category === category).length;
      console.log(`  • ${category}: ${count} permissions`);
    }

    console.log('\n✨ World-class permission system is ready!');
  } catch (error) {
    console.error('❌ Error seeding permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
