import type { OpenAIModel, RouterContext, RouterFeature } from "./schemas";
import { VISION_CAPABLE_MODELS } from "./schemas";

// ─── Tiers (exported for testability) ────────────────────────────────────────

export const ROUTER_TIERS = {
  low: "gpt-5-nano",   // score 0–2
  mid: "gpt-5-mini",   // score 3–5
  high: "gpt-5-mini",  // score 6+
} as const satisfies Record<string, OpenAIModel>;

export const ROUTER_THRESHOLDS = { midMin: 3, highMin: 6 } as const;

// ─── Scoring rules ────────────────────────────────────────────────────────────

type ScoreRule = { name: string; score: (c: RouterContext) => number };

const SCORE_RULES: ScoreRule[] = [
  {
    name: "allergies",
    score: (c) => Math.min(2, c.profile?.allergies?.length ?? 0),
  },
  {
    name: "forbiddenFoods",
    score: (c) => Math.min(2, c.profile?.forbiddenFoods?.length ?? 0),
  },
  {
    name: "dietRestrictive",
    score: (c) =>
      ["vegan", "pescatarian"].includes(c.profile?.dietType ?? "") ? 1 : 0,
  },
  {
    name: "goalDemanding",
    score: (c) =>
      ["gain", "lose", "hypertrophy", "strength"].includes(
        c.profile?.goal ?? ""
      )
        ? 1
        : 0,
  },
  {
    name: "complexity",
    score: (c) =>
      c.profile?.mealComplexity === "advanced"
        ? 2
        : c.profile?.mealComplexity === "moderate"
          ? 1
          : 0,
  },
  {
    name: "manyMeals",
    score: (c) => ((c.profile?.mealsPerDay ?? 0) >= 5 ? 1 : 0),
  },
  {
    name: "budgetConstraint",
    score: (c) => ((c.profile?.weeklyBudget ?? null) !== null ? 1 : 0),
  },
  {
    name: "advancedLevel",
    score: (c) =>
      c.profile?.level === "advanced"
        ? 2
        : c.profile?.level === "intermediate"
          ? 1
          : 0,
  },
  {
    name: "longChat",
    score: (c) => ((c.chatHistoryLength ?? 0) >= 10 ? 1 : 0),
  },
];

// ─── Vision guard ─────────────────────────────────────────────────────────────

function applyVisionGuard(model: OpenAIModel, feature: RouterFeature): OpenAIModel {
  if (feature !== "vision") return model;
  if (VISION_CAPABLE_MODELS.includes(model)) return model;
  const fallback = VISION_CAPABLE_MODELS[0];
  if (!fallback) throw new Error("No vision-capable model configured");
  return fallback;
}

// ─── selectModel ──────────────────────────────────────────────────────────────

/**
 * Pure function: select the best OpenAI model for a given request context.
 * Priority: manualOverride > scoring > thresholds > vision guard.
 * No side effects. Deterministic.
 */
export function selectModel(context: RouterContext): OpenAIModel {
  // 1. Manual override has absolute precedence (still subject to vision guard)
  if (context.manualOverride) {
    return applyVisionGuard(context.manualOverride, context.feature);
  }

  // 2. Compute complexity score from all rules
  const total = SCORE_RULES.reduce((sum, r) => sum + r.score(context), 0);

  // 3. Map score to tier
  const tier: OpenAIModel =
    total >= ROUTER_THRESHOLDS.highMin
      ? ROUTER_TIERS.high
      : total >= ROUTER_THRESHOLDS.midMin
        ? ROUTER_TIERS.mid
        : ROUTER_TIERS.low;

  // 4. Apply vision guard
  return applyVisionGuard(tier, context.feature);
}
