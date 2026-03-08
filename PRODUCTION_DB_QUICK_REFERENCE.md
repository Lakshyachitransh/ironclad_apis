# Quick Reference: Production Database Setup

## What Was Created

### 1. **schema.production.prisma**
A complete copy of your local Prisma schema configured for the production database with the hardcoded connection string: `postgresql://admin:1103@yug@3.7.64.213:5432/ironclad`

**Location:** `prisma/schema.production.prisma`

### 2. **setup-production-db.ps1**  
An interactive PowerShell script to automate database setup with menu options.

**Location:** `setup-production-db.ps1`

**Usage:**
```powershell
./setup-production-db.ps1
```

### 3. **PRODUCTION_DATABASE_SETUP.md**
Detailed guide with all setup instructions and troubleshooting.

**Location:** `PRODUCTION_DATABASE_SETUP.md`

---

## Quick Start Commands

### Option A: Using the PowerShell Script (Easiest)
```powershell
./setup-production-db.ps1
# Follow the menu prompts
```

### Option B: Direct Commands

**Push schema to production (recommended for fresh database):**
```bash
npx prisma db push --schema prisma/schema.production.prisma
```

**Create and deploy migration:**
```bash
npx prisma migrate dev --schema prisma/schema.production.prisma --name init_production
```

**Verify tables exist:**
```bash
npx prisma studio --schema prisma/schema.production.prisma
```

---

## Connection Details
```
Host: 3.7.64.213
Port: 5432
Username: admin
Password: 1103@yug
Database: ironclad
```

---

## Tables Created (37 total)

**User & Authentication:**
- User, PlatformUser, TenantUser, UserTenant, RefreshToken

**Tenant & Organization:**
- Tenant, TenantRole, TenantApplicationLicense, LicenseUser, LicenseAudit

**Roles & Permissions:**
- Role, Permission, RolePermission

**Applications:**
- Application, ApplicationFeature

**Learning Management:**
- Course, Module, Lesson, CourseAssignment, UserProgress, LessonProgress

**Assessments:**
- Quiz, QuizQuestion, QuizOption, QuizAttempt, QuizAnswer

**Live Classes:**
- LiveClass, LiveClassParticipant

**Exercises:**
- Exercise, ExerciseTemplate, ExerciseSubmission, ExerciseAttempt

**AI Tutor & Interaction:**
- Conversation, Message, Highlight

**Audit & Logging:**
- AuditLog

---

## After Setup

1. ✅ All tables created in production database
2. ✅ Run Prisma generate to update client
3. ✅ Switch between local/prod by using appropriate schema flag
4. ✅ Update env variables or code to point to production when needed

---

## Switching Between Environments

**Development (local):**
```bash
npx prisma [command]
# Uses: DATABASE_URL from .env (local database)
```

**Production:**
```bash
npx prisma [command] --schema prisma/schema.production.prisma
# Uses: hardcoded URL in schema.production.prisma
```

---

## Need Help?

- Check `PRODUCTION_DATABASE_SETUP.md` for detailed troubleshooting
- Verify network connectivity to `3.7.64.213:5432`
- Ensure PostgreSQL credentials are correct
- Check if database `ironclad` already exists
