import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ─────────────────────────────────────────────────────────────────

vi.mock("@/lib/auth-config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    nutritionPlan: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/nutrition-plan-service", () => ({
  generateNutritionPlanForUser: vi.fn(),
}));

vi.mock("@/lib/diet-service", () => ({
  generateDietFromNutritionPlan: vi.fn(),
  generateMealPlan: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

// ─── Imports (after mocks) ──────────────────────────────────────────────────

import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { generateNutritionPlanForUser } from "@/lib/nutrition-plan-service";
import { generateDietFromNutritionPlan } from "@/lib/diet-service";
import {
  generateNutritionPlanAction,
  getNutritionPlansAction,
  getNutritionPlanByIdAction,
  generateDietFromPlanAction,
} from "@/actions/nutrition-plan";

// ─── Fixtures ──────────────────────────────────────────────────────────────

const ownerSession = { userId: "user-owner" };
const otherSession = { userId: "user-other" };

const fakePlan = {
  id: "plan-123",
  userId: "user-owner",
  dailyTargets: { calories: 2000, protein: 140, carbs: 220, fat: 62 },
  mealDistribution: {},
  recommendedFoods: {},
  weeklyFrequency: {},
  goal: "maintain",
  activityLevel: "moderate",
  allergies: [],
  forbiddenFoods: [],
  aiModel: "gpt-5-mini",
  generationDurationMs: 1000,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ─── Tests ─────────────────────────────────────────────────────────────────

describe("generateNutritionPlanAction", () => {
  const mockAuth = vi.mocked(auth);
  const mockGenerate = vi.mocked(generateNutritionPlanForUser);

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(ownerSession as unknown as Awaited<ReturnType<typeof auth>>);
    mockGenerate.mockResolvedValue(fakePlan as unknown as Awaited<ReturnType<typeof mockGenerate>>);
  });

  it("returns success with plan id on successful generation", async () => {
    const result = await generateNutritionPlanAction();
    expect(result.success).toBe(true);
    expect(result.data?.id).toBe("plan-123");
  });

  it("returns error when service throws", async () => {
    mockGenerate.mockRejectedValue(new Error("No tienes perfil"));
    const result = await generateNutritionPlanAction();
    expect(result.success).toBe(false);
    expect(result.error).toContain("No tienes perfil");
  });
});

describe("getNutritionPlansAction", () => {
  const mockAuth = vi.mocked(auth);
  const mockFindMany = vi.mocked(prisma.nutritionPlan.findMany);

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(ownerSession as unknown as Awaited<ReturnType<typeof auth>>);
    mockFindMany.mockResolvedValue([{ ...fakePlan, _count: { diets: 2 } }] as unknown as Awaited<ReturnType<typeof mockFindMany>>);
  });

  it("returns the user's nutrition plans with diet count", async () => {
    const result = await getNutritionPlansAction();
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
  });
});

describe("getNutritionPlanByIdAction", () => {
  const mockAuth = vi.mocked(auth);
  const mockFindUnique = vi.mocked(prisma.nutritionPlan.findUnique);

  beforeEach(() => {
    vi.clearAllMocks();
    mockFindUnique.mockResolvedValue({
      ...fakePlan,
      diets: [],
    } as unknown as Awaited<ReturnType<typeof mockFindUnique>>);
  });

  it("returns the plan when owner requests it", async () => {
    mockAuth.mockResolvedValue(ownerSession as unknown as Awaited<ReturnType<typeof auth>>);
    const result = await getNutritionPlanByIdAction("plan-123");
    expect(result.success).toBe(true);
  });

  it("returns error when a different user requests another user's plan", async () => {
    mockAuth.mockResolvedValue(otherSession as unknown as Awaited<ReturnType<typeof auth>>);
    const result = await getNutritionPlanByIdAction("plan-123");
    expect(result.success).toBe(false);
    expect(result.error).toContain("permiso");
  });
});

describe("generateDietFromPlanAction", () => {
  const mockAuth = vi.mocked(auth);
  const mockFindUnique = vi.mocked(prisma.nutritionPlan.findUnique);
  const mockGenerateDiet = vi.mocked(generateDietFromNutritionPlan);

  beforeEach(() => {
    vi.clearAllMocks();
    mockFindUnique.mockResolvedValue({ userId: "user-owner" } as unknown as Awaited<ReturnType<typeof mockFindUnique>>);
    mockGenerateDiet.mockResolvedValue({ mealPlanId: "mp-789", mealCount: 35 });
  });

  it("returns { mealPlanId } when owner triggers generation", async () => {
    mockAuth.mockResolvedValue(ownerSession as unknown as Awaited<ReturnType<typeof auth>>);
    const result = await generateDietFromPlanAction("plan-123");
    expect(result.success).toBe(true);
    expect(result.data?.mealPlanId).toBe("mp-789");
  });

  it("returns error when non-owner tries to generate a diet", async () => {
    mockAuth.mockResolvedValue(otherSession as unknown as Awaited<ReturnType<typeof auth>>);
    const result = await generateDietFromPlanAction("plan-123");
    expect(result.success).toBe(false);
    expect(result.error).toContain("permiso");
  });
});
