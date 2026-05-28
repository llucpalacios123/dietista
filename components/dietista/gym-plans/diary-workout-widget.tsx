"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { WorkoutPlanContent, WorkoutPlanDay } from "@/lib/schemas";
import type { WorkoutPlanRecord } from "@/lib/workout-plan-service";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DiaryWorkoutWidgetProps {
  plan: WorkoutPlanRecord | null;
  dayOfWeek: number; // 0=Mon..6=Sun
  hasSessionToday?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayDay(content: WorkoutPlanContent, dayOfWeek: number): WorkoutPlanDay | undefined {
  return content.days.find((d) => d.dayOfWeek === dayOfWeek);
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState(): React.ReactElement {
  const t = useTranslations("GymPlans");
  return (
    <div
      data-testid="diary-workout-widget-empty"
      className="rounded-[var(--dietista-r-lg)] border border-dashed border-[var(--dietista-border)] bg-[var(--dietista-bg)] p-4"
    >
      <p className="text-sm font-medium text-[var(--dietista-text)]">
        {t("diary.noActivePlan")}
      </p>
      <Link
        href="/planes"
        className="mt-2 inline-block text-xs font-medium text-[var(--brand-500)] hover:underline"
      >
        {t("diary.goToPlans")}
      </Link>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DiaryWorkoutWidget({
  plan,
  dayOfWeek,
  hasSessionToday = false,
}: DiaryWorkoutWidgetProps): React.ReactElement {
  const t = useTranslations("GymPlans");

  if (!plan) {
    return <EmptyState />;
  }

  let content: WorkoutPlanContent | null = null;
  try {
    // content is stored as plain JSON object in Prisma, needs casting
    content = plan.content as unknown as WorkoutPlanContent;
  } catch {
    return <EmptyState />;
  }

  if (!content) return <EmptyState />;

  const todayDay = getTodayDay(content, dayOfWeek);

  const isRestDay = !todayDay || todayDay.isRestDay;

  return (
    <div
      data-testid="diary-workout-widget"
      className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--brand-700)]">
            {t("diary.sectionTitle")}
          </p>
          <p className="text-sm font-semibold text-[var(--dietista-text)]">
            {plan.name}
          </p>
        </div>
        {hasSessionToday && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            {t("diary.sessionDone")}
          </span>
        )}
      </div>

      {/* Content */}
      {isRestDay ? (
        <div>
          <p className="text-sm text-[var(--dietista-text-2)]">
            {t("diary.restDayToday")}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--brand-600)]">
            {todayDay!.title}
          </p>
          {/* Exercise count */}
          <p className="text-xs text-[var(--dietista-text-2)]">
            {todayDay!.exercises.length} {t("exercises")}
          </p>
          {/* Exercise names preview */}
          <ul className="space-y-0.5">
            {todayDay!.exercises.slice(0, 4).map((ex, i) => (
              <li key={i} className="text-xs text-[var(--dietista-text-2)]">
                · {ex.name}
              </li>
            ))}
            {todayDay!.exercises.length > 4 && (
              <li className="text-xs text-[var(--dietista-text-3)]">
                +{todayDay!.exercises.length - 4} {t("moreExercises")}
              </li>
            )}
          </ul>
        </div>
      )}

      {/* CTA */}
      <Link
        href="/gimnasio"
        className="inline-block rounded-[var(--dietista-r-md)] bg-[var(--brand-500)] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--brand-600)]"
      >
        {t("diary.logWorkout")}
      </Link>
    </div>
  );
}
