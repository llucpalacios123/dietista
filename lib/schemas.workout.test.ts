import { describe, it, expect } from "vitest";
import {
  workoutPlanContentSchema,
  workoutPreferencesSchema,
} from "@/lib/schemas";

// ─── workoutPlanContentSchema ─────────────────────────────────────────────────

const validExercise = {
  name: "Sentadilla",
  muscleGroup: "legs",
  isFromCatalog: true,
  sets: [
    { reps: 10, weightKg: 60, rir: 2 },
    { reps: 8, weightKg: 65, rir: 1 },
  ],
  restSec: 90,
};

const validDay = {
  dayOfWeek: 0,
  focus: ["legs"],
  title: "Piernas",
  exercises: [validExercise],
  isRestDay: false,
};

const validRestDay = {
  dayOfWeek: 1,
  focus: [],
  title: "Descanso",
  exercises: [],
  isRestDay: true,
};

const validContent = {
  version: 1,
  days: [validDay],
};

describe("workoutPlanContentSchema", () => {
  describe("valid content", () => {
    it("accepts a minimal valid plan", () => {
      const result = workoutPlanContentSchema.safeParse(validContent);
      expect(result.success).toBe(true);
    });

    it("accepts a plan with rest days", () => {
      const result = workoutPlanContentSchema.safeParse({
        version: 1,
        days: [validDay, validRestDay],
      });
      expect(result.success).toBe(true);
    });

    it("accepts a plan with weeklyVolumeNotes", () => {
      const result = workoutPlanContentSchema.safeParse({
        ...validContent,
        weeklyVolumeNotes: "Focus on progressive overload this week",
      });
      expect(result.success).toBe(true);
    });

    it("accepts exercise with durationSec for cardio", () => {
      const cardioExercise = {
        name: "Cinta",
        muscleGroup: "cardio",
        isFromCatalog: true,
        sets: [{ reps: null, weightKg: null, durationSec: 1800 }],
        restSec: 60,
      };
      const result = workoutPlanContentSchema.safeParse({
        version: 1,
        days: [{ ...validDay, exercises: [cardioExercise] }],
      });
      expect(result.success).toBe(true);
    });

    it("version is present and equals 1", () => {
      const result = workoutPlanContentSchema.safeParse(validContent);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.version).toBe(1);
      }
    });
  });

  describe("invalid content", () => {
    it("accepts version=2 (day-relative plan)", () => {
      // v2 is valid since the schema was upgraded to a discriminated union
      const result = workoutPlanContentSchema.safeParse({
        ...validContent,
        version: 2,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.version).toBe(2);
      }
    });

    it("rejects missing version", () => {
      const result = workoutPlanContentSchema.safeParse({
        days: [validDay],
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty days array", () => {
      const result = workoutPlanContentSchema.safeParse({
        version: 1,
        days: [],
      });
      expect(result.success).toBe(false);
    });

    it("rejects day with invalid dayOfWeek (8)", () => {
      const result = workoutPlanContentSchema.safeParse({
        version: 1,
        days: [{ ...validDay, dayOfWeek: 8 }],
      });
      expect(result.success).toBe(false);
    });

    it("rejects day with negative dayOfWeek", () => {
      const result = workoutPlanContentSchema.safeParse({
        version: 1,
        days: [{ ...validDay, dayOfWeek: -1 }],
      });
      expect(result.success).toBe(false);
    });

    it("rejects training day missing exercises (non-rest day with empty exercises)", () => {
      // Non-rest day with empty exercises is only invalid if isRestDay=false
      // The schema should either allow it or enforce at least 1 exercise for non-rest days
      // Per design: exercises: z.array(workoutExerciseSchema).min(1).max(15) for non-rest
      // But rest days have isRestDay=true and exercises=[]
      // We expect empty exercises to fail for non-rest day
      const result = workoutPlanContentSchema.safeParse({
        version: 1,
        days: [{ ...validDay, exercises: [], isRestDay: false }],
      });
      // rest day OR we allow it — check behavior from schema definition
      // Since design says min(1) on exercises, this should fail
      expect(result.success).toBe(false);
    });

    it("rejects exercise with empty name", () => {
      const result = workoutPlanContentSchema.safeParse({
        version: 1,
        days: [
          {
            ...validDay,
            exercises: [{ ...validExercise, name: "" }],
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it("rejects exercise with invalid muscleGroup", () => {
      const result = workoutPlanContentSchema.safeParse({
        version: 1,
        days: [
          {
            ...validDay,
            exercises: [{ ...validExercise, muscleGroup: "glutes" }],
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it("rejects exercise with empty sets array", () => {
      const result = workoutPlanContentSchema.safeParse({
        version: 1,
        days: [
          {
            ...validDay,
            exercises: [{ ...validExercise, sets: [] }],
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it("rejects more than 7 days", () => {
      const days = Array.from({ length: 8 }, (_, i) => ({
        ...validDay,
        dayOfWeek: i % 7,
      }));
      const result = workoutPlanContentSchema.safeParse({
        version: 1,
        days,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("regression: LLM output shape bugs", () => {
    const trainingDayBase = {
      dayOfWeek: 2,
      title: "Pecho fuerza",
      warmupMin: 5,
      cooldownMin: 5,
      isRestDay: false,
    };

    const validSetObject = { reps: 10, weightKg: 80, rir: 2 };

    const validExerciseFull = {
      name: "Press banca",
      muscleGroup: "chest",
      isFromCatalog: true,
      sets: [validSetObject, { reps: 8, weightKg: 85, rir: 1 }],
      restSec: 120,
    };

    it("rejects sets as scalar number", () => {
      const result = workoutPlanContentSchema.safeParse({
        version: 1,
        days: [
          {
            ...trainingDayBase,
            focus: ["chest"],
            exercises: [{ ...validExerciseFull, sets: 3 }],
          },
        ],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path.join("."));
        expect(paths.some((p) => p.includes("sets"))).toBe(true);
      }
    });

    it("rejects training day missing focus field", () => {
      const { focus: _focus, ...dayWithoutFocus } = {
        ...trainingDayBase,
        focus: ["chest"],
        exercises: [validExerciseFull],
      };
      const result = workoutPlanContentSchema.safeParse({
        version: 1,
        days: [dayWithoutFocus],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path.join("."));
        expect(paths.some((p) => p.includes("focus"))).toBe(true);
      }
    });

    it("rejects exercise missing muscleGroup", () => {
      const { muscleGroup: _mg, ...exerciseWithoutMG } = validExerciseFull;
      const result = workoutPlanContentSchema.safeParse({
        version: 1,
        days: [
          {
            ...trainingDayBase,
            focus: ["chest"],
            exercises: [exerciseWithoutMG],
          },
        ],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path.join("."));
        expect(paths.some((p) => p.includes("muscleGroup"))).toBe(true);
      }
    });

    it("accepts training day with correct focus, muscleGroup and sets array", () => {
      const result = workoutPlanContentSchema.safeParse({
        version: 1,
        days: [
          {
            ...trainingDayBase,
            focus: ["legs"],
            exercises: [
              {
                name: "Sentadilla",
                muscleGroup: "legs",
                isFromCatalog: true,
                sets: [{ reps: 10, weightKg: 60, rir: 2 }],
                restSec: 90,
              },
            ],
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("accepts rest day with empty focus and empty exercises", () => {
      const result = workoutPlanContentSchema.safeParse({
        version: 1,
        days: [
          {
            dayOfWeek: 6,
            focus: [],
            title: "Descanso",
            warmupMin: 0,
            cooldownMin: 0,
            isRestDay: true,
            exercises: [],
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("rejects training day with empty focus", () => {
      const result = workoutPlanContentSchema.safeParse({
        version: 1,
        days: [
          {
            ...trainingDayBase,
            focus: [],
            exercises: [validExerciseFull],
          },
        ],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path.join("."));
        expect(paths.some((p) => p.includes("focus"))).toBe(true);
      }
    });

    it("accepts rest day with empty focus (schema relaxation)", () => {
      const result = workoutPlanContentSchema.safeParse({
        version: 1,
        days: [
          {
            dayOfWeek: 6,
            focus: [],
            title: "Descanso dominical",
            warmupMin: 0,
            cooldownMin: 0,
            isRestDay: true,
            exercises: [],
          },
        ],
      });
      expect(result.success).toBe(true);
    });
  });
});

// ─── workoutPreferencesSchema ──────────────────────────────────────────────────

const validPreferences = {
  goal: "strength",
  level: "intermediate",
  daysPerWeek: 4,
  focusGroups: ["chest", "back"],
  equipment: ["gym"],
  sessionDurationMin: 60,
  name: "Mi plan de fuerza",
};

describe("workoutPreferencesSchema", () => {
  describe("valid inputs", () => {
    it("accepts a valid preferences object", () => {
      const result = workoutPreferencesSchema.safeParse(validPreferences);
      expect(result.success).toBe(true);
    });

    it("accepts with optional notes", () => {
      const result = workoutPreferencesSchema.safeParse({
        ...validPreferences,
        notes: "Tengo una lesión en el hombro derecho",
      });
      expect(result.success).toBe(true);
    });

    it("accepts all valid workout goals", () => {
      const goals = ["strength", "endurance", "weight_loss", "toning", "hypertrophy"];
      for (const goal of goals) {
        const result = workoutPreferencesSchema.safeParse({ ...validPreferences, goal });
        expect(result.success).toBe(true);
      }
    });

    it("accepts all valid fitness levels", () => {
      const levels = ["beginner", "intermediate", "advanced"];
      for (const level of levels) {
        const result = workoutPreferencesSchema.safeParse({ ...validPreferences, level });
        expect(result.success).toBe(true);
      }
    });

    it("accepts daysPerWeek at boundaries (1 and 7)", () => {
      expect(workoutPreferencesSchema.safeParse({ ...validPreferences, daysPerWeek: 1 }).success).toBe(true);
      expect(workoutPreferencesSchema.safeParse({ ...validPreferences, daysPerWeek: 7 }).success).toBe(true);
    });

    it("accepts all valid equipment types", () => {
      const result = workoutPreferencesSchema.safeParse({
        ...validPreferences,
        equipment: ["gym", "home_basic", "dumbbells", "bands", "bodyweight"],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("invalid inputs", () => {
    it("rejects invalid workout goal", () => {
      const result = workoutPreferencesSchema.safeParse({
        ...validPreferences,
        goal: "muscle_gain",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid fitness level", () => {
      const result = workoutPreferencesSchema.safeParse({
        ...validPreferences,
        level: "expert",
      });
      expect(result.success).toBe(false);
    });

    it("rejects daysPerWeek=0", () => {
      const result = workoutPreferencesSchema.safeParse({
        ...validPreferences,
        daysPerWeek: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects daysPerWeek=8", () => {
      const result = workoutPreferencesSchema.safeParse({
        ...validPreferences,
        daysPerWeek: 8,
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty focusGroups", () => {
      const result = workoutPreferencesSchema.safeParse({
        ...validPreferences,
        focusGroups: [],
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid muscleGroup in focusGroups", () => {
      const result = workoutPreferencesSchema.safeParse({
        ...validPreferences,
        focusGroups: ["biceps"],
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid equipment type", () => {
      const result = workoutPreferencesSchema.safeParse({
        ...validPreferences,
        equipment: ["resistance_bands"],
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing required fields", () => {
      const { goal: _goal, ...withoutGoal } = validPreferences;
      expect(workoutPreferencesSchema.safeParse(withoutGoal).success).toBe(false);

      const { level: _level, ...withoutLevel } = validPreferences;
      expect(workoutPreferencesSchema.safeParse(withoutLevel).success).toBe(false);
    });
  });
});
