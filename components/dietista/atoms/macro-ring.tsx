"use client";

import React from "react";

export interface MacroRingProps {
  /** Percentage complete (0-100) */
  value: number;
  /** Maximum value for percentage calculation */
  max: number;
  /** Current consumed amount */
  current: number;
  /** Label displayed below the ring */
  label: string;
  /** Ring color (CSS color string) */
  color?: string;
  /** Background ring color */
  bgColor?: string;
  /** Diameter in pixels */
  size?: number;
  /** Stroke width in pixels */
  strokeWidth?: number;
  /** Whether to show the numeric value inside */
  showValue?: boolean;
  /** Accessibility label */
  ariaLabel?: string;
}

const MACRO_RING_COLORS = {
  cal: { fg: "var(--ring-cal)", bg: "var(--ring-cal-bg)" },
  pro: { fg: "var(--ring-pro)", bg: "var(--ring-pro-bg)" },
  carb: { fg: "var(--ring-carb)", bg: "var(--ring-carb-bg)" },
  fat: { fg: "var(--ring-fat)", bg: "var(--ring-fat-bg)" },
} as const;

export function MacroRing({
  value,
  max,
  current,
  label,
  color,
  bgColor,
  size = 80,
  strokeWidth = 8,
  showValue = true,
  ariaLabel,
}: MacroRingProps): React.ReactElement {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(value / max, 1);
  const offset = circumference * (1 - percentage);

  const resolvedColor = color ?? "var(--ring-cal)";
  const resolvedBg = bgColor ?? "var(--ring-cal-bg)";

  return (
    <div
      className="flex flex-col items-center gap-1"
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={ariaLabel ?? `${label}: ${current} of ${max}`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={resolvedBg}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={resolvedColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 500ms ease-out" }}
        />
        {showValue && (
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-[var(--dietista-text)] font-semibold tnum"
            style={{ fontSize: size * 0.22 }}
          >
            {Math.round(value)}
          </text>
        )}
      </svg>
      <span
        className="text-xs font-medium text-[var(--dietista-text-2)]"
        style={{ fontSize: "11px" }}
      >
        {label}
      </span>
    </div>
  );
}

export function getMacroRingColors(
  macro: "cal" | "pro" | "carb" | "fat"
): { fg: string; bg: string } {
  return MACRO_RING_COLORS[macro];
}
