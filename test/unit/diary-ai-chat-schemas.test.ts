import { describe, it, expect } from "vitest";

// RED: these imports will fail until T-01 is implemented in lib/schemas.ts
import { chatMessageSchema, suggestMealSchema } from "@/lib/schemas";

describe("chatMessageSchema", () => {
  it("accepts valid user message", () => {
    const result = chatMessageSchema.safeParse({ role: "user", text: "hello" });
    expect(result.success).toBe(true);
  });

  it("accepts valid assistant message", () => {
    const result = chatMessageSchema.safeParse({ role: "assistant", text: "Here is your suggestion" });
    expect(result.success).toBe(true);
  });

  it("rejects unknown role", () => {
    const result = chatMessageSchema.safeParse({ role: "system", text: "hello" });
    expect(result.success).toBe(false);
  });

  it("rejects empty text", () => {
    const result = chatMessageSchema.safeParse({ role: "user", text: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing role", () => {
    const result = chatMessageSchema.safeParse({ text: "hello" });
    expect(result.success).toBe(false);
  });

  it("rejects missing text", () => {
    const result = chatMessageSchema.safeParse({ role: "user" });
    expect(result.success).toBe(false);
  });
});

describe("suggestMealSchema — history extension", () => {
  const baseInput = {
    date: new Date("2024-01-15"),
    mealType: "lunch",
    query: "I want something light",
  };

  it("accepts valid input without history", () => {
    const result = suggestMealSchema.safeParse(baseInput);
    expect(result.success).toBe(true);
  });

  it("accepts valid input with empty history array", () => {
    const result = suggestMealSchema.safeParse({ ...baseInput, history: [] });
    expect(result.success).toBe(true);
  });

  it("accepts history with <= 20 messages", () => {
    const history = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      text: `message ${i}`,
    }));
    const result = suggestMealSchema.safeParse({ ...baseInput, history });
    expect(result.success).toBe(true);
  });

  it("rejects history with > 20 messages", () => {
    const history = Array.from({ length: 21 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      text: `message ${i}`,
    }));
    const result = suggestMealSchema.safeParse({ ...baseInput, history });
    expect(result.success).toBe(false);
  });

  it("rejects history with invalid message shape", () => {
    const result = suggestMealSchema.safeParse({
      ...baseInput,
      history: [{ role: "system", text: "inject" }],
    });
    expect(result.success).toBe(false);
  });
});
