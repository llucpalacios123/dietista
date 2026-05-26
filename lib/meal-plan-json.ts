import {
  springBootOutputSchema,
  type SpringBootOutputSchema,
  type UserProfileSchema,
  type NutritionistPreferencesSchema,
} from "@/lib/schemas";
import type {
  InternalMeal,
  InternalDay,
  InternalMealPlan,
  SpringBootMealPlanOutput,
} from "@/types/meal-plan";
import { calculateDailyTotals, calculateWeeklyTotals } from "@/lib/economic-meals";

// ─── Transform Internal to Spring Boot Format ─────────────────────────────

/**
 * Transform an internal meal to the Spring Boot meal format.
 */
export function toSpringBootMeal(meal: InternalMeal) {
  return {
    mealType: meal.mealType,
    name: meal.name,
    description: meal.description,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    ingredients: meal.ingredients,
    instructions: meal.instructions,
  };
}

/**
 * Transform an internal day to the Spring Boot day format.
 */
export function toSpringBootDay(day: InternalDay) {
  return {
    dayOfWeek: day.dayOfWeek,
    meals: day.meals.map(toSpringBootMeal),
    dailyTotals: day.dailyTotals,
  };
}

/**
 * Transform an internal meal plan to the Spring Boot weekly plan format.
 */
export function toSpringBootWeeklyPlan(plan: InternalMealPlan) {
  return {
    days: plan.days.map(toSpringBootDay),
    weeklyTotals: plan.weeklyTotals,
    shoppingList: null,
  };
}

// ─── Generate Complete Spring Boot JSON Output ────────────────────────────

/**
 * Assemble the complete Spring Boot JSON output from profile, preferences,
 * and the generated meal plan.
 */
export function buildSpringBootOutput(params: {
  profile: UserProfileSchema;
  preferences: NutritionistPreferencesSchema;
  mealPlan: InternalMealPlan;
}): SpringBootMealPlanOutput {
  return {
    userProfile: {
      weight: params.profile.weight,
      height: params.profile.height,
      age: params.profile.age,
      sex: params.profile.sex,
      goal: params.profile.goal,
      activityLevel: params.profile.activityLevel,
      trainingRoutine: params.profile.trainingRoutine,
      dietType: params.profile.dietType,
      budgetFriendly: params.preferences.budgetFriendly,
      weeklyBudget: params.preferences.weeklyBudget,
      mealComplexity: params.preferences.mealComplexity,
      mealsPerDay: params.preferences.mealsPerDay,
      includeSnacks: params.preferences.includeSnacks,
      varietyPreference: params.preferences.varietyPreference,
      favoriteFoods:
        params.preferences.favoriteFoods.length > 0
          ? params.preferences.favoriteFoods
          : null,
      eatingOutFrequency: params.preferences.eatingOutFrequency,
      cookingTimeAvailable: params.preferences.cookingTimeAvailable,
    },
    preferences: {
      allergies: params.preferences.allergies,
      dislikes: params.preferences.dislikedFoods,
      maxCookingTime: params.preferences.cookingTimeAvailable,
    },
    weeklyPlan: toSpringBootWeeklyPlan(params.mealPlan),
  };
}

// ─── Validation ───────────────────────────────────────────────────────────

/** Result of JSON schema validation. */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  data?: SpringBootOutputSchema;
  missingFields: string[];
}

/**
 * Validate a meal plan output against the Spring Boot JSON schema.
 * Returns detailed validation result with fix suggestions.
 */
export function validateSpringBootOutput(data: unknown): ValidationResult {
  const parsed = springBootOutputSchema.safeParse(data);

  if (parsed.success) {
    return {
      valid: true,
      errors: [],
      data: parsed.data,
      missingFields: [],
    };
  }

  const errors = parsed.error.errors.map((e) => {
    const path = e.path.join(".");
    return `${path}: ${e.message}`;
  });

  const missingFields = parsed.error.errors
    .filter((e) => e.code === "invalid_type" && e.received === "undefined")
    .map((e) => e.path.join("."));

  return {
    valid: false,
    errors,
    missingFields,
  };
}

