import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { setupTestDB, teardownTestDB, cleanDatabase } from "../test-db";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/lib/auth";
import {
  validateSpringBootOutput,
  buildAndValidateSpringBootOutput,
  parseAIGeneratedPlan,
} from "@/lib/meal-plan-json";
import {
  estimateWeeklyCost,
  validateBudget,
  buildEconomicPrompt,
  checkMacroCoherence,
} from "@/lib/economic-meals";
import type { UserProfileSchema, NutritionistPreferencesSchema } from "@/lib/schemas";
import type { InternalMealPlan } from "@/types/meal-plan";

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

// ─── Helpers ─────────────────────────────────────────────────────────────

async function createTestUser(email = "wizard-test@example.com") {
  return prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword("Password1"),
    },
  });
}

async function createTestProfile(userId: string, overrides?: Record<string, unknown>) {
  return prisma.profile.create({
    data: {
      userId,
      weight: 70,
      height: 175,
      age: 30,
      sex: "male",
      goal: "lose",
      activityLevel: "moderate",
      allergies: ["nuts"],
      forbiddenFoods: ["liver"],
      ...overrides,
    },
  });
}

// ─── Conversation State CRUD ──────────────────────────────────────────────

describe("ConversationState CRUD", () => {
  it("creates a new conversation state", async () => {
    const user = await createTestUser();

    const state = await prisma.conversationState.create({
      data: {
        userId: user.id,
        currentStep: "PROFILE_REVIEW",
      },
    });

    expect(state.id).toBeDefined();
    expect(state.currentStep).toBe("PROFILE_REVIEW");
    expect(state.profileData).toBeNull();
    expect(state.preferences).toBeNull();
  });

  it("upserts conversation state", async () => {
    const user = await createTestUser();

    // Create
    await prisma.conversationState.upsert({
      where: { userId: user.id },
      create: { userId: user.id, currentStep: "PROFILE_REVIEW" },
      update: { currentStep: "PROFILE_REVIEW" },
    });

    // Update via upsert
    await prisma.conversationState.upsert({
      where: { userId: user.id },
      create: { userId: user.id, currentStep: "PREFERENCES_COLLECTION" },
      update: { currentStep: "PREFERENCES_COLLECTION" },
    });

    const state = await prisma.conversationState.findUnique({
      where: { userId: user.id },
    });
    expect(state).not.toBeNull();
    expect(state!.currentStep).toBe("PREFERENCES_COLLECTION");
  });

  it("stores and retrieves JSON fields (profileData, preferences, generatedPlan)", async () => {
    const user = await createTestUser();

    const profileData = {
      weight: 70,
      height: 175,
      age: 30,
      sex: "male",
      goal: "lose",
      activityLevel: "moderate",
    };

    const preferences = {
      allergies: ["peanuts"],
      dislikedFoods: ["fish"],
      budgetFriendly: true,
      weeklyBudget: 50,
      mealsPerDay: 4,
    };

    const generatedPlan = {
      days: [
        {
          dayOfWeek: 0,
          meals: [
            {
              mealType: "breakfast",
              name: "Oatmeal",
              description: "Steel-cut oats",
              calories: 350,
              protein: 15,
              carbs: 55,
              fat: 8,
              ingredients: ["oats", "milk"],
              instructions: "Cook oats",
            },
          ],
          dailyTotals: { calories: 350, protein: 15, carbs: 55, fat: 8 },
        },
      ],
      weeklyTotals: { calories: 350, protein: 15, carbs: 55, fat: 8 },
    };

    await prisma.conversationState.create({
      data: {
        userId: user.id,
        currentStep: "REVIEW_MODIFICATION",
        profileData,
        preferences,
        generatedPlan,
      },
    });

    const state = await prisma.conversationState.findUnique({
      where: { userId: user.id },
    });

    expect(state).not.toBeNull();
    expect(state!.currentStep).toBe("REVIEW_MODIFICATION");
    expect(state!.profileData).toEqual(profileData);
    expect(state!.preferences).toEqual(preferences);
    expect(state!.generatedPlan).toEqual(generatedPlan);
  });

  it("maintains unique constraint per user (1:1)", async () => {
    const user = await createTestUser();

    await prisma.conversationState.create({
      data: { userId: user.id, currentStep: "PROFILE_REVIEW" },
    });

    await expect(
      prisma.conversationState.create({
        data: { userId: user.id, currentStep: "PROFILE_REVIEW" },
      }),
    ).rejects.toThrow();
  });

  it("cascades delete when user is deleted", async () => {
    const user = await createTestUser();

    await prisma.conversationState.create({
      data: { userId: user.id, currentStep: "PROFILE_REVIEW" },
    });

    await prisma.user.delete({ where: { id: user.id } });

    const state = await prisma.conversationState.findUnique({
      where: { userId: user.id },
    });
    expect(state).toBeNull();
  });
});

