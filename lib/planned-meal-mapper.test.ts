import { describe, it, expect } from "vitest";
import {
  mapToPlannedMeal,
  filterAndSortMeals,
} from "@/lib/planned-meal-mapper";
import type { Ingredient } from "@/types/meal-plan";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeMeal(overrides: Partial<Parameters<typeof mapToPlannedMeal>[0]> = {}) {
  return {
    id: "meal-1",
    mealPlanId: "plan-1",
    dayOfWeek: 0,
    mealType: "breakfast" as const,
    name: "Avena con fruta",
    description: "Avena cremosa con plátano y miel",
    calories: 320,
    protein: 12,
    carbs: 55,
    fat: 6,
    ingredients: [{ name: "Avena", quantity: 80, unit: "g" }] as Ingredient[],
    instructions: "Cocer la avena a fuego lento.",
    selectedOptions: null,
    translations: null,
    ...overrides,
  };
}

// ─── mapToPlannedMeal ─────────────────────────────────────────────────────────

describe("mapToPlannedMeal", () => {
  it("maps all fields correctly", () => {
    const raw = makeMeal();
    const result = mapToPlannedMeal(raw);

    expect(result.id).toBe("meal-1");
    expect(result.mealType).toBe("breakfast");
    expect(result.name).toBe("Avena con fruta");
    expect(result.description).toBe("Avena cremosa con plátano y miel");
    expect(result.calories).toBe(320);
    expect(result.protein).toBe(12);
    expect(result.carbs).toBe(55);
    expect(result.fat).toBe(6);
    expect(result.instructions).toBe("Cocer la avena a fuego lento.");
  });

  it("coalesces null instructions to empty string", () => {
    const raw = makeMeal({ instructions: null as unknown as string });
    const result = mapToPlannedMeal(raw);
    expect(result.instructions).toBe("");
  });

  it("casts ingredients Json to Ingredient[]", () => {
    const ingredients: Ingredient[] = [
      { name: "Avena", quantity: 80, unit: "g" },
      { name: "Plátano", quantity: 1 },
    ];
    const raw = makeMeal({ ingredients });
    const result = mapToPlannedMeal(raw);
    expect(result.ingredients).toEqual(ingredients);
  });

  it("handles empty ingredients array", () => {
    const raw = makeMeal({ ingredients: [] });
    const result = mapToPlannedMeal(raw);
    expect(result.ingredients).toEqual([]);
  });

  it("handles missing ingredients (null/undefined) as empty array", () => {
    const raw = makeMeal({ ingredients: null as unknown as Ingredient[] });
    const result = mapToPlannedMeal(raw);
    expect(result.ingredients).toEqual([]);
  });
});

// ─── filterAndSortMeals ───────────────────────────────────────────────────────

describe("filterAndSortMeals", () => {
  it("returns empty array when no meals match todayIndex", () => {
    const meals = [makeMeal({ dayOfWeek: 2 }), makeMeal({ dayOfWeek: 3, id: "meal-2" })];
    expect(filterAndSortMeals(meals, 0)).toEqual([]);
  });

  it("returns only meals matching dayOfWeek", () => {
    const meal0 = makeMeal({ dayOfWeek: 0, id: "meal-0" });
    const meal1 = makeMeal({ dayOfWeek: 1, id: "meal-1" });
    const meal2 = makeMeal({ dayOfWeek: 0, id: "meal-2", mealType: "lunch" as const });

    const result = filterAndSortMeals([meal0, meal1, meal2], 0);
    expect(result).toHaveLength(2);
    expect(result.every((m) => m.dayOfWeek === 0)).toBe(true);
  });

  it("returns meals ordered by MEAL_TYPE_ORDER (breakfast → mid_morning → lunch → snack → dinner)", () => {
    const meals = [
      makeMeal({ id: "d", mealType: "dinner" as const, dayOfWeek: 1 }),
      makeMeal({ id: "b", mealType: "breakfast" as const, dayOfWeek: 1 }),
      makeMeal({ id: "l", mealType: "lunch" as const, dayOfWeek: 1 }),
      makeMeal({ id: "s", mealType: "snack" as const, dayOfWeek: 1 }),
      makeMeal({ id: "m", mealType: "mid_morning" as const, dayOfWeek: 1 }),
    ];

    const result = filterAndSortMeals(meals, 1);
    expect(result.map((m) => m.mealType)).toEqual([
      "breakfast",
      "mid_morning",
      "lunch",
      "snack",
      "dinner",
    ]);
  });

  it("returns empty array when meals array is empty", () => {
    expect(filterAndSortMeals([], 3)).toEqual([]);
  });

  // ─── Triangulating tests ──────────────────────────────────────────────────

  it("todayIndex=6 (Sunday) — returns only Sunday meals", () => {
    const meals = [
      makeMeal({ id: "sun-lunch", dayOfWeek: 6, mealType: "lunch" as const }),
      makeMeal({ id: "sun-breakfast", dayOfWeek: 6, mealType: "breakfast" as const }),
      makeMeal({ id: "sat", dayOfWeek: 5, mealType: "dinner" as const }),
    ];

    const result = filterAndSortMeals(meals, 6);
    expect(result).toHaveLength(2);
    expect(result[0].mealType).toBe("breakfast");
    expect(result[1].mealType).toBe("lunch");
  });

  it("two meals same dayOfWeek different types — sort order verified", () => {
    const meals = [
      makeMeal({ id: "snack", dayOfWeek: 3, mealType: "snack" as const }),
      makeMeal({ id: "mid", dayOfWeek: 3, mealType: "mid_morning" as const }),
      makeMeal({ id: "other", dayOfWeek: 5, mealType: "breakfast" as const }),
    ];

    const result = filterAndSortMeals(meals, 3);
    expect(result).toHaveLength(2);
    expect(result[0].mealType).toBe("mid_morning");
    expect(result[1].mealType).toBe("snack");
  });

  it("all meal types present on same day — full order maintained", () => {
    const allTypes = ["dinner", "snack", "lunch", "mid_morning", "breakfast"] as const;
    const meals = allTypes.map((mealType, i) =>
      makeMeal({ id: `m${i}`, dayOfWeek: 4, mealType })
    );

    const result = filterAndSortMeals(meals, 4);
    expect(result.map((m) => m.mealType)).toEqual([
      "breakfast",
      "mid_morning",
      "lunch",
      "snack",
      "dinner",
    ]);
  });
});
