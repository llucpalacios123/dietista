"use client";

import { useTranslations } from "next-intl";
import type { WorkoutPlanContent } from "@/lib/schemas";
import { WorkoutDayView } from "./workout-day-view";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkoutPlanReviewProps {
  content: WorkoutPlanContent;
  planName: string;
  onConfirm: () => void;
  onBack?: () => void;
  isLoading?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_LABELS_ES = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

// ─── Component ────────────────────────────────────────────────────────────────

export function WorkoutPlanReview({
  content,
  planName,
  onConfirm,
  onBack,
  isLoading = false,
}: WorkoutPlanReviewProps): React.ReactElement {
  const t = useTranslations("GymPlans");

  const trainingDays = content.days.filter((d) => !d.isRestDay);
  const totalExercises = trainingDays.reduce(
    (acc, d) => acc + d.exercises.length,
    0
  );

  return (
    <div
      className="space-y-6"
      data-testid="workout-plan-review"
    >
      {/* Summary header */}
      <div className="rounded-[var(--dietista-r-lg)] border border-[var(--brand-200)] bg-[var(--brand-50)] p-4">
        <h2 className="text-base font-semibold text-[var(--dietista-text)]">
          {planName}
        </h2>
        <p className="mt-1 text-sm text-[var(--dietista-text-2)]">
          {trainingDays.length} {t("trainingDays")} ·{" "}
          {totalExercises} {t("totalExercises")}
        </p>
        {content.weeklyVolumeNotes && (
          <p className="mt-2 text-xs italic text-[var(--dietista-text-3)]">
            {content.weeklyVolumeNotes}
          </p>
        )}
      </div>

      {/* Days */}
      <div className="space-y-4">
        {content.days.map((day, idx) => (
          <WorkoutDayView
            key={idx}
            day={day}
            dayLabel={DAY_LABELS_ES[day.dayOfWeek]}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-between gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="rounded-[var(--dietista-r-md)] border border-[var(--dietista-border)] px-4 py-2 text-sm font-medium text-[var(--dietista-text)] transition-colors hover:bg-[var(--dietista-surface)] disabled:opacity-50"
          >
            {t("wizard.back")}
          </button>
        )}
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          data-testid="btn-confirm-plan"
          className="ml-auto rounded-[var(--dietista-r-md)] bg-[var(--brand-500)] px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-600)] disabled:opacity-50"
        >
          {isLoading ? t("wizard.saving") : t("wizard.confirmPlan")}
        </button>
      </div>
    </div>
  );
}
