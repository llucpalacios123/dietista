import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before imports
vi.mock("@/lib/auth-config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/diet-service", () => ({
  generateMealPlan: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    mealPlan: {
      findUnique: vi.fn(),
    },
    profile: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import { auth } from "@/lib/auth-config";
import { generateMealPlan } from "@/lib/diet-service";
import { prisma } from "@/lib/prisma";
import { generateWizardPlan } from "@/actions/wizard";
import type { NutritionistPreferencesSchema } from "@/lib/schemas";

const mockAuth = vi.mocked(auth);
const mockGenerateMealPlan = vi.mocked(generateMealPlan);
const mockPrisma = vi.mocked(prisma);

// ─── Helpers ─────────────────────────────────────────────────────────────

const samplePreferences: NutritionistPreferencesSchema = {
  allergies: ["nuts"],
  dislikedFoods: ["beef"],
  dietType: "vegetarian",
  budgetFriendly: true,
  weeklyBudget: 80,
  mealComplexity: "simple",
  mealsPerDay: 4,
  includeSnacks: true,
  varietyPreference: "medium",
  favoriteFoods: ["pasta"],
  eatingOutFrequency: "rarely",
  cookingTimeAvailable: 25,
};

const fakeMealPlan = {
  id: "plan-1",
  userId: "user-1",
  startDate: new Date(),
  endDate: new Date(),
  status: "draft",
  totalCalories: 2000,
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
  meals: [],
};

// ─── generateWizardPlan — forwards preferences ────────────────────────────

describe("generateWizardPlan — preference forwarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });
    mockGenerateMealPlan.mockResolvedValue({ mealPlanId: "plan-1", mealCount: 0 });
    mockPrisma.mealPlan.findUnique.mockResolvedValue(fakeMealPlan as any);
    mockPrisma.profile.findUnique.mockResolvedValue(null);
  });

  it("calls generateMealPlan(userId, preferences) when preferences are provided", async () => {
    await generateWizardPlan(samplePreferences);

    expect(mockGenerateMealPlan).toHaveBeenCalledWith("user-1", samplePreferences);
  });

  it("calls generateMealPlan(userId, undefined) when no preferences are provided", async () => {
    await generateWizardPlan();

    expect(mockGenerateMealPlan).toHaveBeenCalledWith("user-1", undefined);
  });

  it("forwards dislikedFoods in the preferences object unchanged — mapping is diet-service's responsibility", async () => {
    await generateWizardPlan(samplePreferences);

    const call = mockGenerateMealPlan.mock.calls[0];
    expect(call[1]?.dislikedFoods).toEqual(["beef"]);
  });
});
