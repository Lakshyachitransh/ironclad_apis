# Predefined Permissions Endpoint - Implementation Summary

## Overview

Created a new endpoint for platform administrators to view all predefined permissions in the system.

## Endpoint Details

### Route

```
GET /api/admin/permissions/predefined
```

### Access Control

- **Required Role**: `platform_admin`
- **Authentication**: JWT Bearer token required
- **HTTP Method**: GET
- **Response Status**: 200 OK

### Implementation Files Modified

#### 1. `src/admin/admin.controller.ts`

**Added Endpoint:**

```typescript
@Roles('platform_admin')
@Get('permissions/predefined')
@HttpCode(HttpStatus.OK)
@ApiOperation({
  summary: 'Get all predefined permissions',
  description: `Retrieves the complete list of predefined system permissions.

These are immutable permissions that define all possible actions in the system.
Permissions are organized by category and are used to control access to endpoints.

Only platform_admin role can access this endpoint.`
})
async getPredefinedPermissions() {
  return this.adminService.getPredefinedPermissions();
}
```

#### 2. `src/admin/admin.service.ts`

**Added Service Method:**

```typescript
async getPredefinedPermissions() {
  // Fetches all permissions from database
  // Extracts category from permission code (e.g., "courses" from "courses.create")
  // Groups permissions by category
  // Returns structured response with statistics and categorized permissions
}
```

## Response Format

### Success Response (HTTP 200)

```json
{
  "success": true,
  "totalPermissions": 71,
  "categories": {
    "auth": 4,
    "users": 6,
    "tenants": 5,
    "roles": 7,
    "courses": 8,
    "modules": 4,
    "lessons": 6,
    "quizzes": 8,
    "live-classes": 8,
    "licenses": 9,
    "admin": 4
  },
  "permissionsByCategory": {
    "auth": [
      {
        "id": "perm-001",
        "code": "auth.register",
        "name": "Register new user",
        "category": "auth"
      },
      {
        "id": "perm-002",
        "code": "auth.login",
        "name": "Login to system",
        "category": "auth"
      }
      // ... more auth permissions
    ],
    "users": [
      {
        "id": "perm-005",
        "code": "users.create",
        "name": "Create new user",
        "category": "users"
      }
      // ... more user permissions
    ]
    // ... all other categories
  },
  "permissions": [
    // Flat array of all permissions with categories
  ]
}
```

### Error Response (HTTP 403)

```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

## Predefined Permissions Structure

The system maintains 71 **immutable** predefined permissions across 11 categories:

### Categories & Counts

1. **auth** (4) - Authentication operations
2. **users** (6) - User management
3. **tenants** (5) - Tenant management (platform only)
4. **roles** (7) - Role creation and management
5. **courses** (8) - Course operations
6. **modules** (4) - Module management
7. **lessons** (6) - Lesson operations
8. **quizzes** (8) - Quiz management
9. **live-classes** (8) - Live class operations
10. **licenses** (9) - License management
11. **admin** (4) - Administrative operations

## Use Cases

1. **Permission Discovery**: Platform admins can view all available permissions before creating custom roles
2. **Role Creation Preparation**: Admins use this endpoint to understand what permissions can be assigned to roles
3. **Permission Documentation**: Provides a reference for all system capabilities
4. **Audit & Compliance**: Shows complete permission hierarchy for audit purposes

## Permission Code Format

All permission codes follow the pattern: `category.action`

Examples:

- `courses.create` - Create new course
- `users.bulk-upload` - Bulk upload users
- `roles.assign` - Assign role to user
- `quizzes.create` - Create quiz

## Key Features

✅ **Immutable Permissions** - Predefined permissions cannot be deleted or modified (only managed by system administrators)

✅ **Categorized Organization** - Permissions grouped by functional area for easy discovery

✅ **Role-Based Access** - Only platform_admin can view all permissions

✅ **Structured Response** - Three views of data:

- `categories` - Count of permissions per category
- `permissionsByCategory` - Grouped permissions with full details
- `permissions` - Flat array for easier consumption

✅ **Error Handling** - Proper exception handling with meaningful error messages

✅ **API Documentation** - Swagger/OpenAPI annotations for auto-generated documentation

## Database Schema Reference

### Permission Table

```sql
CREATE TABLE "Permission" (
  id              String @id @default(uuid())
  code            String @unique
  name            String
  rolePermissions RolePermission[]
);
```

### How Categories are Determined

- Categories are dynamically extracted from permission codes
- First part of code (before the dot) = category
- Example: `"courses.create"` → category = `"courses"`

## Integration with Role Management

1. **Creating Custom Roles**: When platform_admin creates a new role, they can assign any combination of these 71 permissions
2. **Role Assignment**: When assigning a role to a user, that user inherits all permissions associated with the role
3. **Endpoint Authorization**: Each endpoint checks three layers:
   - JWT validation
   - Role check
   - Permission check (does the user's role have the required permission?)

## Testing the Endpoint

### Using cURL

```bash
curl -X GET http://localhost:3000/api/admin/permissions/predefined \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Using Swagger UI

1. Navigate to `http://localhost:3000/api/docs`
2. Look for "Admin" section
3. Find "Get all predefined permissions" endpoint
4. Click "Try it out"
5. Authorize with platform_admin JWT token
6. Execute

### Success Criteria

- Status Code: 200
- Response contains all 71 permissions
- Permissions are grouped in all three formats (categories count, grouped, flat)
- No unauthorized errors

## Security Considerations

✅ **Role-Based Access Control** - Only platform_admin can access this endpoint

✅ **Read-Only Operation** - GET request, no data modification

✅ **Permission Enumeration** - Intentionally exposes permission structure (needed for role management UI)

✅ **Error Messages** - Generic error messages (doesn't reveal system internals)

✅ **JWT Validation** - All requests require valid JWT token

## Future Enhancements

1. **Tenant Admin Access** - Allow tenant_admin to view permissions (read-only) for their custom roles
2. **Permission Filtering** - Add query parameters to filter by category or role type
3. **Permission History** - Track permission usage and role assignments
4. **Permission Export** - Export permissions as CSV or PDF for documentation

## Related Endpoints

- `GET /api/admin/users/all-organized` - View users organized by tenant
- `GET /api/admin/users/all-with-courses` - View user course assignments
- `POST /api/roles` - Create new role with permissions (uses predefined permissions)
- `GET /api/roles` - View all available roles

## Commit Information

**Commit**: Add endpoint for platform_admin to view all predefined permissions
**Files Modified**:

- `src/admin/admin.controller.ts`
- `src/admin/admin.service.ts`

**Build Status**: ✅ 0 TypeScript errors
**Database Status**: ✅ 71 permissions initialized via seed-rbac.ts
