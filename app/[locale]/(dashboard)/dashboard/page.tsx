import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { redirect } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { HeroMacroRing, StatCard, StreakWeek, Sparkline } from "@/components/dietista/atoms";

import type { Locale } from "@/i18n/routing";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.userId) {
    redirect({ href: "/login", locale: "es" as Locale });
  }

  const t = await getTranslations("Dashboard");
  const c = await getTranslations("Common");

  const profile = await prisma.profile.findUnique({
    where: { userId: session!.userId },
  });

  const activePlan = await prisma.mealPlan.findFirst({
    where: {
      userId: session!.userId,
      status: "active",
    },
    include: { meals: true },
    orderBy: { startDate: "desc" },
  });

  // Fetch today's meal logs for macro calculation
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayLogs = await prisma.mealLog.findMany({
    where: {
      userId: session!.userId,
      date: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  const consumed = todayLogs.reduce(
    (acc, log) => {
      const foods = (log.interpretedFoods as Array<{
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
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

  const targets = {
    calories: profile?.targetCalories ?? 2000,
    protein: profile?.targetProtein ?? 150,
    carbs: profile?.targetCarbs ?? 250,
    fat: profile?.targetFat ?? 65,
  };

  // Fetch last 7 days of weight for sparkline
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weightLogs = await prisma.weightLog.findMany({
    where: {
      userId: session!.userId,
      date: { gte: weekAgo },
    },
    orderBy: { date: "asc" },
    take: 7,
  });

  const weightTrend = weightLogs.map((w) => w.weight);

  // Calculate streak (consecutive days with meal logs)
  const streakDays = await calculateStreak(session!.userId);

  return (
    <div className="space-y-6 px-1 pb-4">
      {/* Greeting */}
      <div className="px-[18px] pt-4">
        <h1 className="m-0 text-[28px] font-bold leading-tight tracking-[-0.025em] text-[var(--dietista-text)]">
          {t("greeting")}, {session!.email?.split("@")[0] ?? "Usuario"}
        </h1>
        <p className="mt-1 text-sm font-medium text-[var(--dietista-text-2)]">
          {today.toLocaleDateString("es-ES", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      {/* Hero Macro Ring */}
      <div className="flex justify-center py-4">
        <HeroMacroRing
          value={consumed.calories}
          max={targets.calories}
          current={consumed.calories}
          label={c("calories")}
          subtitle={`${Math.round(targets.calories - consumed.calories)} ${c("remaining")}`}
          variant="minimal"
          size={160}
          strokeWidth={12}
        />
      </div>

      {/* Macro Bars */}
      <div className="space-y-3 px-[var(--dietista-pad-card)]">
        <MacroBarRow label={c("protein")} current={consumed.protein} target={targets.protein} color="var(--ring-pro)" bgColor="var(--ring-pro-bg)" />
        <MacroBarRow label={c("carbs")} current={consumed.carbs} target={targets.carbs} color="var(--ring-carb)" bgColor="var(--ring-carb-bg)" />
        <MacroBarRow label={c("fat")} current={consumed.fat} target={targets.fat} color="var(--ring-fat)" bgColor="var(--ring-fat-bg)" />
      </div>

      {/* Streak */}
      <div className="px-[var(--dietista-pad-card)]">
        <StreakWeek days={streakDays} label={t("weeklyStreak")} />
      </div>

      {/* Weight Sparkline */}
      {weightTrend.length >= 2 && (
        <div className="px-[var(--dietista-pad-card)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--dietista-text-2)]">
              {t("weightTrend")}
            </span>
            <span className="text-xs font-semibold text-[var(--dietista-text)] tnum">
              {weightTrend[weightTrend.length - 1]?.toFixed(1)} {c("kilograms")}
            </span>
          </div>
          <div className="mt-2">
            <Sparkline data={weightTrend} width={280} height={40} />
          </div>
        </div>
      )}

      {/* Active Plan Card */}
      <div className="px-[var(--dietista-pad-card)]">
        {activePlan ? (
          <div className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--dietista-text-3)]">
                  {t("activePlan")}
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--dietista-text)]">
                  {t("weekOf")} {new Date(activePlan.startDate).toLocaleDateString("es-ES")}
                </p>
                <p className="text-xs text-[var(--dietista-text-2)]">
                  {activePlan.meals.length} {t("mealsPlanned")}
                </p>
              </div>
              <Link
                href="/planes"
                className="rounded-lg bg-[var(--brand-500)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--brand-600)]"
              >
                {t("viewPlan")}
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)]">
            <p className="text-sm font-semibold text-[var(--dietista-text)]">
              {t("noActivePlan")}
            </p>
            <p className="mt-1 text-xs text-[var(--dietista-text-2)]">
              {t("noPlanDescription")}
            </p>
            <Link
              href="/planes"
              className="mt-3 inline-block rounded-lg bg-[var(--brand-500)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--brand-600)]"
            >
              {t("createPlan")}
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 px-[var(--dietista-pad-card)]">
        <Link
          href="/progreso"
          className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)] text-center transition-colors hover:border-[var(--brand-300)]"
        >
          <span className="text-2xl">📊</span>
          <p className="mt-1 text-xs font-semibold text-[var(--dietista-text)]">{t("progress")}</p>
        </Link>
        <Link
          href="/objetivos"
          className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)] text-center transition-colors hover:border-[var(--brand-300)]"
        >
          <span className="text-2xl">🎯</span>
          <p className="mt-1 text-xs font-semibold text-[var(--dietista-text)]">{t("goals")}</p>
        </Link>
      </div>
    </div>
  );
}

function MacroBarRow({
  label,
  current,
  target,
  color,
  bgColor,
}: {
  label: string;
  current: number;
  target: number;
  color: string;
  bgColor: string;
}) {
  const percentage = Math.min((current / target) * 100, 100);
  const isOver = current > target;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--dietista-text-2)]">{label}</span>
        <span
          className={`text-xs font-semibold tnum ${isOver ? "text-[var(--dietista-danger)]" : "text-[var(--dietista-text)]"}`}
        >
          {Math.round(current)}g / {Math.round(target)}g
        </span>
      </div>
      <div
        className="h-2 w-full rounded-full"
        style={{ backgroundColor: bgColor }}
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-label={`${label}: ${current}g of ${target}g`}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            backgroundColor: isOver ? "var(--dietista-danger)" : color,
          }}
        />
      </div>
    </div>
  );
}

async function calculateStreak(userId: string): Promise<boolean[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days: boolean[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const count = await prisma.mealLog.count({
      where: {
        userId,
        date: {
          gte: date,
          lt: nextDate,
        },
      },
    });
    days.push(count > 0);
  }
  return days;
}
