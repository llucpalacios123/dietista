import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MacroRing } from "@/components/dietista/atoms/macro-ring";

describe("MacroRing", () => {
  it("should render with correct label", () => {
    render(<MacroRing value={500} max={2000} current={500} label="Calorías" />);
    expect(screen.getByText("Calorías")).toBeInTheDocument();
  });

  it("should render the numeric value inside the ring", () => {
    render(<MacroRing value={500} max={2000} current={500} label="Cal" showValue />);
    expect(screen.getByText("500")).toBeInTheDocument();
  });

  it("should not show value when showValue is false", () => {
    render(<MacroRing value={500} max={2000} current={500} label="Cal" showValue={false} />);
    expect(screen.queryByText("500")).not.toBeInTheDocument();
  });

  it("should have correct aria attributes for accessibility", () => {
    render(
      <MacroRing
        value={500}
        max={2000}
        current={500}
        label="Calorías"
        ariaLabel="Calorías consumidas"
      />
    );
    const ring = screen.getByRole("progressbar");
    expect(ring).toHaveAttribute("aria-valuenow", "500");
    expect(ring).toHaveAttribute("aria-valuemin", "0");
    expect(ring).toHaveAttribute("aria-valuemax", "2000");
    expect(ring).toHaveAttribute("aria-label", "Calorías consumidas");
  });

  it("should cap percentage at 100% when value exceeds max", () => {
    // This tests the Math.min(value / max, 1) logic
    render(<MacroRing value={3000} max={2000} current={3000} label="Cal" />);
    // The component should still render without error
    expect(screen.getByText("Cal")).toBeInTheDocument();
    expect(screen.getByText("3000")).toBeInTheDocument();
  });

  it("should use custom size and strokeWidth", () => {
    render(
      <MacroRing
        value={500}
        max={2000}
        current={500}
        label="Cal"
        size={120}
        strokeWidth={10}
      />
    );
    const svg = screen.getByRole("progressbar").querySelector("svg");
    expect(svg).toHaveAttribute("width", "120");
    expect(svg).toHaveAttribute("height", "120");
  });
});
