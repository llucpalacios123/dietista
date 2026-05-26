import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { setupTestDB, teardownTestDB, cleanDatabase } from "../test-db";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/lib/auth";

// We import seedExampleMealPlan from the standalone lib
// (This will fail at import time — RED — because it doesn't exist yet)
import { seedExampleMealPlan } from "@/lib/seed-meal-plan";

let prisma: PrismaClient;

beforeAll(async () => {
  const db = await setupTestDB();
  prisma = db.prisma;
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await cleanDatabase(prisma);
});

async function createTestUser(): Promise<{ id: string }> {
  return prisma.user.create({
    data: {
      email: `seed-test-${Date.now()}@example.com`,
      passwordHash: await hashPassword("Password1"),
    },
  });
}

describe("seedExampleMealPlan", () => {
  it("creates a meal plan with 28 meals (7 days × 4 meal types)", async () => {
    const user = await createTestUser();

    const result = await seedExampleMealPlan(user.id);

    // Result shape
    expect(result).toHaveProperty("mealPlanId");
    expect(result).toHaveProperty("mealCount");
    expect(result.mealCount).toBe(28);

    // Fetch the plan from DB
    const plans = await prisma.mealPlan.findMany({
      where: { userId: user.id },
      include: { meals: { orderBy: [{ dayOfWeek: "asc" }, { mealType: "asc" }] } },
    });

    // Should be exactly one plan (old ones deleted)
    expect(plans).toHaveLength(1);
    const plan = plans[0];

    // Plan metadata
    expect(plan.status).toBe("active");
    expect(plan.meals).toHaveLength(28);

    // Verify meal distribution: 4 meals per day for 7 days
    for (let day = 0; day < 7; day++) {
      const dayMeals = plan.meals.filter((m) => m.dayOfWeek === day);
      expect(dayMeals).toHaveLength(4);

      const types = dayMeals.map((m) => m.mealType).sort();
      expect(types).toEqual(["breakfast", "dinner", "lunch", "mid_morning"]);
    }

    // Verify every meal has non-empty ingredients (Task 4.2)
    for (const meal of plan.meals) {
      const ingredients = meal.ingredients as Array<{
        name: string;
        quantity?: number;
        unit?: string;
      }>;
      expect(ingredients.length).toBeGreaterThan(0);
      expect(ingredients[0].name).toBeTruthy();
    }

    // Verify most meals have instructions
    const mealsWithInstructions = plan.meals.filter((m) => m.instructions);
    expect(mealsWithInstructions.length).toBeGreaterThan(14); // at least half
  });

  it("has realistic ingredient quantities (grams, units, ml)", async () => {
    const user = await createTestUser();
    await seedExampleMealPlan(user.id);

    const plans = await prisma.mealPlan.findMany({
      where: { userId: user.id },
      include: { meals: true },
    });
    const plan = plans[0];

    // Check the first breakfast — should have ingredient with quantity
    const mondayBreakfast = plan.meals.find(
      (m) => m.dayOfWeek === 0 && m.mealType === "breakfast"
    );
    expect(mondayBreakfast).toBeDefined();

    const ingredients = mondayBreakfast!.ingredients as Array<{
      name: string;
      quantity?: number;
      unit?: string;
    }>;

    // At least one ingredient with quantity and unit
    const quantified = ingredients.filter((i) => i.quantity && i.unit);
    expect(quantified.length).toBeGreaterThan(0);
    expect(quantified[0].name).toBeTruthy();
    expect(typeof quantified[0].quantity).toBe("number");
    expect(typeof quantified[0].unit).toBe("string");
  });

  it("deletes existing plans for the user before seeding", async () => {
    const user = await createTestUser();

    // Create a pre-existing plan with a meal
    const existingPlan = await prisma.mealPlan.create({
      data: {
        userId: user.id,
        startDate: new Date("2026-05-18"),
        endDate: new Date("2026-05-24"),
        status: "draft",
        meals: {
          create: {
            dayOfWeek: 0,
            mealType: "breakfast",
            name: "Old plan meal",
            description: "Should be deleted",
            calories: 300,
            protein: 15,
            carbs: 40,
            fat: 10,
          },
        },
      },
    });

    // Seed the example plan
    const result = await seedExampleMealPlan(user.id);

    // Old plan should be deleted
    const oldPlan = await prisma.mealPlan.findUnique({
      where: { id: existingPlan.id },
    });
    expect(oldPlan).toBeNull();

    // New plan should exist
    const newPlan = await prisma.mealPlan.findUnique({
      where: { id: result.mealPlanId },
    });
    expect(newPlan).not.toBeNull();
    expect(newPlan!.status).toBe("active");

    // Only one plan total
    const allPlans = await prisma.mealPlan.findMany({
      where: { userId: user.id },
    });
    expect(allPlans).toHaveLength(1);
  });

  it("works even when user has no profile", async () => {
    const user = await createTestUser();

    // Verify no profile exists
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });
    expect(profile).toBeNull();

    // Should not throw
    const result = await seedExampleMealPlan(user.id);
    expect(result.mealCount).toBe(28);
  });
});
