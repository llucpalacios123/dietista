-- AlterTable
ALTER TABLE "Meal" ADD COLUMN     "ingredients" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "instructions" TEXT;
