-- CreateEnum
CREATE TYPE "WorkoutGoal" AS ENUM ('strength', 'endurance', 'weight_loss', 'toning', 'hypertrophy');

-- CreateEnum
CREATE TYPE "FitnessLevel" AS ENUM ('beginner', 'intermediate', 'advanced');

-- CreateTable
CREATE TABLE "WorkoutPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "goal" "WorkoutGoal" NOT NULL,
    "level" "FitnessLevel" NOT NULL,
    "daysPerWeek" INTEGER NOT NULL,
    "status" "PlanStatus" NOT NULL DEFAULT 'draft',
    "content" JSONB NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkoutPlan_userId_status_idx" ON "WorkoutPlan"("userId", "status");

-- AddForeignKey
ALTER TABLE "WorkoutPlan" ADD CONSTRAINT "WorkoutPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
