"use server";

import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { suggestMeal, type SuggestMealResponse } from "@/lib/openai";
import { selectModel } from "@/lib/llm-router";
import { toggleMealCompletedSchema, suggestMealSchema, saveSuggestedMealSchema } from "@/lib/schemas";
import { isPastDate } from "@/lib/dates";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAILY_AI_CAP = 5;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeDateToMidnight(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─── toggleMealCompleted ──────────────────────────────────────────────────────

export interface ToggleMealCompletedResult {
  success: boolean;
  completed?: boolean;
  error?: "unauthenticated" | "invalid_input" | "past_date" | "server_error";
}

export async function toggleMealCompleted(
  input: unknown
): Promise<ToggleMealCompletedResult> {
  const session = await auth();
  if (!session?.userId) {
    return { success: false, error: "unauthenticated" };
  }

  const parsed = toggleMealCompletedSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "invalid_input" };
  }

  if (isPastDate(parsed.data.date)) {
    return { success: false, error: "past_date" };
  }

  const { date, mealType, mealId, macros } = parsed.data;
  const userId = session.userId;
  const normalizedDate = normalizeDateToMidnight(date);
  const tomorrow = new Date(normalizedDate);
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    // Check if there is an existing entry to determine toggle direction
    const existing = await prisma.diaryEntry.findFirst({
      where: { userId, date: normalizedDate, mealType: mealType as any },
    });

    const isToggleOff = existing?.completed === true;

    let actualCalories: number | null = null;
    let actualProtein: number | null = null;
    let actualCarbs: number | null = null;
    let actualFat: number | null = null;

    if (!isToggleOff) {
      // Toggle ON — resolve macros from mealId or provided macros
      if (mealId) {
        const meal = await prisma.meal.findFirst({
          where: { id: mealId },
        });
        if (meal) {
          actualCalories = meal.calories;
          actualProtein = meal.protein;
          actualCarbs = meal.carbs;
          actualFat = meal.fat;
        }
      } else if (macros) {
        actualCalories = macros.calories;
        actualProtein = macros.protein;
        actualCarbs = macros.carbs;
        actualFat = macros.fat;
      }
    }

    const entry = await prisma.diaryEntry.upsert({
      where: {
        userId_date_mealType: {
          userId,
          date: normalizedDate,
          mealType: mealType as any,
        },
      },
      create: {
        userId,
        date: normalizedDate,
        mealType: mealType as any,
        mealId: mealId ?? null,
        completed: !isToggleOff,
        actualCalories,
        actualProtein,
        actualCarbs,
        actualFat,
      },
      update: {
        completed: !isToggleOff,
        actualCalories,
        actualProtein,
        actualCarbs,
        actualFat,
      },
    });

    revalidatePath("/diario");
    return { success: true, completed: entry.completed };
  } catch {
    return { success: false, error: "server_error" };
  }
}

// ─── getSuggestion ────────────────────────────────────────────────────────────

export interface GetSuggestionResult {
  success: boolean;
  result?: SuggestMealResponse;
  error?: string;
}

export async function getSuggestion(
  input: unknown
): Promise<GetSuggestionResult> {
  const session = await auth();
  if (!session?.userId) {
    return { success: false, error: "unauthenticated" };
  }

  const parsed = suggestMealSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "invalid_input" };
  }

  const { date, mealType, query, history } = parsed.data;
  const userId = session.userId;
  const normalizedDate = normalizeDateToMidnight(date);
  const tomorrow = new Date(normalizedDate);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Server-side turn guard: prevent runaway history (defensive cost cap)
  if (history && history.length >= 20) {
    return { success: false, error: "turn_limit_exceeded" };
  }

  // Compute consumed macros from completed DiaryEntries today
  const completedEntries = await prisma.diaryEntry.findMany({
    where: {
      userId,
      completed: true,
      date: { gte: normalizedDate, lt: tomorrow },
    },
  });

  const consumed = completedEntries.reduce(
    (acc, e) => ({
      cal: acc.cal + (e.actualCalories ?? 0),
      pro: acc.pro + (e.actualProtein ?? 0),
      carb: acc.carb + (e.actualCarbs ?? 0),
      fat: acc.fat + (e.actualFat ?? 0),
    }),
    { cal: 0, pro: 0, carb: 0, fat: 0 }
  );

  // Get profile targets for remaining budget
  const profile = await prisma.profile.findUnique({ where: { userId } });
  const targets = {
    cal: profile?.targetCalories ?? 2000,
    pro: profile?.targetProtein ?? 150,
    carb: profile?.targetCarbs ?? 250,
    fat: profile?.targetFat ?? 65,
  };

  const remaining = {
    cal: Math.max(0, targets.cal - consumed.cal),
    pro: Math.max(0, targets.pro - consumed.pro),
    carb: Math.max(0, targets.carb - consumed.carb),
    fat: Math.max(0, targets.fat - consumed.fat),
  };

  const allergies = profile?.allergies ?? [];

  try {
    const model = selectModel({
      feature: "chat",
      profile: { allergies },
      chatHistoryLength: history?.length ?? 0,
    });
    const aiResult = await suggestMeal({ mealType, query, history, remaining, allergies, model });
    return { success: true, result: aiResult };
  } catch {
    return { success: false, error: "ai_parse_error" };
  }
}

