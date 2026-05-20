"use client";

import React from "react";

export interface StreakWeekProps {
  /** Array of 7 booleans representing each day of the week */
  days: boolean[];
  /** Current day index (0-6) */
  currentDay?: number;
  /** Label above the streak */
  label?: string;
}

const DAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"] as const;

export function StreakWeek({
  days,
  currentDay,
  label = "Racha semanal",
}: StreakWeekProps): React.ReactElement {
  const completedCount = days.filter(Boolean).length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--dietista-text-2)]">
          {label}
        </span>
        <span className="text-xs font-semibold text-[var(--brand-600)] tnum">
          {completedCount}/7
        </span>
      </div>
      <div className="flex items-center justify-between gap-1">
        {DAY_LABELS.map((day, i) => (
          <div
            key={day}
            className={`
              flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors
              ${days[i]
                ? "bg-[var(--brand-500)] text-white"
                : i === currentDay
                  ? "ring-2 ring-[var(--brand-400)] text-[var(--dietista-text)]"
                  : "bg-[var(--dietista-surface-2)] text-[var(--dietista-text-3)]"
              }
            `}
            aria-label={`${day}: ${days[i] ? "completed" : "pending"}`}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
}
