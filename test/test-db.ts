import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PrismaClient } from "@prisma/client";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

let globalContainer: StartedPostgreSqlContainer | undefined;
let globalPrisma: PrismaClient | undefined;
let globalDbUrl: string | undefined;

/**
 * Start a test PostgreSQL container and return a PrismaClient connected to it.
 * Uses a singleton pattern so all tests share the same container.
 */
export async function setupTestDB(): Promise<{
  prisma: PrismaClient;
  dbUrl: string;
}> {
  if (globalContainer && globalPrisma && globalDbUrl) {
    return { prisma: globalPrisma, dbUrl: globalDbUrl };
  }

  // Start PostgreSQL container
  const container = await new PostgreSqlContainer("postgres:16-alpine")
    .withDatabase("testdb")
    .withUsername("testuser")
    .withPassword("testpass")
    .start();

  globalContainer = container;
  globalDbUrl = container.getConnectionUri();

  // Create a temporary .env file for prisma to use
  const tempEnv = `DATABASE_URL="${globalDbUrl}"`;

  // Run prisma migrate to set up the schema
  await execAsync(`DATABASE_URL="${globalDbUrl}" npx prisma migrate deploy`, {
    cwd: path.resolve(__dirname, ".."),
  });

  globalPrisma = new PrismaClient({
    datasources: { db: { url: globalDbUrl } },
  });

  return { prisma: globalPrisma, dbUrl: globalDbUrl };
}

/**
 * Stop the test PostgreSQL container.
 */
export async function teardownTestDB(): Promise<void> {
  if (globalPrisma) {
    await globalPrisma.$disconnect();
    globalPrisma = undefined;
  }
  if (globalContainer) {
    await globalContainer.stop();
    globalContainer = undefined;
    globalDbUrl = undefined;
  }
}

/**
 * Clean all data from the database between tests.
 */
export async function cleanDatabase(prisma: PrismaClient): Promise<void> {
  // Delete in reverse dependency order
  await prisma.meal.deleteMany();
  await prisma.mealPlan.deleteMany();
  await prisma.mealLog.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.food.deleteMany();
}
