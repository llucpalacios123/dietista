import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { WeightChart, MacroStackChart, AdherenceHeatMap } from "@/components/dietista/charts";
import { WeightEntryForm } from "@/components/dietista/weight-entry-form";
import { WeightHistoryList, type WeightEntry } from "@/components/dietista/weight-history-list";
import { computePlanBands } from "@/lib/weight-correlation";

export default async function ProgresoPage() {
  const session = await auth();
  if (!session?.userId) {
    redirect("/login");
  }

  const t = await getTranslations("Progress");

  // Fetch weight data and meal plans for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [weightLogs, mealPlans, snapshots, profile] = await Promise.all([
    prisma.weightLog.findMany({
      where: {
        userId: session.userId,
        date: { gte: thirtyDaysAgo },
      },
      orderBy: { date: "asc" },
    }),
    // Fetch meal plans overlapping the 30-day window, ordered by createdAt desc
    // (newest first so tie-break is deterministic in computePlanBands)
    prisma.mealPlan.findMany({
      where: {
        userId: session.userId,
        startDate: { lte: new Date() },
        endDate: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: "desc" },
      include: { template: true },
    }),
    prisma.progressSnapshot.findMany({
      where: {
        userId: session.userId,
        date: { gte: thirtyDaysAgo },
      },
      orderBy: { date: "asc" },
      take: 7,
    }),
    prisma.profile.findUnique({
      where: { userId: session.userId },
    }),
  ]);

  // Compute plan correlation bands (pure, server-side)
  const planBands = computePlanBands(
    weightLogs.map((w) => ({ date: w.date, weight: w.weight })),
    mealPlans.map((p) => ({
      id: p.id,
      startDate: p.startDate,
      endDate: p.endDate,
      createdAt: p.createdAt,
      template: p.template ? { name: p.template.name } : null,
    })),
  );

  const weightChartData = weightLogs.map((w) => ({
    date: w.date.toISOString().split("T")[0],
    weight: w.weight,
  }));

  // Serialize weight logs for the history list (plain objects, no Date)
  const historyEntries: WeightEntry[] = [...weightLogs]
    .reverse()
    .map((w) => ({
      id: w.id,
      date: w.date.toISOString(),
      weight: w.weight,
      notes: w.notes,
    }));

  const macroChartData = snapshots.map((s) => ({
    day: new Date(s.date).toLocaleDateString("es-ES", { weekday: "short" }),
    protein: s.totalProtein ?? 0,
    carbs: s.totalCarbs ?? 0,
    fat: s.totalFat ?? 0,
  }));

  const adherenceData = snapshots
    .filter((s) => s.adherenceScore !== null)
    .map((s) => ({
      date: s.date.toISOString().split("T")[0],
      score: s.adherenceScore ?? 0,
    }));

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

      {/* Weight Entry Form */}
      <div className="px-[var(--dietista-pad-card)]">
        <WeightEntryForm />
      </div>

      {/* Weight Chart */}
      <div className="px-[var(--dietista-pad-card)]">
        <div className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)]">
          <h2 className="mb-4 text-sm font-semibold text-[var(--dietista-text)]">
            {t("weight")}
          </h2>
          <WeightChart
            data={weightChartData}
            goalWeight={profile?.weight ? profile.weight - 5 : undefined}
            height={200}
            planBands={planBands}
          />
        </div>
      </div>

      {/* Weight History List */}
      <div className="px-[var(--dietista-pad-card)]">
        <WeightHistoryList entries={historyEntries} />
      </div>

      {/* Macros Chart */}
      <div className="px-[var(--dietista-pad-card)]">
        <div className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)]">
          <h2 className="mb-4 text-sm font-semibold text-[var(--dietista-text)]">
            {t("weeklyMacros")}
          </h2>
          <MacroStackChart data={macroChartData} height={200} />
        </div>
      </div>

      {/* Adherence Heatmap */}
      <div className="px-[var(--dietista-pad-card)]">
        <div className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)]">
          <h2 className="mb-4 text-sm font-semibold text-[var(--dietista-text)]">
            {t("adherence")}
          </h2>
          <AdherenceHeatMap data={adherenceData} weeks={4} />
        </div>
      </div>
    </div>
  );
}
