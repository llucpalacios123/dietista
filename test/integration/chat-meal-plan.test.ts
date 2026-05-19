import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { setupTestDB, teardownTestDB, cleanDatabase } from "../test-db";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/lib/auth";
import {
  getSessionData,
  setSessionData,
  clearSessionData,
  setToolSessionId,
  isGenerationTriggered,
  setGenerationTriggered,
  resetGenerationTrigger,
} from "@/lib/chat-tools";
import {
  chatUserPreferencesSchema,
  chatExtractedDataSchema,
} from "@/lib/schemas";

let prisma: PrismaClient;

beforeAll(async () => {
  const db = await setupTestDB();
  prisma = db.prisma;
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await cleanDatabase(prisma);
  clearSessionData("test-user");
  resetGenerationTrigger("test-user");
});

// ─── Helpers ─────────────────────────────────────────────────────────────

async function createTestUser(email = "chat-test@example.com") {
  return prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword("Password1"),
    },
  });
}

async function createTestProfile(userId: string) {
  return prisma.profile.create({
    data: {
      userId,
      weight: 70,
      height: 175,
      age: 30,
      sex: "male",
      goal: "lose",
      activityLevel: "moderate",
      allergies: ["nuts"],
      forbiddenFoods: ["liver"],
    },
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────

describe("Chat Meal Plan — Integration Tests", () => {
  // ── Conversation Flow ────────────────────────────────────────────────
  describe("full conversation flow", () => {
    it("stores extracted preferences through session data", async () => {
      const user = await createTestUser();
      await createTestProfile(user.id);

      setToolSessionId(user.id);

      // Simulate the AI tool calling extractPreferences
      setSessionData(user.id, {
        preferences: {
          goal: "lose",
          activityLevel: "moderate",
          allergies: ["nuts"],
          forbiddenFoods: [],
        },
        confidence: "high",
      });

      const data = getSessionData(user.id);
      expect(data).not.toBeNull();
      expect(data?.preferences?.goal).toBe("lose");
      expect(data?.preferences?.activityLevel).toBe("moderate");
      expect(data?.preferences?.allergies).toEqual(["nuts"]);
    });

    it("validates collected data against schema", async () => {
      const validData = {
        step: "confirm_generation" as const,
        collectedData: {
          preferences: {
            goal: "lose" as const,
            activityLevel: "active" as const,
            allergies: ["dairy"],
            forbiddenFoods: [],
          },
          confidence: "high" as const,
        },
        isComplete: false,
      };

      const result =
        (await import("@/lib/schemas")).chatConversationStateSchema.safeParse(
          validData
        );
      expect(result.success).toBe(true);
    });

    it("generation trigger state works correctly", async () => {
      const user = await createTestUser();
      await createTestProfile(user.id);

      // Initially not triggered
      expect(isGenerationTriggered(user.id)).toBe(false);

      // Set triggered
      setGenerationTriggered(user.id, true);
      expect(isGenerationTriggered(user.id)).toBe(true);

      // Reset
      resetGenerationTrigger(user.id);
      expect(isGenerationTriggered(user.id)).toBe(false);
    });
  });

  // ── PDF Data Handling ────────────────────────────────────────────────
  describe("PDF data extraction", () => {
    it("stores PDF data in session", async () => {
      const user = await createTestUser();
      setToolSessionId(user.id);

      setSessionData(user.id, {
        pdfData: {
          rawText: "Patient requires weight loss diet. Allergies: peanuts, shellfish.",
          extractedAt: new Date().toISOString(),
        },
        confidence: "medium",
      });

      const data = getSessionData(user.id);
      expect(data).not.toBeNull();
      expect(data?.pdfData?.rawText).toContain("weight loss");
      expect(data?.pdfData?.rawText).toContain("peanuts");
      expect(data?.confidence).toBe("medium");
    });

    it("PDF data merges with existing preferences", async () => {
      const user = await createTestUser();
      setToolSessionId(user.id);

      // Set preferences first
      setSessionData(user.id, {
        preferences: {
          goal: "maintain",
          activityLevel: "light",
          allergies: ["dairy"],
          forbiddenFoods: [],
        },
        confidence: "medium",
      });

      // Then set PDF data (should merge)
      setSessionData(user.id, {
        preferences: {
          goal: "lose", // overrides from PDF
          activityLevel: "active",
          allergies: ["peanuts"],
          forbiddenFoods: [],
        },
        pdfData: { rawText: "PDF content" },
        confidence: "high",
      });

      const data = getSessionData(user.id);
      expect(data?.preferences?.goal).toBe("lose");
      expect(data?.preferences?.activityLevel).toBe("active");
      expect(data?.preferences?.allergies).toEqual(["peanuts"]);
      expect(data?.pdfData?.rawText).toBe("PDF content");
    });
  });

  // ── Auth Protection ──────────────────────────────────────────────────
  describe("auth required", () => {
    it("getSessionData returns null for unknown user", () => {
      expect(getSessionData("nonexistent-user")).toBeNull();
    });

    it("clearSessionData is idempotent for unknown user", () => {
      clearSessionData("nonexistent-user");
      // Should not throw
      expect(getSessionData("nonexistent-user")).toBeNull();
    });

    it("each user's data is isolated", async () => {
      const user1 = await createTestUser("user1@test.com");
      const user2 = await createTestUser("user2@test.com");

      setToolSessionId(user1.id);
      setSessionData(user1.id, {
        preferences: {
          goal: "lose",
          activityLevel: "active",
          allergies: ["nuts"],
          forbiddenFoods: [],
        },
        confidence: "high",
      });

      setToolSessionId(user2.id);
      setSessionData(user2.id, {
        preferences: {
          goal: "gain",
          activityLevel: "light",
          allergies: ["dairy"],
          forbiddenFoods: [],
        },
        confidence: "medium",
      });

      // User 1 data should be isolated
      const data1 = getSessionData(user1.id);
      expect(data1?.preferences?.goal).toBe("lose");

      // User 2 data should be isolated
      const data2 = getSessionData(user2.id);
      expect(data2?.preferences?.goal).toBe("gain");
    });
  });

  // ── Profile Required ─────────────────────────────────────────────────
  describe("profile required", () => {
    it("user without profile can still use chat tools", async () => {
      const user = await createTestUser("no-profile@test.com");

      setToolSessionId(user.id);
      setSessionData(user.id, {
        preferences: {
          goal: "maintain",
          activityLevel: "sedentary",
          allergies: [],
          forbiddenFoods: [],
        },
        confidence: "low",
      });

      // Chat data collection works even without a profile
      // (the server action checks profile before allowing generation)
      const data = getSessionData(user.id);
      expect(data).not.toBeNull();
      expect(data?.preferences?.goal).toBe("maintain");
    });
  });

  // ── Schema Validation ────────────────────────────────────────────────
  describe("schema validation", () => {
    it("chatUserPreferencesSchema accepts full data", () => {
      const result = chatUserPreferencesSchema.safeParse({
        goal: "lose",
        activityLevel: "active",
        allergies: ["gluten"],
        forbiddenFoods: ["alcohol"],
        calories: 2000,
        protein: 150,
        carbs: 200,
        fat: 60,
        weight: 75,
        height: 180,
        age: 28,
        sex: "male",
      });
      expect(result.success).toBe(true);
    });

    it("chatExtractedDataSchema accepts minimal data", () => {
      const result = chatExtractedDataSchema.safeParse({
        confidence: "low",
      });
      expect(result.success).toBe(true);
    });

    it("chatExtractedDataSchema rejects empty pdf rawText", () => {
      const result = chatExtractedDataSchema.safeParse({
        pdfData: { rawText: "" },
      });
      expect(result.success).toBe(false);
    });
  });
});
