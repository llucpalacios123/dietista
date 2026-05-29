import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => <a href={href} {...rest}>{children}</a>,
}));

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const trainingExercise = {
  name: "Press banca",
  muscleGroup: "chest" as const,
  isFromCatalog: true,
  sets: [{ reps: 10, weightKg: 60, rir: 2 }],
  restSec: 90,
};

// v2: 3 day-relative training days, no rest-day fillers
const workoutContentV2: WorkoutPlanContent = {
  version: 2,
  days: [
    {
      dayOfWeek: 0,
      focus: ["chest"],
      title: "Día 1 · Empuje",
      warmupMin: 5,
      cooldownMin: 5,
      exercises: [trainingExercise],
      isRestDay: false,
    },
    {
      dayOfWeek: 1,
      focus: ["back"],
      title: "Día 2 · Tirón",
      warmupMin: 5,
      cooldownMin: 5,
      exercises: [{ ...trainingExercise, name: "Remo con barra", muscleGroup: "back" }],
      isRestDay: false,
    },
    {
      dayOfWeek: 2,
      focus: ["legs"],
      title: "Día 3 · Piernas",
      warmupMin: 5,
      cooldownMin: 5,
      exercises: [{ ...trainingExercise, name: "Sentadilla", muscleGroup: "legs" }],
      isRestDay: false,
    },
  ],
};

// v1: legacy calendar-week plan with one training day + one rest day
const workoutContentV1: WorkoutPlanContent = {
  version: 1,
  days: [
    {
      dayOfWeek: 0, // Monday
      focus: ["chest"],
      title: "Empuje superior",
      warmupMin: 5,
      cooldownMin: 5,
      exercises: [trainingExercise],
      isRestDay: false,
    },
    {
      dayOfWeek: 6, // Sunday
      focus: [],
      title: "Descanso",
      warmupMin: 0,
      cooldownMin: 0,
      exercises: [],
      isRestDay: true,
    },
  ],
};

function makePlan(content: WorkoutPlanContent): WorkoutPlanRecord {
  return {
    id: "plan-1",
    userId: "user-1",
    name: "Mi plan de fuerza",
    goal: "strength",
    level: "intermediate",
    daysPerWeek: content.days.filter((d) => !d.isRestDay).length,
    status: "active",
    content: content as unknown as Record<string, unknown>,
    startDate: new Date("2026-01-01"),
    endDate: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  };
}

const planV2 = makePlan(workoutContentV2);
const planV1 = makePlan(workoutContentV1);

// ─── Tests — no plan ─────────────────────────────────────────────────────────

describe("DiaryWorkoutWidget — no plan", () => {
  it("renders empty state when plan is null", () => {
    render(<DiaryWorkoutWidget plan={null} selectedDayIndex={0} />);
    expect(screen.getByTestId("diary-workout-widget-empty")).toBeInTheDocument();
  });

  it("renders a link to /planes in empty state", () => {
    render(<DiaryWorkoutWidget plan={null} selectedDayIndex={0} />);
    const link = screen.getByRole("link", { name: /diary.goToPlans/i });
    expect(link).toHaveAttribute("href", "/planes");
  });
});

// ─── Tests — v2 plan ─────────────────────────────────────────────────────────

