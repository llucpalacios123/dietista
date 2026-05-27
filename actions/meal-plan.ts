"use server";

import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { renamePlanSchema } from "@/lib/schemas";
import { revalidatePath } from "next/cache";

// ─── Types ────────────────────────────────────────────────────────────────

export interface MealPlanActionResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

// ─── activatePlan ─────────────────────────────────────────────────────────

export async function activatePlan(planId: string): Promise<MealPlanActionResult> {
  try {
    const session = await auth();
    if (!session?.userId) {
      return { success: false, error: "Unauthorized" };
    }

    const plan = await prisma.mealPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || plan.userId !== session.userId) {
      return { success: false, error: "Not found" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.mealPlan.updateMany({
        where: { userId: session.userId, status: "active", id: { not: planId } },
        data: { status: "completed" },
      });
      await tx.mealPlan.update({
        where: { id: planId },
        data: { status: "active" },
      });
    });

    revalidatePath("/planes");
    revalidatePath("/diario");

    return { success: true };
  } catch (err) {
    console.error("[activatePlan]", err);
    return { success: false, error: "Unexpected error" };
  }
}

// ─── renamePlan ───────────────────────────────────────────────────────────

export async function renamePlan(planId: string, name: string): Promise<MealPlanActionResult> {
  try {
    const session = await auth();
    if (!session?.userId) {
      return { success: false, error: "Unauthorized" };
    }

    const parsed = renamePlanSchema.safeParse({ name });
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const plan = await prisma.mealPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || plan.userId !== session.userId) {
      return { success: false, error: "Not found" };
    }

    const trimmed = name.trim();
    const nameValue = trimmed === "" ? null : trimmed;

    await prisma.mealPlan.update({
      where: { id: planId },
      data: { name: nameValue },
    });

    revalidatePath("/planes");

    return { success: true };
  } catch (err) {
    console.error("[renamePlan]", err);
    return { success: false, error: "Unexpected error" };
  }
}
