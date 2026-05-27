import type { Ingredient } from "@/types/meal-plan";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlannedMeal {
  id: string;
  mealType: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: Ingredient[];
  instructions: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MEAL_TYPE_ORDER = [
  "breakfast",
  "mid_morning",
  "lunch",
  "snack",
  "dinner",
] as const;

// ─── Input shape (subset of Prisma Meal) ──────────────────────────────────────

interface RawMeal {
  id: string;
  dayOfWeek: number;
  mealType: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: unknown;
  instructions: string | null | undefined;
}

// ─── Pure mapping functions ───────────────────────────────────────────────────

/**
 * Maps a raw Prisma Meal record to a serializable PlannedMeal.
 * Pure function — no I/O.
 */
export function mapToPlannedMeal(meal: RawMeal): PlannedMeal {
  return {
    id: meal.id,
    mealType: meal.mealType,
    name: meal.name,
    description: meal.description,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    ingredients: Array.isArray(meal.ingredients)
      ? (meal.ingredients as Ingredient[])
      : [],
    instructions: meal.instructions ?? "",
  };
}

/**
 * Filters meals by dayOfWeek and sorts them by canonical meal-type order.
 * Pure function — no I/O.
 */
export function filterAndSortMeals(
  meals: RawMeal[],
  todayIndex: number
): RawMeal[] {
  return meals
    .filter((m) => m.dayOfWeek === todayIndex)
    .sort(
      (a, b) =>
        MEAL_TYPE_ORDER.indexOf(a.mealType as (typeof MEAL_TYPE_ORDER)[number]) -
        MEAL_TYPE_ORDER.indexOf(b.mealType as (typeof MEAL_TYPE_ORDER)[number])
    );
}
