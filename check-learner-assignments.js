const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkLearner1Assignments() {
  try {
    console.log('🔍 Checking learner1@lakme.com assignments...\n');

    // Find TenantUser for learner1
    const tenantUser = await prisma.tenantUser.findFirst({
      where: {
        email: 'learner1@lakme.com'
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!tenantUser) {
      console.log('❌ Learner1 not found in TenantUser table');
      return;
    }

    console.log('✅ Found TenantUser:');
    console.log(`   ID: ${tenantUser.id}`);
    console.log(`   Email: ${tenantUser.email}`);
    console.log(`   Display Name: ${tenantUser.displayName}`);
    console.log(`   Tenant: ${tenantUser.tenant.name}\n`);

    // Find all course assignments for this user
    const assignments = await prisma.courseAssignment.findMany({
      where: {
        tenantUserId: tenantUser.id,
        tenantId: tenantUser.tenantId
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            level: true
          }
        },
        userProgress: {
          select: {
            progressPercentage: true,
            status: true,
            lessonsCompleted: true,
            lessonsTotal: true
          }
        }
      },
      orderBy: {
        assignedAt: 'desc'
      }
    });

    if (assignments.length === 0) {
      console.log('❌ No course assignments found for this user\n');
      return;
    }

    console.log(`✅ Found ${assignments.length} course assignment(s):\n`);

    assignments.forEach((assignment, index) => {
      console.log(`📚 Assignment ${index + 1}:`);
      console.log(`   Assignment ID: ${assignment.id}`);
      console.log(`   Course: ${assignment.course.title}`);
      console.log(`   Course Level: ${assignment.course.level}`);
      console.log(`   Status: ${assignment.status}`);
      console.log(`   Assigned At: ${assignment.assignedAt}`);
      console.log(`   Due Date: ${assignment.dueDate || 'No due date'}`);
      
      if (assignment.userProgress && assignment.userProgress.length > 0) {
        const progress = assignment.userProgress[0];
        console.log(`   Progress:`);
        console.log(`     - Percentage: ${progress.progressPercentage}%`);
        console.log(`     - Status: ${progress.status}`);
        console.log(`     - Lessons: ${progress.lessonsCompleted}/${progress.lessonsTotal}`);
      } else {
        console.log(`   Progress: No progress recorded yet`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLearner1Assignments();
