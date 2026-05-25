import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-error";

/**
 * GET /api/meal-plans
 * Returns the user's current active meal plan, or the most recent draft.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.userId) {
    return apiError("No autenticado", 401);
  }

  const userId = session.userId;

  // Try to find active plan first
  let plan = await prisma.mealPlan.findFirst({
    where: {
      userId,
      status: "active",
    },
    include: { meals: { orderBy: [{ dayOfWeek: "asc" }, { mealType: "asc" }] } },
    orderBy: { startDate: "desc" },
  });

  // Fall back to most recent draft
  if (!plan) {
    plan = await prisma.mealPlan.findFirst({
      where: {
        userId,
        status: "draft",
      },
      include: { meals: { orderBy: [{ dayOfWeek: "asc" }, { mealType: "asc" }] } },
      orderBy: { createdAt: "desc" },
    });
  }

  if (!plan) {
    return apiError("No se han encontrado planes de comidas", 404);
  }

  return apiSuccess(plan);
}
