"use client";

import React from "react";
import { DayPill } from "./day-pill";

export interface DayStripProps {
  /** Array of 7 day abbreviations */
  days: string[];
  /** Index of the currently active day */
  activeIndex: number;
  /** Array of booleans indicating which days have data */
  dataDays?: boolean[];
  /** Callback when a day is selected */
  onDaySelect?: (index: number) => void;
}

export function DayStrip({
  days,
  activeIndex,
  dataDays,
  onDaySelect,
}: DayStripProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between gap-1 px-[var(--dietista-pad-card)] py-2">
      {days.map((day, i) => (
        <DayPill
          key={day}
          day={day}
          active={i === activeIndex}
          hasData={dataDays?.[i]}
          onClick={() => onDaySelect?.(i)}
        />
      ))}
    </div>
  );
}
