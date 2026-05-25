"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useShoppingLists } from "@/hooks/use-shopping-lists";
import type { ShoppingListSummary } from "@/types/dietista";

/* ---------- helpers ---------- */

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

/* ---------- skeleton ---------- */

function SkeletonCard(): React.ReactElement {
  return (
    <div className="animate-pulse rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-4">
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 rounded bg-[var(--dietista-surface-2)]" />
        <div className="h-5 w-16 rounded-full bg-[var(--dietista-surface-2)]" />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="h-3 w-20 rounded bg-[var(--dietista-surface-2)]" />
        <div className="h-3 w-14 rounded bg-[var(--dietista-surface-2)]" />
      </div>
    </div>
  );
}

/* ---------- component ---------- */

interface HistoryListProps {
  /** Optionally exclude a list (e.g. the same one shown in RecentListPreview). */
  excludeId?: string;
}

export function HistoryList({
  excludeId,
}: HistoryListProps): React.ReactElement {
  const t = useTranslations("Shopping");
  const { lists, isLoading, error, hasMore, loadMore } = useShoppingLists();

  /* ----- loading state ----- */
  if (isLoading && lists.length === 0) {
    return (
      <div className="mx-[var(--dietista-pad-card)] space-y-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  /* ----- error state ----- */
  if (error && lists.length === 0) {
    return (
      <div className="mx-[var(--dietista-pad-card)]">
        <div className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-danger-border)] bg-[var(--dietista-danger-bg)] p-6 text-center">
          <p className="text-sm font-medium text-[var(--dietista-danger)]">
            {t("history.error")}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 text-xs font-medium text-[var(--brand-600)]"
          >
            {t("retry")}
          </button>
        </div>
      </div>
    );
  }

  /* ----- filter & check empty ----- */
  const visible = excludeId
    ? lists.filter((l) => l.id !== excludeId)
    : lists;

  if (visible.length === 0 && !hasMore) {
    return (
      <div className="mx-[var(--dietista-pad-card)]">
        <div className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)] text-center">
          <p className="text-xs text-[var(--dietista-text-2)]">
            {t("history.empty")}
          </p>
        </div>
      </div>
    );
  }

  /* ----- list cards ----- */
  return (
    <div className="mx-[var(--dietista-pad-card)] space-y-3">
      {visible.map((list) => (
        <ListCard key={list.id} list={list} t={t} />
      ))}

      {/* skeleton rows while loading more (but first page already rendered) */}
      {isLoading && lists.length > 0 && (
        <>
          <SkeletonCard />
          <SkeletonCard />
        </>
      )}

      {/* load‑more / end-of-list */}
      {hasMore && !isLoading && (
        <button
          type="button"
          onClick={loadMore}
          className="w-full rounded-lg border border-[var(--dietista-border)] bg-[var(--dietista-surface)] py-3 text-sm font-semibold text-[var(--brand-600)] transition-colors hover:bg-[var(--dietista-surface-2)]"
        >
          {t("history.loadMore")}
        </button>
      )}
    </div>
  );
}

/* ---------- single list card ---------- */

interface ListCardProps {
  list: ShoppingListSummary;
  t: ReturnType<typeof useTranslations<"Shopping">>;
}

function ListCard({ list, t }: ListCardProps): React.ReactElement {
  return (
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
        {list.totalEstimate != null && (
          <span className="text-xs font-medium tnum text-[var(--dietista-text-2)]">
            ${list.totalEstimate.toFixed(2)}
          </span>
        )}
      </div>
    </Link>
  );
}
