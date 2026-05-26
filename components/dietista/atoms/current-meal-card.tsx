"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { MealType } from "@prisma/client";

const MEAL_TYPE_ICONS: Record<MealType, string> = {
  breakfast: "🌅",
  mid_morning: "☕",
  lunch: "🍽️",
  dinner: "🌙",
  snack: "🍎",
};

interface CurrentMealData {
  name: string;
  description: string;
  mealType: MealType;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  isUpcoming?: boolean;
}

export interface CurrentMealCardProps {
  meal: CurrentMealData | null;
}

export function CurrentMealCard({
  meal,
}: CurrentMealCardProps): React.ReactElement {
  const t = useTranslations("Dashboard");

  if (!meal) {
    return (
      <div className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)]">
        <p className="text-sm font-semibold text-[var(--dietista-text)]">
          {t("noCurrentMeal")}
        </p>
        <p className="mt-1 text-xs text-[var(--dietista-text-2)]">
          {t("noCurrentMealHint")}
        </p>
        <Link
          href="/planes"
          className="mt-3 inline-block rounded-lg bg-[var(--brand-500)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--brand-600)]"
        >
          {t("goToPlans")}
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)]">
      <div className="flex items-center gap-2">
        <span className="text-lg" role="img" aria-hidden="true">
          {MEAL_TYPE_ICONS[meal.mealType] ?? "🍴"}
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--dietista-text-3)]">
          {meal.isUpcoming
            ? t("upcomingMeal")
            : t("currentMeal", { mealType: t(`mealTypes.${meal.mealType}`) })}
        </span>
      </div>
      <p className="mt-2 text-base font-bold text-[var(--dietista-text)]">
        {meal.name}
      </p>
      {meal.description && (
        <p className="mt-1 text-xs text-[var(--dietista-text-2)]">
          {meal.description}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--dietista-text-2)]">
        <span className="tnum font-semibold text-[var(--dietista-text)]">
          {Math.round(meal.calories)} kcal
        </span>
        <span>
          P: <span className="tnum font-medium text-[var(--dietista-text)]">{Math.round(meal.protein)}g</span>
        </span>
        <span>
          C: <span className="tnum font-medium text-[var(--dietista-text)]">{Math.round(meal.carbs)}g</span>
        </span>
        <span>
          G: <span className="tnum font-medium text-[var(--dietista-text)]">{Math.round(meal.fat)}g</span>
        </span>
      </div>
      <Link
        href="/planes"
        className="mt-3 inline-block rounded-lg border border-[var(--dietista-border)] px-3 py-1 text-xs font-medium text-[var(--dietista-text-2)] transition-colors hover:bg-[var(--dietista-surface-2)]"
      >
        {t("viewPlan")}
      </Link>
    </div>
  );
}
