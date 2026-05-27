"use client";

import { useState, useTransition, useRef } from "react";
import { useTranslations } from "next-intl";
import { activatePlan, renamePlan } from "@/actions/meal-plan";

// ─── Types ────────────────────────────────────────────────────────────────

type PlanStatus = "draft" | "active" | "completed";

interface PlanCardPlan {
  id: string;
  startDate: Date;
  endDate: Date;
  name: string | null;
  status: PlanStatus;
  totalCalories: number | null;
}

export interface PlanCardProps {
  plan: PlanCardPlan;
  isActive: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatDateRange(startDate: Date, endDate: Date): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const start = new Date(startDate).toLocaleDateString("es-ES", opts);
  const end = new Date(endDate).toLocaleDateString("es-ES", opts);
  return `${start} – ${end}`;
}

// ─── PlanCard ─────────────────────────────────────────────────────────────

export function PlanCard({ plan, isActive }: PlanCardProps) {
  const t = useTranslations("PlansPage");

  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(plan.name ?? "");
  const [displayName, setDisplayName] = useState<string | null>(plan.name);

  const [isPendingActivate, startActivateTransition] = useTransition();
  const [isPendingRename, startRenameTransition] = useTransition();

  const inputRef = useRef<HTMLInputElement>(null);

  const label = displayName ?? formatDateRange(plan.startDate, plan.endDate);

  function handleLabelClick() {
    setDraftName(displayName ?? "");
    setIsEditing(true);
    // Focus the input on next tick after render
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function commitRename() {
    if (!isEditing) return;
    setIsEditing(false);
    const nameToSave = draftName;
    startRenameTransition(async () => {
      const result = await renamePlan(plan.id, nameToSave);
      if (result.success) {
        const trimmed = nameToSave.trim();
        setDisplayName(trimmed === "" ? null : trimmed);
      }
      // On error, displayName stays as before (server revalidation will fix it)
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      commitRename();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setDraftName(displayName ?? "");
    }
  }

  function handleActivate() {
    startActivateTransition(async () => {
      await activatePlan(plan.id);
    });
  }

  const isPending = isPendingActivate || isPendingRename;

  return (
    <div
      className="flex items-center justify-between rounded-[var(--dietista-r-md)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)]"
      style={{ opacity: isPending ? 0.7 : 1 }}
    >
      {/* Label / Inline rename */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={draftName}
            maxLength={60}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleKeyDown}
            disabled={isPending}
            placeholder={t("renamePlaceholder")}
            className="min-w-0 flex-1 rounded border border-[var(--dietista-border)] bg-[var(--dietista-bg)] px-2 py-1 text-sm text-[var(--dietista-text)] outline-none focus:border-[var(--brand-400)]"
          />
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <button
              type="button"
              onClick={handleLabelClick}
              disabled={isPending}
              className="min-w-0 truncate text-left text-sm font-medium text-[var(--dietista-text)] hover:text-[var(--brand-600)]"
            >
              {label}
            </button>
            {/* Pencil icon */}
            <button
              type="button"
              onClick={handleLabelClick}
              disabled={isPending}
              aria-label={t("renamePlaceholder")}
              className="flex-shrink-0 text-[var(--dietista-text-3)] hover:text-[var(--brand-500)]"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Status badge + Activate button */}
      <div className="ml-2 flex flex-shrink-0 items-center gap-2">
        <span className="text-xs text-[var(--dietista-text-2)]">
          {plan.status === "completed" ? t("completed") : plan.status === "draft" ? t("draft") : t("activePlan")}
        </span>

        {!isActive && (
          <button
            type="button"
            onClick={handleActivate}
            disabled={isPendingActivate}
            className="rounded-[var(--dietista-r-sm)] bg-[var(--brand-500)] px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-[var(--brand-600)] disabled:opacity-50"
          >
            {isPendingActivate ? t("activating") : t("activate")}
          </button>
        )}
      </div>
    </div>
  );
}
