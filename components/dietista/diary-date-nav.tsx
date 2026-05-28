"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayStrip } from "@/components/dietista/atoms";
import {
  getWeekBounds,
  dayOfWeekMondayFirst,
  startOfToday,
} from "@/lib/dates";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DiaryDateNavProps {
  /** Currently selected date — drives weekStart and activeIndex */
  selectedDate: Date;
  /** 7 short day labels starting Monday */
  dayLabels: string[];
  /** boolean[7] activity indicators, Monday=0 */
  dataDays: boolean[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DiaryDateNav({
  selectedDate,
  dayLabels,
  dataDays,
}: DiaryDateNavProps): React.ReactElement {
  const router = useRouter();
  const t = useTranslations("Journal");

  // Compute week bounds from selectedDate each render (no local state — ADR-3)
  const { start: weekStart } = getWeekBounds(selectedDate);
  const activeIndex = dayOfWeekMondayFirst(selectedDate);

  const handleDaySelect = (index: number) => {
    const target = addDays(weekStart, index);
    router.push(`/diario?date=${toISODate(target)}`);
  };

  const handlePrevWeek = () => {
    const target = addDays(selectedDate, -7);
    router.push(`/diario?date=${toISODate(target)}`);
  };

  const handleNextWeek = () => {
    const target = addDays(selectedDate, 7);
    router.push(`/diario?date=${toISODate(target)}`);
  };

  const handleGoToToday = () => {
    router.push("/diario");
  };

  // Show "Today" button only when selectedDate is not today
  const isToday =
    selectedDate.getTime() === startOfToday().getTime();

  return (
    <div className="flex flex-col gap-1">
      {/* Week navigation row */}
      <div className="flex items-center justify-between px-[var(--dietista-pad-card)]">
        <button
          type="button"
          onClick={handlePrevWeek}
          aria-label={t("prevWeek")}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--dietista-text-3)] transition-colors hover:bg-[var(--dietista-surface-2,var(--dietista-surface))] hover:text-[var(--dietista-text)]"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {!isToday && (
          <button
            type="button"
            onClick={handleGoToToday}
            aria-label={t("goToToday")}
            className="text-xs font-medium text-[var(--brand-500)] transition-colors hover:text-[var(--brand-600)]"
          >
            {t("goToToday")}
          </button>
        )}

        <button
          type="button"
          onClick={handleNextWeek}
          aria-label={t("nextWeek")}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--dietista-text-3)] transition-colors hover:bg-[var(--dietista-surface-2,var(--dietista-surface))] hover:text-[var(--dietista-text)]"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day strip */}
      <DayStrip
        days={dayLabels}
        activeIndex={activeIndex}
        dataDays={dataDays}
        onDaySelect={handleDaySelect}
      />
    </div>
  );
}
