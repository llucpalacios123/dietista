import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { MealPlanView, type MealPlanData, type MealData } from "@/components/meal-plans/meal-plan-view";
import type { Ingredient } from "@/types/meal-plan";

// ─── Page Component ───────────────────────────────────────────────────────

export default async function MealPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.userId) redirect("/login");

  const { id } = await params;

  const plan = await prisma.mealPlan.findUnique({
    where: { id, userId: session.userId },
    include: {
      meals: {
        orderBy: [{ dayOfWeek: "asc" }, { mealType: "asc" }],
      },
    },
  });

  if (!plan) notFound();

  // Map Prisma JSON fields to strongly-typed Ingredient[] for MealPlanView
  const mealPlanData: MealPlanData = {
    id: plan.id,
    startDate: plan.startDate,
    endDate: plan.endDate,
    status: plan.status,
    totalCalories: plan.totalCalories,
    aiModel: plan.aiModel,
    meals: plan.meals.map((meal): MealData => ({
      id: meal.id,
      dayOfWeek: meal.dayOfWeek,
      mealType: meal.mealType,
      name: meal.name,
      description: meal.description,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      ingredients: meal.ingredients as unknown as Ingredient[],
      instructions: meal.instructions ?? "",
    })),
  };

  return <MealPlanView plan={mealPlanData} />;
}
