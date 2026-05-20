import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { WeightChart, MacroStackChart, AdherenceHeatMap } from "@/components/dietista/charts";

export default async function ProgresoPage() {
  const session = await auth();
  if (!session?.userId) {
    redirect("/login");
  }

  // Fetch weight data for chart
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const weightLogs = await prisma.weightLog.findMany({
    where: {
      userId: session.userId,
      date: { gte: thirtyDaysAgo },
    },
    orderBy: { date: "asc" },
  });

  const weightChartData = weightLogs.map((w) => ({
    date: w.date.toISOString().split("T")[0],
    weight: w.weight,
  }));

  // Fetch progress snapshots for macros chart
  const snapshots = await prisma.progressSnapshot.findMany({
    where: {
      userId: session.userId,
      date: { gte: thirtyDaysAgo },
    },
    orderBy: { date: "asc" },
    take: 7,
  });

  const macroChartData = snapshots.map((s) => ({
    day: new Date(s.date).toLocaleDateString("es-AR", { weekday: "short" }),
    protein: s.totalProtein ?? 0,
    carbs: s.totalCarbs ?? 0,
    fat: s.totalFat ?? 0,
  }));

  // Fetch adherence data
  const adherenceData = snapshots
    .filter((s) => s.adherenceScore !== null)
    .map((s) => ({
      date: s.date.toISOString().split("T")[0],
      score: s.adherenceScore ?? 0,
    }));

  const profile = await prisma.profile.findUnique({
    where: { userId: session.userId },
  });

  return (
    <div className="space-y-6 px-1 pb-4">
      {/* Header */}
      <div className="px-[18px] pt-4">
        <h1 className="m-0 text-[28px] font-bold leading-tight tracking-[-0.025em] text-[var(--dietista-text)]">
          Progreso
        </h1>
        <p className="mt-1 text-sm font-medium text-[var(--dietista-text-2)]">
          Seguimiento de tu evolución
        </p>
      </div>

      {/* Weight Chart */}
      <div className="px-[var(--dietista-pad-card)]">
        <div className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)]">
          <h2 className="mb-4 text-sm font-semibold text-[var(--dietista-text)]">
            Peso
          </h2>
          <WeightChart
            data={weightChartData}
            goalWeight={profile?.weight ? profile.weight - 5 : undefined}
            height={200}
          />
        </div>
      </div>

      {/* Macros Chart */}
      <div className="px-[var(--dietista-pad-card)]">
        <div className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)]">
          <h2 className="mb-4 text-sm font-semibold text-[var(--dietista-text)]">
            Macros semanales
          </h2>
          <MacroStackChart data={macroChartData} height={200} />
        </div>
      </div>

      {/* Adherence Heatmap */}
      <div className="px-[var(--dietista-pad-card)]">
        <div className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)]">
          <h2 className="mb-4 text-sm font-semibold text-[var(--dietista-text)]">
            Adherencia
          </h2>
          <AdherenceHeatMap data={adherenceData} weeks={4} />
        </div>
      </div>
    </div>
  );
}
