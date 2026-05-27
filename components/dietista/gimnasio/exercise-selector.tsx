"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { GYM_EXERCISES, MuscleGroupLabels, type MuscleGroup } from "@/lib/gym-exercises";

export interface ExerciseSelectorProps {
  onSelect: (exerciseName: string, muscleGroup: string) => void;
  onCancel: () => void;
}

export function ExerciseSelector({
  onSelect,
  onCancel,
}: ExerciseSelectorProps): React.ReactElement {
  const t = useTranslations("Gym");
  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup | null>(null);

  const muscleGroups = Object.keys(MuscleGroupLabels) as MuscleGroup[];

  if (selectedGroup === null) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--dietista-text)]">
            {t("selectMuscleGroup")}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-[var(--dietista-text-3)] hover:text-[var(--dietista-text-2)]"
          >
            {t("cancel")}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {muscleGroups.map((group) => (
            <button
              key={group}
              type="button"
              onClick={() => setSelectedGroup(group)}
              className="rounded-[var(--dietista-r-md)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] px-3 py-3 text-left text-sm font-medium text-[var(--dietista-text)] transition-colors hover:border-[var(--brand-600)] hover:bg-[var(--brand-50)] active:scale-[0.98]"
            >
              {MuscleGroupLabels[group]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const exercises = GYM_EXERCISES[selectedGroup];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setSelectedGroup(null)}
          className="flex items-center gap-1 text-xs text-[var(--dietista-text-3)] hover:text-[var(--dietista-text-2)]"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {t("back")}
        </button>
        <h3 className="text-sm font-semibold text-[var(--dietista-text)]">
          {MuscleGroupLabels[selectedGroup]}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-[var(--dietista-text-3)] hover:text-[var(--dietista-text-2)]"
        >
          {t("cancel")}
        </button>
      </div>

      <ul className="space-y-1.5">
        {exercises.map((exercise) => (
          <li key={exercise}>
            <button
              type="button"
              onClick={() => onSelect(exercise, selectedGroup)}
              className="w-full rounded-[var(--dietista-r-md)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] px-3 py-2.5 text-left text-sm text-[var(--dietista-text)] transition-colors hover:border-[var(--brand-600)] hover:bg-[var(--brand-50)] active:scale-[0.98]"
            >
              {exercise}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
