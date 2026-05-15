import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-error";

/**
 * POST /api/meal-plans/[id]/confirm
 * Changes a draft meal plan to active. Enforces one active plan per week.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.userId) {
    return apiError("Unauthorized", 401);
  }

  const userId = session.userId;
  const { id: mealPlanId } = await params;

  // Fetch the meal plan
  const mealPlan = await prisma.mealPlan.findUnique({
    where: { id: mealPlanId },
    include: { meals: true },
  });

  if (!mealPlan) {
    return apiError("Meal plan not found", 404);
  }

  if (mealPlan.userId !== userId) {
    return apiError("Forbidden", 403);
  }

  if (mealPlan.status !== "draft") {
    return apiError(
      `Cannot confirm a plan with status "${mealPlan.status}". Only draft plans can be confirmed.`,
      400
    );
  }

  if (mealPlan.meals.length === 0) {
    return apiError(
      "Meal plan has no meals. Generation may still be in progress.",
      400
    );
  }

  // Deactivate any other draft plans for this week, then activate this one
  // The active-plan check runs inside the transaction to prevent race conditions
  try {
    await prisma.$transaction(async (tx) => {
      // Check no other active plan exists for the same week (inside transaction)
      const existingActive = await tx.mealPlan.findFirst({
        where: {
          userId,
          startDate: mealPlan.startDate,
          status: "active",
          id: { not: mealPlanId },
        },
      });

      if (existingActive) {
        throw new Error("CONFLICT:Another active plan already exists for this week");
      }

      await tx.mealPlan.updateMany({
        where: {
          userId,
          startDate: mealPlan.startDate,
          status: "draft",
          id: { not: mealPlanId },
        },
        data: { status: "completed" },
      });

      await tx.mealPlan.update({
        where: { id: mealPlanId },
        data: { status: "active" },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("CONFLICT:")) {
      return apiError(error.message.replace("CONFLICT:", ""), 409);
    }
    throw error;
  }

  return apiSuccess({
    id: mealPlanId,
    status: "active",
    message: "Meal plan confirmed and activated",
  });
}
