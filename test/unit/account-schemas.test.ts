import { describe, it, expect } from "vitest";
import { accountNameSchema, changePasswordSchema } from "@/lib/schemas";

// ─── accountNameSchema ────────────────────────────────────────────────────

describe("accountNameSchema", () => {
  it("accepts empty string (empty clears the name field)", () => {
    const result = accountNameSchema.safeParse({ name: "" });
    expect(result.success).toBe(true);
  });

  it("accepts a single character", () => {
    const result = accountNameSchema.safeParse({ name: "A" });
    expect(result.success).toBe(true);
  });

  it("accepts 100 characters (max boundary)", () => {
    const result = accountNameSchema.safeParse({ name: "a".repeat(100) });
    expect(result.success).toBe(true);
  });

  it("rejects 101 characters (over max)", () => {
    const result = accountNameSchema.safeParse({ name: "a".repeat(101) });
    expect(result.success).toBe(false);
  });
});

// ─── changePasswordSchema ─────────────────────────────────────────────────

describe("changePasswordSchema", () => {
  const validData = {
    currentPassword: "anything",
    newPassword: "ValidPass1",
    confirmPassword: "ValidPass1",
  };

  it("accepts valid data (8+ chars, uppercase, number, matching confirm)", () => {
    const result = changePasswordSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects newPassword shorter than 8 characters", () => {
    const result = changePasswordSchema.safeParse({
      ...validData,
      newPassword: "Short1",
      confirmPassword: "Short1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects newPassword missing uppercase letter", () => {
    const result = changePasswordSchema.safeParse({
      ...validData,
      newPassword: "nouppercase1",
      confirmPassword: "nouppercase1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects newPassword missing number", () => {
    const result = changePasswordSchema.safeParse({
      ...validData,
      newPassword: "NoNumberHere",
      confirmPassword: "NoNumberHere",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when newPassword and confirmPassword do not match", () => {
    const result = changePasswordSchema.safeParse({
      ...validData,
      newPassword: "ValidPass1",
      confirmPassword: "ValidPass2",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.errors.map((e) => e.path.join("."));
      expect(paths).toContain("confirmPassword");
    }
  });

  it("requires currentPassword to be non-empty", () => {
    const result = changePasswordSchema.safeParse({
      ...validData,
      currentPassword: "",
    });
    expect(result.success).toBe(false);
  });
});
