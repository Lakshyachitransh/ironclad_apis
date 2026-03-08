/*
  Warnings:

  - You are about to drop the column `assignedTo` on the `CourseAssignment` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `LiveClassParticipant` table. All the data in the column will be lost.
  - You are about to drop the column `tenantUsers` on the `Tenant` table. All the data in the column will be lost.
  - You are about to drop the column `endAt` on the `TenantApplicationLicense` table. All the data in the column will be lost.
  - You are about to drop the column `seats` on the `TenantApplicationLicense` table. All the data in the column will be lost.
  - You are about to drop the column `startAt` on the `TenantApplicationLicense` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tenantUserId,lessonId]` on the table `LessonProgress` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[liveClassId,tenantUserId]` on the table `LiveClassParticipant` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,applicationId]` on the table `TenantApplicationLicense` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,email]` on the table `TenantUser` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantUserId,courseId]` on the table `UserProgress` will be added. If there are existing duplicate values, this will fail.
  - Made the column `tenantUserId` on table `CourseAssignment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantUserId` on table `LessonProgress` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantUserId` on table `LiveClassParticipant` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `Permission` required. This step will fail if there are existing NULL values in that column.
  - Made the column `passwordHash` on table `PlatformUser` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `startDate` to the `TenantApplicationLicense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `TenantApplicationLicense` table without a default value. This is not possible if the table is not empty.
  - Made the column `plan` on table `TenantApplicationLicense` required. This step will fail if there are existing NULL values in that column.
  - Made the column `passwordHash` on table `TenantUser` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantUserId` on table `UserProgress` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_platformUserId_fkey";

-- DropForeignKey
ALTER TABLE "RefreshToken" DROP CONSTRAINT "RefreshToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "TenantApplicationLicense" DROP CONSTRAINT "TenantApplicationLicense_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "TenantApplicationLicense" DROP CONSTRAINT "TenantApplicationLicense_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "UserTenant" DROP CONSTRAINT "UserTenant_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "UserTenant" DROP CONSTRAINT "UserTenant_userId_fkey";

-- DropIndex
DROP INDEX "CourseAssignment_assignedTo_idx";

-- DropIndex
DROP INDEX "LiveClassParticipant_liveClassId_userId_key";

-- DropIndex
DROP INDEX "LiveClassParticipant_userId_idx";

-- DropIndex
DROP INDEX "TenantUser_email_key";

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "category" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "CourseAssignment" DROP COLUMN "assignedTo",
ALTER COLUMN "tenantUserId" SET NOT NULL;

-- AlterTable
ALTER TABLE "LessonProgress" ALTER COLUMN "tenantUserId" SET NOT NULL;

-- AlterTable
ALTER TABLE "LiveClassParticipant" DROP COLUMN "userId",
ALTER COLUMN "tenantUserId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Permission" ALTER COLUMN "resource" DROP DEFAULT,
ALTER COLUMN "action" DROP DEFAULT,
ALTER COLUMN "category" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "PlatformUser" ALTER COLUMN "passwordHash" SET NOT NULL,
ALTER COLUMN "displayName" DROP NOT NULL;

-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Tenant" DROP COLUMN "tenantUsers";

-- AlterTable
ALTER TABLE "TenantApplicationLicense" DROP COLUMN "endAt",
DROP COLUMN "seats",
DROP COLUMN "startAt",
ADD COLUMN     "autoRenew" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "currentSeats" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "maxSeats" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "plan" SET NOT NULL,
ALTER COLUMN "plan" SET DEFAULT 'standard';

-- AlterTable
ALTER TABLE "TenantUser" ALTER COLUMN "passwordHash" SET NOT NULL,
ALTER COLUMN "displayName" DROP NOT NULL;

-- AlterTable
ALTER TABLE "UserProgress" ALTER COLUMN "tenantUserId" SET NOT NULL;

-- CreateTable
CREATE TABLE "ApplicationFeature" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LicenseUser" (
    "id" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastAccessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LicenseUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LicenseAudit" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "licenseId" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "performedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LicenseAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "courseId" TEXT,
    "lessonId" TEXT,
    "title" TEXT,
    "topic" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Highlight" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "lessonId" TEXT,
    "text" TEXT NOT NULL,
    "startPosition" INTEGER,
    "endPosition" INTEGER,
    "color" TEXT NOT NULL DEFAULT 'yellow',
    "notes" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Highlight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApplicationFeature_applicationId_idx" ON "ApplicationFeature"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationFeature_applicationId_code_key" ON "ApplicationFeature"("applicationId", "code");

-- CreateIndex
CREATE INDEX "LicenseUser_licenseId_idx" ON "LicenseUser"("licenseId");

-- CreateIndex
CREATE INDEX "LicenseUser_userId_idx" ON "LicenseUser"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LicenseUser_licenseId_userId_key" ON "LicenseUser"("licenseId", "userId");

-- CreateIndex
CREATE INDEX "LicenseAudit_tenantId_idx" ON "LicenseAudit"("tenantId");

-- CreateIndex
CREATE INDEX "LicenseAudit_createdAt_idx" ON "LicenseAudit"("createdAt");

-- CreateIndex
CREATE INDEX "Conversation_tenantId_idx" ON "Conversation"("tenantId");

-- CreateIndex
CREATE INDEX "Conversation_courseId_idx" ON "Conversation"("courseId");

-- CreateIndex
CREATE INDEX "Conversation_lessonId_idx" ON "Conversation"("lessonId");

-- CreateIndex
CREATE INDEX "Conversation_userId_idx" ON "Conversation"("userId");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_role_idx" ON "Message"("role");

-- CreateIndex
CREATE INDEX "Highlight_tenantId_idx" ON "Highlight"("tenantId");

-- CreateIndex
CREATE INDEX "Highlight_lessonId_idx" ON "Highlight"("lessonId");

-- CreateIndex
CREATE INDEX "Highlight_userId_idx" ON "Highlight"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");

-- CreateIndex
CREATE INDEX "AuditLog_platformUserId_idx" ON "AuditLog"("platformUserId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "CourseAssignment_tenantUserId_idx" ON "CourseAssignment"("tenantUserId");

-- CreateIndex
CREATE INDEX "LessonProgress_tenantUserId_idx" ON "LessonProgress"("tenantUserId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonProgress_tenantUserId_lessonId_key" ON "LessonProgress"("tenantUserId", "lessonId");

-- CreateIndex
CREATE INDEX "LiveClassParticipant_tenantUserId_idx" ON "LiveClassParticipant"("tenantUserId");

-- CreateIndex
CREATE UNIQUE INDEX "LiveClassParticipant_liveClassId_tenantUserId_key" ON "LiveClassParticipant"("liveClassId", "tenantUserId");

-- CreateIndex
CREATE INDEX "TenantApplicationLicense_tenantId_idx" ON "TenantApplicationLicense"("tenantId");

-- CreateIndex
CREATE INDEX "TenantApplicationLicense_applicationId_idx" ON "TenantApplicationLicense"("applicationId");

-- CreateIndex
CREATE INDEX "TenantApplicationLicense_status_idx" ON "TenantApplicationLicense"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TenantApplicationLicense_tenantId_applicationId_key" ON "TenantApplicationLicense"("tenantId", "applicationId");

-- CreateIndex
CREATE INDEX "TenantUser_tenantId_idx" ON "TenantUser"("tenantId");

-- CreateIndex
CREATE INDEX "TenantUser_email_idx" ON "TenantUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TenantUser_tenantId_email_key" ON "TenantUser"("tenantId", "email");

-- CreateIndex
CREATE INDEX "UserProgress_tenantUserId_idx" ON "UserProgress"("tenantUserId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProgress_tenantUserId_courseId_key" ON "UserProgress"("tenantUserId", "courseId");

-- AddForeignKey
ALTER TABLE "ApplicationFeature" ADD CONSTRAINT "ApplicationFeature_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantApplicationLicense" ADD CONSTRAINT "TenantApplicationLicense_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantApplicationLicense" ADD CONSTRAINT "TenantApplicationLicense_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseUser" ADD CONSTRAINT "LicenseUser_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "TenantApplicationLicense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseAudit" ADD CONSTRAINT "LicenseAudit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTenant" ADD CONSTRAINT "UserTenant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTenant" ADD CONSTRAINT "UserTenant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_platformUserId_fkey" FOREIGN KEY ("platformUserId") REFERENCES "PlatformUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Highlight" ADD CONSTRAINT "Highlight_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Highlight" ADD CONSTRAINT "Highlight_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
