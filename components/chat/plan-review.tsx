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
import { useTranslations } from "next-intl";
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

const DAY_KEY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const MEAL_TYPE_ICONS: Record<string, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
  snack: "🍎",
};

const REASON_KEYS = [
  "dont_like",
  "allergy",
  "too_complex",
  "other",
] as const;

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
  modifyLabel,
}: {
  meal: InternalMeal;
  onModify: () => void;
  modifyLabel: string;
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
          aria-label={modifyLabel}
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
  const t = useTranslations("PlanReview");
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [modifyingMeal, setModifyingMeal] = useState<{
    dayOfWeek: number;
    mealType: string;
  } | null>(null);

  const dayNames = t.raw("days") as unknown as Record<string, string>;
  const reasonLabels = t.raw("reasons") as unknown as Record<string, string>;

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
            {t("title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {modifications.length > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {modifications.length}{" "}
              {modifications.length === 1 ? t("modifications_one") : t("modifications_other")}
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
              <strong>{t("caloriesWeekly")}:</strong> {Math.round(mealPlan.weeklyTotals.calories)}{t("perWeek")}
            </span>
            <span>
              <strong>{t("proteinWeekly")}:</strong> {Math.round(mealPlan.weeklyTotals.protein)}g
            </span>
            <span>
              <strong>{t("carbsWeekly")}:</strong> {Math.round(mealPlan.weeklyTotals.carbs)}g
            </span>
            <span>
              <strong>{t("fatWeekly")}:</strong> {Math.round(mealPlan.weeklyTotals.fat)}g
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
                  {dayNames[DAY_KEY_ORDER[day.dayOfWeek]] ?? `Día ${day.dayOfWeek + 1}`}
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
                    {t("regenerateDay")}
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
                    modifyLabel={t("modifyLabel")}
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
              {t("whyChange")}
            </p>
            <div className="flex flex-wrap gap-2">
              {REASON_KEYS.map((reasonKey) => (
                <Button
                  key={reasonKey}
                  variant="outline"
                  size="sm"
                  onClick={() => handleReasonSelect(reasonKey as ModificationReason)}
                >
                  {reasonLabels[reasonKey]}
                </Button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setModifyingMeal(null)}
            >
              {t("cancel")}
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
              {t("undoLast")}
            </Button>
          )}
        </div>
        <Button onClick={onConfirm} size="lg" className="gap-2">
          <CheckCircle2 className="h-4 w-4" />
          {t("confirmPlan")}
        </Button>
      </div>
    </div>
  );
}
