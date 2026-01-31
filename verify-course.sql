-- Verify the course was created
SELECT 
  c.id,
  c.title,
  c.summary,
  c.level,
  c.status,
  t.name as tenant_name,
  COUNT(DISTINCT m.id) as module_count,
  COUNT(DISTINCT l.id) as lesson_count,
  c."createdAt"
FROM "Course" c
LEFT JOIN "Tenant" t ON c."tenantId" = t.id
LEFT JOIN "Module" m ON c.id = m."courseId"
LEFT JOIN "Lesson" l ON m.id = l."moduleId"
WHERE c.title = 'Advanced JavaScript Fundamentals'
GROUP BY c.id, c.title, c.summary, c.level, c.status, t.name, c."createdAt"
ORDER BY c."createdAt" DESC
LIMIT 1;
