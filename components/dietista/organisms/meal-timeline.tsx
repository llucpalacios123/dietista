import React from "react";
import { MealLogEntry } from "@/components/dietista/molecules/meal-log-entry";

export interface MealTimelineProps {
  meals: Array<{
    id: string;
    mealType: string;
    rawInput: string;
    totalCalories: number | null;
    time?: string;
  }>;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  emptyMessage?: string;
}

export function MealTimeline({
  meals,
  onEdit,
  onDelete,
  emptyMessage = "No registraste comidas aún",
}: MealTimelineProps): React.ReactElement {
  if (meals.length === 0) {
    return (
      <div className="rounded-[var(--dietista-r-lg)] border border-dashed border-[var(--dietista-border)] p-8 text-center">
        <p className="text-sm text-[var(--dietista-text-3)]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {meals.map((meal) => (
        <MealLogEntry
          key={meal.id}
          mealType={meal.mealType}
          rawInput={meal.rawInput}
          totalCalories={meal.totalCalories}
          time={meal.time}
          onEdit={onEdit ? () => onEdit(meal.id) : undefined}
          onDelete={onDelete ? () => onDelete(meal.id) : undefined}
        />
      ))}
    </div>
  );
}
