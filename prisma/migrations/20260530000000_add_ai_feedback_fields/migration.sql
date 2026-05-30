-- AlterTable MealPlan: add wasRegenerated and generationDurationMs
ALTER TABLE "MealPlan" ADD COLUMN "wasRegenerated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MealPlan" ADD COLUMN "generationDurationMs" INTEGER;

-- AlterTable WorkoutPlan: add wasRegenerated and generationDurationMs
ALTER TABLE "WorkoutPlan" ADD COLUMN "wasRegenerated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WorkoutPlan" ADD COLUMN "generationDurationMs" INTEGER;
