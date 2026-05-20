import React from "react";
import { HeroMacroRing } from "@/components/dietista/atoms";

export interface MacroRingsPanelProps {
  calories: { consumed: number; target: number };
  protein: { consumed: number; target: number };
  carbs: { consumed: number; target: number };
  fat: { consumed: number; target: number };
  variant?: "hero" | "compact";
}

export function MacroRingsPanel({
  calories,
  protein,
  carbs,
  fat,
  variant = "hero",
}: MacroRingsPanelProps): React.ReactElement {
  if (variant === "hero") {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <HeroMacroRing
          value={calories.consumed}
          max={calories.target}
          current={calories.consumed}
          label="calorías"
          subtitle={`${Math.round(Math.max(0, calories.target - calories.consumed))} restantes`}
          variant="concentric"
          size={160}
          strokeWidth={12}
          secondaryRings={[
            { value: protein.consumed, max: protein.target, color: "var(--ring-pro)", bgColor: "var(--ring-pro-bg)" },
            { value: carbs.consumed, max: carbs.target, color: "var(--ring-carb)", bgColor: "var(--ring-carb-bg)" },
            { value: fat.consumed, max: fat.target, color: "var(--ring-fat)", bgColor: "var(--ring-fat-bg)" },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="flex justify-center gap-4 py-3">
      <MacroRingSmall label="Cal" value={calories.consumed} max={calories.target} color="var(--ring-cal)" bgColor="var(--ring-cal-bg)" />
      <MacroRingSmall label="Prot" value={protein.consumed} max={protein.target} color="var(--ring-pro)" bgColor="var(--ring-pro-bg)" />
      <MacroRingSmall label="Carb" value={carbs.consumed} max={carbs.target} color="var(--ring-carb)" bgColor="var(--ring-carb-bg)" />
      <MacroRingSmall label="Grasa" value={fat.consumed} max={fat.target} color="var(--ring-fat)" bgColor="var(--ring-fat-bg)" />
    </div>
  );
}

function MacroRingSmall({
  label,
  value,
  max,
  color,
  bgColor,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  bgColor: string;
}) {
  const size = 64;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(value / max, 1);
  const offset = circumference * (1 - percentage);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={bgColor} strokeWidth={strokeWidth} />
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
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-[var(--dietista-text)] font-semibold tnum"
          style={{ fontSize: "12px" }}
        >
          {Math.round(value)}
        </text>
      </svg>
      <span className="text-[10px] font-medium text-[var(--dietista-text-2)]">{label}</span>
    </div>
  );
}
