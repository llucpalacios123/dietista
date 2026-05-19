import { PrismaClient } from "@prisma/client";

/**
 * Global setup: runs once before all E2E test suites.
 * - Verifies database connection via Prisma
 * - Cleans stale test users (e2e-*@test.com) from previous interrupted runs
 */
async function globalSetup(): Promise<void> {
  console.log("\n[Global Setup] Starting...");

  const prisma = new PrismaClient({
    log: ["error"],
  });

  try {
    await prisma.$connect();
    console.log("[Global Setup] Database connection verified.");
  } catch (error) {
    console.error("[Global Setup] Failed to connect to database:", error);
    throw new Error(
      "Database connection failed. Is PostgreSQL running? Check DATABASE_URL in .env.test"
    );
  }

  try {
    const result = await prisma.user.deleteMany({
      where: {
        email: { startsWith: "e2e-", endsWith: "@test.com" },
      },
    });
    console.log(
      `[Global Setup] Cleaned ${result.count} stale test user(s) from previous runs.`
    );
  } catch (error) {
    console.error("[Global Setup] Failed to clean stale test users:", error);
    // Non-fatal: tests can still run — teardown will catch leftovers
  }

  await prisma.$disconnect();
  console.log("[Global Setup] Complete.\n");
}

export default globalSetup;
