/*
  Warnings:

  - A unique constraint covering the columns `[userId,tenantId]` on the table `UserTenant` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserTenant_userId_tenantId_key" ON "UserTenant"("userId", "tenantId");
