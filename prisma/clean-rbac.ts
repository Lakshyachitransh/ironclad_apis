/**
 * Clean RBAC Tables Script
 * This script clears all RBAC-related tables (Role, Permission, RolePermission)
 * Run: npx ts-node prisma/clean-rbac.ts
 */

import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();

  console.log('🧹 Starting RBAC cleanup...');

  try {
    // Delete in order of foreign key dependencies
    console.log('Deleting RolePermission records...');
    const rpDeleted = await prisma.rolePermission.deleteMany({});
    console.log(`✅ Deleted ${rpDeleted.count} role-permission records`);

    console.log('Deleting Permission records...');
    const pDeleted = await prisma.permission.deleteMany({});
    console.log(`✅ Deleted ${pDeleted.count} permission records`);

    console.log('Deleting Role records...');
    const rDeleted = await prisma.role.deleteMany({});
    console.log(`✅ Deleted ${rDeleted.count} role records`);

    console.log('\n✨ RBAC tables cleaned successfully!');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
