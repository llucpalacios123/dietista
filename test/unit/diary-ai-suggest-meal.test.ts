import { describe, it, expect, vi, beforeEach } from "vitest";

// mockCreate is defined inside the factory to avoid hoisting issues.
// We expose it via module state so tests can configure and inspect it.
const mockCreate = vi.hoisted(() => vi.fn());

vi.mock("openai", () => {
  return {
    default: class MockOpenAI {
      chat = {
        completions: {
          create: mockCreate,
        },
      };
    },
  };
});

import { suggestMealResponseSchema, suggestMeal } from "@/lib/openai";
import type { ChatMessage } from "@/lib/schemas";

describe("suggestMealResponseSchema", () => {
  it("accepts valid envelope with message and suggestion", () => {
    const result = suggestMealResponseSchema.safeParse({
      message: "Here is a great option for you.",
      suggestion: {
        foodName: "Pechuga de pollo",
        quantity: 200,
        unit: "g",
        calories: 330,
        protein: 62,
        carbs: 0,
        fat: 7,
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing message field", () => {
    const result = suggestMealResponseSchema.safeParse({
      suggestion: {
        foodName: "Pechuga de pollo",
        quantity: 200,
        unit: "g",
        calories: 330,
        protein: 62,
        carbs: 0,
        fat: 7,
      },
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty message string", () => {
    const result = suggestMealResponseSchema.safeParse({
      message: "",
      suggestion: {
        foodName: "Pollo",
        quantity: 200,
        unit: "g",
        calories: 330,
        protein: 62,
        carbs: 0,
        fat: 7,
      },
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing suggestion field", () => {
    const result = suggestMealResponseSchema.safeParse({
      message: "A great option!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid suggestion (negative quantity)", () => {
    const result = suggestMealResponseSchema.safeParse({
      message: "A great option!",
      suggestion: {
        foodName: "Pollo",
        quantity: -1,
        unit: "g",
        calories: 330,
        protein: 62,
        carbs: 0,
        fat: 7,
      },
    });
    expect(result.success).toBe(false);
  });
});

describe("suggestMeal — history threading", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds messages array as [system, ...history, {role:user, content:query}]", async () => {
    const history: ChatMessage[] = [
      { role: "user", text: "I want something light" },
      { role: "assistant", text: "How about a salad?" },
    ];

    const mockResponse = {
      message: "Here is your grilled chicken option.",
      suggestion: {
        foodName: "Pechuga a la plancha",
        quantity: 200,
        unit: "g",
        calories: 330,
        protein: 62,
        carbs: 0,
        fat: 7,
      },
    };

    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(mockResponse) } }],
    });

    const result = await suggestMeal({
      mealType: "lunch",
      query: "actually give me chicken",
      remaining: { cal: 1500, pro: 120, carb: 200, fat: 50 },
      allergies: [],
      history,
    });

    expect(result.message).toBe(mockResponse.message);
    expect(result.suggestion).toEqual(mockResponse.suggestion);

    // Verify the messages array shape
    const calledWith = mockCreate.mock.calls[0][0];
    const messages = calledWith.messages;

    expect(messages[0].role).toBe("system");
    expect(messages[1]).toEqual({ role: "user", content: "I want something light" });
    expect(messages[2]).toEqual({ role: "assistant", content: "How about a salad?" });
    expect(messages[3]).toEqual({ role: "user", content: "actually give me chicken" });
  });

  it("builds messages as [system, {role:user, content:query}] when no history", async () => {
    const mockResponse = {
      message: "Here is your option.",
      suggestion: {
        foodName: "Ensalada mixta",
        quantity: 300,
        unit: "g",
        calories: 200,
        protein: 10,
        carbs: 20,
        fat: 8,
      },
    };

    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(mockResponse) } }],
    });

    await suggestMeal({
      mealType: "lunch",
      query: "give me a salad",
      remaining: { cal: 1500, pro: 120, carb: 200, fat: 50 },
      allergies: [],
    });

    const calledWith = mockCreate.mock.calls[0][0];
    const messages = calledWith.messages;

    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe("system");
    expect(messages[1]).toEqual({ role: "user", content: "give me a salad" });
  });
});
