"use client";

import { useTranslations } from "next-intl";
import type { WorkoutPlanDay } from "@/lib/schemas";
import { WorkoutExerciseRow } from "./workout-exercise-row";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkoutDayViewProps {
  day: WorkoutPlanDay;
  dayLabel?: string; // e.g. "Lunes", "Martes"
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

export function WorkoutDayView({
  day,
  dayLabel,
}: WorkoutDayViewProps): React.ReactElement {
  const t = useTranslations("GymPlans");

  const label = dayLabel ?? DAY_LABELS_ES[day.dayOfWeek] ?? `Día ${day.dayOfWeek + 1}`;

  if (day.isRestDay) {
    return (
      <div
        data-testid="workout-day-view"
        data-rest-day="true"
        className="rounded-[var(--dietista-r-lg)] border border-dashed border-[var(--dietista-border)] bg-[var(--dietista-bg)] p-4"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[var(--dietista-text)]">{label}</p>
          <span className="rounded-full bg-[var(--dietista-border)] px-2 py-0.5 text-xs text-[var(--dietista-text-3)]">
            {t("restDay")}
          </span>
        </div>
        <p className="mt-1 text-xs text-[var(--dietista-text-3)]">
          {t("restDayDescription")}
        </p>
      </div>
    );
  }

  return (
    <div
      data-testid="workout-day-view"
      data-rest-day="false"
      className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-4 space-y-3"
    >
      {/* Day header */}
      <div>
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-[var(--dietista-text)]">
            {label}
          </p>
          <span className="text-xs text-[var(--dietista-text-2)]">
            {day.exercises.length} {t("exercises")}
          </span>
        </div>
        <p className="mt-0.5 text-sm font-medium text-[var(--brand-600)]">
          {day.title}
        </p>

        {/* Focus groups */}
        <div className="mt-1 flex flex-wrap gap-1">
          {day.focus.map((group) => (
            <span
              key={group}
              className="rounded-full bg-[var(--brand-50)] px-2 py-0.5 text-xs font-medium text-[var(--brand-700)]"
            >
              {t(`muscleGroups.${group}`)}
            </span>
          ))}
        </div>
      </div>

      {/* Warmup / cooldown */}
      {(day.warmupMin > 0 || day.cooldownMin > 0) && (
        <div className="flex gap-4 text-xs text-[var(--dietista-text-2)]">
          {day.warmupMin > 0 && (
            <span>
              {t("warmup")}: {day.warmupMin} min
            </span>
          )}
          {day.cooldownMin > 0 && (
            <span>
              {t("cooldown")}: {day.cooldownMin} min
            </span>
          )}
        </div>
      )}

      {/* Exercises */}
      <div className="space-y-2">
        {day.exercises.map((exercise, idx) => (
          <WorkoutExerciseRow key={idx} exercise={exercise} />
        ))}
      </div>
    </div>
  );
}
