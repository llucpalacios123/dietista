// ─── Cheap Staple Foods ──────────────────────────────────────────────────

/** Foods that are universally cheap and nutritious — used as building blocks. */
export const CHEAP_STAPLE_FOODS: string[] = [
  // Grains & Legumes
  "rice", "brown rice", "pasta", "oats", "lentils", "chickpeas",
  "black beans", "kidney beans", "corn", "quinoa",
  // Proteins
  "eggs", "chicken thighs", "chicken drumsticks", "canned tuna",
  "canned sardines", "tofu", "ground turkey", "pork shoulder",
  // Vegetables
  "potatoes", "sweet potatoes", "carrots", "onions", "cabbage",
  "frozen spinach", "frozen broccoli", "frozen mixed vegetables",
  "canned tomatoes", "zucchini", "pumpkin",
  // Fruits
  "bananas", "apples", "oranges", "frozen berries",
  // Dairy & Alternatives
  "milk", "plain yogurt", "cottage cheese",
  // Pantry
  "peanut butter", "olive oil", "whole wheat bread", "tortillas",
];

/** Map of food name to estimated price per serving (in $). */
export const FOOD_PRICE_MAP: Record<string, number> = {
  rice: 0.15,
  "brown rice": 0.20,
  pasta: 0.20,
  oats: 0.10,
  lentils: 0.18,
  chickpeas: 0.20,
  "black beans": 0.22,
  "kidney beans": 0.22,
  corn: 0.15,
  quinoa: 0.40,
  eggs: 0.25,
  "chicken thighs": 0.80,
  "chicken drumsticks": 0.60,
  "chicken breast": 1.20,
  "canned tuna": 1.00,
  "canned sardines": 0.80,
  tofu: 0.50,
  "ground turkey": 1.10,
  "pork shoulder": 0.70,
  potatoes: 0.15,
  "sweet potatoes": 0.25,
  carrots: 0.10,
  onions: 0.08,
  cabbage: 0.12,
  "frozen spinach": 0.20,
  "frozen broccoli": 0.25,
  "frozen mixed vegetables": 0.30,
  "canned tomatoes": 0.20,
  zucchini: 0.20,
  pumpkin: 0.20,
  bananas: 0.15,
  apples: 0.30,
  oranges: 0.30,
  "frozen berries": 0.50,
  milk: 0.15,
  "plain yogurt": 0.25,
  "cottage cheese": 0.35,
  "peanut butter": 0.15,
  "olive oil": 0.10,
  "whole wheat bread": 0.15,
  tortillas: 0.15,
};

// ─── Ingredient Reuse Tracking ────────────────────────────────────────────

/** Tracked ingredient usage across the weekly plan. */
export interface IngredientUsage {
  /** How many days this ingredient has been used consecutively. */
  consecutiveDays: number;
  /** Total usage count across the week. */
  totalUses: number;
  /** Days on which it was used (dayOfWeek indices). */
  daysUsed: number[];
}

/** Maximum consecutive days an ingredient can appear. */
export const MAX_CONSECUTIVE_DAYS = 3;

/** Maximum total uses per ingredient per week. */
export const MAX_TOTAL_USES = 5;

/**
 * Build an ingredient usage map from a list of meals.
 * Extracts ingredient names (lowercased) from structured ingredient objects and tracks frequency.
 */
export function buildIngredientUsage(
  meals: { dayOfWeek: number; ingredients?: Array<{ name: string; quantity?: number; unit?: string }> }[],
): Map<string, IngredientUsage> {
  const usage = new Map<string, IngredientUsage>();

  for (const meal of meals) {
    if (!meal.ingredients) continue;

    for (const ingredient of meal.ingredients) {
      const key = ingredient.name.toLowerCase().trim();

      const existing = usage.get(key);
      if (existing) {
        existing.totalUses++;
        if (!existing.daysUsed.includes(meal.dayOfWeek)) {
          existing.daysUsed.push(meal.dayOfWeek);
        }
        // Calculate consecutive days
        const sorted = [...existing.daysUsed].sort((a, b) => a - b);
        let consecutive = 1;
        let maxConsecutive = 1;
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i] === sorted[i - 1] + 1) {
            consecutive++;
            maxConsecutive = Math.max(maxConsecutive, consecutive);
          } else {
            consecutive = 1;
          }
        }
        existing.consecutiveDays = maxConsecutive;
      } else {
        usage.set(key, {
          consecutiveDays: 1,
          totalUses: 1,
          daysUsed: [meal.dayOfWeek],
        });
      }
    }
  }

  return usage;
}

