// Pure helper — no I/O, no side effects. Testable in isolation.

export interface PlanBand {
  planId: string;
  name: string;
  startDate: string; // ISO date string "YYYY-MM-DD"
  endDate: string;   // ISO date string "YYYY-MM-DD"
  deltaKg: number | null;
}

interface WeightLogEntry {
  date: Date;
  weight: number;
}

interface MealPlanEntry {
  id: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  template?: { name: string } | null;
}

/**
 * Computes chart bands for each MealPlan, each with:
 *  - startDate / endDate as ISO date strings (YYYY-MM-DD)
 *  - deltaKg: (last weight − first weight) within [startDate, endDate], or null if < 2 logs
 *
 * Tie-break: when multiple plans overlap on the same date, the most recently created
 * plan (by createdAt) "owns" that date. Logs assigned to an earlier plan are excluded
 * from its delta computation.
 *
 * Logs are expected to be sorted ascending by date (RSC guarantees this via orderBy).
 */
export function computePlanBands(
  logs: WeightLogEntry[],
  plans: MealPlanEntry[],
): PlanBand[] {
  if (plans.length === 0) return [];

  // Sort plans descending by createdAt so the newest plan wins in tie-breaks.
  const sortedPlans = [...plans].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  // Build a map: date-string → planId of the winning plan for that date.
  // We iterate over each unique log date and assign it to the first (newest) plan
  // whose range covers it.
  const dateToPlanId = new Map<string, string>();

  for (const log of logs) {
    const dateStr = toDateStr(log.date);
    if (dateToPlanId.has(dateStr)) continue; // already assigned

    for (const plan of sortedPlans) {
      if (dateInRange(log.date, plan.startDate, plan.endDate)) {
        dateToPlanId.set(dateStr, plan.id);
        break; // first match = newest plan wins
      }
    }
  }

  // For each plan, collect its assigned logs and compute delta.
  return plans.map((plan) => {
    const assignedLogs = logs.filter((log) => {
      const dateStr = toDateStr(log.date);
      return dateToPlanId.get(dateStr) === plan.id;
    });

    // Sort ascending to ensure first/last are correct
    const sorted = [...assignedLogs].sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );

    const deltaKg =
      sorted.length >= 2
        ? sorted[sorted.length - 1].weight - sorted[0].weight
        : null;

    return {
      planId: plan.id,
      name: plan.template?.name ?? plan.id,
      startDate: toDateStr(plan.startDate),
      endDate: toDateStr(plan.endDate),
      deltaKg,
    };
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Converts a Date to a "YYYY-MM-DD" string using UTC components. */
function toDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

/** Returns true if `date` falls within [start, end] (inclusive) at day granularity. */
function dateInRange(date: Date, start: Date, end: Date): boolean {
  const d = date.getTime();
  return d >= start.getTime() && d <= end.getTime();
}
