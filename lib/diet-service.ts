import { prisma } from "./prisma";
import { generateDiet, type DietGenerationParams } from "./openai";
import type { NutritionistPreferencesSchema } from "./schemas";

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

  // ── Preference coalescence: plan value wins when non-null/non-empty ──────
  // Arrays: non-empty plan array overrides profile (empty = "no override")
  // Scalars: non-null plan value overrides profile
  const effectiveAllergies =
    preferences?.allergies?.length ? preferences.allergies : profile.allergies;

  const effectiveForbiddenFoods =
    preferences?.dislikedFoods?.length
      ? preferences.dislikedFoods // wizard field → MealPlan.forbiddenFoods
      : profile.forbiddenFoods;

  const effectiveFavoriteFoods =
    preferences?.favoriteFoods?.length
      ? preferences.favoriteFoods
      : profile.favoriteFoods;

  const effectiveDietType = preferences?.dietType ?? profile.dietType;
  const effectiveMealComplexity = preferences?.mealComplexity ?? profile.mealComplexity;
  const effectiveMealsPerDay = preferences?.mealsPerDay ?? profile.mealsPerDay;
  const effectiveIncludeSnacks = preferences?.includeSnacks ?? profile.includeSnacks;
  const effectiveVarietyPreference =
    preferences?.varietyPreference ?? profile.varietyPreference;
  const effectiveBudgetFriendly = preferences?.budgetFriendly ?? profile.budgetFriendly;
  const effectiveWeeklyBudget = preferences?.weeklyBudget ?? profile.weeklyBudget;
  const effectiveEatingOutFrequency =
    preferences?.eatingOutFrequency ?? profile.eatingOutFrequency;
  const effectiveCookingTime =
    preferences?.cookingTimeAvailable ?? profile.cookingTimeAvailable;

  // Calculate targets (use profile values or defaults based on goal)
  const targetCalories = profile.targetCalories ?? calculateCalories(profile);
  const targetProtein = profile.targetProtein ?? calculateProtein(profile, targetCalories);
  const targetCarbs = profile.targetCarbs ?? calculateCarbs(profile, targetCalories);
  const targetFat = profile.targetFat ?? calculateFat(profile, targetCalories);

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
  };

  // Call OpenAI
  const meals = await generateDiet(params);

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
        data: { totalCalories, ...planPreferences },
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

// ─── Calorie/Macro Calculations (fallback when not set explicitly) ────────

function calculateCalories(profile: {
  weight: number;
  height: number;
  age: number;
  sex: string;
  goal: string;
  activityLevel: string;
}): number {
  // Mifflin-St Jeor BMR
  let bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age;
  bmr += profile.sex === "male" ? 5 : -161;

  // Activity multiplier
  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryActive: 1.9,
  };
  const tdee = bmr * (multipliers[profile.activityLevel] ?? 1.55);

  // Goal adjustment
  switch (profile.goal) {
    case "lose":
      return Math.round(tdee - 500);
    case "gain":
      return Math.round(tdee + 300);
    default:
      return Math.round(tdee);
  }
}

function calculateProtein(
  profile: { weight: number; goal: string },
  calories: number
): number {
  // 1.6-2.2g per kg for active individuals, higher for cutting
  const multiplier = profile.goal === "lose" ? 2.2 : profile.goal === "gain" ? 1.8 : 1.6;
  return Math.round(profile.weight * multiplier);
}

function calculateCarbs(profile: { goal: string }, calories: number): number {
  // Carbs as percentage of calories: 40-50%
  const pct = profile.goal === "lose" ? 0.35 : 0.45;
  return Math.round((calories * pct) / 4); // 4 cal per gram
}

function calculateFat(profile: { goal: string }, calories: number): number {
  // Fat as percentage of calories: 25-30%
  const pct = profile.goal === "lose" ? 0.35 : 0.25;
  return Math.round((calories * pct) / 9); // 9 cal per gram
}
