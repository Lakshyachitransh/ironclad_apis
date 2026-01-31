-- Add missing course-related permissions for platform_admin

-- First, ensure all course permissions exist
INSERT INTO "Permission" (id, code, name, resource, action, category, "isSystemDefined", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'courses.read', 'Read courses', 'courses', 'read', 'courses', true, NOW(), NOW()),
  (gen_random_uuid(), 'courses.publish', 'Publish course', 'courses', 'publish', 'courses', true, NOW(), NOW()),
  (gen_random_uuid(), 'modules.read', 'Read modules', 'modules', 'read', 'modules', true, NOW(), NOW()),
  (gen_random_uuid(), 'lessons.read', 'Read lessons', 'lessons', 'read', 'lessons', true, NOW(), NOW()),
  (gen_random_uuid(), 'quizzes.read', 'Read quizzes', 'quizzes', 'read', 'quizzes', true, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Get platform_admin role
WITH platform_admin_role AS (
  SELECT id FROM "Role" WHERE code = 'platform_admin' LIMIT 1
)
-- Insert missing permissions for platform_admin
INSERT INTO "RolePermission" (id, "roleId", "permissionId")
SELECT 
  gen_random_uuid(),
  par.id as roleId,
  p.id as permissionId
FROM platform_admin_role par
CROSS JOIN "Permission" p
WHERE p.code IN ('courses.read', 'courses.publish', 'modules.read', 'lessons.read', 'quizzes.read')
  AND NOT EXISTS (
    SELECT 1 FROM "RolePermission" 
    WHERE "roleId" = par.id AND "permissionId" = p.id
  )
ON CONFLICT DO NOTHING;

-- Verify all course permissions are assigned to platform_admin
SELECT 
  r.code as role_code,
  COUNT(p.id) as total_permissions,
  STRING_AGG(DISTINCT p.code, ', ' ORDER BY p.code) as permission_codes
FROM "Role" r
LEFT JOIN "RolePermission" rp ON r.id = rp."roleId"
LEFT JOIN "Permission" p ON rp."permissionId" = p.id
WHERE r.code = 'platform_admin'
GROUP BY r.code;
