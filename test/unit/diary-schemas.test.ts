import { describe, it, expect } from "vitest";

// These imports will fail (RED) until we add the schemas to lib/schemas.ts
// and implement actions/diary-new.ts
import {
  toggleMealCompletedSchema,
  suggestMealSchema,
} from "@/lib/schemas";

describe("toggleMealCompletedSchema", () => {
  it("accepts valid input with date, mealType, and optional mealId", () => {
    const result = toggleMealCompletedSchema.safeParse({
      date: new Date("2024-01-15"),
      mealType: "breakfast",
    });
    expect(result.success).toBe(true);
  });

  it("accepts input with mealId", () => {
    const result = toggleMealCompletedSchema.safeParse({
      date: new Date("2024-01-15"),
      mealType: "lunch",
      mealId: "meal-abc",
    });
    expect(result.success).toBe(true);
  });

  it("accepts input with macros", () => {
    const result = toggleMealCompletedSchema.safeParse({
      date: new Date("2024-01-15"),
      mealType: "dinner",
      macros: { calories: 600, protein: 40, carbs: 70, fat: 20 },
    });
    expect(result.success).toBe(true);
  });

  it("coerces string date to Date", () => {
    const result = toggleMealCompletedSchema.safeParse({
      date: "2024-01-15",
      mealType: "breakfast",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.date).toBeInstanceOf(Date);
    }
  });

  it("rejects invalid mealType", () => {
    const result = toggleMealCompletedSchema.safeParse({
      date: new Date("2024-01-15"),
      mealType: "brunch",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing date", () => {
    const result = toggleMealCompletedSchema.safeParse({
      mealType: "breakfast",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative macros calories", () => {
    const result = toggleMealCompletedSchema.safeParse({
      date: new Date("2024-01-15"),
      mealType: "lunch",
      macros: { calories: -10, protein: 40, carbs: 70, fat: 20 },
    });
    expect(result.success).toBe(false);
  });
});

describe("suggestMealSchema", () => {
  it("accepts valid input", () => {
    const result = suggestMealSchema.safeParse({
      date: new Date("2024-01-15"),
      mealType: "dinner",
      query: "Something with chicken",
    });
    expect(result.success).toBe(true);
  });

  it("coerces string date to Date", () => {
    const result = suggestMealSchema.safeParse({
      date: "2024-01-15",
      mealType: "breakfast",
      query: "Something healthy",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.date).toBeInstanceOf(Date);
    }
  });

  it("rejects empty query", () => {
    const result = suggestMealSchema.safeParse({
      date: new Date("2024-01-15"),
      mealType: "lunch",
      query: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects query over 280 chars", () => {
    const result = suggestMealSchema.safeParse({
      date: new Date("2024-01-15"),
      mealType: "lunch",
      query: "a".repeat(281),
    });
    expect(result.success).toBe(false);
  });

  it("accepts query at exactly 280 chars", () => {
    const result = suggestMealSchema.safeParse({
      date: new Date("2024-01-15"),
      mealType: "lunch",
      query: "a".repeat(280),
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid mealType", () => {
    const result = suggestMealSchema.safeParse({
      date: new Date("2024-01-15"),
      mealType: "brunch",
      query: "Something healthy",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing query", () => {
    const result = suggestMealSchema.safeParse({
      date: new Date("2024-01-15"),
      mealType: "lunch",
    });
    expect(result.success).toBe(false);
  });
});
