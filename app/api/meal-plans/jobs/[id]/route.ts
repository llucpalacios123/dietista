import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { apiError, apiSuccess } from "@/lib/api-error";
import { jobStore } from "@/lib/job-queue";

/**
 * GET /api/meal-plans/jobs/[id]
 * Returns the status of a meal plan generation job.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.userId) {
    return apiError("Unauthorized", 401);
  }

  const { id: jobId } = await params;
  const job = jobStore.get(jobId);

  if (!job) {
    return apiError("Job not found", 404);
  }

  if (job.userId !== session.userId) {
    return apiError("Forbidden", 403);
  }

  return apiSuccess({
    jobId: job.id,
    status: job.status,
    mealPlanId: job.mealPlanId,
    error: job.error,
  });
}
