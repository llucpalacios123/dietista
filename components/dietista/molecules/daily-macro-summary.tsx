import React from "react";
import { MacroRing, MacroBar } from "@/components/dietista/atoms";

export interface DailyMacroSummaryProps {
  consumed: { calories: number; protein: number; carbs: number; fat: number };
  targets: { calories: number; protein: number; carbs: number; fat: number };
  variant?: "rings" | "bars" | "both";
}

export function DailyMacroSummary({
  consumed,
  targets,
  variant = "rings",
}: DailyMacroSummaryProps): React.ReactElement {
  if (variant === "bars") {
    return (
      <div className="space-y-3">
        <MacroBar label="Proteína" current={consumed.protein} target={targets.protein} color="var(--ring-pro)" bgColor="var(--ring-pro-bg)" />
        <MacroBar label="Carbos" current={consumed.carbs} target={targets.carbs} color="var(--ring-carb)" bgColor="var(--ring-carb-bg)" />
        <MacroBar label="Grasa" current={consumed.fat} target={targets.fat} color="var(--ring-fat)" bgColor="var(--ring-fat-bg)" />
      </div>
    );
  }

  if (variant === "both") {
    return (
      <div className="space-y-4">
        <div className="flex justify-center gap-4">
          <MacroRing value={consumed.calories} max={targets.calories} current={consumed.calories} label="Cal" size={72} strokeWidth={7} color="var(--ring-cal)" bgColor="var(--ring-cal-bg)" />
          <MacroRing value={consumed.protein} max={targets.protein} current={consumed.protein} label="Prot" size={72} strokeWidth={7} color="var(--ring-pro)" bgColor="var(--ring-pro-bg)" />
          <MacroRing value={consumed.carbs} max={targets.carbs} current={consumed.carbs} label="Carb" size={72} strokeWidth={7} color="var(--ring-carb)" bgColor="var(--ring-carb-bg)" />
          <MacroRing value={consumed.fat} max={targets.fat} current={consumed.fat} label="Grasa" size={72} strokeWidth={7} color="var(--ring-fat)" bgColor="var(--ring-fat-bg)" />
        </div>
        <div className="space-y-3">
          <MacroBar label="Proteína" current={consumed.protein} target={targets.protein} color="var(--ring-pro)" bgColor="var(--ring-pro-bg)" />
          <MacroBar label="Carbos" current={consumed.carbs} target={targets.carbs} color="var(--ring-carb)" bgColor="var(--ring-carb-bg)" />
          <MacroBar label="Grasa" current={consumed.fat} target={targets.fat} color="var(--ring-fat)" bgColor="var(--ring-fat-bg)" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center gap-4">
      <MacroRing value={consumed.calories} max={targets.calories} current={consumed.calories} label="Cal" size={72} strokeWidth={7} color="var(--ring-cal)" bgColor="var(--ring-cal-bg)" />
      <MacroRing value={consumed.protein} max={targets.protein} current={consumed.protein} label="Prot" size={72} strokeWidth={7} color="var(--ring-pro)" bgColor="var(--ring-pro-bg)" />
      <MacroRing value={consumed.carbs} max={targets.carbs} current={consumed.carbs} label="Carb" size={72} strokeWidth={7} color="var(--ring-carb)" bgColor="var(--ring-carb-bg)" />
      <MacroRing value={consumed.fat} max={targets.fat} current={consumed.fat} label="Grasa" size={72} strokeWidth={7} color="var(--ring-fat)" bgColor="var(--ring-fat-bg)" />
    </div>
  );
}
