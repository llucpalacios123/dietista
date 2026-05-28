"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { WorkoutPlanRecord } from "@/lib/workout-plan-service";
import { WorkoutPlanCard } from "./workout-plan-card";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkoutPlanListProps {
  plans: WorkoutPlanRecord[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WorkoutPlanList({
  plans,
}: WorkoutPlanListProps): React.ReactElement {
  const t = useTranslations("GymPlans");

  if (plans.length === 0) {
    return (
      <div
        data-testid="workout-plan-list-empty"
        className="rounded-[var(--dietista-r-lg)] border border-dashed border-[var(--dietista-border)] bg-[var(--dietista-bg)] p-8 text-center"
      >
        <p className="text-sm font-medium text-[var(--dietista-text)]">
          {t("noPlan")}
        </p>
        <p className="mt-1 text-xs text-[var(--dietista-text-3)]">
          {t("noPlanHint")}
        </p>
        <Link
          href="/gym-plans/new"
          className="mt-4 inline-block rounded-[var(--dietista-r-md)] bg-[var(--brand-500)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-600)]"
        >
          {t("newPlan")}
        </Link>
      </div>
    );
  }

  const activePlan = plans.find((p) => p.status === "active");
  const otherPlans = plans.filter((p) => p.status !== "active");

  return (
    <div
      data-testid="workout-plan-list"
      className="space-y-4"
    >
      {/* Active plan hero */}
      {activePlan && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--brand-700)]">
            {t("activePlan")}
          </p>
          <WorkoutPlanCard plan={activePlan} isActive />
        </div>
      )}

      {/* Past plans */}
      {otherPlans.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-[var(--dietista-text)]">
            {t("pastPlans")}
          </p>
          <div className="space-y-2">
            {otherPlans.map((plan) => (
              <WorkoutPlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        </div>
      )}

      {/* Create new */}
      <Link
        href="/gym-plans/new"
        className="flex items-center justify-center rounded-[var(--dietista-r-lg)] border-2 border-dashed border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-4 transition-colors hover:border-[var(--brand-300)]"
      >
        <span className="text-sm font-medium text-[var(--dietista-text-2)]">
          + {t("newPlan")}
        </span>
      </Link>
    </div>
  );
}
