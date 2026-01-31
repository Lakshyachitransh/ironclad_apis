-- Get first tenant ID (adjust if needed)
WITH tenant_id AS (
  SELECT id FROM "Tenant" LIMIT 1
)
INSERT INTO "Course" (id, "tenantId", title, summary, level, status, "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  t.id,
  'Advanced JavaScript Fundamentals',
  'Master advanced JavaScript concepts including closures, prototypes, async/await, and modern ES6+ features.',
  'Advanced',
  'published',
  NOW(),
  NOW()
FROM tenant_id t
WHERE NOT EXISTS (
  SELECT 1 FROM "Course" WHERE title = 'Advanced JavaScript Fundamentals'
)
RETURNING id, "tenantId", title, summary, level, status;
