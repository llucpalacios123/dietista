import { describe, it, expect } from "vitest";
import { getSelectableDays } from "@/lib/workout-plan-days";
import type { WorkoutPlanContent } from "@/lib/schemas";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeExercise = () => ({
  name: "Squat",
  muscleGroup: "legs" as const,
  isFromCatalog: true,
  sets: [{ reps: 10, weightKg: 60, rir: 2 }],
  restSec: 90,
});

const makeTrainingDay = (dayOfWeek: number) => ({
  dayOfWeek,
  focus: ["legs" as const],
  title: `Día ${dayOfWeek + 1}`,
  warmupMin: 5,
  cooldownMin: 5,
  exercises: [makeExercise()],
  isRestDay: false as const,
});

const makeRestDay = (dayOfWeek: number) => ({
  dayOfWeek,
  focus: [] as never[],
  title: `Descanso ${dayOfWeek + 1}`,
  warmupMin: 0,
  cooldownMin: 0,
  exercises: [] as never[],
  isRestDay: true as const,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("getSelectableDays", () => {
  describe("v2 plans — all days are selectable (no rest-day fillers)", () => {
    it("returns all days when the plan has only training days", () => {
      const content: WorkoutPlanContent = {
        version: 2,
        days: [makeTrainingDay(0), makeTrainingDay(1), makeTrainingDay(2)],
      };

      const result = getSelectableDays(content);

      expect(result).toHaveLength(3);
      expect(result[0].dayOfWeek).toBe(0);
      expect(result[1].dayOfWeek).toBe(1);
      expect(result[2].dayOfWeek).toBe(2);
    });

    it("returns all days including rest-day-like entries (v2 has no filtering)", () => {
      const content: WorkoutPlanContent = {
        version: 2,
        days: [makeTrainingDay(0), makeRestDay(1), makeTrainingDay(2)],
      };

      const result = getSelectableDays(content);

      // v2: no filtering — all days returned as-is
      expect(result).toHaveLength(3);
      expect(result[1].isRestDay).toBe(true);
    });
  });

  describe("v1 plans — rest days are filtered out", () => {
    it("filters out isRestDay=true entries and returns only training days", () => {
      const content: WorkoutPlanContent = {
        version: 1,
        days: [
          makeTrainingDay(0), // Mon — training
          makeRestDay(1),     // Tue — rest (filtered)
          makeTrainingDay(2), // Wed — training
          makeRestDay(3),     // Thu — rest (filtered)
          makeTrainingDay(4), // Fri — training
        ],
      };

      const result = getSelectableDays(content);

      expect(result).toHaveLength(3);
      expect(result.every((d) => !d.isRestDay)).toBe(true);
    });

    it("returns indexes that are contiguous (0-based into the returned array, not raw content.days)", () => {
      const content: WorkoutPlanContent = {
        version: 1,
        days: [
          makeRestDay(0),     // raw index 0 — filtered
          makeTrainingDay(1), // raw index 1 → selectable index 0
          makeRestDay(2),     // raw index 2 — filtered
          makeTrainingDay(3), // raw index 3 → selectable index 1
        ],
      };

      const result = getSelectableDays(content);

      // selectable array has length 2, indexes are 0 and 1
      expect(result).toHaveLength(2);
      expect(result[0].dayOfWeek).toBe(1);
      expect(result[1].dayOfWeek).toBe(3);
    });

    it("returns empty array when all days are rest days", () => {
      const content: WorkoutPlanContent = {
        version: 1,
        days: [makeRestDay(0), makeRestDay(1)],
      };

      const result = getSelectableDays(content);

      // The emptiness is produced by real filter logic (all inputs are rest days)
      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it("returns all days when none are rest days", () => {
      const content: WorkoutPlanContent = {
        version: 1,
        days: [makeTrainingDay(0), makeTrainingDay(1), makeTrainingDay(2)],
      };

      const result = getSelectableDays(content);

      expect(result).toHaveLength(3);
      expect(result.every((d) => !d.isRestDay)).toBe(true);
    });
  });
});
