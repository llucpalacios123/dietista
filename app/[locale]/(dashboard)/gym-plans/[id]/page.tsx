import { auth } from "@/lib/auth-config";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { getWorkoutPlanById } from "@/lib/workout-plan-service";
import { WorkoutDayView } from "@/components/dietista/gym-plans/workout-day-view";
import { workoutPlanContentSchema } from "@/lib/schemas";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_LABELS_ES = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

// ─── Page Component ───────────────────────────────────────────────────────────

export default async function GymPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.userId) redirect("/login");

  const { id } = await params;

  const plan = await getWorkoutPlanById(session.userId, id);
  if (!plan) notFound();

  const t = await getTranslations("GymPlans");

  // Parse and validate content
  const contentParsed = workoutPlanContentSchema.safeParse(plan.content);
  if (!contentParsed.success) {
    // Content is malformed — show error state
    return (
      <div className="px-[18px] pt-4">
        <p className="text-sm text-red-600">{t("contentError")}</p>
      </div>
    );
  }

  const content = contentParsed.data;
  const trainingDays = content.days.filter((d) => !d.isRestDay);

  const goalLabel = t(`goals.${plan.goal}` as `goals.${string}`);
  const levelLabel = t(`levels.${plan.level}` as `levels.${string}`);
  const statusLabel = t(`status.${plan.status}` as `status.${string}`);

  return (
    <div className="space-y-6 px-1 pb-4">
      {/* Header */}
      <div className="px-[18px] pt-4">
        {/* Breadcrumb */}
        <Link
          href="/gym-plans"
          className="text-xs font-medium text-[var(--brand-500)] hover:underline"
        >
          ← {t("title")}
        </Link>

        {/* Plan name + status */}
        <div className="mt-2 flex items-start justify-between gap-3">
          <h1 className="m-0 text-[24px] font-bold leading-tight tracking-[-0.025em] text-[var(--dietista-text)]">
            {plan.name}
          </h1>
          <span
            className={`mt-1 flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
              plan.status === "active"
                ? "bg-[var(--brand-100)] text-[var(--brand-700)]"
                : plan.status === "completed"
                ? "bg-gray-100 text-gray-600"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {statusLabel}
          </span>
        </div>

        {/* Meta */}
        <p className="mt-1 text-sm text-[var(--dietista-text-2)]">
          {goalLabel} · {levelLabel} · {plan.daysPerWeek} {t("daysPerWeek")}
        </p>

        {/* Weekly notes */}
        {content.weeklyVolumeNotes && (
          <p className="mt-2 text-xs italic text-[var(--dietista-text-3)]">
            {content.weeklyVolumeNotes}
          </p>
        )}

        {/* Stats */}
        <div className="mt-3 flex gap-4">
          <div className="text-center">
            <p className="text-xl font-bold text-[var(--dietista-text)]">
              {trainingDays.length}
            </p>
            <p className="text-xs text-[var(--dietista-text-2)]">
              {t("trainingDays")}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-[var(--dietista-text)]">
              {trainingDays.reduce((acc, d) => acc + d.exercises.length, 0)}
            </p>
            <p className="text-xs text-[var(--dietista-text-2)]">
              {t("totalExercises")}
            </p>
          </div>
        </div>
      </div>

      {/* Days */}
      <div className="mx-[var(--dietista-pad-card)] space-y-4">
        <h2 className="text-sm font-semibold text-[var(--dietista-text)]">
          {t("weeklyPlan")}
        </h2>
        {content.days.map((day, idx) => (
          <WorkoutDayView
            key={idx}
            day={day}
            dayLabel={DAY_LABELS_ES[day.dayOfWeek]}
          />
        ))}
      </div>

      {/* CTA */}
      <div className="mx-[var(--dietista-pad-card)]">
        <Link
          href="/gimnasio"
          className="flex items-center justify-center rounded-[var(--dietista-r-lg)] bg-[var(--brand-500)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-600)]"
        >
          {t("startWorkout")}
        </Link>
      </div>
    </div>
  );
}
