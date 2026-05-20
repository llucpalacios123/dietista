import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StreakWeek } from "@/components/dietista/atoms/streak-week";

describe("StreakWeek", () => {
  it("should render 7 day labels", () => {
    render(<StreakWeek days={[false, false, false, false, false, false, false]} />);
    const days = ["L", "M", "X", "J", "V", "S", "D"];
    for (const day of days) {
      expect(screen.getByText(day)).toBeInTheDocument();
    }
  });

  it("should show completed count", () => {
    render(<StreakWeek days={[true, true, true, false, false, false, false]} />);
    expect(screen.getByText("3/7")).toBeInTheDocument();
  });

  it("should highlight completed days with brand color", () => {
    render(<StreakWeek days={[true, false, false, false, false, false, false]} />);
    const firstDay = screen.getByLabelText("L: completed");
    expect(firstDay).toHaveClass("bg-[var(--brand-500)]");
  });

  it("should highlight current day with ring", () => {
    render(
      <StreakWeek
        days={[false, false, false, false, false, false, false]}
        currentDay={2}
      />
    );
    const currentDay = screen.getByLabelText("X: pending");
    expect(currentDay).toHaveClass("ring-2");
  });

  it("should show all 7 days as pending when none completed", () => {
    render(<StreakWeek days={[false, false, false, false, false, false, false]} />);
    expect(screen.getByText("0/7")).toBeInTheDocument();
  });

  it("should show all 7 days as completed when all true", () => {
    render(<StreakWeek days={[true, true, true, true, true, true, true]} />);
    expect(screen.getByText("7/7")).toBeInTheDocument();
  });
});
