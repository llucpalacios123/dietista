import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DiaryWorkoutWidget } from "../diary-workout-widget";
import type { WorkoutPlanRecord } from "@/lib/workout-plan-service";
import type { WorkoutPlanContent } from "@/lib/schemas";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const workoutContent: WorkoutPlanContent = {
  version: 1,
  days: [
    {
      dayOfWeek: 0, // Monday
      focus: ["chest"],
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
      ],
      isRestDay: false,
    },
    {
      dayOfWeek: 6, // Sunday
      focus: ["cardio"],
      title: "Descanso",
      warmupMin: 0,
      cooldownMin: 0,
      exercises: [],
      isRestDay: true,
    },
  ],
};

const activePlan: WorkoutPlanRecord = {
  id: "plan-1",
  userId: "user-1",
  name: "Mi plan de fuerza",
  goal: "strength",
  level: "intermediate",
  daysPerWeek: 4,
  status: "active",
  content: workoutContent as unknown as Record<string, unknown>,
  startDate: new Date("2026-01-01"),
  endDate: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("DiaryWorkoutWidget — no plan", () => {
  it("renders empty state when plan is null", () => {
    render(<DiaryWorkoutWidget plan={null} dayOfWeek={0} />);
    expect(screen.getByTestId("diary-workout-widget-empty")).toBeInTheDocument();
  });

  it("renders a link to /planes in empty state", () => {
    render(<DiaryWorkoutWidget plan={null} dayOfWeek={0} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/planes");
  });
});

describe("DiaryWorkoutWidget — active plan with training day", () => {
  it("renders the widget with plan name", () => {
    render(<DiaryWorkoutWidget plan={activePlan} dayOfWeek={0} />);
    expect(screen.getByText("Mi plan de fuerza")).toBeInTheDocument();
  });

  it("renders today's exercises title", () => {
    render(<DiaryWorkoutWidget plan={activePlan} dayOfWeek={0} />);
    expect(screen.getByText("Empuje superior")).toBeInTheDocument();
  });

  it("renders exercise names", () => {
    render(<DiaryWorkoutWidget plan={activePlan} dayOfWeek={0} />);
    expect(screen.getByText(/Press banca/)).toBeInTheDocument();
  });

  it("renders link to /gimnasio", () => {
    render(<DiaryWorkoutWidget plan={activePlan} dayOfWeek={0} />);
    const link = screen.getByRole("link", { name: /diary.logWorkout/i });
    expect(link).toHaveAttribute("href", "/gimnasio");
  });

  it("renders session done badge when hasSessionToday=true", () => {
    render(
      <DiaryWorkoutWidget plan={activePlan} dayOfWeek={0} hasSessionToday />
    );
    expect(screen.getByText(/diary.sessionDone/)).toBeInTheDocument();
  });

  it("does not render session badge when hasSessionToday=false", () => {
    render(<DiaryWorkoutWidget plan={activePlan} dayOfWeek={0} />);
    expect(screen.queryByText(/diary.sessionDone/)).not.toBeInTheDocument();
  });
});

describe("DiaryWorkoutWidget — active plan with rest day", () => {
  it("renders rest day message", () => {
    render(<DiaryWorkoutWidget plan={activePlan} dayOfWeek={6} />);
    expect(screen.getByText(/diary.restDayToday/)).toBeInTheDocument();
  });

  it("does not render exercise names on rest day", () => {
    render(<DiaryWorkoutWidget plan={activePlan} dayOfWeek={6} />);
    expect(screen.queryByText(/Press banca/)).not.toBeInTheDocument();
  });
});

describe("DiaryWorkoutWidget — day with no matching day in content", () => {
  it("renders rest day message for a day not in content", () => {
    // dayOfWeek=3 (Thursday) is not in workoutContent
    render(<DiaryWorkoutWidget plan={activePlan} dayOfWeek={3} />);
    expect(screen.getByText(/diary.restDayToday/)).toBeInTheDocument();
  });
});
