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

vi.mock("@/lib/llm-router", () => ({
  selectModel: vi.fn().mockReturnValue("gpt-5-nano"),
}));

import { prisma } from "@/lib/prisma";
import { generateDiet } from "@/lib/openai";
import { selectModel } from "@/lib/llm-router";
import { generateMealPlan } from "@/lib/diet-service";
import type { NutritionistPreferencesSchema } from "@/lib/schemas";

const mockPrisma = vi.mocked(prisma);
const mockGenerateDiet = vi.mocked(generateDiet);
const mockSelectModel = vi.mocked(selectModel);

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

const fakeMealPlan = {
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
  aiModel: null,
  wasRegenerated: false,
  generationDurationMs: null,
};

function setupCreateTransaction() {
  mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma));
  mockPrisma.mealPlan.findFirst.mockResolvedValue(null); // no existing draft
  mockPrisma.mealPlan.create.mockResolvedValue(fakeMealPlan as any);
  mockPrisma.meal.createMany.mockResolvedValue({ count: 1 });
}

function setupUpdateTransaction() {
  const existingPlan = { ...fakeMealPlan, id: "plan-existing" };
  mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma));
  mockPrisma.mealPlan.findFirst.mockResolvedValue(existingPlan as any); // draft exists
  mockPrisma.mealPlan.update.mockResolvedValue({ ...existingPlan, wasRegenerated: true } as any);
  mockPrisma.meal.deleteMany.mockResolvedValue({ count: 1 });
  mockPrisma.meal.createMany.mockResolvedValue({ count: 1 });
}

// ─── Router integration tests ─────────────────────────────────────────────────

describe("generateMealPlan — router integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateDiet.mockResolvedValue(fakeMeals);
    mockPrisma.profile.findUnique.mockResolvedValue(baseProfile);
    mockSelectModel.mockReturnValue("gpt-5-nano");
    setupCreateTransaction();
  });

  it("calls selectModel when no explicit model override", async () => {
    await generateMealPlan("user-1");

    expect(mockSelectModel).toHaveBeenCalledWith(
      expect.objectContaining({ feature: "diet" })
    );
    expect(mockGenerateDiet).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gpt-5-nano" })
    );
  });

  it("uses override model when preferences.model is set, does NOT use router result as primary", async () => {
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
});

// ─── Feedback tracking tests: wasRegenerated ──────────────────────────────────

describe("generateMealPlan — wasRegenerated tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateDiet.mockResolvedValue(fakeMeals);
    mockPrisma.profile.findUnique.mockResolvedValue(baseProfile);
    mockSelectModel.mockReturnValue("gpt-5-nano");
  });

  it("create branch: mealPlan.create receives wasRegenerated=false when no prior draft exists", async () => {
    setupCreateTransaction();

    await generateMealPlan("user-1");

    const createCall = mockPrisma.mealPlan.create.mock.calls[0][0];
    expect(createCall.data.wasRegenerated).toBe(false);
  });

  it("update branch (existing draft): mealPlan.update receives wasRegenerated=true", async () => {
    setupUpdateTransaction();

    await generateMealPlan("user-1");

    const updateCall = mockPrisma.mealPlan.update.mock.calls[0][0];
    expect(updateCall.data.wasRegenerated).toBe(true);
  });
});

// ─── Feedback tracking tests: generationDurationMs ───────────────────────────

describe("generateMealPlan — generationDurationMs tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateDiet.mockResolvedValue(fakeMeals);
    mockPrisma.profile.findUnique.mockResolvedValue(baseProfile);
    mockSelectModel.mockReturnValue("gpt-5-nano");
  });

  it("create branch: mealPlan.create receives a non-negative generationDurationMs", async () => {
    setupCreateTransaction();

    await generateMealPlan("user-1");

    const createCall = mockPrisma.mealPlan.create.mock.calls[0][0];
    expect(typeof createCall.data.generationDurationMs).toBe("number");
    expect(createCall.data.generationDurationMs).toBeGreaterThanOrEqual(0);
  });

  it("update branch (existing draft): mealPlan.update receives a non-negative generationDurationMs", async () => {
    setupUpdateTransaction();

    await generateMealPlan("user-1");

    const updateCall = mockPrisma.mealPlan.update.mock.calls[0][0];
    expect(typeof updateCall.data.generationDurationMs).toBe("number");
    expect(updateCall.data.generationDurationMs).toBeGreaterThanOrEqual(0);
  });
});
