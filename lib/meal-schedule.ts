import type { MealType } from "@prisma/client";

const MEAL_SCHEDULE: { mealType: MealType; start: number; end: number }[] = [
  { mealType: "breakfast", start: 6, end: 10 },
  { mealType: "mid_morning", start: 10, end: 12 },
  { mealType: "lunch", start: 12, end: 15 },
  { mealType: "snack", start: 15, end: 19 },
  { mealType: "dinner", start: 19, end: 23 },
];

const MEAL_TYPE_ORDER: MealType[] = [
  "breakfast",
  "mid_morning",
  "lunch",
  "snack",
  "dinner",
];

export function getMealTypeForHour(hour: number): MealType | null {
  return (
    MEAL_SCHEDULE.find((slot) => hour >= slot.start && hour < slot.end)
      ?.mealType ?? null
  );
}

interface MealRow {
  id: string;
  mealPlanId: string;
  dayOfWeek: number;
  mealType: MealType;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  selectedOptions: unknown;
  translations: unknown;
}

export function getCurrentMealInfo(
  meals: MealRow[],
  now: Date = new Date()
): (MealRow & { isUpcoming?: boolean }) | null {
  const today = now.getDay();
  const dayOfWeek = today === 0 ? 6 : today - 1; // Monday=0
  const currentHour = now.getHours();

  const todayMeals = meals.filter((m) => m.dayOfWeek === dayOfWeek);

  if (todayMeals.length === 0) return null;

  const currentType = getMealTypeForHour(currentHour);

  if (currentType) {
    const match = todayMeals.find((m) => m.mealType === currentType);
    if (match) return match;
  }

  const currentTypeIndex = currentType
    ? MEAL_TYPE_ORDER.indexOf(currentType)
    : -1;

  const upcoming = MEAL_TYPE_ORDER.find(
    (type) =>
      MEAL_TYPE_ORDER.indexOf(type) > currentTypeIndex &&
      todayMeals.some((m) => m.mealType === type)
  );

  if (upcoming) {
    const meal = todayMeals.find((m) => m.mealType === upcoming)!;
    return { ...meal, isUpcoming: true };
  }

  return null;
}
