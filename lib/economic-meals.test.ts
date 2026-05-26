import { describe, it, expect } from "vitest";
import {
  buildIngredientUsage,
  canUseIngredient,
  estimateMealCost,
  estimateWeeklyCost,
  validateBudget,
  checkMacroCoherence,
  calculateDailyTotals,
  calculateWeeklyTotals,
  buildEconomicPrompt,
  MAX_CONSECUTIVE_DAYS,
  MAX_TOTAL_USES,
} from "@/lib/economic-meals";

describe("buildIngredientUsage", () => {
  it("returns empty map for empty meals", () => {
    const usage = buildIngredientUsage([]);
    expect(usage.size).toBe(0);
  });

  it("tracks single ingredient usage from structured ingredients", () => {
    const usage = buildIngredientUsage([
      { dayOfWeek: 0, ingredients: [{ name: "rice" }, { name: "beans" }] },
    ]);
    expect(usage.get("rice")).toEqual({
      consecutiveDays: 1,
      totalUses: 1,
      daysUsed: [0],
    });
    expect(usage.get("beans")).toEqual({
      consecutiveDays: 1,
      totalUses: 1,
      daysUsed: [0],
    });
  });

  it("tracks ingredient across multiple days", () => {
    const usage = buildIngredientUsage([
      { dayOfWeek: 0, ingredients: [{ name: "rice" }, { name: "chicken" }] },
      { dayOfWeek: 1, ingredients: [{ name: "rice" }, { name: "eggs" }] },
      { dayOfWeek: 2, ingredients: [{ name: "rice" }, { name: "chicken" }] },
    ]);
    expect(usage.get("rice")?.totalUses).toBe(3);
    expect(usage.get("rice")?.consecutiveDays).toBe(3);
    expect(usage.get("chicken")?.totalUses).toBe(2);
    expect(usage.get("chicken")?.consecutiveDays).toBe(1); // non-consecutive
  });

  it("handles ingredients case-insensitively", () => {
    const usage = buildIngredientUsage([
      { dayOfWeek: 0, ingredients: [{ name: "Rice" }, { name: "CHICKEN" }] },
      { dayOfWeek: 1, ingredients: [{ name: "rice" }, { name: "Chicken" }] },
    ]);
    expect(usage.get("rice")?.totalUses).toBe(2);
    expect(usage.get("chicken")?.totalUses).toBe(2);
  });

  it("skips meals without ingredients", () => {
    const usage = buildIngredientUsage([
      { dayOfWeek: 0 },
      { dayOfWeek: 1, ingredients: [{ name: "rice" }] },
    ]);
    expect(usage.get("rice")?.totalUses).toBe(1);
  });

  it("ignores quantity and unit fields, only tracks by name", () => {
    const usage = buildIngredientUsage([
      { dayOfWeek: 0, ingredients: [{ name: "rice", quantity: 100, unit: "g" }] },
      { dayOfWeek: 1, ingredients: [{ name: "rice", quantity: 200, unit: "g" }] },
      { dayOfWeek: 2, ingredients: [{ name: "rice", quantity: 50, unit: "tazas" }] },
    ]);
    expect(usage.get("rice")?.totalUses).toBe(3);
    expect(usage.get("rice")?.consecutiveDays).toBe(3);
  });
});

describe("canUseIngredient", () => {
  it("allows unused ingredient", () => {
    const usage = buildIngredientUsage([
      { dayOfWeek: 0, ingredients: [{ name: "rice" }] },
    ]);
    expect(canUseIngredient("chicken", 1, usage)).toBe(true);
  });

  it("allows ingredient on non-consecutive day", () => {
    const usage = buildIngredientUsage([
      { dayOfWeek: 0, ingredients: [{ name: "chicken" }] },
    ]);
    expect(canUseIngredient("chicken", 2, usage)).toBe(true);
  });

  it("blocks ingredient after max consecutive days", () => {
    const usage = buildIngredientUsage([
      { dayOfWeek: 0, ingredients: [{ name: "chicken" }] },
      { dayOfWeek: 1, ingredients: [{ name: "chicken" }] },
      { dayOfWeek: 2, ingredients: [{ name: "chicken" }] },
    ]);
    // Day 2 makes it 3 consecutive, day 3 would be 4
    expect(canUseIngredient("chicken", 3, usage)).toBe(false);
  });

  it("blocks ingredient after max total uses", () => {
    // Simulate 5 uses
    const meals = Array.from({ length: 5 }, (_, i) => ({
      dayOfWeek: i,
      ingredients: [{ name: "chicken" }],
    }));
    const usage = buildIngredientUsage(meals);
    expect(canUseIngredient("chicken", 6, usage)).toBe(false);
  });
});

