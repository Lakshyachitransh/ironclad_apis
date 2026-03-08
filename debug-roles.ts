import { PrismaClient } from './generated/prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, './.env') });

const prisma = new PrismaClient();

async function debugRoles() {
  try {
    console.log('🔍 Debugging Roles for Lakme Tenant\n');

    // Find Lakme tenant
    const lakme = await prisma.tenant.findUnique({
      where: { name: 'Lakme' },
    });

    if (!lakme) {
      console.log('❌ Lakme tenant not found');
      return;
    }

    console.log(`✓ Found Lakme tenant: ${lakme.id}\n`);

    // Check all TenantRole records for Lakme
    console.log('📋 Custom Roles in TenantRole table for Lakme:\n');
    const tenantRoles = await prisma.tenantRole.findMany({
      where: { tenantId: lakme.id },
    });

    if (tenantRoles.length === 0) {
      console.log('   ❌ No custom roles found\n');
    } else {
      tenantRoles.forEach(role => {
        console.log(`   • ${role.roleCode}`);
        console.log(`     Name: ${role.roleName}`);
        console.log(`     Desc: ${role.description}`);
        console.log(`     Category: ${role.category}`);
        console.log(`     System: ${role.isSystem}`);
        console.log('');
      });
    }

    // Check all TenantUsers in Lakme
    console.log('📋 Users in Lakme Tenant:\n');
    const tenantUsers = await prisma.tenantUser.findMany({
      where: { tenantId: lakme.id },
    });

    if (tenantUsers.length === 0) {
      console.log('   ❌ No users found\n');
    } else {
      tenantUsers.forEach(tu => {
        console.log(`   • ${tu.email} (${tu.displayName})`);
        console.log(`     Roles: ${tu.tenantRoles?.join(', ') || 'none'}`);
        console.log('');
      });
    }

    // Check system roles assigned to users
    console.log('📋 All System Roles in Database:\n');
    const systemRoles = await prisma.role.findMany({
      where: { isSystem: true },
    });

    systemRoles.forEach(role => {
      console.log(`   • ${role.code} - ${role.name}`);
    });

    console.log('\n✅ Debug complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugRoles();
