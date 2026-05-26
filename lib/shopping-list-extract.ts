import type { Ingredient } from "@/types/meal-plan";

/**
 * Merge ingredients from multiple meals into a deduplicated list.
 * Same name + unit → sum quantities. Different units → separate entries.
 */
export function mergeIngredients(
  meals: Array<{ dayOfWeek: number; ingredients?: Array<{ name: string; quantity?: number; unit?: string }> }>,
): Ingredient[] {
  const ingredientMap = new Map<string, Ingredient>();

  for (const meal of meals) {
    const ingredients = meal.ingredients ?? [];
    for (const ing of ingredients) {
      const key = `${ing.name.toLowerCase()}|${ing.unit ?? ""}`;
      const existing = ingredientMap.get(key);
      if (existing) {
        existing.quantity = (existing.quantity ?? 0) + (ing.quantity ?? 0);
      } else {
        ingredientMap.set(key, {
          name: ing.name,
          quantity: ing.quantity ?? 0,
          unit: ing.unit,
        });
      }
    }
  }

  return Array.from(ingredientMap.values());
}
