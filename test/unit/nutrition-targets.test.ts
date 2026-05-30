import { describe, it, expect } from "vitest";
import { calculateTargets, coalescePreferences } from "@/lib/nutrition-targets";

// ─── Fixtures ─────────────────────────────────────────────────────────────

const maleProfile = {
  weight: 80,
  height: 180,
  age: 30,
  sex: "male" as const,
  goal: "maintain" as const,
  activityLevel: "moderate" as const,
  targetCalories: null,
  targetProtein: null,
  targetCarbs: null,
  targetFat: null,
  allergies: ["lactose"],
  forbiddenFoods: ["pork"],
  dietType: "omnivore" as const,
  cookingTimeAvailable: 30,
  eatingOutFrequency: "rarely" as const,
  includeSnacks: false,
  mealComplexity: "moderate" as const,
  mealsPerDay: 3,
  varietyPreference: "medium" as const,
  budgetFriendly: false,
  weeklyBudget: null,
  favoriteFoods: ["chicken"],
};

const femaleProfile = {
  ...maleProfile,
  sex: "female" as const,
  weight: 60,
  height: 165,
  age: 25,
};

// ─── Mifflin-St Jeor BMR tests ────────────────────────────────────────────

describe("calculateTargets — Mifflin-St Jeor BMR", () => {
  it("calculates male BMR correctly", () => {
    // BMR male = 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    // TDEE moderate = 1780 * 1.55 = 2759
    // maintain → no adjustment → 2759 rounded = 2759
    const targets = calculateTargets(maleProfile);
    expect(targets.calories).toBe(Math.round(1780 * 1.55));
  });

  it("calculates female BMR correctly", () => {
    // BMR female = 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25
    // TDEE moderate = 1345.25 * 1.55 = 2085.14
    // maintain → 2085 rounded
    const targets = calculateTargets(femaleProfile);
    expect(targets.calories).toBe(Math.round(1345.25 * 1.55));
  });

  it("applies sedentary activity multiplier (1.2)", () => {
    const profile = { ...maleProfile, activityLevel: "sedentary" as const };
    // BMR male = 1780; TDEE = 1780 * 1.2 = 2136
    expect(calculateTargets(profile).calories).toBe(Math.round(1780 * 1.2));
  });

  it("applies light activity multiplier (1.375)", () => {
    const profile = { ...maleProfile, activityLevel: "light" as const };
    expect(calculateTargets(profile).calories).toBe(Math.round(1780 * 1.375));
  });

  it("applies active activity multiplier (1.725)", () => {
    const profile = { ...maleProfile, activityLevel: "active" as const };
    expect(calculateTargets(profile).calories).toBe(Math.round(1780 * 1.725));
  });

  it("applies veryActive activity multiplier (1.9)", () => {
    const profile = { ...maleProfile, activityLevel: "veryActive" as const };
    expect(calculateTargets(profile).calories).toBe(Math.round(1780 * 1.9));
  });

  it("subtracts 500 kcal for lose goal", () => {
    const profile = { ...maleProfile, goal: "lose" as const };
    const tdee = Math.round(1780 * 1.55);
    expect(calculateTargets(profile).calories).toBe(tdee - 500);
  });

  it("adds 300 kcal for gain goal", () => {
    const profile = { ...maleProfile, goal: "gain" as const };
    const tdee = Math.round(1780 * 1.55);
    expect(calculateTargets(profile).calories).toBe(tdee + 300);
  });

  it("returns protein based on weight and goal", () => {
    const targets = calculateTargets(maleProfile); // maintain, 80kg → 1.6 g/kg
    expect(targets.protein).toBe(Math.round(80 * 1.6));
  });

  it("returns higher protein multiplier for lose goal (2.2 g/kg)", () => {
    const profile = { ...maleProfile, goal: "lose" as const };
    const targets = calculateTargets(profile);
    expect(targets.protein).toBe(Math.round(80 * 2.2));
  });

  it("returns protein 1.8 g/kg for gain goal", () => {
    const profile = { ...maleProfile, goal: "gain" as const };
    const targets = calculateTargets(profile);
    expect(targets.protein).toBe(Math.round(80 * 1.8));
  });

  it("returns carbs and fat as positive numbers", () => {
    const targets = calculateTargets(maleProfile);
    expect(targets.carbs).toBeGreaterThan(0);
    expect(targets.fat).toBeGreaterThan(0);
  });

  it("respects explicit targetCalories from profile when provided", () => {
    const profile = { ...maleProfile, targetCalories: 1800 };
    const targets = calculateTargets(profile);
    expect(targets.calories).toBe(1800);
  });
});

// ─── coalescePreferences tests ────────────────────────────────────────────

describe("coalescePreferences", () => {
  it("returns profile values when no preferences are passed", () => {
    const eff = coalescePreferences(maleProfile);
    expect(eff.allergies).toEqual(["lactose"]);
    expect(eff.forbiddenFoods).toEqual(["pork"]);
    expect(eff.mealsPerDay).toBe(3);
    expect(eff.dietType).toBe("omnivore");
  });

  it("overrides allergies when preferences array is non-empty — array override", () => {
    const eff = coalescePreferences(maleProfile, {
      allergies: ["nuts", "gluten"],
      dislikedFoods: [],
    } as any);
    expect(eff.allergies).toEqual(["nuts", "gluten"]);
  });

  it("falls back to profile allergies when preferences array is empty — array fallback", () => {
    const eff = coalescePreferences(maleProfile, {
      allergies: [],
      dislikedFoods: [],
    } as any);
    expect(eff.allergies).toEqual(["lactose"]);
  });

  it("maps dislikedFoods to forbiddenFoods when preferences array is non-empty", () => {
    const eff = coalescePreferences(maleProfile, {
      allergies: [],
      dislikedFoods: ["beef", "lamb"],
    } as any);
    expect(eff.forbiddenFoods).toEqual(["beef", "lamb"]);
  });

  it("falls back to profile forbiddenFoods when dislikedFoods is empty", () => {
    const eff = coalescePreferences(maleProfile, {
      allergies: [],
      dislikedFoods: [],
    } as any);
    expect(eff.forbiddenFoods).toEqual(["pork"]);
  });

  it("overrides dietType when preferences scalar is non-null", () => {
    const eff = coalescePreferences(maleProfile, { dietType: "vegan" } as any);
    expect(eff.dietType).toBe("vegan");
  });

  it("falls back to profile dietType when preferences scalar is null", () => {
    const eff = coalescePreferences(maleProfile, { dietType: null } as any);
    expect(eff.dietType).toBe("omnivore");
  });

  it("overrides mealsPerDay when preferences provides a value", () => {
    const eff = coalescePreferences(maleProfile, { mealsPerDay: 5 } as any);
    expect(eff.mealsPerDay).toBe(5);
  });
});
