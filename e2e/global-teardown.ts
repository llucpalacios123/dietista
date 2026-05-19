import { PrismaClient } from "@prisma/client";

/**
 * Global teardown: runs once after ALL E2E test suites complete.
 * - Deletes every user matching e2e-*@test.com and their cascaded data.
 * - Ensures the database is left clean regardless of test failures.
 */
async function globalTeardown(): Promise<void> {
  console.log("\n[Global Teardown] Starting cleanup...");

  const prisma = new PrismaClient({
    log: ["error"],
  });

  try {
    await prisma.$connect();

    // Find all test users created during this run
    const testUsers = await prisma.user.findMany({
      where: {
        email: { startsWith: "e2e-", endsWith: "@test.com" },
      },
      select: { id: true, email: true },
    });

    if (testUsers.length === 0) {
      console.log("[Global Teardown] No test users to clean up.");
      await prisma.$disconnect();
      return;
    }

    const userIds = testUsers.map((u) => u.id);
    console.log(
      `[Global Teardown] Found ${testUsers.length} test user(s) to clean.`
    );

    // Delete meal-log entries (FK to user — not cascaded in schema)
    const deletedLogs = await prisma.mealLog.deleteMany({
      where: { userId: { in: userIds } },
    });
    console.log(`[Global Teardown] Removed ${deletedLogs.count} meal log(s).`);

    // Find meal plans owned by test users
    const mealPlans = await prisma.mealPlan.findMany({
      where: { userId: { in: userIds } },
      select: { id: true },
    });
    const mealPlanIds = mealPlans.map((mp) => mp.id);

    if (mealPlanIds.length > 0) {
      // Delete meals (FK to meal plan)
      await prisma.meal.deleteMany({
        where: { mealPlanId: { in: mealPlanIds } },
      });
    }

    const deletedPlans = await prisma.mealPlan.deleteMany({
      where: { userId: { in: userIds } },
    });
    console.log(
      `[Global Teardown] Removed ${deletedPlans.count} meal plan(s).`
    );

    // Delete profiles (FK to user — not cascaded)
    const deletedProfiles = await prisma.profile.deleteMany({
      where: { userId: { in: userIds } },
    });
    console.log(
      `[Global Teardown] Removed ${deletedProfiles.count} profile(s).`
    );

    // Finally, delete the users themselves
    const deletedUsers = await prisma.user.deleteMany({
      where: { id: { in: userIds } },
    });
    console.log(
      `[Global Teardown] Removed ${deletedUsers.count} user(s).`
    );

    console.log("[Global Teardown] Cleanup complete.");
  } catch (error) {
    console.error("[Global Teardown] Cleanup failed:", error);
    // Do NOT throw — let the suite finish even if cleanup fails
  } finally {
    await prisma.$disconnect();
    console.log("[Global Teardown] Database disconnected.\n");
  }
}

export default globalTeardown;
