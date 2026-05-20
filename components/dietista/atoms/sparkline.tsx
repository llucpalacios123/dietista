"use client";

import React from "react";

export interface SparklineProps {
  /** Array of numeric values to plot */
  data: number[];
  /** Line color */
  color?: string;
  /** Width in pixels */
  width?: number;
  /** Height in pixels */
  height?: number;
  /** Accessibility label */
  ariaLabel?: string;
}

export function Sparkline({
  data,
  color = "var(--brand-500)",
  width = 80,
  height = 32,
  ariaLabel = "Trend sparkline",
}: SparklineProps): React.ReactElement {
  if (data.length < 2) {
    return (
      <svg width={width} height={height} aria-label={ariaLabel}>
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-[var(--dietista-text-3)]"
          style={{ fontSize: "10px" }}
        >
          Sin datos
        </text>
      </svg>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data.map((value, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const pathD = points
    .map((point, i) => `${i === 0 ? "M" : "L"}${point}`)
    .join(" ");

  return (
    <svg width={width} height={height} aria-label={ariaLabel}>
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
