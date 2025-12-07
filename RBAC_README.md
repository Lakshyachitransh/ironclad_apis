# 🔐 Role-Based Access Control (RBAC) System

**Status**: ✅ **Production Ready**

Complete RBAC implementation for the Ironclad LMS platform with 6 roles, 19 permissions, and comprehensive documentation.

---

## 📚 Documentation Files

| File                             | Purpose                                             |
| -------------------------------- | --------------------------------------------------- |
| **RBAC_QUICK_REFERENCE.md**      | 👉 **START HERE** - Quick commands and API examples |
| **RBAC_IMPLEMENTATION.md**       | Technical deep dive and architecture details        |
| **RBAC_DEPLOYMENT_SUMMARY.md**   | Deployment checklist and production guide           |
| **RBAC_ARCHITECTURE_DIAGRAM.md** | Visual flow diagrams and database schema            |
| **This file**                    | Overview and navigation                             |

---

## 🚀 Quick Start (30 seconds)

```bash
# 1. Start dev server
npm run dev

# 2. In another terminal, seed RBAC data
npm run rbac:seed

# 3. Visit Swagger docs
http://localhost:3000/api/docs

# 4. Test an endpoint with org_admin role
# See RBAC_QUICK_REFERENCE.md for detailed examples
```

---

## 🎯 What is RBAC?

**Role-Based Access Control** is a security model where:

- Users are assigned **Roles** (e.g., `org_admin`, `learner`)
- Roles have **Permissions** (e.g., `manage_database`, `view_courses`)
- Endpoints require specific roles to access

**Example**:

```
User "admin@example.com"
  → assigned role "org_admin"
  → org_admin has permission "manage_database"
  → can now access POST /api/admin/database/update-config ✅
```

---

## 📊 System Overview

### 6 Roles

```
org_admin          → Manage everything (platform owner)
tenant_admin       → Manage one tenant
training_manager   → Create/manage courses
instructor         → Teach live classes
learner            → View courses, track progress
viewer             → Read-only access
```

### 19 Permissions

```
Admin (5)              Course (4)           User (3)
├─ manage_database     ├─ create_course      ├─ manage_users
├─ manage_tenants      ├─ edit_course        ├─ view_users
├─ view_all_users      ├─ delete_course      └─ create_user
├─ create_tenant_admin └─ manage_course...
└─ manage_roles

Live Class (4)         View (3)
├─ create_live_class   ├─ view_courses
├─ manage_live_classes ├─ view_lessons
├─ view_live_classes   └─ view_my_progress
└─ participate_live_class
```

### 7 Protected Admin Endpoints

```
✅ POST   /api/admin/database/update-config
✅ POST   /api/admin/database/migrate
✅ POST   /api/admin/database/update-and-migrate
✅ GET    /api/admin/database/current-config
✅ GET    /api/admin/users/all-with-courses
✅ GET    /api/admin/users/tenant/:tenantId/with-courses
✅ POST   /api/admin/tenants/:tenantId/create-admin
```

All require: `@Roles('org_admin')`

---

## 🔒 How It Works

### 1. User Logs In

```bash
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "SecurePass123!"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-123",
    "email": "admin@example.com",
    "roles": ["org_admin"]
  }
}
```

### 2. User Calls Protected Endpoint

```bash
GET /api/admin/users/all-with-courses
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### 3. Guards Check Authorization

```
Step 1: JwtAuthGuard validates token
        ✅ Valid → decode roles

Step 2: RolesGuard checks @Roles() decorator
        Endpoint: @Roles('org_admin')
        User has: ['org_admin']
        ✅ Match found → Allow

Step 3: Endpoint executes
        ✅ Success → Return 200 OK
```

### 4. Non-Admin User Gets Denied

```
User has: ['learner']
Required: ['org_admin']
❌ No match → Return 403 Forbidden
```

---

## 💻 Common Commands

### Database Management

```bash
# Clean and reset RBAC tables with fresh seed
npm run rbac:reset

# Just clean tables (delete all roles/permissions)
npm run rbac:clean

# Just seed new roles/permissions
npm run rbac:seed
```

### Development

```bash
# Start with hot reload
npm run dev

# Build for production
npm run build

# Run in production
npm run start:prod
```

### Testing

```bash
# Run all tests
npm test

# Run E2E tests
npm run test:e2e

# Watch mode
npm test:watch
```

---

## 🔧 Configuration

### Environment Variables

```bash
# Required
DATABASE_URL=postgresql://user:pass@localhost:5432/ironclad

# Optional (defaults shown)
JWT_SECRET=your-secret-key
JWT_EXPIRY=1h
PORT=3000
NODE_ENV=development
```

### Database Setup

```bash
# Create database
createdb ironclad

# Run migrations
npx prisma migrate deploy

# Seed RBAC data
npm run rbac:seed
```

---

## 🧪 Testing Examples

### Test 1: Successful Admin Access

```bash
# 1. Register
POST /api/auth/register
{
  "email": "admin@example.com",
  "password": "Test123!",
  "displayName": "Admin User"
}

# 2. Create tenant
POST /api/tenants
{
  "name": "Acme Corp"
}

# 3. Assign org_admin role
POST /api/roles/assign-role
{
  "userId": "user-id",
  "tenantId": "tenant-id",
  "roles": ["org_admin"]
}

# 4. Login
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "Test123!"
}

# 5. Access admin endpoint
GET /api/admin/users/all-with-courses
Authorization: Bearer {token}

# Response: ✅ 200 OK
```

### Test 2: Rejected Non-Admin Access

```bash
# Same setup but assign "learner" role instead

