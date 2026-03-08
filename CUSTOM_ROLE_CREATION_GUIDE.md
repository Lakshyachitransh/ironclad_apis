# Custom Role Creation & Retrieval Guide

## Overview
Custom roles are tenant-specific roles created by tenant admins. They are stored in the `TenantRole` table and appear separately from system roles in API responses.

## Creating a Custom Role

### Endpoint
```
POST /api/roles/my-tenant
```

### Required
- JWT token with `tenantId` set for your tenant
- User must have one of these roles: `platform_admin`, `tenant_admin`, or `org_admin`

### Example cURL Request
```bash
curl -X POST http://localhost:3000/api/roles/my-tenant \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "roleCode": "course_manager",
    "roleName": "Course Manager",
    "description": "Can manage courses for our team"
  }'
```

### Success Response (201 Created)
```json
{
  "id": "uuid-here",
  "tenantId": "your-tenant-id",
  "roleCode": "course_manager",
  "roleName": "Course Manager",
  "description": "Can manage courses for our team",
  "category": "custom",
  "isSystem": false,
  "createdAt": "2025-02-07T13:29:22.015Z",
  "updatedAt": "2025-02-07T13:29:22.015Z"
}
```

---

## Retrieving All Roles

### Endpoint
```
GET /api/roles/my-tenant/all
```

### Example cURL Request
```bash
curl -X GET http://localhost:3000/api/roles/my-tenant/all \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### Response Format
The response contains **THREE fields**:
```json
{
  "systemRoles": [
    {
      "code": "tenant_admin",
      "name": "Tenant Administrator",
      "permissions": [ /* array of permission objects */ ]
    }
  ],
  
  "customRoles": [
    {
      "id": "uuid-here",
      "tenantId": "your-tenant-id",
      "roleCode": "course_manager",
      "roleName": "Course Manager",
      "description": "Can manage courses for our team",
      "category": "custom",
      "isSystem": false,
      "createdAt": "2025-02-07T13:29:22.015Z",
      "updatedAt": "2025-02-07T13:29:22.015Z"
    }
  ],
  
  "total": 2
}
```

### Important Note ⚠️
- **`systemRoles`** = System roles (platform_admin, tenant_admin, org_admin, trainer, learner, viewer) assigned to users in your tenant
- **`customRoles`** = Custom roles YOU created for your tenant (these are the new ones!)
- Look in the **`customRoles` array** to see your newly created roles!

---

## Troubleshooting

### Problem: "User does not have permission: roles.create"
**Solution:** You need the `roles.create` permission, which requires one of these roles:
- `platform_admin` (system level)
- `tenant_admin` (tenant level)
- `org_admin` (org level)

### Problem: "Role with code 'X' already exists in tenant"
**Solution:** A role with that code already exists. Use a different `roleCode` or delete the existing role first.

### Problem: "Tenant with ID 'X' not found"
**Solution:** The `tenantId` is invalid. Verify your JWT token contains the correct `tenantId`.

### Problem: Custom role doesn't appear in response
**Checklist:**
1. ✓ Check you're looking in the **`customRoles` array**, not `systemRoles`
2. ✓ Verify the role was created (check for 201 response from creation endpoint)
3. ✓ Confirm you're calling GET with the same tenant (extract `tenantId` from JWT)
4. ✓ Try refreshing: sometimes there's a slight delay

---

## Technical Details

### Role Types

**System Roles** (in `Role` table)
- Created by platform admins
- Shared across all tenants
- Examples: platform_admin, tenant_admin, org_admin, trainer, learner, viewer

**Custom Tenant Roles** (in `TenantRole` table)
- Created by tenant admins
- Specific to one tenant
- Only visible to users in that tenant
- Examples: course_manager, content_reviewer, course_instructor

### API Behavior

1. **When you create a role** → Returns 201 with the created role object
2. **When you list all roles** → Returns system roles + custom roles separately
3. **Each role can be assigned permissions** separately via other endpoints

---

## Next Steps

### After Creating a Custom Role

You can:
1. Assign permissions to it using `/api/roles/assign-permission`
2. Assign it to users in your tenant
3. View all permissions available to a role

For details on permission assignment, see `ROLE_MANAGEMENT_GUIDE.md`

---

## Quick Test

Replace `YOUR_JWT_TOKEN_HERE` and run these commands in order:

```bash
# 1. Create a custom role
curl -X POST http://localhost:3000/api/roles/my-tenant \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"roleCode":"test_role","roleName":"Test Role","description":"Testing"}'

# 2. Get all roles (look in customRoles array)
curl -X GET http://localhost:3000/api/roles/my-tenant/all \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

You should see your new role in the `customRoles` array!
