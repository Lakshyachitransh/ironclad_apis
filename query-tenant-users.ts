import dotenv from 'dotenv';
import { PrismaClient } from './generated/prisma/client';

dotenv.config();

const prisma = new PrismaClient();

async function getAllTenantUsers() {
  try {
    const users = await prisma.tenantUser.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        status: true,
        tenantRoles: true,
        tenantId: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`\n✅ Found ${users.length} tenant users:\n`);
    console.table(users);

    // Also group by tenant
    const byTenant = users.reduce((acc, user) => {
      if (!acc[user.tenantId]) {
        acc[user.tenantId] = [];
      }
      acc[user.tenantId].push(user);
      return acc;
    }, {} as Record<string, typeof users>);

    console.log('\n📊 Users by Tenant:');
    for (const [tenantId, tenantUsers] of Object.entries(byTenant)) {
      console.log(`  Tenant ${tenantId}: ${tenantUsers.length} users`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getAllTenantUsers();
