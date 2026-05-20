"use client";

import React from "react";

export interface MacroBarProps {
  /** Label for the macro (e.g. "Proteína") */
  label: string;
  /** Current consumed amount */
  current: number;
  /** Target amount */
  target: number;
  /** Unit label (e.g. "g", "kcal") */
  unit?: string;
  /** Bar color (CSS color) */
  color?: string;
  /** Background bar color */
  bgColor?: string;
}

export function MacroBar({
  label,
  current,
  target,
  unit = "g",
  color = "var(--ring-cal)",
  bgColor = "var(--ring-cal-bg)",
}: MacroBarProps): React.ReactElement {
  const percentage = Math.min((current / target) * 100, 100);
  const isOver = current > target;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--dietista-text-2)]">
          {label}
        </span>
        <span
          className={`text-xs font-semibold tnum ${isOver ? "text-[var(--dietista-danger)]" : "text-[var(--dietista-text)]"}`}
        >
          {Math.round(current)}
          {unit} / {Math.round(target)}
          {unit}
        </span>
      </div>
      <div
        className="h-2 w-full rounded-full"
        style={{ backgroundColor: bgColor }}
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-label={`${label}: ${current}${unit} of ${target}${unit}`}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            backgroundColor: isOver ? "var(--dietista-danger)" : color,
          }}
        />
      </div>
    </div>
  );
}
