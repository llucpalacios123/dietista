"use client";

import { useTranslations } from "next-intl";
import { MuscleGroupLabels, type MuscleGroup } from "@/lib/gym-exercises";

export interface SerializedSet {
  id: string;
  exerciseName: string;
  muscleGroup: string;
  setNumber: number;
  reps: number;
  weightKg: number | null;
}

export interface SerializedSession {
  id: string;
  date: string; // ISO string
  sets: SerializedSet[];
}

interface SessionHistoryProps {
  sessions: SerializedSession[];
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function groupSetsByExercise(
  sets: SerializedSet[],
): Map<string, SerializedSet[]> {
  const map = new Map<string, SerializedSet[]>();
  for (const set of sets) {
    const existing = map.get(set.exerciseName) ?? [];
    existing.push(set);
    map.set(set.exerciseName, existing);
  }
  return map;
}

export function SessionHistory({
  sessions,
}: SessionHistoryProps): React.ReactElement {
  const t = useTranslations("Gym");

  if (sessions.length === 0) {
    return (
      <div className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)]">
        <h2 className="mb-2 text-sm font-semibold text-[var(--dietista-text)]">
          {t("recentSessions")}
        </h2>
        <p className="text-sm text-[var(--dietista-text-3)]">
          {t("noRecentSessions")}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)]">
      <h2 className="mb-4 text-sm font-semibold text-[var(--dietista-text)]">
        {t("recentSessions")}
      </h2>

      <ul className="space-y-4">
        {sessions.map((session) => {
          const grouped = groupSetsByExercise(session.sets);

          return (
            <li key={session.id}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--dietista-text-3)]">
                {formatDate(session.date)}
              </p>

              {session.sets.length === 0 ? (
                <p className="text-xs text-[var(--dietista-text-3)]">
                  {t("noSetsLogged")}
                </p>
              ) : (
                <ul className="space-y-1">
                  {Array.from(grouped.entries()).map(([exerciseName, sets]) => {
                    const muscleLabel =
                      MuscleGroupLabels[sets[0].muscleGroup as MuscleGroup] ??
                      sets[0].muscleGroup;
                    const setCount = sets.length;
                    const lastSet = sets[sets.length - 1];
                    const weightStr =
                      lastSet.weightKg != null
                        ? `@ ${lastSet.weightKg}kg`
                        : t("noWeight");

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
                        <p className="shrink-0 text-xs text-[var(--dietista-text-2)]">
                          {setCount}×{lastSet.reps} {weightStr}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
