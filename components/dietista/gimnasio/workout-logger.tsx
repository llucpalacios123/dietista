"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ExerciseSelector } from "./exercise-selector";
import { SetLogger } from "./set-logger";
import { SetPlanner, type PlannedSet } from "./set-planner";
import { MuscleGroupLabels, type MuscleGroup } from "@/lib/gym-exercises";

export interface SerializedWorkoutSet {
  id: string;
  exerciseName: string;
  muscleGroup: string;
  setNumber: number;
  reps: number | null;
  plannedReps: number | null;
  plannedWeightKg: number | null;
  weightKg: number | null;
  createdAt: string; // ISO string
}

export interface WorkoutLoggerProps {
  todaySets: SerializedWorkoutSet[];
  sessionId: string | null;
}

interface ExecutingSet extends PlannedSet {
  executed: boolean;
  actualReps?: number;
  actualWeightKg?: number;
}

type LoggerState =
  | { mode: "idle" }
  | { mode: "selecting" }
  | { mode: "planning"; exerciseName: string; muscleGroup: string; sessionId: string }
  | { mode: "executing"; exerciseName: string; muscleGroup: string; sets: ExecutingSet[]; activeIndex: number | null }
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

  // Execute mini-form state
  const [executeReps, setExecuteReps] = useState("");
  const [executeWeight, setExecuteWeight] = useState("");
  const [executingSet, setExecutingSet] = useState(false);
  const [executeError, setExecuteError] = useState<string | null>(null);

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
    setState({ mode: "selecting" });
    // Show a choice: quick log or plan sets
    setState({ mode: "planning", exerciseName, muscleGroup, sessionId });
  }

  function handleExerciseSelectedQuickLog(exerciseName: string, muscleGroup: string) {
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

  function handlePlanned(planned: PlannedSet[]) {
    const sets: ExecutingSet[] = planned.map((s) => ({
      ...s,
      executed: false,
    }));
    setState({
      mode: "executing",
      exerciseName: state.mode === "planning" ? state.exerciseName : "",
      muscleGroup: state.mode === "planning" ? state.muscleGroup : "",
      sets,
      activeIndex: null,
    });
  }

  function openExecuteForm(index: number) {
    if (state.mode !== "executing") return;
    const set = state.sets[index];
    setExecuteReps(String(set.plannedReps));
    setExecuteWeight(set.plannedWeightKg != null ? String(set.plannedWeightKg) : "");
    setExecuteError(null);
    setState({ ...state, activeIndex: index });
  }

  function cancelExecuteForm() {
    if (state.mode !== "executing") return;
    setState({ ...state, activeIndex: null });
  }

  async function confirmExecute() {
    if (state.mode !== "executing" || state.activeIndex === null) return;
    const index = state.activeIndex;
    const set = state.sets[index];

    const reps = parseInt(executeReps, 10);
    if (isNaN(reps) || reps < 1) {
      setExecuteError("Reps must be ≥ 1");
      return;
    }

    setExecutingSet(true);
    setExecuteError(null);
    try {
      const res = await fetch(`/api/gym/sets/${set.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reps,
          weightKg: executeWeight ? parseFloat(executeWeight) : undefined,
        }),
      });

      if (!res.ok) {
        setExecuteError("Error al guardar");
        return;
      }

      const newSets = state.sets.map((s, i) =>
        i === index
          ? {
              ...s,
              executed: true,
              actualReps: reps,
              actualWeightKg: executeWeight ? parseFloat(executeWeight) : undefined,
            }
          : s,
      );

      setState({ ...state, sets: newSets, activeIndex: null });
    } catch {
      setExecuteError("Error de conexión");
    } finally {
      setExecutingSet(false);
    }
  }

  function handleDone() {
    router.refresh();
    setState({ mode: "idle" });
  }

  // ── Selecting state ───────────────────────────────────────────────────────

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

  // ── Planning state ────────────────────────────────────────────────────────

  if (state.mode === "planning") {
    return (
      <div className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)]">
        <SetPlanner
          exerciseName={state.exerciseName}
          muscleGroup={state.muscleGroup}
          sessionId={state.sessionId}
          onPlanned={handlePlanned}
          onCancel={handleCancel}
        />
        <div className="mt-3 border-t border-[var(--dietista-border)] pt-3">
          <button
            type="button"
            onClick={() =>
              handleExerciseSelectedQuickLog(state.exerciseName, state.muscleGroup)
            }
            className="w-full text-center text-xs text-[var(--dietista-text-3)] underline"
          >
            {t("addSet")} (quick log)
          </button>
        </div>
      </div>
    );
  }

  // ── Executing state ───────────────────────────────────────────────────────

  if (state.mode === "executing") {
    const executedCount = state.sets.filter((s) => s.executed).length;
    const total = state.sets.length;
    const allDone = executedCount === total;

    return (
      <div className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)]">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-[var(--dietista-text)]">
            {state.exerciseName}
          </p>
          <p className="text-xs text-[var(--dietista-text-3)]">
            {t("setsCompleted", { done: executedCount, total })}
          </p>
        </div>

        <ul className="mb-4 space-y-2">
          {state.sets.map((set, index) => (
            <li
              key={set.id}
              className="rounded-[var(--dietista-r-md)] border border-[var(--dietista-border)] px-3 py-2"
            >
              {state.activeIndex === index ? (
                // Execute mini-form
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[var(--dietista-text)]">
                    {t("executingSet", { n: set.setNumber })}
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="mb-0.5 block text-xs text-[var(--dietista-text-3)]">
                        {t("reps")}
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={executeReps}
                        onChange={(e) => setExecuteReps(e.target.value)}
                        className="w-full rounded border border-[var(--dietista-border)] bg-[var(--dietista-surface)] px-2 py-1 text-sm text-[var(--dietista-text)]"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="mb-0.5 block text-xs text-[var(--dietista-text-3)]">
                        {t("weight")}
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={executeWeight}
                        onChange={(e) => setExecuteWeight(e.target.value)}
                        className="w-full rounded border border-[var(--dietista-border)] bg-[var(--dietista-surface)] px-2 py-1 text-sm text-[var(--dietista-text)]"
                      />
                    </div>
                  </div>
                  {executeError && (
                    <p className="text-xs text-red-500">{executeError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={confirmExecute}
                      disabled={executingSet}
                      className="flex-1 rounded-[var(--dietista-r-sm)] bg-[var(--brand-600)] py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {executingSet ? t("saving") : t("saveSet")}
                    </button>
                    <button
                      type="button"
                      onClick={cancelExecuteForm}
                      className="rounded-[var(--dietista-r-sm)] border border-[var(--dietista-border)] px-3 py-1.5 text-xs text-[var(--dietista-text-2)]"
                    >
                      {t("cancel")}
                    </button>
                  </div>
                </div>
              ) : (
                // Set row
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-[var(--dietista-text)]">
                      {t("sets")} {set.setNumber}
                    </p>
                    {set.executed ? (
                      <p className="text-xs text-[var(--dietista-text-3)]">
                        {set.actualReps}
                        {set.actualWeightKg != null
                          ? ` × ${set.actualWeightKg}kg`
                          : ""}
                      </p>
                    ) : (
                      <p className="text-xs text-[var(--dietista-text-3)]">
                        {set.plannedReps}r
                        {set.plannedWeightKg != null
                          ? ` × ${set.plannedWeightKg}kg`
                          : ""}
                      </p>
                    )}
                  </div>
                  {set.executed ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      ✓
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openExecuteForm(index)}
                      disabled={state.activeIndex !== null}
                      className="rounded-[var(--dietista-r-sm)] bg-[var(--brand-600)] px-2 py-1 text-xs font-semibold text-white disabled:opacity-40"
                    >
                      {t("executeSet")}
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>

        {allDone && (
          <button
            type="button"
            onClick={handleDone}
            className="w-full rounded-[var(--dietista-r-md)] bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {t("doneBack")}
          </button>
        )}
      </div>
    );
  }

  // ── Logging state (quick-path — unchanged) ────────────────────────────────

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

  // ── Idle state ────────────────────────────────────────────────────────────

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
                    {lastSet.reps == null ? (
                      <span className="rounded bg-yellow-100 px-1 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                        {t("pending")}
                      </span>
                    ) : lastSet.weightKg != null ? (
                      `${lastSet.weightKg}kg × ${lastSet.reps}`
                    ) : (
                      `${t("bodyweight")} × ${lastSet.reps}`
                    )}
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
