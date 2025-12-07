-- CreateTable
CREATE TABLE "PlatformUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "displayName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "platformRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "displayName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "tenantId" TEXT NOT NULL,
    "tenantRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantUser_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "RefreshToken" ADD COLUMN "platformUserId" TEXT,
ADD COLUMN "tenantUserId" TEXT;

-- AlterTable
ALTER TABLE "CourseAssignment" ADD COLUMN "tenantUserId" TEXT;

-- AlterTable
ALTER TABLE "UserProgress" ADD COLUMN "tenantUserId" TEXT;

-- AlterTable
ALTER TABLE "LessonProgress" ADD COLUMN "tenantUserId" TEXT;

-- AlterTable
ALTER TABLE "LiveClassParticipant" ADD COLUMN "tenantUserId" TEXT;

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN "platformUserId" TEXT;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN "tenantUsers" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "PlatformUser_email_key" ON "PlatformUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TenantUser_email_key" ON "TenantUser"("email");

-- CreateIndex
CREATE INDEX "RefreshToken_platformUserId_idx" ON "RefreshToken"("platformUserId");

-- CreateIndex
CREATE INDEX "RefreshToken_tenantUserId_idx" ON "RefreshToken"("tenantUserId");

-- AddForeignKey
ALTER TABLE "TenantUser" ADD CONSTRAINT "TenantUser_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_platformUserId_fkey" FOREIGN KEY ("platformUserId") REFERENCES "PlatformUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_tenantUserId_fkey" FOREIGN KEY ("tenantUserId") REFERENCES "TenantUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseAssignment" ADD CONSTRAINT "CourseAssignment_tenantUserId_fkey" FOREIGN KEY ("tenantUserId") REFERENCES "TenantUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProgress" ADD CONSTRAINT "UserProgress_tenantUserId_fkey" FOREIGN KEY ("tenantUserId") REFERENCES "TenantUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_tenantUserId_fkey" FOREIGN KEY ("tenantUserId") REFERENCES "TenantUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClassParticipant" ADD CONSTRAINT "LiveClassParticipant_tenantUserId_fkey" FOREIGN KEY ("tenantUserId") REFERENCES "TenantUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_platformUserId_fkey" FOREIGN KEY ("platformUserId") REFERENCES "PlatformUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
