import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  const targetDate = date ? new Date(date) : new Date();
  targetDate.setHours(0, 0, 0, 0);
  const nextDate = new Date(targetDate);
  nextDate.setDate(nextDate.getDate() + 1);

  const meals = await prisma.mealLog.findMany({
    where: {
      userId: session.userId,
      date: {
        gte: targetDate,
        lt: nextDate,
      },
    },
    orderBy: { createdAt: "asc" },
  });

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

  return NextResponse.json({
    date: targetDate.toISOString(),
    consumed,
    meals: meals.map((m) => ({
      id: m.id,
      mealType: m.mealType,
      rawInput: m.rawInput,
      totalCalories: m.totalCalories,
      createdAt: m.createdAt,
    })),
  });
}
