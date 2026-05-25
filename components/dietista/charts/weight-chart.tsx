"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

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
}

export function WeightChartInner({
  data,
  goalWeight,
  height = 240,
  loading = false,
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

  const formattedData = data.map((entry) => ({
    ...entry,
    date: new Date(entry.date).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
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
