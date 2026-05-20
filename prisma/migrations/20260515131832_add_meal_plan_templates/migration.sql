-- CreateEnum
CREATE TYPE "FoodGroup" AS ENUM ('carbohydrates', 'protein', 'fat', 'other');

-- AlterEnum
ALTER TYPE "MealType" ADD VALUE 'mid_morning';

-- AlterTable
ALTER TABLE "Meal" ADD COLUMN     "selectedOptions" JSONB;

-- AlterTable
ALTER TABLE "MealPlan" ADD COLUMN     "templateId" TEXT;

-- CreateTable
CREATE TABLE "MealPlanTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "objective" TEXT,
    "guidelines" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealPlanTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealTemplate" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "mealType" "MealType" NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "MealTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealTemplateGroup" (
    "id" TEXT NOT NULL,
    "mealTemplateId" TEXT NOT NULL,
    "foodGroup" "FoodGroup" NOT NULL,

    CONSTRAINT "MealTemplateGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodOption" (
    "id" TEXT NOT NULL,
    "mealTemplateGroupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "notes" TEXT,
    "calories" DOUBLE PRECISION,
    "protein" DOUBLE PRECISION,
    "carbs" DOUBLE PRECISION,
    "fat" DOUBLE PRECISION,

    CONSTRAINT "FoodOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ingredients" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "steps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mealType" "MealType",

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "MealPlanTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealTemplate" ADD CONSTRAINT "MealTemplate_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "MealPlanTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealTemplateGroup" ADD CONSTRAINT "MealTemplateGroup_mealTemplateId_fkey" FOREIGN KEY ("mealTemplateId") REFERENCES "MealTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodOption" ADD CONSTRAINT "FoodOption_mealTemplateGroupId_fkey" FOREIGN KEY ("mealTemplateGroupId") REFERENCES "MealTemplateGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "MealPlanTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
