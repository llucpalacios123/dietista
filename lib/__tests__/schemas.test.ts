import { describe, it, expect } from "vitest";
import { workoutPlanContentSchema } from "../schemas";

// ─── RED: Schema v2 discriminated union tests ─────────────────────────────────

const validDay = (idx: number) => ({
  dayOfWeek: idx,
  focus: ["chest"],
  title: `Día ${idx + 1} · Empuje`,
  warmupMin: 5,
  cooldownMin: 5,
  isRestDay: false,
  exercises: [
    {
      name: "Press banca",
      muscleGroup: "chest",
      isFromCatalog: true,
      sets: [{ reps: 10, weightKg: 60, rir: 2 }],
      restSec: 90,
    },
  ],
});

describe("workoutPlanContentSchema — v1 backward compatibility", () => {
  it("accepts a v1 plan with 7 days (dayOfWeek 0..6)", () => {
    const plan = {
      version: 1,
      days: Array.from({ length: 7 }, (_, i) => ({
        ...validDay(i),
        isRestDay: i >= 2,
        exercises: i >= 2 ? [] : validDay(i).exercises,
        focus: i >= 2 ? [] : validDay(i).focus,
      })).map((d, i) =>
        i >= 2 ? { ...d, isRestDay: true, exercises: [], focus: [] } : d
      ),
    };
    const result = workoutPlanContentSchema.safeParse(plan);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.version).toBe(1);
    }
  });
});

describe("workoutPlanContentSchema — v2 day-relative", () => {
  it("accepts a v2 plan with 3 training days (indices 0..2)", () => {
    const plan = {
      version: 2,
      days: [validDay(0), validDay(1), validDay(2)],
    };
    const result = workoutPlanContentSchema.safeParse(plan);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.version).toBe(2);
      expect(result.data.days).toHaveLength(3);
    }
  });

  it("accepts a v2 plan with 1 training day", () => {
    const plan = {
      version: 2,
      days: [validDay(0)],
    };
    expect(workoutPlanContentSchema.safeParse(plan).success).toBe(true);
  });

  it("accepts a v2 plan with 7 training days (max)", () => {
    const plan = {
      version: 2,
      days: Array.from({ length: 7 }, (_, i) => validDay(i)),
    };
    expect(workoutPlanContentSchema.safeParse(plan).success).toBe(true);
  });

  it("rejects a v2 plan with 0 days", () => {
    const plan = {
      version: 2,
      days: [],
    };
    expect(workoutPlanContentSchema.safeParse(plan).success).toBe(false);
  });
});
