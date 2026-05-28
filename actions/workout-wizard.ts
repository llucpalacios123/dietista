"use server";

import { auth } from "@/lib/auth-config";
import { generateWorkoutPlan } from "@/lib/workout-plan-service";
import type { WorkoutPreferences } from "@/lib/schemas";

// ─── Result Types ─────────────────────────────────────────────────────────────

export type GenerateWorkoutPlanResult =
  | { success: true; planId: string }
  | { success: false; error: string };

// ─── Server Actions ───────────────────────────────────────────────────────────

/**
 * Server action to generate a workout plan based on wizard preferences.
 * Authenticates the session, delegates to the service layer, and returns
 * the new plan id or a user-friendly error.
 */
export async function generateWorkoutPlanAction(
  preferences: WorkoutPreferences
): Promise<GenerateWorkoutPlanResult> {
  const session = await auth();
  if (!session?.userId) {
    return { success: false, error: "No autenticado. Por favor, inicia sesión." };
  }

  try {
    const { workoutPlanId } = await generateWorkoutPlan(session.userId, preferences);
    return { success: true, planId: workoutPlanId };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se ha podido generar el plan de entrenamiento. Inténtalo de nuevo.";
    return { success: false, error: message };
  }
}
