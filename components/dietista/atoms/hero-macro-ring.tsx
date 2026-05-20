"use client";

import React from "react";

export interface HeroMacroRingProps {
  /** Percentage complete (0-100) */
  value: number;
  /** Maximum value */
  max: number;
  /** Current consumed amount */
  current: number;
  /** Label displayed inside the ring */
  label: string;
  /** Subtitle below the label */
  subtitle?: string;
  /** Ring color */
  color?: string;
  /** Background ring color */
  bgColor?: string;
  /** Diameter in pixels */
  size?: number;
  /** Stroke width in pixels */
  strokeWidth?: number;
  /** Variant: concentric shows multiple rings, minimal shows single ring */
  variant?: "concentric" | "minimal";
  /** Secondary ring data for concentric variant */
  secondaryRings?: Array<{
    value: number;
    max: number;
    color: string;
    bgColor: string;
  }>;
}

export function HeroMacroRing({
  value,
  max,
  current,
  label,
  subtitle,
  color = "var(--ring-cal)",
  bgColor = "var(--ring-cal-bg)",
  size = 160,
  strokeWidth = 12,
  variant = "minimal",
  secondaryRings,
}: HeroMacroRingProps): React.ReactElement {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(value / max, 1);
  const offset = circumference * (1 - percentage);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background ring */}
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {variant === "concentric" &&
            secondaryRings?.map((ring, i) => {
              const r = radius - (i + 1) * (strokeWidth + 4);
              const c = 2 * Math.PI * r;
              const p = Math.min(ring.value / ring.max, 1);
              const o = c * (1 - p);
              return (
                <React.Fragment key={i}>
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke={ring.bgColor}
                    strokeWidth={strokeWidth - 2}
                  />
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke={ring.color}
                    strokeWidth={strokeWidth - 2}
                    strokeDasharray={c}
                    strokeDashoffset={o}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    style={{ transition: "stroke-dashoffset 500ms ease-out" }}
                  />
                </React.Fragment>
              );
            })}
          {/* Main ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={bgColor}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: "stroke-dashoffset 500ms ease-out" }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-[var(--dietista-text)] tnum">
            {Math.round(value)}
          </span>
          <span className="text-sm font-medium text-[var(--dietista-text-2)]">
            {label}
          </span>
          {subtitle && (
            <span className="text-xs text-[var(--dietista-text-3)]">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