// ─── saveSuggestedMeal ────────────────────────────────────────────────────────

export interface SaveSuggestedMealResult {
  success: boolean;
  error?: "unauthenticated" | "invalid_input" | "past_date" | "rate_limit_exceeded" | "server_error";
}

export async function saveSuggestedMeal(
  input: unknown
): Promise<SaveSuggestedMealResult> {
  const session = await auth();
  if (!session?.userId) {
    return { success: false, error: "unauthenticated" };
  }

  const parsed = saveSuggestedMealSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "invalid_input" };
  }

  if (isPastDate(parsed.data.date)) {
    return { success: false, error: "past_date" };
  }

  const { date, mealType, mealId, suggestion } = parsed.data;
  const userId = session.userId;
  const normalizedDate = normalizeDateToMidnight(date);
  const tomorrow = new Date(normalizedDate);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Rate limit guard: 5 accepted AI meals per user per calendar day
  // For a Json? field, use { not: Prisma.AnyNull } to filter out NULL rows
  const aiCount = await prisma.diaryEntry.count({
    where: {
      userId,
      aiSuggestion: { not: Prisma.AnyNull },
      updatedAt: { gte: normalizedDate, lt: tomorrow },
    },
  });

  if (aiCount >= DAILY_AI_CAP) {
    return { success: false, error: "rate_limit_exceeded" };
  }

  // Store the full suggestion as a JSON object
  const aiSuggestionJson = suggestion as unknown as Prisma.InputJsonValue;

  // Shared DiaryEntry upsert args
  const diaryUpsertArgs = {
    where: {
      userId_date_mealType: {
        userId,
        date: normalizedDate,
        mealType: mealType as any,
      },
    },
    create: {
      userId,
      date: normalizedDate,
      mealType: mealType as any,
      completed: true,
      actualCalories: suggestion.calories,
      actualProtein: suggestion.protein,
      actualCarbs: suggestion.carbs,
      actualFat: suggestion.fat,
      aiSuggestion: aiSuggestionJson,
    },
    update: {
      completed: true,
      actualCalories: suggestion.calories,
      actualProtein: suggestion.protein,
      actualCarbs: suggestion.carbs,
      actualFat: suggestion.fat,
      aiSuggestion: aiSuggestionJson,
    },
  };

  try {
    if (mealId) {
      // Ownership check: only update the meal if it belongs to this user
      const ownedMeal = await prisma.meal.findFirst({
        where: { id: mealId, mealPlan: { userId } },
      });

      if (ownedMeal) {
        // Update both meal plan and diary entry in a single transaction
        await prisma.$transaction([
          prisma.meal.update({
            where: { id: mealId },
            data: {
              name: suggestion.foodName,
              calories: suggestion.calories,
              protein: suggestion.protein,
              carbs: suggestion.carbs,
              fat: suggestion.fat,
              ...(suggestion.description !== undefined && { description: suggestion.description }),
              ...(suggestion.ingredients !== undefined && {
                ingredients: suggestion.ingredients as unknown as Prisma.InputJsonValue,
              }),
              ...(suggestion.instructions !== undefined && { instructions: suggestion.instructions }),
            },
          }),
          prisma.diaryEntry.upsert(diaryUpsertArgs),
        ]);
      } else {
        // mealId provided but doesn't belong to this user — only upsert diary
        await prisma.diaryEntry.upsert(diaryUpsertArgs);
      }
    } else {
      // Legacy path: no mealId — only upsert diary entry
      await prisma.diaryEntry.upsert(diaryUpsertArgs);
    }

    revalidatePath("/diario");
    return { success: true };
  } catch {
    return { success: false, error: "server_error" };
  }
}
