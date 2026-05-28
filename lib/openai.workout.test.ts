import { describe, it, expect, vi, beforeEach } from "vitest";
import { workoutPlanContentSchema, type WorkoutPlanContent } from "@/lib/schemas";

// ─── Mock OpenAI SDK ──────────────────────────────────────────────────────────
// We mock the `openai` package at module level so the `openai` singleton
// in lib/openai.ts is replaced before any import of that module.

const mockCreate = vi.fn();

vi.mock("openai", () => ({
  default: class MockOpenAI {
    chat = { completions: { create: mockCreate } };
  },
}));

// ─── Valid fixture ────────────────────────────────────────────────────────────

const validWorkoutContent: WorkoutPlanContent = {
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
  weeklyVolumeNotes: "Focus on progressive overload",
};

const baseParams = {
  profile: {
    sex: "male",
    age: 30,
    goal: "strength",
    activityLevel: "moderate",
    trainingRoutine: null,
    notes: null,
  },
  preferences: {
    goal: "strength" as const,
    level: "intermediate" as const,
    daysPerWeek: 3,
    focusGroups: ["legs" as const],
    equipment: ["gym" as const],
    sessionDurationMin: 60,
    name: "Mi plan de fuerza",
  },
};

// ─── WORKOUT_GENERATION_SYSTEM prompt structure ───────────────────────────────

describe("WORKOUT_GENERATION_SYSTEM", () => {
  it("is a non-empty string", async () => {
    const { WORKOUT_GENERATION_SYSTEM } = await import("@/lib/openai");
    expect(typeof WORKOUT_GENERATION_SYSTEM).toBe("string");
    expect(WORKOUT_GENERATION_SYSTEM.length).toBeGreaterThan(0);
  });

  it("contains all required template placeholders", async () => {
    const { WORKOUT_GENERATION_SYSTEM } = await import("@/lib/openai");
    expect(WORKOUT_GENERATION_SYSTEM).toContain("{workoutGoal}");
    expect(WORKOUT_GENERATION_SYSTEM).toContain("{level}");
    expect(WORKOUT_GENERATION_SYSTEM).toContain("{daysPerWeek}");
    expect(WORKOUT_GENERATION_SYSTEM).toContain("{focusGroups}");
    expect(WORKOUT_GENERATION_SYSTEM).toContain("{equipment}");
  });

  it("instructs the model to return JSON with version:1 shape", async () => {
    const { WORKOUT_GENERATION_SYSTEM } = await import("@/lib/openai");
    expect(WORKOUT_GENERATION_SYSTEM).toContain('"version": 1');
  });

  it("explicitly forbids markdown output", async () => {
    const { WORKOUT_GENERATION_SYSTEM } = await import("@/lib/openai");
    // Should tell the model NOT to use markdown/code fences
    const lower = WORKOUT_GENERATION_SYSTEM.toLowerCase();
    expect(lower).toMatch(/no markdown|no code fence/);
  });

  it("includes all 7 muscle group catalog placeholders", async () => {
    const { WORKOUT_GENERATION_SYSTEM } = await import("@/lib/openai");
    for (const group of ["legs", "back", "chest", "shoulders", "arms", "core", "cardio"]) {
      expect(WORKOUT_GENERATION_SYSTEM).toContain(`{catalog${group.charAt(0).toUpperCase() + group.slice(1)}}`);
    }
  });
});

// ─── generateWorkoutContent ───────────────────────────────────────────────────

describe("generateWorkoutContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns parsed WorkoutPlanContent on valid response", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(validWorkoutContent) } }],
    });

    const { generateWorkoutContent } = await import("@/lib/openai");
    const result = await generateWorkoutContent(baseParams);

    expect(result.version).toBe(1);
    expect(result.days).toHaveLength(1);
    expect(result.days[0].exercises).toHaveLength(1);
  });

  it("result passes workoutPlanContentSchema validation", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(validWorkoutContent) } }],
    });

    const { generateWorkoutContent } = await import("@/lib/openai");
    const result = await generateWorkoutContent(baseParams);

    const parsed = workoutPlanContentSchema.safeParse(result);
    expect(parsed.success).toBe(true);
  });

  it("injects catalog into prompt (openai.create called with user message containing catalog exercises)", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(validWorkoutContent) } }],
    });

    const { generateWorkoutContent } = await import("@/lib/openai");
    await generateWorkoutContent(baseParams);

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const callArgs = mockCreate.mock.calls[0][0];
    const userMessage = callArgs.messages[0].content as string;
    // Catalog should be injected inline
    expect(userMessage).toContain("Sentadilla");      // legs catalog
    expect(userMessage).toContain("Press de banca"); // chest catalog
  });

  it("uses temperature 0.6 and json_object response format", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(validWorkoutContent) } }],
    });

    const { generateWorkoutContent } = await import("@/lib/openai");
    await generateWorkoutContent(baseParams);

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.temperature).toBe(0.6);
    expect(callArgs.response_format).toEqual({ type: "json_object" });
  });

  it("throws when OpenAI returns empty content", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: null } }],
    });

    const { generateWorkoutContent } = await import("@/lib/openai");
    await expect(generateWorkoutContent(baseParams)).rejects.toThrow();
  });

  it("throws after max retries on malformed JSON", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "this is not valid json {{{{" } }],
    });

    const { generateWorkoutContent } = await import("@/lib/openai");
    await expect(generateWorkoutContent(baseParams)).rejects.toThrow();
  });

  it("retries on transient error and succeeds on second attempt", async () => {
    mockCreate
      .mockRejectedValueOnce(new Error("Service unavailable"))
      .mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(validWorkoutContent) } }],
      });

    const { generateWorkoutContent } = await import("@/lib/openai");
    const result = await generateWorkoutContent(baseParams);

    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(result.version).toBe(1);
  });

  it("throws after 3 consecutive failures (MAX_RETRIES)", async () => {
    mockCreate.mockRejectedValue(new Error("Always fails"));

    const { generateWorkoutContent } = await import("@/lib/openai");
    await expect(generateWorkoutContent(baseParams)).rejects.toThrow("Always fails");

    expect(mockCreate).toHaveBeenCalledTimes(3);
  });

  it("throws a typed error when Zod validation fails on parsed JSON", async () => {
    const invalidContent = { version: 1, days: [] }; // empty days = invalid
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(invalidContent) } }],
    });

    const { generateWorkoutContent } = await import("@/lib/openai");
    await expect(generateWorkoutContent(baseParams)).rejects.toThrow(/no válida|estructura/i);
  });
});