describe("DiaryWorkoutWidget — v2 plan", () => {
  it("renders the widget with plan name", () => {
    render(<DiaryWorkoutWidget plan={planV2} selectedDayIndex={0} />);
    expect(screen.getByText("Mi plan de fuerza")).toBeInTheDocument();
  });

  it("renders 3 selectable day cards for a 3-day v2 plan", () => {
    render(<DiaryWorkoutWidget plan={planV2} selectedDayIndex={0} />);
    const cards = screen.getAllByTestId("day-card");
    expect(cards).toHaveLength(3);
  });

  it("day cards link to ?workoutDay=0, ?workoutDay=1, ?workoutDay=2", () => {
    render(<DiaryWorkoutWidget plan={planV2} selectedDayIndex={0} />);
    const links = screen.getAllByTestId("day-card");
    expect(links[0]).toHaveAttribute("href", expect.stringContaining("workoutDay=0"));
    expect(links[1]).toHaveAttribute("href", expect.stringContaining("workoutDay=1"));
    expect(links[2]).toHaveAttribute("href", expect.stringContaining("workoutDay=2"));
  });

  it("highlights selected card (selectedDayIndex=0)", () => {
    render(<DiaryWorkoutWidget plan={planV2} selectedDayIndex={0} />);
    const cards = screen.getAllByTestId("day-card");
    expect(cards[0]).toHaveAttribute("data-selected", "true");
    expect(cards[1]).toHaveAttribute("data-selected", "false");
    expect(cards[2]).toHaveAttribute("data-selected", "false");
  });

  it("highlights selected card (selectedDayIndex=2)", () => {
    render(<DiaryWorkoutWidget plan={planV2} selectedDayIndex={2} />);
    const cards = screen.getAllByTestId("day-card");
    expect(cards[0]).toHaveAttribute("data-selected", "false");
    expect(cards[2]).toHaveAttribute("data-selected", "true");
  });

  it("shows the selected day's title below cards (index 0 = Día 1)", () => {
    render(<DiaryWorkoutWidget plan={planV2} selectedDayIndex={0} />);
    expect(screen.getByText("Día 1 · Empuje")).toBeInTheDocument();
  });

  it("shows the selected day's title below cards (index 2 = Día 3)", () => {
    render(<DiaryWorkoutWidget plan={planV2} selectedDayIndex={2} />);
    expect(screen.getByText("Día 3 · Piernas")).toBeInTheDocument();
  });

  it("shows exercise names for selected day", () => {
    render(<DiaryWorkoutWidget plan={planV2} selectedDayIndex={0} />);
    expect(screen.getByText(/Press banca/)).toBeInTheDocument();
  });

  it("falls back to index 0 when selectedDayIndex is out of range", () => {
    render(<DiaryWorkoutWidget plan={planV2} selectedDayIndex={99} />);
    expect(screen.getByText("Día 1 · Empuje")).toBeInTheDocument();
  });

  it("renders session done badge when hasSessionToday=true", () => {
    render(
      <DiaryWorkoutWidget plan={planV2} selectedDayIndex={0} hasSessionToday />
    );
    expect(screen.getByText(/diary.sessionDone/)).toBeInTheDocument();
  });

  it("does not render session badge when hasSessionToday=false", () => {
    render(<DiaryWorkoutWidget plan={planV2} selectedDayIndex={0} />);
    expect(screen.queryByText(/diary.sessionDone/)).not.toBeInTheDocument();
  });

  it("renders link to /gimnasio", () => {
    render(<DiaryWorkoutWidget plan={planV2} selectedDayIndex={0} />);
    const link = screen.getByRole("link", { name: /diary.logWorkout/i });
    expect(link).toHaveAttribute("href", "/gimnasio");
  });

  it("includes selectedDate in card links when provided", () => {
    render(
      <DiaryWorkoutWidget
        plan={planV2}
        selectedDayIndex={0}
        selectedDate="2026-05-29T00:00:00.000Z"
      />
    );
    const cards = screen.getAllByTestId("day-card");
    expect(cards[0]).toHaveAttribute("href", expect.stringContaining("date="));
  });
});

// ─── Tests — v1 plan (legacy) ─────────────────────────────────────────────────

describe("DiaryWorkoutWidget — v1 plan (legacy backward compat)", () => {
  it("renders the widget with plan name for v1 plan", () => {
    render(<DiaryWorkoutWidget plan={planV1} selectedDayIndex={0} />);
    expect(screen.getByText("Mi plan de fuerza")).toBeInTheDocument();
  });

  it("renders training-day cards only (excludes rest days) for v1 plan", () => {
    render(<DiaryWorkoutWidget plan={planV1} selectedDayIndex={0} />);
    // v1 plan has 1 training day + 1 rest day → only 1 card
    const cards = screen.getAllByTestId("day-card");
    expect(cards).toHaveLength(1);
  });

  it("shows selected day title for v1 plan", () => {
    render(<DiaryWorkoutWidget plan={planV1} selectedDayIndex={0} />);
    expect(screen.getByText("Empuje superior")).toBeInTheDocument();
  });
});

// ─── Tests — empty content ────────────────────────────────────────────────────

describe("DiaryWorkoutWidget — empty training days", () => {
  it("renders no-training-days message when days array is empty-like", () => {
    // Create a minimal plan that would result in no selectable days (all rest v1)
    const contentAllRest: WorkoutPlanContent = {
      version: 1,
      days: [
        {
          dayOfWeek: 6,
          focus: [],
          title: "Descanso",
          warmupMin: 0,
          cooldownMin: 0,
          exercises: [],
          isRestDay: true,
        },
      ],
    };
    const plan = makePlan(contentAllRest);
    render(<DiaryWorkoutWidget plan={plan} selectedDayIndex={0} />);
    expect(screen.getByTestId("diary-workout-widget-empty-days")).toBeInTheDocument();
  });
});

