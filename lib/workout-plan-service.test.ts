import { describe, it, expect, vi, beforeEach } from "vitest";
import type { WorkoutPlanContent } from "@/lib/schemas";

// ─── Mock Prisma ──────────────────────────────────────────────────────────────

const mockPrisma = {
  workoutPlan: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    updateMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  profile: {
    findUnique: vi.fn(),
  },
  $transaction: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

// ─── Mock OpenAI ──────────────────────────────────────────────────────────────

const mockGenerateWorkoutContent = vi.fn();

vi.mock("@/lib/openai", () => ({
  generateWorkoutContent: mockGenerateWorkoutContent,
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const validContent: WorkoutPlanContent = {
  version: 1,
  days: [
    {
      dayOfWeek: 0,
      focus: ["legs"],
      title: "Piernas",
      warmupMin: 5,
      cooldownMin: 5,
      exercises: [
        {
          name: "Sentadilla",
          muscleGroup: "legs",
          isFromCatalog: true,
          sets: [{ reps: 10, weightKg: 60, rir: 2 }],
          restSec: 90,
        },
      ],
      isRestDay: false,
    },
  ],
};

const validProfile = {
  id: "profile-1",
  userId: "user-1",
  weight: 75,
  height: 175,
  age: 30,
  sex: "male",
  goal: "gain",
  activityLevel: "moderate",
  targetCalories: null,
  targetProtein: null,
  targetCarbs: null,
  targetFat: null,
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
  trainingRoutine: "3 days/week",
  favoriteFoods: [],
  locale: "es",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const validPreferences = {
  goal: "strength" as const,
  level: "intermediate" as const,
  daysPerWeek: 3,
  focusGroups: ["legs" as const, "back" as const],
  equipment: ["gym" as const],
  sessionDurationMin: 60,
  name: "Mi plan de fuerza",
};

const mockActivePlan = {
  id: "plan-1",
  userId: "user-1",
  name: "Old plan",
  goal: "strength",
  level: "beginner",
  daysPerWeek: 3,
  status: "active",
  content: validContent,
  startDate: new Date("2024-01-01"),
  endDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockNewPlan = {
  ...mockActivePlan,
  id: "plan-2",
  name: "Mi plan de fuerza",
  status: "active",
  startDate: new Date(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("createWorkoutPlan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default transaction mock: execute the callback
    mockPrisma.$transaction.mockImplementation(async (cb: (tx: typeof mockPrisma) => Promise<unknown>) => cb(mockPrisma));
  });

  it("creates a new workout plan with status active", async () => {
    mockPrisma.workoutPlan.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.workoutPlan.create.mockResolvedValue(mockNewPlan);

    const { createWorkoutPlan } = await import("@/lib/workout-plan-service");

    const result = await createWorkoutPlan("user-1", validPreferences, validContent);

    expect(mockPrisma.workoutPlan.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-1",
          status: "active",
          name: "Mi plan de fuerza",
        }),
      })
    );
    expect(result.id).toBe("plan-2");
  });

  it("deactivates previous active plan before creating new one (single-active invariant)", async () => {
    mockPrisma.workoutPlan.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.workoutPlan.create.mockResolvedValue(mockNewPlan);

    const { createWorkoutPlan } = await import("@/lib/workout-plan-service");
    await createWorkoutPlan("user-1", validPreferences, validContent);

    expect(mockPrisma.workoutPlan.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user-1",
          status: "active",
        }),
        data: expect.objectContaining({ status: "completed" }),
      })
    );
  });

  it("runs deactivation and creation in a transaction", async () => {
    mockPrisma.workoutPlan.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.workoutPlan.create.mockResolvedValue(mockNewPlan);

    const { createWorkoutPlan } = await import("@/lib/workout-plan-service");
    await createWorkoutPlan("user-1", validPreferences, validContent);

    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });
});

describe("getActiveWorkoutPlan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the active plan for a user", async () => {
    mockPrisma.workoutPlan.findFirst.mockResolvedValue(mockActivePlan);

    const { getActiveWorkoutPlan } = await import("@/lib/workout-plan-service");
    const result = await getActiveWorkoutPlan("user-1");

    expect(result).toEqual(mockActivePlan);
    expect(mockPrisma.workoutPlan.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user-1", status: "active" }),
      })
    );
  });

  it("returns null when no active plan exists", async () => {
    mockPrisma.workoutPlan.findFirst.mockResolvedValue(null);

    const { getActiveWorkoutPlan } = await import("@/lib/workout-plan-service");
    const result = await getActiveWorkoutPlan("user-1");

    expect(result).toBeNull();
  });
});

