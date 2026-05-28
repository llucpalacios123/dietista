import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WorkoutPlanList } from "../workout-plan-list";
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
  id: "plan-active",
  userId: "user-1",
  name: "Plan Activo",
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
  id: "plan-completed",
  name: "Plan Anterior",
  status: "completed",
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("WorkoutPlanList", () => {
  it("renders empty state when no plans", () => {
    render(<WorkoutPlanList plans={[]} />);
    expect(screen.getByTestId("workout-plan-list-empty")).toBeInTheDocument();
  });

  it("renders link to create new plan in empty state", () => {
    render(<WorkoutPlanList plans={[]} />);
    const link = screen.getByRole("link", { name: /newPlan/i });
    expect(link).toHaveAttribute("href", "/gym-plans/new");
  });

  it("renders plan list when plans exist", () => {
    render(<WorkoutPlanList plans={[activePlan]} />);
    expect(screen.getByTestId("workout-plan-list")).toBeInTheDocument();
  });

  it("renders active plan in hero section", () => {
    render(<WorkoutPlanList plans={[activePlan, completedPlan]} />);
    expect(screen.getByText("Plan Activo")).toBeInTheDocument();
  });

  it("renders completed plans in past section", () => {
    render(<WorkoutPlanList plans={[activePlan, completedPlan]} />);
    expect(screen.getByText("Plan Anterior")).toBeInTheDocument();
  });

  it("renders create new plan link when plans exist", () => {
    render(<WorkoutPlanList plans={[activePlan]} />);
    // Multiple links, find the one with /gym-plans/new
    const links = screen.getAllByRole("link");
    const createLink = links.find((l) => l.getAttribute("href") === "/gym-plans/new");
    expect(createLink).toBeDefined();
  });
});
