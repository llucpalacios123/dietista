import React from "react";

export interface MealLogEntryProps {
  mealType: string;
  rawInput: string;
  totalCalories: number | null;
  time?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

const mealTypeLabels: Record<string, string> = {
  breakfast: "Desayuno",
  mid_morning: "Media mañana",
  lunch: "Almuerzo",
  dinner: "Cena",
  snack: "Merienda",
};

const mealTypeIcons: Record<string, string> = {
  breakfast: "🌅",
  mid_morning: "☕",
  lunch: "🍽️",
  dinner: "🌙",
  snack: "🍎",
};

export function MealLogEntry({
  mealType,
  rawInput,
  totalCalories,
  time,
  onEdit,
  onDelete,
}: MealLogEntryProps): React.ReactElement {
  return (
    <div className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)]">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="text-lg" role="img" aria-hidden="true">
            {mealTypeIcons[mealType] ?? "🍴"}
          </span>
          <div>
            <p className="text-sm font-semibold text-[var(--dietista-text)]">
              {mealTypeLabels[mealType] ?? mealType}
            </p>
            <p className="mt-0.5 text-xs text-[var(--dietista-text-2)]">
              {rawInput}
            </p>
            {time && (
              <p className="mt-1 text-[10px] text-[var(--dietista-text-3)]">
                {time}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {totalCalories && (
            <span className="text-sm font-semibold text-[var(--dietista-text)] tnum">
              {Math.round(totalCalories)} kcal
            </span>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="rounded-lg p-1 text-[var(--dietista-text-3)] transition-colors hover:bg-[var(--dietista-surface-2)] hover:text-[var(--dietista-text)]"
              aria-label="Edit meal entry"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg p-1 text-[var(--dietista-text-3)] transition-colors hover:bg-[var(--dietista-surface-2)] hover:text-[var(--dietista-danger)]"
              aria-label="Delete meal entry"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
