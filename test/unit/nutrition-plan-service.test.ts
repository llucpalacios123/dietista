import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ─────────────────────────────────────────────────────────────────

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: vi.fn(),
    },
    nutritionPlan: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/openai", () => ({
  generateNutritionPlanAI: vi.fn(),
}));

// ─── Imports (after mocks) ──────────────────────────────────────────────────

import { prisma } from "@/lib/prisma";
import { generateNutritionPlanAI } from "@/lib/openai";
import { generateNutritionPlanForUser } from "@/lib/nutrition-plan-service";

// ─── Fixtures ──────────────────────────────────────────────────────────────

const baseProfile = {
  id: "profile-1",
  userId: "user-1",
  weight: 75,
  height: 175,
  age: 30,
  sex: "male" as const,
  goal: "maintain" as const,
  activityLevel: "moderate" as const,
  targetCalories: null,
  targetProtein: null,
  targetCarbs: null,
  targetFat: null,
  allergies: ["lactosa"],
  forbiddenFoods: ["cerdo"],
  favoriteFoods: ["pollo", "arroz"],
  dietType: null,
  mealComplexity: null,
  mealsPerDay: 3,
  includeSnacks: false,
  varietyPreference: null,
  budgetFriendly: false,
  weeklyBudget: null,
  eatingOutFrequency: null,
  cookingTimeAvailable: null,
  trainingRoutine: null,
  locale: "es",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const cannedNutritionPlan = {
  dailyTargets: { calories: 2200, protein: 120, carbs: 250, fat: 70 },
  mealDistribution: {
    breakfast: { calories: 550, protein: 30, carbs: 65, fat: 18 },
    lunch: { calories: 770, protein: 42, carbs: 88, fat: 25 },
    dinner: { calories: 660, protein: 35, carbs: 75, fat: 20 },
    snack: { calories: 220, protein: 13, carbs: 22, fat: 7 },
  },
  recommendedFoods: {
    proteins: ["pollo", "atún", "huevos"],
    carbohydrates: ["arroz", "avena", "pan integral"],
    vegetables: ["espinacas", "brócoli"],
    fruits: ["manzana", "plátano"],
    healthyFats: ["aguacate", "aceite de oliva"],
  },
  weeklyFrequency: { fishMeals: 3, legumeMeals: 2, redMeatMeals: 1 },
};

const createdPlan = {
  id: "plan-123",
  userId: "user-1",
  ...cannedNutritionPlan,
  goal: "maintain",
  activityLevel: "moderate",
  allergies: ["lactosa"],
  forbiddenFoods: ["cerdo"],
  aiModel: "gpt-5-mini",
  generationDurationMs: 1200,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ─── Tests ─────────────────────────────────────────────────────────────────

describe("generateNutritionPlanForUser", () => {
  const mockProfile = vi.mocked(prisma.profile.findUnique);
  const mockCreate = vi.mocked(prisma.nutritionPlan.create);
  const mockGenerate = vi.mocked(generateNutritionPlanAI);

  beforeEach(() => {
    vi.clearAllMocks();
    mockProfile.mockResolvedValue(baseProfile as Parameters<typeof mockProfile>[0] extends { where: infer W } ? never : never);
    mockGenerate.mockResolvedValue(cannedNutritionPlan);
    mockCreate.mockResolvedValue(createdPlan as unknown as Awaited<ReturnType<typeof mockCreate>>);
  });

  describe("error cases", () => {
    it("throws when user has no profile", async () => {
      mockProfile.mockResolvedValue(null);

      await expect(
        generateNutritionPlanForUser("user-no-profile")
      ).rejects.toThrow("No tienes perfil");
    });
  });

  describe("AI call", () => {
    beforeEach(() => {
      // @ts-expect-error — mock doesn't care about exact Prisma shape
      mockProfile.mockResolvedValue(baseProfile);
    });

    it("calls generateNutritionPlanAI with calculated targets and coalesced preferences", async () => {
      await generateNutritionPlanForUser("user-1");

      expect(mockGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          targetCalories: expect.any(Number),
          targetProtein: expect.any(Number),
          targetCarbs: expect.any(Number),
          targetFat: expect.any(Number),
          goal: "maintain",
          activityLevel: "moderate",
          allergies: ["lactosa"],
          forbiddenFoods: ["cerdo"],
          mealsPerDay: 3,
        })
      );
    });

    it("overrides allergies when preferences supply a non-empty array", async () => {
      await generateNutritionPlanForUser("user-1", {
        allergies: ["gluten"],
        dislikedFoods: [],
        dietType: null,
        budgetFriendly: false,
        weeklyBudget: null,
        mealComplexity: null,
        mealsPerDay: 3,
        includeSnacks: false,
        varietyPreference: null,
        favoriteFoods: [],
        eatingOutFrequency: null,
        cookingTimeAvailable: null,
        model: "gpt-5-mini",
      });

      expect(mockGenerate).toHaveBeenCalledWith(
        expect.objectContaining({ allergies: ["gluten"] })
      );
    });

    it("falls back to profile allergies when preferences.allergies is empty", async () => {
      await generateNutritionPlanForUser("user-1", {
        allergies: [],
        dislikedFoods: [],
        dietType: null,
        budgetFriendly: false,
        weeklyBudget: null,
        mealComplexity: null,
        mealsPerDay: 3,
        includeSnacks: false,
        varietyPreference: null,
        favoriteFoods: [],
        eatingOutFrequency: null,
        cookingTimeAvailable: null,
        model: "gpt-5-mini",
      });

      expect(mockGenerate).toHaveBeenCalledWith(
        expect.objectContaining({ allergies: ["lactosa"] })
      );
    });
  });

  describe("persistence", () => {
    beforeEach(() => {
      // @ts-expect-error — mock shape
      mockProfile.mockResolvedValue(baseProfile);
    });

    it("persists the plan via prisma.nutritionPlan.create with required fields", async () => {
      await generateNutritionPlanForUser("user-1");

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "user-1",
            dailyTargets: expect.any(Object),
            mealDistribution: expect.any(Object),
            recommendedFoods: expect.any(Object),
            weeklyFrequency: expect.any(Object),
            goal: "maintain",
            activityLevel: "moderate",
            allergies: expect.any(Array),
            forbiddenFoods: expect.any(Array),
            aiModel: expect.any(String),
            generationDurationMs: expect.any(Number),
          }),
        })
      );
    });

    it("returns the persisted NutritionPlan", async () => {
      const result = await generateNutritionPlanForUser("user-1");
      expect(result).toEqual(createdPlan);
    });
  });
});
