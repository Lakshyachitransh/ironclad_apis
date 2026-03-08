import dotenv from 'dotenv';
import { PrismaClient } from './generated/prisma/client';

dotenv.config();

const prisma = new PrismaClient();

async function getDatabaseStats() {
  try {
    const [
      tenantCount,
      tenantUsers,
      users,
      courses,
      courseAssignments
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenantUser.findMany({
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
      }),
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          displayName: true,
          status: true,
          platformRoles: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.course.count(),
      prisma.courseAssignment.count()
    ]);

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║          DATABASE STATISTICS                                  ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log(`📊 Overall Stats:`);
    console.log(`  • Tenants: ${tenantCount}`);
    console.log(`  • Platform Users: ${users.length}`);
    console.log(`  • Tenant Users: ${tenantUsers.length}`);
    console.log(`  • Courses: ${courses}`);
    console.log(`  • Course Assignments: ${courseAssignments}\n`);

    if (users.length > 0) {
      console.log('👤 Platform Users:\n');
      console.table(users);
    }

    if (tenantUsers.length > 0) {
      console.log('\n🏢 Tenant Users:\n');
      console.table(tenantUsers);
    } else {
      console.log('\n⚠️  No tenant users found in the database.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getDatabaseStats();
