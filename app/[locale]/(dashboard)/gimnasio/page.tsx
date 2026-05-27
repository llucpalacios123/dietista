import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { WorkoutLogger, type SerializedWorkoutSet } from "@/components/dietista/gimnasio/workout-logger";
import { SessionHistory, type SerializedSession } from "@/components/dietista/gimnasio/session-history";

export default async function GimnasioPage() {
  const session = await auth();
  if (!session?.userId) {
    redirect("/login");
  }

  const t = await getTranslations("Gym");

  // UTC midnight boundaries for today
  const now = new Date();
  const startOfToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

  const [todaySession, recentSessions] = await Promise.all([
    prisma.workoutSession.findFirst({
      where: {
        userId: session.userId,
        date: { gte: startOfToday, lt: startOfTomorrow },
      },
      include: {
        sets: { orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.workoutSession.findMany({
      where: {
        userId: session.userId,
        date: { lt: startOfToday },
      },
      include: {
        sets: { orderBy: { setNumber: "asc" } },
      },
      orderBy: { date: "desc" },
      take: 7,
    }),
  ]);

  // Serialize today's sets (Date → ISO string, Decimal → number)
  const todaySets: SerializedWorkoutSet[] = todaySession
    ? todaySession.sets.map((s) => ({
        id: s.id,
        exerciseName: s.exerciseName,
        muscleGroup: s.muscleGroup,
        setNumber: s.setNumber,
        reps: s.reps ?? null,
        plannedReps: s.plannedReps ?? null,
        plannedWeightKg: s.plannedWeightKg ? Number(s.plannedWeightKg) : null,
        weightKg: s.weightKg ?? null,
        createdAt: s.createdAt.toISOString(),
      }))
    : [];

  // Serialize recent sessions
  const serializedSessions: SerializedSession[] = recentSessions.map((ws) => ({
    id: ws.id,
    date: ws.date.toISOString(),
    sets: ws.sets.map((s) => ({
      id: s.id,
      exerciseName: s.exerciseName,
      muscleGroup: s.muscleGroup,
      setNumber: s.setNumber,
      reps: s.reps ?? null,
      plannedReps: s.plannedReps ?? null,
      plannedWeightKg: s.plannedWeightKg ? Number(s.plannedWeightKg) : null,
      weightKg: s.weightKg ?? null,
    })),
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

      {/* Today's workout logger */}
      <div className="px-[var(--dietista-pad-card)]">
        <WorkoutLogger
          todaySets={todaySets}
          sessionId={todaySession?.id ?? null}
        />
      </div>

      {/* Session history */}
      <div className="px-[var(--dietista-pad-card)]">
        <SessionHistory sessions={serializedSessions} />
      </div>
    </div>
  );
}
