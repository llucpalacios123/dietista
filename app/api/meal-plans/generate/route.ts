import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { apiError, apiSuccess } from "@/lib/api-error";
import { generateMealPlan } from "@/lib/diet-service";
import { jobStore, type GenerationJob } from "@/lib/job-queue";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 5;

/**
 * POST /api/meal-plans/generate
 * Enqueues a meal plan generation job and returns a job ID.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.userId) {
    return apiError("Unauthorized", 401);
  }

  const userId = session.userId;

  // Check profile exists
  const profile = await prisma.profile.findUnique({
    where: { userId },
  });
  if (!profile) {
    return apiError(
      "Complete your profile before generating a meal plan",
      400
    );
  }

  // Rate limit check
  const rateLimit = checkRateLimit(
    `meal-plan-gen:${userId}`,
    RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW_MS
  );
  if (!rateLimit.allowed) {
    const waitMinutes = Math.ceil(
      (rateLimit.resetAt - Date.now()) / 60000
    );
    return apiError(
      `Please wait ${waitMinutes} minutes before generating another plan`,
      429
    );
  }

  // Check for existing active plan this week
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  const existingActive = await prisma.mealPlan.findFirst({
    where: {
      userId,
      startDate: weekStart,
      status: "active",
    },
  });
  if (existingActive) {
    return apiError(
      "You already have an active meal plan for this week",
      409
    );
  }

  // Create job
  const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const job: GenerationJob = {
    id: jobId,
    userId,
    status: "pending",
    createdAt: Date.now(),
  };
  jobStore.set(jobId, job);

  // Enqueue for async processing
  setImmediate(async () => {
    job.status = "processing";
    try {
      const result = await generateMealPlan(userId);
      job.status = "completed";
      job.mealPlanId = result.mealPlanId;
    } catch (error) {
      job.status = "failed";
      job.error =
        error instanceof Error ? error.message : "Unknown error";
    }
  });

  return apiSuccess({ jobId, status: "pending" }, 202);
}
