import { PrismaClient } from './generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get all tenants
  console.log('\n=== ALL TENANTS ===');
  const tenants = await prisma.tenant.findMany();
  console.log(JSON.stringify(tenants, null, 2));

  // Get all tenant users
  console.log('\n=== ALL TENANT USERS ===');
  const tenantUsers = await prisma.tenantUser.findMany({
    select: {
      id: true,
      email: true,
      displayName: true,
      tenantId: true,
      status: true,
      tenantRoles: true
    }
  });
  console.log(JSON.stringify(tenantUsers, null, 2));

  // Get all courses
  console.log('\n=== ALL COURSES ===');
  const courses = await prisma.course.findMany({
    include: {
      modules: {
        include: {
          lessons: true
        }
      }
    }
  });
  console.log(JSON.stringify(courses.map(c => ({
    id: c.id,
    title: c.title,
    tenantId: c.tenantId,
    status: c.status,
    modulesCount: c.modules.length,
    lessonsCount: c.modules.reduce((sum, m) => sum + m.lessons.length, 0)
  })), null, 2));
}

main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
