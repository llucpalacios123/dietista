"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import type { PlanBand } from "@/lib/weight-correlation";

export interface WeightChartData {
  date: string;
  weight: number;
}

export interface WeightChartProps {
  /** Array of weight entries over time */
  data: WeightChartData[];
  /** Optional goal weight line */
  goalWeight?: number;
  /** Height in pixels */
  height?: number;
  /** Loading state */
  loading?: boolean;
  /** Meal plan bands to overlay on the chart */
  planBands?: PlanBand[];
}

/** Formats a "YYYY-MM-DD" string using the same format as the XAxis formatter. */
function formatBandDate(isoDate: string): string {
  // Add time to avoid timezone shift on Date parsing
  return new Date(`${isoDate}T00:00:00.000Z`).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
}

/** Returns a human-readable delta label. */
function formatDelta(deltaKg: number | null, noDataLabel: string): string {
  if (deltaKg === null) return noDataLabel;
  const sign = deltaKg >= 0 ? "+" : "";
  return `${sign}${deltaKg.toFixed(1)} kg`;
}

export function WeightChartInner({
  data,
  goalWeight,
  height = 240,
  loading = false,
  planBands = [],
}: WeightChartProps): React.ReactElement {
  if (loading) {
    return (
      <div
        className="flex h-60 items-center justify-center text-sm text-[var(--dietista-text-3)]"
        role="status"
        aria-label="Loading weight chart"
      >
        Cargando...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className="flex h-60 items-center justify-center text-sm text-[var(--dietista-text-3)]"
        role="status"
        aria-label="No weight data available"
      >
        Sin datos de peso aún
      </div>
    );
  }

  const t = useTranslations("Progress");

  const formattedData = data.map((entry) => ({
    ...entry,
    date: new Date(entry.date).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      timeZone: "UTC",
    }),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={formattedData}
        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
        aria-label="Weight trend chart"
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--dietista-border)"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "var(--dietista-text-3)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--dietista-text-3)" }}
          axisLine={false}
          tickLine={false}
          domain={["dataMin - 1", "dataMax + 1"]}
        />
        <Tooltip
          contentStyle={{
            background: "var(--dietista-surface)",
            border: "1px solid var(--dietista-border)",
            borderRadius: "var(--dietista-r-md)",
            fontSize: "12px",
          }}
          labelStyle={{ fontWeight: 600 }}
          formatter={(value: unknown) => {
            const num = typeof value === "number" ? value : 0;
            return [`${num.toFixed(1)} kg`, "Peso"];
          }}
        />

        {/* Meal plan correlation bands */}
        {planBands.map((band) => {
          const x1 = formatBandDate(band.startDate);
          const x2 = formatBandDate(band.endDate);
          const delta = band.deltaKg;
          // Color: negative delta → green (weight loss), positive → red, null → grey
          const fillColor =
            delta === null
              ? "var(--dietista-border)"
              : delta < 0
                ? "rgba(34,197,94,0.12)"
                : "rgba(239,68,68,0.12)";
          const strokeColor =
            delta === null
              ? "var(--dietista-border)"
              : delta < 0
                ? "rgba(34,197,94,0.5)"
                : "rgba(239,68,68,0.5)";
          const deltaLabel = formatDelta(delta, t("noData"));
          const labelText = `${band.name} ${deltaLabel}`;

          return (
            <ReferenceArea
              key={band.planId}
              x1={x1}
              x2={x2}
              fill={fillColor}
              stroke={strokeColor}
              strokeOpacity={0.6}
              label={{
                value: labelText,
                position: "insideTop",
                fontSize: 9,
                fill:
                  delta === null
                    ? "var(--dietista-text-3)"
                    : delta < 0
                      ? "rgb(34,197,94)"
                      : "rgb(239,68,68)",
              }}
            />
          );
        })}

        {goalWeight !== undefined && (
          <ReferenceLine
            y={goalWeight}
            stroke="var(--dietista-warning)"
            strokeDasharray="4 4"
            label={{
              value: `Obj: ${goalWeight}kg`,
              position: "right",
              fill: "var(--dietista-warning)",
              fontSize: 10,
            }}
          />
        )}
        <Line
          type="monotone"
          dataKey="weight"
          stroke="var(--brand-500)"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "var(--brand-500)" }}
          activeDot={{ r: 5 }}
          animationDuration={800}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
