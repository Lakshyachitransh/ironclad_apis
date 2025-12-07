-- AlterTable
ALTER TABLE "User" ADD COLUMN "platformRoles" TEXT[] DEFAULT ARRAY[]::TEXT[];