/**
 * Check if a given ingredient can still be used on a specific day.
 * Returns true if the ingredient has not exceeded reuse limits.
 */
export function canUseIngredient(
  ingredient: string,
  dayOfWeek: number,
  usage: Map<string, IngredientUsage>,
): boolean {
  const key = ingredient.toLowerCase().trim();
  const current = usage.get(key);

  if (!current) return true;
  if (current.totalUses >= MAX_TOTAL_USES) return false;

  // Check consecutive days
  if (current.daysUsed.includes(dayOfWeek - 1) && current.consecutiveDays >= MAX_CONSECUTIVE_DAYS) {
    return false;
  }

  return true;
}

// ─── Budget Estimation ────────────────────────────────────────────────────

/**
 * Estimate the cost of a meal based on its ingredients.
 * Returns estimated cost in dollars. Falls back to $1.50 per meal if no match.
 */
export function estimateMealCost(ingredients: string[]): number {
  let total = 0;
  let matched = 0;

  for (const ingredient of ingredients) {
    const key = ingredient.toLowerCase().trim();
    const price = FOOD_PRICE_MAP[key];

    if (price !== undefined) {
      total += price;
      matched++;
    }
  }

  // If no ingredients matched, use a generous default estimate
  if (matched === 0) {
    return 1.50;
  }

  // If only some matched, scale up proportionally
  if (matched < ingredients.length) {
    const avgMatched = total / matched;
    total += avgMatched * (ingredients.length - matched);
  }

  return Math.round(total * 100) / 100;
}

/**
 * Estimate total weekly cost of a meal plan.
 */
export function estimateWeeklyCost(
  days: { meals: { ingredients: string[] }[] }[],
): number {
  let total = 0;

  for (const day of days) {
    for (const meal of day.meals) {
      total += estimateMealCost(meal.ingredients);
    }
  }

  return Math.round(total * 100) / 100;
}

/**
 * Check if the estimated plan cost fits within the user's budget.
 * Returns { withinBudget, estimatedCost, budget, difference }.
 */
export function validateBudget(
  estimatedCost: number,
  budget: number,
): { withinBudget: boolean; estimatedCost: number; budget: number; difference: number } {
  return {
    withinBudget: estimatedCost <= budget,
    estimatedCost,
    budget,
    difference: Math.round((budget - estimatedCost) * 100) / 100,
  };
}

// ─── Economic Prompt Generation ───────────────────────────────────────────

/**
 * Build an economic meal planning prompt instruction string.
 * This is appended to the AI system prompt when economic mode is enabled.
 */
