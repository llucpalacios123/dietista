-- AlterTable: add nullable planned columns first
ALTER TABLE "WorkoutSet" ADD COLUMN "plannedReps" INTEGER,
ADD COLUMN "plannedWeightKg" DOUBLE PRECISION;

-- Backfill: copy existing reps into plannedReps BEFORE making reps nullable
UPDATE "WorkoutSet" SET "plannedReps" = reps;

-- Now it is safe to make reps nullable (existing rows already have plannedReps)
ALTER TABLE "WorkoutSet" ALTER COLUMN "reps" DROP NOT NULL;
