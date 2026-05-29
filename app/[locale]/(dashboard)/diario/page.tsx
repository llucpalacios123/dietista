import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { DiaryDateNav } from "@/components/dietista/diary-date-nav";
import {
  formatDateLong,
  parseDateParam,
  isPastDate,
  getWeekBounds,
  dayOfWeekMondayFirst,
} from "@/lib/dates";
import { TodaysMeals } from "@/components/dietista/todays-meals";
import { filterAndSortMeals, mapToPlannedMeal } from "@/lib/planned-meal-mapper";
import { DiaryWorkoutWidget } from "@/components/dietista/gym-plans/diary-workout-widget";
import { getActiveWorkoutPlan } from "@/lib/workout-plan-service";

function parseWorkoutDayParam(raw: string | undefined, maxIndex: number): number {
  if (raw === undefined || raw === null) return 0;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) return 0;
  if (parsed < 0 || parsed > maxIndex) return 0;
  return parsed;
}

export default async function DiarioPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; workoutDay?: string }>;
}) {
  const session = await auth();
  if (!session?.userId) {
    redirect("/login");
  }

  const locale = await getLocale();
  const t = await getTranslations("Journal");

  // Parse date from searchParams — falls back to today if absent or invalid
  const params = await searchParams;
  const selectedDate = parseDateParam(params.date);

  const nextDay = new Date(selectedDate);
  nextDay.setDate(nextDay.getDate() + 1);

  // Read-only when selectedDate is in the past
  const isReadOnly = isPastDate(selectedDate);

  // Week bounds for DiaryDateNav and dataDays query
  const { start: weekStart, end: weekEnd } = getWeekBounds(selectedDate);

  // Parallel fetches: logs, profile, active meal plan, diary entries, week groupBy, active workout plan
  const [todayLogs, profile, activePlan, rawDiaryEntries, weekDiaryGroups, activeWorkoutPlan] =
    await Promise.all([
      prisma.mealLog.findMany({
        where: {
          userId: session.userId,
          date: { gte: selectedDate, lt: nextDay },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.profile.findUnique({
        where: { userId: session.userId },
      }),
      prisma.mealPlan.findFirst({
        where: { userId: session.userId, status: "active" },
        orderBy: { startDate: "desc" },
        include: { meals: true },
      }),
      prisma.diaryEntry.findMany({
        where: {
          userId: session.userId,
          date: { gte: selectedDate, lt: nextDay },
        },
      }),
      prisma.diaryEntry.groupBy({
        by: ["date"],
        where: {
          userId: session.userId,
          date: { gte: weekStart, lt: weekEnd },
        },
      }),
      getActiveWorkoutPlan(session.userId),
    ]);

  const targets = {
    calories: profile?.targetCalories ?? 2000,
    protein: profile?.targetProtein ?? 150,
    carbs: profile?.targetCarbs ?? 250,
    fat: profile?.targetFat ?? 65,
  };

  // Build diaryByType map: mealType -> entry snapshot
  type DiaryEntryData = {
    completed: boolean;
    actualCalories: number | null;
    actualProtein: number | null;
    actualCarbs: number | null;
    actualFat: number | null;
    aiSuggestion: unknown;
  };

  const diaryByType: Record<string, DiaryEntryData> = {};
  for (const entry of rawDiaryEntries) {
    diaryByType[entry.mealType] = {
      completed: entry.completed,
      actualCalories: entry.actualCalories,
      actualProtein: entry.actualProtein,
      actualCarbs: entry.actualCarbs,
      actualFat: entry.actualFat,
      aiSuggestion: entry.aiSuggestion,
    };
  }

  // Build dataDays boolean[7] from groupBy result (Monday=0)
  const activeDates = new Set(
    weekDiaryGroups.map((g) => {
      const d = new Date(g.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );
  const dataDays: boolean[] = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    return activeDates.has(day.getTime());
  });

  // Consumed macros from MealLog (interpreted foods) — existing behavior
  const mealLogConsumed = todayLogs.reduce(
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

  // Additive: also include completed DiaryEntry actual macros (per design decision)
  const diaryConsumed = rawDiaryEntries
    .filter((e) => e.completed)
    .reduce(
      (acc, e) => ({
        calories: acc.calories + (e.actualCalories ?? 0),
        protein: acc.protein + (e.actualProtein ?? 0),
        carbs: acc.carbs + (e.actualCarbs ?? 0),
        fat: acc.fat + (e.actualFat ?? 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

  const consumed = {
    calories: mealLogConsumed.calories + diaryConsumed.calories,
    protein: mealLogConsumed.protein + diaryConsumed.protein,
    carbs: mealLogConsumed.carbs + diaryConsumed.carbs,
    fat: mealLogConsumed.fat + diaryConsumed.fat,
  };

  const dayLabels = t.raw("dayLabels") as unknown as string[];
  const selectedDayIndex = dayOfWeekMondayFirst(selectedDate);

  const mealTypeLabels = t.raw("mealTypes") as unknown as Record<string, string>;

  const hasActivePlan = activePlan !== null;
  const todayMeals = filterAndSortMeals(
    activePlan?.meals ?? [],
    selectedDayIndex
  ).map(mapToPlannedMeal);

  return (
    <div className="space-y-4 px-1 pb-4">
      {/* Header */}
      <div className="px-[18px] pt-4">
        <h1 className="m-0 text-[28px] font-bold leading-tight tracking-[-0.025em] text-[var(--dietista-text)]">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm font-medium text-[var(--dietista-text-2)]">
          {formatDateLong(selectedDate, locale)}
        </p>
      </div>

      {/* Day Strip with week navigation */}
      <DiaryDateNav
        selectedDate={selectedDate}
        dayLabels={dayLabels}
        dataDays={dataDays}
      />

      {/* Today's Planned Meals */}
      <TodaysMeals
        meals={todayMeals}
        hasActivePlan={hasActivePlan}
        diaryByType={diaryByType}
        dateISO={selectedDate.toISOString()}
        targets={targets}
        isReadOnly={isReadOnly}
      />

      {/* Macro Summary */}
      <div className="flex justify-center gap-6 py-4">
        <MacroRingSmall label={t("calories")} value={consumed.calories} max={targets.calories} color="var(--ring-cal)" bgColor="var(--ring-cal-bg)" />
        <MacroRingSmall label={t("protein")} value={consumed.protein} max={targets.protein} color="var(--ring-pro)" bgColor="var(--ring-pro-bg)" />
        <MacroRingSmall label={t("carbs")} value={consumed.carbs} max={targets.carbs} color="var(--ring-carb)" bgColor="var(--ring-carb-bg)" />
        <MacroRingSmall label={t("fat")} value={consumed.fat} max={targets.fat} color="var(--ring-fat)" bgColor="var(--ring-fat-bg)" />
      </div>

      {/* Workout Widget */}
      <div className="px-[var(--dietista-pad-card)]">
        <DiaryWorkoutWidget
          plan={activeWorkoutPlan}
          selectedDayIndex={parseWorkoutDayParam(
            params.workoutDay,
            activeWorkoutPlan
              ? Math.max(0, (activeWorkoutPlan.content as unknown as { days?: unknown[] })?.days?.length ?? 1) - 1
              : 0
          )}
          selectedDate={selectedDate.toISOString()}
        />
      </div>

      {/* Meal Timeline */}
      <div className="space-y-3 px-[var(--dietista-pad-card)]">
        <h2 className="text-sm font-semibold text-[var(--dietista-text)]">
          {t("mealsToday")}
        </h2>
        {todayLogs.length === 0 ? (
          <div className="rounded-[var(--dietista-r-lg)] border border-dashed border-[var(--dietista-border)] p-8 text-center">
            <p className="text-sm text-[var(--dietista-text-3)]">
              {t("noMealsToday")}
            </p>
            <p className="mt-1 text-xs text-[var(--dietista-text-3)]">
              {t("noMealsTodayHint")}
            </p>
          </div>
        ) : (
          todayLogs.map((log) => (
            <MealLogEntry key={log.id} log={log} mealTypeLabels={mealTypeLabels} />
          ))
        )}
      </div>
    </div>
  );
}

function MacroRingSmall({
  label,
  value,
  max,
  color,
  bgColor,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  bgColor: string;
}) {
  const size = 64;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(value / max, 1);
  const offset = circumference * (1 - percentage);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-[var(--dietista-text)] font-semibold tnum"
          style={{ fontSize: "12px" }}
        >
          {Math.round(value)}
        </text>
      </svg>
      <span className="text-[10px] font-medium text-[var(--dietista-text-2)]">
        {label}
      </span>
    </div>
  );
}

function MealLogEntry({
  log,
  mealTypeLabels,
}: {
  log: {
    id: string;
    mealType: string;
    rawInput: string;
    totalCalories: number | null;
    date: Date;
  };
  mealTypeLabels: Record<string, string>;
}) {
  return (
    <div className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--dietista-text)]">
            {mealTypeLabels[log.mealType] ?? log.mealType}
          </p>
          <p className="mt-1 text-xs text-[var(--dietista-text-2)]">
            {log.rawInput}
          </p>
        </div>
        {log.totalCalories && (
          <span className="text-sm font-semibold text-[var(--dietista-text)] tnum">
            {Math.round(log.totalCalories)} kcal
          </span>
        )}
      </div>
    </div>
  );
}
