"use server";

import { auth, signOut } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────

export interface ProfileActionResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

// ─── Server Actions ───────────────────────────────────────────────────────

export async function getProfile(): Promise<{
  profile: NonNullable<Awaited<ReturnType<typeof prisma.profile.findUnique>>> | null;
}> {
  const session = await auth();
  if (!session?.userId) {
    redirect("/login");
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.userId },
  });

  return { profile };
}

export async function createProfile(
  _prevState: ProfileActionResult | null,
  formData: FormData
): Promise<ProfileActionResult> {
  const session = await auth();
  if (!session?.userId) {
    return { success: false, error: "You must be logged in to create a profile" };
  }

  // Check if profile already exists
  const existing = await prisma.profile.findUnique({
    where: { userId: session.userId },
  });
  if (existing) {
    return { success: false, error: "Profile already exists. Use update instead." };
  }

  const raw = Object.fromEntries(formData.entries());

  // Parse JSON-encoded arrays from FormData
  const processed: Record<string, unknown> = { ...raw };
  for (const key of ["allergies", "forbiddenFoods", "favoriteFoods"]) {
    const val = processed[key];
    if (typeof val === "string") {
      try {
        processed[key] = JSON.parse(val);
      } catch {
        processed[key] = [];
      }
    }
  }

  // Convert string booleans from FormData to actual booleans
  for (const key of ["includeSnacks", "budgetFriendly"]) {
    if (processed[key] === "true") {
      processed[key] = true;
    } else if (processed[key] === "false") {
      processed[key] = false;
    }
  }

  // Convert numeric strings to numbers
  for (const key of ["weight", "height", "age", "targetCalories", "targetProtein", "targetCarbs", "targetFat", "cookingTimeAvailable", "mealsPerDay", "weeklyBudget"]) {
    if (typeof processed[key] === "string" && processed[key] !== "") {
      processed[key] = Number(processed[key]);
    }
  }

  const parsed = profileSchema.safeParse(processed);

  if (!parsed.success) {
    console.error("[createProfile] Validation failed for user", session.userId, parsed.error.errors);
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(", "),
    };
  }

  const data = parsed.data;

  try {
    await prisma.profile.create({
      data: {
        userId: session.userId,
        weight: data.weight,
        height: data.height,
        age: data.age,
        sex: data.sex,
        goal: data.goal,
        activityLevel: data.activityLevel,
        targetCalories: data.targetCalories ?? null,
        targetProtein: data.targetProtein ?? null,
        targetCarbs: data.targetCarbs ?? null,
        targetFat: data.targetFat ?? null,
        allergies: data.allergies,
        forbiddenFoods: data.forbiddenFoods,
        dietType: data.dietType ?? null,
        cookingTimeAvailable: data.cookingTimeAvailable ?? null,
        eatingOutFrequency: data.eatingOutFrequency ?? null,
        includeSnacks: data.includeSnacks,
        mealComplexity: data.mealComplexity ?? null,
        mealsPerDay: data.mealsPerDay,
        varietyPreference: data.varietyPreference ?? null,
        budgetFriendly: data.budgetFriendly,
        weeklyBudget: data.weeklyBudget ?? null,
        trainingRoutine: data.trainingRoutine ?? null,
        favoriteFoods: data.favoriteFoods,
      },
    });
  } catch (error) {
    // Handle concurrent duplicate creation (unique constraint on userId)
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error: "Profile already exists. Use update instead.",
      };
    }
    console.error("[createProfile] Database error for user", session.userId, error);
    return {
      success: false,
      error: "Failed to create profile. Please try again.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/profile");

  return { success: true, data: { message: "Profile created successfully" } };
}

export async function updateProfile(
  _prevState: ProfileActionResult | null,
  formData: FormData
): Promise<ProfileActionResult> {
  const session = await auth();
  if (!session?.userId) {
    return { success: false, error: "You must be logged in to update a profile" };
  }

  const raw = Object.fromEntries(formData.entries());

  // Parse JSON-encoded arrays from FormData
  const processed: Record<string, unknown> = { ...raw };
  for (const key of ["allergies", "forbiddenFoods", "favoriteFoods"]) {
    const val = processed[key];
    if (typeof val === "string") {
      try {
        processed[key] = JSON.parse(val);
      } catch {
        processed[key] = [];
      }
    }
  }

  // Convert string booleans from FormData to actual booleans
  for (const key of ["includeSnacks", "budgetFriendly"]) {
    if (processed[key] === "true") {
      processed[key] = true;
    } else if (processed[key] === "false") {
      processed[key] = false;
    }
  }

  // Convert numeric strings to numbers
  for (const key of ["weight", "height", "age", "targetCalories", "targetProtein", "targetCarbs", "targetFat", "cookingTimeAvailable", "mealsPerDay", "weeklyBudget"]) {
    if (typeof processed[key] === "string" && processed[key] !== "") {
      processed[key] = Number(processed[key]);
    }
  }

  const parsed = profileSchema.safeParse(processed);

  if (!parsed.success) {
    console.error("[updateProfile] Validation failed for user", session.userId, parsed.error.errors);
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(", "),
    };
  }

  const data = parsed.data;

  try {
    await prisma.profile.update({
      where: { userId: session.userId },
      data: {
        weight: data.weight,
        height: data.height,
        age: data.age,
        sex: data.sex,
        goal: data.goal,
        activityLevel: data.activityLevel,
        targetCalories: data.targetCalories ?? null,
        targetProtein: data.targetProtein ?? null,
        targetCarbs: data.targetCarbs ?? null,
        targetFat: data.targetFat ?? null,
        allergies: data.allergies,
        forbiddenFoods: data.forbiddenFoods,
        dietType: data.dietType ?? null,
        cookingTimeAvailable: data.cookingTimeAvailable ?? null,
        eatingOutFrequency: data.eatingOutFrequency ?? null,
        includeSnacks: data.includeSnacks,
        mealComplexity: data.mealComplexity ?? null,
        mealsPerDay: data.mealsPerDay,
        varietyPreference: data.varietyPreference ?? null,
        budgetFriendly: data.budgetFriendly,
        weeklyBudget: data.weeklyBudget ?? null,
        trainingRoutine: data.trainingRoutine ?? null,
        favoriteFoods: data.favoriteFoods,
      },
    });
  } catch (error) {
    console.error("[updateProfile] Database error for user", session.userId, error);
    return {
      success: false,
      error: "Failed to update profile. Please try again.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/profile");

  return { success: true, data: { message: "Profile updated successfully" } };
}

export async function deleteProfile(): Promise<ProfileActionResult> {
  const session = await auth();
  if (!session?.userId) {
    return { success: false, error: "You must be logged in to delete a profile" };
  }

  try {
    await prisma.profile.delete({
      where: { userId: session.userId },
    });
  } catch (error) {
    // Handle case where profile doesn't exist (record not found)
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return {
        success: false,
        error: "No profile found to delete.",
      };
    }
    console.error("[deleteProfile] Database error for user", session.userId, error);
    return {
      success: false,
      error: "Failed to delete profile. Please try again.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/profile");

  return { success: true, data: { message: "Profile deleted successfully" } };
}
