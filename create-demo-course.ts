
import * as dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from './generated/prisma/client';

async function main() {
  const prisma = new PrismaClient();

  // 1. Create or get a tenant
  let tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Demo Tenant',
        status: 'active',
      },
    });
    console.log('Created new tenant:', tenant);
  } else {
    console.log('Using existing tenant:', tenant);
  }

  // 2. Create a course for the tenant
  const course = await prisma.course.create({
    data: {
      tenantId: tenant.id,
      title: 'Advanced JavaScript Fundamentals',
      summary: 'Master advanced JavaScript concepts including closures, prototypes, async/await, and modern ES6+ features.',
      level: 'Advanced',
      status: 'published',
    },
  });
  console.log('Created course:', course);

  // 3. Create a module for the course
  const module = await prisma.module.create({
    data: {
      courseId: course.id,
      title: 'Module 1: Core Concepts',
      description: 'Learn the fundamental concepts of JavaScript',
      displayOrder: 1,
      status: 'published',
    },
  });
  console.log('Created module:', module);

  // 4. Create a lesson for the module
  const lesson = await prisma.lesson.create({
    data: {
      moduleId: module.id,
      title: 'Lesson 1: Closures and Scope',
      description: 'Understanding closures, scope chains, and variable hoisting',
      displayOrder: 1,
      status: 'published',
    },
  });
  console.log('Created lesson:', lesson);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
