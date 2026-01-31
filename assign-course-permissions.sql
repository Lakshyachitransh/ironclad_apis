-- Assign all course-related permissions to platform_admin role

WITH platform_admin_role AS (
  SELECT id FROM "Role" WHERE code = 'platform_admin' LIMIT 1
)
INSERT INTO "RolePermission" (id, "roleId", "permissionId")
SELECT 
  gen_random_uuid(),
  par.id as roleId,
  p.id as permissionId
FROM platform_admin_role par
CROSS JOIN "Permission" p
WHERE p.code IN (
  'courses.create', 'courses.read', 'courses.list', 'courses.view', 'courses.update', 'courses.delete', 
  'courses.assign', 'courses.publish', 'courses.progress',
  'modules.create', 'modules.update', 'modules.delete',
  'lessons.create', 'lessons.update', 'lessons.delete', 'lessons.upload-video', 'lessons.add-summary',
  'quizzes.create', 'quizzes.update', 'quizzes.delete', 'quizzes.publish', 'quizzes.view', 
  'quizzes.attempt', 'quizzes.results', 'quizzes.generate'
)
  AND NOT EXISTS (
    SELECT 1 FROM "RolePermission" 
    WHERE "roleId" = par.id AND "permissionId" = p.id
  )
ON CONFLICT DO NOTHING;

-- Verify assignments
SELECT 
  'platform_admin' as role_code,
  COUNT(DISTINCT p.code) as total_assigned,
  STRING_AGG(DISTINCT p.code, ', ' ORDER BY p.code) as assigned_permissions
FROM "Role" r
LEFT JOIN "RolePermission" rp ON r.id = rp."roleId"
LEFT JOIN "Permission" p ON rp."permissionId" = p.id
WHERE r.code = 'platform_admin'
  AND p.code LIKE 'courses.%' OR p.code LIKE 'modules.%' OR p.code LIKE 'lessons.%' OR p.code LIKE 'quizzes.%';
