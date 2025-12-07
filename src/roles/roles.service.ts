import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  // Roles table CRUD
  async createRole(code: string, name: string, description: string) {
    return this.prisma.role.create({ data: { code, name } });
  }

  async getRoles() {
    return this.prisma.role.findMany();
  }

  async getRole(code: string) {
    return this.prisma.role.findUnique({ where: { code } });
  }

  // Permissions table CRUD
  // Note: schema has (id, code, name, resource, action, category). Use these here.
  async createPermission(code: string, name: string, resource: string, action: string, category: string) {
    // Check if permission already exists
    const existing = await this.prisma.permission.findUnique({
      where: { code }
    });

    if (existing) {
      throw new BadRequestException(`Permission with code '${code}' already exists`);
    }

    return this.prisma.permission.create({ 
      data: { 
        code, 
        name, 
        resource, 
        action, 
        category,
        description: `${resource}.${action}`,
        isSystemDefined: false 
      } 
    });
  }

  // Assign a permission to a role by their codes or IDs (find records, then create RolePermission by IDs)
  async assignPermissionToRole(roleCode: string, permissionCodeOrId: string) {
    return this.prisma.$transaction(async (tx) => {
      const role = await tx.role.findUnique({ where: { code: roleCode } });
      if (!role) throw new BadRequestException('Role not found');

      // Try to find permission by code first, then by id (UUID)
      let perm = await tx.permission.findUnique({ where: { code: permissionCodeOrId } });
      if (!perm) {
        perm = await tx.permission.findUnique({ where: { id: permissionCodeOrId } });
      }
      if (!perm) throw new BadRequestException(`Permission '${permissionCodeOrId}' not found`);

      // prevent duplicates (optional)
      const existing = await tx.rolePermission.findFirst({
        where: { roleId: role.id, permissionId: perm.id },
      });
      if (existing) return existing;

      return tx.rolePermission.create({
        data: { roleId: role.id, permissionId: perm.id },
      });
    });
  }

  // Assign all permissions in a category to a role
  async assignPermissionsByCategory(roleCode: string, category: string) {
    // First, find all permissions in this category OUTSIDE the transaction
    let allPermissions = await this.prisma.permission.findMany();
    const categoryPerms = allPermissions.filter(
      p => p.category && p.category.toLowerCase() === category.toLowerCase()
    );

    if (categoryPerms.length === 0) {
      // Get all unique categories from the database
      const allCategories = [...new Set(allPermissions.map(p => p.category).filter(Boolean))];
      const categoriesStr = allCategories.sort().join(', ');
      
      throw new BadRequestException(
        `No permissions found for category '${category}'. Available categories: ${categoriesStr}`
      );
    }

    // Now assign them in a transaction
    return this.prisma.$transaction(async (tx) => {
      const role = await tx.role.findUnique({ where: { code: roleCode } });
      if (!role) throw new BadRequestException('Role not found');

      // Assign each permission to the role (skip duplicates)
      const assignedPermissions = [];
      for (const perm of categoryPerms) {
        const existing = await tx.rolePermission.findFirst({
          where: { roleId: role.id, permissionId: perm.id },
        });
        if (!existing) {
          await tx.rolePermission.create({
            data: { roleId: role.id, permissionId: perm.id },
          });
          assignedPermissions.push({ code: perm.code, name: perm.name });
        } else {
          assignedPermissions.push({ code: perm.code, name: perm.name });
        }
      }

      return {
        roleCode,
        category: categoryPerms[0].category,
        assignedCount: assignedPermissions.length,
        permissions: assignedPermissions,
      };
    });
  }

  // Return permission entries for a role (include Permission details)
  async getPermissionsForRole(roleCode: string) {
    const role = await this.prisma.role.findUnique({
      where: { code: roleCode },
      include: {
        permissions: {
          include: { permission: true }, // rolePermission -> permission
        },
      },
    });
    return role?.permissions ?? [];
  }

  // Tenant-scoped: assign roles to a user for a tenant (user_tenants.roles is text[])
  // Requires UserTenant @@unique([userId, tenantId], name: "user_id_tenant_id") in schema
  async assignRolesToUserTenant(userId: string, tenantId: string, roles: string[]) {
    return this.prisma.userTenant.upsert({
      where: { user_id_tenant_id: { userId, tenantId } }, // matches the @@unique name
      update: { roles },
      create: { userId, tenantId, roles },
    });
  }

  // optional: merge roles (add roles to existing array)
  async addRolesToUserTenant(userId: string, tenantId: string, rolesToAdd: string[]) {
    const ut = await this.prisma.userTenant.findUnique({
      where: { user_id_tenant_id: { userId, tenantId } },
    });

    if (!ut) {
      return this.prisma.userTenant.create({ data: { userId, tenantId, roles: rolesToAdd } });
    }

    const merged = Array.from(new Set([...(ut.roles || []), ...rolesToAdd]));
    return this.prisma.userTenant.update({
      where: { user_id_tenant_id: { userId, tenantId } },
      data: { roles: merged },
    });
  }

  // Check whether a user (tenant roles) has a permission
  async userHasPermission(userId: string, tenantId: string | null, permissionCode: string) {
    // find userTenant (tenantId may be null -> skip)
    if (!tenantId) return false;
    const ut = await this.prisma.userTenant.findUnique({
      where: { user_id_tenant_id: { userId, tenantId } },
    });
    if (!ut || !ut.roles || ut.roles.length === 0) return false;

    // find permission by code
    const permission = await this.prisma.permission.findUnique({ where: { code: permissionCode } });
    if (!permission) return false;

    // check if any of the user's roles are linked to this permission
    const perms = await this.prisma.rolePermission.findMany({
      where: { role: { code: { in: ut.roles } }, permissionId: permission.id },
    });

    return perms.length > 0;
  }
}
