"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export interface MacroDayData {
  day: string;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MacroStackChartProps {
  /** Array of daily macro data */
  data: MacroDayData[];
  /** Target calories per day */
  targetCalories?: number;
  /** Height in pixels */
  height?: number;
  /** Loading state */
  loading?: boolean;
}

export function MacroStackChartInner({
  data,
  targetCalories,
  height = 240,
  loading = false,
}: MacroStackChartProps): React.ReactElement {
  if (loading) {
    return (
      <div
        className="flex h-60 items-center justify-center text-sm text-[var(--dietista-text-3)]"
        role="status"
        aria-label="Loading macros chart"
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
        aria-label="No macro data available"
      >
        Sin datos de macros aún
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
        aria-label="Daily macros stacked bar chart"
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--dietista-border)"
          vertical={false}
        />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: "var(--dietista-text-3)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--dietista-text-3)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "var(--dietista-surface)",
            border: "1px solid var(--dietista-border)",
            borderRadius: "var(--dietista-r-md)",
            fontSize: "12px",
          }}
          formatter={(value: unknown, name: unknown) => {
            const num = typeof value === "number" ? value : 0;
            const key = typeof name === "string" ? name : "";
            const label =
              key === "protein"
                ? "Proteína"
                : key === "carbs"
                  ? "Carbos"
                  : "Grasa";
            return [`${num.toFixed(0)}g`, label];
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: "11px" }}
          formatter={(value: string) => {
            const labels: Record<string, string> = {
              protein: "Proteína",
              carbs: "Carbos",
              fat: "Grasa",
            };
            return labels[value] ?? value;
          }}
        />
        <Bar
          dataKey="protein"
          stackId="macros"
          fill="var(--ring-pro)"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="carbs"
          stackId="macros"
          fill="var(--ring-carb)"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="fat"
          stackId="macros"
          fill="var(--ring-fat)"
          radius={[0, 0, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