# Attempt to access admin endpoint
GET /api/admin/users/all-with-courses
Authorization: Bearer {learner-token}

# Response: ❌ 403 Forbidden
{
  "statusCode": 403,
  "message": "Access denied. Required roles: org_admin",
  "error": "Forbidden"
}
```

---

## 📁 File Structure

```
src/
├── admin/
│   ├── admin.controller.ts       ← 7 endpoints with @Roles('org_admin')
│   ├── admin.service.ts
│   └── admin.module.ts
│
├── roles/
│   ├── roles.controller.ts       ← Role/permission management
│   ├── roles.service.ts
│   ├── roles.guard.ts            ← ✨ The RBAC guard
│   ├── roles.decorator.ts        ← @Roles() decorator
│   └── roles.module.ts
│
└── common/
    └── guards/
        ├── jwt-auth.guard.ts     ← JWT validation
        └── org-admin.guard.ts    ← REMOVED (replaced by RolesGuard)

prisma/
├── schema.prisma                 ← Database schema
├── seed-rbac.ts                  ← ✨ Seed 6 roles + 19 permissions
├── clean-rbac.ts                 ← ✨ Safe cleanup script
├── clean-rbac.sql                ← SQL alternative
└── migrations/                   ← Database migrations
```

---

## 🎓 Learning Path

### Beginner (5 min)

1. Read this file
2. Check RBAC_QUICK_REFERENCE.md
3. Run `npm run rbac:seed`
4. Try test examples above

### Intermediate (15 min)

1. Read RBAC_IMPLEMENTATION.md
2. Study `src/roles/roles.guard.ts`
3. Review `src/admin/admin.controller.ts`
4. Trace request flow in RBAC_ARCHITECTURE_DIAGRAM.md

### Advanced (30 min)

1. Read RBAC_DEPLOYMENT_SUMMARY.md
2. Study seed script in `prisma/seed-rbac.ts`
3. Plan custom permissions for your domain
4. Implement new roles/permissions

---

## ⚠️ Important Notes

### Security

- ✅ Passwords hashed with bcrypt
- ✅ JWT tokens signed with secret
- ✅ Tokens expire (configurable)
- ✅ Role/permission checks on every request
- ✅ No hardcoded role checks in code

### Database

- ✅ Foreign key constraints prevent orphaned data
- ✅ Cleanup scripts respect dependencies
- ✅ Migrations versioned and reproducible
- ✅ Easy to reset RBAC without losing other data

### Production

- ✅ Ready for deployment
- ✅ Tested authentication flow
- ✅ Comprehensive error handling
- ✅ Full API documentation in Swagger

---

## 🐛 Troubleshooting

### "Access denied. Required roles: org_admin"

**Problem**: User doesn't have the role
**Solution**: Assign role via `/api/roles/assign-role`

### "User not found in request"

**Problem**: JWT token missing or invalid
**Solution**: Include `Authorization: Bearer {token}` header

### "@Roles() not working"

**Problem**: Endpoint still accessible without role
**Solution**: Ensure both guards are applied:

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('org_admin')
@Get('users')
```

### "Port 3000 already in use"

**Problem**: Another process using port 3000
**Solution**: Kill process or use different port:

```bash
PORT=3001 npm run dev
```

---

## 🚀 Deployment Checklist

- [ ] Pull latest code: `git pull origin main`
- [ ] Install dependencies: `npm install`
- [ ] Build project: `npm run build`
- [ ] Seed RBAC: `npm run rbac:seed`
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Start application: `npm run start:prod`
- [ ] Test endpoints: Verify admin endpoints work
- [ ] Monitor logs: Check for errors

---

## 📞 Support

### Documentation

- 📖 RBAC_QUICK_REFERENCE.md - Quick answers
- 🏗️ RBAC_ARCHITECTURE_DIAGRAM.md - Visual explanations
- 📋 RBAC_IMPLEMENTATION.md - Technical details
- ✅ RBAC_DEPLOYMENT_SUMMARY.md - Production guide

### Code

- Check inline comments in `src/roles/`
- Review examples in `prisma/seed-rbac.ts`
- Study tests in `test/` directory

---

## 📈 Future Enhancements

```
Phase 2:
├─ Dynamic role creation UI
├─ Permission audit logs
├─ Role assignment workflows
├─ Multi-factor authentication
└─ Fine-grained endpoint-level permissions

Phase 3:
├─ Time-based role access
├─ Delegation/approval workflows
├─ Cross-tenant permissions
└─ Advanced analytics dashboard
```

---

## 🎉 Summary

✅ **Secure** - Multi-layer authentication and authorization
✅ **Flexible** - Easy to add/modify roles and permissions
✅ **Scalable** - Supports multi-tenant hierarchies
✅ **Documented** - 5 comprehensive guide files
✅ **Production-Ready** - Tested and deployed

---

## 📚 Quick Links

| Need              | File                         | Section          |
| ----------------- | ---------------------------- | ---------------- |
| Quick commands    | RBAC_QUICK_REFERENCE.md      | Key Commands     |
| How to test       | RBAC_QUICK_REFERENCE.md      | API Testing      |
| Technical details | RBAC_IMPLEMENTATION.md       | All sections     |
| Deployment        | RBAC_DEPLOYMENT_SUMMARY.md   | Deployment Steps |
| Visuals           | RBAC_ARCHITECTURE_DIAGRAM.md | Request Flow     |

---

**Last Updated**: November 25, 2025
**Status**: ✅ Production Ready
**Version**: 1.0
