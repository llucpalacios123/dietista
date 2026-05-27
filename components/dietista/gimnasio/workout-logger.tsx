"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ExerciseSelector } from "./exercise-selector";
import { SetLogger } from "./set-logger";
import { MuscleGroupLabels, type MuscleGroup } from "@/lib/gym-exercises";

export interface SerializedWorkoutSet {
  id: string;
  exerciseName: string;
  muscleGroup: string;
  setNumber: number;
  reps: number;
  weightKg: number | null;
  createdAt: string; // ISO string
}

export interface WorkoutLoggerProps {
  todaySets: SerializedWorkoutSet[];
  sessionId: string | null;
}

type LoggerState =
  | { mode: "idle" }
  | { mode: "selecting" }
  | { mode: "logging"; exerciseName: string; muscleGroup: string; sessionId: string };

export function WorkoutLogger({
  todaySets,
  sessionId: initialSessionId,
}: WorkoutLoggerProps): React.ReactElement {
  const router = useRouter();
  const t = useTranslations("Gym");
  const [state, setState] = useState<LoggerState>({ mode: "idle" });
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId);
  const [creatingSession, setCreatingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Group today's sets by exercise name
  const setsByExercise = new Map<string, SerializedWorkoutSet[]>();
  for (const set of todaySets) {
    const existing = setsByExercise.get(set.exerciseName) ?? [];
    existing.push(set);
    setsByExercise.set(set.exerciseName, existing);
  }

  async function ensureSession(): Promise<string | null> {
    if (sessionId) return sessionId;

    setCreatingSession(true);
    setSessionError(null);
    try {
      const res = await fetch("/api/gym/sessions", { method: "POST" });
      if (!res.ok) {
        setSessionError("Error al crear sesión");
        return null;
      }
      const data = (await res.json()) as { id: string };
      setSessionId(data.id);
      return data.id;
    } catch {
      setSessionError("Error de conexión");
      return null;
    } finally {
      setCreatingSession(false);
    }
  }

  async function handleAddExercise() {
    const sid = await ensureSession();
    if (!sid) return;
    setState({ mode: "selecting" });
  }

  function handleExerciseSelected(exerciseName: string, muscleGroup: string) {
    if (!sessionId) return;
    setState({ mode: "logging", exerciseName, muscleGroup, sessionId });
  }

  function handleSetSaved() {
    router.refresh();
    setState({ mode: "idle" });
  }

  function handleCancel() {
    setState({ mode: "idle" });
  }

  if (state.mode === "selecting") {
    return (
      <div className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)]">
        <ExerciseSelector
          onSelect={handleExerciseSelected}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  if (state.mode === "logging") {
    return (
      <div className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)]">
        <SetLogger
          exerciseName={state.exerciseName}
          muscleGroup={state.muscleGroup}
          sessionId={state.sessionId}
          onSaved={handleSetSaved}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  // idle — show today's summary
  return (
    <div className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)]">
      <h2 className="mb-4 text-sm font-semibold text-[var(--dietista-text)]">
        {t("todayWorkout")}
      </h2>

      {sessionError && (
        <p className="mb-3 rounded-md bg-red-50 p-2 text-xs text-red-600 dark:bg-red-950/30">
          {sessionError}
        </p>
      )}

      {setsByExercise.size === 0 ? (
        <p className="mb-4 text-sm text-[var(--dietista-text-3)]">
          {t("noWorkoutToday")}
        </p>
      ) : (
        <ul className="mb-4 space-y-2">
          {Array.from(setsByExercise.entries()).map(([exerciseName, sets]) => {
            const muscleLabel =
              MuscleGroupLabels[sets[0].muscleGroup as MuscleGroup] ??
              sets[0].muscleGroup;
            const lastSet = sets[sets.length - 1];

            return (
              <li
                key={exerciseName}
                className="flex items-center justify-between rounded-[var(--dietista-r-md)] border border-[var(--dietista-border)] px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-[var(--dietista-text)]">
                    {exerciseName}
                  </p>
                  <p className="text-xs text-[var(--dietista-text-3)]">
                    {muscleLabel}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-semibold text-[var(--dietista-text)]">
                    {sets.length} {sets.length === 1 ? "serie" : "series"}
                  </p>
                  <p className="text-xs text-[var(--dietista-text-3)]">
                    {lastSet.weightKg != null
                      ? `${lastSet.weightKg}kg × ${lastSet.reps}`
                      : `${t("bodyweight")} × ${lastSet.reps}`}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={handleAddExercise}
        disabled={creatingSession}
        className="flex w-full items-center justify-center gap-2 rounded-[var(--dietista-r-md)] bg-[var(--brand-600)] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {creatingSession ? (
          t("saving")
        ) : (
          <>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t("addExercise")}
          </>
        )}
      </button>
    </div>
  );
}
