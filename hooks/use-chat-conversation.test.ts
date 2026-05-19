import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useChatConversation } from "@/hooks/use-chat-conversation";

// ─── SessionStorage Mock ─────────────────────────────────────────────────

const sessionStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

Object.defineProperty(globalThis, "sessionStorage", {
  value: sessionStorageMock,
  writable: true,
});

// ─── Helpers ─────────────────────────────────────────────────────────────

beforeEach(() => {
  sessionStorageMock.clear();
});

// ─── Initial State ───────────────────────────────────────────────────────

describe("useChatConversation — initial state", () => {
  it("starts at collect_preferences step", () => {
    const { result } = renderHook(() => useChatConversation());

    expect(result.current.step).toBe("collect_preferences");
    expect(result.current.isComplete).toBe(false);
    expect(result.current.stepIndex).toBe(0);
    expect(result.current.totalSteps).toBe(6);
    expect(result.current.canAdvance).toBe(true);
  });

  it("starts with empty collected data", () => {
    const { result } = renderHook(() => useChatConversation());

    expect(result.current.collectedData.preferences).toBeUndefined();
    expect(result.current.collectedData.pdfData).toBeUndefined();
    expect(result.current.collectedData.confidence).toBe("medium");
  });

  it("persists initial state to sessionStorage", () => {
    renderHook(() => useChatConversation());

    const stored = sessionStorageMock.getItem("dietista-chat-conversation");
    expect(stored).not.toBeNull();

    const parsed = JSON.parse(stored!);
    expect(parsed.step).toBe("collect_preferences");
  });
});

// ─── Step Advancement ────────────────────────────────────────────────────

describe("useChatConversation — advanceStep", () => {
  it("advances to the specified step", () => {
    const { result } = renderHook(() => useChatConversation());

    act(() => {
      result.current.advanceStep("collect_dietary_restrictions");
    });

    expect(result.current.step).toBe("collect_dietary_restrictions");
    expect(result.current.stepIndex).toBe(1);
  });

  it("does not allow going backwards", () => {
    const { result } = renderHook(() => useChatConversation());

    act(() => {
      result.current.advanceStep("collect_dietary_restrictions");
    });

    act(() => {
      result.current.advanceStep("collect_preferences"); // try going back
    });

    expect(result.current.step).toBe("collect_dietary_restrictions");
  });

  it("does not advance to the same step", () => {
    const { result } = renderHook(() => useChatConversation());

    act(() => {
      result.current.advanceStep("collect_preferences"); // same as current
    });

    expect(result.current.step).toBe("collect_preferences");
  });

  it("can advance through all steps", () => {
    const { result } = renderHook(() => useChatConversation());

    const steps = [
      "collect_dietary_restrictions",
      "collect_pdf_input",
      "confirm_generation",
      "generating",
      "complete",
    ] as const;

    for (const step of steps) {
      act(() => {
        result.current.advanceStep(step);
      });
      expect(result.current.step).toBe(step);
    }

    expect(result.current.canAdvance).toBe(false);
  });
});

// ─── Preferences ─────────────────────────────────────────────────────────

describe("useChatConversation — setPreferences", () => {
  it("sets goal preference", () => {
    const { result } = renderHook(() => useChatConversation());

    act(() => {
      result.current.setPreferences({ goal: "lose" });
    });

    expect(result.current.collectedData.preferences?.goal).toBe("lose");
  });

  it("merges multiple preference updates", () => {
    const { result } = renderHook(() => useChatConversation());

    act(() => {
      result.current.setPreferences({ goal: "lose" });
    });

    act(() => {
      result.current.setPreferences({ activityLevel: "moderate" });
    });

    expect(result.current.collectedData.preferences?.goal).toBe("lose");
    expect(result.current.collectedData.preferences?.activityLevel).toBe("moderate");
  });

  it("sets allergies preferences", () => {
    const { result } = renderHook(() => useChatConversation());

    act(() => {
      result.current.setPreferences({ allergies: ["nuts", "shellfish"] });
    });

    expect(result.current.collectedData.preferences?.allergies).toEqual([
      "nuts",
      "shellfish",
    ]);
  });
});

// ─── PDF Data ────────────────────────────────────────────────────────────

describe("useChatConversation — setPdfData", () => {
  it("sets PDF data", () => {
    const { result } = renderHook(() => useChatConversation());

    act(() => {
      result.current.setPdfData({
        rawText: "Nutrition report text...",
        extractedAt: "2026-01-15T12:00:00.000Z",
      });
    });

    expect(result.current.collectedData.pdfData?.rawText).toBe(
      "Nutrition report text..."
    );
  });
});

// ─── Generating / Complete ───────────────────────────────────────────────

describe("useChatConversation — generating/complete", () => {
  it("transitions to generating state", () => {
    const { result } = renderHook(() => useChatConversation());

    act(() => {
      result.current.setGenerating();
    });

    expect(result.current.step).toBe("generating");
    expect(result.current.isComplete).toBe(false);
  });

  it("transitions to complete state", () => {
    const { result } = renderHook(() => useChatConversation());

    act(() => {
      result.current.setComplete();
    });

    expect(result.current.step).toBe("complete");
    expect(result.current.isComplete).toBe(true);
  });
});

// ─── Reset ───────────────────────────────────────────────────────────────

describe("useChatConversation — reset", () => {
  it("resets to initial state", () => {
    const { result } = renderHook(() => useChatConversation());

    act(() => {
      result.current.advanceStep("collect_dietary_restrictions");
      result.current.setPreferences({ goal: "maintain" });
    });

    act(() => {
      result.current.resetConversation();
    });

    expect(result.current.step).toBe("collect_preferences");
    expect(result.current.collectedData.preferences).toBeUndefined();
    expect(result.current.isComplete).toBe(false);
  });
});

// ─── SessionStorage Restore ──────────────────────────────────────────────

describe("useChatConversation — sessionStorage restore", () => {
  it("restores previously saved state", () => {
    const savedState = {
      step: "collect_dietary_restrictions" as const,
      collectedData: {
        preferences: {
          goal: "gain",
          activityLevel: "light",
        },
        confidence: "high" as const,
      },
      isComplete: false,
    };

    sessionStorageMock.setItem(
      "dietista-chat-conversation",
      JSON.stringify(savedState)
    );

    const { result } = renderHook(() => useChatConversation());

    expect(result.current.step).toBe("collect_dietary_restrictions");
    expect(result.current.collectedData.preferences?.goal).toBe("gain");
    expect(result.current.collectedData.confidence).toBe("high");
  });

  it("falls back to initial state on corrupted storage", () => {
    sessionStorageMock.setItem(
      "dietista-chat-conversation",
      "not-valid-json"
    );

    const { result } = renderHook(() => useChatConversation());

    expect(result.current.step).toBe("collect_preferences");
  });
});

// ─── STEP_ORDER constant ─────────────────────────────────────────────────

describe("useChatConversation — STEP_ORDER", () => {
  it("exposes the step order for progress indicators", () => {
    const { result } = renderHook(() => useChatConversation());

    expect(result.current.STEP_ORDER).toHaveLength(6);
    expect(result.current.STEP_ORDER[0]).toBe("collect_preferences");
    expect(result.current.STEP_ORDER[5]).toBe("complete");
  });
});
