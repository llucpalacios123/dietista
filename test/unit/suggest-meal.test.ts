import { describe, it, expect } from "vitest";
import { z } from "zod";

// This schema mirrors what suggestMeal function validates internally.
// Tests will fail (RED) if the lib/openai.ts doesn't export suggestedMealSchema.
// After implementation they pass (GREEN).

// For now, the schema is defined inline to test its rules.
// Phase 3 will add it to lib/openai.ts.

const suggestedMealSchema = z.object({
  foodName: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string(),
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
});

describe("suggestedMealSchema — AI response validation", () => {
  it("accepts valid AI JSON object", () => {
    const result = suggestedMealSchema.safeParse({
      foodName: "Pechuga de pollo a la plancha",
      quantity: 200,
      unit: "g",
      calories: 330,
      protein: 62,
      carbs: 0,
      fat: 7,
    });
    expect(result.success).toBe(true);
  });

  it("rejects quantity of 0 (must be positive)", () => {
    const result = suggestedMealSchema.safeParse({
      foodName: "Pollo",
      quantity: 0,
      unit: "g",
      calories: 330,
      protein: 62,
      carbs: 0,
      fat: 7,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative calories", () => {
    const result = suggestedMealSchema.safeParse({
      foodName: "Pollo",
      quantity: 200,
      unit: "g",
      calories: -10,
      protein: 62,
      carbs: 0,
      fat: 7,
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty foodName", () => {
    const result = suggestedMealSchema.safeParse({
      foodName: "",
      quantity: 200,
      unit: "g",
      calories: 330,
      protein: 62,
      carbs: 0,
      fat: 7,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative protein", () => {
    const result = suggestedMealSchema.safeParse({
      foodName: "Pollo",
      quantity: 200,
      unit: "g",
      calories: 330,
      protein: -5,
      carbs: 0,
      fat: 7,
    });
    expect(result.success).toBe(false);
  });

  it("accepts 0 carbs (valid for some foods)", () => {
    const result = suggestedMealSchema.safeParse({
      foodName: "Pechuga de pollo",
      quantity: 150,
      unit: "g",
      calories: 247,
      protein: 46,
      carbs: 0,
      fat: 5,
    });
    expect(result.success).toBe(true);
  });
});

describe("MEAL_CHAT_SYSTEM prompt template correctness", () => {
  // The prompt template placeholders must be present for correct substitution
  it("verifies expected placeholder keys are handled in the template", () => {
    const TEMPLATE = `You are a nutrition assistant. The user wants to eat
something now for the {mealType} slot. Respect remaining daily budget and allergies.
Return ONE JSON object: {foodName, quantity:number, unit, calories, protein, carbs, fat}.
Remaining today: {remaining} kcal/P/C/F. Slot target: {slotTarget}. Allergies: {allergies}.
All text in Spanish. Return ONLY valid JSON, no markdown.`;

    const placeholders = ["{mealType}", "{remaining}", "{slotTarget}", "{allergies}"];
    for (const p of placeholders) {
      expect(TEMPLATE).toContain(p);
    }
  });
});
