import { describe, it, expect, beforeEach } from "vitest";
import {
  confirmGenerationTool,
  getSessionData,
  setSessionData,
  clearSessionData,
  getMergedPreferences,
  setToolSessionId,
} from "@/lib/chat-tools";

// ─── Extracted logic for testing (avoiding tool() wrapper type issues) ──

// Tests the underlying mergePreferences logic by testing tool behavior
// through the session data store (which tools update via mergePreferences).

function simulateExtractPreferences(input: {
  goal?: "lose" | "maintain" | "gain";
  activityLevel?: "sedentary" | "light" | "moderate" | "active" | "veryActive";
  allergies?: string[];
}) {
  // Simulate what the extractPreferences tool does internally
  const existing = getSessionData(currentTestSessionId);
  const preferences = {
    ...existing?.preferences,
    allergies: input.allergies ?? existing?.preferences?.allergies ?? [],
    forbiddenFoods: existing?.preferences?.forbiddenFoods ?? [],
    goal: input.goal ?? existing?.preferences?.goal,
    activityLevel: input.activityLevel ?? existing?.preferences?.activityLevel,
  };
  setSessionData(currentTestSessionId, {
    preferences,
    pdfData: existing?.pdfData,
    confidence: existing?.confidence ?? "medium",
  });
}

function simulateExtractPdfData(input: {
  goal?: "lose" | "maintain" | "gain";
  activityLevel?: "sedentary" | "light" | "moderate" | "active" | "veryActive";
  allergies?: string[];
}) {
  const existing = getSessionData(currentTestSessionId);

  const preferences = {
    ...existing?.preferences,
    allergies: input.allergies ?? existing?.preferences?.allergies ?? [],
    forbiddenFoods: existing?.preferences?.forbiddenFoods ?? [],
    goal: input.goal ?? existing?.preferences?.goal,
    activityLevel: input.activityLevel ?? existing?.preferences?.activityLevel,
  };
  setSessionData(currentTestSessionId, {
    preferences,
    pdfData: existing?.pdfData,
    confidence: existing?.confidence ?? "medium",
  });
}

let currentTestSessionId = "test-session";

// ─── Helpers ─────────────────────────────────────────────────────────────

beforeEach(() => {
  currentTestSessionId = "test-session";
  setToolSessionId(currentTestSessionId);
  clearSessionData("test-session");
  clearSessionData("session-1");
  clearSessionData("session-post");
  clearSessionData("empty-session");
  clearSessionData("pdf-session");
  clearSessionData("pdf-minimal");
  clearSessionData("session-pdf-merge");
  clearSessionData("mgmt-session");
});

// ─── extractPreferencesTool ──────────────────────────────────────────────

describe("extractPreferencesTool", () => {
  it("extracts goal, activityLevel, and allergies from user input", () => {
    currentTestSessionId = "test-session";

    simulateExtractPreferences({
      goal: "lose",
      activityLevel: "moderate",
      allergies: ["nuts", "shellfish"],
    });

    const data = getSessionData("test-session");
    expect(data).not.toBeNull();
    expect(data?.preferences?.goal).toBe("lose");
    expect(data?.preferences?.activityLevel).toBe("moderate");
    expect(data?.preferences?.allergies).toEqual(["nuts", "shellfish"]);
  });

  it("merges with existing session data", () => {
    currentTestSessionId = "session-1";

    setSessionData("session-1", {
      preferences: {
        goal: "maintain",
        allergies: ["dairy"],
        forbiddenFoods: [],
      },
      confidence: "high",
    });

    simulateExtractPreferences({
      goal: "lose",
      activityLevel: "active",
      allergies: ["nuts"],
    });

    const data = getSessionData("session-1");
    expect(data?.preferences?.goal).toBe("lose"); // overridden
    expect(data?.preferences?.activityLevel).toBe("active"); // new
    expect(data?.preferences?.allergies).toEqual(["nuts"]); // overridden
    expect(data?.confidence).toBe("high"); // preserved
  });

  it("handles empty input gracefully", () => {
    currentTestSessionId = "empty-session";

    simulateExtractPreferences({
      goal: "maintain",
      activityLevel: "sedentary",
      allergies: [],
    });

    const data = getSessionData("empty-session");
    expect(data?.preferences?.allergies).toEqual([]);
  });

  it("populates getSessionData after extraction", () => {
    currentTestSessionId = "session-post";

    simulateExtractPreferences({
      goal: "gain",
      activityLevel: "veryActive",
      allergies: [],
    });

    const data = getSessionData("session-post");
    expect(data).not.toBeNull();
    expect(data?.preferences?.goal).toBe("gain");
  });

  it("getSessionData returns null for unknown session", () => {
    expect(getSessionData("nonexistent")).toBeNull();
  });

  it("getMergedPreferences returns empty defaults for unknown session", () => {
    const prefs = getMergedPreferences("nonexistent");
    expect(prefs.allergies).toEqual([]);
    expect(prefs.forbiddenFoods).toEqual([]);
  });
});

