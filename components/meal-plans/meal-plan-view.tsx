"use client";

import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCalories } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────

export interface MealData {
  id: string;
  dayOfWeek: number;
  mealType: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealPlanData {
  id: string;
  startDate: Date | string;
  endDate: Date | string;
  status: "draft" | "active" | "completed";
  totalCalories: number | null;
  meals: MealData[];
}

// ─── Constants ────────────────────────────────────────────────────────────

const MEAL_TYPE_ORDER = ["breakfast", "lunch", "dinner", "snack"] as const;

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
};

// ─── Component ────────────────────────────────────────────────────────────

export function MealPlanView({ plan }: { plan: MealPlanData }): React.ReactElement {
  const t = useTranslations("MealPlan");
  const tp = useTranslations("MealPlans");
  const locale = useLocale();

  const days = [
    t("days.monday"),
    t("days.tuesday"),
    t("days.wednesday"),
    t("days.thursday"),
    t("days.friday"),
    t("days.saturday"),
    t("days.sunday"),
  ];

  const mealTypeLabels: Record<string, string> = {
    breakfast: t("mealTypes.breakfast"),
    lunch: t("mealTypes.lunch"),
    dinner: t("mealTypes.dinner"),
    snack: t("mealTypes.snack"),
  };

  const statusLabels: Record<string, string> = {
    draft: t("status.draft"),
    active: t("status.active"),
    completed: t("status.completed"),
  };

  const mealsByDayAndType = new Map<string, MealData>();
  for (const meal of plan.meals) {
    mealsByDayAndType.set(`${meal.dayOfWeek}-${meal.mealType}`, meal);
  }

  // Calculate daily totals
  const dailyTotals = days.map((_, dayIndex) => {
    const dayMeals = plan.meals.filter((m) => m.dayOfWeek === dayIndex);
    return {
      calories: dayMeals.reduce((s, m) => s + m.calories, 0),
      protein: dayMeals.reduce((s, m) => s + m.protein, 0),
      carbs: dayMeals.reduce((s, m) => s + m.carbs, 0),
      fat: dayMeals.reduce((s, m) => s + m.fat, 0),
    };
  });

  // Weekly totals
  const weeklyTotals = dailyTotals.reduce(
    (acc, d) => ({
      calories: acc.calories + d.calories,
      protein: acc.protein + d.protein,
      carbs: acc.carbs + d.carbs,
      fat: acc.fat + d.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const startDate = new Date(plan.startDate);
  const endDate = new Date(plan.endDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t("weeklyMealPlan")}</h2>
          <p className="text-sm text-muted-foreground">
            {startDate.toLocaleDateString(locale, { month: "short", day: "numeric" })} —{" "}
            {endDate.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${STATUS_COLORS[plan.status]}`}
        >
          {statusLabels[plan.status]}
        </span>
      </div>

      {/* Weekly Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("weeklyTotals")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{formatCalories(weeklyTotals.calories)}</p>
              <p className="text-sm text-muted-foreground">{t("calories")}</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{Math.round(weeklyTotals.protein)}g</p>
              <p className="text-sm text-muted-foreground">{t("protein")}</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{Math.round(weeklyTotals.carbs)}g</p>
              <p className="text-sm text-muted-foreground">{t("carbs")}</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{Math.round(weeklyTotals.fat)}g</p>
              <p className="text-sm text-muted-foreground">{t("fat")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day Cards */}
      {days.map((dayName, dayIndex) => {
        const totals = dailyTotals[dayIndex];
        return (
          <Card key={dayName}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{dayName}</CardTitle>
                <span className="text-sm text-muted-foreground">
                  {formatCalories(totals.calories)} · {tp("abbrProtein")}{Math.round(totals.protein)}g {tp("abbrCarbs")}{Math.round(totals.carbs)}g {tp("abbrFat")}{Math.round(totals.fat)}g
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                {MEAL_TYPE_ORDER.map((type) => {
                  const meal = mealsByDayAndType.get(`${dayIndex}-${type}`);
                  return (
                    <div
                      key={type}
                      className="rounded-lg border p-3"
                    >
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {mealTypeLabels[type]}
                      </p>
                      {meal ? (
                        <div className="mt-1">
                          <p className="font-medium">{meal.name}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {meal.description}
                          </p>
                          <p className="text-xs mt-2 text-muted-foreground">
                            {Math.round(meal.calories)} kcal · {tp("abbrProtein")}{Math.round(meal.protein)}g {tp("abbrCarbs")}{Math.round(meal.carbs)}g {tp("abbrFat")}{Math.round(meal.fat)}g
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1 italic">
                          {t("noMealPlanned")}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
