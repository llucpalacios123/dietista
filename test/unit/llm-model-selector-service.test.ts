import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before imports
vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: vi.fn(),
    },
    mealPlan: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    meal: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/openai", () => ({
  generateDiet: vi.fn(),
}));

vi.mock("@/lib/workout-plan-service", () => ({
  generateWorkoutPlan: vi.fn(),
}));

vi.mock("@/lib/openai", () => ({
  generateDiet: vi.fn(),
  generateWorkoutContent: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { generateDiet } from "@/lib/openai";
import { generateMealPlan } from "@/lib/diet-service";
import type { NutritionistPreferencesSchema } from "@/lib/schemas";

const mockPrisma = vi.mocked(prisma);
const mockGenerateDiet = vi.mocked(generateDiet);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const baseProfile = {
  id: "profile-1",
  userId: "user-1",
  weight: 70,
  height: 175,
  age: 30,
  sex: "male" as const,
  goal: "maintain" as const,
  activityLevel: "moderate" as const,
  targetCalories: 2000,
  targetProtein: 150,
  targetCarbs: 200,
  targetFat: 60,
  allergies: [],
  forbiddenFoods: [],
  dietType: "omnivore" as const,
  cookingTimeAvailable: 30,
  eatingOutFrequency: "rarely" as const,
  includeSnacks: false,
  mealComplexity: "moderate" as const,
  mealsPerDay: 3,
  varietyPreference: "medium" as const,
  budgetFriendly: false,
  weeklyBudget: null,
  trainingRoutine: null,
  favoriteFoods: [],
  locale: "es",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const fakeMeals = [
  {
    dayOfWeek: 0,
    mealType: "breakfast" as const,
    name: "Tostadas",
    description: "Tostadas con aceite",
    calories: 400,
    protein: 10,
    carbs: 50,
    fat: 15,
    ingredients: [],
    instructions: "Tostar el pan",
  },
];

function setupTransaction() {
  mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma));
  mockPrisma.mealPlan.findFirst.mockResolvedValue(null);
  mockPrisma.mealPlan.create.mockResolvedValue({
    id: "plan-1",
    userId: "user-1",
    startDate: new Date(),
    endDate: new Date(),
    status: "draft",
    totalCalories: 400,
    name: null,
    templateId: null,
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
  } as any);
  mockPrisma.meal.createMany.mockResolvedValue({ count: 1 });
}

// ─── Model forwarding tests ───────────────────────────────────────────────────

describe("generateMealPlan — model forwarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateDiet.mockResolvedValue(fakeMeals);
    mockPrisma.profile.findUnique.mockResolvedValue(baseProfile);
    setupTransaction();
  });

  it("forwards model=gpt-4o to generateDiet when preferences include it", async () => {
    const preferences: NutritionistPreferencesSchema = {
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
      model: "gpt-4o",
    };

    await generateMealPlan("user-1", preferences);

    expect(mockGenerateDiet).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gpt-4o" })
    );
  });

  it("falls back to gpt-4o-mini when preferences have no model field", async () => {
    const preferences: NutritionistPreferencesSchema = {
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
    };

    await generateMealPlan("user-1", preferences);

    expect(mockGenerateDiet).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gpt-4o-mini" })
    );
  });

  it("falls back to gpt-4o-mini when no preferences are passed at all", async () => {
    await generateMealPlan("user-1");

    expect(mockGenerateDiet).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gpt-4o-mini" })
    );
  });
});

// ─── Persistence guard — model must NOT be saved to DB ────────────────────────

describe("generateMealPlan — model NOT persisted to DB", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateDiet.mockResolvedValue(fakeMeals);
    mockPrisma.profile.findUnique.mockResolvedValue(baseProfile);
    setupTransaction();
  });

  it("does NOT include model in the MealPlan create data", async () => {
    const preferences: NutritionistPreferencesSchema = {
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
      model: "gpt-4o",
    };

    await generateMealPlan("user-1", preferences);

    const createCall = mockPrisma.mealPlan.create.mock.calls[0][0];
    expect(createCall.data).not.toHaveProperty("model");
  });
});
