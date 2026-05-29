-- CreateTable
CREATE TABLE "WorkoutPlanLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "planDayIndex" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkoutPlanLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkoutPlanLog_userId_planId_completedAt_idx" ON "WorkoutPlanLog"("userId", "planId", "completedAt");

-- CreateIndex
CREATE INDEX "WorkoutPlanLog_planId_completedAt_idx" ON "WorkoutPlanLog"("planId", "completedAt");

-- AddForeignKey
ALTER TABLE "WorkoutPlanLog" ADD CONSTRAINT "WorkoutPlanLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutPlanLog" ADD CONSTRAINT "WorkoutPlanLog_planId_fkey" FOREIGN KEY ("planId") REFERENCES "WorkoutPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
