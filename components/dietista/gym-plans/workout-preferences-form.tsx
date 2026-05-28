"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MuscleGroup } from "@prisma/client";
import type { WorkoutPreferences } from "@/lib/schemas";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkoutPreferencesFormProps {
  initialValues?: Partial<WorkoutPreferences>;
  onSubmit: (prefs: WorkoutPreferences) => void;
  onBack?: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

type WorkoutGoal = "strength" | "endurance" | "weight_loss" | "toning" | "hypertrophy";
type FitnessLevel = "beginner" | "intermediate" | "advanced";
type Equipment = "gym" | "home_basic" | "dumbbells" | "bands" | "bodyweight";

const GOALS: WorkoutGoal[] = [
  "strength",
  "endurance",
  "weight_loss",
  "toning",
  "hypertrophy",
];

const LEVELS: FitnessLevel[] = ["beginner", "intermediate", "advanced"];

const MUSCLE_GROUPS: MuscleGroup[] = [
  "legs",
  "back",
  "chest",
  "shoulders",
  "arms",
  "core",
  "cardio",
];

const EQUIPMENT_OPTIONS: Equipment[] = [
  "gym",
  "home_basic",
  "dumbbells",
  "bands",
  "bodyweight",
];

const DURATION_OPTIONS = [30, 45, 60, 75, 90];

// ─── Component ────────────────────────────────────────────────────────────────

export function WorkoutPreferencesForm({
  initialValues,
  onSubmit,
  onBack,
}: WorkoutPreferencesFormProps): React.ReactElement {
  const t = useTranslations("GymPlans");

  const [name, setName] = useState(
    initialValues?.name ?? "Mi plan de entrenamiento"
  );
  const [goal, setGoal] = useState<WorkoutGoal>(
    (initialValues?.goal as WorkoutGoal) ?? "strength"
  );
  const [level, setLevel] = useState<FitnessLevel>(
    (initialValues?.level as FitnessLevel) ?? "intermediate"
  );
  const [daysPerWeek, setDaysPerWeek] = useState(
    initialValues?.daysPerWeek ?? 3
  );
  const [focusGroups, setFocusGroups] = useState<MuscleGroup[]>(
    initialValues?.focusGroups ?? ["legs", "back", "chest"]
  );
  const [equipment, setEquipment] = useState<Equipment[]>(
    (initialValues?.equipment as Equipment[]) ?? ["gym"]
  );
  const [sessionDurationMin, setSessionDurationMin] = useState(
    initialValues?.sessionDurationMin ?? 60
  );
  const [notes, setNotes] = useState(initialValues?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  function toggleFocusGroup(group: MuscleGroup) {
    setFocusGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  }

  function toggleEquipment(item: Equipment) {
    setEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (focusGroups.length === 0) {
      setError(t("wizard.errorFocusGroups"));
      return;
    }
    if (equipment.length === 0) {
      setError(t("wizard.errorEquipment"));
      return;
    }

    onSubmit({
      name: name.trim() || "Mi plan de entrenamiento",
      goal,
      level,
      daysPerWeek,
      focusGroups,
      equipment,
      sessionDurationMin,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
      data-testid="workout-preferences-form"
    >
      {/* Plan name */}
      <div>
        <label className="block text-sm font-medium text-[var(--dietista-text)] mb-1">
          {t("wizard.planName")}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          className="w-full rounded-[var(--dietista-r-md)] border border-[var(--dietista-border)] bg-[var(--dietista-bg)] px-3 py-2 text-sm text-[var(--dietista-text)] outline-none focus:border-[var(--brand-400)]"
          placeholder={t("wizard.planNamePlaceholder")}
          data-testid="input-plan-name"
        />
      </div>

      {/* Goal */}
      <div>
        <label className="block text-sm font-medium text-[var(--dietista-text)] mb-2">
          {t("wizard.goal")}
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {GOALS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGoal(g)}
              data-testid={`goal-${g}`}
              className={`rounded-[var(--dietista-r-md)] border px-3 py-2 text-xs font-medium transition-colors ${
                goal === g
                  ? "border-[var(--brand-400)] bg-[var(--brand-50)] text-[var(--brand-700)]"
                  : "border-[var(--dietista-border)] bg-[var(--dietista-surface)] text-[var(--dietista-text)]"
              }`}
            >
              {t(`goals.${g}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Level */}
      <div>
        <label className="block text-sm font-medium text-[var(--dietista-text)] mb-2">
          {t("wizard.level")}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLevel(l)}
              data-testid={`level-${l}`}
              className={`rounded-[var(--dietista-r-md)] border px-3 py-2 text-xs font-medium transition-colors ${
                level === l
                  ? "border-[var(--brand-400)] bg-[var(--brand-50)] text-[var(--brand-700)]"
                  : "border-[var(--dietista-border)] bg-[var(--dietista-surface)] text-[var(--dietista-text)]"
              }`}
            >
              {t(`levels.${l}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Days per week */}
      <div>
        <label className="block text-sm font-medium text-[var(--dietista-text)] mb-1">
          {t("wizard.daysPerWeek")}: <strong>{daysPerWeek}</strong>
        </label>
        <input
          type="range"
          min={1}
          max={7}
          value={daysPerWeek}
          onChange={(e) => setDaysPerWeek(Number(e.target.value))}
          className="w-full accent-[var(--brand-500)]"
          data-testid="input-days-per-week"
        />
        <div className="flex justify-between text-xs text-[var(--dietista-text-3)]">
          <span>1</span>
          <span>7</span>
        </div>
      </div>

      {/* Focus muscle groups */}
      <div>
        <label className="block text-sm font-medium text-[var(--dietista-text)] mb-2">
          {t("wizard.focusGroups")}
        </label>
        <div className="flex flex-wrap gap-2">
          {MUSCLE_GROUPS.map((group) => (
            <button
              key={group}
              type="button"
              onClick={() => toggleFocusGroup(group)}
              data-testid={`focus-${group}`}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                focusGroups.includes(group)
                  ? "border-[var(--brand-400)] bg-[var(--brand-100)] text-[var(--brand-700)]"
                  : "border-[var(--dietista-border)] bg-[var(--dietista-surface)] text-[var(--dietista-text-2)]"
              }`}
            >
              {t(`muscleGroups.${group}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Equipment */}
      <div>
        <label className="block text-sm font-medium text-[var(--dietista-text)] mb-2">
          {t("wizard.equipment")}
        </label>
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT_OPTIONS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => toggleEquipment(item)}
              data-testid={`equipment-${item}`}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                equipment.includes(item)
                  ? "border-[var(--brand-400)] bg-[var(--brand-100)] text-[var(--brand-700)]"
                  : "border-[var(--dietista-border)] bg-[var(--dietista-surface)] text-[var(--dietista-text-2)]"
              }`}
            >
              {t(`equipment.${item}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Session duration */}
      <div>
        <label className="block text-sm font-medium text-[var(--dietista-text)] mb-2">
          {t("wizard.sessionDuration")}
        </label>
        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setSessionDurationMin(d)}
              data-testid={`duration-${d}`}
              className={`rounded-[var(--dietista-r-md)] border px-3 py-1.5 text-xs font-medium transition-colors ${
                sessionDurationMin === d
                  ? "border-[var(--brand-400)] bg-[var(--brand-50)] text-[var(--brand-700)]"
                  : "border-[var(--dietista-border)] bg-[var(--dietista-surface)] text-[var(--dietista-text)]"
              }`}
            >
              {d} min
            </button>
          ))}
        </div>
      </div>

      {/* Notes / injuries */}
      <div>
        <label className="block text-sm font-medium text-[var(--dietista-text)] mb-1">
          {t("wizard.notes")}
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
          rows={3}
          className="w-full rounded-[var(--dietista-r-md)] border border-[var(--dietista-border)] bg-[var(--dietista-bg)] px-3 py-2 text-sm text-[var(--dietista-text)] outline-none focus:border-[var(--brand-400)] resize-none"
          placeholder={t("wizard.notesPlaceholder")}
          data-testid="input-notes"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600" data-testid="form-error">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex justify-between gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="rounded-[var(--dietista-r-md)] border border-[var(--dietista-border)] px-4 py-2 text-sm font-medium text-[var(--dietista-text)] transition-colors hover:bg-[var(--dietista-surface)]"
          >
            {t("wizard.back")}
          </button>
        )}
        <button
          type="submit"
          className="ml-auto rounded-[var(--dietista-r-md)] bg-[var(--brand-500)] px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-600)]"
          data-testid="btn-submit-preferences"
        >
          {t("wizard.next")}
        </button>
      </div>
    </form>
  );
}
