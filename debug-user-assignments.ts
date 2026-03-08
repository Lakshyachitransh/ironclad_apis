import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debug() {
  try {
    console.log('\n=== DEBUGGING USER ASSIGNMENTS ===\n');

    // Get all TenantUsers
    const tenantUsers = await prisma.tenantUser.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        tenantId: true
      }
    });
    console.log('TenantUsers:', JSON.stringify(tenantUsers, null, 2));

    // Get all CourseAssignments (first 10)
    const assignments = await prisma.courseAssignment.findMany({
      take: 10,
      include: {
        course: {
          select: { id: true, title: true }
        }
      }
    });
    console.log('\n\nCourseAssignments:', JSON.stringify(assignments, null, 2));

    // Check if courseAssignment tenantUserIds match any TenantUser ids
    const assignmentUserIds = assignments.map(a => a.tenantUserId);
    console.log('\n\nAssignment tenantUserIds:', assignmentUserIds);
    console.log('TenantUser IDs:', tenantUsers.map(u => u.id));
    
    const matching = tenantUsers.filter(u => assignmentUserIds.includes(u.id));
    console.log('\n\nMatching TenantUsers with Assignments:', JSON.stringify(matching, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debug();
