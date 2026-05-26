import { describe, it, expect } from "vitest";
import { getMealTypeForHour, getCurrentMealInfo } from "@/lib/meal-schedule";
import type { MealType } from "@prisma/client";

describe("getMealTypeForHour", () => {
  const cases: [number, MealType | null][] = [
    [0, null],
    [1, null],
    [5, null],
    [5, null],
    [6, "breakfast"],
    [7, "breakfast"],
    [9, "breakfast"],
    [10, "mid_morning"],
    [11, "mid_morning"],
    [12, "lunch"],
    [13, "lunch"],
    [14, "lunch"],
    [15, "snack"],
    [16, "snack"],
    [18, "snack"],
    [19, "dinner"],
    [20, "dinner"],
    [22, "dinner"],
    [23, null],
  ];

  for (const [hour, expected] of cases) {
    const label = expected === null ? "null" : `"${expected}"`;
    it(`hour ${hour.toString().padStart(2, "0")}:00 → ${label}`, () => {
      expect(getMealTypeForHour(hour)).toBe(expected);
    });
  }
});

describe("getCurrentMealInfo", () => {
  it("returns null when no meals exist", () => {
    const result = getCurrentMealInfo([]);
    expect(result).toBeNull();
  });

  it("returns the current meal when time matches", () => {
    const now = new Date();
    const currentHour = now.getHours();
    const mealType = getMealTypeForHour(currentHour);

    if (mealType === null) {
      // Skip test when outside meal hours
      return;
    }

    const todaysWeekday = (now.getDay() + 6) % 7; // Monday=0
    const meals = [
      {
        id: "meal-1",
        mealPlanId: "plan-1",
        dayOfWeek: todaysWeekday,
        mealType,
        name: "Tortilla de patatas",
        description: "Con cebolla",
        calories: 400,
        protein: 20,
        carbs: 30,
        fat: 25,
        selectedOptions: null,
        translations: null,
      },
    ];

    const result = getCurrentMealInfo(meals);
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Tortilla de patatas");
    expect(result!.mealType).toBe(mealType);
  });

  it("returns null when meal exists but for wrong day", () => {
    const now = new Date();
    const currentHour = now.getHours();
    const mealType = getMealTypeForHour(currentHour);

    if (mealType === null) return;

    const todaysWeekday = (now.getDay() + 6) % 7;
    const wrongDay = (todaysWeekday + 1) % 7;

    const meals = [
      {
        id: "meal-1",
        mealPlanId: "plan-1",
        dayOfWeek: wrongDay,
        mealType,
        name: "Tortilla",
        description: "",
        calories: 400,
        protein: 20,
        carbs: 30,
        fat: 25,
        selectedOptions: null,
        translations: null,
      },
    ];

    expect(getCurrentMealInfo(meals)).toBeNull();
  });

  it("returns next meal when outside meal hours", () => {
    // Simulate 4 AM local time (outside meal hours)
    const testDate = new Date(2026, 4, 26, 4, 0, 0);
    // Tuesday = May 26 2026

    const meals = [
      {
        id: "meal-1",
        mealPlanId: "plan-1",
        dayOfWeek: 1, // Tuesday
        mealType: "breakfast" as MealType,
        name: "Desayuno martes",
        description: "",
        calories: 350,
        protein: 15,
        carbs: 40,
        fat: 15,
        selectedOptions: null,
        translations: null,
      },
      {
        id: "meal-2",
        mealPlanId: "plan-1",
        dayOfWeek: 1,
        mealType: "lunch" as MealType,
        name: "Almuerzo martes",
        description: "",
        calories: 600,
        protein: 40,
        carbs: 50,
        fat: 25,
        selectedOptions: null,
        translations: null,
      },
    ];

    const result = getCurrentMealInfo(meals, testDate);
    expect(result).not.toBeNull();
    // Should pick the soonest meal type that's upcoming today
    expect(result!.mealType).toBe("breakfast");
    expect(result!.name).toBe("Desayuno martes");
  });

  it("filters to today's meals only", () => {
    // Monday (0) at breakfast time (local)
    const testDate = new Date(2026, 4, 25, 8, 0, 0); // Monday 8 AM local

    const meals = [
      {
        id: "m1",
        mealPlanId: "plan-1",
        dayOfWeek: 0, // Monday
        mealType: "breakfast" as MealType,
        name: "Lunes desayuno",
        description: "",
        calories: 350,
        protein: 15,
        carbs: 40,
        fat: 15,
        selectedOptions: null as null,
        translations: null as null,
      },
      {
        id: "m2",
        mealPlanId: "plan-1",
        dayOfWeek: 1, // Tuesday
        mealType: "breakfast" as MealType,
        name: "Martes desayuno",
        description: "",
        calories: 300,
        protein: 12,
        carbs: 35,
        fat: 12,
        selectedOptions: null as null,
        translations: null as null,
      },
    ];

    const result = getCurrentMealInfo(meals, testDate);
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Lunes desayuno");
  });
});
