import { describe, it, expect } from "vitest";
import {
  registerSchema,
  profileSchema,
  mealLogSchema,
  loginSchema,
  mealItemSchema,
  weightEntrySchema,
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
});

describe("mealItemSchema — ingredients and instructions", () => {
  const baseMeal = {
    dayOfWeek: 0,
    mealType: "lunch" as const,
    name: "Test Meal",
    calories: 500,
  };

  describe("ingredients field", () => {
    it("validates meal with structured ingredients", () => {
      const result = mealItemSchema.safeParse({
        ...baseMeal,
        ingredients: [
          { name: "pollo", quantity: 200, unit: "g" },
          { name: "arroz", quantity: 150, unit: "g" },
        ],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ingredients).toHaveLength(2);
        expect(result.data.ingredients[0]).toEqual({
          name: "pollo", quantity: 200, unit: "g",
        });
        expect(result.data.ingredients[1]).toEqual({
          name: "arroz", quantity: 150, unit: "g",
        });
      }
    });

    it("defaults ingredients to empty array when omitted", () => {
      const result = mealItemSchema.safeParse(baseMeal);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ingredients).toEqual([]);
      }
    });

    it("validates ingredient with only name (no quantity or unit)", () => {
      const result = mealItemSchema.safeParse({
        ...baseMeal,
        ingredients: [{ name: "sal" }],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ingredients).toHaveLength(1);
        expect(result.data.ingredients[0]).toEqual({ name: "sal" });
      }
    });

    it("rejects ingredient with empty name", () => {
      const result = mealItemSchema.safeParse({
        ...baseMeal,
        ingredients: [{ name: "" }],
      });
      expect(result.success).toBe(false);
    });

    it("rejects ingredient with negative quantity", () => {
      const result = mealItemSchema.safeParse({
        ...baseMeal,
        ingredients: [{ name: "aceite", quantity: -5 }],
      });
      expect(result.success).toBe(false);
    });

    it("rejects ingredient with zero quantity", () => {
      const result = mealItemSchema.safeParse({
        ...baseMeal,
        ingredients: [{ name: "sal", quantity: 0 }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("instructions field", () => {
    it("validates meal with instructions", () => {
      const result = mealItemSchema.safeParse({
        ...baseMeal,
        instructions: "Cocinar a la plancha 8 min",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.instructions).toBe("Cocinar a la plancha 8 min");
      }
    });

    it("defaults instructions to empty string when omitted", () => {
      const result = mealItemSchema.safeParse(baseMeal);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.instructions).toBe("");
      }
    });

    it("coerces null instructions to empty string", () => {
      const result = mealItemSchema.safeParse({
        ...baseMeal,
        instructions: null,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.instructions).toBe("");
      }
    });
  });

  describe("full meal with both new fields", () => {
    it("validates complete meal with ingredients and instructions", () => {
      const result = mealItemSchema.safeParse({
        ...baseMeal,
        ingredients: [
          { name: "tomate", quantity: 2, unit: "unidades" },
        ],
        instructions: "Lavar y cortar en rodajas",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ingredients).toHaveLength(1);
        expect(result.data.ingredients[0]).toEqual({
          name: "tomate", quantity: 2, unit: "unidades",
        });
        expect(result.data.instructions).toBe("Lavar y cortar en rodajas");
      }
    });
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

describe("weightEntrySchema", () => {
  describe("weight bounds", () => {
    it("accepts weight at lower bound (30)", () => {
      const result = weightEntrySchema.safeParse({ weight: 30 });
      expect(result.success).toBe(true);
    });

    it("accepts weight at upper bound (300)", () => {
      const result = weightEntrySchema.safeParse({ weight: 300 });
      expect(result.success).toBe(true);
    });

    it("accepts weight in range (72.5)", () => {
      const result = weightEntrySchema.safeParse({ weight: 72.5 });
      expect(result.success).toBe(true);
    });

    it("rejects weight below 30", () => {
      const result = weightEntrySchema.safeParse({ weight: 29.9 });
      expect(result.success).toBe(false);
    });

    it("rejects weight above 300", () => {
      const result = weightEntrySchema.safeParse({ weight: 300.1 });
      expect(result.success).toBe(false);
    });

    it("rejects weight of 0", () => {
      const result = weightEntrySchema.safeParse({ weight: 0 });
      expect(result.success).toBe(false);
    });

    it("rejects negative weight", () => {
      const result = weightEntrySchema.safeParse({ weight: -5 });
      expect(result.success).toBe(false);
    });
  });

  describe("notes length", () => {
    it("accepts notes within 280 chars", () => {
      const result = weightEntrySchema.safeParse({
        weight: 72.5,
        notes: "a".repeat(280),
      });
      expect(result.success).toBe(true);
    });

    it("rejects notes over 280 chars", () => {
      const result = weightEntrySchema.safeParse({
        weight: 72.5,
        notes: "a".repeat(281),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("date field", () => {
    it("accepts valid ISO datetime string", () => {
      const result = weightEntrySchema.safeParse({
        weight: 72.5,
        date: "2024-03-15T00:00:00.000Z",
      });
      expect(result.success).toBe(true);
    });

    it("accepts payload without date (optional)", () => {
      const result = weightEntrySchema.safeParse({ weight: 72.5 });
      expect(result.success).toBe(true);
    });

    it("rejects non-datetime date string", () => {
      const result = weightEntrySchema.safeParse({
        weight: 72.5,
        date: "2024-03-15",
      });
      expect(result.success).toBe(false);
    });
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
