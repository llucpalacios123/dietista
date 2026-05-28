import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { listWorkoutPlans } from "@/lib/workout-plan-service";
import { apiError, apiSuccess } from "@/lib/api-error";

/**
 * GET /api/workout-plans
 * Returns all workout plans for the authenticated user.
 */
export async function GET(_req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.userId) {
    return apiError("No autenticado", 401);
  }

  const plans = await listWorkoutPlans(session.userId);
  return apiSuccess(plans);
}