export function buildEconomicPrompt(options: {
  budget?: number | null;
  budgetFriendly: boolean;
  mealComplexity?: string | null;
  mealsPerDay?: number;
}): string {
  if (!options.budgetFriendly) return "";

  const parts: string[] = [
    "## Economic Mode (Budget-Friendly)",
    "Apply these rules to keep the meal plan affordable:",
    "",
    "### Ingredient Reuse Rules:",
    "- Proteins: Cook once, use 2-3 times (e.g., roast chicken → grilled breast → shredded leftovers)",
    "- Grains: Batch cook rice/quinoa, use across 3-4 meals that week",
    "- Vegetables: Roast large batches, use in salads, bowls, and wraps",
    "- Sauces: Make one base sauce, vary with spices across meals",
    "- NEVER reuse the same protein more than 3 consecutive days",
    "",
    "### Cheap Food Prioritization:",
    `- Prioritize these affordable staples: ${CHEAP_STAPLE_FOODS.slice(0, 15).join(", ")}`,
    "- Use legumes as protein source 2-3 times per week (cheap + nutritious)",
    "- Favor frozen vegetables over fresh when out of season",
    "- Use eggs as a versatile protein (breakfast, lunch, or dinner)",
    "",
  ];

  if (options.budget !== null && options.budget !== undefined) {
    parts.push(`### Budget Constraint:`);
    parts.push(`- Total estimated weekly cost MUST NOT exceed $${options.budget}`);
    parts.push("- Estimate cost at roughly $1.50-3.00 per meal for budget mode");
    parts.push("- Use fewer expensive ingredients (salmon, steak, specialty items)");
    parts.push("- If budget is very tight, increase grain/legume portions and reduce meat");
    parts.push("");
  }

  if (options.mealComplexity === "simple") {
    parts.push("### Simple Meal Complexity:");
    parts.push("- Meals should require 20 minutes or less of active cooking time");
    parts.push("- Use pre-cooked or canned ingredients where possible");
    parts.push("- Minimize steps: 3-4 steps maximum per recipe");
    parts.push("");
  }

  return parts.join("\n");
}

// ─── Macro Coherence Check ────────────────────────────────────────────────

/** Tolerance for macro deviations (as a fraction, e.g., 0.05 = 5%). */
export const MACRO_TOLERANCE = 0.05;

/**
 * Check if modified macros are within tolerance of original targets.
 * Returns deviations for each macro.
 */
export function checkMacroCoherence(
  original: { calories: number; protein: number; carbs: number; fat: number },
  modified: { calories: number; protein: number; carbs: number; fat: number },
): {
  withinTolerance: boolean;
  deviations: {
    calories: { absolute: number; percentage: number; withinTolerance: boolean };
    protein: { absolute: number; percentage: number; withinTolerance: boolean };
    carbs: { absolute: number; percentage: number; withinTolerance: boolean };
    fat: { absolute: number; percentage: number; withinTolerance: boolean };
  };
} {
  const calc = (orig: number, mod: number) => {
    const absolute = mod - orig;
    const percentage = orig > 0 ? Math.abs(absolute) / orig : 0;
    return {
      absolute: Math.round(absolute * 100) / 100,
      percentage: Math.round(percentage * 10000) / 100,
      withinTolerance: percentage <= MACRO_TOLERANCE,
    };
  };

  const deviations = {
    calories: calc(original.calories, modified.calories),
    protein: calc(original.protein, modified.protein),
    carbs: calc(original.carbs, modified.carbs),
    fat: calc(original.fat, modified.fat),
  };

  return {
    withinTolerance:
      deviations.calories.withinTolerance &&
      deviations.protein.withinTolerance &&
      deviations.carbs.withinTolerance &&
      deviations.fat.withinTolerance,
    deviations,
  };
}

/**
 * Calculate daily macro totals from a list of meals.
 */
export function calculateDailyTotals(
  meals: { calories: number; protein: number; carbs: number; fat: number }[],
): { calories: number; protein: number; carbs: number; fat: number } {
  return meals.reduce(
    (totals, meal) => ({
      calories: totals.calories + meal.calories,
      protein: totals.protein + meal.protein,
      carbs: totals.carbs + meal.carbs,
      fat: totals.fat + meal.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

/**
 * Calculate weekly macro totals from a list of days.
 */
export function calculateWeeklyTotals(
  days: { dailyTotals: { calories: number; protein: number; carbs: number; fat: number } }[],
): { calories: number; protein: number; carbs: number; fat: number } {
  return days.reduce(
    (totals, day) => ({
      calories: totals.calories + day.dailyTotals.calories,
      protein: totals.protein + day.dailyTotals.protein,
      carbs: totals.carbs + day.dailyTotals.carbs,
      fat: totals.fat + day.dailyTotals.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}
