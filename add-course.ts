import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addCourse() {
  const client = await pool.connect();

  try {
    console.log('Connecting to database...');

    // First, get the first tenant
    const tenantResult = await client.query('SELECT id, name FROM "Tenant" LIMIT 1');
    
    if (tenantResult.rows.length === 0) {
      console.error('❌ No tenant found in database. Please create a tenant first.');
      process.exit(1);
    }

    const tenant = tenantResult.rows[0];
    console.log(`✓ Using tenant: ${tenant.name} (${tenant.id})\n`);

    // Create a course
    const courseResult = await client.query(
      `INSERT INTO "Course" (id, "tenantId", title, summary, level, status, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, "tenantId", title, summary, level, status, "createdAt", "updatedAt"`,
      [
        tenant.id,
        'Advanced JavaScript Fundamentals',
        'Master advanced JavaScript concepts including closures, prototypes, async/await, and modern ES6+ features.',
        'Advanced',
        'published'
      ]
    );

    const course = courseResult.rows[0];
    console.log('✓ Course created successfully:');
    console.log(JSON.stringify(course, null, 2));

    // Create a module
    const moduleResult = await client.query(
      `INSERT INTO "Module" (id, "courseId", title, description, "displayOrder", status, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, "courseId", title, description, "displayOrder", status, "createdAt", "updatedAt"`,
      [
        course.id,
        'Module 1: Core Concepts',
        'Learn the fundamental concepts of JavaScript',
        1,
        'published'
      ]
    );

    const module = moduleResult.rows[0];
    console.log('\n✓ Module created successfully:');
    console.log(JSON.stringify(module, null, 2));

    // Create a lesson
    const lessonResult = await client.query(
      `INSERT INTO "Lesson" (id, "moduleId", title, description, "displayOrder", status, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, "moduleId", title, description, "displayOrder", status, "createdAt", "updatedAt"`,
      [
        module.id,
        'Lesson 1: Closures and Scope',
        'Understanding closures, scope chains, and variable hoisting',
        1,
        'published'
      ]
    );

    const lesson = lessonResult.rows[0];
    console.log('\n✓ Lesson created successfully:');
    console.log(JSON.stringify(lesson, null, 2));

    console.log('\n✅ Course structure added to database successfully!');
    console.log(`\nCourse ID: ${course.id}`);
    console.log(`Module ID: ${module.id}`);
    console.log(`Lesson ID: ${lesson.id}`);

  } catch (error) {
    console.error('❌ Error adding course:', error);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

addCourse();
