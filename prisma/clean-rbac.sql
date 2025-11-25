-- Clean RBAC Tables Script
-- Deletes all Role, Permission, and RolePermission records

DELETE FROM "RolePermission";
DELETE FROM "Permission";
DELETE FROM "Role";

SELECT 
  (SELECT COUNT(*) FROM "Role") as remaining_roles,
  (SELECT COUNT(*) FROM "Permission") as remaining_permissions,
  (SELECT COUNT(*) FROM "RolePermission") as remaining_associations;
