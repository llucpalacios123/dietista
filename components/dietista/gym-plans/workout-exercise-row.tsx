"use client";

import { useTranslations } from "next-intl";
import type { WorkoutPlanExercise, WorkoutPlanSet } from "@/lib/schemas";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkoutExerciseRowProps {
  exercise: WorkoutPlanExercise;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSet(
  set: WorkoutPlanSet,
  index: number,
  labels: { setLabel: string; toFailure: string; repsLabel: string }
): string {
  const parts: string[] = [];

  if (set.reps !== null && set.reps !== undefined) {
    parts.push(`${set.reps} ${labels.repsLabel}`);
  } else if (set.durationSec) {
    parts.push(`${set.durationSec}s`);
  } else {
    parts.push(labels.toFailure);
  }

  if (set.weightKg !== null && set.weightKg !== undefined) {
    parts.push(`${set.weightKg} kg`);
  }

  if (set.rir !== undefined) {
    parts.push(`RIR ${set.rir}`);
  }

  return `${labels.setLabel} ${index + 1}: ${parts.join(" · ")}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WorkoutExerciseRow({
  exercise,
}: WorkoutExerciseRowProps): React.ReactElement {
  const t = useTranslations("GymPlans");

  const restLabel =
    exercise.restSec >= 60
      ? `${Math.round(exercise.restSec / 60)} min`
      : `${exercise.restSec}s`;

  return (
    <div
      data-testid="workout-exercise-row"
      className="rounded-[var(--dietista-r-md)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-3 space-y-2"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--dietista-text)] truncate">
            {exercise.name}
          </p>
          <p className="text-xs text-[var(--dietista-text-2)]">
            {t(`muscleGroups.${exercise.muscleGroup}`)} ·{" "}
            {t("rest")}: {restLabel}
          </p>
        </div>
        <span className="flex-shrink-0 rounded-full bg-[var(--brand-100)] px-2 py-0.5 text-xs font-medium text-[var(--brand-700)]">
          {exercise.sets.length} {t("sets")}
        </span>
      </div>

      {/* Sets */}
      <ul className="space-y-1">
        {exercise.sets.map((set, i) => (
          <li
            key={i}
            className="text-xs text-[var(--dietista-text-2)]"
            data-testid="exercise-set"
          >
            {formatSet(set, i, {
              setLabel: t("setLabel"),
              toFailure: t("toFailure"),
              repsLabel: t("repsLabel"),
            })}
          </li>
        ))}
      </ul>

      {/* Notes */}
      {exercise.notes && (
        <p className="text-xs italic text-[var(--dietista-text-3)]">
          {exercise.notes}
        </p>
      )}

      {/* Tempo */}
      {exercise.tempo && (
        <p className="text-xs text-[var(--dietista-text-3)]">
          {t("tempo")}: {exercise.tempo}
        </p>
      )}
    </div>
  );
}
