-- AlterTable
ALTER TABLE "MealPlan" ADD COLUMN     "allergies" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "budgetFriendly" BOOLEAN,
ADD COLUMN     "cookingTimeAvailable" INTEGER,
ADD COLUMN     "dietType" "DietType",
ADD COLUMN     "eatingOutFrequency" "EatingOutFrequency",
ADD COLUMN     "favoriteFoods" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "forbiddenFoods" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "includeSnacks" BOOLEAN,
ADD COLUMN     "mealComplexity" "MealComplexity",
ADD COLUMN     "mealsPerDay" INTEGER,
ADD COLUMN     "varietyPreference" "VarietyLevel",
ADD COLUMN     "weeklyBudget" DOUBLE PRECISION;
