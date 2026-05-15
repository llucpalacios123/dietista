"use server";

import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { mealLogSchema } from "@/lib/schemas";
import { interpretMeal } from "@/lib/openai";
import { revalidatePath } from "next/cache";

// ─── Types ────────────────────────────────────────────────────────────────

export interface MealLogActionResult {
  success: boolean;
  error?: string;
  data?: { id: string };
}

// ─── Server Actions ───────────────────────────────────────────────────────

export async function createMealLog(
  _prevState: MealLogActionResult | null,
  formData: FormData
): Promise<MealLogActionResult> {
  const session = await auth();
  if (!session?.userId) {
    return { success: false, error: "You must be logged in to log a meal" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = mealLogSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(", "),
    };
  }

  const { date, mealType, rawInput } = parsed.data;

  // Call OpenAI to interpret the free-text input
  let interpretedFoods;
  try {
    interpretedFoods = await interpretMeal(rawInput);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to interpret meal",
    };
  }

  // Calculate total calories from interpreted foods
  const totalCalories = interpretedFoods.reduce(
    (sum, food) => sum + food.calories,
    0
  );

  // Serialize interpreted foods as JSON for storage
  const interpretedFoodsJson = interpretedFoods.map((food) => ({
    foodName: food.foodName,
    quantity: food.quantity,
    unit: food.unit,
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
    confidence: food.confidence,
  }));

  await prisma.mealLog.create({
    data: {
      userId: session.userId,
      date: new Date(date),
      mealType,
      rawInput,
      interpretedFoods: interpretedFoodsJson,
      totalCalories,
    },
  });

  revalidatePath("/meal-logs");

  return { success: true, data: { id: "" } };
}
