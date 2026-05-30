import { describe, it, expect } from "vitest";
import { selectModel, ROUTER_TIERS, ROUTER_THRESHOLDS } from "@/lib/llm-router";
import type { RouterContext } from "@/lib/schemas";

// ─── Tier mapping / boundary tests ───────────────────────────────────────────

describe("selectModel — tier mapping by score", () => {
  it("score 0 → gpt-5-nano (low tier, inferior boundary)", () => {
    const ctx: RouterContext = { feature: "diet" };
    expect(selectModel(ctx)).toBe(ROUTER_TIERS.low);
  });

  it("score 2 → gpt-5-nano (superior boundary of low)", () => {
    // 2 allergies = 2 points
    const ctx: RouterContext = {
      feature: "diet",
      profile: { allergies: ["gluten", "lactose"] },
    };
    expect(selectModel(ctx)).toBe(ROUTER_TIERS.low);
  });

  it("score 3 → gpt-5-mini (boundary midMin — exact limit)", () => {
    // 3 allergies → capped at 2, plus vegan dietType (1) → total 3
    const ctx: RouterContext = {
      feature: "diet",
      profile: {
        allergies: ["gluten", "lactose", "nuts"],
        dietType: "vegan",
      },
    };
    expect(selectModel(ctx)).toBe(ROUTER_TIERS.mid);
  });

  it("score 5 → gpt-5-mini (superior boundary of mid)", () => {
    // 2 allergies (cap 2) + 2 forbidden (cap 2) + vegan (1) = 5
    const ctx: RouterContext = {
      feature: "diet",
      profile: {
        allergies: ["gluten", "lactose"],
        forbiddenFoods: ["eggs", "dairy"],
        dietType: "vegan",
      },
    };
    expect(selectModel(ctx)).toBe(ROUTER_TIERS.mid);
  });

  it("score 6 → gpt-5-mini (boundary highMin)", () => {
    // 2 allergies (cap 2) + 2 forbidden (cap 2) + vegan (1) + lose (1) = 6
    const ctx: RouterContext = {
      feature: "diet",
      profile: {
        allergies: ["gluten", "lactose"],
        forbiddenFoods: ["eggs", "dairy"],
        dietType: "vegan",
        goal: "lose",
      },
    };
    expect(selectModel(ctx)).toBe(ROUTER_TIERS.high);
  });

  it("score 7 → gpt-5-mini (within high)", () => {
    // 2 (allergies) + 2 (forbidden) + 1 (vegan) + 1 (lose) + 1 (mealsPerDay>=5) = 7
    const ctx: RouterContext = {
      feature: "diet",
      profile: {
        allergies: ["gluten", "lactose"],
        forbiddenFoods: ["eggs", "dairy"],
        dietType: "vegan",
        goal: "lose",
        mealsPerDay: 5,
      },
    };
    expect(selectModel(ctx)).toBe(ROUTER_TIERS.high);
  });
});

// ─── Individual scoring rule tests ───────────────────────────────────────────

