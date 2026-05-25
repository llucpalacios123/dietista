"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useShoppingList } from "@/hooks/use-shopping-list";
import type { ShoppingList } from "@/types/dietista";
import { BudgetBar } from "./BudgetBar";
import { ItemRow } from "./ItemRow";
import { StatusBadge } from "./StatusBadge";
import { StatusSelector } from "./StatusSelector";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

/* ---------- category labels ---------- */

const categoryLabels: Record<string, string> = {
  frutas_verduras: "categories.frutas_verduras",
  carnes: "categories.carnes",
  lacteos: "categories.lacteos",
  panaderia: "categories.panaderia",
  almacen: "categories.almacen",
  bebidas: "categories.bebidas",
  limpieza: "categories.limpieza",
  otros: "categories.otros",
};

/* ---------- component ---------- */

export function ShoppingDetail({
  list: initialList,
}: {
  list: ShoppingList;
}): React.ReactElement {
  const t = useTranslations("Shopping");
  const {
    data,
    isLoading,
    toggleItem,
    editItem,
    deleteItem,
    updateStatus,
    deleteList,
  } = useShoppingList(initialList.id);
  const list = data ?? initialList;

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Group items by category
  const grouped = list.items.reduce<Record<string, typeof list.items>>(
    (acc, item) => {
      const cat = item.category ?? "otros";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-5">
      {/* ── Status + meal plan link ── */}
      <div className="mx-[var(--dietista-pad-card)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--dietista-text-3)]">
            {t("statusLabel")}:
          </span>
          <StatusBadge status={list.status} />
        </div>

        <StatusSelector
          currentStatus={list.status}
          onStatusChange={(status) => void updateStatus(status)}
        />
      </div>

      {/* ── Meal plan link ── */}
      {list.mealPlanId && (
        <div className="mx-[var(--dietista-pad-card)]">
          <Link
            href={`/plans/${list.mealPlanId}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--dietista-border)] bg-[var(--dietista-surface)] px-3 py-2 text-xs font-medium text-[var(--brand-600)] transition-colors hover:bg-[var(--dietista-surface-2)]"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {t("viewMealPlan")}
          </Link>
        </div>
      )}

      {/* ── Budget bar ── */}
      {list.budget != null && (
        <div className="mx-[var(--dietista-pad-card)]">
          <BudgetBar
            budget={list.budget}
            totalEstimate={list.totalEstimate ?? 0}
          />
        </div>
      )}

      {/* ── Items grouped by category ── */}
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="mx-[var(--dietista-pad-card)]">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--dietista-text-3)]">
            {t(
              categoryLabels[category] as Parameters<typeof t>[0],
            ) ?? category}
          </h3>
          <div className="space-y-1">
            {items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                onToggle={() => void toggleItem(item.id)}
                onUpdate={editItem}
                onDelete={deleteItem}
              />
            ))}
          </div>
        </div>
      ))}

      {/* ── Empty state ── */}
      {list.items.length === 0 && (
        <div className="mx-[var(--dietista-pad-card)] rounded-[var(--dietista-r-lg)] border border-dashed border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-8 text-center">
          <p className="text-sm text-[var(--dietista-text-2)]">
            {t("noItems")}
          </p>
        </div>
      )}

      {/* ── Loading indicator ── */}
      {isLoading && (
        <p className="text-center text-xs text-[var(--dietista-text-3)]">
          {t("updating")}
        </p>
      )}

      {/* ── Delete list ── */}
      <div className="mx-[var(--dietista-pad-card)] border-t border-[var(--dietista-border)] pt-5">
        <button
          type="button"
          onClick={() => setShowDeleteDialog(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--dietista-danger-border)] bg-[var(--dietista-danger-bg)] px-4 py-2.5 text-sm font-semibold text-[var(--dietista-danger)] transition-colors hover:bg-[var(--dietista-danger)] hover:text-white"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          {t("deleteList")}
        </button>
      </div>

      {/* ── Delete confirmation dialog ── */}
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() => {
          void deleteList();
          setShowDeleteDialog(false);
        }}
        title={t("confirmDeleteList")}
        message={t("confirmDeleteListMessage")}
        confirmLabel={t("deleteList")}
        cancelLabel={t("cancel")}
      />
    </div>
  );
}
