import { PrismaClient } from './generated/prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, './.env') });

const prisma = new PrismaClient();

async function simulateUserFlow() {
  try {
    console.log('🔄 Simulating Complete User Flow\n');

    // Step 1: Find Lakme tenant (simulates finding current user's tenant)
    const lakme = await prisma.tenant.findUnique({
      where: { name: 'Lakme' }
    });

    if (!lakme) {
      console.log('❌ Lakme tenant not found');
      return;
    }

    console.log(`Step 1: ✓ Found Lakme tenant: ${lakme.id}\n`);

    // Step 2: Simulate creating a custom role (what POST /my-tenant should do)
    const roleCode = 'course_manager_' + Date.now();
    const roleName = 'Course Manager';
    const roleDescription = 'Can manage courses for the tenant';

    console.log('Step 2: Creating custom role via API simulation...');
    console.log(`  Code: ${roleCode}`);
    console.log(`  Name: ${roleName}`);
    console.log(`  Description: ${roleDescription}\n`);

    // Check if role already exists
    const existing = await prisma.tenantRole.findUnique({
      where: {
        tenant_role_code_unique: {
          tenantId: lakme.id,
          roleCode
        }
      }
    });

    if (existing) {
      console.log(`  ❌ Role with code "${roleCode}" already exists\n`);
    } else {
      // Create the role
      const newRole = await prisma.tenantRole.create({
        data: {
          tenantId: lakme.id,
          roleCode,
          roleName,
          description: roleDescription,
          category: 'custom',
          isSystem: false
        }
      });

      console.log('  ✓ Role created successfully!');
      console.log(`  Response (what API would return):\n`);
      console.log(JSON.stringify(newRole, null, 4));
      console.log('');
    }

    // Step 3: Simulate retrieving all roles (what GET /my-tenant/all should do)
    console.log('Step 3: Retrieving all roles for Lakme tenant...\n');

    // Get system roles used by users in this tenant
    const tenantUsers = await prisma.tenantUser.findMany({
      where: { tenantId: lakme.id },
      select: { tenantRoles: true }
    });

    const roleCodeSet = new Set<string>();
    for (const user of tenantUsers) {
      if (user.tenantRoles && Array.isArray(user.tenantRoles)) {
        user.tenantRoles.forEach(role => roleCodeSet.add(role));
      }
    }

    // Get system roles
    const systemRoles = await prisma.role.findMany({
      where: { code: { in: Array.from(roleCodeSet) } },
      include: { permissions: { include: { permission: true } } }
    });

    // Get custom roles
    const customRoles = await prisma.tenantRole.findMany({
      where: { tenantId: lakme.id }
    });

    console.log(`  System Roles in use: ${systemRoles.length}`);
    systemRoles.forEach(sr => {
      console.log(`    • ${sr.code} (${sr.name}) - ${sr.permissions.length} permissions`);
    });

    console.log(`\n  Custom Roles created: ${customRoles.length}`);
    if (customRoles.length === 0) {
      console.log('    ❌ NO CUSTOM ROLES FOUND');
    } else {
      customRoles.forEach(cr => {
        console.log(`    • ${cr.roleCode} (${cr.roleName})`);
      });
    }

    console.log(`\n  Total: ${systemRoles.length + customRoles.length} roles\n`);

    // Step 4: Show what the API response would look like
    console.log('Step 4: Full API Response Format:\n');
    const apiResponse = {
      systemRoles,
      customRoles,
      total: systemRoles.length + customRoles.length
    };
    console.log(JSON.stringify(apiResponse, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simulateUserFlow();
