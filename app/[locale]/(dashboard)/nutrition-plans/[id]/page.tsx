import { auth } from "@/lib/auth-config";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import {
  getNutritionPlanByIdAction,
  generateDietFromPlanAction,
} from "@/actions/nutrition-plan";
import { GenerateDietButton } from "./_components/generate-diet-button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DailyTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealMacros {
  protein: number;
  carbs: number;
  fat: number;
  calories?: number;
}

type MealDistribution = Record<string, MealMacros>;

interface RecommendedFoods {
  proteins: string[];
  carbohydrates: string[];
  vegetables: string[];
  fruits: string[];
  healthyFats: string[];
}

interface WeeklyFrequency {
  fishMeals?: number;
  legumeMeals?: number;
  redMeatMeals?: number;
  [key: string]: number | undefined;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default async function NutritionPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.userId) redirect("/login");

  const { id } = await params;

  const t = await getTranslations("NutritionPlans");

  const result = await getNutritionPlanByIdAction(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const plan = result.data;

  const dailyTargets = plan.dailyTargets as unknown as DailyTargets;
  const mealDistribution = plan.mealDistribution as unknown as MealDistribution;
  const recommendedFoods = plan.recommendedFoods as unknown as RecommendedFoods;
  const weeklyFrequency = plan.weeklyFrequency as unknown as WeeklyFrequency;

  const MEAL_TYPE_ORDER = [
    "breakfast",
    "mid_morning",
    "lunch",
    "dinner",
    "snack",
  ] as const;

  const FOOD_GROUPS = [
    "proteins",
    "carbohydrates",
    "vegetables",
    "fruits",
    "healthyFats",
  ] as const;

  const WEEKLY_FREQ_KEYS = ["fishMeals", "legumeMeals", "redMeatMeals"] as const;

  const mealDistributionEntries = MEAL_TYPE_ORDER.filter(
    (key) => mealDistribution[key]
  ).map((key) => ({ key, macros: mealDistribution[key] }));

  return (
    <div className="space-y-6 px-1 pb-4">
      {/* Header */}
      <div className="px-[18px] pt-4">
        <Link
          href="/nutrition-plans"
          className="text-xs font-medium text-[var(--brand-500)] hover:underline"
        >
          ← {t("title")}
        </Link>

        <div className="mt-2">
          <h1 className="m-0 text-[24px] font-bold leading-tight tracking-[-0.025em] text-[var(--dietista-text)]">
            {t("title")}
          </h1>
          <p className="mt-1 text-xs text-[var(--dietista-text-3)]">
            {t("createdAt")} {formatDate(plan.createdAt)}
            {plan.aiModel && (
              <span className="ml-2 rounded bg-[var(--dietista-surface-2)] px-1.5 py-0.5 font-mono text-[var(--dietista-text-3)]">
                {plan.aiModel}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Daily targets */}
      <div className="mx-[var(--dietista-pad-card)]">
        <h2 className="mb-3 text-sm font-semibold text-[var(--dietista-text)]">
          {t("dailyTargets")}
        </h2>
        <div className="rounded-[var(--dietista-r-lg)] border border-[var(--brand-200)] bg-[var(--brand-50)] p-4">
          <p className="text-2xl font-bold text-[var(--dietista-text)]">
            {Math.round(dailyTargets.calories)}{" "}
            <span className="text-base font-normal text-[var(--dietista-text-2)]">
              {t("kcalPerDay")}
            </span>
          </p>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="rounded-[var(--dietista-r-md)] bg-white/60 p-2.5 text-center">
              <p className="text-lg font-bold text-[var(--dietista-text)]">
                {Math.round(dailyTargets.protein)}g
              </p>
              <p className="text-xs text-[var(--dietista-text-2)]">
                {t("protein")}
              </p>
            </div>
            <div className="rounded-[var(--dietista-r-md)] bg-white/60 p-2.5 text-center">
              <p className="text-lg font-bold text-[var(--dietista-text)]">
                {Math.round(dailyTargets.carbs)}g
              </p>
              <p className="text-xs text-[var(--dietista-text-2)]">
                {t("carbs")}
              </p>
            </div>
            <div className="rounded-[var(--dietista-r-md)] bg-white/60 p-2.5 text-center">
              <p className="text-lg font-bold text-[var(--dietista-text)]">
                {Math.round(dailyTargets.fat)}g
              </p>
              <p className="text-xs text-[var(--dietista-text-2)]">
                {t("fat")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Meal distribution */}
      {mealDistributionEntries.length > 0 && (
        <div className="mx-[var(--dietista-pad-card)]">
          <h2 className="mb-3 text-sm font-semibold text-[var(--dietista-text)]">
            {t("mealDistribution")}
          </h2>
          <div className="space-y-2">
            {mealDistributionEntries.map(({ key, macros }) => {
              const mealLabel =
                t.raw(`mealTypes.${key}` as Parameters<typeof t.raw>[0]) ??
                key;
              return (
                <div
                  key={key}
                  className="rounded-[var(--dietista-r-md)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-[var(--dietista-text)]">
                      {String(mealLabel)}
                    </p>
                    {macros.calories != null && (
                      <p className="text-xs text-[var(--dietista-text-3)]">
                        {Math.round(macros.calories)} kcal
                      </p>
                    )}
                  </div>
                  <div className="mt-1.5 flex gap-4">
                    <span className="text-xs text-[var(--dietista-text-2)]">
                      <span className="font-medium">
                        {Math.round(macros.protein)}g
                      </span>{" "}
                      {t("protein")}
                    </span>
                    <span className="text-xs text-[var(--dietista-text-2)]">
                      <span className="font-medium">
                        {Math.round(macros.carbs)}g
                      </span>{" "}
                      {t("carbs")}
                    </span>
                    <span className="text-xs text-[var(--dietista-text-2)]">
                      <span className="font-medium">
                        {Math.round(macros.fat)}g
                      </span>{" "}
                      {t("fat")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommended foods */}
      {recommendedFoods && (
        <div className="mx-[var(--dietista-pad-card)]">
          <h2 className="mb-3 text-sm font-semibold text-[var(--dietista-text)]">
            {t("recommendedFoods")}
          </h2>
          <div className="space-y-3">
            {FOOD_GROUPS.map((group) => {
              const items = recommendedFoods[group] ?? [];
              if (items.length === 0) return null;
              const groupLabel =
                t.raw(`foodGroups.${group}` as Parameters<typeof t.raw>[0]) ??
                group;
              return (
                <div key={group}>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--dietista-text-3)]">
                    {String(groupLabel)}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-[var(--dietista-border)] bg-[var(--dietista-surface)] px-2.5 py-0.5 text-xs text-[var(--dietista-text-2)]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Weekly frequency */}
      {weeklyFrequency && (
        <div className="mx-[var(--dietista-pad-card)]">
          <h2 className="mb-3 text-sm font-semibold text-[var(--dietista-text)]">
            {t("weeklyFrequency")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {WEEKLY_FREQ_KEYS.filter(
              (key) => weeklyFrequency[key] != null
            ).map((key) => {
              const count = weeklyFrequency[key] as number;
              const label =
                t.raw(
                  `weeklyFrequencyItems.${key}` as Parameters<typeof t.raw>[0]
                ) ?? key;
              return (
                <div
                  key={key}
                  className="rounded-[var(--dietista-r-md)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] px-3 py-2 text-center"
                >
                  <p className="text-lg font-bold text-[var(--dietista-text)]">
                    {count}x
                  </p>
                  <p className="text-xs text-[var(--dietista-text-2)]">
                    {String(label)}/sem.
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Generate diet CTA */}
      <div className="mx-[var(--dietista-pad-card)]">
        <GenerateDietButton
          nutritionPlanId={plan.id}
          generateAction={generateDietFromPlanAction}
          label={t("generateDiet")}
          loadingLabel={t("generatingDiet")}
          errorLabel={t("errorGeneratingDiet")}
        />
      </div>

      {/* Generated diets list */}
      <div className="mx-[var(--dietista-pad-card)]">
        <h2 className="mb-3 text-sm font-semibold text-[var(--dietista-text)]">
          {t("generatedDiets")}
        </h2>
        {plan.diets.length === 0 ? (
          <p className="text-sm text-[var(--dietista-text-3)]">
            {t("noDiets")}
          </p>
        ) : (
          <div className="space-y-2">
            {plan.diets.map((diet) => (
              <Link
                key={diet.id}
                href={`/meal-plans/${diet.id}`}
                className="flex items-center justify-between rounded-[var(--dietista-r-md)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] px-4 py-3 transition-colors hover:border-[var(--brand-300)] hover:bg-[var(--brand-50)]"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--dietista-text)]">
                    {formatDate(diet.createdAt)}
                  </p>
                  {diet.totalCalories != null && (
                    <p className="text-xs text-[var(--dietista-text-3)]">
                      {Math.round(diet.totalCalories)} kcal
                    </p>
                  )}
                </div>
                <span
                  className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    diet.status === "active"
                      ? "bg-[var(--brand-100)] text-[var(--brand-700)]"
                      : diet.status === "completed"
                      ? "bg-gray-100 text-gray-600"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {t(`status.${diet.status}` as Parameters<typeof t>[0])}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
