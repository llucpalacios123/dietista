"use client";

import { useTranslations } from "next-intl";

/* ---------- status options ---------- */

type ListStatus = "draft" | "reviewed" | "purchased";

const STATUSES: ListStatus[] = ["draft", "reviewed", "purchased"];

const statusKey: Record<ListStatus, string> = {
  draft: "status.draft",
  reviewed: "status.reviewed",
  purchased: "status.purchased",
};

/* ---------- props ---------- */

interface StatusSelectorProps {
  currentStatus: ListStatus;
  onStatusChange: (status: ListStatus) => void;
  disabled?: boolean;
}

/* ---------- component ---------- */

export function StatusSelector({
  currentStatus,
  onStatusChange,
  disabled = false,
}: StatusSelectorProps): React.ReactElement {
  const t = useTranslations("Shopping");

  return (
    <div className="inline-flex rounded-lg border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-0.5">
      {STATUSES.map((status) => {
        const isActive = status === currentStatus;
        return (
          <button
            key={status}
            type="button"
            disabled={disabled || isActive}
            onClick={() => onStatusChange(status)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              isActive
                ? "bg-[var(--brand-500)] text-white"
                : "text-[var(--dietista-text-2)] hover:bg-[var(--dietista-surface-2)] hover:text-[var(--dietista-text)]"
            } disabled:cursor-not-allowed`}
          >
            {t(statusKey[status])}
          </button>
        );
      })}
    </div>
  );
}
