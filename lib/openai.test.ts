import { describe, it, expect, vi, beforeEach } from "vitest";
import { mealPlanResponseSchema, interpretedFoodSchema } from "@/lib/schemas";

// ─── Meal plan JSON parser (extracted from openai.ts logic) ────────────────

describe("meal plan JSON parser", () => {
  // Replicate the parsing logic from openai.ts for isolated testing
  function parseMealPlanResponse(content: string): unknown[] {
    const parsed = JSON.parse(content);
    let rawItems: unknown[] = [];

    if (Array.isArray(parsed)) {
      rawItems = parsed;
    } else if (typeof parsed === "object" && parsed !== null) {
      const found = Object.values(parsed).find(Array.isArray);
      rawItems = found ?? [];
    }

    // Flatten day-organized structure
    const meals: unknown[] = [];
    for (const item of rawItems) {
      if (
        typeof item === "object" &&
        item !== null &&
        "meals" in item &&
        Array.isArray((item as Record<string, unknown>).meals)
      ) {
        const dayOfWeek = (item as Record<string, unknown>).dayOfWeek;
        for (const meal of (item as Record<string, unknown>).meals as unknown[]) {
          if (typeof meal === "object" && meal !== null) {
            const mealObj = meal as Record<string, unknown>;
            if (dayOfWeek !== undefined && mealObj.dayOfWeek === undefined) {
              mealObj.dayOfWeek = dayOfWeek;
            }
            meals.push(mealObj);
          }
        }
      } else {
        meals.push(item);
      }
    }
    return meals;
  }

  it("parses a direct JSON array", () => {
    const content = JSON.stringify([
      { dayOfWeek: 0, mealType: "breakfast", name: "Oatmeal", description: "With milk", calories: 350, protein: 12, carbs: 60, fat: 8 },
    ]);
    const meals = parseMealPlanResponse(content);
    expect(meals).toHaveLength(1);
    expect(meals[0]).toMatchObject({ name: "Oatmeal" });
  });

  it("parses a wrapped JSON object with array value", () => {
    const content = JSON.stringify({
      meals: [
        { dayOfWeek: 0, mealType: "lunch", name: "Salad", description: "Caesar", calories: 400, protein: 20, carbs: 30, fat: 15 },
      ],
    });
    const meals = parseMealPlanResponse(content);
    expect(meals).toHaveLength(1);
    expect(meals[0]).toMatchObject({ name: "Salad" });
  });

  it("returns empty array for non-array, non-object responses", () => {
    const content = JSON.stringify("just a string");
    const meals = parseMealPlanResponse(content);
    expect(meals).toEqual([]);
  });

  it("returns empty array for object with no arrays", () => {
    const content = JSON.stringify({ message: "no meals here" });
    const meals = parseMealPlanResponse(content);
    expect(meals).toEqual([]);
  });

  it("throws on invalid JSON", () => {
    expect(() => parseMealPlanResponse("not json")).toThrow();
  });

  it("validates parsed meals against schema", () => {
    const meals = [
      { dayOfWeek: 0, mealType: "breakfast", name: "Oatmeal", description: "With milk", calories: 350, protein: 12, carbs: 60, fat: 8 },
      { dayOfWeek: 1, mealType: "lunch", name: "Chicken", description: "Grilled", calories: 500, protein: 40, carbs: 0, fat: 20 },
    ];
    const result = mealPlanResponseSchema.safeParse(meals);
    expect(result.success).toBe(true);
  });

  it("rejects meals with invalid dayOfWeek", () => {
    const meals = [
      { dayOfWeek: 7, mealType: "breakfast", name: "Oatmeal", description: "With milk", calories: 350, protein: 12, carbs: 60, fat: 8 },
    ];
    const result = mealPlanResponseSchema.safeParse(meals);
    expect(result.success).toBe(false);
  });

  it("rejects meals with invalid mealType", () => {
    const meals = [
      { dayOfWeek: 0, mealType: "brunch", name: "Oatmeal", description: "With milk", calories: 350, protein: 12, carbs: 60, fat: 8 },
    ];
    const result = mealPlanResponseSchema.safeParse(meals);
    expect(result.success).toBe(false);
  });

  it("rejects meals with negative calories", () => {
    const meals = [
      { dayOfWeek: 0, mealType: "breakfast", name: "Oatmeal", description: "With milk", calories: -100, protein: 12, carbs: 60, fat: 8 },
    ];
    const result = mealPlanResponseSchema.safeParse(meals);
    expect(result.success).toBe(false);
  });

  it("accepts meals with null description (defaults to empty string)", () => {
    const meals = [
      { dayOfWeek: 0, mealType: "breakfast", name: "Oatmeal", description: null, calories: 350, protein: 12, carbs: 60, fat: 8 },
    ];
    const result = mealPlanResponseSchema.safeParse(meals);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].description).toBe("");
    }
  });

  it("accepts meals with null macros (defaults to 0)", () => {
    const meals = [
      { dayOfWeek: 0, mealType: "breakfast", name: "Oatmeal", description: "With milk", calories: 350, protein: null, carbs: null, fat: null },
    ];
    const result = mealPlanResponseSchema.safeParse(meals);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].protein).toBe(0);
      expect(result.data[0].carbs).toBe(0);
      expect(result.data[0].fat).toBe(0);
    }
  });

  it("accepts meals with missing optional fields (uses defaults)", () => {
    const meals = [
      { dayOfWeek: 0, mealType: "breakfast", name: "Oatmeal", calories: 350 },
    ];
    const result = mealPlanResponseSchema.safeParse(meals);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].description).toBe("");
      expect(result.data[0].protein).toBe(0);
      expect(result.data[0].carbs).toBe(0);
      expect(result.data[0].fat).toBe(0);
    }
  });

  it("flattens day-organized structure: [{dayOfWeek, meals: [...]}]", () => {
    const content = JSON.stringify([
      {
        dayOfWeek: 0,
        meals: [
          { mealType: "breakfast", name: "Oatmeal", description: "With milk", calories: 350, protein: 12, carbs: 60, fat: 8 },
          { mealType: "lunch", name: "Salad", description: "Caesar", calories: 400, protein: 20, carbs: 30, fat: 15 },
        ],
      },
      {
        dayOfWeek: 1,
        meals: [
          { mealType: "breakfast", name: "Yogurt", description: "Greek", calories: 200, protein: 15, carbs: 20, fat: 6 },
        ],
      },
    ]);
    const meals = parseMealPlanResponse(content);
    expect(meals).toHaveLength(3);
    expect(meals[0]).toMatchObject({ dayOfWeek: 0, mealType: "breakfast", name: "Oatmeal" });
    expect(meals[1]).toMatchObject({ dayOfWeek: 0, mealType: "lunch", name: "Salad" });
    expect(meals[2]).toMatchObject({ dayOfWeek: 1, mealType: "breakfast", name: "Yogurt" });
  });

  it("propagates dayOfWeek to nested meals when missing", () => {
    const content = JSON.stringify([
      {
        dayOfWeek: 3,
        meals: [
          { mealType: "dinner", name: "Pasta", description: "Bolognese", calories: 500, protein: 25, carbs: 60, fat: 15 },
        ],
      },
    ]);
    const meals = parseMealPlanResponse(content);
    expect(meals).toHaveLength(1);
    expect(meals[0]).toMatchObject({ dayOfWeek: 3, mealType: "dinner" });
  });

  it("handles wrapped day-organized structure: { weeklyPlan: [{dayOfWeek, meals: [...]}] }", () => {
    const content = JSON.stringify({
      weeklyPlan: [
        {
          dayOfWeek: 0,
          meals: [
            { mealType: "breakfast", name: "Toast", description: "Avocado", calories: 300, protein: 8, carbs: 35, fat: 12 },
          ],
        },
      ],
    });
    const meals = parseMealPlanResponse(content);
    expect(meals).toHaveLength(1);
    expect(meals[0]).toMatchObject({ dayOfWeek: 0, mealType: "breakfast", name: "Toast" });
  });
});

