"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export interface WeightEntry {
  id: string;
  date: string; // ISO string
  weight: number;
  notes?: string | null;
}

interface WeightHistoryListProps {
  entries: WeightEntry[];
}

export function WeightHistoryList({
  entries,
}: WeightHistoryListProps): React.ReactElement {
  const router = useRouter();
  const t = useTranslations("Progress");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError(null);

    try {
      const res = await fetch(`/api/progress/${id}`, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Error al eliminar");
        return;
      }

      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setDeletingId(null);
    }
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)]">
        <p className="text-sm text-[var(--dietista-text-3)]">{t("noEntries")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)]">
      <h2 className="mb-4 text-sm font-semibold text-[var(--dietista-text)]">
        {t("historyTitle")}
      </h2>

      {error && (
        <p className="mb-3 rounded-md bg-red-50 p-2 text-xs text-red-600 dark:bg-red-950/30">
          {error}
        </p>
      )}

      <ul className="space-y-2">
        {entries.map((entry) => {
          const formattedDate = new Date(entry.date).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            timeZone: "UTC",
          });

          return (
            <li
              key={entry.id}
              className="flex items-center justify-between gap-2 rounded-[var(--dietista-r-md)] border border-[var(--dietista-border)] px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-[var(--dietista-text)]">
                    {entry.weight.toFixed(1)} kg
                  </span>
                  <span className="text-xs text-[var(--dietista-text-3)]">
                    {formattedDate}
                  </span>
                </div>
                {entry.notes && (
                  <p className="mt-0.5 truncate text-xs text-[var(--dietista-text-2)]">
                    {entry.notes}
                  </p>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                disabled={deletingId === entry.id}
                onClick={() => handleDelete(entry.id)}
                className="shrink-0 text-xs text-[var(--dietista-text-3)] hover:text-red-500"
                aria-label={`${t("delete")} ${formattedDate}`}
              >
                {deletingId === entry.id ? "..." : t("delete")}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
