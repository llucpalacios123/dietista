import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { getWorkoutPlanById, deleteWorkoutPlan } from "@/lib/workout-plan-service";
import { apiError, apiSuccess } from "@/lib/api-error";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/workout-plans/[id]
 * Returns a single workout plan by id (ownership enforced).
 */
export async function GET(
  _req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.userId) {
    return apiError("No autenticado", 401);
  }

  const { id } = await params;
  const plan = await getWorkoutPlanById(session.userId, id);

  if (!plan) {
    return apiError("Plan de entrenamiento no encontrado", 404);
  }

  return apiSuccess(plan);
}

/**
 * DELETE /api/workout-plans/[id]
 * Deletes a workout plan (ownership enforced).
 */
export async function DELETE(
  _req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.userId) {
    return apiError("No autenticado", 401);
  }

  const { id } = await params;

  try {
    await deleteWorkoutPlan(session.userId, id);
    return apiSuccess({ deleted: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se ha podido eliminar el plan";
    return apiError(message, 404);
  }
}
