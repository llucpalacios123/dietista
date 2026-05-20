import React from "react";
import { DayPill } from "@/components/dietista/atoms";

export interface WeeklyDayCardProps {
  days: Array<{
    date: string;
    dayLabel: string;
    hasData: boolean;
    calories: number;
    target: number;
  }>;
  activeIndex: number;
  onDaySelect?: (index: number) => void;
}

export function WeeklyDayCard({
  days,
  activeIndex,
  onDaySelect,
}: WeeklyDayCardProps): React.ReactElement {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-[var(--dietista-pad-card)]">
        <span className="text-xs font-medium text-[var(--dietista-text-2)]">
          Semana
        </span>
      </div>
      <div className="flex items-center justify-between gap-1 px-[var(--dietista-pad-card)]">
        {days.map((day, i) => (
          <DayPill
            key={day.date}
            day={day.dayLabel}
            active={i === activeIndex}
            hasData={day.hasData}
            onClick={() => onDaySelect?.(i)}
          />
        ))}
      </div>
      {days[activeIndex] && (
        <div className="mx-[var(--dietista-pad-card)] rounded-[var(--dietista-r-md)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--dietista-text)]">
              {days[activeIndex].date}
            </span>
            <span className="text-sm font-semibold tnum text-[var(--dietista-text)]">
              {Math.round(days[activeIndex].calories)} / {Math.round(days[activeIndex].target)} kcal
            </span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-[var(--ring-cal-bg)]">
            <div
              className="h-full rounded-full bg-[var(--ring-cal)] transition-all duration-500"
              style={{
                width: `${Math.min((days[activeIndex].calories / days[activeIndex].target) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
