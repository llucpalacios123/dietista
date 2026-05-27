"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { PlannedMeal } from "@/lib/planned-meal-mapper";

// ─── Props ─────────────────────────────────────────────────────────────────────

interface TodaysMealsProps {
  meals: PlannedMeal[];
  hasActivePlan: boolean;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function TodaysMeals({ meals, hasActivePlan }: TodaysMealsProps) {
  const t = useTranslations("Journal");
  const [expandedMeals, setExpandedMeals] = useState<Record<string, boolean>>({});

  const toggleMeal = (id: string) => {
    setExpandedMeals((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const mealTypeLabels = t.raw("mealTypes") as Record<string, string>;

  return (
    <div className="space-y-3 px-[var(--dietista-pad-card)]">
      {/* Section heading */}
      <h2 className="text-sm font-semibold text-[var(--dietista-text)]">
        {t("plannedTitle")}
      </h2>

      {/* Empty state (a): no active plan */}
      {!hasActivePlan && (
        <div className="rounded-[var(--dietista-r-lg)] border border-dashed border-[var(--dietista-border)] p-8 text-center">
          <p className="text-sm font-medium text-[var(--dietista-text)]">
            {t("noActivePlan")}
          </p>
          <p className="mt-1 text-xs text-[var(--dietista-text-3)]">
            {t("noActivePlanHint")}
          </p>
          <Link
            href="/planes"
            className="mt-4 inline-block rounded-lg bg-[var(--brand-500)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-600)]"
          >
            {t("goToPlans")}
          </Link>
        </div>
      )}

      {/* Empty state (b): active plan but no meals today */}
      {hasActivePlan && meals.length === 0 && (
        <div className="rounded-[var(--dietista-r-lg)] border border-dashed border-[var(--dietista-border)] p-8 text-center">
          <p className="text-sm text-[var(--dietista-text-3)]">
            {t("noPlannedMeals")}
          </p>
        </div>
      )}

      {/* Meal cards */}
      {hasActivePlan &&
        meals.map((meal) => {
          const isExpanded = !!expandedMeals[meal.id];
          return (
            <div
              key={meal.id}
              className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)]"
            >
              {/* Collapsed header (always visible) */}
              <button
                type="button"
                onClick={() => toggleMeal(meal.id)}
                aria-expanded={isExpanded}
                className="flex w-full items-start justify-between p-[var(--dietista-pad-card)] text-left transition-colors hover:bg-[var(--dietista-surface-2,var(--dietista-surface))] rounded-[var(--dietista-r-lg)]"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--dietista-text-2)]">
                    {mealTypeLabels[meal.mealType] ?? meal.mealType}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-[var(--dietista-text)]">
                    {meal.name}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--dietista-text-3)] tnum">
                    {Math.round(meal.calories)} kcal
                  </p>
                </div>
                {isExpanded ? (
                  <ChevronUp className="mt-1 h-4 w-4 flex-shrink-0 text-[var(--dietista-text-3)]" />
                ) : (
                  <ChevronDown className="mt-1 h-4 w-4 flex-shrink-0 text-[var(--dietista-text-3)]" />
                )}
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="space-y-3 px-[var(--dietista-pad-card)] pb-[var(--dietista-pad-card)]">
                  {/* Description */}
                  {meal.description && (
                    <p className="text-sm text-[var(--dietista-text-2)]">
                      {meal.description}
                    </p>
                  )}

                  {/* Macro line */}
                  <p className="text-xs text-[var(--dietista-text-3)] tnum">
                    {t("abbrProtein")} {Math.round(meal.protein)}g{" "}
                    {t("abbrCarbs")} {Math.round(meal.carbs)}g{" "}
                    {t("abbrFat")} {Math.round(meal.fat)}g
                  </p>

                  {/* Ingredient table */}
                  {meal.ingredients.length > 0 ? (
                    <>
                      <p className="text-xs font-medium text-[var(--dietista-text-2)]">
                        {t("ingredients")}
                      </p>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-[var(--dietista-border)] text-left text-[var(--dietista-text-3)]">
                            <th className="py-1 pr-2">{t("ingredientName")}</th>
                            <th className="px-2 py-1">{t("quantity")}</th>
                            <th className="py-1 pl-2">{t("unit")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {meal.ingredients.map((ing, i) => (
                            <tr
                              key={i}
                              className="border-b border-[var(--dietista-border)]/50"
                            >
                              <td className="py-1 pr-2 text-[var(--dietista-text)]">
                                {ing.name}
                              </td>
                              <td className="px-2 py-1 text-[var(--dietista-text-2)] tnum">
                                {ing.quantity ?? ""}
                              </td>
                              <td className="py-1 pl-2 text-[var(--dietista-text-2)]">
                                {ing.unit ?? ""}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  ) : (
                    <p className="text-xs italic text-[var(--dietista-text-3)]">
                      {t("noIngredients")}
                    </p>
                  )}

                  {/* Instructions */}
                  {meal.instructions && (
                    <p className="text-xs italic text-[var(--dietista-text-3)]">
                      {meal.instructions}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
