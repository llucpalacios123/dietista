import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { getWorkoutPlanById, createWorkoutPlanLog } from "@/lib/workout-plan-service";
import { getSelectableDays } from "@/lib/workout-plan-days";
import { apiError, apiSuccess } from "@/lib/api-error";
import type { WorkoutPlanContent } from "@/lib/schemas";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/workout-plans/[id]/log
 * Records a workout day completion for the authenticated user.
 * Validates plan ownership and planDayIndex range against getSelectableDays.
 */
export async function POST(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await auth();
  if (!session?.userId) {
    return apiError("No autenticado", 401);
  }

  const { id } = await params;
  const plan = await getWorkoutPlanById(session.userId, id);
  if (!plan) {
    return apiError("Plan de entrenamiento no encontrado", 404);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Cuerpo inválido", 400);
  }

  const planDayIndex = (body as { planDayIndex?: unknown })?.planDayIndex;
  if (typeof planDayIndex !== "number" || !Number.isInteger(planDayIndex)) {
    return apiError("planDayIndex debe ser un entero", 400);
  }

  const selectable = getSelectableDays(plan.content as unknown as WorkoutPlanContent);
  if (planDayIndex < 0 || planDayIndex >= selectable.length) {
    return apiError("planDayIndex fuera de rango", 400);
  }

  const log = await createWorkoutPlanLog(session.userId, id, planDayIndex);
  return apiSuccess({ logged: true, id: log.id }, 201);
}
