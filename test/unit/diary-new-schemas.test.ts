import { describe, it, expect } from "vitest";

// T-02: suggestedMealSchema — new optional fields
// T-03: saveSuggestedMealSchema — mealId optional
import { suggestedMealSchema, saveSuggestedMealSchema } from "@/lib/schemas";
// T-05: parseAiSuggestion — defensive helper
import { parseAiSuggestion } from "@/lib/ai-suggestion-parser";

// ─── T-02: suggestedMealSchema ────────────────────────────────────────────────

describe("suggestedMealSchema", () => {
  const baseValid = {
    foodName: "Pechuga de pollo a la plancha",
    quantity: 200,
    unit: "g",
    calories: 330,
    protein: 62,
    carbs: 0,
    fat: 7,
  };

  it("parses full suggestion (with description, ingredients, instructions)", () => {
    const result = suggestedMealSchema.safeParse({
      ...baseValid,
      description: "Plato rico en proteínas, ideal para la cena.",
      ingredients: [
        { name: "pechuga de pollo", quantity: 200, unit: "g" },
        { name: "aceite de oliva", quantity: 5, unit: "ml" },
      ],
      instructions: "Sazona el pollo y cocina a la plancha 5 minutos por cada lado.",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe("Plato rico en proteínas, ideal para la cena.");
      expect(result.data.ingredients).toHaveLength(2);
      expect(result.data.instructions).toBeTruthy();
    }
  });

  it("parses partial suggestion (missing optional fields)", () => {
    const result = suggestedMealSchema.safeParse(baseValid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeUndefined();
      expect(result.data.ingredients).toBeUndefined();
      expect(result.data.instructions).toBeUndefined();
    }
  });

  it("rejects suggestion missing required fields (foodName, macros)", () => {
    const result = suggestedMealSchema.safeParse({
      quantity: 200,
      unit: "g",
      // foodName missing
      calories: 330,
      protein: 62,
      // carbs missing
      fat: 7,
    });
    expect(result.success).toBe(false);
  });

  it("parses ingredients with only name (quantity and unit optional)", () => {
    const result = suggestedMealSchema.safeParse({
      ...baseValid,
      ingredients: [{ name: "sal" }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ingredients?.[0].name).toBe("sal");
      expect(result.data.ingredients?.[0].quantity).toBeUndefined();
      expect(result.data.ingredients?.[0].unit).toBeUndefined();
    }
  });

  it("rejects ingredient with empty name", () => {
    const result = suggestedMealSchema.safeParse({
      ...baseValid,
      ingredients: [{ name: "" }],
    });
    expect(result.success).toBe(false);
  });
});

// ─── T-03: saveSuggestedMealSchema ───────────────────────────────────────────

describe("saveSuggestedMealSchema", () => {
  const baseSuggestion = {
    foodName: "Grilled chicken",
    quantity: 200,
    unit: "g",
    calories: 330,
    protein: 62,
    carbs: 0,
    fat: 7,
  };

  it("accepts input with mealId", () => {
    const result = saveSuggestedMealSchema.safeParse({
      date: new Date("2024-01-15"),
      mealType: "dinner",
      mealId: "meal-abc-123",
      suggestion: baseSuggestion,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mealId).toBe("meal-abc-123");
    }
  });

  it("accepts input without mealId (legacy path)", () => {
    const result = saveSuggestedMealSchema.safeParse({
      date: new Date("2024-01-15"),
      mealType: "dinner",
      suggestion: baseSuggestion,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mealId).toBeUndefined();
    }
  });

  it("accepts suggestion with new optional fields when mealId is present", () => {
    const result = saveSuggestedMealSchema.safeParse({
      date: new Date("2024-01-15"),
      mealType: "lunch",
      mealId: "meal-xyz",
      suggestion: {
        ...baseSuggestion,
        description: "Plato ligero y proteico.",
        ingredients: [{ name: "pollo", quantity: 200, unit: "g" }],
        instructions: "Cocinar a la plancha.",
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.suggestion.description).toBe("Plato ligero y proteico.");
    }
  });
});

// ─── T-05: parseAiSuggestion ─────────────────────────────────────────────────

describe("parseAiSuggestion", () => {
  it("parses valid JSON object → returns it", () => {
    const obj = { foodName: "Pollo", quantity: 200, unit: "g", calories: 330, protein: 62, carbs: 0, fat: 7 };
    expect(parseAiSuggestion(obj)).toEqual(obj);
  });

  it("parses legacy string value → returns { foodName: value }", () => {
    const result = parseAiSuggestion("Grilled chicken 200g");
    expect(result).toEqual({ foodName: "Grilled chicken 200g" });
  });

  it("returns null for null input", () => {
    expect(parseAiSuggestion(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(parseAiSuggestion(undefined)).toBeNull();
  });

  it("returns the object as-is when it has any keys", () => {
    const obj = { foodName: "Ensalada", calories: 150, protein: 5, carbs: 20, fat: 8, quantity: 300, unit: "g" };
    const result = parseAiSuggestion(obj);
    expect(result).toMatchObject({ foodName: "Ensalada" });
  });
});