// ─── Tests — completedDayIndexes badges ───────────────────────────────────────

describe("DiaryWorkoutWidget — completedDayIndexes badges", () => {
  it("shows checkmark badge on completed card (index 0), not on others", () => {
    render(
      <DiaryWorkoutWidget
        plan={planV2}
        selectedDayIndex={0}
        completedDayIndexes={[0]}
      />
    );
    const cards = screen.getAllByTestId("day-card");
    expect(cards[0].querySelector("[data-testid='day-completed-badge']")).toBeInTheDocument();
    expect(cards[1].querySelector("[data-testid='day-completed-badge']")).not.toBeInTheDocument();
    expect(cards[2].querySelector("[data-testid='day-completed-badge']")).not.toBeInTheDocument();
  });

  it("completed card is still a link (repeat allowed)", () => {
    render(
      <DiaryWorkoutWidget
        plan={planV2}
        selectedDayIndex={0}
        completedDayIndexes={[0]}
      />
    );
    const cards = screen.getAllByTestId("day-card");
    expect(cards[0].tagName.toLowerCase()).toBe("a");
  });

  it("renders no badges when completedDayIndexes is empty", () => {
    render(
      <DiaryWorkoutWidget
        plan={planV2}
        selectedDayIndex={0}
        completedDayIndexes={[]}
      />
    );
    expect(screen.queryByTestId("day-completed-badge")).not.toBeInTheDocument();
  });

  it("renders no badges when completedDayIndexes is omitted (default)", () => {
    render(<DiaryWorkoutWidget plan={planV2} selectedDayIndex={0} />);
    expect(screen.queryByTestId("day-completed-badge")).not.toBeInTheDocument();
  });

  it("handles multiple completed days", () => {
    render(
      <DiaryWorkoutWidget
        plan={planV2}
        selectedDayIndex={0}
        completedDayIndexes={[0, 2]}
      />
    );
    const cards = screen.getAllByTestId("day-card");
    expect(cards[0].querySelector("[data-testid='day-completed-badge']")).toBeInTheDocument();
    expect(cards[1].querySelector("[data-testid='day-completed-badge']")).not.toBeInTheDocument();
    expect(cards[2].querySelector("[data-testid='day-completed-badge']")).toBeInTheDocument();
  });
});

// ─── Tests — "Marcar como completado" CTA ─────────────────────────────────────

describe("DiaryWorkoutWidget — mark complete CTA", () => {
  beforeEach(() => {
    mockRefresh.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("renders the mark-complete button in detail view for a non-rest day", () => {
    render(<DiaryWorkoutWidget plan={planV2} selectedDayIndex={0} />);
    expect(screen.getByTestId("mark-complete-btn")).toBeInTheDocument();
  });

  it("does not render mark-complete button when no plan", () => {
    render(<DiaryWorkoutWidget plan={null} selectedDayIndex={0} />);
    expect(screen.queryByTestId("mark-complete-btn")).not.toBeInTheDocument();
  });

  it("calls fetch POST to correct URL with planDayIndex on click", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", mockFetch);

    render(<DiaryWorkoutWidget plan={planV2} selectedDayIndex={1} />);
    const btn = screen.getByTestId("mark-complete-btn");
    fireEvent.click(btn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/workout-plans/plan-1/log`,
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({ "Content-Type": "application/json" }),
          body: JSON.stringify({ planDayIndex: 1 }),
        })
      );
    });
  });

  it("calls router.refresh() after successful POST", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));

    render(<DiaryWorkoutWidget plan={planV2} selectedDayIndex={0} />);
    fireEvent.click(screen.getByTestId("mark-complete-btn"));

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalledOnce();
    });
  });

  it("disables button while request is pending", async () => {
    let resolveFetch!: (v: unknown) => void;
    const pendingPromise = new Promise((resolve) => { resolveFetch = resolve; });
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(pendingPromise));

    render(<DiaryWorkoutWidget plan={planV2} selectedDayIndex={0} />);
    const btn = screen.getByTestId("mark-complete-btn");
    fireEvent.click(btn);

    // Button should be disabled while request is in-flight
    await waitFor(() => {
      expect(btn).toBeDisabled();
    });

    // Clean up
    resolveFetch({ ok: true });
  });

  it("does not call router.refresh() when fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    render(<DiaryWorkoutWidget plan={planV2} selectedDayIndex={0} />);
    fireEvent.click(screen.getByTestId("mark-complete-btn"));

    await waitFor(() => {
      expect(mockRefresh).not.toHaveBeenCalled();
    });
  });
});
