# Production Database Setup Guide

## Overview
This guide explains how to set up all tables from your local database to the production PostgreSQL database.

**Production Database URL:** `postgresql://admin:1103@yug@3.7.64.213:5432/ironclad`

## Files Created
1. `prisma/schema.production.prisma` - Separate Prisma schema for production with hardcoded database URL
2. This guide with setup instructions

## Setup Steps

### Option 1: Using Prisma Migrate (Recommended)

```bash
# Generate migration from production schema
npx prisma migrate deploy --schema prisma/schema.production.prisma

# Or create a new migration
npx prisma migrate dev --schema prisma/schema.production.prisma --name init_production_db
```

### Option 2: Using Environment Variable

If you prefer to use an environment variable instead of hardcoding the URL:

1. Create a `.env.production` file in the root directory:
```env
DATABASE_URL="postgresql://admin:1103@yug@3.7.64.213:5432/ironclad"
```

2. Use it with:
```bash
DATABASE_URL="postgresql://admin:1103@yug@3.7.64.213:5432/ironclad" npx prisma migrate deploy --schema prisma/schema.production.prisma
```

### Option 3: Direct Schema Push (For Fresh Database)

If the production database is empty or you want to push schema directly without migrations:

```bash
npx prisma db push --schema prisma/schema.production.prisma
```

## Generate Production Prisma Client

```bash
npx prisma generate --schema prisma/schema.production.prisma
```

## Verify Tables Were Created

```bash
# Connect to production database and verify tables
npx prisma studio --schema prisma/schema.production.prisma
```

## Connection Details
- **Host:** 3.7.64.213
- **Port:** 5432
- **User:** admin
- **Password:** 1103@yug
- **Database:** ironclad

## Tables Included
The production schema includes the following 37 tables:
- Tenant
- Application
- ApplicationFeature
- TenantApplicationLicense
- LicenseUser
- LicenseAudit
- PlatformUser
- TenantUser
- User
- UserTenant
- Role
- Permission
- RolePermission
- TenantRole
- Course
- Module
- Lesson
- Quiz
- QuizQuestion
- QuizOption
- QuizAttempt
- QuizAnswer
- LiveClass
- LiveClassParticipant
- RefreshToken
- CourseAssignment
- UserProgress
- LessonProgress
- AuditLog
- ExerciseTemplate
- Exercise
- ExerciseSubmission
- ExerciseAttempt
- Conversation
- Message
- Highlight

## Troubleshooting

### Connection Refused
- Verify the PostgreSQL server is running at 3.7.64.213:5432
- Check network connectivity to the production server
- Verify Username and password (admin/1103@yug)

### Permission Denied
- Ensure the admin user has database creation privileges
- Check if the "ironclad" database already exists

### Index/Constraint Errors
- The schema uses the same indexes and constraints as the local database
- All relationships are properly configured with onDelete cascades for data integrity

## Using Both Environments

You can now use both local and production databases:

**Local Development:**
```bash
npx prisma migrate dev
npx prisma studio
# Uses DATABASE_URL from .env
```

**Production:**
```bash
npx prisma migrate deploy --schema prisma/schema.production.prisma
npx prisma studio --schema prisma/schema.production.prisma
# Uses hardcoded URL in schema.production.prisma
```

## Important Notes

⚠️ **Security Considerations:**
- The production database URL is hardcoded in schema.production.prisma
- For better practice, consider moving to environment variables
- Ensure credentials are not committed to version control
- Use `.gitignore` to exclude sensitive files

## Next Steps

1. Run the migration to create all tables
2. Verify tables exist using Prisma Studio
3. Seed initial data if needed (roles, permissions, etc.)
4. Update your application configuration to use the appropriate schema
