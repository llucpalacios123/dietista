import { describe, it, expect } from "vitest";
import {
  registerSchema,
  profileSchema,
  mealLogSchema,
  loginSchema,
  chatUserPreferencesSchema,
  chatExtractedDataSchema,
  chatConversationStateSchema,
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

// ─── Chat Conversation Schemas ──────────────────────────────────────────

describe("chatUserPreferencesSchema", () => {
  describe("valid inputs", () => {
    it("accepts complete preferences", () => {
      const result = chatUserPreferencesSchema.safeParse({
        goal: "lose",
        activityLevel: "moderate",
        allergies: ["nuts"],
        forbiddenFoods: ["liver"],
        calories: 2000,
        protein: 150,
        carbs: 200,
        fat: 65,
        weight: 70,
        height: 175,
        age: 30,
        sex: "male",
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty preferences (all optional)", () => {
      const result = chatUserPreferencesSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.allergies).toEqual([]);
        expect(result.data.forbiddenFoods).toEqual([]);
      }
    });

    it("accepts preferences with only goal", () => {
      const result = chatUserPreferencesSchema.safeParse({ goal: "maintain" });
      expect(result.success).toBe(true);
    });

    it("defaults allergies and forbiddenFoods to empty arrays", () => {
      const result = chatUserPreferencesSchema.safeParse({ goal: "gain" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.allergies).toEqual([]);
        expect(result.data.forbiddenFoods).toEqual([]);
      }
    });
  });

  describe("invalid inputs", () => {
    const invalidCases = [
      {
        data: { goal: "bulk" as const },
        reason: "invalid goal value",
      },
      {
        data: { activityLevel: "extreme" as const },
        reason: "invalid activity level",
      },
      {
        data: { calories: -500 },
        reason: "negative calories",
      },
      {
        data: { weight: 0 },
        reason: "zero weight",
      },
      {
        data: { age: 0 },
        reason: "zero age",
      },
      {
        data: { age: 25.5 },
        reason: "non-integer age",
      },
      {
        data: { sex: "unknown" as const },
        reason: "invalid sex",
      },
    ];

    it.each(invalidCases)(
      "rejects invalid value: $reason",
      ({ data }) => {
        const result = chatUserPreferencesSchema.safeParse(data);
        expect(result.success).toBe(false);
      }
    );
  });
});

describe("chatExtractedDataSchema", () => {
  describe("valid inputs", () => {
    it("accepts preferences-only data", () => {
      const result = chatExtractedDataSchema.safeParse({
        preferences: { goal: "lose", activityLevel: "active" },
        confidence: "high",
      });
      expect(result.success).toBe(true);
    });

    it("accepts pdf-only data", () => {
      const result = chatExtractedDataSchema.safeParse({
        pdfData: { rawText: "Sample PDF content with nutrition info" },
        confidence: "low",
      });
      expect(result.success).toBe(true);
    });

    it("accepts combined preferences and pdf data", () => {
      const result = chatExtractedDataSchema.safeParse({
        preferences: { goal: "maintain", allergies: ["dairy"] },
        pdfData: {
          rawText: "PDF nutrition report",
          extractedAt: "2026-01-15T12:00:00.000Z",
        },
        confidence: "medium",
      });
      expect(result.success).toBe(true);
    });

    it("defaults confidence to medium when not provided", () => {
      const result = chatExtractedDataSchema.safeParse({
        preferences: { goal: "lose" },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.confidence).toBe("medium");
      }
    });
  });

  describe("invalid inputs", () => {
    it("rejects empty pdf rawText", () => {
      const result = chatExtractedDataSchema.safeParse({
        pdfData: { rawText: "" },
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid confidence value", () => {
      const result = chatExtractedDataSchema.safeParse({
        confidence: "extreme",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("chatConversationStateSchema", () => {
  describe("valid states", () => {
    const validSteps = [
      "collect_preferences",
      "collect_dietary_restrictions",
      "collect_pdf_input",
      "confirm_generation",
      "generating",
      "complete",
    ] as const;

    it.each(validSteps)("accepts valid step: %s", (step) => {
      const result = chatConversationStateSchema.safeParse({
        step,
        collectedData: { confidence: "medium" },
        isComplete: step === "complete",
      });
      expect(result.success).toBe(true);
    });

    it("accepts state with full collected data", () => {
      const result = chatConversationStateSchema.safeParse({
        step: "confirm_generation",
        collectedData: {
          preferences: {
            goal: "lose",
            activityLevel: "moderate",
            allergies: ["nuts"],
            forbiddenFoods: [],
            calories: 2000,
            protein: 150,
            carbs: 200,
            fat: 65,
            weight: 70,
            height: 175,
            age: 30,
            sex: "male",
          },
          pdfData: { rawText: "Nutrition data from PDF" },
          confidence: "high",
        },
        isComplete: false,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("invalid states", () => {
    it("rejects unknown step", () => {
      const result = chatConversationStateSchema.safeParse({
        step: "unknown_step",
        collectedData: { confidence: "medium" },
        isComplete: false,
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing step", () => {
      const result = chatConversationStateSchema.safeParse({
        collectedData: { confidence: "medium" },
        isComplete: false,
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing isComplete", () => {
      const result = chatConversationStateSchema.safeParse({
        step: "collect_preferences",
        collectedData: { confidence: "medium" },
      });
      expect(result.success).toBe(false);
    });
  });
});
