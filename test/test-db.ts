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
  await prisma.meal.deleteMany();
  await prisma.mealPlan.deleteMany();
  await prisma.mealLog.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.food.deleteMany();
  await prisma.foodOption.deleteMany();
  await prisma.mealTemplateGroup.deleteMany();
  await prisma.mealTemplate.deleteMany();
  await prisma.mealPlanTemplate.deleteMany();
  await prisma.recipe.deleteMany();
}
