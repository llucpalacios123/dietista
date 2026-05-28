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

import { prisma } from "@/lib/prisma";
import { generateDiet } from "@/lib/openai";
import { generateMealPlan } from "@/lib/diet-service";
import type { NutritionistPreferencesSchema } from "@/lib/schemas";

const mockPrisma = vi.mocked(prisma);
const mockGenerateDiet = vi.mocked(generateDiet);

// ─── Helpers ─────────────────────────────────────────────────────────────

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
  allergies: ["lactose"],
  forbiddenFoods: ["pork"],
  dietType: "omnivore" as const,
  cookingTimeAvailable: 30,
  eatingOutFrequency: "rarely" as const,
  includeSnacks: true,
  mealComplexity: "moderate" as const,
  mealsPerDay: 3,
  varietyPreference: "medium" as const,
  budgetFriendly: false,
  weeklyBudget: null,
  trainingRoutine: null,
  favoriteFoods: ["chicken"],
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
  // $transaction callback executor
  mockPrisma.$transaction.mockImplementation(async (cb: any) => {
    return cb(mockPrisma);
  });
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
    // preference fields
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

// ─── Coalescence tests ────────────────────────────────────────────────────

describe("generateMealPlan — preference coalescence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateDiet.mockResolvedValue(fakeMeals);
    setupTransaction();
  });

  it("uses profile values when no preferences are passed", async () => {
    mockPrisma.profile.findUnique.mockResolvedValue(baseProfile);

    await generateMealPlan("user-1");

    expect(mockGenerateDiet).toHaveBeenCalledWith(
      expect.objectContaining({
        allergies: ["lactose"],
        forbiddenFoods: ["pork"],
        dietType: "omnivore",
        mealsPerDay: 3,
      })
    );
  });

  it("uses plan preference values when provided — scalar override", async () => {
    mockPrisma.profile.findUnique.mockResolvedValue(baseProfile);
    const preferences: NutritionistPreferencesSchema = {
      allergies: [],
      dislikedFoods: [],
      dietType: "vegan",
      budgetFriendly: false,
      weeklyBudget: null,
      mealComplexity: null,
      mealsPerDay: 5,
      includeSnacks: false,
      varietyPreference: null,
      favoriteFoods: [],
      eatingOutFrequency: null,
      cookingTimeAvailable: null,
    };

    await generateMealPlan("user-1", preferences);

    expect(mockGenerateDiet).toHaveBeenCalledWith(
      expect.objectContaining({
        dietType: "vegan",
        mealsPerDay: 5,
      })
    );
  });

  it("falls back to profile when plan field is null — scalar fallback", async () => {
    mockPrisma.profile.findUnique.mockResolvedValue(baseProfile);
    const preferences: NutritionistPreferencesSchema = {
      allergies: [],
      dislikedFoods: [],
      dietType: null, // explicit null → fall back to profile
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
      expect.objectContaining({
        dietType: "omnivore", // from profile
      })
    );
  });

  it("plan allergies array overrides profile when non-empty — array override", async () => {
    mockPrisma.profile.findUnique.mockResolvedValue(baseProfile);
    const preferences: NutritionistPreferencesSchema = {
      allergies: ["nuts", "gluten"],
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
      expect.objectContaining({
        allergies: ["nuts", "gluten"],
      })
    );
  });

  it("falls back to profile allergies when plan array is empty — array fallback", async () => {
    mockPrisma.profile.findUnique.mockResolvedValue(baseProfile);
    const preferences: NutritionistPreferencesSchema = {
      allergies: [], // empty → fall back to profile
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
      expect.objectContaining({
        allergies: ["lactose"], // from profile
      })
    );
  });
});

// ─── Persistence tests ─────────────────────────────────────────────────────

describe("generateMealPlan — preference persistence in mealPlan.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateDiet.mockResolvedValue(fakeMeals);
    setupTransaction();
  });

  it("persists all 12 preference fields when preferences are passed", async () => {
    mockPrisma.profile.findUnique.mockResolvedValue(baseProfile);
    const preferences: NutritionistPreferencesSchema = {
      allergies: ["nuts"],
      dislikedFoods: ["beef"],
      dietType: "vegetarian",
      budgetFriendly: true,
      weeklyBudget: 100,
      mealComplexity: "simple",
      mealsPerDay: 4,
      includeSnacks: true,
      varietyPreference: "high",
      favoriteFoods: ["pasta"],
      eatingOutFrequency: "never",
      cookingTimeAvailable: 20,
    };

    await generateMealPlan("user-1", preferences);

    const createCall = mockPrisma.mealPlan.create.mock.calls[0][0];
    expect(createCall.data.dietType).toBe("vegetarian");
    expect(createCall.data.allergies).toEqual(["nuts"]);
    // dislikedFoods → forbiddenFoods mapping
    expect(createCall.data.forbiddenFoods).toEqual(["beef"]);
    expect(createCall.data.mealComplexity).toBe("simple");
    expect(createCall.data.mealsPerDay).toBe(4);
    expect(createCall.data.includeSnacks).toBe(true);
    expect(createCall.data.varietyPreference).toBe("high");
    expect(createCall.data.favoriteFoods).toEqual(["pasta"]);
    expect(createCall.data.budgetFriendly).toBe(true);
    expect(createCall.data.weeklyBudget).toBe(100);
    expect(createCall.data.eatingOutFrequency).toBe("never");
    expect(createCall.data.cookingTimeAvailable).toBe(20);
  });

  it("persists null preference fields when no preferences are passed", async () => {
    mockPrisma.profile.findUnique.mockResolvedValue(baseProfile);

    await generateMealPlan("user-1");

    const createCall = mockPrisma.mealPlan.create.mock.calls[0][0];
    expect(createCall.data.dietType).toBeNull();
    expect(createCall.data.mealComplexity).toBeNull();
    expect(createCall.data.mealsPerDay).toBeNull();
  });
});
