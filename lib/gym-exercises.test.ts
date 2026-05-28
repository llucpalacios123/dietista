import { describe, it, expect } from "vitest";
import { GYM_EXERCISES, isExerciseInCatalog, getCatalogByMuscleGroups } from "@/lib/gym-exercises";
import type { MuscleGroup } from "@prisma/client";

describe("isExerciseInCatalog", () => {
  it("returns true for a known exercise in the correct group", () => {
    expect(isExerciseInCatalog("Sentadilla", "legs")).toBe(true);
  });

  it("returns true for exact match in back group", () => {
    expect(isExerciseInCatalog("Dominadas", "back")).toBe(true);
  });

  it("returns true for exact match in chest group", () => {
    expect(isExerciseInCatalog("Press de banca", "chest")).toBe(true);
  });

  it("returns false for exercise not in catalog", () => {
    expect(isExerciseInCatalog("Ejercicio inventado", "legs")).toBe(false);
  });

  it("returns false when exercise is in a different group", () => {
    // Sentadilla is in legs, not chest
    expect(isExerciseInCatalog("Sentadilla", "chest")).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(isExerciseInCatalog("sentadilla", "legs")).toBe(true);
    expect(isExerciseInCatalog("SENTADILLA", "legs")).toBe(true);
    expect(isExerciseInCatalog("SenTaDilLa", "legs")).toBe(true);
  });

  it("returns false for empty exercise name", () => {
    expect(isExerciseInCatalog("", "legs")).toBe(false);
  });

  it("handles all valid muscle groups", () => {
    const groups: MuscleGroup[] = ["legs", "back", "chest", "shoulders", "arms", "core", "cardio"];
    for (const group of groups) {
      // Each group has at least one exercise; verify first item is found
      const firstExercise = GYM_EXERCISES[group][0];
      expect(isExerciseInCatalog(firstExercise, group)).toBe(true);
    }
  });
});

describe("getCatalogByMuscleGroups", () => {
  it("returns exercises for a single group", () => {
    const result = getCatalogByMuscleGroups(["legs"]);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((e) => e.muscleGroup === "legs")).toBe(true);
  });

  it("returns exercises for multiple groups", () => {
    const result = getCatalogByMuscleGroups(["chest", "back"]);
    expect(result.length).toBeGreaterThan(0);
    const groups = new Set(result.map((e) => e.muscleGroup));
    expect(groups.has("chest")).toBe(true);
    expect(groups.has("back")).toBe(true);
  });

  it("returns empty array for empty groups input", () => {
    const result = getCatalogByMuscleGroups([]);
    expect(result).toEqual([]);
  });

  it("returns unique exercises without duplicates", () => {
    const result = getCatalogByMuscleGroups(["legs", "legs"]);
    const names = result.map((e) => e.name);
    const uniqueNames = new Set(names);
    expect(names.length).toBe(uniqueNames.size);
  });

  it("each returned exercise has name, muscleGroup, and isFromCatalog=true", () => {
    const result = getCatalogByMuscleGroups(["core"]);
    for (const exercise of result) {
      expect(exercise).toHaveProperty("name");
      expect(exercise).toHaveProperty("muscleGroup");
      expect(exercise.isFromCatalog).toBe(true);
    }
  });

  it("all groups returns all exercises", () => {
    const allGroups: MuscleGroup[] = ["legs", "back", "chest", "shoulders", "arms", "core", "cardio"];
    const result = getCatalogByMuscleGroups(allGroups);
    const totalInCatalog = Object.values(GYM_EXERCISES).reduce(
      (sum, exercises) => sum + exercises.length,
      0
    );
    expect(result.length).toBe(totalInCatalog);
  });
});
