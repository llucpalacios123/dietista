import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WorkoutExerciseRow } from "../workout-exercise-row";
import type { WorkoutPlanExercise } from "@/lib/schemas";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const baseExercise: WorkoutPlanExercise = {
  name: "Press banca",
  muscleGroup: "chest",
  isFromCatalog: true,
  sets: [
    { reps: 10, weightKg: 60, rir: 2 },
    { reps: 8, weightKg: 65, rir: 1 },
    { reps: 6, weightKg: 70, rir: 0 },
  ],
  restSec: 90,
  notes: "Agarre medio",
  tempo: "3-1-1",
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("WorkoutExerciseRow", () => {
  it("renders the exercise name", () => {
    render(<WorkoutExerciseRow exercise={baseExercise} />);
    expect(screen.getByText("Press banca")).toBeInTheDocument();
  });

  it("renders the number of sets", () => {
    render(<WorkoutExerciseRow exercise={baseExercise} />);
    // The badge shows "3 sets" — look for the span that contains exactly "3 sets"
    const badge = screen.getByText(/3.*sets/i);
    expect(badge).toBeInTheDocument();
  });

  it("renders all set items", () => {
    render(<WorkoutExerciseRow exercise={baseExercise} />);
    const setItems = screen.getAllByTestId("exercise-set");
    expect(setItems).toHaveLength(3);
  });

  it("renders notes when present", () => {
    render(<WorkoutExerciseRow exercise={baseExercise} />);
    expect(screen.getByText("Agarre medio")).toBeInTheDocument();
  });

  it("renders tempo when present", () => {
    render(<WorkoutExerciseRow exercise={baseExercise} />);
    expect(screen.getByText(/3-1-1/)).toBeInTheDocument();
  });

  it("does not render notes section when absent", () => {
    const exercise: WorkoutPlanExercise = { ...baseExercise, notes: undefined };
    render(<WorkoutExerciseRow exercise={exercise} />);
    expect(screen.queryByText("Agarre medio")).not.toBeInTheDocument();
  });

  it("renders duration-based sets (cardio)", () => {
    const cardioExercise: WorkoutPlanExercise = {
      name: "Cinta de correr",
      muscleGroup: "cardio",
      isFromCatalog: false,
      sets: [{ reps: null, weightKg: null, durationSec: 300 }],
      restSec: 60,
    };
    render(<WorkoutExerciseRow exercise={cardioExercise} />);
    // With mock useTranslations returning key, format is "setLabel 1: 300s"
    expect(screen.getByText(/300s/)).toBeInTheDocument();
  });

  it("renders rest time formatted in minutes when >= 60s", () => {
    render(<WorkoutExerciseRow exercise={baseExercise} />);
    // 90s → "2 min" (rounded) — actually 90/60 = 1.5 → Math.round = 2
    expect(screen.getByText(/2 min/)).toBeInTheDocument();
  });

  it("renders rest time in seconds when < 60s", () => {
    const exercise: WorkoutPlanExercise = { ...baseExercise, restSec: 45 };
    render(<WorkoutExerciseRow exercise={exercise} />);
    expect(screen.getByText(/45s/)).toBeInTheDocument();
  });

  it("has the workout-exercise-row test id", () => {
    render(<WorkoutExerciseRow exercise={baseExercise} />);
    expect(screen.getByTestId("workout-exercise-row")).toBeInTheDocument();
  });
});
