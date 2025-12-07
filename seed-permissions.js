const { PrismaClient } = require('@prisma/client');
const { PERMISSIONS, PREDEFINED_ROLE_PERMISSIONS } = require('./dist/src/common/constants/permissions.constant');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding world-class permission system...\n');

  try {
    // 1. Create all permissions
    console.log('📝 Creating permissions...');
    const createdPermissions = new Map();

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
    console.log('🎭 Creating predefined roles...');
    const createdRoles = new Map();

    for (const [roleName, permissions] of Object.entries(PREDEFINED_ROLE_PERMISSIONS)) {
      const created = await prisma.role.upsert({
        where: { code: roleName },
        update: { isSystem: true },
        create: {
          code: roleName,
          name: roleName.charAt(0).toUpperCase() + roleName.slice(1),
          description: `System-defined ${roleName} role`,
          category: 'system',
          isSystem: true,
        },
      });

      createdRoles.set(roleName, created.id);
    }

    console.log(`✅ Created/Updated ${createdRoles.size} roles\n`);

    // 3. Assign permissions to roles
    console.log('🔗 Assigning permissions to roles...');
    let assignmentCount = 0;

    for (const [roleName, permissionCodes] of Object.entries(PREDEFINED_ROLE_PERMISSIONS)) {
      const roleId = createdRoles.get(roleName);

      for (const permCode of permissionCodes) {
        const permId = createdPermissions.get(permCode);

        if (permId && roleId) {
          await prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId,
                permissionId: permId,
              },
            },
            update: {},
            create: {
              roleId,
              permissionId: permId,
            },
          });

          assignmentCount++;
        }
      }
    }

    console.log(`✅ Assigned ${assignmentCount} role-permission relationships\n`);

    // 4. Print summary
    console.log('📊 Permission System Summary:');
    console.log('════════════════════════════════════════');

    const permStats = await prisma.permission.groupBy({
      by: ['category'],
      _count: true,
    });

    console.log('\nPermissions by Category:');
    for (const stat of permStats) {
      console.log(`  • ${stat.category}: ${stat._count} permissions`);
    }

    const roleStats = await prisma.rolePermission.groupBy({
      by: ['roleId'],
      _count: true,
    });

    console.log('\nRole Permission Counts:');
    for (const stat of roleStats) {
      const role = await prisma.role.findUnique({ where: { id: stat.roleId } });
      console.log(`  • ${role.code}: ${stat._count} permissions`);
    }

    console.log('\n✨ Seeding completed successfully!\n');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
