import { PrismaClient } from './generated/prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, './.env') });

const prisma = new PrismaClient();

async function testPermissions() {
  try {
    console.log('🔐 Checking Permission Setup\n');

    // 1. Find roles.create permission
    const rolesCreatePerm = await prisma.permission.findUnique({
      where: { code: 'roles.create' },
      include: { rolePermissions: { include: { role: true } } }
    });

    if (!rolesCreatePerm) {
      console.log('❌ Permission "roles.create" not found!\n');
    } else {
      console.log('✓ Found permission: roles.create');
      console.log(`  ID: ${rolesCreatePerm.id}`);
      console.log(`  Assigned to ${rolesCreatePerm.rolePermissions.length} roles:\n`);

      rolesCreatePerm.rolePermissions.forEach(rp => {
        console.log(`    • ${rp.role.code} (${rp.role.name})`);
      });
      console.log('');
    }

    // 2. Check tenant_admin role specifically
    const tenantAdmin = await prisma.role.findUnique({
      where: { code: 'tenant_admin' },
      include: {
        permissions: {
          include: { permission: true },
          where: {
            permission: { code: 'roles.create' }
          }
        }
      }
    });

    if (!tenantAdmin) {
      console.log('❌ Role "tenant_admin" not found!\n');
    } else {
      console.log('✓ Found role: tenant_admin');
      console.log(`  Name: ${tenantAdmin.name}`);
      console.log(
        `  Has roles.create? ${tenantAdmin.permissions.length > 0 ? 'YES ✓' : 'NO ❌'}\n`
      );
    }

    // 3. Count permissions for each role
    console.log('📊 Permission Summary:');
    const roles = await prisma.role.findMany({
      include: {
        permissions: true
      }
    });

    for (const role of roles) {
      console.log(
        `  • ${role.code.padEnd(20)} - ${role.permissions.length} permissions`
      );
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPermissions();