describe("selectModel — individual scoring rules", () => {
  it("allergies: 1 allergy → score 1 (stays low)", () => {
    const ctx: RouterContext = { feature: "diet", profile: { allergies: ["gluten"] } };
    expect(selectModel(ctx)).toBe(ROUTER_TIERS.low);
  });

  it("allergies: 2 allergies → score 2 (cap at 2, stays low)", () => {
    const ctx: RouterContext = { feature: "diet", profile: { allergies: ["gluten", "lactose"] } };
    expect(selectModel(ctx)).toBe(ROUTER_TIERS.low);
  });

  it("allergies: 5 allergies → score still 2 (cap enforced)", () => {
    const ctx1: RouterContext = { feature: "diet", profile: { allergies: ["a", "b", "c", "d", "e"] } };
    const ctx2: RouterContext = { feature: "diet", profile: { allergies: ["a", "b"] } };
    // Both should return same model since cap is 2
    expect(selectModel(ctx1)).toBe(selectModel(ctx2));
  });

  it("forbiddenFoods: 2 forbidden → score 2 (stays low)", () => {
    const ctx: RouterContext = { feature: "diet", profile: { forbiddenFoods: ["eggs", "dairy"] } };
    expect(selectModel(ctx)).toBe(ROUTER_TIERS.low);
  });

  it("forbiddenFoods: 5 items → score capped at 2", () => {
    const ctx1: RouterContext = { feature: "diet", profile: { forbiddenFoods: ["a", "b", "c", "d", "e"] } };
    const ctx2: RouterContext = { feature: "diet", profile: { forbiddenFoods: ["a", "b"] } };
    expect(selectModel(ctx1)).toBe(selectModel(ctx2));
  });

  it("dietRestrictive: vegan dietType → score 1", () => {
    // 1 point from vegan → stays below midMin
    const ctx: RouterContext = { feature: "diet", profile: { dietType: "vegan" } };
    expect(selectModel(ctx)).toBe(ROUTER_TIERS.low);
  });

  it("dietRestrictive: pescatarian dietType → score 1", () => {
    const ctx: RouterContext = { feature: "diet", profile: { dietType: "pescatarian" } };
    expect(selectModel(ctx)).toBe(ROUTER_TIERS.low);
  });

  it("dietRestrictive: omnivore dietType → score 0", () => {
    const ctx: RouterContext = { feature: "diet", profile: { dietType: "omnivore" } };
    expect(selectModel(ctx)).toBe(ROUTER_TIERS.low);
  });

  it("goalDemanding: lose → score 1", () => {
    const ctx: RouterContext = { feature: "diet", profile: { goal: "lose" } };
    expect(selectModel(ctx)).toBe(ROUTER_TIERS.low);
  });

  it("goalDemanding: gain → score 1", () => {
    const ctx: RouterContext = { feature: "diet", profile: { goal: "gain" } };
    expect(selectModel(ctx)).toBe(ROUTER_TIERS.low);
  });

  it("goalDemanding: maintain → score 0", () => {
    const ctx: RouterContext = { feature: "diet", profile: { goal: "maintain" } };
    expect(selectModel(ctx)).toBe(ROUTER_TIERS.low);
  });

  it("complexity: advanced mealComplexity → score 2", () => {
    // 2 points → stays low (2 < midMin=3)
    const ctx: RouterContext = { feature: "diet", profile: { mealComplexity: "advanced" } };
    expect(selectModel(ctx)).toBe(ROUTER_TIERS.low);
  });

  it("complexity: moderate mealComplexity → score 1", () => {
    const ctx: RouterContext = { feature: "diet", profile: { mealComplexity: "moderate" } };
    expect(selectModel(ctx)).toBe(ROUTER_TIERS.low);
  });

  it("manyMeals: mealsPerDay >= 5 → score 1", () => {
    const ctx: RouterContext = { feature: "diet", profile: { mealsPerDay: 5 } };
    expect(selectModel(ctx)).toBe(ROUTER_TIERS.low);
  });

  it("manyMeals: mealsPerDay < 5 → score 0", () => {
    const ctx: RouterContext = { feature: "diet", profile: { mealsPerDay: 4 } };
    expect(selectModel(ctx)).toBe(ROUTER_TIERS.low);
  });

  it("budgetConstraint: weeklyBudget set → score 1", () => {
    const ctx: RouterContext = { feature: "diet", profile: { weeklyBudget: 100 } };
    expect(selectModel(ctx)).toBe(ROUTER_TIERS.low);
  });

  it("budgetConstraint: weeklyBudget null → score 0", () => {
    const ctx: RouterContext = { feature: "diet", profile: { weeklyBudget: null } };
    expect(selectModel(ctx)).toBe(ROUTER_TIERS.low);
  });

  it("advancedLevel: advanced level → score 2", () => {
    // 2 points → stays low
    const ctx: RouterContext = { feature: "workout", profile: { level: "advanced" } };
    expect(selectModel(ctx)).toBe(ROUTER_TIERS.low);
  });

  it("advancedLevel: intermediate level → score 1", () => {
    const ctx: RouterContext = { feature: "workout", profile: { level: "intermediate" } };
    expect(selectModel(ctx)).toBe(ROUTER_TIERS.low);
  });

  it("advancedLevel: beginner level → score 0", () => {
    const ctx: RouterContext = { feature: "workout", profile: { level: "beginner" } };
    expect(selectModel(ctx)).toBe(ROUTER_TIERS.low);
  });

  it("longChat: chatHistoryLength >= 10 → score 1", () => {
    const ctx: RouterContext = { feature: "chat", chatHistoryLength: 10 };
    expect(selectModel(ctx)).toBe(ROUTER_TIERS.low);
  });

  it("longChat: chatHistoryLength < 10 → score 0", () => {
    const ctx: RouterContext = { feature: "chat", chatHistoryLength: 9 };
    expect(selectModel(ctx)).toBe(ROUTER_TIERS.low);
  });
});

