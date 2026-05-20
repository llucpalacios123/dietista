"use client";

import React from "react";

export interface AdherenceDayData {
  date: string;
  score: number; // 0-100
}

export interface AdherenceHeatMapProps {
  /** Array of daily adherence scores */
  data: AdherenceDayData[];
  /** Number of weeks to display */
  weeks?: number;
  /** Height in pixels */
  height?: number;
  /** Loading state */
  loading?: boolean;
}

function getAdherenceColor(score: number): string {
  if (score >= 90) return "var(--brand-600)";
  if (score >= 70) return "var(--brand-400)";
  if (score >= 50) return "var(--ring-carb)";
  if (score >= 25) return "var(--ring-carb-bg)";
  return "var(--dietista-surface-2)";
}

export function AdherenceHeatMapInner({
  data,
  weeks = 4,
  height,
  loading = false,
}: AdherenceHeatMapProps): React.ReactElement {
  if (loading) {
    return (
      <div
        className="flex h-40 items-center justify-center text-sm text-[var(--dietista-text-3)]"
        role="status"
        aria-label="Loading adherence heatmap"
      >
        Cargando...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className="flex h-40 items-center justify-center text-sm text-[var(--dietista-text-3)]"
        role="status"
        aria-label="No adherence data available"
      >
        Sin datos de adherencia aún
      </div>
    );
  }

  // Build a map for quick lookup
  const scoreMap = new Map<string, number>();
  for (const entry of data) {
    scoreMap.set(entry.date, entry.score);
  }

  // Generate the last N weeks of days
  const totalDays = weeks * 7;
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - totalDays + 1);

  // Normalize to Monday start
  const dayOfWeek = startDate.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startDate.setDate(startDate.getDate() + mondayOffset);

  const cells: Array<{ date: string; score: number | null }> = [];
  for (let i = 0; i < totalDays; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const key = date.toISOString().split("T")[0];
    cells.push({
      date: key,
      score: scoreMap.get(key) ?? null,
    });
  }

  const dayLabels = ["L", "M", "X", "J", "V", "S", "D"];

  return (
    <div className="overflow-x-auto" role="img" aria-label="Adherence heatmap">
      <div className="flex gap-1">
        {/* Day labels column */}
        <div className="flex flex-col gap-0.5 pr-1">
          {dayLabels.map((label) => (
            <div
              key={label}
              className="flex h-5 w-4 items-center justify-center text-[10px] text-[var(--dietista-text-3)]"
            >
              {label}
            </div>
          ))}
        </div>
        {/* Week columns */}
        {Array.from({ length: weeks }, (_, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-0.5">
            {dayLabels.map((_, dayIdx) => {
              const cellIdx = weekIdx * 7 + dayIdx;
              const cell = cells[cellIdx];
              if (!cell) return null;
              const score = cell.score;
              return (
                <div
                  key={dayIdx}
                  className="h-5 w-5 rounded-sm transition-colors"
                  style={{
                    backgroundColor:
                      score !== null
                        ? getAdherenceColor(score)
                        : "var(--dietista-surface-2)",
                  }}
                  title={
                    score !== null
                      ? `${cell.date}: ${score}% adherencia`
                      : `${cell.date}: sin datos`
                  }
                  aria-label={
                    score !== null
                      ? `${cell.date}: ${score}%`
                      : `${cell.date}: no data`
                  }
                />
              );
            })}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="mt-3 flex items-center gap-2 text-[10px] text-[var(--dietista-text-3)]">
        <span>Menos</span>
        <div className="flex gap-0.5">
          {[10, 30, 50, 70, 90].map((score) => (
            <div
              key={score}
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: getAdherenceColor(score) }}
            />
          ))}
        </div>
        <span>Más</span>
      </div>
    </div>
  );
}
