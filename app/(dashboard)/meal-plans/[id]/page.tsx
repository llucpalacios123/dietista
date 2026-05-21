import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { MealPlanView } from "@/components/meal-plans/meal-plan-view";

// ─── Page Component ───────────────────────────────────────────────────────

export default async function MealPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  return <MealPlanView plan={plan} />;
}
