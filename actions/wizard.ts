"use server";

import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { generateMealPlan } from "@/lib/diet-service";
import type {
  InternalMealPlan,
  InternalDay,
  InternalMeal,
  MacroTotals,
} from "@/types/meal-plan";
import type { UserProfileSchema, NutritionistPreferencesSchema } from "@/lib/schemas";
import { redirect } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────

export interface GenerateWizardPlanResult {
  mealPlan: InternalMealPlan;
  springBootJson: Record<string, unknown>;
}

// ─── Server Actions ───────────────────────────────────────────────────────

/**
 * Generate a meal plan for the wizard flow and return it as InternalMealPlan.
 * Calls the existing generateMealPlan from diet-service synchronously.
 *
 * @param preferences - Optional plan-level preferences from wizard step 3.
 *   Passed directly to generateMealPlan; mapping (dislikedFoods → forbiddenFoods)
 *   is handled in diet-service.
 */
export async function generateWizardPlan(
  preferences?: NutritionistPreferencesSchema
): Promise<GenerateWizardPlanResult> {
  const session = await auth();
  if (!session?.userId) {
    redirect("/login");
  }

  const userId = session.userId;

  // Call existing generation service (creates plan in DB)
  const result = await generateMealPlan(userId, preferences);

  // Fetch the generated plan with meals
  const mealPlan = await prisma.mealPlan.findUnique({
    where: { id: result.mealPlanId },
    include: {
      meals: {
        orderBy: [{ dayOfWeek: "asc" }, { mealType: "asc" }],
      },
    },
  });

  if (!mealPlan) {
    throw new Error("No se ha podido obtener el plan de comidas generado");
  }

  // Fetch profile for Spring Boot output
  const profile = await prisma.profile.findUnique({
    where: { userId },
  });

  // Convert to InternalMealPlan
  const internalMealPlan = transformToInternalMealPlan(mealPlan);

  // Build Spring Boot JSON for confirmation step
  const springBootJson = buildSpringBootJson(profile, internalMealPlan);

  return { mealPlan: internalMealPlan, springBootJson };
}

/**
 * Update specific profile fields from the wizard modification step.
 */
export async function updateWizardProfile(
  changes: Partial<Record<string, unknown>>
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.userId) {
    return { success: false, error: "No autenticado" };
  }

  try {
    // Only update fields that are present in the changes object
    const updateData: Record<string, unknown> = {};

    const numericFields = [
      "weight",
      "height",
      "age",
      "targetCalories",
      "targetProtein",
      "targetCarbs",
      "targetFat",
      "cookingTimeAvailable",
      "weeklyBudget",
    ];

    for (const [key, value] of Object.entries(changes)) {
      if (value === undefined) continue;
      if (numericFields.includes(key)) {
        updateData[key] = typeof value === "string" ? parseFloat(value) : value;
      } else {
        updateData[key] = value;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return { success: true };
    }

    await prisma.profile.update({
      where: { userId: session.userId },
      data: updateData,
    });

    return { success: true };
  } catch (error) {
    console.error("[updateWizardProfile] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "No se ha podido actualizar el perfil",
    };
  }
}

// ─── Transform Helpers ────────────────────────────────────────────────────

