import { auth } from "@/lib/auth-config";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { listWorkoutPlans } from "@/lib/workout-plan-service";
import { WorkoutPlanList } from "@/components/dietista/gym-plans/workout-plan-list";

// ─── Page Component ───────────────────────────────────────────────────────────

export default async function GymPlansPage(): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.userId) {
    redirect("/login");
  }

  const t = await getTranslations("GymPlans");
  const plans = await listWorkoutPlans(session.userId);

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
          href="/gym-plans/new"
          className="mt-1 rounded-[var(--dietista-r-md)] bg-[var(--brand-500)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-600)]"
        >
          + {t("newPlan")}
        </Link>
      </div>

      {/* Plan list */}
      <div className="mx-[var(--dietista-pad-card)]">
        <WorkoutPlanList plans={plans} />
      </div>
    </div>
  );
}
