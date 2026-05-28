import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WorkoutDayView } from "../workout-day-view";
import type { WorkoutPlanDay } from "@/lib/schemas";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const trainingDay: WorkoutPlanDay = {
  dayOfWeek: 0,
  focus: ["chest", "shoulders"],
  title: "Empuje superior",
  warmupMin: 5,
  cooldownMin: 5,
  exercises: [
    {
      name: "Press banca",
      muscleGroup: "chest",
      isFromCatalog: true,
      sets: [{ reps: 10, weightKg: 60, rir: 2 }],
      restSec: 90,
    },
    {
      name: "Press militar",
      muscleGroup: "shoulders",
      isFromCatalog: true,
      sets: [{ reps: 10, weightKg: 40, rir: 2 }],
      restSec: 90,
    },
  ],
  isRestDay: false,
};

const restDay: WorkoutPlanDay = {
  dayOfWeek: 6,
  focus: ["cardio"],
  title: "Descanso",
  warmupMin: 0,
  cooldownMin: 0,
  exercises: [],
  isRestDay: true,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("WorkoutDayView — training day", () => {
  it("renders the day label from dayLabel prop", () => {
    render(<WorkoutDayView day={trainingDay} dayLabel="Lunes" />);
    expect(screen.getByText("Lunes")).toBeInTheDocument();
  });

  it("falls back to default Spanish label when no dayLabel prop", () => {
    render(<WorkoutDayView day={trainingDay} />);
    expect(screen.getByText("Lunes")).toBeInTheDocument(); // dayOfWeek=0
  });

  it("renders the day title", () => {
    render(<WorkoutDayView day={trainingDay} dayLabel="Lunes" />);
    expect(screen.getByText("Empuje superior")).toBeInTheDocument();
  });

  it("renders exercise count", () => {
    render(<WorkoutDayView day={trainingDay} dayLabel="Lunes" />);
    expect(screen.getByText(/2.*exercises/i)).toBeInTheDocument();
  });

  it("renders warmup and cooldown info when present", () => {
    render(<WorkoutDayView day={trainingDay} dayLabel="Lunes" />);
    // warmup or cooldown label contains "min"
    const timeLabels = screen.getAllByText(/min/);
    expect(timeLabels.length).toBeGreaterThan(0);
  });

  it("renders exercise rows for each exercise", () => {
    render(<WorkoutDayView day={trainingDay} dayLabel="Lunes" />);
    expect(screen.getAllByTestId("workout-exercise-row")).toHaveLength(2);
  });

  it("has data-rest-day=false for training day", () => {
    render(<WorkoutDayView day={trainingDay} dayLabel="Lunes" />);
    const el = screen.getByTestId("workout-day-view");
    expect(el).toHaveAttribute("data-rest-day", "false");
  });
});

describe("WorkoutDayView — rest day", () => {
  it("renders rest day indicator", () => {
    render(<WorkoutDayView day={restDay} dayLabel="Domingo" />);
    // The translation key "restDay" is returned as-is by the mock
    const matches = screen.getAllByText(/restDay/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("does not render exercise rows on rest day", () => {
    render(<WorkoutDayView day={restDay} dayLabel="Domingo" />);
    expect(screen.queryAllByTestId("workout-exercise-row")).toHaveLength(0);
  });

  it("has data-rest-day=true", () => {
    render(<WorkoutDayView day={restDay} dayLabel="Domingo" />);
    const el = screen.getByTestId("workout-day-view");
    expect(el).toHaveAttribute("data-rest-day", "true");
  });
});