/**
 * Auto-fix missing fields in a meal plan output.
 * Attempts to calculate missing dailyTotals and weeklyTotals from meal data.
 * Returns the fixed output or null if unfixable.
 */
export function autoFixOutput(
  data: Record<string, unknown>,
): Record<string, unknown> | null {
  try {
    const fixed = { ...data } as Record<string, unknown>;

    // Fix weeklyPlan if present
    const weeklyPlan = fixed.weeklyPlan as Record<string, unknown> | undefined;
    if (weeklyPlan) {
      const days = weeklyPlan.days as Array<Record<string, unknown>> | undefined;

      if (days && Array.isArray(days)) {
        // Fix dailyTotals
        for (const day of days) {
          if (!day.dailyTotals) {
            const meals = day.meals as Array<{
              calories: number;
              protein: number;
              carbs: number;
              fat: number;
            }> | undefined;
            if (meals && Array.isArray(meals)) {
              day.dailyTotals = calculateDailyTotals(meals);
            }
          }
        }

        // Fix weeklyTotals
        if (!weeklyPlan.weeklyTotals) {
          const daysWithTotals = days.filter(
            (d) => d.dailyTotals !== undefined,
          ) as Array<{ dailyTotals: { calories: number; protein: number; carbs: number; fat: number } }>;
          if (daysWithTotals.length === days.length) {
            weeklyPlan.weeklyTotals = calculateWeeklyTotals(daysWithTotals);
          }
        }
      }

      fixed.weeklyPlan = weeklyPlan;
    }

    return fixed;
  } catch {
    return null;
  }
}

/**
 * Build, validate, and auto-fix (if needed) a Spring Boot JSON output.
 */
export function buildAndValidateSpringBootOutput(params: {
  profile: UserProfileSchema;
  preferences: NutritionistPreferencesSchema;
  mealPlan: InternalMealPlan;
}): {
  success: boolean;
  data?: SpringBootOutputSchema;
  errors: string[];
  fixed: boolean;
} {
  const output = buildSpringBootOutput(params);

  // Try direct validation first
  const result = validateSpringBootOutput(output);

  if (result.valid) {
    return { success: true, data: result.data, errors: [], fixed: false };
  }

  // Try auto-fix
  const fixedData = autoFixOutput(output as unknown as Record<string, unknown>);
  if (fixedData) {
    const revalidated = validateSpringBootOutput(fixedData);
    if (revalidated.valid) {
      return {
        success: true,
        data: revalidated.data,
        errors: [],
        fixed: true,
      };
    }
    return {
      success: false,
      errors: revalidated.errors,
      fixed: true,
    };
  }

  return {
    success: false,
    errors: result.errors,
    fixed: false,
  };
}

// ─── AI-Generated Plan Parsing ────────────────────────────────────────────

/**
 * Safely cast raw ingredients data to `Ingredient[]`.
 * Handles both string arrays (backward compat) and object arrays.
 */
function castIngredients(raw: unknown): Array<{ name: string; quantity?: number; unit?: string }> {
  if (!Array.isArray(raw)) return [];
  return raw.map((item: unknown) => {
    if (typeof item === "string") return { name: item };
    if (typeof item === "object" && item !== null && "name" in item) {
      const obj = item as Record<string, unknown>;
      return {
        name: String(obj.name ?? ""),
        ...(typeof obj.quantity === "number" ? { quantity: obj.quantity } : {}),
        ...(typeof obj.unit === "string" && obj.unit ? { unit: obj.unit } : {}),
      };
    }
    return { name: String(item) };
  });
}

/**
 * Parse AI-generated plan into the internal meal plan format.
 * Handles both Spring Boot format and flat array formats.
 */
