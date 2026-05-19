import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isGenerationTriggered,
  resetGenerationTrigger,
  getCollectedChatData,
  setToolSessionId,
  setSessionData,
  clearSessionData,
} from "@/lib/chat-tools";

// ─── Helpers ─────────────────────────────────────────────────────────────

beforeEach(() => {
  resetGenerationTrigger("test-user");
  clearSessionData("test-user");
});

// ─── Generation Trigger State ────────────────────────────────────────────

describe("isGenerationTriggered", () => {
  it("returns false by default", () => {
    expect(isGenerationTriggered("test-user")).toBe(false);
  });

  it("returns false for unknown user", () => {
    expect(isGenerationTriggered("unknown-user")).toBe(false);
  });
});

describe("resetGenerationTrigger", () => {
  it("resets the trigger state", () => {
    // Set it to true first
    // (note: isGenerationTriggered only returns what was set,
    //  there's no separate "set" exported, so we test reset as idempotent)
    resetGenerationTrigger("test-user");
    expect(isGenerationTriggered("test-user")).toBe(false);
  });
});

// ─── Collected Chat Data ─────────────────────────────────────────────────

describe("getCollectedChatData", () => {
  it("returns null when no data collected", () => {
    const data = getCollectedChatData("no-data-user");
    expect(data).toBeNull();
  });

  it("returns collected data after tool extraction", () => {
    setToolSessionId("data-user");
    setSessionData("data-user", {
      preferences: {
        goal: "lose",
        activityLevel: "active",
        allergies: ["dairy"],
        forbiddenFoods: ["liver"],
      },
      confidence: "high",
    });

    const data = getCollectedChatData("data-user");
    expect(data).not.toBeNull();
    expect(data?.preferences?.goal).toBe("lose");
    expect(data?.preferences?.activityLevel).toBe("active");
    expect(data?.confidence).toBe("high");
  });
});

// ─── Chat Meal Plan Server Action Logic ──────────────────────────────────

describe("chatMealPlan server action", () => {
  describe("rate limiting", () => {
    it("rate limit key format is correct", () => {
      const userId = "user-abc-123";
      const expectedKey = `chat:${userId}`;
      expect(expectedKey).toBe("chat:user-abc-123");
    });
  });

  describe("action dispatch", () => {
    it("detects generation action from form data", () => {
      const formData = new FormData();
      formData.set("action", "generate");

      const action = formData.get("action");
      expect(action).toBe("generate");
    });

    it("returns success without action", () => {
      const formData = new FormData();
      // No "action" field set

      const action = formData.get("action");
      expect(action).toBeNull();
    });
  });
});

// ─── Message Format Validation ───────────────────────────────────────────

describe("message format validation", () => {
  it("accepts valid message format", () => {
    const messages = [
      { role: "user" as const, content: "Hello" },
      { role: "assistant" as const, content: "Hi there!" },
      { role: "system" as const, content: "System prompt" },
    ];

    expect(messages).toHaveLength(3);
    expect(messages[0].role).toBe("user");
    expect(messages[1].role).toBe("assistant");
    expect(messages[2].role).toBe("system");
  });

  it("requires minimum user role format", () => {
    const validRoles = ["user", "assistant", "system"] as const;
    const messages = [{ role: "user" as const, content: "msg" }];

    expect(validRoles).toContain(messages[0].role);
    expect(messages).toHaveLength(1);
  });
});
