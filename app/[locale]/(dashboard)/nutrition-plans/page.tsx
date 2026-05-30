import { auth } from "@/lib/auth-config";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { getNutritionPlansAction } from "@/actions/nutrition-plan";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default async function NutritionPlansPage(): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.userId) {
    redirect("/login");
  }

  const t = await getTranslations("NutritionPlans");

  const result = await getNutritionPlansAction();
  const plans = result.success ? (result.data ?? []) : [];

  return (
    <div className="space-y-6 px-1 pb-4">
      {/* Header */}
      <div className="px-[18px] pt-4 flex items-start justify-between">
        <div>
          <h1 className="m-0 text-[28px] font-bold leading-tight tracking-[-0.025em] text-[var(--dietista-text)]">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm font-medium text-[var(--dietista-text-2)]">
            {t("subtitle")}
          </p>
        </div>
        <Link
          href="/nutrition-plans/new"
          className="mt-1 rounded-[var(--dietista-r-md)] bg-[var(--brand-500)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-600)]"
        >
          + {t("newPlan")}
        </Link>
      </div>

      {/* Plan list or empty state */}
      <div className="mx-[var(--dietista-pad-card)]">
        {plans.length === 0 ? (
          <div className="rounded-[var(--dietista-r-lg)] border border-dashed border-[var(--dietista-border)] bg-[var(--dietista-bg)] p-8 text-center">
            <p className="text-sm font-medium text-[var(--dietista-text)]">
              {t("noPlan")}
            </p>
            <p className="mt-1 text-xs text-[var(--dietista-text-3)]">
              {t("noPlanHint")}
            </p>
            <Link
              href="/nutrition-plans/new"
              className="mt-4 inline-block rounded-[var(--dietista-r-md)] bg-[var(--brand-500)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-600)]"
            >
              {t("createFirst")}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {plans.map((plan) => {
              const targets = plan.dailyTargets as {
                calories: number;
                protein: number;
                carbs: number;
                fat: number;
              };

              return (
                <Link
                  key={plan.id}
                  href={`/nutrition-plans/${plan.id}`}
                  className="block rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-4 transition-colors hover:border-[var(--brand-300)] hover:bg-[var(--brand-50)]"
                >
                  {/* Date + diet count */}
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-[var(--dietista-text-3)]">
                      {t("createdAt")} {formatDate(plan.createdAt)}
                    </p>
                    {plan._count.diets > 0 && (
                      <span className="flex-shrink-0 rounded-full bg-[var(--brand-100)] px-2 py-0.5 text-xs font-medium text-[var(--brand-700)]">
                        {plan._count.diets}{" "}
                        {plan._count.diets === 1 ? "dieta" : "dietas"}
                      </span>
                    )}
                  </div>

                  {/* Calorie target */}
                  {targets && (
                    <p className="mt-1 text-lg font-bold text-[var(--dietista-text)]">
                      {Math.round(targets.calories)} {t("kcalPerDay")}
                    </p>
                  )}

                  {/* Macro targets */}
                  {targets && (
                    <div className="mt-2 flex gap-4">
                      <span className="text-xs text-[var(--dietista-text-2)]">
                        <span className="font-semibold">{Math.round(targets.protein)}g</span>{" "}
                        {t("protein")}
                      </span>
                      <span className="text-xs text-[var(--dietista-text-2)]">
                        <span className="font-semibold">{Math.round(targets.carbs)}g</span>{" "}
                        {t("carbs")}
                      </span>
                      <span className="text-xs text-[var(--dietista-text-2)]">
                        <span className="font-semibold">{Math.round(targets.fat)}g</span>{" "}
                        {t("fat")}
                      </span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
