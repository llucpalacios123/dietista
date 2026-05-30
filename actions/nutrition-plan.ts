"use server";

import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { generateNutritionPlanForUser } from "@/lib/nutrition-plan-service";
import { generateDietFromNutritionPlan } from "@/lib/diet-service";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { NutritionistPreferencesSchema } from "@/lib/schemas";
import type { NutritionPlan } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────

export interface NutritionPlanActionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

export type NutritionPlanWithDietCount = NutritionPlan & {
  _count: { diets: number };
};

export type NutritionPlanWithDiets = NutritionPlan & {
  diets: Array<{
    id: string;
    createdAt: Date;
    status: string;
    totalCalories: number | null;
    aiModel: string | null;
  }>;
};

// ─── generateNutritionPlanAction ─────────────────────────────────────────

/**
 * Generate a new NutritionPlan (Phase 1) for the authenticated user.
 * Returns { id } of the created plan on success.
 */
export async function generateNutritionPlanAction(
  preferences?: Partial<NutritionistPreferencesSchema>
): Promise<NutritionPlanActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.userId) {
    redirect("/login");
  }

  try {
    const plan = await generateNutritionPlanForUser(session.userId, preferences);

    revalidatePath("/nutrition-plans");

    return { success: true, data: { id: plan.id } };
  } catch (error) {
    console.error("[generateNutritionPlanAction]", error);
    return {
      success: false,
      error: error instanceof Error
        ? error.message
        : "No se ha podido generar el plan nutricional",
    };
  }
}

// ─── getNutritionPlansAction ──────────────────────────────────────────────

/**
 * Fetch all NutritionPlans for the authenticated user,
 * ordered by creation date (newest first), with a count of generated diets.
 */
export async function getNutritionPlansAction(): Promise<
  NutritionPlanActionResult<NutritionPlanWithDietCount[]>
> {
  const session = await auth();
  if (!session?.userId) {
    redirect("/login");
  }

  try {
    const plans = await prisma.nutritionPlan.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { diets: true },
        },
      },
    });

    return { success: true, data: plans };
  } catch (error) {
    console.error("[getNutritionPlansAction]", error);
    return {
      success: false,
      error: error instanceof Error
        ? error.message
        : "No se han podido obtener los planes nutricionales",
    };
  }
}

// ─── getNutritionPlanByIdAction ───────────────────────────────────────────

/**
 * Fetch a single NutritionPlan by ID for the authenticated user.
 * Includes ownership check — returns error if plan belongs to another user.
 */
export async function getNutritionPlanByIdAction(
  id: string
): Promise<NutritionPlanActionResult<NutritionPlanWithDiets>> {
  const session = await auth();
  if (!session?.userId) {
    redirect("/login");
  }

  try {
    const plan = await prisma.nutritionPlan.findUnique({
      where: { id },
      include: {
        diets: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            createdAt: true,
            status: true,
            totalCalories: true,
            aiModel: true,
          },
        },
      },
    });

    if (!plan) {
      return { success: false, error: "Plan nutricional no encontrado" };
    }

    if (plan.userId !== session.userId) {
      return {
        success: false,
        error: "No tienes permiso para ver este plan nutricional",
      };
    }

    return { success: true, data: plan };
  } catch (error) {
    console.error("[getNutritionPlanByIdAction]", error);
    return {
      success: false,
      error: error instanceof Error
        ? error.message
        : "No se ha podido obtener el plan nutricional",
    };
  }
}

// ─── generateDietFromPlanAction ───────────────────────────────────────────

/**
 * Generate a Diet (MealPlan) from an existing NutritionPlan (Phase 2).
 * Includes ownership check. Returns { mealPlanId } on success.
 */
export async function generateDietFromPlanAction(
  nutritionPlanId: string
): Promise<NutritionPlanActionResult<{ mealPlanId: string }>> {
  const session = await auth();
  if (!session?.userId) {
    redirect("/login");
  }

  try {
    // Ownership check
    const plan = await prisma.nutritionPlan.findUnique({
      where: { id: nutritionPlanId },
      select: { userId: true },
    });

    if (!plan) {
      return { success: false, error: "Plan nutricional no encontrado" };
    }

    if (plan.userId !== session.userId) {
      return {
        success: false,
        error: "No tienes permiso para generar una dieta desde este plan",
      };
    }

    const result = await generateDietFromNutritionPlan(nutritionPlanId);

    revalidatePath(`/nutrition-plans/${nutritionPlanId}`);
    revalidatePath("/planes");

    return { success: true, data: { mealPlanId: result.mealPlanId } };
  } catch (error) {
    console.error("[generateDietFromPlanAction]", error);
    return {
      success: false,
      error: error instanceof Error
        ? error.message
        : "No se ha podido generar la dieta desde el plan nutricional",
    };
  }
}
