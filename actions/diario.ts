"use server";

import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const mealLogSchema = z.object({
  mealType: z.enum(["breakfast", "mid_morning", "lunch", "dinner", "snack"]),
  rawInput: z.string().min(1, "El campo es requerido"),
  date: z.string().datetime().optional(),
});

export async function getDailyMacros(date: string): Promise<{
  consumed: { calories: number; protein: number; carbs: number; fat: number };
  targets: { calories: number; protein: number; carbs: number; fat: number };
  meals: Array<{
    id: string;
    mealType: string;
    rawInput: string;
    totalCalories: number | null;
    createdAt: Date;
  }>;
}> {
  const session = await auth();
  if (!session?.userId) {
    throw new Error("No autenticado");
  }

  const targetDate = date ? new Date(date) : new Date();
  targetDate.setHours(0, 0, 0, 0);
  const nextDate = new Date(targetDate);
  nextDate.setDate(nextDate.getDate() + 1);

  const [meals, profile] = await Promise.all([
    prisma.mealLog.findMany({
      where: {
        userId: session.userId,
        date: {
          gte: targetDate,
          lt: nextDate,
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.profile.findUnique({
      where: { userId: session.userId },
    }),
  ]);

  const consumed = meals.reduce(
    (acc, log) => {
      const foods = (log.interpretedFoods as Array<{
        calories?: number;
        protein?: number;
        carbs?: number;
        fat?: number;
      }>) ?? [];
      for (const food of foods) {
        acc.calories += food.calories ?? 0;
        acc.protein += food.protein ?? 0;
        acc.carbs += food.carbs ?? 0;
        acc.fat += food.fat ?? 0;
      }
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return {
    consumed,
    targets: {
      calories: profile?.targetCalories ?? 2000,
      protein: profile?.targetProtein ?? 150,
      carbs: profile?.targetCarbs ?? 250,
      fat: profile?.targetFat ?? 65,
    },
    meals: meals.map((m) => ({
      id: m.id,
      mealType: m.mealType,
      rawInput: m.rawInput,
      totalCalories: m.totalCalories,
      createdAt: m.createdAt,
    })),
  };
}

export async function getWeeklyMacros(startDate: string): Promise<{
  days: Array<{
    date: string;
    consumed: { calories: number; protein: number; carbs: number; fat: number };
  }>;
}> {
  const session = await auth();
  if (!session?.userId) {
    throw new Error("No autenticado");
  }

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const meals = await prisma.mealLog.findMany({
    where: {
      userId: session.userId,
      date: {
        gte: start,
        lt: end,
      },
    },
  });

  const dayMap = new Map<string, { calories: number; protein: number; carbs: number; fat: number }>();

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dayMap.set(d.toISOString().split("T")[0], { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }

  for (const meal of meals) {
    const key = meal.date.toISOString().split("T")[0];
    const existing = dayMap.get(key) ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const foods = (meal.interpretedFoods as Array<{
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
    }>) ?? [];
    for (const food of foods) {
      existing.calories += food.calories ?? 0;
      existing.protein += food.protein ?? 0;
      existing.carbs += food.carbs ?? 0;
      existing.fat += food.fat ?? 0;
    }
    dayMap.set(key, existing);
  }

  const days = Array.from(dayMap.entries()).map(([date, consumed]) => ({
    date,
    consumed,
  }));

  return { days };
}

export async function deleteMealLog(mealLogId: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.userId) {
    return { success: false, error: "No autenticado" };
  }

  try {
    const existing = await prisma.mealLog.findFirst({
      where: { id: mealLogId, userId: session.userId },
    });

    if (!existing) {
      return { success: false, error: "Registro no encontrado" };
    }

    await prisma.mealLog.delete({
      where: { id: mealLogId },
    });

    revalidatePath("/diario");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "Error al eliminar el registro" };
  }
}

export async function updateMealLog(
  mealLogId: string,
  data: { rawInput: string }
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.userId) {
    return { success: false, error: "No autenticado" };
  }

  try {
    const existing = await prisma.mealLog.findFirst({
      where: { id: mealLogId, userId: session.userId },
    });

    if (!existing) {
      return { success: false, error: "Registro no encontrado" };
    }

    await prisma.mealLog.update({
      where: { id: mealLogId },
      data: { rawInput: data.rawInput },
    });

    revalidatePath("/diario");
    return { success: true };
  } catch {
    return { success: false, error: "Error al actualizar el registro" };
  }
}
