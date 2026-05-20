import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DayPill } from "@/components/dietista/atoms/day-pill";

describe("DayPill", () => {
  it("should render the day label", () => {
    render(<DayPill day="Lun" />);
    expect(screen.getByText("Lun")).toBeInTheDocument();
  });

  it("should have active styling when active is true", () => {
    render(<DayPill day="Mar" active />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("should not have active styling when active is false", () => {
    render(<DayPill day="Mié" />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("should call onClick when clicked", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<DayPill day="Jue" onClick={onClick} />);
    await user.click(screen.getByText("Jue"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("should show data indicator dot when hasData is true and not active", () => {
    render(<DayPill day="Vie" hasData />);
    const button = screen.getByRole("button");
    const dot = button.querySelector("span");
    expect(dot).toBeInTheDocument();
  });

  it("should not show data indicator when active", () => {
    render(<DayPill day="Sáb" active hasData />);
    const button = screen.getByRole("button");
    const dot = button.querySelector("span");
    expect(dot).not.toBeInTheDocument();
  });
});
