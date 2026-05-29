"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { WorkoutPlanContent, WorkoutPlanDay } from "@/lib/schemas";
import type { WorkoutPlanRecord } from "@/lib/workout-plan-service";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DiaryWorkoutWidgetProps {
  plan: WorkoutPlanRecord | null;
  selectedDayIndex: number; // 0-based index into training days
  selectedDate?: string;    // ISO string, to preserve ?date= in card links
  hasSessionToday?: boolean;
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCardHref(index: number, selectedDate?: string): string {
  const params = new URLSearchParams();
  if (selectedDate) params.set("date", selectedDate);
  params.set("workoutDay", String(index));
  return `?${params.toString()}`;
}

function getSelectableDays(content: WorkoutPlanContent): WorkoutPlanDay[] {
  if (content.version === 2) {
    // v2: all days are training days (no rest-day fillers)
    return content.days;
  }
  // v1: filter out rest days
  return content.days.filter((d) => !d.isRestDay);
}

function getDayLabel(
  day: WorkoutPlanDay,
  index: number,
  version: 1 | 2
): string {
  if (version === 2) {
    return `Día ${index + 1}`;
  }
  return DAY_LABELS_ES[day.dayOfWeek] ?? `Día ${day.dayOfWeek + 1}`;
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

// ─── No Training Days State ───────────────────────────────────────────────────

function EmptyDaysState(): React.ReactElement {
  const t = useTranslations("GymPlans");
  return (
    <div
      data-testid="diary-workout-widget-empty-days"
      className="rounded-[var(--dietista-r-lg)] border border-dashed border-[var(--dietista-border)] bg-[var(--dietista-bg)] p-4"
    >
      <p className="text-sm text-[var(--dietista-text-2)]">
        {t("diary.restDayToday")}
      </p>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DiaryWorkoutWidget({
  plan,
  selectedDayIndex,
  selectedDate,
  hasSessionToday = false,
}: DiaryWorkoutWidgetProps): React.ReactElement {
  const t = useTranslations("GymPlans");

  if (!plan) {
    return <EmptyState />;
  }

  let content: WorkoutPlanContent | null = null;
  try {
    content = plan.content as unknown as WorkoutPlanContent;
  } catch {
    return <EmptyState />;
  }

  if (!content) return <EmptyState />;

  const selectableDays = getSelectableDays(content);

  if (selectableDays.length === 0) {
    return <EmptyDaysState />;
  }

  // Clamp index to valid range
  const safeIndex = selectedDayIndex >= 0 && selectedDayIndex < selectableDays.length
    ? selectedDayIndex
    : 0;

  const selectedDay = selectableDays[safeIndex];

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

      {/* Day Picker */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {selectableDays.map((day, idx) => {
          const isSelected = idx === safeIndex;
          const label = getDayLabel(day, idx, content!.version as 1 | 2);
          return (
            <Link
              key={idx}
              href={buildCardHref(idx, selectedDate)}
              data-testid="day-card"
              data-selected={String(isSelected)}
              className={`flex-shrink-0 rounded-[var(--dietista-r-md)] border px-3 py-1.5 text-xs font-medium transition-colors ${
                isSelected
                  ? "border-[var(--brand-500)] bg-[var(--brand-500)] text-white"
                  : "border-[var(--dietista-border)] bg-[var(--dietista-bg)] text-[var(--dietista-text-2)] hover:border-[var(--brand-300)]"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {/* Selected Day Content */}
      {selectedDay.isRestDay ? (
        <div>
          <p className="text-sm text-[var(--dietista-text-2)]">
            {t("diary.restDayToday")}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--brand-600)]">
            {selectedDay.title}
          </p>
          <p className="text-xs text-[var(--dietista-text-2)]">
            {selectedDay.exercises.length} {t("exercises")}
          </p>
          <ul className="space-y-0.5">
            {selectedDay.exercises.slice(0, 4).map((ex, i) => (
              <li key={i} className="text-xs text-[var(--dietista-text-2)]">
                · {ex.name}
              </li>
            ))}
            {selectedDay.exercises.length > 4 && (
              <li className="text-xs text-[var(--dietista-text-3)]">
                +{selectedDay.exercises.length - 4} {t("moreExercises")}
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
