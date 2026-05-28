-- AlterTable
ALTER TABLE "FoodOption" ADD COLUMN     "translations" JSONB;

-- AlterTable
ALTER TABLE "Meal" ADD COLUMN     "translations" JSONB;

-- AlterTable
ALTER TABLE "MealPlanTemplate" ADD COLUMN     "translations" JSONB;

-- AlterTable
ALTER TABLE "MealTemplate" ADD COLUMN     "translations" JSONB;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'es';

-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "translations" JSONB;
