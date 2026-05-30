import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { PlanCard } from "@/components/dietista/planes/plan-card";
import { WorkoutPlanCard } from "@/components/dietista/gym-plans/workout-plan-card";
import { listWorkoutPlans } from "@/lib/workout-plan-service";
import { getNutritionPlansAction } from "@/actions/nutrition-plan";

export default async function PlanesPage() {
  const session = await auth();
  if (!session?.userId) {
    redirect("/login");
  }

  const t = await getTranslations("PlansPage");
  const tGym = await getTranslations("GymPlans");
  const tNutrition = await getTranslations("NutritionPlans");

  const [activePlan, pastPlans, workoutPlans, nutritionPlansResult] = await Promise.all([
    prisma.mealPlan.findFirst({
      where: {
        userId: session.userId,
        status: "active",
      },
      include: { meals: true },
      orderBy: { startDate: "desc" },
    }),
    prisma.mealPlan.findMany({
      where: {
        userId: session.userId,
        status: { in: ["completed", "draft"] },
      },
      orderBy: { startDate: "desc" },
      take: 5,
    }),
    listWorkoutPlans(session.userId),
    getNutritionPlansAction(),
  ]);

  const nutritionPlansCount = nutritionPlansResult.success
    ? (nutritionPlansResult.data?.length ?? 0)
    : 0;

  const activeWorkoutPlan = workoutPlans.find((p) => p.status === "active");
  const pastWorkoutPlans = workoutPlans.filter((p) => p.status !== "active").slice(0, 5);

  return (
    <div className="space-y-6 px-1 pb-4">
      {/* Header */}
      <div className="px-[18px] pt-4">
        <h1 className="m-0 text-[28px] font-bold leading-tight tracking-[-0.025em] text-[var(--dietista-text)]">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm font-medium text-[var(--dietista-text-2)]">
          {t("subtitle")}
        </p>
      </div>

      {/* Active Plan Hero */}
      {activePlan && (
        <div className="mx-[var(--dietista-pad-card)]">
          <div className="rounded-[var(--dietista-r-lg)] border border-[var(--brand-200)] bg-[var(--brand-50)] p-[var(--dietista-pad-card)]">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--brand-700)]">
              {t("activePlan")}
            </p>
            {/* Inline rename for active hero plan */}
            <div className="mt-1">
              <PlanCard plan={activePlan} isActive={true} />
            </div>
            <p className="mt-1 text-sm text-[var(--brand-600)]">
              {activePlan.meals.length} {t("meals")} · {Math.round(activePlan.totalCalories ?? 0)} {t("kcalPerDay")}
            </p>
            <Link
              href={`/meal-plans/${activePlan.id}`}
              className="mt-3 inline-block rounded-lg bg-[var(--brand-500)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-600)]"
            >
              {t("viewFullPlan")}
            </Link>
          </div>
        </div>
      )}

      {/* Create New Plan */}
      <div className="mx-[var(--dietista-pad-card)]">
        <Link
          href="/meal-plans/new"
          className="flex items-center justify-center rounded-[var(--dietista-r-lg)] border-2 border-dashed border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-6 transition-colors hover:border-[var(--brand-300)]"
        >
          <div className="text-center">
            <span className="text-2xl">+</span>
            <p className="mt-2 text-sm font-semibold text-[var(--dietista-text)]">
              {t("createNewPlan")}
            </p>
          </div>
        </Link>
      </div>

      {/* Past Plans */}
      {pastPlans.length > 0 && (
        <div className="mx-[var(--dietista-pad-card)]">
          <h2 className="mb-3 text-sm font-semibold text-[var(--dietista-text)]">
            {t("pastPlans")}
          </h2>
          <div className="space-y-2">
            {pastPlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} isActive={false} />
            ))}
          </div>
        </div>
      )}

      {/* ── Workout Plans Section ── */}
      <div className="mx-[var(--dietista-pad-card)] border-t border-[var(--dietista-border)] pt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-[var(--dietista-text)]">
            {tGym("sectionTitle")}
          </h2>
          <Link
            href="/gym-plans/new"
            className="rounded-[var(--dietista-r-md)] bg-[var(--brand-500)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--brand-600)]"
          >
            + {tGym("newPlan")}
          </Link>
        </div>

        {/* Active workout plan */}
        {activeWorkoutPlan && (
          <div className="mb-3 rounded-[var(--dietista-r-lg)] border border-[var(--brand-200)] bg-[var(--brand-50)] p-[var(--dietista-pad-card)]">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--brand-700)]">
              {tGym("activePlan")}
            </p>
            <div className="mt-2">
              <WorkoutPlanCard plan={activeWorkoutPlan} isActive />
            </div>
          </div>
        )}

        {/* Past workout plans */}
        {pastWorkoutPlans.length > 0 && (
          <div className="space-y-2">
            {pastWorkoutPlans.map((plan) => (
              <WorkoutPlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        )}

        {/* Empty workout state */}
        {workoutPlans.length === 0 && (
          <div className="rounded-[var(--dietista-r-lg)] border border-dashed border-[var(--dietista-border)] bg-[var(--dietista-bg)] p-6 text-center">
            <p className="text-sm text-[var(--dietista-text-3)]">
              {tGym("noPlan")}
            </p>
            <Link
              href="/gym-plans/new"
              className="mt-3 inline-block rounded-[var(--dietista-r-md)] bg-[var(--brand-500)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-600)]"
            >
              {tGym("newPlan")}
            </Link>
          </div>
        )}
      </div>

      {/* ── Nutrition Plans Section ── */}
      <div className="mx-[var(--dietista-pad-card)] border-t border-[var(--dietista-border)] pt-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold text-[var(--dietista-text)]">
              {tNutrition("sectionTitle")}
            </h2>
            <p className="mt-0.5 text-xs text-[var(--dietista-text-3)]">
              {tNutrition("sectionDescription")}
            </p>
          </div>
          <Link
            href="/nutrition-plans"
            className="flex-shrink-0 rounded-[var(--dietista-r-md)] bg-[var(--brand-500)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--brand-600)]"
          >
            {nutritionPlansCount > 0 ? `Ver (${nutritionPlansCount})` : tNutrition("newPlan")}
          </Link>
        </div>

        {nutritionPlansCount === 0 ? (
          <div className="rounded-[var(--dietista-r-lg)] border border-dashed border-[var(--dietista-border)] bg-[var(--dietista-bg)] p-6 text-center">
            <p className="text-sm text-[var(--dietista-text-3)]">
              {tNutrition("noPlan")}
            </p>
            <Link
              href="/nutrition-plans/new"
              className="mt-3 inline-block rounded-[var(--dietista-r-md)] bg-[var(--brand-500)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-600)]"
            >
              {tNutrition("createFirst")}
            </Link>
          </div>
        ) : (
          <Link
            href="/nutrition-plans"
            className="flex items-center justify-between rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] px-4 py-3 transition-colors hover:border-[var(--brand-300)] hover:bg-[var(--brand-50)]"
          >
            <p className="text-sm font-medium text-[var(--dietista-text)]">
              {nutritionPlansCount}{" "}
              {nutritionPlansCount === 1 ? "plan nutricional" : "planes nutricionales"}
            </p>
            <span className="text-xs text-[var(--brand-500)]">Ver todos →</span>
          </Link>
        )}
      </div>
    </div>
  );
}
