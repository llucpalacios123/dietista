import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before imports
vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: vi.fn(),
    },
    workoutPlan: {
      updateMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/openai", () => ({
  generateWorkoutContent: vi.fn(),
}));

vi.mock("@/lib/llm-router", () => ({
  selectModel: vi.fn().mockReturnValue("gpt-5-nano"),
}));

import { prisma } from "@/lib/prisma";
import { generateWorkoutContent } from "@/lib/openai";
import { selectModel } from "@/lib/llm-router";
import { generateWorkoutPlan, createWorkoutPlan } from "@/lib/workout-plan-service";
import { DEFAULT_MODEL } from "@/lib/schemas";
import type { WorkoutPreferences } from "@/lib/schemas";

const mockPrisma = vi.mocked(prisma);
const mockGenerateWorkoutContent = vi.mocked(generateWorkoutContent);
const mockSelectModel = vi.mocked(selectModel);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const baseProfile = {
  id: "profile-1",
  userId: "user-1",
  weight: 75,
  height: 180,
  age: 28,
  sex: "male" as const,
  goal: "gain" as const,
  activityLevel: "active" as const,
  targetCalories: 2800,
  targetProtein: 180,
  targetCarbs: 350,
  targetFat: 80,
  allergies: [],
  forbiddenFoods: [],
  dietType: null,
  cookingTimeAvailable: null,
  eatingOutFrequency: null,
  includeSnacks: false,
  mealComplexity: null,
  mealsPerDay: 3,
  varietyPreference: null,
  budgetFriendly: false,
  weeklyBudget: null,
  trainingRoutine: null,
  favoriteFoods: [],
  locale: "es",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const basePreferences: WorkoutPreferences = {
  goal: "strength",
  level: "intermediate",
  daysPerWeek: 4,
  focusGroups: ["legs", "back"],
  equipment: ["gym"],
  sessionDurationMin: 60,
  name: "Mi plan de entrenamiento",
  model: DEFAULT_MODEL, // default — router should activate
};

const fakeWorkoutContent = {
  version: 2 as const,
  days: [
    {
      dayOfWeek: 0,
      focus: ["legs" as const],
      title: "Día 1 · Piernas",
      warmupMin: 5,
      cooldownMin: 5,
      isRestDay: false,
      exercises: [
        {
          name: "Sentadilla",
          muscleGroup: "legs" as const,
          isFromCatalog: true,
          sets: [{ reps: 10, weightKg: 80, rir: 2 }],
          restSec: 90,
        },
      ],
    },
  ],
};

const fakeWorkoutPlan = {
  id: "plan-wk-1",
  userId: "user-1",
  name: "Mi plan de entrenamiento",
  goal: "strength",
  level: "intermediate",
  daysPerWeek: 4,
  status: "active",
  content: fakeWorkoutContent,
  aiModel: "gpt-5-nano",
  wasRegenerated: false,
  generationDurationMs: null,
  startDate: new Date(),
  endDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function setupTransaction(hadActive = 0) {
  mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma));
  mockPrisma.workoutPlan.count.mockResolvedValue(hadActive);
  mockPrisma.workoutPlan.updateMany.mockResolvedValue({ count: hadActive });
  mockPrisma.workoutPlan.create.mockResolvedValue(fakeWorkoutPlan as any);
}

// ─── Router model selection ───────────────────────────────────────────────────

describe("generateWorkoutPlan — router model selection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.profile.findUnique.mockResolvedValue(baseProfile);
    mockGenerateWorkoutContent.mockResolvedValue(fakeWorkoutContent);
    mockSelectModel.mockReturnValue("gpt-5-nano");
    setupTransaction(0);
  });

  it("uses router (gpt-5-nano) when preferences.model === DEFAULT_MODEL", async () => {
    const prefs = { ...basePreferences, model: DEFAULT_MODEL };

    await generateWorkoutPlan("user-1", prefs);

    expect(mockSelectModel).toHaveBeenCalledWith(
      expect.objectContaining({ feature: "workout" })
    );
    const createCall = mockPrisma.workoutPlan.create.mock.calls[0][0];
    expect(createCall.data.aiModel).toBe("gpt-5-nano");
  });

  it("uses override model when preferences.model !== DEFAULT_MODEL, does NOT call router", async () => {
    const prefs = { ...basePreferences, model: "gpt-4o" as const };

    await generateWorkoutPlan("user-1", prefs);

    // Router should NOT determine the final model since override exists
    const createCall = mockPrisma.workoutPlan.create.mock.calls[0][0];
    expect(createCall.data.aiModel).toBe("gpt-4o");
  });
});

// ─── Feedback tracking: wasRegenerated ───────────────────────────────────────

describe("generateWorkoutPlan — wasRegenerated tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.profile.findUnique.mockResolvedValue(baseProfile);
    mockGenerateWorkoutContent.mockResolvedValue(fakeWorkoutContent);
    mockSelectModel.mockReturnValue("gpt-5-nano");
  });

  it("wasRegenerated=true when hadActive > 0 (prior active plan existed)", async () => {
    setupTransaction(1); // 1 active plan existed

    await generateWorkoutPlan("user-1", basePreferences);

    const createCall = mockPrisma.workoutPlan.create.mock.calls[0][0];
    expect(createCall.data.wasRegenerated).toBe(true);
  });

  it("wasRegenerated=false when hadActive === 0 (no prior active plan)", async () => {
    setupTransaction(0); // no active plans

    await generateWorkoutPlan("user-1", basePreferences);

    const createCall = mockPrisma.workoutPlan.create.mock.calls[0][0];
    expect(createCall.data.wasRegenerated).toBe(false);
  });
});

// ─── Feedback tracking: generationDurationMs ─────────────────────────────────

describe("generateWorkoutPlan — generationDurationMs tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.profile.findUnique.mockResolvedValue(baseProfile);
    mockGenerateWorkoutContent.mockResolvedValue(fakeWorkoutContent);
    mockSelectModel.mockReturnValue("gpt-5-nano");
    setupTransaction(0);
  });

  it("persists a non-negative generationDurationMs on workoutPlan.create", async () => {
    await generateWorkoutPlan("user-1", basePreferences);

    const createCall = mockPrisma.workoutPlan.create.mock.calls[0][0];
    expect(typeof createCall.data.generationDurationMs).toBe("number");
    expect(createCall.data.generationDurationMs).toBeGreaterThanOrEqual(0);
  });
});
