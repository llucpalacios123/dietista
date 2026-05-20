import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sparkline } from "@/components/dietista/atoms/sparkline";

describe("Sparkline", () => {
  it("should render 'Sin datos' when less than 2 data points", () => {
    render(<Sparkline data={[42]} width={80} height={32} />);
    expect(screen.getByText("Sin datos")).toBeInTheDocument();
  });

  it("should render an SVG with path for valid data", () => {
    render(<Sparkline data={[70, 71, 69, 72, 70]} width={80} height={32} />);
    const svg = screen.getByLabelText("Trend sparkline");
    expect(svg).toBeInTheDocument();
    expect(svg.querySelector("path")).toBeInTheDocument();
  });

  it("should use custom width and height", () => {
    render(<Sparkline data={[1, 2, 3]} width={120} height={48} />);
    const svg = screen.getByLabelText("Trend sparkline");
    expect(svg).toHaveAttribute("width", "120");
    expect(svg).toHaveAttribute("height", "48");
  });

  it("should use custom aria label", () => {
    render(
      <Sparkline
        data={[1, 2, 3]}
        width={80}
        height={32}
        ariaLabel="Peso semanal"
      />
    );
    expect(screen.getByLabelText("Peso semanal")).toBeInTheDocument();
  });

  it("should generate correct SVG path points", () => {
    render(<Sparkline data={[10, 20, 30]} width={100} height={50} />);
    const path = screen.getByLabelText("Trend sparkline").querySelector("path");
    expect(path).toHaveAttribute("d");
    const d = path?.getAttribute("d") ?? "";
    expect(d).toContain("M");
    expect(d).toContain("L");
  });
});