export function parseAIGeneratedPlan(raw: unknown): InternalMealPlan | null {
  if (!raw || typeof raw !== "object") return null;

  const data = raw as Record<string, unknown>;

  // Case 1: Already in Spring Boot weekly plan format
  if (data.days && Array.isArray(data.days)) {
    const days: InternalDay[] = data.days.map((d: Record<string, unknown>, i: number) => {
      const meals: InternalMeal[] = Array.isArray(d.meals)
        ? d.meals.map((m: Record<string, unknown>, mi: number) => ({
            id: `meal-${i}-${mi}`,
            dayOfWeek: typeof d.dayOfWeek === "number" ? d.dayOfWeek : i,
            mealType: (m.mealType as InternalMeal["mealType"]) ?? "snack",
            name: String(m.name ?? "Meal"),
            description: String(m.description ?? ""),
            calories: Number(m.calories) || 0,
            protein: Number(m.protein) || 0,
            carbs: Number(m.carbs) || 0,
            fat: Number(m.fat) || 0,
            ingredients: castIngredients(m.ingredients),
            instructions: String(m.instructions ?? ""),
          }))
        : [];

      return {
        dayOfWeek: typeof d.dayOfWeek === "number" ? d.dayOfWeek : i,
        meals,
        dailyTotals: d.dailyTotals
          ? {
              calories: Number((d.dailyTotals as Record<string, unknown>).calories) || 0,
              protein: Number((d.dailyTotals as Record<string, unknown>).protein) || 0,
              carbs: Number((d.dailyTotals as Record<string, unknown>).carbs) || 0,
              fat: Number((d.dailyTotals as Record<string, unknown>).fat) || 0,
            }
          : calculateDailyTotals(meals),
      };
    });

    return {
      days,
      weeklyTotals: data.weeklyTotals
        ? {
            calories: Number((data.weeklyTotals as Record<string, unknown>).calories) || 0,
            protein: Number((data.weeklyTotals as Record<string, unknown>).protein) || 0,
            carbs: Number((data.weeklyTotals as Record<string, unknown>).carbs) || 0,
            fat: Number((data.weeklyTotals as Record<string, unknown>).fat) || 0,
          }
        : calculateWeeklyTotals(days),
    };
  }

  // Case 2: Flat array of meals (old format)
  if (Array.isArray(data.meals) || Array.isArray(raw)) {
    const flatMeals: Array<Record<string, unknown>> = Array.isArray(data.meals)
      ? (data.meals as Array<Record<string, unknown>>)
      : (raw as Array<Record<string, unknown>>);

    // Group by dayOfWeek
    const dayMap = new Map<number, InternalMeal[]>();
    for (let i = 0; i < flatMeals.length; i++) {
      const m = flatMeals[i];
      const dow = typeof m.dayOfWeek === "number" ? m.dayOfWeek : Math.floor(i / 5);
      const meal: InternalMeal = {
        id: `meal-${i}`,
        dayOfWeek: dow,
        mealType: (m.mealType as InternalMeal["mealType"]) ?? "snack",
        name: String(m.name ?? "Meal"),
        description: String(m.description ?? ""),
        calories: Number(m.calories) || 0,
        protein: Number(m.protein) || 0,
        carbs: Number(m.carbs) || 0,
        fat: Number(m.fat) || 0,
        ingredients: castIngredients(m.ingredients),
        instructions: String(m.instructions ?? ""),
      };

      const existing = dayMap.get(dow) ?? [];
      existing.push(meal);
      dayMap.set(dow, existing);
    }

    const days: InternalDay[] = [];
    for (const [dow, meals] of dayMap.entries()) {
      days.push({
        dayOfWeek: dow,
        meals,
        dailyTotals: calculateDailyTotals(meals),
      });
    }
    days.sort((a, b) => a.dayOfWeek - b.dayOfWeek);

    return {
      days,
      weeklyTotals: calculateWeeklyTotals(days),
    };
  }

  return null;
}
