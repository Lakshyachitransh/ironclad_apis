-- CreateTable ExerciseTemplate
CREATE TABLE "ExerciseTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "structure" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExerciseTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable Exercise
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "templateId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "category" TEXT NOT NULL,
    "startingCode" TEXT NOT NULL,
    "expectedOutput" TEXT,
    "testCases" TEXT NOT NULL,
    "highlightedSections" TEXT NOT NULL,
    "multipleChoiceOptions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable ExerciseSubmission
CREATE TABLE "ExerciseSubmission" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "submittedCode" TEXT NOT NULL,
    "selectedOption" TEXT,
    "output" TEXT,
    "testResults" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "feedback" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "attemptId" TEXT,

    CONSTRAINT "ExerciseSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable ExerciseAttempt
CREATE TABLE "ExerciseAttempt" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 1,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExerciseAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExerciseTemplate_tenantId_idx" ON "ExerciseTemplate"("tenantId");

-- CreateIndex
CREATE INDEX "ExerciseTemplate_category_idx" ON "ExerciseTemplate"("category");

-- CreateIndex
CREATE INDEX "Exercise_lessonId_idx" ON "Exercise"("lessonId");

-- CreateIndex
CREATE INDEX "Exercise_tenantId_idx" ON "Exercise"("tenantId");

-- CreateIndex
CREATE INDEX "Exercise_category_idx" ON "Exercise"("category");

-- CreateIndex
CREATE INDEX "ExerciseSubmission_exerciseId_idx" ON "ExerciseSubmission"("exerciseId");

-- CreateIndex
CREATE INDEX "ExerciseSubmission_userId_idx" ON "ExerciseSubmission"("userId");

-- CreateIndex
CREATE INDEX "ExerciseSubmission_tenantId_idx" ON "ExerciseSubmission"("tenantId");

-- CreateIndex
CREATE INDEX "ExerciseSubmission_status_idx" ON "ExerciseSubmission"("status");

-- CreateIndex
CREATE INDEX "ExerciseAttempt_exerciseId_idx" ON "ExerciseAttempt"("exerciseId");

-- CreateIndex
CREATE INDEX "ExerciseAttempt_userId_idx" ON "ExerciseAttempt"("userId");

-- CreateIndex
CREATE INDEX "ExerciseAttempt_tenantId_idx" ON "ExerciseAttempt"("tenantId");

-- AddForeignKey
ALTER TABLE "ExerciseTemplate" ADD CONSTRAINT "ExerciseTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ExerciseTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseSubmission" ADD CONSTRAINT "ExerciseSubmission_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseSubmission" ADD CONSTRAINT "ExerciseSubmission_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseSubmission" ADD CONSTRAINT "ExerciseSubmission_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseSubmission" ADD CONSTRAINT "ExerciseSubmission_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ExerciseAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseAttempt" ADD CONSTRAINT "ExerciseAttempt_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseAttempt" ADD CONSTRAINT "ExerciseAttempt_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
