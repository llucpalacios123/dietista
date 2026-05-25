"use client";

import { useTranslations } from "next-intl";

interface BudgetBarProps {
  budget: number;
  totalEstimate: number;
}

export function BudgetBar({ budget, totalEstimate }: BudgetBarProps): React.ReactElement {
  const t = useTranslations("Shopping");
  const percentage = Math.min((totalEstimate / budget) * 100, 100);
  const isOver = totalEstimate > budget;

  return (
    <div className="rounded-[var(--dietista-r-md)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--dietista-text-2)]">{t("budget")}</span>
        <span
          className={`text-sm font-semibold tnum ${
            isOver ? "text-[var(--dietista-danger)]" : "text-[var(--dietista-text)]"
          }`}
        >
          ${totalEstimate.toFixed(2)} / ${budget.toFixed(2)}
        </span>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-[var(--dietista-surface-2)]">
        <div
          className={`h-full rounded-full transition-all ${
            isOver ? "bg-[var(--dietista-danger)]" : "bg-[var(--brand-500)]"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isOver && (
        <p className="mt-1 text-xs font-medium text-[var(--dietista-danger)]">
          +${(totalEstimate - budget).toFixed(2)} {t("overBudget")}
        </p>
      )}
    </div>
  );
}