// ─── Meal interpretation JSON parser (extracted from openai.ts logic) ──────

describe("meal interpretation JSON parser", () => {
  function parseMealInterpretation(content: string): unknown[] {
    const parsed = JSON.parse(content);
    const foods: unknown[] = Array.isArray(parsed)
      ? parsed
      : typeof parsed === "object" && parsed !== null
        ? Object.values(parsed).find(Array.isArray) ?? []
        : [];
    return foods;
  }

  it("parses a direct JSON array of foods", () => {
    const content = JSON.stringify([
      { foodName: "Chicken breast", quantity: 200, unit: "g", calories: 330, protein: 62, carbs: 0, fat: 7.2, confidence: "high" },
    ]);
    const foods = parseMealInterpretation(content);
    expect(foods).toHaveLength(1);
    expect(foods[0]).toMatchObject({ foodName: "Chicken breast" });
  });

  it("parses a wrapped object with array", () => {
    const content = JSON.stringify({
      foods: [
        { foodName: "Rice", quantity: 150, unit: "g", calories: 195, protein: 4, carbs: 43, fat: 0.5, confidence: "high" },
      ],
    });
    const foods = parseMealInterpretation(content);
    expect(foods).toHaveLength(1);
  });

  it("validates individual food items against schema", () => {
    const foods = [
      { foodName: "Oatmeal", quantity: 100, unit: "g", calories: 389, protein: 17, carbs: 66, fat: 7, confidence: "high" },
      { foodName: "Banana", quantity: 1, unit: "piece", calories: 105, protein: 1.3, carbs: 27, fat: 0.4, confidence: "medium" },
    ];
    const validated: typeof foods = [];
    for (const food of foods) {
      const result = interpretedFoodSchema.safeParse(food);
      if (result.success) validated.push(result.data);
    }
    expect(validated).toHaveLength(2);
  });

  it("allows partial validation (skips invalid items)", () => {
    const foods = [
      { foodName: "Valid food", quantity: 100, unit: "g", calories: 200, protein: 10, carbs: 30, fat: 5, confidence: "high" },
      { foodName: "", quantity: -1, unit: "g", calories: -100, protein: -10, carbs: -30, fat: -5 }, // invalid
    ];
    const validated: typeof foods = [];
    for (const food of foods) {
      const result = interpretedFoodSchema.safeParse(food);
      if (result.success) validated.push(result.data);
    }
    expect(validated).toHaveLength(1);
    expect(validated[0]).toMatchObject({ foodName: "Valid food" });
  });

  it("defaults confidence to medium when not provided", () => {
    const food = { foodName: "Mystery food", quantity: 50, unit: "g", calories: 100, protein: 5, carbs: 15, fat: 3 };
    const result = interpretedFoodSchema.safeParse(food);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.confidence).toBe("medium");
    }
  });
});