describe("getWorkoutPlanById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the plan when userId matches", async () => {
    mockPrisma.workoutPlan.findFirst.mockResolvedValue(mockActivePlan);

    const { getWorkoutPlanById } = await import("@/lib/workout-plan-service");
    const result = await getWorkoutPlanById("user-1", "plan-1");

    expect(result).toEqual(mockActivePlan);
    expect(mockPrisma.workoutPlan.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "plan-1", userId: "user-1" }),
      })
    );
  });

  it("returns null when plan belongs to a different user (IDOR protection)", async () => {
    mockPrisma.workoutPlan.findFirst.mockResolvedValue(null);

    const { getWorkoutPlanById } = await import("@/lib/workout-plan-service");
    const result = await getWorkoutPlanById("user-2", "plan-1");

    expect(result).toBeNull();
  });

  it("returns null when plan does not exist", async () => {
    mockPrisma.workoutPlan.findFirst.mockResolvedValue(null);

    const { getWorkoutPlanById } = await import("@/lib/workout-plan-service");
    const result = await getWorkoutPlanById("user-1", "nonexistent");

    expect(result).toBeNull();
  });
});

describe("listWorkoutPlans", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all plans for a user", async () => {
    const plans = [mockActivePlan, { ...mockActivePlan, id: "plan-3", status: "completed" }];
    mockPrisma.workoutPlan.findMany.mockResolvedValue(plans);

    const { listWorkoutPlans } = await import("@/lib/workout-plan-service");
    const result = await listWorkoutPlans("user-1");

    expect(result).toHaveLength(2);
    expect(mockPrisma.workoutPlan.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user-1" }),
      })
    );
  });

  it("returns empty array when user has no plans", async () => {
    mockPrisma.workoutPlan.findMany.mockResolvedValue([]);

    const { listWorkoutPlans } = await import("@/lib/workout-plan-service");
    const result = await listWorkoutPlans("user-1");

    expect(result).toEqual([]);
  });

  it("does not return plans belonging to other users", async () => {
    mockPrisma.workoutPlan.findMany.mockResolvedValue([mockActivePlan]);

    const { listWorkoutPlans } = await import("@/lib/workout-plan-service");
    await listWorkoutPlans("user-1");

    const callArgs = mockPrisma.workoutPlan.findMany.mock.calls[0][0];
    expect(callArgs.where.userId).toBe("user-1");
  });
});

describe("generateWorkoutPlan (full service flow)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (cb: (tx: typeof mockPrisma) => Promise<unknown>) => cb(mockPrisma));
  });

  it("fetches user profile, calls generateWorkoutContent, and creates plan", async () => {
    mockPrisma.profile.findUnique.mockResolvedValue(validProfile);
    mockGenerateWorkoutContent.mockResolvedValue(validContent);
    mockPrisma.workoutPlan.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.workoutPlan.create.mockResolvedValue(mockNewPlan);

    const { generateWorkoutPlan } = await import("@/lib/workout-plan-service");
    const result = await generateWorkoutPlan("user-1", validPreferences);

    expect(mockPrisma.profile.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1" } })
    );
    expect(mockGenerateWorkoutContent).toHaveBeenCalledTimes(1);
    expect(result.workoutPlanId).toBe("plan-2");
    expect(result.dayCount).toBeGreaterThan(0);
  });

  it("throws when user has no profile", async () => {
    mockPrisma.profile.findUnique.mockResolvedValue(null);

    const { generateWorkoutPlan } = await import("@/lib/workout-plan-service");
    await expect(generateWorkoutPlan("user-1", validPreferences)).rejects.toThrow(/perfil/i);
  });

  it("propagates OpenAI errors", async () => {
    mockPrisma.profile.findUnique.mockResolvedValue(validProfile);
    mockGenerateWorkoutContent.mockRejectedValue(new Error("OpenAI error"));

    const { generateWorkoutPlan } = await import("@/lib/workout-plan-service");
    await expect(generateWorkoutPlan("user-1", validPreferences)).rejects.toThrow("OpenAI error");
  });
});
