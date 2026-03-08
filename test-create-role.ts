import { PrismaClient } from './generated/prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, './.env') });

const prisma = new PrismaClient();

async function testCreateRole() {
  try {
    console.log('🧪 Testing Custom Role Creation\n');

    // Find Lakme tenant
    const lakme = await prisma.tenant.findUnique({
      where: { name: 'Lakme' }
    });

    if (!lakme) {
      console.log('❌ Lakme tenant not found');
      return;
    }

    console.log(`✓ Found Lakme tenant: ${lakme.id}\n`);

    // Try to create a custom role
    const roleCode = 'test_custom_role_' + Date.now();
    console.log(`📝 Attempting to create role: ${roleCode}`);
    console.log(`   Tenant ID: ${lakme.id}`);
    console.log(`   Role Name: Test Custom Role`);
    console.log('');

    const result = await prisma.tenantRole.create({
      data: {
        tenantId: lakme.id,
        roleCode: roleCode,
        roleName: 'Test Custom Role',
        description: 'Test role for debugging',
        category: 'custom',
        isSystem: false
      }
    });

    console.log('✅ Role created successfully!');
    console.log(`   ID: ${result.id}`);
    console.log(`   Code: ${result.roleCode}`);
    console.log(`   Name: ${result.roleName}\n`);

    // Verify it was persisted
    const verify = await prisma.tenantRole.findFirst({
      where: {
        tenantId: lakme.id,
        roleCode: roleCode
      }
    });

    if (verify) {
      console.log('✅ Verified: Role was persisted to database!');
    } else {
      console.log('❌ ERROR: Role was not persisted to database!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCreateRole();
