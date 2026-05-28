import { prisma as appPrisma } from "@/lib/prisma";
import type { PrismaClient } from "@prisma/client";

/**
 * Use the application's singleton PrismaClient for integration tests.
 * This ensures tests and server code (route handlers, server actions)
 * share the SAME Prisma instance connected to the dev Docker database.
 */
export async function setupTestDB(): Promise<{
  prisma: PrismaClient;
  dbUrl: string;
}> {
  await appPrisma.$connect();
  return { prisma: appPrisma, dbUrl: process.env.DATABASE_URL! };
}

/**
 * Disconnect the Prisma client.
 */
export async function teardownTestDB(): Promise<void> {
  await appPrisma.$disconnect();
}

/**
 * Clean all data from the database between tests.
 * Deletes in reverse dependency order to avoid FK violations.
 */
export async function cleanDatabase(prisma: PrismaClient): Promise<void> {
  // Leaf records first (no outbound FKs to other tables in this list)
  await prisma.workoutSet.deleteMany();
  await prisma.workoutSession.deleteMany();
  await prisma.diaryEntry.deleteMany();
  await prisma.weightLog.deleteMany();
  await prisma.progressSnapshot.deleteMany();
  await prisma.shoppingItem.deleteMany();
  await prisma.shoppingList.deleteMany();  // has FK to MealPlan (no cascade)
  await prisma.meal.deleteMany();
  await prisma.mealLog.deleteMany();
  await prisma.mealPlan.deleteMany();
  await prisma.conversationState.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.foodOption.deleteMany();
  await prisma.mealTemplateGroup.deleteMany();
  await prisma.mealTemplate.deleteMany();
  await prisma.mealPlanTemplate.deleteMany();
  await prisma.food.deleteMany();
  await prisma.recipe.deleteMany();
}