// ─── Profile Extension Fields ─────────────────────────────────────────────

describe("Profile Extension Fields", () => {
  it("creates profile with all new extension fields", async () => {
    const user = await createTestUser();

    const profile = await createTestProfile(user.id, {
      trainingRoutine: "3x/week strength training",
      dietType: "omnivore",
      budgetFriendly: true,
      weeklyBudget: 60,
      mealComplexity: "simple",
      mealsPerDay: 4,
      includeSnacks: true,
      varietyPreference: "high",
      favoriteFoods: ["pasta", "steak"],
      eatingOutFrequency: "rarely",
      cookingTimeAvailable: 45,
    });

    expect(profile.trainingRoutine).toBe("3x/week strength training");
    expect(profile.dietType).toBe("omnivore");
    expect(profile.budgetFriendly).toBe(true);
    expect(profile.weeklyBudget).toBe(60);
    expect(profile.mealComplexity).toBe("simple");
    expect(profile.mealsPerDay).toBe(4);
    expect(profile.includeSnacks).toBe(true);
    expect(profile.varietyPreference).toBe("high");
    expect(profile.favoriteFoods).toEqual(["pasta", "steak"]);
    expect(profile.eatingOutFrequency).toBe("rarely");
    expect(profile.cookingTimeAvailable).toBe(45);
  });

  it("defaults new fields for existing profiles", async () => {
    const user = await createTestUser();

    // Create profile with only required fields (mimicking old profile)
    const profile = await createTestProfile(user.id);

    expect(profile.trainingRoutine).toBeNull();
    expect(profile.dietType).toBeNull();
    expect(profile.budgetFriendly).toBe(false);
    expect(profile.weeklyBudget).toBeNull();
    expect(profile.mealComplexity).toBeNull();
    expect(profile.mealsPerDay).toBe(3);
    expect(profile.includeSnacks).toBe(false);
    expect(profile.varietyPreference).toBeNull();
    expect(profile.favoriteFoods).toEqual([]);
    expect(profile.eatingOutFrequency).toBeNull();
    expect(profile.cookingTimeAvailable).toBeNull();
  });

  it("updates extension fields", async () => {
    const user = await createTestUser();
    await createTestProfile(user.id);

    await prisma.profile.update({
      where: { userId: user.id },
      data: {
        trainingRoutine: "yoga daily",
        budgetFriendly: true,
        mealsPerDay: 5,
      },
    });

    const updated = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    expect(updated!.trainingRoutine).toBe("yoga daily");
    expect(updated!.budgetFriendly).toBe(true);
    expect(updated!.mealsPerDay).toBe(5);
    // Unchanged fields
    expect(updated!.goal).toBe("lose");
  });
});

// ─── JSON Validation Pipeline ─────────────────────────────────────────────

