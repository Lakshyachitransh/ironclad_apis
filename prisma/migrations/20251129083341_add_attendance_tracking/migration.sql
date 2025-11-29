-- AlterTable
ALTER TABLE "LiveClassParticipant" ADD COLUMN     "activeDurationSeconds" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "activePercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "isCompleted" BOOLEAN NOT NULL DEFAULT false;
