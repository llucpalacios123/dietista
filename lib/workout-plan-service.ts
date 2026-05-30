import { prisma } from "./prisma";
import { generateWorkoutContent, type WorkoutGenerationParams } from "./openai";
import { DEFAULT_MODEL } from "./schemas";
import type { WorkoutPlanContent, WorkoutPreferences, OpenAIModel } from "./schemas";
import { selectModel } from "./llm-router";

// ─── Types ────────────────────────────────────────────────────────────────────

export type WorkoutPlanRecord = {
  id: string;
  userId: string;
  name: string;
  goal: string;
  level: string;
  daysPerWeek: number;
  status: string;
  content: unknown;
  aiModel: string | null;
  startDate: Date;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Generate a workout plan for a user based on their profile and preferences.
 * Fetches the user profile, calls OpenAI, and persists the plan.
 * Enforces the single-active invariant: previous active plans are completed.
 */
export async function generateWorkoutPlan(
  userId: string,
  preferences: WorkoutPreferences
): Promise<{ workoutPlanId: string; dayCount: number }> {
  const profile = await prisma.profile.findUnique({ where: { userId } });

  if (!profile) {
    throw new Error("No tienes perfil. Completa tu perfil primero.");
  }

  // Resolve model: if user chose something other than DEFAULT_MODEL, treat as override.
  // Otherwise call the router (ADR-5: compare against DEFAULT_MODEL).
  const resolvedModel: OpenAIModel =
    preferences.model !== DEFAULT_MODEL
      ? preferences.model
      : selectModel({
          feature: "workout",
          profile: { goal: preferences.goal, level: preferences.level },
        });

  const generationParams: WorkoutGenerationParams = {
    profile: {
      sex: profile.sex,
      age: profile.age,
      goal: profile.goal,
      activityLevel: profile.activityLevel,
      trainingRoutine: profile.trainingRoutine,
      notes: null,
    },
    preferences,
  };

  const t0 = Date.now();
  const content = await generateWorkoutContent(generationParams);
  const generationDurationMs = Date.now() - t0;

  const plan = await createWorkoutPlan(userId, preferences, content, resolvedModel, generationDurationMs);

  const dayCount = content.days.filter((d) => !d.isRestDay).length;

  return { workoutPlanId: plan.id, dayCount };
}

/**
 * Persist a workout plan with status=active.
 * Deactivates all previous active plans for the user atomically (single-active invariant).
 */
export async function createWorkoutPlan(
  userId: string,
  preferences: WorkoutPreferences,
  content: WorkoutPlanContent,
  resolvedModel?: OpenAIModel,
  generationDurationMs?: number
): Promise<WorkoutPlanRecord> {
  const aiModel = resolvedModel ?? preferences.model ?? DEFAULT_MODEL;

  return prisma.$transaction(async (tx) => {
    // Count active plans BEFORE completing them (for wasRegenerated tracking)
    const hadActive = await tx.workoutPlan.count({
      where: { userId, status: "active" },
    });

    // Enforce single-active invariant: complete all currently active plans
    await tx.workoutPlan.updateMany({
      where: { userId, status: "active" },
      data: { status: "completed" },
    });

    const plan = await tx.workoutPlan.create({
      data: {
        userId,
        name: preferences.name,
        goal: preferences.goal,
        level: preferences.level,
        daysPerWeek: preferences.daysPerWeek,
        status: "active",
        content: content as object,
        aiModel,
        wasRegenerated: hadActive > 0,
        generationDurationMs,
        startDate: new Date(),
      },
    });

    return plan as WorkoutPlanRecord;
  });
}

/**
 * Returns the most recent active workout plan for a user, or null if none.
 */
export async function getActiveWorkoutPlan(
  userId: string
): Promise<WorkoutPlanRecord | null> {
  const plan = await prisma.workoutPlan.findFirst({
    where: { userId, status: "active" },
    orderBy: { startDate: "desc" },
  });
  return plan as WorkoutPlanRecord | null;
}

/**
 * Returns a workout plan by id and userId.
 * Returns null if not found or if the plan belongs to a different user (IDOR protection).
 */
export async function getWorkoutPlanById(
  userId: string,
  planId: string
): Promise<WorkoutPlanRecord | null> {
  const plan = await prisma.workoutPlan.findFirst({
    where: { id: planId, userId },
  });
  return plan as WorkoutPlanRecord | null;
}

/**
 * Returns all workout plans for a user, ordered by creation date descending.
 */
export async function listWorkoutPlans(
  userId: string
): Promise<WorkoutPlanRecord[]> {
  const plans = await prisma.workoutPlan.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return plans as WorkoutPlanRecord[];
}

// ─── Workout Plan Log Types ───────────────────────────────────────────────────

export type WorkoutPlanLogRecord = {
  id: string;
  userId: string;
  planId: string;
  planDayIndex: number;
  completedAt: Date;
};

// ─── Workout Plan Log Functions ───────────────────────────────────────────────

/**
 * Create one completion log row.
 * Caller MUST have validated ownership and index range before calling.
 */
export async function createWorkoutPlanLog(
  userId: string,
  planId: string,
  planDayIndex: number
): Promise<WorkoutPlanLogRecord> {
  const log = await prisma.workoutPlanLog.create({
    data: { userId, planId, planDayIndex },
  });
  return log as WorkoutPlanLogRecord;
}

/**
 * Returns all completion logs for a user+plan within [weekStart, weekEnd).
 * Half-open interval: gte weekStart, lt weekEnd — consistent with getWeekBounds().
 */
export async function getWeekWorkoutLogs(
  userId: string,
  planId: string,
  weekStart: Date,
  weekEnd: Date
): Promise<WorkoutPlanLogRecord[]> {
  const logs = await prisma.workoutPlanLog.findMany({
    where: {
      userId,
      planId,
      completedAt: { gte: weekStart, lt: weekEnd },
    },
    orderBy: { completedAt: "asc" },
  });
  return logs as WorkoutPlanLogRecord[];
}

/**
 * Soft-deletes (hard-delete) a workout plan, enforcing ownership.
 * Throws if the plan does not exist or belongs to a different user.
 */
export async function deleteWorkoutPlan(
  userId: string,
  planId: string
): Promise<void> {
  const plan = await prisma.workoutPlan.findFirst({
    where: { id: planId, userId },
  });

  if (!plan) {
    throw new Error("Plan de entrenamiento no encontrado o no tienes permisos para eliminarlo");
  }

  await prisma.workoutPlan.delete({ where: { id: planId } });
}