describe("estimateMealCost", () => {
  it("returns 1.50 for empty ingredients", () => {
    expect(estimateMealCost([])).toBe(1.50);
  });

  it("estimates cost from known ingredients", () => {
    const cost = estimateMealCost(["rice", "eggs", "bananas"]);
    expect(cost).toBe(0.55); // 0.15 + 0.25 + 0.15
  });

  it("scales up for unknown ingredients proportionally", () => {
    const cost = estimateMealCost(["rice", "unknown_ingredient"]);
    // rice = 0.15, avg = 0.15, unknown = 0.15 → total = 0.30
    expect(cost).toBeGreaterThan(0);
    expect(cost).toBeLessThan(3);
  });

  it("is case-insensitive", () => {
    const cost = estimateMealCost(["RICE", "Rice"]);
    expect(cost).toBe(0.30);
  });
});

describe("estimateWeeklyCost", () => {
  it("returns 0 for empty plan", () => {
    expect(estimateWeeklyCost([])).toBe(0);
  });

  it("estimates full week cost", () => {
    const days = [
      { meals: [{ ingredients: ["rice", "chicken thighs"] }, { ingredients: ["eggs"] }] },
      { meals: [{ ingredients: ["oats"] }] },
    ];
    const cost = estimateWeeklyCost(days);
    expect(cost).toBeGreaterThan(0);
  });
});

describe("validateBudget", () => {
  it("returns withinBudget=true when cost <= budget", () => {
    const result = validateBudget(45, 50);
    expect(result.withinBudget).toBe(true);
    expect(result.difference).toBe(5);
  });

  it("returns withinBudget=false when cost > budget", () => {
    const result = validateBudget(55, 50);
    expect(result.withinBudget).toBe(false);
    expect(result.difference).toBe(-5);
  });

  it("returns withinBudget=true when equal", () => {
    const result = validateBudget(50, 50);
    expect(result.withinBudget).toBe(true);
    expect(result.difference).toBe(0);
  });
});

describe("checkMacroCoherence", () => {
  const base = { calories: 2000, protein: 150, carbs: 200, fat: 65 };

  it("passes for identical macros", () => {
    const result = checkMacroCoherence(base, base);
    expect(result.withinTolerance).toBe(true);
  });

  it("passes within 5% tolerance", () => {
    const modified = { calories: 2050, protein: 155, carbs: 208, fat: 63 };
    const result = checkMacroCoherence(base, modified);
    expect(result.withinTolerance).toBe(true);
  });

  it("fails when calories deviate > 5%", () => {
    const modified = { calories: 2200, protein: 150, carbs: 200, fat: 65 };
    const result = checkMacroCoherence(base, modified);
    expect(result.withinTolerance).toBe(false);
    expect(result.deviations.calories.percentage).toBeGreaterThan(5);
  });

  it("fails when protein drops > 5%", () => {
    const modified = { calories: 2000, protein: 130, carbs: 200, fat: 65 };
    const result = checkMacroCoherence(base, modified);
    expect(result.withinTolerance).toBe(false);
  });

  it("handles zero original values safely", () => {
    const zero = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const result = checkMacroCoherence(zero, zero);
    expect(result.withinTolerance).toBe(true);
  });
});

describe("calculateDailyTotals", () => {
  it("sums macros across meals", () => {
    const totals = calculateDailyTotals([
      { calories: 300, protein: 20, carbs: 40, fat: 10 },
      { calories: 500, protein: 35, carbs: 55, fat: 15 },
      { calories: 400, protein: 30, carbs: 45, fat: 12 },
    ]);
    expect(totals).toEqual({
      calories: 1200,
      protein: 85,
      carbs: 140,
      fat: 37,
    });
  });

  it("returns zeros for empty meals", () => {
    const totals = calculateDailyTotals([]);
    expect(totals).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });
});

describe("calculateWeeklyTotals", () => {
  it("sums macros across days", () => {
    const totals = calculateWeeklyTotals([
      { dailyTotals: { calories: 2000, protein: 150, carbs: 200, fat: 65 } },
      { dailyTotals: { calories: 1800, protein: 140, carbs: 190, fat: 60 } },
    ]);
    expect(totals).toEqual({
      calories: 3800,
      protein: 290,
      carbs: 390,
      fat: 125,
    });
  });
});

describe("buildEconomicPrompt", () => {
  it("returns empty string when budgetFriendly is false", () => {
    const prompt = buildEconomicPrompt({ budgetFriendly: false });
    expect(prompt).toBe("");
  });

  it("includes budget-friendly rules when enabled", () => {
    const prompt = buildEconomicPrompt({ budgetFriendly: true });
    expect(prompt).toContain("Economic Mode");
    expect(prompt).toContain("Ingredient Reuse Rules");
    expect(prompt).toContain("Cheap Food Prioritization");
  });

  it("includes budget constraint when budget is set", () => {
    const prompt = buildEconomicPrompt({ budgetFriendly: true, budget: 50 });
    expect(prompt).toContain("Budget Constraint");
    expect(prompt).toContain("$50");
  });

  it("includes simple complexity instructions", () => {
    const prompt = buildEconomicPrompt({
      budgetFriendly: true,
      mealComplexity: "simple",
    });
    expect(prompt).toContain("Simple Meal Complexity");
    expect(prompt).toContain("20 minutes or less");
  });
});
