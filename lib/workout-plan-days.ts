import type { WorkoutPlanContent, WorkoutPlanDay } from "@/lib/schemas";

/**
 * Days the user can select and log, in stable index order.
 *
 * v2 plans: all days are training days (no rest-day fillers) — return as-is.
 * v1 plans: rest days are calendar fillers — filter them out.
 *
 * The returned array index IS the canonical planDayIndex used for logging.
 * This is the single source of truth — shared by the API route (range validation),
 * the diary page (building completedDayIndexes), and the widget (badge rendering + CTA).
 */
export function getSelectableDays(content: WorkoutPlanContent): WorkoutPlanDay[] {
  if (content.version === 2) {
    return content.days;
  }
  return content.days.filter((d) => !d.isRestDay);
}
