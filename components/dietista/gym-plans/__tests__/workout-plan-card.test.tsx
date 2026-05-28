import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WorkoutPlanCard } from "../workout-plan-card";
import type { WorkoutPlanRecord } from "@/lib/workout-plan-service";

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

const activePlan: WorkoutPlanRecord = {
  id: "plan-1",
  userId: "user-1",
  name: "Mi plan de fuerza",
  goal: "strength",
  level: "intermediate",
  daysPerWeek: 4,
  status: "active",
  content: {},
  startDate: new Date("2026-01-01"),
  endDate: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

const completedPlan: WorkoutPlanRecord = {
  ...activePlan,
  id: "plan-2",
  status: "completed",
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("WorkoutPlanCard", () => {
  it("renders the plan name", () => {
    render(<WorkoutPlanCard plan={activePlan} />);
    expect(screen.getByText("Mi plan de fuerza")).toBeInTheDocument();
  });

  it("renders a link to the plan detail", () => {
    render(<WorkoutPlanCard plan={activePlan} />);
    const link = screen.getByRole("link", { name: /viewPlan/i });
    expect(link).toHaveAttribute("href", "/gym-plans/plan-1");
  });

  it("renders status badge for active plan", () => {
    render(<WorkoutPlanCard plan={activePlan} />);
    expect(screen.getByText(/status.active/)).toBeInTheDocument();
  });

  it("renders status badge for completed plan", () => {
    render(<WorkoutPlanCard plan={completedPlan} />);
    expect(screen.getByText(/status.completed/)).toBeInTheDocument();
  });

  it("renders daysPerWeek info", () => {
    render(<WorkoutPlanCard plan={activePlan} />);
    expect(screen.getByText(/4/)).toBeInTheDocument();
  });

  it("has workout-plan-card test id", () => {
    render(<WorkoutPlanCard plan={activePlan} />);
    expect(screen.getByTestId("workout-plan-card")).toBeInTheDocument();
  });
});
