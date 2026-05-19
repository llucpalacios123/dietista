import { prisma } from "./prisma";
import { generateDiet, type DietGenerationParams } from "./openai";

/**
 * Build DietGenerationParams from a user's profile.
 * Exported for reuse by the chat-based generation flow.
 */
export function buildDietParamsFromProfile(profile: {
  goal: string;
  activityLevel: string;
  allergies: string[];
  forbiddenFoods: string[];
  targetCalories: number | null;
  targetProtein: number | null;
  targetCarbs: number | null;
  targetFat: number | null;
  weight: number;
  height: number;
  age: number;
  sex: string;
}): DietGenerationParams {
  const targetCalories = profile.targetCalories ?? calculateCalories(profile);
  const targetProtein =
    profile.targetProtein ?? calculateProtein(profile, targetCalories);
  const targetCarbs =
    profile.targetCarbs ?? calculateCarbs(profile, targetCalories);
  const targetFat =
    profile.targetFat ?? calculateFat(profile, targetCalories);

  return {
    targetCalories,
    targetProtein,
    targetCarbs,
    targetFat,
    goal: profile.goal,
    activityLevel: profile.activityLevel,
    allergies: profile.allergies,
    forbiddenFoods: profile.forbiddenFoods,
  };
}

/**
 * Generate a weekly meal plan for a user based on their profile.
 * Creates a MealPlan with status=draft and populates Meal records.
 */
export async function generateMealPlan(userId: string): Promise<{
  mealPlanId: string;
  mealCount: number;
}> {
  // Fetch user profile
  const profile = await prisma.profile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new Error("User has no profile. Complete profile first.");
  }

  // Calculate targets (use profile values or defaults based on goal)
  const params = buildDietParamsFromProfile(profile);

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
        data: { totalCalories },
      });
    } else {
      // Create new plan
      const plan = await tx.mealPlan.create({
        data: {
          userId,
          startDate,
          endDate,
          status: "draft",
          totalCalories,
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
