"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import type { ShoppingListSummary } from "@/types/dietista";

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const statusKey: Record<string, string> = {
  draft: "status.draft",
  reviewed: "status.reviewed",
  purchased: "status.purchased",
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  reviewed: "bg-blue-100 text-blue-700",
  purchased: "bg-green-100 text-green-700",
};

export function RecentListPreview({
  list,
}: {
  list: ShoppingListSummary | null;
}): React.ReactElement {
  const t = useTranslations("Shopping");
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const handleGenerateFromPlan = async (): Promise<void> => {
    setGenerating(true);
    setGenError(null);
    try {
      const { generateFromMealPlan } = await import(
        "@/actions/shopping-list"
      );
      const result = await generateFromMealPlan();
      if (result.success && result.listId) {
        if (result.isExisting) {
          setGenError(t("generateFromPlanConflict"));
        }
        router.push(`/compras/${result.listId}`);
      } else {
        setGenError(result.error ?? t("generateFromPlanError"));
      }
    } catch {
      setGenError(t("generateFromPlanError"));
    } finally {
      setGenerating(false);
    }
  };

  /* ---- Generate-from-plan button (shared between states) ---- */

  const generateButton = (
    <button
      type="button"
      onClick={handleGenerateFromPlan}
      disabled={generating}
      className="w-full rounded-lg border border-[var(--dietista-border)] bg-[var(--dietista-surface)] py-2.5 text-sm font-semibold text-[var(--brand-600)] transition-colors hover:bg-[var(--dietista-surface-2)] disabled:opacity-50"
    >
      {generating ? t("generating") : t("generateFromPlan")}
    </button>
  );

  /* ---- Empty state: no lists at all ---- */

  if (!list) {
    return (
      <div className="mx-[var(--dietista-pad-card)] space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--dietista-text-3)]">
          {t("recentList")}
        </h2>
        <div className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-5 text-center">
          <p className="mb-3 text-sm text-[var(--dietista-text-2)]">
            {t("noActivePlanHint")}
          </p>
          {generateButton}
          {genError && (
            <p className="mt-2 text-xs text-[var(--dietista-danger)]">
              {genError}
            </p>
          )}
        </div>
      </div>
    );
  }

  /* ---- Has a recent list: show it + generate option below ---- */

  return (
    <div className="mx-[var(--dietista-pad-card)] space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--dietista-text-3)]">
        {t("recentList")}
      </h2>
      <Link
        href={`/compras/${list.id}`}
        className="block rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-4 transition-colors hover:bg-[var(--dietista-surface-2)]"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--dietista-text)]">
            {formatDate(list.createdAt)}
          </span>
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[list.status] ?? statusColors.draft}`}
          >
            {t(statusKey[list.status] ?? statusKey.draft)}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-[var(--dietista-text-2)]">
            {t("itemsCount", { count: list.itemCount })}
          </span>
          <span className="text-xs font-medium text-[var(--brand-600)]">
            {t("viewList")}
          </span>
        </div>
      </Link>

      {generateButton}

      {genError && (
        <p className="text-xs text-[var(--dietista-danger)]">{genError}</p>
      )}
    </div>
  );
}
