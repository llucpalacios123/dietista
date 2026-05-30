import { prisma } from "./prisma";
import { generateDiet, generateDietFromPlanAI, type DietGenerationParams } from "./openai";
import { DEFAULT_MODEL, type NutritionistPreferencesSchema, type OpenAIModel } from "./schemas";
import { selectModel } from "./llm-router";
import { calculateTargets, coalescePreferences } from "./nutrition-targets";

/**
 * Generate a weekly meal plan for a user based on their profile.
 * Creates a MealPlan with status=draft and populates Meal records.
 *
 * @param userId - The authenticated user's ID.
 * @param preferences - Optional plan-level preference overrides from the wizard (step 3).
 *   Each field is coalesced with the profile: plan value wins when non-null/non-empty,
 *   otherwise the profile value is used.
 *
 *   MAPPING: `preferences.dislikedFoods` → `MealPlan.forbiddenFoods`
 *   (wizard uses `dislikedFoods`, schema uses `forbiddenFoods`)
 */
export async function generateMealPlan(
  userId: string,
  preferences?: NutritionistPreferencesSchema
): Promise<{
  mealPlanId: string;
  mealCount: number;
}> {
  // Fetch user profile
  const profile = await prisma.profile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new Error("No tienes perfil. Completa tu perfil primero.");
  }

  // ── Preference coalescence (shared helper) ───────────────────────────────
  const eff = coalescePreferences(profile, preferences);

  const effectiveAllergies = eff.allergies;
  const effectiveForbiddenFoods = eff.forbiddenFoods;
  const effectiveFavoriteFoods = eff.favoriteFoods;
  const effectiveDietType = eff.dietType;
  const effectiveMealComplexity = eff.mealComplexity;
  const effectiveMealsPerDay = eff.mealsPerDay;
  const effectiveIncludeSnacks = eff.includeSnacks;
  const effectiveVarietyPreference = eff.varietyPreference;
  const effectiveBudgetFriendly = eff.budgetFriendly;
  const effectiveWeeklyBudget = eff.weeklyBudget;
  const effectiveEatingOutFrequency = eff.eatingOutFrequency;
  const effectiveCookingTime = eff.cookingTimeAvailable;

  // ── Macro targets (shared helper — Mifflin-St Jeor) ──────────────────────
  const { calories: targetCalories, protein: targetProtein, carbs: targetCarbs, fat: targetFat } =
    calculateTargets(profile);

  // Build OpenAI params with effective preferences
  const params: DietGenerationParams = {
    targetCalories,
    targetProtein,
    targetCarbs,
    targetFat,
    goal: profile.goal,
    activityLevel: profile.activityLevel,
    allergies: effectiveAllergies,
    forbiddenFoods: effectiveForbiddenFoods,
    dietType: effectiveDietType ?? undefined,
    mealComplexity: effectiveMealComplexity ?? undefined,
    mealsPerDay: effectiveMealsPerDay,
    includeSnacks: effectiveIncludeSnacks,
    varietyPreference: effectiveVarietyPreference ?? undefined,
    favoriteFoods: effectiveFavoriteFoods,
    budgetFriendly: effectiveBudgetFriendly,
    weeklyBudget: effectiveWeeklyBudget ?? undefined,
    eatingOutFrequency: effectiveEatingOutFrequency ?? undefined,
    cookingTimeAvailable: effectiveCookingTime ?? undefined,
    model: preferences?.model ?? selectModel({
      feature: 'diet',
      profile: {
        allergies: effectiveAllergies,
        forbiddenFoods: effectiveForbiddenFoods,
        dietType: effectiveDietType ?? null,
        goal: profile.goal,
        mealComplexity: effectiveMealComplexity ?? null,
        mealsPerDay: effectiveMealsPerDay,
        weeklyBudget: effectiveWeeklyBudget ?? null,
      },
    }),
  };

  // Call OpenAI — measure generation duration
  const t0 = Date.now();
  const meals = await generateDiet(params);
  const generationDurationMs = Date.now() - t0;

  // Calculate week boundaries (start of current week = Monday)
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sunday, 1=Monday, ...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const startDate = new Date(now);
  startDate.setDate(now.getDate() + mondayOffset);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);

  // Create MealPlan + Meals in a transaction
  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);

  // Preference snapshot to persist — null means "use profile at read time"
  const planPreferences = preferences
    ? {
        dietType: preferences.dietType ?? null,
        allergies: preferences.allergies ?? [],
        forbiddenFoods: preferences.dislikedFoods ?? [], // mapping
        mealComplexity: preferences.mealComplexity ?? null,
        cookingTimeAvailable: preferences.cookingTimeAvailable ?? null,
        mealsPerDay: preferences.mealsPerDay ?? null,
        includeSnacks: preferences.includeSnacks ?? null,
        varietyPreference: preferences.varietyPreference ?? null,
        favoriteFoods: preferences.favoriteFoods ?? [],
        budgetFriendly: preferences.budgetFriendly ?? null,
        weeklyBudget: preferences.weeklyBudget ?? null,
        eatingOutFrequency: preferences.eatingOutFrequency ?? null,
      }
    : {
        dietType: null,
        allergies: [],
        forbiddenFoods: [],
        mealComplexity: null,
        cookingTimeAvailable: null,
        mealsPerDay: null,
        includeSnacks: null,
        varietyPreference: null,
        favoriteFoods: [],
        budgetFriendly: null,
        weeklyBudget: null,
        eatingOutFrequency: null,
      };

  const result = await prisma.$transaction(async (tx) => {
    // Check if a draft already exists for this week
    const existing = await tx.mealPlan.findFirst({
      where: {
        userId,
        startDate,
        status: "draft",
      },
    });

    let mealPlanId: string;

    if (existing) {
      // Delete existing meals and update the plan
      await tx.meal.deleteMany({
        where: { mealPlanId: existing.id },
      });
      mealPlanId = existing.id;
      await tx.mealPlan.update({
        where: { id: existing.id },
        data: { totalCalories, aiModel: params.model, generationDurationMs, wasRegenerated: true, ...planPreferences },
      });
    } else {
      // Create new plan with preference snapshot
      const plan = await tx.mealPlan.create({
        data: {
          userId,
          startDate,
          endDate,
          status: "draft",
          totalCalories,
          aiModel: params.model,
          generationDurationMs,
          wasRegenerated: false,
          ...planPreferences,
        },
      });
      mealPlanId = plan.id;
    }

    // Create meal records
    await tx.meal.createMany({
      data: meals.map((m) => ({
        mealPlanId,
        dayOfWeek: m.dayOfWeek,
        mealType: m.mealType,
        name: m.name,
        description: m.description,
        calories: m.calories,
        protein: m.protein,
        carbs: m.carbs,
        fat: m.fat,
        ingredients: m.ingredients ?? [],
        instructions: m.instructions || null,
      })),
    });

    return { mealPlanId, mealCount: meals.length };
  });

  return result;
}

