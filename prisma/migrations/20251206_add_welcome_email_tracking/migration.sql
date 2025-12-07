-- Add welcome email tracking fields to User table
ALTER TABLE "User" ADD COLUMN "welcomeEmailSent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "welcomeEmailSentAt" TIMESTAMP(3);

-- Add welcome email tracking fields to PlatformUser table
ALTER TABLE "PlatformUser" ADD COLUMN "welcomeEmailSent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PlatformUser" ADD COLUMN "welcomeEmailSentAt" TIMESTAMP(3);

-- Add welcome email tracking fields to TenantUser table
ALTER TABLE "TenantUser" ADD COLUMN "welcomeEmailSent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TenantUser" ADD COLUMN "welcomeEmailSentAt" TIMESTAMP(3);
