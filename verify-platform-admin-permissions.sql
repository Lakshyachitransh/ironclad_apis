-- Verify platform_admin permissions
SELECT 
  'Courses' as category,
  STRING_AGG(DISTINCT p.code, ', ' ORDER BY p.code) as permissions
FROM "Role" r
LEFT JOIN "RolePermission" rp ON r.id = rp."roleId"
LEFT JOIN "Permission" p ON rp."permissionId" = p.id
WHERE r.code = 'platform_admin' AND p.code LIKE 'courses.%'
UNION ALL
SELECT 
  'Modules',
  STRING_AGG(DISTINCT p.code, ', ' ORDER BY p.code)
FROM "Role" r
LEFT JOIN "RolePermission" rp ON r.id = rp."roleId"
LEFT JOIN "Permission" p ON rp."permissionId" = p.id
WHERE r.code = 'platform_admin' AND p.code LIKE 'modules.%'
UNION ALL
SELECT 
  'Lessons',
  STRING_AGG(DISTINCT p.code, ', ' ORDER BY p.code)
FROM "Role" r
LEFT JOIN "RolePermission" rp ON r.id = rp."roleId"
LEFT JOIN "Permission" p ON rp."permissionId" = p.id
WHERE r.code = 'platform_admin' AND p.code LIKE 'lessons.%'
UNION ALL
SELECT 
  'Quizzes',
  STRING_AGG(DISTINCT p.code, ', ' ORDER BY p.code)
FROM "Role" r
LEFT JOIN "RolePermission" rp ON r.id = rp."roleId"
LEFT JOIN "Permission" p ON rp."permissionId" = p.id
WHERE r.code = 'platform_admin' AND p.code LIKE 'quizzes.%'
ORDER BY category;
