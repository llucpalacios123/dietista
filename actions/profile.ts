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
  for (const key of ["allergies", "forbiddenFoods"]) {
    const val = processed[key];
    if (typeof val === "string") {
      try {
        processed[key] = JSON.parse(val);
      } catch {
        processed[key] = [];
      }
    }
  }

  const parsed = profileSchema.safeParse(processed);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(", "),
    };
  }

  const data = parsed.data;

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
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/profile");
  redirect("/dashboard");
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
  for (const key of ["allergies", "forbiddenFoods"]) {
    const val = processed[key];
    if (typeof val === "string") {
      try {
        processed[key] = JSON.parse(val);
      } catch {
        processed[key] = [];
      }
    }
  }

  const parsed = profileSchema.safeParse(processed);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(", "),
    };
  }

  const data = parsed.data;

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
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/profile");

  return { success: true, data: { message: "Profile updated successfully" } };
}

export async function deleteProfile(): Promise<ProfileActionResult> {
  const session = await auth();
  if (!session?.userId) {
    return { success: false, error: "You must be logged in to delete a profile" };
  }

  await prisma.profile.delete({
    where: { userId: session.userId },
  });

  revalidatePath("/dashboard");
  revalidatePath("/profile");

  return { success: true, data: { message: "Profile deleted successfully" } };
}
