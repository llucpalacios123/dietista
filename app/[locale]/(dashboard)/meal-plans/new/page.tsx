import { getProfile } from "@/actions/profile";
import { redirect } from "next/navigation";
import { WizardClient } from "./wizard-client";
import type { UserProfileSchema } from "@/lib/schemas";
import type { Profile } from "@prisma/client";

// ─── Helpers ──────────────────────────────────────────────────────────────

function profileToUserProfileSchema(profile: Profile): UserProfileSchema {
  return {
    weight: profile.weight,
    height: profile.height,
    age: profile.age,
    sex: profile.sex as UserProfileSchema["sex"],
    goal: profile.goal as UserProfileSchema["goal"],
    activityLevel: profile.activityLevel as UserProfileSchema["activityLevel"],
    targetCalories: profile.targetCalories ?? undefined,
    targetProtein: profile.targetProtein ?? undefined,
    targetCarbs: profile.targetCarbs ?? undefined,
    targetFat: profile.targetFat ?? undefined,
    allergies: profile.allergies,
    forbiddenFoods: profile.forbiddenFoods,
    dietType: (profile.dietType as UserProfileSchema["dietType"]) ?? undefined,
    cookingTimeAvailable: profile.cookingTimeAvailable ?? undefined,
    eatingOutFrequency:
      (profile.eatingOutFrequency as UserProfileSchema["eatingOutFrequency"]) ??
      undefined,
    includeSnacks: profile.includeSnacks,
    mealComplexity:
      (profile.mealComplexity as UserProfileSchema["mealComplexity"]) ??
      undefined,
    mealsPerDay: profile.mealsPerDay,
    varietyPreference:
      (profile.varietyPreference as UserProfileSchema["varietyPreference"]) ??
      undefined,
    budgetFriendly: profile.budgetFriendly,
    weeklyBudget: profile.weeklyBudget ?? undefined,
    trainingRoutine: profile.trainingRoutine ?? undefined,
    favoriteFoods: profile.favoriteFoods,
  };
}

// ─── Page Component ───────────────────────────────────────────────────────

/**
 * Meal Plans New Page — Nutritionist Wizard entry point.
 *
 * Server component that fetches the user's profile.
 * Redirects to /profile if no profile exists (prerequisite for wizard).
 * Passes profile data to the client-side WizardClient state machine.
 */
export default async function MealPlansNewPage() {
  const { profile } = await getProfile();

  if (!profile) {
    redirect("/profile");
  }

  const userProfile = profileToUserProfileSchema(profile);

  return <WizardClient profile={userProfile} />;
}