interface DbMealPlan {
  id: string;
  startDate: Date;
  endDate: Date;
  status: string;
  totalCalories: number | null;
  meals: Array<{
    id: string;
    dayOfWeek: number;
    mealType: string;
    name: string;
    description: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
}

function transformToInternalMealPlan(dbPlan: DbMealPlan): InternalMealPlan {
  // Group meals by day
  const dayMap = new Map<number, InternalMeal[]>();

  for (const meal of dbPlan.meals) {
    const internalMeal: InternalMeal = {
      id: meal.id,
      dayOfWeek: meal.dayOfWeek,
      mealType: meal.mealType as InternalMeal["mealType"],
      name: meal.name,
      description: meal.description,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      ingredients: [],
      instructions: "",
    };

    const existing = dayMap.get(meal.dayOfWeek);
    if (existing) {
      existing.push(internalMeal);
    } else {
      dayMap.set(meal.dayOfWeek, [internalMeal]);
    }
  }

  // Build daily and weekly aggregates
  const days: InternalDay[] = [];
  const weeklyTotals: MacroTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

  const sortedDays = Array.from(dayMap.entries()).sort(
    ([a], [b]) => a - b
  );

  for (const [dayOfWeek, meals] of sortedDays) {
    const dailyTotals: MacroTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    for (const meal of meals) {
      dailyTotals.calories += meal.calories;
      dailyTotals.protein += meal.protein;
      dailyTotals.carbs += meal.carbs;
      dailyTotals.fat += meal.fat;
    }
    days.push({ dayOfWeek, meals, dailyTotals });

    weeklyTotals.calories += dailyTotals.calories;
    weeklyTotals.protein += dailyTotals.protein;
    weeklyTotals.carbs += dailyTotals.carbs;
    weeklyTotals.fat += dailyTotals.fat;
  }

  return { days, weeklyTotals };
}

function buildSpringBootJson(
  profile: {
    weight: number;
    height: number;
    age: number;
    sex: string;
    goal: string;
    activityLevel: string;
    trainingRoutine: string | null;
    dietType: string | null;
    budgetFriendly: boolean;
    weeklyBudget: number | null;
    mealComplexity: string | null;
    mealsPerDay: number;
    includeSnacks: boolean;
    varietyPreference: string | null;
    favoriteFoods: string[];
    eatingOutFrequency: string | null;
    cookingTimeAvailable: number | null;
    allergies: string[];
    forbiddenFoods: string[];
  } | null,
  mealPlan: InternalMealPlan
): Record<string, unknown> {
  const userProfile = profile
    ? {
        weight: profile.weight,
        height: profile.height,
        age: profile.age,
        sex: profile.sex as "male" | "female" | "other",
        goal: profile.goal as "lose" | "maintain" | "gain",
        activityLevel: profile.activityLevel as
          | "sedentary"
          | "light"
          | "moderate"
          | "active"
          | "veryActive",
        trainingRoutine: profile.trainingRoutine,
        dietType: profile.dietType as
          | "omnivore"
          | "vegetarian"
          | "vegan"
          | "pescatarian"
          | null,
        budgetFriendly: profile.budgetFriendly,
        weeklyBudget: profile.weeklyBudget,
        mealComplexity: profile.mealComplexity as
          | "simple"
          | "moderate"
          | "advanced"
          | null,
        mealsPerDay: profile.mealsPerDay,
        includeSnacks: profile.includeSnacks,
        varietyPreference: profile.varietyPreference as
          | "low"
          | "medium"
          | "high"
          | null,
        favoriteFoods: profile.favoriteFoods,
        eatingOutFrequency: profile.eatingOutFrequency as
          | "never"
          | "rarely"
          | "sometimes"
          | "often"
          | null,
        cookingTimeAvailable: profile.cookingTimeAvailable,
      }
    : null;

  const preferences = {
    allergies: profile?.allergies ?? [],
    dislikes: profile?.forbiddenFoods ?? [],
    maxCookingTime: profile?.cookingTimeAvailable ?? null,
  };

  const weeklyPlan = {
    days: mealPlan.days.map((day) => ({
      dayOfWeek: day.dayOfWeek,
      meals: day.meals.map((meal) => ({
        mealType: meal.mealType,
        name: meal.name,
        description: meal.description,
        calories: Math.round(meal.calories),
        protein: Math.round(meal.protein),
        carbs: Math.round(meal.carbs),
        fat: Math.round(meal.fat),
        ingredients: meal.ingredients,
        instructions: meal.instructions,
      })),
      dailyTotals: {
        calories: Math.round(day.dailyTotals.calories),
        protein: Math.round(day.dailyTotals.protein),
        carbs: Math.round(day.dailyTotals.carbs),
        fat: Math.round(day.dailyTotals.fat),
      },
    })),
    weeklyTotals: {
      calories: Math.round(mealPlan.weeklyTotals.calories),
      protein: Math.round(mealPlan.weeklyTotals.protein),
      carbs: Math.round(mealPlan.weeklyTotals.carbs),
      fat: Math.round(mealPlan.weeklyTotals.fat),
    },
    shoppingList: null,
  };

  return { userProfile, preferences, weeklyPlan };
}
