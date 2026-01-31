const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function addCourse() {
  try {
    await client.connect();
    console.log('✓ Connected to database');

    // Get first tenant
    const tenantResult = await client.query('SELECT id, name FROM "Tenant" LIMIT 1');
    
    if (tenantResult.rows.length === 0) {
      console.error('❌ No tenant found in database. Please create a tenant first.');
      process.exit(1);
    }

    const tenant = tenantResult.rows[0];
    console.log(`✓ Using tenant: ${tenant.name}\n`);

    // Create course
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
    console.log('✓ Course created:');
    console.log(`  ID: ${course.id}`);
    console.log(`  Title: ${course.title}`);
    console.log(`  Level: ${course.level}`);
    console.log(`  Status: ${course.status}\n`);

    // Create module
    const moduleResult = await client.query(
      `INSERT INTO "Module" (id, "courseId", title, description, "displayOrder", status, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, "courseId", title, description, status`,
      [
        course.id,
        'Module 1: Core Concepts',
        'Learn the fundamental concepts of JavaScript',
        1,
        'published'
      ]
    );

    const module = moduleResult.rows[0];
    console.log('✓ Module created:');
    console.log(`  ID: ${module.id}`);
    console.log(`  Title: ${module.title}\n`);

    // Create lesson
    const lessonResult = await client.query(
      `INSERT INTO "Lesson" (id, "moduleId", title, description, "displayOrder", status, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, "moduleId", title, description, status`,
      [
        module.id,
        'Lesson 1: Closures and Scope',
        'Understanding closures, scope chains, and variable hoisting',
        1,
        'published'
      ]
    );

    const lesson = lessonResult.rows[0];
    console.log('✓ Lesson created:');
    console.log(`  ID: ${lesson.id}`);
    console.log(`  Title: ${lesson.title}\n`);

    console.log('✅ Course structure successfully added to database!');
    console.log(`\nCourse Hierarchy:`);
    console.log(`├── Course: ${course.title} (${course.id})`);
    console.log(`│   └── Module: ${module.title} (${module.id})`);
    console.log(`│       └── Lesson: ${lesson.title} (${lesson.id})`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

addCourse();
