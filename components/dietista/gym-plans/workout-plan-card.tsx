"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { WorkoutPlanRecord } from "@/lib/workout-plan-service";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkoutPlanCardProps {
  plan: WorkoutPlanRecord;
  isActive?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "active":
      return "bg-[var(--brand-100)] text-[var(--brand-700)]";
    case "completed":
      return "bg-gray-100 text-gray-600";
    default:
      return "bg-yellow-100 text-yellow-700";
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WorkoutPlanCard({
  plan,
  isActive = false,
}: WorkoutPlanCardProps): React.ReactElement {
  const t = useTranslations("GymPlans");

  const statusLabel = t(`status.${plan.status}` as `status.${string}`);

  return (
    <div
      data-testid="workout-plan-card"
      className="flex items-center justify-between rounded-[var(--dietista-r-md)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)]"
      style={{ borderColor: isActive ? "var(--brand-300)" : undefined }}
    >
      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--dietista-text)]">
          {plan.name}
        </p>
        <p className="mt-0.5 text-xs text-[var(--dietista-text-2)]">
          {t(`goals.${plan.goal}` as `goals.${string}`)} ·{" "}
          {t(`levels.${plan.level}` as `levels.${string}`)} ·{" "}
          {plan.daysPerWeek} {t("daysPerWeek")}
        </p>
        <p className="mt-0.5 text-xs text-[var(--dietista-text-3)]">
          {formatDate(plan.startDate)}
        </p>
      </div>

      {/* Status + CTA */}
      <div className="ml-3 flex flex-shrink-0 flex-col items-end gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(plan.status)}`}
        >
          {statusLabel}
        </span>
        <Link
          href={`/gym-plans/${plan.id}`}
          className="rounded-[var(--dietista-r-sm)] bg-[var(--brand-500)] px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-[var(--brand-600)]"
        >
          {t("viewPlan")}
        </Link>
      </div>
    </div>
  );
}
