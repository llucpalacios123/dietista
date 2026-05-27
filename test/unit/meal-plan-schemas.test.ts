import { describe, it, expect } from "vitest";
import { renamePlanSchema } from "@/lib/schemas";

// ─── renamePlanSchema ─────────────────────────────────────────────────────

describe("renamePlanSchema", () => {
  it("accepts empty string (empty name clears to null in the action)", () => {
    const result = renamePlanSchema.safeParse({ name: "" });
    expect(result.success).toBe(true);
  });

  it("accepts a single character", () => {
    const result = renamePlanSchema.safeParse({ name: "A" });
    expect(result.success).toBe(true);
  });

  it("accepts exactly 60 characters (max boundary)", () => {
    const result = renamePlanSchema.safeParse({ name: "a".repeat(60) });
    expect(result.success).toBe(true);
  });

  it("rejects 61 characters (over max) with 'Name too long' error", () => {
    const result = renamePlanSchema.safeParse({ name: "a".repeat(61) });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message);
      expect(messages).toContain("Name too long");
    }
  });
});
