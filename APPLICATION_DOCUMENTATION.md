# Ironclad LMS - Complete Application Documentation

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Core Modules](#core-modules)
4. [Authentication & Authorization](#authentication--authorization)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Setup & Installation](#setup--installation)
8. [Deployment](#deployment)
9. [Running the Application](#running-the-application)
10. [Testing](#testing)

---

## System Overview

**Ironclad LMS** is a comprehensive, multi-tenant Learning Management System built with **NestJS**, **TypeScript**, **PostgreSQL**, and **Prisma ORM**. It supports role-based access control, course management, live classes, quizzes, and video processing.

### Key Features

✅ **Multi-Tenant Architecture** - Isolated tenants with shared infrastructure  
✅ **Role-Based Access Control (RBAC)** - 6 system roles + custom role creation  
✅ **JWT Authentication** - Secure token-based authentication  
✅ **Course Management** - Courses → Modules → Lessons → Quizzes  
✅ **Live Classes** - Real-time virtual classroom sessions  
✅ **Video Support** - Upload to AWS S3 with progress tracking  
✅ **AI-Powered Quizzes** - Generate quizzes from content using OpenAI  
✅ **License Management** - Feature-based licensing system  
✅ **Comprehensive API** - 40+ RESTful endpoints with Swagger documentation  

---

## Architecture

### Technology Stack

```
Frontend (Client)
    ↓ (API Calls)
NestJS Application (Node.js)
    ↓ (Query/Mutations)
PostgreSQL Database
    ↓ (ORM)
Prisma Client
    ↓ (External Services)
AWS S3 (Videos)
OpenAI GPT-4 (AI Features)
```

### Project Structure

```
src/
├── admin/                    # Admin operations (database, migrations, users)
├── auth/                     # JWT authentication & login
├── common/
│   ├── guards/              # JWT & Permission guards
│   ├── decorators/          # Custom decorators
│   ├── constants/           # Predefined permissions
│   └── exceptions/          # Custom exceptions
├── courses/                 # Course, module, lesson management
├── licenses/                # License & application management
├── live-class/              # Live class scheduling & management
├── roles/                   # Role creation & permission assignment
├── tenants/                 # Tenant management
├── users/                   # User management & authentication
├── prisma/                  # Prisma schema & migrations
├── types/                   # TypeScript interfaces
├── utils/                   # Helper utilities
├── app.module.ts            # Root module
└── main.ts                  # Application bootstrap

prisma/
├── schema.prisma            # Database schema
├── seed.ts                  # Initial data seeding
├── migrations/              # Database migrations
└── seed-*.ts                # Various seed scripts
```

---

## Core Modules

### 1. **Auth Module**

Handles user authentication and JWT token management.

**Key Endpoints:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout user

**Features:**
- JWT Bearer Token authentication
- Refresh token support (24h access, 7d refresh)
- Password hashing with bcrypt
- Tenant-scoped login

### 2. **Users Module**

Manages user creation, updates, and bulk operations.

**Key Endpoints:**
- `POST /api/users` - Create user (tenant_admin only)
- `GET /api/users` - List users (with pagination)
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/bulk-upload` - CSV bulk import

**Features:**
- CSV bulk user upload
- User status management (active, inactive, suspended)
- Email-based unique constraint
- Tenant isolation

### 3. **Tenants Module**

Manages multi-tenant organization setup.

**Key Endpoints:**
- `POST /api/tenants` - Create tenant (platform_admin only)
- `GET /api/tenants` - List tenants
- `GET /api/tenants/:id` - Get tenant details
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant

**Features:**
- Complete tenant isolation
- Tenant settings management
- License association

### 4. **Roles Module**

Manages role creation and permission assignment.

**Key Endpoints:**
- `POST /api/roles` - Create custom role
- `GET /api/roles` - List roles
- `GET /api/roles/:id` - Get role details
- `PUT /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role
- `POST /api/roles/assign-role` - Assign role to user
- `POST /api/roles/assign-permission` - Assign permission to role
- `GET /api/permissions` - List all available permissions

**System Roles (Predefined):**
1. **superadmin** - Full platform access (all 71 permissions)
2. **platform_admin** - Platform operations (tenants, licenses, 18 permissions)
3. **tenant_admin** - Tenant operations (users, courses, content, 25 permissions)
4. **training_manager** - Content creation (courses, quizzes, 20 permissions)
5. **instructor** - Live teaching (live classes, student interaction, 15 permissions)
6. **learner** - Content consumption (courses, quizzes, 8 permissions)

**Permissions:** 71 granular, immutable permissions across 11 categories

### 5. **Courses Module**

Complete course lifecycle management.

**Key Endpoints:**
- `POST /api/courses` - Create course
- `GET /api/courses` - List courses
- `GET /api/courses/:id` - Get course details
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course
- `POST /api/courses/:id/assign-users` - Assign course to users

**Sub-resources:**

**Modules:**
- `POST /api/courses/modules/create` - Create module
- `PUT /api/courses/modules/:id` - Update module
- `DELETE /api/courses/modules/:id` - Delete module

**Lessons:**
- `POST /api/lessons` - Create lesson
- `PUT /api/lessons/:id` - Update lesson
- `DELETE /api/lessons/:id` - Delete lesson
- `POST /api/lessons/:id/upload-video` - Upload video to S3

**Quizzes:**
- `POST /api/quizzes` - Create quiz
- `PUT /api/quizzes/:id` - Update quiz
- `POST /api/quizzes/:id/publish` - Publish quiz
- `POST /api/quizzes/:id/attempt` - Attempt quiz
- `POST /api/quizzes/generate` - Generate quiz from lesson summary (AI)

**Progress Tracking:**
- `GET /api/courses/:id/progress` - Get user course progress
- `GET /api/courses/:id/progress/all` - Get all users progress
- `POST /api/courses/:id/progress/update` - Update lesson completion

### 6. **Live Classes Module**

Real-time virtual classroom management.

**Key Endpoints:**
- `POST /api/live-classes` - Create live class
- `GET /api/live-classes` - List live classes
- `GET /api/live-classes/:id` - Get class details
- `POST /api/live-classes/:id/start` - Start class
- `POST /api/live-classes/:id/end` - End class
- `POST /api/live-classes/:id/join` - Join class
- `POST /api/live-classes/:id/leave` - Leave class
- `GET /api/live-classes/:id/attendance` - Get attendance

**Features:**
- Class scheduling
- Student enrollment
- Attendance tracking
- Class status management

### 7. **Licenses Module**

Feature-based licensing system.

**Key Endpoints:**
- `POST /api/licenses/applications` - Create application
- `GET /api/licenses/applications` - List applications
- `POST /api/licenses/applications/:id/features` - Add feature
- `POST /api/licenses/tenants/:tenantId/licenses` - Create tenant license
- `PUT /api/licenses/tenants/:licenseId` - Update license
- `POST /api/licenses/users/:userId/assign` - Assign license to user
- `POST /api/licenses/users/:userId/revoke` - Revoke license from user

### 8. **Admin Module**

Platform administration operations.

**Key Endpoints:**
- `POST /api/admin/database/update-config` - Update DB connection
- `POST /api/admin/database/migrate` - Run migrations
- `GET /api/admin/users/all-organized` - List all users by tenant

---

## Authentication & Authorization

### JWT Flow

```
1. User Login
   ↓
2. Credentials validated
   ↓
3. JWT Token generated (24h expiry)
   ↓
4. Token sent to client
   ↓
5. Client includes token in Authorization header
   ↓
6. Server validates token on each request
   ↓
7. Token expired? Use refresh token to get new token
```

### Permission Checking

```
Request with JWT Token
   ↓
JwtAuthGuard validates signature & expiry
   ↓
PermissionGuard checks required permission
   ↓
@RequirePermission decorator specifies needed permission
   ↓
Permission lookup in RolePermission table
   ↓
Access granted/denied
```

### Role Hierarchy

```
superadmin (all permissions)
├── platform_admin (platform operations)
│   ├── tenant_admin (manage tenant)
│   │   ├── training_manager (create content)
│   │   │   ├── instructor (teach live)
│   │   │   │   └── learner (consume content)
```

---

## Database Schema

### Core Tables

**Users**
```sql
id: UUID
email: String (unique)
passwordHash: String
displayName: String
status: 'active' | 'inactive' | 'suspended'
createdAt: DateTime
updatedAt: DateTime
```

**Tenants**
```sql
id: UUID
name: String (unique)
status: 'active' | 'inactive'
createdAt: DateTime
updatedAt: DateTime
```

**UserTenant**
```sql
id: UUID
userId: UUID (FK)
tenantId: UUID (FK)
roles: String[] (array of role names)
createdAt: DateTime
```

**Roles**
```sql
id: UUID
code: String (unique)
name: String
description: String
tenantId: UUID (nullable - null = system role)
createdAt: DateTime
updatedAt: DateTime
```

**Permissions**
```sql
id: UUID
code: String (unique)
name: String
description: String
resource: String
action: String
category: String
isSystem: Boolean (immutable if true)
createdAt: DateTime
```

**RolePermission**
```sql
id: UUID
roleId: UUID (FK)
permissionId: UUID (FK)
createdAt: DateTime
```

**Courses**
```sql
id: UUID
tenantId: UUID (FK)
title: String
summary: String
description: String
level: 'Beginner' | 'Intermediate' | 'Advanced'
ownerUserId: UUID (FK)
status: 'draft' | 'published' | 'archived'
createdAt: DateTime
updatedAt: DateTime
```

**Modules**
```sql
id: UUID
courseId: UUID (FK)
title: String
description: String
displayOrder: Int
createdAt: DateTime
updatedAt: DateTime
```

**Lessons**
```sql
id: UUID
moduleId: UUID (FK)
title: String
content: String
videoUrl: String (nullable)
displayOrder: Int
summary: String (nullable)
createdAt: DateTime
updatedAt: DateTime
```

**Quizzes**
```sql
id: UUID
lessonId: UUID (FK) (nullable)
courseId: UUID (FK)
title: String
description: String
questions: JSON (array of questions)
isPublished: Boolean
createdAt: DateTime
updatedAt: DateTime
```

**Courses**
```sql
id: UUID
userId: UUID (FK)
courseId: UUID (FK)
tenantId: UUID (FK)
status: 'assigned' | 'started' | 'in_progress' | 'completed'
completedAt: DateTime (nullable)
createdAt: DateTime
updatedAt: DateTime
```

**LiveClasses**
```sql
id: UUID
courseId: UUID (FK) (nullable)
tenantId: UUID (FK)
instructorId: UUID (FK)
title: String
scheduledAt: DateTime
status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
recordingUrl: String (nullable)
createdAt: DateTime
updatedAt: DateTime
```

**Applications**
```sql
id: UUID
code: String (unique)
name: String
description: String (nullable)
status: 'active' | 'inactive'
createdAt: DateTime
updatedAt: DateTime
```

**Licenses**
```sql
id: UUID
tenantId: UUID (FK)
applicationId: UUID (FK)
expiresAt: DateTime
status: 'active' | 'suspended' | 'expired'
createdAt: DateTime
updatedAt: DateTime
```

---

## API Endpoints

### Authentication Endpoints
```
POST   /api/auth/register              - Register new user
POST   /api/auth/login                 - Login with credentials
POST   /api/auth/refresh               - Refresh JWT token
POST   /api/auth/logout                - Logout user
```

### User Endpoints
```
POST   /api/users                      - Create user
GET    /api/users                      - List users (paginated)
GET    /api/users/:id                  - Get user details
PUT    /api/users/:id                  - Update user
DELETE /api/users/:id                  - Delete user
POST   /api/users/bulk-upload          - Bulk upload users (CSV)
```

### Tenant Endpoints
```
POST   /api/tenants                    - Create tenant
GET    /api/tenants                    - List tenants
GET    /api/tenants/:id                - Get tenant details
PUT    /api/tenants/:id                - Update tenant
DELETE /api/tenants/:id                - Delete tenant
```

### Role Endpoints
```
POST   /api/roles                      - Create role
GET    /api/roles                      - List roles
GET    /api/roles/:id                  - Get role details
PUT    /api/roles/:id                  - Update role
DELETE /api/roles/:id                  - Delete role
POST   /api/roles/assign-role          - Assign role to user
POST   /api/roles/assign-permission    - Assign permission to role
GET    /api/permissions                - List all permissions
```

### Course Endpoints
```
POST   /api/courses                    - Create course
GET    /api/courses                    - List courses
GET    /api/courses/:id                - Get course details
PUT    /api/courses/:id                - Update course
DELETE /api/courses/:id                - Delete course
POST   /api/courses/:id/assign-users   - Assign course to users
GET    /api/courses/:id/progress       - Get user progress
GET    /api/courses/:id/progress/all   - Get all users progress
```

### Module Endpoints
```
POST   /api/courses/modules/create     - Create module
PUT    /api/courses/modules/:id        - Update module
DELETE /api/courses/modules/:id        - Delete module
```

### Lesson Endpoints
```
POST   /api/lessons                    - Create lesson
PUT    /api/lessons/:id                - Update lesson
DELETE /api/lessons/:id                - Delete lesson
POST   /api/lessons/:id/upload-video   - Upload video to S3
POST   /api/lessons/:id/summary        - Generate lesson summary (AI)
```

### Quiz Endpoints
```
POST   /api/quizzes                    - Create quiz
GET    /api/quizzes/:id                - Get quiz details
PUT    /api/quizzes/:id                - Update quiz
DELETE /api/quizzes/:id                - Delete quiz
POST   /api/quizzes/:id/publish        - Publish quiz
POST   /api/quizzes/:id/attempt        - Attempt quiz
GET    /api/quizzes/:id/results        - Get quiz results
POST   /api/quizzes/generate           - Generate quiz from content (AI)
```

### Live Class Endpoints
```
POST   /api/live-classes               - Create live class
GET    /api/live-classes               - List live classes
GET    /api/live-classes/:id           - Get class details
POST   /api/live-classes/:id/start     - Start class
POST   /api/live-classes/:id/end       - End class
POST   /api/live-classes/:id/join      - Join class
POST   /api/live-classes/:id/leave     - Leave class
GET    /api/live-classes/:id/attendance - Get attendance
```

### License Endpoints
```
POST   /api/licenses/applications      - Create application
GET    /api/licenses/applications      - List applications
GET    /api/licenses/applications/:id  - Get application
POST   /api/licenses/applications/:id/features - Add feature
POST   /api/licenses/tenants/:tenantId/licenses - Create license
PUT    /api/licenses/tenants/:licenseId - Update license
POST   /api/licenses/users/:userId/assign - Assign license
POST   /api/licenses/users/:userId/revoke - Revoke license
```

### Admin Endpoints
```
POST   /api/admin/database/update-config - Update DB config
POST   /api/admin/database/migrate      - Run migrations
GET    /api/admin/users/all-organized   - List users by tenant
```

---

## Setup & Installation

### Prerequisites

- **Node.js 18.x** or higher
- **PostgreSQL 14** or higher
- **npm** or **yarn**
- **AWS S3** account (optional, for video storage)
- **OpenAI API key** (optional, for AI features)

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd ironclad_apis
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Environment Setup

Create `.env` file in root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ironclad"
BCRYPT_SALT_ROUNDS=12

# JWT
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRATION=24h
JWT_REFRESH_EXPIRATION=7d

# Server
PORT=3000
NODE_ENV=development

# AWS S3 (optional)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# OpenAI (optional)
OPENAI_API_KEY=your-openai-api-key

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Step 4: Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npx prisma migrate deploy

# Seed initial data
npm run prisma:seed
```

This creates:
- Initial admin user: `lakshya.srivastava@secnuo.com` / `ChangeMe123!`
- System roles and permissions
- Platform tenant

### Step 5: Build Application

```bash
npm run build
```

---

## Running the Application

### Development Mode (with hot reload)

```bash
npm run dev
# or
npm run start:dev
```

Server runs on `http://localhost:3000`

### Production Mode

```bash
npm run build
npm run start:prod
```

### View API Documentation

Once running, visit:
```
http://localhost:3000/api/docs
```

Swagger documentation provides interactive endpoint testing.

---

## Testing

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Generate Coverage Report

```bash
npm run test:cov
```

### E2E Testing

```bash
npm run test:e2e
```

E2E tests verify:
1. User registration and login
2. Tenant creation
3. Course creation with modules and lessons
4. Quiz generation and attempts
5. Live class creation and management
6. Role and permission assignment
7. User progress tracking

---

## Initial Admin Setup

### Automatic Setup (Recommended)

Run the seed script:
```bash
npm run prisma:seed
```

This automatically creates:
- **Initial Admin User**
  - Email: `lakshya.srivastava@secnuo.com`
  - Password: `ChangeMe123!`
  - Roles: `superadmin`, `platform_admin`

### Manual Admin Creation (Not Recommended)

If you need to create another admin:

1. Log in with existing admin credentials
2. Create new user via `POST /api/users`
3. Assign `platform_admin` role via `POST /api/roles/assign-role`

---

## Deployment

### EC2 Deployment

Requirements:
- Ubuntu 22.04 LTS
- Node.js 18.x
- PostgreSQL 14+
- PM2 (process manager)
- Nginx (reverse proxy)

### Step-by-Step Deployment

1. **SSH into EC2 instance**
   ```bash
   ssh -i your-key.pem ubuntu@your-instance-ip
   ```

2. **Install dependencies**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs postgresql postgresql-contrib
   ```

3. **Clone and setup project**
   ```bash
   git clone <repository-url>
   cd ironclad_apis
   npm install
   npm run build
   ```

4. **Setup database**
   ```bash
   sudo -u postgres createdb ironclad
   npx prisma migrate deploy
   npm run prisma:seed
   ```

5. **Start with PM2**
   ```bash
   npm install -g pm2
   pm2 start dist/main.js --name "ironclad-api"
   pm2 save
   ```

6. **Configure Nginx**
   ```nginx
   server {
     listen 80;
     server_name your-domain.com;
     
     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
     }
   }
   ```

7. **Enable SSL (Let's Encrypt)**
   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

## Common Tasks

### Create a New User

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "displayName": "John Doe",
    "password": "SecurePassword123!",
    "tenantId": "tenant-id"
  }'
```

### Create a Course

```bash
curl -X POST http://localhost:3000/api/courses \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant-id",
    "title": "Advanced JavaScript",
    "level": "Advanced",
    "summary": "Master advanced JS concepts"
  }'
```

### Generate Quiz from Content

```bash
curl -X POST http://localhost:3000/api/quizzes/generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "lessonId": "lesson-id",
    "numberOfQuestions": 10,
    "difficulty": "medium"
  }'
```

### Assign Role to User

```bash
curl -X POST http://localhost:3000/api/roles/assign-role \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id",
    "tenantId": "tenant-id",
    "roleCode": "training_manager"
  }'
```

---

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Database Connection Error

```bash
# Check PostgreSQL is running
sudo service postgresql status

# Reset database
npx prisma migrate reset --force
npm run prisma:seed
```

### JWT Token Expired

Get a new token using refresh token:
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Authorization: Bearer <refresh-token>"
```

### Permission Denied Error

Verify user has required role/permission:
```bash
# Check user roles
GET /api/users/:id
```

---

## Environment Variables Reference

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `DATABASE_URL` | string | - | PostgreSQL connection string |
| `JWT_SECRET` | string | - | Secret key for JWT signing |
| `JWT_EXPIRATION` | string | 24h | Access token expiration |
| `JWT_REFRESH_EXPIRATION` | string | 7d | Refresh token expiration |
| `PORT` | number | 3000 | Server port |
| `NODE_ENV` | string | development | Environment (development/production) |
| `AWS_ACCESS_KEY_ID` | string | - | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | string | - | AWS secret key |
| `AWS_REGION` | string | us-east-1 | AWS region |
| `AWS_S3_BUCKET` | string | - | S3 bucket name |
| `OPENAI_API_KEY` | string | - | OpenAI API key |
| `BCRYPT_SALT_ROUNDS` | number | 12 | Bcrypt salt rounds |

---

## Support & Contacts

For issues or questions:
- **Developer**: Lakshya Srivastava
- **Email**: lakshya.srivastava@secnuo.com
- **Documentation**: See API Swagger at `/api/docs`

---

## License

MIT Licensed - See LICENSE file for details

---

**Last Updated**: January 2026  
**Version**: 1.0.0  
**Status**: Production Ready
