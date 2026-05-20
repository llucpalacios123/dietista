import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");

  const startDate = start ? new Date(start) : new Date();
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);

  const meals = await prisma.mealLog.findMany({
    where: {
      userId: session.userId,
      date: {
        gte: startDate,
        lt: endDate,
      },
    },
  });

  const dayMap = new Map<string, { calories: number; protein: number; carbs: number; fat: number }>();

  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
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

  return NextResponse.json({ days });
}