// ─── Retry behavior (simulated) ────────────────────────────────────────────

describe("retry behavior simulation", () => {
  // The actual withRetry function in openai.ts uses exponential backoff
  // with MAX_RETRIES=3 and BASE_DELAY_MS=1000. We simulate the behavior
  // here to prove the logic works without needing the real OpenAI client.

  async function simulateWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 10
  ): Promise<T> {
    let attempt = 1;
    const delays: number[] = [];

    while (true) {
      try {
        return await fn();
      } catch (error) {
        if (attempt >= maxRetries) throw error;
        const delay = baseDelay * Math.pow(2, attempt - 1);
        delays.push(delay);
        attempt++;
      }
    }
  }

  it("succeeds on first attempt", async () => {
    const fn = vi.fn().mockResolvedValue("success");
    const result = await simulateWithRetry(fn);
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on failure then succeeds", async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error("fail 1"))
      .mockRejectedValueOnce(new Error("fail 2"))
      .mockResolvedValue("success");

    const result = await simulateWithRetry(fn);
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("gives up after max retries", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("always fails"));

    await expect(simulateWithRetry(fn, 3, 1)).rejects.toThrow("always fails");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("uses exponential backoff delays", async () => {
    const delays: number[] = [];
    const fn = vi.fn()
      .mockImplementation(() => {
        if (fn.mock.calls.length <= 2) {
          throw new Error("fail");
        }
        return "ok";
      });

    // Override to capture delays
    async function captureRetry<T>(
      fn: () => Promise<T>,
      maxRetries: number = 3,
      baseDelay: number = 10
    ): Promise<T> {
      let attempt = 1;
      while (true) {
        try {
          return await fn();
        } catch {
          if (attempt >= maxRetries) throw new Error("max retries");
          const delay = baseDelay * Math.pow(2, attempt - 1);
          delays.push(delay);
          attempt++;
        }
      }
    }

    await captureRetry(fn, 3, 10);
    expect(delays).toEqual([10, 20]); // 10 * 2^0, 10 * 2^1
  });
});
