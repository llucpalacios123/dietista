import { describe, it, expect } from "vitest";
import {
  userPreferencesSchema,
  workoutPreferencesSchema,
  OPENAI_MODELS,
  DEFAULT_MODEL,
} from "@/lib/schemas";
import { MuscleGroup } from "@prisma/client";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const minimalWorkoutPrefs = {
  goal: "strength" as const,
  level: "intermediate" as const,
  daysPerWeek: 3,
  focusGroups: ["legs" as MuscleGroup],
  equipment: ["gym" as const],
  sessionDurationMin: 60,
  name: "Test plan",
};

// ─── OPENAI_MODELS constant ───────────────────────────────────────────────────

describe("OPENAI_MODELS constant", () => {
  it("exports 11 model IDs", () => {
    expect(OPENAI_MODELS).toHaveLength(11);
  });

  it("includes all expected model IDs", () => {
    expect(OPENAI_MODELS).toContain("gpt-4o-mini");
    expect(OPENAI_MODELS).toContain("gpt-4o");
    expect(OPENAI_MODELS).toContain("gpt-4.1");
    expect(OPENAI_MODELS).toContain("gpt-4.1-mini");
    expect(OPENAI_MODELS).toContain("gpt-4.1-nano");
    expect(OPENAI_MODELS).toContain("gpt-4-turbo");
    expect(OPENAI_MODELS).toContain("gpt-3.5-turbo");
    expect(OPENAI_MODELS).toContain("gpt-5");
    expect(OPENAI_MODELS).toContain("gpt-5-mini");
    expect(OPENAI_MODELS).toContain("gpt-5-nano");
    expect(OPENAI_MODELS).toContain("gpt-5-pro");
  });

  it("DEFAULT_MODEL is gpt-4o-mini", () => {
    expect(DEFAULT_MODEL).toBe("gpt-4o-mini");
  });
});

// ─── userPreferencesSchema — model field ──────────────────────────────────────

describe("userPreferencesSchema — model field", () => {
  it("defaults model to gpt-4o-mini when field is absent", () => {
    const result = userPreferencesSchema.parse({});
    expect(result.model).toBe("gpt-4o-mini");
  });

  it("accepts gpt-4o as a valid model", () => {
    const result = userPreferencesSchema.parse({ model: "gpt-4o" });
    expect(result.model).toBe("gpt-4o");
  });

  it("accepts gpt-4-turbo as a valid model", () => {
    const result = userPreferencesSchema.parse({ model: "gpt-4-turbo" });
    expect(result.model).toBe("gpt-4-turbo");
  });

  it("accepts gpt-3.5-turbo as a valid model", () => {
    const result = userPreferencesSchema.parse({ model: "gpt-3.5-turbo" });
    expect(result.model).toBe("gpt-3.5-turbo");
  });

  it("rejects an invalid model value (o1)", () => {
    const result = userPreferencesSchema.safeParse({ model: "o1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.errors.map((e) => e.path.join("."));
      expect(fields).toContain("model");
    }
  });

  it("accepts gpt-5 as a valid model value", () => {
    const result = userPreferencesSchema.safeParse({ model: "gpt-5" });
    expect(result.success).toBe(true);
  });
});

// ─── workoutPreferencesSchema — model field ───────────────────────────────────

describe("workoutPreferencesSchema — model field", () => {
  it("defaults model to gpt-4o-mini when field is absent", () => {
    const result = workoutPreferencesSchema.parse(minimalWorkoutPrefs);
    expect(result.model).toBe("gpt-4o-mini");
  });

  it("accepts gpt-4o as a valid model", () => {
    const result = workoutPreferencesSchema.parse({ ...minimalWorkoutPrefs, model: "gpt-4o" });
    expect(result.model).toBe("gpt-4o");
  });

  it("accepts gpt-4-turbo as a valid model", () => {
    const result = workoutPreferencesSchema.parse({ ...minimalWorkoutPrefs, model: "gpt-4-turbo" });
    expect(result.model).toBe("gpt-4-turbo");
  });

  it("rejects o1-mini as an invalid model value", () => {
    const result = workoutPreferencesSchema.safeParse({ ...minimalWorkoutPrefs, model: "o1-mini" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.errors.map((e) => e.path.join("."));
      expect(fields).toContain("model");
    }
  });
});
