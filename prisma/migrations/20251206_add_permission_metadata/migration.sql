-- AlterTable
ALTER TABLE "Role" ADD COLUMN "description" TEXT,
ADD COLUMN "category" TEXT,
ADD COLUMN "isSystem" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Permission" ADD COLUMN "description" TEXT,
ADD COLUMN "resource" TEXT NOT NULL DEFAULT 'custom',
ADD COLUMN "action" TEXT NOT NULL DEFAULT 'manage',
ADD COLUMN "category" TEXT NOT NULL DEFAULT 'Custom',
ADD COLUMN "isSystemDefined" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Role_category_idx" ON "Role"("category");

-- CreateIndex
CREATE INDEX "Permission_resource_idx" ON "Permission"("resource");

-- CreateIndex
CREATE INDEX "Permission_category_idx" ON "Permission"("category");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "Permission_resource_action_key" ON "Permission"("resource", "action");
