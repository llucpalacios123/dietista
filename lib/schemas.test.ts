import { describe, it, expect } from "vitest";
import {
  registerSchema,
  profileSchema,
  mealLogSchema,
  loginSchema,
} from "@/lib/schemas";

describe("registerSchema", () => {
  describe("valid inputs", () => {
    const validCases = [
      { email: "user@example.com", password: "Password1" },
      { email: "test@test.org", password: "Abcdefg1" },
      { email: "a@b.co", password: "StrongPass99" },
    ];

    it.each(validCases)("accepts valid registration: $email / $password", ({ email, password }) => {
      const result = registerSchema.safeParse({ email, password });
      expect(result.success).toBe(true);
    });
  });

  describe("weak passwords", () => {
    const weakPasswordCases = [
      { password: "short1A", reason: "too short (7 chars)" },
      { password: "abcdefg", reason: "no uppercase" },
      { password: "ABCDEFG", reason: "no number" },
      { password: "Abcdefgh", reason: "no number" },
      { password: "abcdefgh1", reason: "no uppercase" },
      { password: "", reason: "empty" },
      { password: "A1", reason: "too short" },
    ];

    it.each(weakPasswordCases)(
      "rejects weak password: $reason",
      ({ password }) => {
        const result = registerSchema.safeParse({
          email: "user@example.com",
          password,
        });
        expect(result.success).toBe(false);
      }
    );
  });

  describe("invalid emails", () => {
    const invalidEmailCases = [
      { email: "not-an-email", reason: "no @ symbol" },
      { email: "@example.com", reason: "no local part" },
      { email: "user@", reason: "no domain" },
      { email: "", reason: "empty" },
    ];

    it.each(invalidEmailCases)(
      "rejects invalid email: $reason",
      ({ email }) => {
        const result = registerSchema.safeParse({
          email,
          password: "Password1",
        });
        expect(result.success).toBe(false);
      }
    );
  });
});

describe("loginSchema", () => {
  it("accepts valid login", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "anypassword",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password",
    });
    expect(result.success).toBe(false);
  });
});

describe("profileSchema", () => {
  const validProfile = {
    weight: "70",
    height: "175",
    age: "30",
    sex: "male" as const,
    goal: "lose" as const,
    activityLevel: "moderate" as const,
  };

  describe("valid inputs", () => {
    it("accepts complete profile with string values (coerced)", () => {
      const result = profileSchema.safeParse(validProfile);
      expect(result.success).toBe(true);
    });

    it("accepts complete profile with number values", () => {
      const result = profileSchema.safeParse({
        weight: 70,
        height: 175,
        age: 30,
        sex: "female",
        goal: "maintain",
        activityLevel: "light",
      });
      expect(result.success).toBe(true);
    });

    it("accepts profile with optional fields", () => {
      const result = profileSchema.safeParse({
        ...validProfile,
        targetCalories: "2000",
        targetProtein: "150",
        allergies: ["nuts", "shellfish"],
        forbiddenFoods: ["liver"],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("missing required fields", () => {
    const missingFieldCases = [
      { omit: "weight", data: { height: "175", age: "30", sex: "male", goal: "lose", activityLevel: "moderate" } },
      { omit: "height", data: { weight: "70", age: "30", sex: "male", goal: "lose", activityLevel: "moderate" } },
      { omit: "age", data: { weight: "70", height: "175", sex: "male", goal: "lose", activityLevel: "moderate" } },
      { omit: "sex", data: { weight: "70", height: "175", age: "30", goal: "lose", activityLevel: "moderate" } },
      { omit: "goal", data: { weight: "70", height: "175", age: "30", sex: "male", activityLevel: "moderate" } },
      { omit: "activityLevel", data: { weight: "70", height: "175", age: "30", sex: "male", goal: "lose" } },
    ];

    it.each(missingFieldCases)(
      "rejects profile missing $omit",
      ({ data }) => {
        const result = profileSchema.safeParse(data);
        expect(result.success).toBe(false);
      }
    );
  });

  describe("invalid values", () => {
    const invalidCases = [
      { data: { ...validProfile, weight: "-5" }, reason: "negative weight" },
      { data: { ...validProfile, height: "0" }, reason: "zero height" },
      { data: { ...validProfile, age: "-1" }, reason: "negative age" },
      { data: { ...validProfile, age: "25.5" }, reason: "non-integer age" },
      { data: { ...validProfile, sex: "unknown" }, reason: "invalid sex" },
      { data: { ...validProfile, goal: "bulk" }, reason: "invalid goal" },
      { data: { ...validProfile, activityLevel: "extreme" }, reason: "invalid activity level" },
    ];

    it.each(invalidCases)(
      "rejects invalid value: $reason",
      ({ data }) => {
        const result = profileSchema.safeParse(data);
        expect(result.success).toBe(false);
      }
    );
  });

  describe("default values", () => {
    it("defaults allergies to empty array", () => {
      const result = profileSchema.safeParse(validProfile);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.allergies).toEqual([]);
      }
    });

    it("defaults forbiddenFoods to empty array", () => {
      const result = profileSchema.safeParse(validProfile);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.forbiddenFoods).toEqual([]);
      }
    });
  });
});

describe("mealLogSchema", () => {
  const validLog = {
    date: "2024-01-15T12:00:00.000Z",
    mealType: "lunch" as const,
    rawInput: "grilled chicken 200g, rice 150g",
  };

  it("accepts valid meal log", () => {
    const result = mealLogSchema.safeParse(validLog);
    expect(result.success).toBe(true);
  });

  describe("invalid inputs", () => {
    const invalidCases = [
      { data: { ...validLog, date: "2024-01-15" }, reason: "date without time" },
      { data: { ...validLog, date: "not-a-date" }, reason: "invalid date string" },
      { data: { ...validLog, mealType: "brunch" }, reason: "invalid meal type" },
      { data: { ...validLog, mealType: "" }, reason: "empty meal type" },
      { data: { ...validLog, rawInput: "" }, reason: "empty food description" },
    ];

    it.each(invalidCases)(
      "rejects invalid meal log: $reason",
      ({ data }) => {
        const result = mealLogSchema.safeParse(data);
        expect(result.success).toBe(false);
      }
    );
  });
});