describe("JSON Validation Pipeline", () => {
  const mockProfile: UserProfileSchema = {
    weight: 70,
    height: 175,
    age: 30,
    sex: "male",
    goal: "lose",
    activityLevel: "moderate",
    targetCalories: null,
    targetProtein: null,
    targetCarbs: null,
    targetFat: null,
    trainingRoutine: null,
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
    allergies: [],
    forbiddenFoods: [],
  };

  const mockPreferences: NutritionistPreferencesSchema = {
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

  const mockPlan: InternalMealPlan = {
    days: [
      {
        dayOfWeek: 0,
        meals: [
          {
            id: "m1",
            dayOfWeek: 0,
            mealType: "breakfast",
            name: "Oatmeal",
            description: "Steel-cut oats",
            calories: 350,
            protein: 15,
            carbs: 55,
            fat: 8,
            ingredients: [{ name: "oats" }, { name: "milk" }, { name: "berries" }],
            instructions: "Cook oats, top with berries.",
          },
          {
            id: "m2",
            dayOfWeek: 0,
            mealType: "lunch",
            name: "Chicken Salad",
            description: "Grilled chicken on greens",
            calories: 450,
            protein: 42,
            carbs: 20,
            fat: 22,
            ingredients: [{ name: "chicken breast" }, { name: "lettuce" }, { name: "tomato" }, { name: "olive oil" }],
            instructions: "Grill chicken, toss with greens.",
          },
          {
            id: "m3",
            dayOfWeek: 0,
            mealType: "dinner",
            name: "Salmon & Vegetables",
            description: "Baked salmon with roasted veggies",
            calories: 500,
            protein: 38,
            carbs: 30,
            fat: 25,
            ingredients: [{ name: "salmon" }, { name: "broccoli" }, { name: "sweet potato" }, { name: "olive oil" }],
            instructions: "Bake salmon. Roast vegetables.",
          },
        ],
        dailyTotals: { calories: 1300, protein: 95, carbs: 105, fat: 55 },
      },
    ],
    weeklyTotals: { calories: 1300, protein: 95, carbs: 105, fat: 55 },
  };

  it("validates and produces correct Spring Boot JSON output", () => {
    const result = buildAndValidateSpringBootOutput({
      profile: mockProfile,
      preferences: mockPreferences,
      mealPlan: mockPlan,
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    if (result.data) {
      expect(result.data.userProfile.weight).toBe(70);
      expect(result.data.userProfile.height).toBe(175);
      expect(result.data.userProfile.age).toBe(30);
      expect(result.data.userProfile.sex).toBe("male");
      expect(result.data.userProfile.goal).toBe("lose");
      expect(result.data.weeklyPlan.days).toHaveLength(1);
      expect(result.data.weeklyPlan.days[0].meals).toHaveLength(3);
      expect(result.data.weeklyPlan.weeklyTotals.calories).toBe(1300);
    }
  });

  it("includes nullable fields with correct null values", () => {
    const result = buildAndValidateSpringBootOutput({
      profile: mockProfile,
      preferences: mockPreferences,
      mealPlan: mockPlan,
    });

    expect(result.success).toBe(true);
    if (result.data) {
      expect(result.data.userProfile.trainingRoutine).toBeNull();
      expect(result.data.userProfile.dietType).toBeNull();
      expect(result.data.userProfile.weeklyBudget).toBeNull();
      expect(result.data.preferences.maxCookingTime).toBeNull();
    }
  });
});

// ─── Economic Rules Pipeline ──────────────────────────────────────────────

describe("Economic Mode Pipeline", () => {
  it("generates economic prompt with correct rules", () => {
    const prompt = buildEconomicPrompt({
      budgetFriendly: true,
      budget: 50,
      mealComplexity: "simple",
    });

    expect(prompt).toContain("Economic Mode");
    expect(prompt).toContain("Budget Constraint");
    expect(prompt).toContain("$50");
    expect(prompt).toContain("Simple Meal Complexity");
  });

  it("estimates weekly cost within reason", () => {
    const day = {
      meals: [
        { ingredients: ["rice", "chicken thighs", "frozen broccoli"] },
        { ingredients: ["eggs", "whole wheat bread"] },
        { ingredients: ["lentils", "carrots", "onions"] },
      ],
    };
    const cost = estimateWeeklyCost(Array(7).fill(day));
    expect(cost).toBeGreaterThan(0);
  });

  it("validates budget correctly", () => {
    const withinBudget = validateBudget(45, 50);
    expect(withinBudget.withinBudget).toBe(true);

    const overBudget = validateBudget(55, 50);
    expect(overBudget.withinBudget).toBe(false);
  });

  it("detects macro coherence violations", () => {
    const original = { calories: 2000, protein: 150, carbs: 200, fat: 65 };
    const bad = { calories: 1600, protein: 100, carbs: 200, fat: 65 }; // 20% drop
    const result = checkMacroCoherence(original, bad);
    expect(result.withinTolerance).toBe(false);
  });

  it("passes macro coherence for minor changes", () => {
    const original = { calories: 2000, protein: 150, carbs: 200, fat: 65 };
    const minor = { calories: 2050, protein: 155, carbs: 205, fat: 67 }; // < 5%
    const result = checkMacroCoherence(original, minor);
    expect(result.withinTolerance).toBe(true);
  });
});

// ─── AI Plan Parsing ──────────────────────────────────────────────────────

describe("AI Plan Parsing", () => {
  it("parses a complete Spring Boot weekly plan", () => {
    const raw = {
      days: [
        {
          dayOfWeek: 0,
          meals: [
            {
              mealType: "breakfast",
              name: "Oatmeal",
              description: "Healthy start",
              calories: 350,
              protein: 15,
              carbs: 55,
              fat: 8,
              ingredients: ["oats", "milk"],
              instructions: "Cook oats.",
            },
          ],
          dailyTotals: { calories: 350, protein: 15, carbs: 55, fat: 8 },
        },
      ],
      weeklyTotals: { calories: 350, protein: 15, carbs: 55, fat: 8 },
    };

    const plan = parseAIGeneratedPlan(raw);
    expect(plan).not.toBeNull();
    expect(plan!.days).toHaveLength(1);
    expect(plan!.days[0].meals[0].ingredients).toEqual([{ name: "oats" }, { name: "milk" }]);
  });

  it("rejects invalid data gracefully", () => {
    expect(parseAIGeneratedPlan(null)).toBeNull();
    expect(parseAIGeneratedPlan(42)).toBeNull();
    expect(parseAIGeneratedPlan("not a plan")).toBeNull();
  });
});
