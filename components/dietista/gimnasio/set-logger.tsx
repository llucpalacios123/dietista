"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MuscleGroupLabels, type MuscleGroup } from "@/lib/gym-exercises";

export interface SetLoggerProps {
  exerciseName: string;
  muscleGroup: string;
  sessionId: string;
  onSaved: () => void;
  onCancel: () => void;
}

interface FormState {
  reps: string;
  weightKg: string;
  notes: string;
}

const emptyForm: FormState = { reps: "", weightKg: "", notes: "" };

export function SetLogger({
  exerciseName,
  muscleGroup,
  sessionId,
  onSaved,
  onCancel,
}: SetLoggerProps): React.ReactElement {
  const t = useTranslations("Gym");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const reps = parseInt(form.reps, 10);
    if (!reps || reps < 1) {
      setError("Reps debe ser un número positivo");
      return;
    }

    const weightKg = form.weightKg ? parseFloat(form.weightKg) : undefined;
    if (weightKg !== undefined && (isNaN(weightKg) || weightKg <= 0)) {
      setError("El peso debe ser un número positivo");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/gym/sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          exerciseName,
          muscleGroup,
          reps,
          weightKg: weightKg ?? null,
          notes: form.notes || undefined,
          // setNumber computed server-side
          setNumber: 1, // placeholder; server recomputes
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Error al guardar");
        return;
      }

      setSavedCount((n) => n + 1);
      setForm(emptyForm);
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  function handleAddAnother() {
    setForm(emptyForm);
    setError(null);
  }

  function handleDone() {
    onSaved();
  }

  const muscleLabel = MuscleGroupLabels[muscleGroup as MuscleGroup] ?? muscleGroup;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--dietista-text)]">
            {exerciseName}
          </h3>
          <p className="text-xs text-[var(--dietista-text-3)]">{muscleLabel}</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-[var(--dietista-text-3)] hover:text-[var(--dietista-text-2)]"
        >
          {t("cancel")}
        </button>
      </div>

      {savedCount > 0 && (
        <div className="rounded-[var(--dietista-r-md)] bg-green-50 px-3 py-2 text-xs text-green-700 dark:bg-green-950/30 dark:text-green-400">
          {savedCount} {savedCount === 1 ? "serie guardada" : "series guardadas"}
        </div>
      )}

      {error && (
        <p className="rounded-md bg-red-50 p-2 text-xs text-red-600 dark:bg-red-950/30">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-3">
          {/* Reps */}
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-[var(--dietista-text-2)]">
              {t("reps")}
            </label>
            <input
              type="number"
              min={1}
              max={999}
              step={1}
              placeholder="10"
              value={form.reps}
              onChange={(e) => setForm((f) => ({ ...f, reps: e.target.value }))}
              disabled={saving}
              required
              className="w-full rounded-[var(--dietista-r-md)] border border-[var(--dietista-border)] bg-[var(--dietista-bg)] px-3 py-2 text-sm text-[var(--dietista-text)] placeholder-[var(--dietista-text-3)] focus:border-[var(--brand-600)] focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Weight */}
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-[var(--dietista-text-2)]">
              {t("weight")}{" "}
              <span className="font-normal text-[var(--dietista-text-3)]">
                ({t("optional")})
              </span>
            </label>
            <input
              type="number"
              min={0}
              step={0.5}
              placeholder="80"
              value={form.weightKg}
              onChange={(e) => setForm((f) => ({ ...f, weightKg: e.target.value }))}
              disabled={saving}
              className="w-full rounded-[var(--dietista-r-md)] border border-[var(--dietista-border)] bg-[var(--dietista-bg)] px-3 py-2 text-sm text-[var(--dietista-text)] placeholder-[var(--dietista-text-3)] focus:border-[var(--brand-600)] focus:outline-none disabled:opacity-50"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--dietista-text-2)]">
            {t("notes")}
          </label>
          <input
            type="text"
            placeholder={t("notesPlaceholder")}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            disabled={saving}
            maxLength={280}
            className="w-full rounded-[var(--dietista-r-md)] border border-[var(--dietista-border)] bg-[var(--dietista-bg)] px-3 py-2 text-sm text-[var(--dietista-text)] placeholder-[var(--dietista-text-3)] focus:border-[var(--brand-600)] focus:outline-none disabled:opacity-50"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-[var(--dietista-r-md)] bg-[var(--brand-600)] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? t("saving") : t("saveSet")}
          </button>

          {savedCount > 0 && (
            <button
              type="button"
              onClick={handleAddAnother}
              disabled={saving}
              className="rounded-[var(--dietista-r-md)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] px-3 py-2.5 text-sm font-medium text-[var(--dietista-text-2)] transition-colors hover:border-[var(--brand-600)] disabled:opacity-50"
            >
              {t("addAnotherSet")}
            </button>
          )}
        </div>

        {savedCount > 0 && (
          <button
            type="button"
            onClick={handleDone}
            className="w-full rounded-[var(--dietista-r-md)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] px-4 py-2.5 text-sm font-medium text-[var(--dietista-text-2)] transition-colors hover:bg-[var(--dietista-bg)]"
          >
            {t("doneBack")}
          </button>
        )}
      </form>
    </div>
  );
}