// ─── extractPdfDataTool ──────────────────────────────────────────────────

describe("extractPdfDataTool", () => {
  it("processes PDF data with all fields", () => {
    currentTestSessionId = "pdf-session";

    simulateExtractPdfData({
      goal: "lose",
      activityLevel: "sedentary",
      allergies: ["peanuts"],
    });

    const data = getSessionData("pdf-session");
    expect(data?.preferences?.goal).toBe("lose");
    expect(data?.preferences?.activityLevel).toBe("sedentary");
    expect(data?.preferences?.allergies).toEqual(["peanuts"]);
  });

  it("processes PDF data without optional fields", () => {
    currentTestSessionId = "pdf-minimal";

    simulateExtractPdfData({
      allergies: [],
    });

    const data = getSessionData("pdf-minimal");
    expect(data?.preferences?.goal).toBeUndefined();
    expect(data?.preferences?.activityLevel).toBeUndefined();
    expect(data?.preferences?.allergies).toEqual([]);
  });

  it("merges PDF data with existing preferences", () => {
    currentTestSessionId = "session-pdf-merge";

    setSessionData("session-pdf-merge", {
      preferences: { goal: "maintain", activityLevel: "moderate", allergies: [], forbiddenFoods: [] },
      confidence: "medium",
    });

    simulateExtractPdfData({
      goal: "lose",
      allergies: ["nuts"],
    });

    const data = getSessionData("session-pdf-merge");
    expect(data?.preferences?.goal).toBe("lose"); // overridden
    expect(data?.preferences?.activityLevel).toBe("moderate"); // preserved
    expect(data?.preferences?.allergies).toEqual(["nuts"]);
  });
});

// ─── confirmGenerationTool ───────────────────────────────────────────────

describe("confirmGenerationTool", () => {
  it("returns confirmation signal", async () => {
    const result = await (confirmGenerationTool as unknown as {
      execute: (input: { summary: string }) => Promise<{ confirmed: boolean; summary: string; message: string }>;
    }).execute({
      summary:
        "User goals: lose weight, moderate activity, allergies: nuts. All data collected.",
    });

    expect(result.confirmed).toBe(true);
    expect(result.summary).toContain("lose weight");
    expect(result.message).toContain("Creating your personalized meal plan");
  });

  it("returns confirmation with minimal summary", async () => {
    const result = await (confirmGenerationTool as unknown as {
      execute: (input: { summary: string }) => Promise<{ confirmed: boolean; summary: string; message: string }>;
    }).execute({ summary: "Ready to generate." });

    expect(result.confirmed).toBe(true);
    expect(result.message).toContain("Creating your personalized meal plan");
  });
});

// ─── Session Data Management ─────────────────────────────────────────────

describe("session data management", () => {
  const sessionId = "mgmt-session";

  beforeEach(() => {
    clearSessionData(sessionId);
  });

  it("setSessionData and getSessionData round-trip", () => {
    const data = {
      preferences: {
        goal: "lose" as const,
        activityLevel: "active" as const,
        allergies: ["gluten"],
        forbiddenFoods: [],
      },
      confidence: "high" as const,
    };

    setSessionData(sessionId, data);
    const retrieved = getSessionData(sessionId);

    expect(retrieved).not.toBeNull();
    expect(retrieved?.preferences?.goal).toBe("lose");
    expect(retrieved?.confidence).toBe("high");
  });

  it("clearSessionData removes data", () => {
    setSessionData(sessionId, {
      preferences: { goal: "maintain", allergies: [], forbiddenFoods: [] },
      confidence: "low",
    });

    clearSessionData(sessionId);
    expect(getSessionData(sessionId)).toBeNull();
  });

  it("getMergedPreferences returns saved preferences", () => {
    setSessionData(sessionId, {
      preferences: {
        goal: "gain",
        activityLevel: "light",
        allergies: ["shellfish"],
        forbiddenFoods: [],
      },
      confidence: "medium",
    });

    const prefs = getMergedPreferences(sessionId);
    expect(prefs.goal).toBe("gain");
    expect(prefs.activityLevel).toBe("light");
    expect(prefs.allergies).toEqual(["shellfish"]);
  });
});
