import { PrismaClient } from './generated/prisma/client';
import { v4 as uuid } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('📚 Creating course, module, and lesson...\n');

    // 1. Create or find a tenant
    const tenant = await prisma.tenant.upsert({
      where: { name: 'Acme Corporation' },
      update: {},
      create: { name: 'Acme Corporation' }
    });
    console.log('✅ Tenant found/created:');
    console.log(`   ID: ${tenant.id}`);
    console.log(`   Name: ${tenant.name}\n`);

    // 2. Create a course
    const course = await prisma.course.create({
      data: {
        tenantId: tenant.id,
        title: 'JavaScript Fundamentals',
        summary: 'Learn the basics of JavaScript programming',
        level: 'beginner',
        status: 'published'
      }
    });
    console.log('✅ Course created:');
    console.log(`   ID: ${course.id}`);
    console.log(`   Title: ${course.title}`);
    console.log(`   Level: ${course.level}\n`);

    // 3. Create a module
    const module = await prisma.module.create({
      data: {
        courseId: course.id,
        title: 'Variables & Data Types',
        description: 'Understanding variables, constants, and JavaScript data types',
        displayOrder: 1,
        status: 'published'
      }
    });
    console.log('✅ Module created:');
    console.log(`   ID: ${module.id}`);
    console.log(`   Title: ${module.title}\n`);

    // 4. Create a lesson
    const lesson = await prisma.lesson.create({
      data: {
        moduleId: module.id,
        title: 'Introduction to Variables',
        description: 'In JavaScript, variables are containers for storing data values. You can declare variables using const, let, or var.',
        displayOrder: 1,
        videoDuration: 15,
        status: 'published'
      }
    });
    console.log('✅ Lesson created:');
    console.log(`   ID: ${lesson.id}`);
    console.log(`   Title: ${lesson.title}`);
    console.log(`   Duration: ${lesson.videoDuration} minutes\n`);

    console.log('📊 Summary:');
    console.log(`   Tenant: ${tenant.name} (${tenant.id})`);
    console.log(`   Course: ${course.title}`);
    console.log(`   Module: ${module.title}`);
    console.log(`   Lesson: ${lesson.title}`);
    console.log('\n✨ All resources created successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main()
  .finally(async () => await prisma.$disconnect());
