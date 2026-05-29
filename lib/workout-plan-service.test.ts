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
  workoutPlanLog: {
    create: vi.fn(),
    findMany: vi.fn(),
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
  model: "gpt-4o-mini" as const,
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

// ─── createWorkoutPlanLog ──────────────────────────────────────────────────────

describe("createWorkoutPlanLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls prisma.workoutPlanLog.create with the correct userId, planId, and planDayIndex", async () => {
    const mockLog = {
      id: "log-1",
      userId: "user-1",
      planId: "plan-1",
      planDayIndex: 2,
      completedAt: new Date("2026-05-29T10:00:00Z"),
    };
    mockPrisma.workoutPlanLog.create.mockResolvedValue(mockLog);

    const { createWorkoutPlanLog } = await import("@/lib/workout-plan-service");
    const result = await createWorkoutPlanLog("user-1", "plan-1", 2);

    expect(mockPrisma.workoutPlanLog.create).toHaveBeenCalledWith({
      data: { userId: "user-1", planId: "plan-1", planDayIndex: 2 },
    });
    expect(result.id).toBe("log-1");
    expect(result.planDayIndex).toBe(2);
  });

  it("returns the created log record with all fields", async () => {
    const completedAt = new Date("2026-05-29T10:00:00Z");
    const mockLog = {
      id: "log-42",
      userId: "user-7",
      planId: "plan-99",
      planDayIndex: 0,
      completedAt,
    };
    mockPrisma.workoutPlanLog.create.mockResolvedValue(mockLog);

    const { createWorkoutPlanLog } = await import("@/lib/workout-plan-service");
    const result = await createWorkoutPlanLog("user-7", "plan-99", 0);

    expect(result.id).toBe("log-42");
    expect(result.userId).toBe("user-7");
    expect(result.planId).toBe("plan-99");
    expect(result.planDayIndex).toBe(0);
    expect(result.completedAt).toEqual(completedAt);
  });
});

// ─── getWeekWorkoutLogs ────────────────────────────────────────────────────────

describe("getWeekWorkoutLogs", () => {
  const weekStart = new Date("2026-05-25T00:00:00.000Z"); // Monday
  const weekEnd = new Date("2026-06-01T00:00:00.000Z");   // Following Monday (half-open)

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queries with half-open interval gte/lt and scoped by userId+planId, ordered asc", async () => {
    mockPrisma.workoutPlanLog.findMany.mockResolvedValue([]);

    const { getWeekWorkoutLogs } = await import("@/lib/workout-plan-service");
    await getWeekWorkoutLogs("user-1", "plan-1", weekStart, weekEnd);

    expect(mockPrisma.workoutPlanLog.findMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        planId: "plan-1",
        completedAt: { gte: weekStart, lt: weekEnd },
      },
      orderBy: { completedAt: "asc" },
    });
  });

  it("returns the matching log records for the week window", async () => {
    const mockLogs = [
      { id: "log-1", userId: "user-1", planId: "plan-1", planDayIndex: 0, completedAt: new Date("2026-05-26T09:00:00Z") },
      { id: "log-2", userId: "user-1", planId: "plan-1", planDayIndex: 2, completedAt: new Date("2026-05-28T09:00:00Z") },
    ];
    mockPrisma.workoutPlanLog.findMany.mockResolvedValue(mockLogs);

    const { getWeekWorkoutLogs } = await import("@/lib/workout-plan-service");
    const result = await getWeekWorkoutLogs("user-1", "plan-1", weekStart, weekEnd);

    expect(result).toHaveLength(2);
    expect(result[0].planDayIndex).toBe(0);
    expect(result[1].planDayIndex).toBe(2);
  });

  it("returns empty array when no logs exist for the week", async () => {
    mockPrisma.workoutPlanLog.findMany.mockResolvedValue([]);

    const { getWeekWorkoutLogs } = await import("@/lib/workout-plan-service");
    const result = await getWeekWorkoutLogs("user-1", "plan-1", weekStart, weekEnd);

    // Empty result is valid — it means no completions this week
    expect(result).toHaveLength(0);
  });
});