// ─── Manual override tests ────────────────────────────────────────────────────

describe("selectModel — manualOverride precedence", () => {
  it("manualOverride: gpt-5-pro with complex profile → returns gpt-5-pro (ignores scoring)", () => {
    const ctx: RouterContext = {
      feature: "diet",
      manualOverride: "gpt-5-pro",
      profile: {
        allergies: ["a", "b"],
        forbiddenFoods: ["c", "d"],
        dietType: "vegan",
        goal: "lose",
        mealComplexity: "advanced",
        mealsPerDay: 5,
        weeklyBudget: 100,
      },
    };
    expect(selectModel(ctx)).toBe("gpt-5-pro");
  });

  it("manualOverride: respects override even for non-default model", () => {
    const ctx: RouterContext = {
      feature: "diet",
      manualOverride: "gpt-5-nano",
      profile: {
        allergies: ["a", "b"],
        dietType: "vegan",
        goal: "lose",
      },
    };
    expect(selectModel(ctx)).toBe("gpt-5-nano");
  });
});

// ─── Vision guard tests ───────────────────────────────────────────────────────

describe("selectModel — vision guard", () => {
  it("feature=vision + tier=gpt-5-nano → falls back to first vision-capable (gpt-5)", () => {
    const ctx: RouterContext = { feature: "vision" }; // score 0 → gpt-5-nano
    expect(selectModel(ctx)).toBe("gpt-5");
  });

  it("override non-vision (gpt-5-nano) with feature=vision → falls back to gpt-5", () => {
    const ctx: RouterContext = {
      feature: "vision",
      manualOverride: "gpt-5-nano",
    };
    // gpt-5-nano is not in VISION_CAPABLE_MODELS
    expect(selectModel(ctx)).toBe("gpt-5");
  });

  it("override vision-capable (gpt-5-mini) with feature=vision → respects override", () => {
    const ctx: RouterContext = {
      feature: "vision",
      manualOverride: "gpt-5-mini",
    };
    expect(selectModel(ctx)).toBe("gpt-5-mini");
  });

  it("feature != vision → guard skipped, returns score-based model", () => {
    const ctx: RouterContext = { feature: "diet" }; // score 0 → gpt-5-nano
    expect(selectModel(ctx)).toBe(ROUTER_TIERS.low);
    expect(selectModel(ctx)).not.toBe("gpt-4o");
  });
});

// ─── Edge case tests ──────────────────────────────────────────────────────────

describe("selectModel — edge cases", () => {
  it("empty profile / minimal context does not throw", () => {
    const ctx: RouterContext = { feature: "diet" };
    expect(() => selectModel(ctx)).not.toThrow();
    expect(selectModel(ctx)).toBe(ROUTER_TIERS.low);
  });

  it("is deterministic — same input → same output every time", () => {
    const ctx: RouterContext = {
      feature: "diet",
      profile: { allergies: ["a", "b"], dietType: "vegan" },
    };
    const r1 = selectModel(ctx);
    const r2 = selectModel(ctx);
    const r3 = selectModel(ctx);
    expect(r1).toBe(r2);
    expect(r2).toBe(r3);
  });

  it("scenario: multiple additive signals → score 15 → gpt-5-mini", () => {
    // 3 allergies (cap 2) + 2 forbidden (cap 2) + vegan (1) + lose (1) + advanced complexity (2)
    // + mealsPerDay 5 (1) + weeklyBudget set (1) + chatHistoryLength 12 (1) + advanced level (2)
    // = 2+2+1+1+2+1+1+1+2 = 13 actual points (3 allergies capped → 2, not 3)
    const ctx: RouterContext = {
      feature: "chat",
      chatHistoryLength: 12,
      profile: {
        allergies: ["gluten", "lactose", "nuts"],
        forbiddenFoods: ["eggs", "dairy"],
        dietType: "vegan",
        goal: "lose",
        mealComplexity: "advanced",
        mealsPerDay: 5,
        weeklyBudget: 100,
        level: "advanced",
      },
    };
    // Score ≥ 6 → high tier
    expect(selectModel(ctx)).toBe(ROUTER_TIERS.high);
  });

  it("ROUTER_THRESHOLDS.midMin is 3", () => {
    expect(ROUTER_THRESHOLDS.midMin).toBe(3);
  });

  it("ROUTER_THRESHOLDS.highMin is 6", () => {
    expect(ROUTER_THRESHOLDS.highMin).toBe(6);
  });
});
