"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface SetRow {
  setNumber: number;
  plannedReps: string;
  plannedWeightKg: string;
}

export interface SetPlannerProps {
  exerciseName: string;
  muscleGroup: string;
  sessionId: string;
  onPlanned: (sets: PlannedSet[]) => void;
  onCancel: () => void;
}

export interface PlannedSet {
  id: string;
  setNumber: number;
  plannedReps: number;
  plannedWeightKg: number | null;
}

function buildUniformSets(
  count: number,
  reps: string,
  weight: string,
): SetRow[] {
  return Array.from({ length: count }, (_, i) => ({
    setNumber: i + 1,
    plannedReps: reps,
    plannedWeightKg: weight,
  }));
}

function buildVariedSets(count: number, prev: SetRow[]): SetRow[] {
  return Array.from({ length: count }, (_, i) => ({
    setNumber: i + 1,
    plannedReps: prev[i]?.plannedReps ?? "",
    plannedWeightKg: prev[i]?.plannedWeightKg ?? "",
  }));
}

function isValidReps(val: string): boolean {
  const n = parseInt(val, 10);
  return !isNaN(n) && n >= 1;
}

export function SetPlanner({
  exerciseName,
  muscleGroup,
  sessionId,
  onPlanned,
  onCancel,
}: SetPlannerProps): React.ReactElement {
  const t = useTranslations("Gym");

  const [setCount, setSetCount] = useState(3);
  const [varied, setVaried] = useState(false);
  const [uniformReps, setUniformReps] = useState("");
  const [uniformWeight, setUniformWeight] = useState("");
  const [variedRows, setVariedRows] = useState<SetRow[]>(() =>
    buildVariedSets(3, []),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSetCountChange(val: string) {
    const n = Math.min(20, Math.max(1, parseInt(val, 10) || 1));
    setSetCount(n);
    if (varied) {
      setVariedRows((prev) => buildVariedSets(n, prev));
    }
  }

  function handleVariedToggle() {
    const next = !varied;
    setVaried(next);
    if (next) {
      setVariedRows(buildUniformSets(setCount, uniformReps, uniformWeight));
    }
  }

  function updateVariedRow(index: number, field: keyof SetRow, value: string) {
    setVariedRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  }

  function isFormValid(): boolean {
    if (setCount < 1 || setCount > 20) return false;
    if (varied) {
      return variedRows.every((row) => isValidReps(row.plannedReps));
    }
    return isValidReps(uniformReps);
  }

  async function handleSubmit() {
    if (!isFormValid()) return;
    setSubmitting(true);
    setError(null);

    const sets = varied
      ? variedRows.map((row) => ({
          setNumber: row.setNumber,
          plannedReps: parseInt(row.plannedReps, 10),
          plannedWeightKg: row.plannedWeightKg
            ? parseFloat(row.plannedWeightKg)
            : undefined,
        }))
      : Array.from({ length: setCount }, (_, i) => ({
          setNumber: i + 1,
          plannedReps: parseInt(uniformReps, 10),
          plannedWeightKg: uniformWeight ? parseFloat(uniformWeight) : undefined,
        }));

    try {
      const res = await fetch("/api/gym/sets/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          exerciseName,
          muscleGroup,
          sets,
        }),
      });

      if (!res.ok) {
        setError(t("saving"));
        return;
      }

      const data = (await res.json()) as {
        sets: { id: string; setNumber: number }[];
      };

      // Map returned ids back to full planned data
      const planned: PlannedSet[] = data.sets.map((s, i) => ({
        id: s.id,
        setNumber: s.setNumber,
        plannedReps: sets[i].plannedReps,
        plannedWeightKg: sets[i].plannedWeightKg ?? null,
      }));

      onPlanned(planned);
    } catch {
      setError(t("saving"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--dietista-text)]">
            {exerciseName}
          </p>
          <p className="text-xs text-[var(--dietista-text-3)]">{muscleGroup}</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-[var(--dietista-text-3)] underline"
        >
          {t("cancel")}
        </button>
      </div>

      {/* Set count */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-[var(--dietista-text-2)]">
          {t("setCount")}
        </label>
        <input
          type="number"
          min={1}
          max={20}
          value={setCount}
          onChange={(e) => handleSetCountChange(e.target.value)}
          className="w-16 rounded-[var(--dietista-r-sm)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] px-2 py-1 text-center text-sm text-[var(--dietista-text)]"
        />
      </div>

      {/* Varied toggle */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-[var(--dietista-text-2)]">
          {t("varied")}
        </label>
        <button
          type="button"
          role="switch"
          aria-checked={varied}
          onClick={handleVariedToggle}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            varied ? "bg-[var(--brand-600)]" : "bg-[var(--dietista-border)]"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              varied ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* Uniform inputs */}
      {!varied && (
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-[var(--dietista-text-2)]">
              {t("reps")}
            </label>
            <input
              type="number"
              min={1}
              value={uniformReps}
              onChange={(e) => setUniformReps(e.target.value)}
              placeholder="8"
              className="w-full rounded-[var(--dietista-r-sm)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] px-2 py-1.5 text-sm text-[var(--dietista-text)] placeholder:text-[var(--dietista-text-3)]"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-[var(--dietista-text-2)]">
              {t("weight")} ({t("optional")})
            </label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={uniformWeight}
              onChange={(e) => setUniformWeight(e.target.value)}
              placeholder="80"
              className="w-full rounded-[var(--dietista-r-sm)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] px-2 py-1.5 text-sm text-[var(--dietista-text)] placeholder:text-[var(--dietista-text-3)]"
            />
          </div>
        </div>
      )}

      {/* Varied rows */}
      {varied && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-[var(--dietista-text-2)]">
            {t("variedSets")}
          </p>
          {variedRows.map((row, i) => (
            <div key={row.setNumber} className="flex items-center gap-2">
              <span className="w-6 shrink-0 text-center text-xs text-[var(--dietista-text-3)]">
                {row.setNumber}
              </span>
              <input
                type="number"
                min={1}
                value={row.plannedReps}
                onChange={(e) => updateVariedRow(i, "plannedReps", e.target.value)}
                placeholder={t("reps")}
                className="w-20 rounded-[var(--dietista-r-sm)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] px-2 py-1 text-sm text-[var(--dietista-text)] placeholder:text-[var(--dietista-text-3)]"
              />
              <input
                type="number"
                min={0}
                step={0.5}
                value={row.plannedWeightKg}
                onChange={(e) =>
                  updateVariedRow(i, "plannedWeightKg", e.target.value)
                }
                placeholder={`${t("weight")} (${t("optional")})`}
                className="flex-1 rounded-[var(--dietista-r-sm)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] px-2 py-1 text-sm text-[var(--dietista-text)] placeholder:text-[var(--dietista-text-3)]"
              />
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="rounded-md bg-red-50 p-2 text-xs text-red-600 dark:bg-red-950/30">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!isFormValid() || submitting}
        className="w-full rounded-[var(--dietista-r-md)] bg-[var(--brand-600)] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {submitting ? t("saving") : t("confirmPlan")}
      </button>
    </div>
  );
}
