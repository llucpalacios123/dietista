import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ─────────────────────────────────────────────────────────────────

vi.mock("@/lib/prisma", () => ({
  prisma: {
    nutritionPlan: {
      findUnique: vi.fn(),
    },
    mealPlan: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    meal: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/openai", () => ({
  generateDietFromPlanAI: vi.fn(),
}));

// ─── Imports (after mocks) ──────────────────────────────────────────────────

import { prisma } from "@/lib/prisma";
import { generateDietFromPlanAI } from "@/lib/openai";
import { generateDietFromNutritionPlan } from "@/lib/diet-service";

// ─── Fixtures ──────────────────────────────────────────────────────────────

const fakeMealDistribution = {
  breakfast: { calories: 500, protein: 30, carbs: 60, fat: 15 },
  lunch: { calories: 700, protein: 50, carbs: 80, fat: 22 },
  dinner: { calories: 600, protein: 45, carbs: 60, fat: 20 },
  snack: { calories: 200, protein: 15, carbs: 20, fat: 5 },
};

const fakeRecommendedFoods = {
  proteins: ["pollo", "atún"],
  carbohydrates: ["arroz", "avena"],
  vegetables: ["espinacas"],
  fruits: ["manzana"],
  healthyFats: ["aguacate"],
};

const fakeWeeklyFrequency = {
  fishMeals: 3,
  legumeMeals: 2,
  redMeatMeals: 1,
};

const fakeNutritionPlan = {
  id: "np-123",
  userId: "user-1",
  dailyTargets: { calories: 2000, protein: 140, carbs: 220, fat: 62 },
  mealDistribution: fakeMealDistribution,
  recommendedFoods: fakeRecommendedFoods,
  weeklyFrequency: fakeWeeklyFrequency,
  goal: "maintain",
  activityLevel: "moderate",
  allergies: ["lactosa"],
  forbiddenFoods: ["cerdo"],
  aiModel: "gpt-5-mini",
  generationDurationMs: 1000,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const fakeMeals = [
  {
    dayOfWeek: 0,
    mealType: "breakfast" as const,
    name: "Tostadas con aguacate",
    description: "Tostadas integrales con aguacate",
    calories: 450,
    protein: 15,
    carbs: 55,
    fat: 18,
    ingredients: [{ name: "pan integral", quantity: 80, unit: "g" }],
    instructions: "Tostar el pan y añadir aguacate.",
  },
];

// ─── Tests ─────────────────────────────────────────────────────────────────

describe("generateDietFromNutritionPlan", () => {
  const mockNPFindUnique = vi.mocked(prisma.nutritionPlan.findUnique);
  const mockMPFindFirst = vi.mocked(prisma.mealPlan.findFirst);
  const mockMPCreate = vi.mocked(prisma.mealPlan.create);
  const mockMealCreateMany = vi.mocked(prisma.meal.createMany);
  const mockTransaction = vi.mocked(prisma.$transaction);
  const mockGenerateDietFromPlan = vi.mocked(generateDietFromPlanAI);

  function setupTransaction() {
    mockTransaction.mockImplementation(async (cb: Parameters<typeof mockTransaction>[0]) => {
      return (cb as (tx: typeof prisma) => Promise<unknown>)(prisma);
    });
    mockMPFindFirst.mockResolvedValue(null);
    mockMPCreate.mockResolvedValue({
      id: "meal-plan-456",
      userId: "user-1",
      startDate: new Date(),
      endDate: new Date(),
      status: "draft",
      totalCalories: 450,
      name: null,
      templateId: null,
      nutritionPlanId: "np-123",
      createdAt: new Date(),
      updatedAt: new Date(),
      dietType: null,
      allergies: [],
      forbiddenFoods: [],
      mealComplexity: null,
      cookingTimeAvailable: null,
      mealsPerDay: null,
      includeSnacks: null,
      varietyPreference: null,
      favoriteFoods: [],
      budgetFriendly: null,
      weeklyBudget: null,
      eatingOutFrequency: null,
      aiModel: "gpt-5-mini",
    } as unknown as Awaited<ReturnType<typeof mockMPCreate>>);
    mockMealCreateMany.mockResolvedValue({ count: 1 });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockNPFindUnique.mockResolvedValue(fakeNutritionPlan as unknown as Awaited<ReturnType<typeof mockNPFindUnique>>);
    mockGenerateDietFromPlan.mockResolvedValue(fakeMeals);
    setupTransaction();
  });

  describe("error cases", () => {
    it("throws when nutritionPlanId does not exist", async () => {
      mockNPFindUnique.mockResolvedValue(null);

      await expect(
        generateDietFromNutritionPlan("nonexistent-plan-id")
      ).rejects.toThrow();
    });
  });

  describe("AI call", () => {
    it("calls generateDietFromPlanAI with plan's mealDistribution, recommendedFoods, and weeklyFrequency", async () => {
      await generateDietFromNutritionPlan("np-123");

      expect(mockGenerateDietFromPlan).toHaveBeenCalledWith(
        expect.objectContaining({
          mealDistribution: fakeMealDistribution,
          recommendedFoods: fakeRecommendedFoods,
          weeklyFrequency: fakeWeeklyFrequency,
        })
      );
    });

    it("calls generateDietFromPlanAI with plan's allergies, forbiddenFoods, and goal", async () => {
      await generateDietFromNutritionPlan("np-123");

      expect(mockGenerateDietFromPlan).toHaveBeenCalledWith(
        expect.objectContaining({
          allergies: ["lactosa"],
          forbiddenFoods: ["cerdo"],
          goal: "maintain",
        })
      );
    });
  });

  describe("persistence", () => {
    it("creates a MealPlan with nutritionPlanId set", async () => {
      await generateDietFromNutritionPlan("np-123");

      expect(mockMPCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nutritionPlanId: "np-123",
          }),
        })
      );
    });

    it("creates Meal records via createMany", async () => {
      await generateDietFromNutritionPlan("np-123");

      expect(mockMealCreateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              dayOfWeek: 0,
              mealType: "breakfast",
              name: "Tostadas con aguacate",
            }),
          ]),
        })
      );
    });

    it("returns { mealPlanId, mealCount }", async () => {
      const result = await generateDietFromNutritionPlan("np-123");

      expect(result).toEqual({
        mealPlanId: "meal-plan-456",
        mealCount: 1,
      });
    });
  });

  describe("regression guard — generateMealPlan still works", () => {
    it("generateMealPlan is still exported from diet-service", async () => {
      const { generateMealPlan } = await import("@/lib/diet-service");
      expect(typeof generateMealPlan).toBe("function");
    });
  });
});
