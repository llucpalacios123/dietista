import { describe, it, expect } from "vitest";
import { nutritionPlanSchema } from "@/lib/schemas";

// ─── Fixtures ─────────────────────────────────────────────────────────────

const validPayload = {
  dailyTargets: { calories: 2000, protein: 150, carbs: 200, fat: 60 },
  mealDistribution: {
    breakfast: { calories: 500, protein: 30, carbs: 60, fat: 15 },
    lunch: { calories: 700, protein: 55, carbs: 80, fat: 22 },
    dinner: { calories: 600, protein: 45, carbs: 60, fat: 20 },
    snack: { calories: 200, protein: 20, carbs: 0, fat: 3 },
  },
  recommendedFoods: {
    proteins: ["pollo", "atún"],
    carbohydrates: ["arroz", "avena"],
    vegetables: ["espinacas", "brócoli"],
    fruits: ["manzana", "plátano"],
    healthyFats: ["aguacate", "aceite de oliva"],
  },
  weeklyFrequency: { fishMeals: 3, legumeMeals: 2, redMeatMeals: 1 },
};

// ─── Tests ────────────────────────────────────────────────────────────────

describe("nutritionPlanSchema", () => {
  it("accepts a valid AI output payload", () => {
    const result = nutritionPlanSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("rejects missing dailyTargets", () => {
    const { dailyTargets: _, ...withoutTargets } = validPayload;
    const result = nutritionPlanSchema.safeParse(withoutTargets);
    expect(result.success).toBe(false);
  });

  it("rejects negative macro values in dailyTargets", () => {
    const payload = {
      ...validPayload,
      dailyTargets: { calories: -100, protein: 150, carbs: 200, fat: 60 },
    };
    const result = nutritionPlanSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("rejects malformed mealDistribution (non-numeric macro)", () => {
    const payload = {
      ...validPayload,
      mealDistribution: {
        breakfast: { calories: "not-a-number", protein: 30, carbs: 60, fat: 15 },
      },
    };
    const result = nutritionPlanSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("defaults missing recommendedFoods arrays to empty arrays", () => {
    const payload = {
      ...validPayload,
      recommendedFoods: {
        proteins: ["pollo"],
        // carbohydrates, vegetables, fruits, healthyFats omitted
      },
    };
    const result = nutritionPlanSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.recommendedFoods.carbohydrates).toEqual([]);
      expect(result.data.recommendedFoods.vegetables).toEqual([]);
      expect(result.data.recommendedFoods.fruits).toEqual([]);
      expect(result.data.recommendedFoods.healthyFats).toEqual([]);
    }
  });

  it("defaults weeklyFrequency to empty object when missing", () => {
    const { weeklyFrequency: _, ...withoutFrequency } = validPayload;
    const result = nutritionPlanSchema.safeParse(withoutFrequency);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.weeklyFrequency).toEqual({});
    }
  });

  it("accepts a mealDistribution with only some meal types (variable mealsPerDay)", () => {
    const payload = {
      ...validPayload,
      mealDistribution: {
        breakfast: { calories: 500, protein: 30, carbs: 60, fat: 15 },
        lunch: { calories: 700, protein: 55, carbs: 80, fat: 22 },
        dinner: { calories: 800, protein: 65, carbs: 60, fat: 23 },
      },
    };
    const result = nutritionPlanSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("infers the NutritionPlanStructure type correctly", () => {
    const result = nutritionPlanSchema.parse(validPayload);
    // Type-level assertion: dailyTargets.calories should be a number
    const calories: number = result.dailyTargets.calories;
    expect(typeof calories).toBe("number");
  });
});
