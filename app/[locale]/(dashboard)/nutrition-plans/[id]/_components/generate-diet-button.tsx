"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { NutritionPlanActionResult } from "@/actions/nutrition-plan";

// ─── Props ────────────────────────────────────────────────────────────────────

interface GenerateDietButtonProps {
  nutritionPlanId: string;
  generateAction: (
    nutritionPlanId: string
  ) => Promise<NutritionPlanActionResult<{ mealPlanId: string }>>;
  label: string;
  loadingLabel: string;
  errorLabel: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GenerateDietButton({
  nutritionPlanId,
  generateAction,
  label,
  loadingLabel,
  errorLabel,
}: GenerateDietButtonProps): React.ReactElement {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setError(null);
    setLoading(true);

    try {
      const result = await generateAction(nutritionPlanId);

      if (!result.success || !result.data) {
        setError(result.error ?? errorLabel);
        setLoading(false);
        return;
      }

      router.push(`/meal-plans/${result.data.mealPlanId}`);
    } catch {
      setError(errorLabel);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {error && (
        <div className="rounded-[var(--dietista-r-md)] border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {loading ? (
        <div className="flex items-center justify-center gap-3 rounded-[var(--dietista-r-lg)] border border-[var(--brand-200)] bg-[var(--brand-50)] p-5">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--brand-500)] border-t-transparent" />
          <p className="text-sm font-medium text-[var(--brand-700)]">
            {loadingLabel}
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleGenerate}
          className="w-full rounded-[var(--dietista-r-lg)] bg-[var(--brand-500)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-600)]"
        >
          {label}
        </button>
      )}
    </div>
  );
}
