-- CreateEnum
CREATE TYPE "DietType" AS ENUM ('omnivore', 'vegetarian', 'vegan', 'pescatarian');

-- CreateEnum
CREATE TYPE "MealComplexity" AS ENUM ('simple', 'moderate', 'advanced');

-- CreateEnum
CREATE TYPE "VarietyLevel" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "ConversationStep" AS ENUM ('PROFILE_REVIEW', 'PROFILE_MODIFICATION', 'PREFERENCES_COLLECTION', 'GENERATION', 'REVIEW_MODIFICATION', 'CONFIRMATION');

-- CreateEnum
CREATE TYPE "EatingOutFrequency" AS ENUM ('never', 'rarely', 'sometimes', 'often');

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "budgetFriendly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cookingTimeAvailable" INTEGER,
ADD COLUMN     "dietType" "DietType",
ADD COLUMN     "eatingOutFrequency" "EatingOutFrequency",
ADD COLUMN     "favoriteFoods" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "includeSnacks" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mealComplexity" "MealComplexity",
ADD COLUMN     "mealsPerDay" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "trainingRoutine" TEXT,
ADD COLUMN     "varietyPreference" "VarietyLevel",
ADD COLUMN     "weeklyBudget" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "ConversationState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStep" "ConversationStep" NOT NULL DEFAULT 'PROFILE_REVIEW',
    "profileData" JSONB,
    "preferences" JSONB,
    "generatedPlan" JSONB,
    "modifications" JSONB,
    "validatedJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversationState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConversationState_userId_key" ON "ConversationState"("userId");

-- AddForeignKey
ALTER TABLE "ConversationState" ADD CONSTRAINT "ConversationState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
