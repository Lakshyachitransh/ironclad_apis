-- Add a course record with all related entities

-- First, get the first tenant and create a course
WITH tenant_data AS (
  SELECT id, name FROM "Tenant" LIMIT 1
),
new_course AS (
  INSERT INTO "Course" (id, "tenantId", title, summary, level, status, "createdAt", "updatedAt")
  SELECT 
    gen_random_uuid(),
    id,
    'Advanced JavaScript Fundamentals',
    'Master advanced JavaScript concepts including closures, prototypes, async/await, and modern ES6+ features.',
    'Advanced',
    'published',
    NOW(),
    NOW()
  FROM tenant_data
  RETURNING id, "tenantId", title, summary, level, status
),
new_module AS (
  INSERT INTO "Module" (id, "courseId", title, description, "displayOrder", status, "createdAt", "updatedAt")
  SELECT 
    gen_random_uuid(),
    c.id,
    'Module 1: Core Concepts',
    'Learn the fundamental concepts of JavaScript',
    1,
    'published',
    NOW(),
    NOW()
  FROM new_course c
  RETURNING id, "courseId", title, description, "displayOrder", status
),
new_lesson AS (
  INSERT INTO "Lesson" (id, "moduleId", title, description, "displayOrder", status, "createdAt", "updatedAt")
  SELECT 
    gen_random_uuid(),
    m.id,
    'Lesson 1: Closures and Scope',
    'Understanding closures, scope chains, and variable hoisting',
    1,
    'published',
    NOW(),
    NOW()
  FROM new_module m
  RETURNING id, "moduleId", title, description, "displayOrder", status
)
SELECT 
  'Course' as entity_type,
  c.id as entity_id,
  c.title as entity_title,
  c.level as additional_info
FROM new_course c
UNION ALL
SELECT 
  'Module',
  m.id,
  m.title,
  m."displayOrder"::text
FROM new_module m
UNION ALL
SELECT 
  'Lesson',
  l.id,
  l.title,
  l."displayOrder"::text
FROM new_lesson l;