/**
 * Generate a Diet (MealPlan) from an existing NutritionPlan (Phase 2).
 *
 * This function is completely independent of generateMealPlan — it does NOT
 * recalculate macros; it uses the ones already stored in the NutritionPlan.
 *
 * @param nutritionPlanId - ID of the NutritionPlan to generate a Diet from.
 * @param model - Optional OpenAI model override.
 */
export async function generateDietFromNutritionPlan(
  nutritionPlanId: string,
  model?: OpenAIModel
): Promise<{ mealPlanId: string; mealCount: number }> {
  // 1. Load the NutritionPlan
  const plan = await prisma.nutritionPlan.findUnique({
    where: { id: nutritionPlanId },
  });

  if (!plan) {
    throw new Error(
      `No se ha encontrado el plan nutricional con id: ${nutritionPlanId}`
    );
  }

  // 2. Derive mealsPerDay from mealDistribution keys
  const mealDistribution = plan.mealDistribution as Record<string, unknown>;
  const mealsPerDay = Object.keys(mealDistribution).length;

  // 3. Call AI Phase 2 (measure duration)
  const t0 = Date.now();
  const effectiveModel = model ?? (plan.aiModel as OpenAIModel | undefined) ?? DEFAULT_MODEL;
  const meals = await generateDietFromPlanAI({
    mealDistribution,
    recommendedFoods: plan.recommendedFoods as Record<string, unknown>,
    weeklyFrequency: plan.weeklyFrequency as Record<string, unknown>,
    allergies: plan.allergies,
    forbiddenFoods: plan.forbiddenFoods,
    goal: plan.goal,
    mealsPerDay,
    model: effectiveModel,
  });
  const generationDurationMs = Date.now() - t0;

  // 4. Calculate week boundaries (same logic as generateMealPlan)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const startDate = new Date(now);
  startDate.setDate(now.getDate() + mondayOffset);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);

  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);

  // 5. Persist MealPlan + Meals in a transaction, linking to NutritionPlan
  const result = await prisma.$transaction(async (tx) => {
    // Check for existing draft for this week and user
    const existing = await tx.mealPlan.findFirst({
      where: {
        userId: plan.userId,
        startDate,
        status: "draft",
        nutritionPlanId,
      },
    });

    let mealPlanId: string;

    if (existing) {
      await tx.meal.deleteMany({ where: { mealPlanId: existing.id } });
      mealPlanId = existing.id;
      await tx.mealPlan.update({
        where: { id: existing.id },
        data: {
          totalCalories,
          aiModel: effectiveModel,
          nutritionPlanId,
        },
      });
    } else {
      const mealPlan = await tx.mealPlan.create({
        data: {
          userId: plan.userId,
          startDate,
          endDate,
          status: "draft",
          totalCalories,
          aiModel: effectiveModel,
          nutritionPlanId,
          // Snapshot preference fields from the NutritionPlan
          allergies: plan.allergies,
          forbiddenFoods: plan.forbiddenFoods,
        },
      });
      mealPlanId = mealPlan.id;
    }

    await tx.meal.createMany({
      data: meals.map((m) => ({
        mealPlanId,
        dayOfWeek: m.dayOfWeek,
        mealType: m.mealType,
        name: m.name,
        description: m.description,
        calories: m.calories,
        protein: m.protein,
        carbs: m.carbs,
        fat: m.fat,
        ingredients: m.ingredients ?? [],
        instructions: m.instructions || null,
      })),
    });

    return { mealPlanId, mealCount: meals.length };
  });

  void generationDurationMs; // available for future generationDurationMs field on MealPlan

  return result;
}

