import { prisma } from "./prisma";
import { generateNutritionPlanAI } from "./openai";
import { calculateTargets, coalescePreferences } from "./nutrition-targets";
import { DEFAULT_MODEL, type NutritionistPreferencesSchema } from "./schemas";
import type { NutritionPlan } from "@prisma/client";

/**
 * Generate a NutritionPlan (Phase 1) for a user.
 *
 * 1. Load user profile (throws if missing).
 * 2. Coalesce preferences with profile defaults.
 * 3. Calculate macro targets via Mifflin-St Jeor.
 * 4. Call the AI to generate the nutritional structure.
 * 5. Persist the NutritionPlan and return it.
 */
export async function generateNutritionPlanForUser(
  userId: string,
  preferences?: Partial<NutritionistPreferencesSchema>
): Promise<NutritionPlan> {
  // 1. Load profile
  const profile = await prisma.profile.findUnique({ where: { userId } });

  if (!profile) {
    throw new Error("No tienes perfil. Completa tu perfil primero.");
  }

  // 2. Coalesce preferences
  const eff = coalescePreferences(profile, preferences);

  // 3. Calculate macro targets
  const targets = calculateTargets(profile);

  // 4. Choose model
  const model = preferences?.model ?? DEFAULT_MODEL;

  // 5. Call AI (measure duration)
  const t0 = Date.now();
  const structure = await generateNutritionPlanAI({
    targetCalories: targets.calories,
    targetProtein: targets.protein,
    targetCarbs: targets.carbs,
    targetFat: targets.fat,
    goal: profile.goal,
    activityLevel: profile.activityLevel,
    allergies: eff.allergies,
    forbiddenFoods: eff.forbiddenFoods,
    mealsPerDay: eff.mealsPerDay,
    model,
  });
  const generationDurationMs = Date.now() - t0;

  // 6. Persist
  const plan = await prisma.nutritionPlan.create({
    data: {
      userId,
      dailyTargets: structure.dailyTargets,
      mealDistribution: structure.mealDistribution,
      recommendedFoods: structure.recommendedFoods,
      weeklyFrequency: structure.weeklyFrequency,
      goal: profile.goal,
      activityLevel: profile.activityLevel,
      allergies: eff.allergies,
      forbiddenFoods: eff.forbiddenFoods,
      aiModel: model,
      generationDurationMs,
    },
  });

  return plan;
}
