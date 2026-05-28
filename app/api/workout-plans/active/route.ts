import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { getActiveWorkoutPlan } from "@/lib/workout-plan-service";
import { apiError, apiSuccess } from "@/lib/api-error";

/**
 * GET /api/workout-plans/active
 * Returns the currently active workout plan for the authenticated user, or 404.
 */
export async function GET(_req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.userId) {
    return apiError("No autenticado", 401);
  }

  const plan = await getActiveWorkoutPlan(session.userId);

  if (!plan) {
    return apiError("No hay ningún plan de entrenamiento activo", 404);
  }

  return apiSuccess(plan);
}
