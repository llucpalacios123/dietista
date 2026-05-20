import React from "react";

export interface DayPillProps {
  /** Abbreviated day name (e.g. "Lun", "Mar") */
  day: string;
  /** Whether this day is selected/active */
  active?: boolean;
  /** Whether this day has data (e.g. meals logged) */
  hasData?: boolean;
  /** Click handler */
  onClick?: () => void;
}

export function DayPill({
  day,
  active = false,
  hasData = false,
  onClick,
}: DayPillProps): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-colors
        ${active
          ? "bg-[var(--brand-500)] text-white"
          : "text-[var(--dietista-text-2)] hover:bg-[var(--dietista-surface-2)]"
        }
      `}
      aria-pressed={active}
      aria-label={`Select ${day}`}
    >
      {day}
      {hasData && !active && (
        <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--brand-400)]" />
      )}
    </button>
  );
}
