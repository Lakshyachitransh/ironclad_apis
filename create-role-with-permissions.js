#!/usr/bin/env node

/**
 * Script to create a role and assign permissions to it
 * Usage: node create-role-with-permissions.js
 */

const { PrismaClient } = require('./generated/prisma');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🚀 Starting role and permission assignment...\n');

    // Step 1: Create a new role
    console.log('📝 Creating new role...');
    const newRole = await prisma.role.create({
      data: {
        code: 'content_manager',
        name: 'Content Manager',
        description: 'Manages course content and materials',
        category: 'custom',
        isSystem: false,
      },
    });
    console.log(`✅ Role created successfully!`);
    console.log(`   Code: ${newRole.code}`);
    console.log(`   Name: ${newRole.name}`);
    console.log(`   ID: ${newRole.id}\n`);

    // Step 2: Get some permissions to assign to the role
    console.log('🔍 Fetching permissions to assign...');
    const permissionsToAssign = await prisma.permission.findMany({
      where: {
        OR: [
          { code: 'courses.create' },
          { code: 'courses.read' },
          { code: 'courses.update' },
          { code: 'courses.delete' },
          { code: 'content.upload' },
        ],
      },
    });

    if (permissionsToAssign.length === 0) {
      console.log('⚠️  No matching permissions found. Please ensure permissions are seeded first.');
      console.log('💡 Run: npx prisma db seed\n');
      return;
    }

    console.log(`✅ Found ${permissionsToAssign.length} permissions\n`);
    permissionsToAssign.forEach((perm) => {
      console.log(`   📌 ${perm.code} - ${perm.name}`);
    });
    console.log();

    // Step 3: Assign permissions to the role
    console.log('🔗 Assigning permissions to role...');
    const rolePermissions = [];

    for (const permission of permissionsToAssign) {
      // Check if permission is already assigned
      const existing = await prisma.rolePermission.findFirst({
        where: {
          roleId: newRole.id,
          permissionId: permission.id,
        },
      });

      if (existing) {
        console.log(`   ⏭️  ${permission.code} - Already assigned`);
        continue;
      }

      const rolePermission = await prisma.rolePermission.create({
        data: {
          roleId: newRole.id,
          permissionId: permission.id,
        },
      });
      rolePermissions.push(rolePermission);
      console.log(`   ✅ ${permission.code} - Assigned`);
    }

    console.log(`\n✨ Successfully assigned ${rolePermissions.length} permissions!\n`);

    // Step 4: Display role with its permissions
    console.log('📊 Role Summary:');
    const roleWithPermissions = await prisma.role.findUnique({
      where: { id: newRole.id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    console.log(`\n   Role: ${roleWithPermissions.name} (${roleWithPermissions.code})`);
    console.log(`   Description: ${roleWithPermissions.description}`);
    console.log(`   Total Permissions: ${roleWithPermissions.permissions.length}\n`);
    console.log('   📋 Assigned Permissions:');
    roleWithPermissions.permissions.forEach((rp, index) => {
      console.log(`      ${index + 1}. ${rp.permission.code} - ${rp.permission.name}`);
    });

    console.log('\n✅ Role creation and permission assignment completed successfully!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'P2002') {
      console.error('\n💡 Unique constraint error: Role code already exists!');
      console.error('   Please use a different role code.\n');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
