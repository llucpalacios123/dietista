"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { generateNutritionPlanAction } from "@/actions/nutrition-plan";

// ─── Page Component ───────────────────────────────────────────────────────────

export default function NutritionPlansNewPage(): React.ReactElement {
  const t = useTranslations("NutritionPlans");
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setError(null);
    setLoading(true);

    try {
      const result = await generateNutritionPlanAction();

      if (!result.success || !result.data) {
        setError(result.error ?? t("errorGenerating"));
        setLoading(false);
        return;
      }

      router.push(`/nutrition-plans/${result.data.id}`);
    } catch {
      setError(t("errorGenerating"));
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 px-1 pb-4">
      {/* Header */}
      <div className="px-[18px] pt-4">
        <h1 className="m-0 text-[28px] font-bold leading-tight tracking-[-0.025em] text-[var(--dietista-text)]">
          {t("generatePlan")}
        </h1>
        <p className="mt-1 text-sm font-medium text-[var(--dietista-text-2)]">
          {t("subtitle")}
        </p>
      </div>

      {/* Content */}
      <div className="mx-[var(--dietista-pad-card)]">
        {/* Info card */}
        <div className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-6">
          <p className="text-sm text-[var(--dietista-text-2)]">
            La IA analizará tu perfil (objetivo, nivel de actividad, alergias y restricciones) y generará una estructura nutricional personalizada con:
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-[var(--dietista-text-2)]">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-[var(--brand-500)]">·</span>
              <span>Objetivos calóricos y de macros diarios</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-[var(--brand-500)]">·</span>
              <span>Distribución de macros por tipo de comida</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-[var(--brand-500)]">·</span>
              <span>Alimentos recomendados por grupo</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-[var(--brand-500)]">·</span>
              <span>Frecuencias semanales recomendadas</span>
            </li>
          </ul>
          <p className="mt-4 text-xs text-[var(--dietista-text-3)]">
            Una vez generado el plan nutricional, podrás generar dietas semanales completas desde él.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-[var(--dietista-r-md)] border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-6">
          {loading ? (
            <div className="flex flex-col items-center gap-3 rounded-[var(--dietista-r-lg)] border border-[var(--brand-200)] bg-[var(--brand-50)] p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--brand-500)] border-t-transparent" />
              <p className="text-sm font-medium text-[var(--brand-700)]">
                {t("generatingPlan")}
              </p>
              <p className="text-xs text-[var(--brand-600)]">
                Esto puede tardar unos segundos…
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGenerate}
              className="w-full rounded-[var(--dietista-r-lg)] bg-[var(--brand-500)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-600)]"
            >
              {t("generatePlan")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
