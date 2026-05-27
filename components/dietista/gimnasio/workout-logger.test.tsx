import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkoutLogger, type SerializedWorkoutSet } from "./workout-logger";

// ─── Mock next-intl ───────────────────────────────────────────────────────

vi.mock("next-intl", () => ({
  useTranslations: (_namespace: string) => {
    const keys: Record<string, string> = {
      todayWorkout: "Today's Workout",
      noWorkoutToday: "No workout today",
      addExercise: "Add Exercise",
      saving: "Saving...",
      pending: "Pending",
      bodyweight: "Bodyweight",
      cancel: "Cancel",
      saveSet: "Save Set",
      editSet: "Edit",
      deleteSet: "Delete",
      reps: "Reps",
      weight: "Weight",
    };
    return (key: string, params?: Record<string, unknown>) => {
      if (params) return key;
      return keys[key] ?? key;
    };
  },
}));

// ─── Mock next/navigation ─────────────────────────────────────────────────

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

// ─── Mock child components we don't want to render fully ─────────────────

vi.mock("./exercise-selector", () => ({
  ExerciseSelector: () => <div data-testid="exercise-selector" />,
}));

vi.mock("./set-logger", () => ({
  SetLogger: () => <div data-testid="set-logger" />,
}));

vi.mock("./set-planner", () => ({
  SetPlanner: () => <div data-testid="set-planner" />,
}));

vi.mock("@/lib/gym-exercises", () => ({
  MuscleGroupLabels: { chest: "Chest", legs: "Legs" },
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────

function makeSet(overrides: Partial<SerializedWorkoutSet> = {}): SerializedWorkoutSet {
  return {
    id: "set-1",
    exerciseName: "Bench Press",
    muscleGroup: "chest",
    setNumber: 1,
    reps: 8,
    plannedReps: 8,
    plannedWeightKg: 80,
    weightKg: 80,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function renderIdle(todaySets: SerializedWorkoutSet[]) {
  return render(<WorkoutLogger todaySets={todaySets} sessionId="session-1" />);
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe("WorkoutLogger — idle edit panel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response);
  });

  it("1.6 tapping an exercise row expands inline edit panel showing only executed sets", async () => {
    const user = userEvent.setup();
    const sets = [
      makeSet({ id: "set-1", setNumber: 1, reps: 8, weightKg: 80 }),
      makeSet({ id: "set-2", setNumber: 2, reps: null, weightKg: null }), // pending
    ];
    renderIdle(sets);

    // Tap the exercise row button
    const rowButton = screen.getByRole("button", { name: /bench press/i });
    await user.click(rowButton);

    // Edit panel should now be visible
    const panel = screen.getByTestId("edit-panel-Bench Press");
    expect(panel).toBeInTheDocument();

    // Only executed sets (reps !== null) shown
    const setRows = within(panel).getAllByTestId(/^edit-set-row/);
    expect(setRows).toHaveLength(1);
  });

  it("1.7 tapping the same exercise row again collapses the edit panel", async () => {
    const user = userEvent.setup();
    const sets = [makeSet()];
    renderIdle(sets);

    const rowButton = screen.getByRole("button", { name: /bench press/i });
    await user.click(rowButton);
    expect(screen.getByTestId("edit-panel-Bench Press")).toBeInTheDocument();

    await user.click(rowButton);
    expect(screen.queryByTestId("edit-panel-Bench Press")).not.toBeInTheDocument();
  });

  it("1.8 tapping a second exercise collapses the first and opens the second", async () => {
    const user = userEvent.setup();
    const sets = [
      makeSet({ id: "set-1", exerciseName: "Bench Press", muscleGroup: "chest" }),
      makeSet({ id: "set-2", exerciseName: "Squat", muscleGroup: "legs" }),
    ];
    renderIdle(sets);

    const benchButton = screen.getByRole("button", { name: /bench press/i });
    const squatButton = screen.getByRole("button", { name: /squat/i });

    await user.click(benchButton);
    expect(screen.getByTestId("edit-panel-Bench Press")).toBeInTheDocument();
    expect(screen.queryByTestId("edit-panel-Squat")).not.toBeInTheDocument();

    await user.click(squatButton);
    expect(screen.queryByTestId("edit-panel-Bench Press")).not.toBeInTheDocument();
    expect(screen.getByTestId("edit-panel-Squat")).toBeInTheDocument();
  });

  it("1.9 Save button calls PATCH /api/gym/sets/:id with {reps, weightKg} and router.refresh()", async () => {
    const user = userEvent.setup();
    const sets = [makeSet({ id: "set-abc", reps: 8, weightKg: 80 })];
    renderIdle(sets);

    const rowButton = screen.getByRole("button", { name: /bench press/i });
    await user.click(rowButton);

    const saveButton = screen.getByRole("button", { name: /save/i });
    await user.click(saveButton);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/gym/sets/set-abc",
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      }),
    );

    const callBody = JSON.parse(
      (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string,
    );
    expect(callBody).toMatchObject({ reps: 8, weightKg: 80 });
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("1.10 Save omits weightKg from body when weight field is empty", async () => {
    const user = userEvent.setup();
    const sets = [makeSet({ id: "set-bcd", reps: 5, weightKg: null, plannedWeightKg: null })];
    renderIdle(sets);

    await user.click(screen.getByRole("button", { name: /bench press/i }));

    const saveButton = screen.getByRole("button", { name: /save/i });
    await user.click(saveButton);

    const callBody = JSON.parse(
      (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string,
    );
    expect(callBody.reps).toBe(5);
    // weightKg should be null (not undefined / omitted key) because the API needs it nullable
    expect(callBody).toHaveProperty("weightKg");
    expect(callBody.weightKg).toBeNull();
  });

  it("1.11 Delete button calls DELETE /api/gym/sets/:id and router.refresh()", async () => {
    const user = userEvent.setup();
    const sets = [makeSet({ id: "set-del" })];
    renderIdle(sets);

    await user.click(screen.getByRole("button", { name: /bench press/i }));

    const deleteButton = screen.getByRole("button", { name: /delete/i });
    await user.click(deleteButton);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/gym/sets/set-del",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(mockRefresh).toHaveBeenCalled();
  });
});
