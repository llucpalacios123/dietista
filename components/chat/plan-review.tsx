"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InternalMealPlan, InternalMeal, MealModification, ModificationReason } from "@/types/meal-plan";
import {
  CalendarDays,
  RotateCcw,
  Undo2,
  Pencil,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────

const DAY_NAMES = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

const MEAL_TYPE_ICONS: Record<string, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
  snack: "🍎",
};

// ─── Types ────────────────────────────────────────────────────────────────

interface PlanReviewProps {
  /** The generated meal plan to review. */
  mealPlan: InternalMealPlan;
  /** List of modifications made so far. */
  modifications?: MealModification[];
  /** Whether a macro coherence warning is active. */
  macroWarning?: string | null;
  /** Called when user requests a meal change. */
  onModifyMeal: (dayOfWeek: number, mealType: string, reason: ModificationReason) => void;
  /** Called when user requests full day regeneration. */
  onRegenerateDay: (dayOfWeek: number) => void;
  /** Called to undo the last modification. */
  onUndo: () => void;
  /** Called when user is done reviewing. */
  onConfirm: () => void;
}

// ─── Meal Card ────────────────────────────────────────────────────────────

function MealCard({
  meal,
  onModify,
}: {
  meal: InternalMeal;
  onModify: () => void;
}) {
  return (
    <div className="group relative rounded-lg border bg-card p-3 text-sm hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium truncate">
            {MEAL_TYPE_ICONS[meal.mealType] ?? ""} {meal.name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {meal.description}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onModify}
          aria-label="Modificar comida"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
        <span>{Math.round(meal.calories)} kcal</span>
        <span>P: {Math.round(meal.protein)}g</span>
        <span>C: {Math.round(meal.carbs)}g</span>
        <span>G: {Math.round(meal.fat)}g</span>
      </div>
    </div>
  );
}

// ─── Modify Meal Dialog (inline) ──────────────────────────────────────────

const MODIFY_REASONS: Array<{ value: ModificationReason; label: string }> = [
  { value: "dont_like", label: "No me gusta" },
  { value: "allergy", label: "Alergia" },
  { value: "too_complex", label: "Muy complicada" },
  { value: "other", label: "Otro motivo" },
];

// ─── Component ────────────────────────────────────────────────────────────

/**
 * PlanReview — Step 5: Plan Review & Modification
 *
 * Displays the 7-day weekly meal plan with per-meal edit capability,
 * per-day regeneration, modification tracking with undo, and macro
 * coherence warnings.
 */
export function PlanReview({
  mealPlan,
  modifications = [],
  macroWarning,
  onModifyMeal,
  onRegenerateDay,
  onUndo,
  onConfirm,
}: PlanReviewProps) {
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [modifyingMeal, setModifyingMeal] = useState<{
    dayOfWeek: number;
    mealType: string;
  } | null>(null);

  const handleModifyClick = useCallback((dayOfWeek: number, mealType: string) => {
    setModifyingMeal({ dayOfWeek, mealType });
  }, []);

  const handleReasonSelect = useCallback(
    (reason: ModificationReason) => {
      if (modifyingMeal) {
        onModifyMeal(modifyingMeal.dayOfWeek, modifyingMeal.mealType, reason);
        setModifyingMeal(null);
      }
    },
    [modifyingMeal, onModifyMeal],
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Tu Plan Semanal
          </h2>
          <p className="text-sm text-muted-foreground">
            Revisá tus comidas. Podés modificar, regenerar o deshacer cambios.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {modifications.length > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {modifications.length} comida{modifications.length !== 1 ? "s" : ""} modificada{modifications.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Macro Coherence Warning */}
      {macroWarning && (
        <div className="flex items-start gap-2 rounded-md border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 p-3 text-sm">
          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
          <p>{macroWarning}</p>
        </div>
      )}

      {/* Weekly Totals Summary */}
      <Card className="bg-muted/50">
        <CardContent className="py-3">
          <div className="flex flex-wrap gap-4 text-sm">
            <span>
              <strong>Calorías:</strong> {Math.round(mealPlan.weeklyTotals.calories)}/semana
            </span>
            <span>
              <strong>Proteína:</strong> {Math.round(mealPlan.weeklyTotals.protein)}g
            </span>
            <span>
              <strong>Carbs:</strong> {Math.round(mealPlan.weeklyTotals.carbs)}g
            </span>
            <span>
              <strong>Grasas:</strong> {Math.round(mealPlan.weeklyTotals.fat)}g
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Days */}
      <div className="space-y-3">
        {mealPlan.days.map((day) => (
          <Card
            key={day.dayOfWeek}
            className="border transition-colors hover:border-primary/30"
          >
            <CardHeader
              className="py-2 px-4 cursor-pointer"
              onClick={() =>
                setExpandedDay(
                  expandedDay === day.dayOfWeek ? null : day.dayOfWeek,
                )
              }
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {DAY_NAMES[day.dayOfWeek] ?? `Día ${day.dayOfWeek + 1}`}
                </CardTitle>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {Math.round(day.dailyTotals.calories)} kcal
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRegenerateDay(day.dayOfWeek);
                    }}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Regenerar día
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-3 px-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {day.meals.map((meal) => (
                  <MealCard
                    key={meal.id}
                    meal={meal}
                    onModify={() => handleModifyClick(day.dayOfWeek, meal.mealType)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modification Reason Dialog */}
      {modifyingMeal && (
        <Card className="border-primary/50">
          <CardContent className="py-4 space-y-3">
            <p className="text-sm font-medium">
              ¿Por qué querés cambiar esta comida?
            </p>
            <div className="flex flex-wrap gap-2">
              {MODIFY_REASONS.map((r) => (
                <Button
                  key={r.value}
                  variant="outline"
                  size="sm"
                  onClick={() => handleReasonSelect(r.value)}
                >
                  {r.label}
                </Button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setModifyingMeal(null)}
            >
              Cancelar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <div className="flex gap-2">
          {modifications.length > 0 && (
            <Button variant="outline" size="sm" onClick={onUndo}>
              <Undo2 className="h-4 w-4 mr-1" />
              Deshacer última modificación
            </Button>
          )}
        </div>
        <Button onClick={onConfirm} size="lg" className="gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Confirmar plan
        </Button>
      </div>
    </div>
  );
}
