import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkoutPlanReview } from "../workout-plan-review";
import type { WorkoutPlanContent } from "@/lib/schemas";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const content: WorkoutPlanContent = {
  version: 1,
  days: [
    {
      dayOfWeek: 0,
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
      dayOfWeek: 6,
      focus: ["cardio"],
      title: "Descanso",
      warmupMin: 0,
      cooldownMin: 0,
      exercises: [],
      isRestDay: true,
    },
  ],
  weeklyVolumeNotes: "Volumen moderado para principiantes",
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("WorkoutPlanReview", () => {
  it("renders the plan name", () => {
    render(
      <WorkoutPlanReview
        content={content}
        planName="Mi plan test"
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByText("Mi plan test")).toBeInTheDocument();
  });

  it("renders training day count", () => {
    render(
      <WorkoutPlanReview
        content={content}
        planName="Mi plan test"
        onConfirm={vi.fn()}
      />
    );
    // 1 training day
    expect(screen.getByText(/1.*trainingDays/i)).toBeInTheDocument();
  });

  it("renders weekly volume notes when present", () => {
    render(
      <WorkoutPlanReview
        content={content}
        planName="Mi plan test"
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByText("Volumen moderado para principiantes")).toBeInTheDocument();
  });

  it("renders all days", () => {
    render(
      <WorkoutPlanReview
        content={content}
        planName="Mi plan test"
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getAllByTestId("workout-day-view")).toHaveLength(2);
  });

  it("calls onConfirm when confirm button is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <WorkoutPlanReview
        content={content}
        planName="Mi plan test"
        onConfirm={onConfirm}
      />
    );
    await user.click(screen.getByTestId("btn-confirm-plan"));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("renders back button when onBack is provided", () => {
    render(
      <WorkoutPlanReview
        content={content}
        planName="Mi plan test"
        onConfirm={vi.fn()}
        onBack={vi.fn()}
      />
    );
    expect(screen.getByText(/wizard.back/)).toBeInTheDocument();
  });

  it("disables confirm button when isLoading=true", () => {
    render(
      <WorkoutPlanReview
        content={content}
        planName="Mi plan test"
        onConfirm={vi.fn()}
        isLoading
      />
    );
    expect(screen.getByTestId("btn-confirm-plan")).toBeDisabled();
  });

  it("renders with test id workout-plan-review", () => {
    render(
      <WorkoutPlanReview
        content={content}
        planName="Mi plan test"
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByTestId("workout-plan-review")).toBeInTheDocument();
  });
});
