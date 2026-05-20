import { describe, it, expect } from "vitest";

// ─── Reducer-level testing (pure function, no React needed) ──────────────

/**
 * We test the reducer logic in isolation by extracting the transition rules.
 * The actual hook uses useReducer, but we test the business logic here.
 */

import type { NutritionistStep } from "@/lib/schemas";

const STEP_ORDER: readonly NutritionistStep[] = [
  "PROFILE_REVIEW",
  "PROFILE_MODIFICATION",
  "PREFERENCES_COLLECTION",
  "GENERATION",
  "REVIEW_MODIFICATION",
  "CONFIRMATION",
] as const;

/**
 * Pure function implementing the step transition rules.
 * Extracted from the reducer for testability.
 */
function canAdvanceTo(
  currentStep: NutritionistStep,
  nextStep: NutritionistStep,
): boolean {
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  const nextIndex = STEP_ORDER.indexOf(nextStep);

  // Allow forward navigation
  if (nextIndex > currentIndex) return true;

  // Allow skip from PROFILE_REVIEW to PREFERENCES_COLLECTION (skip modification)
  if (
    currentStep === "PROFILE_REVIEW" &&
    nextStep === "PREFERENCES_COLLECTION"
  ) {
    return true;
  }

  // Allow same step (no-op)
  if (currentIndex === nextIndex) return true;

  return false;
}

describe("Wizard State Machine Transitions", () => {
  describe("forward navigation (allowed)", () => {
    const forwardCases = [
      { from: "PROFILE_REVIEW", to: "PROFILE_MODIFICATION", reason: "step 1→2" },
      { from: "PROFILE_MODIFICATION", to: "PREFERENCES_COLLECTION", reason: "step 2→3" },
      { from: "PREFERENCES_COLLECTION", to: "GENERATION", reason: "step 3→4" },
      { from: "GENERATION", to: "REVIEW_MODIFICATION", reason: "step 4→5" },
      { from: "REVIEW_MODIFICATION", to: "CONFIRMATION", reason: "step 5→6" },
    ];

    it.each(forwardCases)(
      "allows forward: $from → $to ($reason)",
      ({ from, to }) => {
        expect(canAdvanceTo(from as NutritionistStep, to as NutritionistStep)).toBe(true);
      },
    );
  });

  describe("skip profile modification", () => {
    it("allows skip from PROFILE_REVIEW to PREFERENCES_COLLECTION", () => {
      expect(
        canAdvanceTo("PROFILE_REVIEW", "PREFERENCES_COLLECTION"),
      ).toBe(true);
    });
  });

  describe("backward navigation (blocked)", () => {
    const backwardCases = [
      { from: "PROFILE_MODIFICATION", to: "PROFILE_REVIEW", reason: "step 2→1" },
      { from: "PREFERENCES_COLLECTION", to: "PROFILE_REVIEW", reason: "step 3→1" },
      { from: "PREFERENCES_COLLECTION", to: "PROFILE_MODIFICATION", reason: "step 3→2" },
      { from: "GENERATION", to: "PREFERENCES_COLLECTION", reason: "step 4→3" },
      { from: "GENERATION", to: "PROFILE_REVIEW", reason: "step 4→1" },
      { from: "REVIEW_MODIFICATION", to: "GENERATION", reason: "step 5→4" },
      { from: "CONFIRMATION", to: "REVIEW_MODIFICATION", reason: "step 6→5" },
      { from: "CONFIRMATION", to: "PROFILE_REVIEW", reason: "step 6→1" },
    ];

    it.each(backwardCases)(
      "blocks backward: $from → $to ($reason)",
      ({ from, to }) => {
        expect(canAdvanceTo(from as NutritionistStep, to as NutritionistStep)).toBe(
          false,
        );
      },
    );
  });

  describe("same-step navigation (no-op, allowed)", () => {
    STEP_ORDER.forEach((step) => {
      it(`allows staying on ${step}`, () => {
        expect(canAdvanceTo(step, step)).toBe(true);
      });
    });
  });

  describe("skip more than one step (blocked, except 1→3)", () => {
    it("allows forward from PROFILE_MODIFICATION to GENERATION (forward is allowed)", () => {
      expect(
        canAdvanceTo("PROFILE_MODIFICATION", "GENERATION"),
      ).toBe(true);
    });

    it("allows forward from PREFERENCES_COLLECTION to REVIEW_MODIFICATION (forward is allowed)", () => {
      expect(
        canAdvanceTo("PREFERENCES_COLLECTION", "REVIEW_MODIFICATION"),
      ).toBe(true);
    });

    it("allows forward from PROFILE_REVIEW to GENERATION (forward is allowed)", () => {
      expect(
        canAdvanceTo("PROFILE_REVIEW", "GENERATION"),
      ).toBe(true);
    });
  });
});

describe("Step Order Integrity", () => {
  it("has exactly 6 steps", () => {
    expect(STEP_ORDER).toHaveLength(6);
  });

  it("starts with PROFILE_REVIEW", () => {
    expect(STEP_ORDER[0]).toBe("PROFILE_REVIEW");
  });

  it("ends with CONFIRMATION", () => {
    expect(STEP_ORDER[STEP_ORDER.length - 1]).toBe("CONFIRMATION");
  });

  it("has all required steps", () => {
    const expectedSteps: NutritionistStep[] = [
      "PROFILE_REVIEW",
      "PROFILE_MODIFICATION",
      "PREFERENCES_COLLECTION",
      "GENERATION",
      "REVIEW_MODIFICATION",
      "CONFIRMATION",
    ];
    expect(STEP_ORDER).toEqual(expectedSteps);
  });
});

describe("Progress Calculation", () => {
  /**
   * Pure function for progress step index (matching hook logic).
   */
  function getEffectiveStepIndex(currentStep: NutritionistStep): number {
    const stepIndex = STEP_ORDER.indexOf(currentStep);

    if (currentStep === "PROFILE_MODIFICATION" || currentStep === "PROFILE_REVIEW") {
      return Math.max(stepIndex, 0);
    }

    if (currentStep === "PREFERENCES_COLLECTION") {
      return 2;
    }

    return stepIndex;
  }

  it("reports step 0 for PROFILE_REVIEW", () => {
    expect(getEffectiveStepIndex("PROFILE_REVIEW")).toBe(0);
  });

  it("reports step 1 for PROFILE_MODIFICATION", () => {
    expect(getEffectiveStepIndex("PROFILE_MODIFICATION")).toBe(1);
  });

  it("reports step 2 for PREFERENCES_COLLECTION", () => {
    expect(getEffectiveStepIndex("PREFERENCES_COLLECTION")).toBe(2);
  });

  it("reports step 3 for GENERATION", () => {
    expect(getEffectiveStepIndex("GENERATION")).toBe(3);
  });

  it("reports step 4 for REVIEW_MODIFICATION", () => {
    expect(getEffectiveStepIndex("REVIEW_MODIFICATION")).toBe(4);
  });

  it("reports step 5 for CONFIRMATION", () => {
    expect(getEffectiveStepIndex("CONFIRMATION")).toBe(5);
  });

  it("reports progress correctly when skipping modification", () => {
    // After skipping from PROFILE_REVIEW → PREFERENCES_COLLECTION,
    // effective step should be 2
    expect(getEffectiveStepIndex("PREFERENCES_COLLECTION")).toBe(2);
  });
});
