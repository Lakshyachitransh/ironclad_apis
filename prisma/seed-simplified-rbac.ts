/**
 * SIMPLIFIED RBAC SEED - Restructured for Core Permissions
 * 
 * Architecture:
 * - PERMISSIONS: Core CRUD operations (read, create, update, delete) per resource
 * - ROLES: platform_admin (all permissions), tenant_admin (tenant scope), custom roles
 * - AUTHORIZATION: Check RolePermission table with platform_admin bypass
 * - TENANT SCOPED: Each action scoped to user's tenant
 */

import { PrismaClient } from '../generated/prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

// ============================================================================
// SIMPLIFIED CORE PERMISSIONS (15 total - CRUD per resource)
// ============================================================================
const CORE_PERMISSIONS = [
  // Users Management
  { code: 'users.read', name: 'Read users', resource: 'users', action: 'read', category: 'users' },
  { code: 'users.create', name: 'Create user', resource: 'users', action: 'create', category: 'users' },
  { code: 'users.update', name: 'Update user', resource: 'users', action: 'update', category: 'users' },
  { code: 'users.delete', name: 'Delete user', resource: 'users', action: 'delete', category: 'users' },

  // Courses Management
  { code: 'courses.read', name: 'Read courses', resource: 'courses', action: 'read', category: 'courses' },
  { code: 'courses.create', name: 'Create course', resource: 'courses', action: 'create', category: 'courses' },
  { code: 'courses.update', name: 'Update course', resource: 'courses', action: 'update', category: 'courses' },
  { code: 'courses.delete', name: 'Delete course', resource: 'courses', action: 'delete', category: 'courses' },

  // Roles Management
  { code: 'roles.read', name: 'Read roles', resource: 'roles', action: 'read', category: 'roles' },
  { code: 'roles.create', name: 'Create role', resource: 'roles', action: 'create', category: 'roles' },
  { code: 'roles.update', name: 'Update role', resource: 'roles', action: 'update', category: 'roles' },
  { code: 'roles.delete', name: 'Delete role', resource: 'roles', action: 'delete', category: 'roles' },

  // Admin Operations
  { code: 'admin.read', name: 'Read admin data', resource: 'admin', action: 'read', category: 'admin' },
  { code: 'admin.create', name: 'Create admin data', resource: 'admin', action: 'create', category: 'admin' },
  { code: 'admin.manage', name: 'Manage system', resource: 'admin', action: 'manage', category: 'admin' },
];

// ============================================================================
// SYSTEM ROLES (3 core roles)
// ============================================================================
interface RoleWithPermissions {
  code: string;
  name: string;
  type: 'platform' | 'tenant';
  permissions: string[]; // permission codes
}

const SYSTEM_ROLES: RoleWithPermissions[] = [
  {
    code: 'platform_admin',
    name: 'Platform Admin',
    type: 'platform',
    permissions: CORE_PERMISSIONS.map(p => p.code) // All permissions
  },
  {
    code: 'tenant_admin',
    name: 'Tenant Admin',
    type: 'tenant',
    permissions: [
      'users.read', 'users.create', 'users.update', 'users.delete',
      'courses.read', 'courses.create', 'courses.update', 'courses.delete',
      'roles.read', 'roles.create', 'roles.update', 'roles.delete'
    ]
  },
  {
    code: 'trainer',
    name: 'Trainer',
    type: 'tenant',
    permissions: [
      'users.read',
      'courses.read', 'courses.create', 'courses.update',
      'roles.read'
    ]
  }
];

// ============================================================================
// SEED FUNCTION
// ============================================================================
async function main() {
  console.log('🌱 Starting Simplified RBAC Seed...\n');

  try {
    // Step 1: Create all core permissions
    console.log('📋 Creating core permissions...');
    const createdPermissions: Record<string, string> = {};

    for (const perm of CORE_PERMISSIONS) {
      const existing = await prisma.permission.findUnique({ where: { code: perm.code } });
      if (!existing) {
        const created = await prisma.permission.create({
          data: { code: perm.code, name: perm.name, resource: perm.resource, action: perm.action, category: perm.category }
        });
        createdPermissions[perm.code] = created.id;
      } else {
        createdPermissions[perm.code] = existing.id;
      }
    }
    console.log(`✅ ${Object.keys(createdPermissions).length} permissions created\n`);

    // Step 2: Create system roles
    console.log('🎭 Creating system roles with permissions...');
    for (const roleSpec of SYSTEM_ROLES) {
      const existing = await prisma.role.findUnique({ where: { code: roleSpec.code } });
      let role;

      if (!existing) {
        role = await prisma.role.create({
          data: {
            code: roleSpec.code,
            name: roleSpec.name
          }
        });
      } else {
        role = existing;
      }

      // Assign permissions to role
      for (const permCode of roleSpec.permissions) {
        const permission = await prisma.permission.findUnique({ where: { code: permCode } });
        if (permission) {
          const existing = await prisma.rolePermission.findFirst({
            where: { roleId: role.id, permissionId: permission.id }
          });
          if (!existing) {
            await prisma.rolePermission.create({
              data: {
                roleId: role.id,
                permissionId: permission.id
              }
            });
          }
        }
      }

      console.log(`✅ ${roleSpec.code} (${roleSpec.permissions.length} permissions)`);
    }

    console.log('\n📊 Summary:');
    console.log(`  • Total core permissions: ${CORE_PERMISSIONS.length}`);
    console.log(`  • Total system roles: ${SYSTEM_ROLES.length}`);
    console.log(`  • platform_admin: All ${CORE_PERMISSIONS.length} permissions`);
    console.log(`  • tenant_admin: 12 permissions (CRUD for users, courses, roles)`);
    console.log(`  • trainer: 5 permissions (read + basic create/update)`);

    console.log('\n✨ Simplified RBAC Seed completed successfully!');
  } catch (error) {
    console.error('❌ Error during seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
