import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

export default async function ObjetivosPage() {
  const session = await auth();
  if (!session?.userId) {
    redirect("/login");
  }

  const t = await getTranslations("Goals");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.userId },
  });

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center px-4 pb-4 pt-20">
        <h1 className="text-[28px] font-bold text-[var(--dietista-text)]">{t("title")}</h1>
        <p className="mt-2 text-sm text-[var(--dietista-text-2)]">
          {t("completeProfileToSee")}
        </p>
        <a
          href="/perfil"
          className="mt-4 rounded-lg bg-[var(--brand-500)] px-4 py-2 text-sm font-semibold text-white"
        >
          {t("goToProfile")}
        </a>
      </div>
    );
  }

  // Calculate TDEE breakdown
  const tdee = calculateTDEE(profile);
  const targets = {
    calories: profile.targetCalories ?? tdee,
    protein: profile.targetProtein ?? calculateProtein(profile),
    carbs: profile.targetCarbs ?? calculateCarbs(profile),
    fat: profile.targetFat ?? calculateFat(profile),
  };

  const goalLabels = t.raw("goalLabels") as unknown as Record<string, string>;
  const activityLabels = t.raw("activityLabels") as unknown as Record<string, string>;

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

      {/* Goal Card */}
      <div className="mx-[var(--dietista-pad-card)]">
        <div className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)]">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--dietista-text-3)]">
            {t("goal")}
          </p>
          <p className="mt-1 text-xl font-bold text-[var(--brand-600)]">
            {goalLabels[profile.goal] ?? profile.goal}
          </p>
          <p className="mt-1 text-sm text-[var(--dietista-text-2)]">
            {activityLabels[profile.activityLevel] ?? profile.activityLevel} · {profile.age} años · {profile.weight} kg
          </p>
        </div>
      </div>

      {/* TDEE Breakdown */}
      <div className="mx-[var(--dietista-pad-card)]">
        <div className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)]">
          <h2 className="mb-3 text-sm font-semibold text-[var(--dietista-text)]">
            {t("tdeeBreakdown")}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[var(--dietista-text-3)]">{t("estimatedTDEE")}</p>
              <p className="text-lg font-bold text-[var(--dietista-text)] tnum">{Math.round(tdee)}</p>
              <p className="text-xs text-[var(--dietista-text-3)]">{t("kcalPerDay")}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--dietista-text-3)]">{t("caloricTarget")}</p>
              <p className="text-lg font-bold text-[var(--brand-600)] tnum">{Math.round(targets.calories)}</p>
              <p className="text-xs text-[var(--dietista-text-3)]">{t("kcalPerDay")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Macro Targets */}
      <div className="mx-[var(--dietista-pad-card)]">
        <div className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)]">
          <h2 className="mb-3 text-sm font-semibold text-[var(--dietista-text)]">
            {t("dailyMacros")}
          </h2>
          <div className="space-y-3">
            <MacroTargetRow label={t("proteinLabel")} value={targets.protein} color="var(--ring-pro)" bgColor="var(--ring-pro-bg)" />
            <MacroTargetRow label={t("carbsLabel")} value={targets.carbs} color="var(--ring-carb)" bgColor="var(--ring-carb-bg)" />
            <MacroTargetRow label={t("fatLabel")} value={targets.fat} color="var(--ring-fat)" bgColor="var(--ring-fat-bg)" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MacroTargetRow({
  label,
  value,
  color,
  bgColor,
}: {
  label: string;
  value: number;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm font-medium text-[var(--dietista-text)]">{label}</span>
      </div>
      <span className="text-sm font-semibold text-[var(--dietista-text)] tnum">
        {Math.round(value)}g
      </span>
    </div>
  );
}

function calculateTDEE(profile: {
  weight: number;
  height: number;
  age: number;
  sex: string;
  activityLevel: string;
  goal: string;
}): number {
  // Mifflin-St Jeor equation
  let bmr: number;
  if (profile.sex === "female") {
    bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
  } else {
    bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
  }

  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryActive: 1.9,
  };

  const multiplier = activityMultipliers[profile.activityLevel] ?? 1.55;
  return bmr * multiplier;
}

function calculateProtein(profile: { weight: number; goal: string }): number {
  // 1.6-2.2g per kg bodyweight depending on goal
  const factor = profile.goal === "lose" ? 2.0 : profile.goal === "gain" ? 1.8 : 1.6;
  return profile.weight * factor;
}

function calculateCarbs(profile: { weight: number }): number {
  // ~3-5g per kg bodyweight
  return profile.weight * 4;
}

function calculateFat(profile: { weight: number }): number {
  // ~0.8-1.2g per kg bodyweight
  return profile.weight * 1;
}
