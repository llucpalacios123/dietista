import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkoutPreferencesForm } from "../workout-preferences-form";
import type { WorkoutPreferences } from "@/lib/schemas";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// MuscleGroup enum mock
vi.mock("@prisma/client", () => ({
  MuscleGroup: {
    legs: "legs",
    back: "back",
    chest: "chest",
    shoulders: "shoulders",
    arms: "arms",
    core: "core",
    cardio: "cardio",
  },
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("WorkoutPreferencesForm", () => {
  it("renders the form", () => {
    render(<WorkoutPreferencesForm onSubmit={vi.fn()} />);
    expect(screen.getByTestId("workout-preferences-form")).toBeInTheDocument();
  });

  it("renders plan name input", () => {
    render(<WorkoutPreferencesForm onSubmit={vi.fn()} />);
    expect(screen.getByTestId("input-plan-name")).toBeInTheDocument();
  });

  it("renders goal buttons", () => {
    render(<WorkoutPreferencesForm onSubmit={vi.fn()} />);
    expect(screen.getByTestId("goal-strength")).toBeInTheDocument();
    expect(screen.getByTestId("goal-endurance")).toBeInTheDocument();
    expect(screen.getByTestId("goal-hypertrophy")).toBeInTheDocument();
  });

  it("renders level buttons", () => {
    render(<WorkoutPreferencesForm onSubmit={vi.fn()} />);
    expect(screen.getByTestId("level-beginner")).toBeInTheDocument();
    expect(screen.getByTestId("level-intermediate")).toBeInTheDocument();
    expect(screen.getByTestId("level-advanced")).toBeInTheDocument();
  });

  it("renders days per week slider", () => {
    render(<WorkoutPreferencesForm onSubmit={vi.fn()} />);
    expect(screen.getByTestId("input-days-per-week")).toBeInTheDocument();
  });

  it("renders submit button", () => {
    render(<WorkoutPreferencesForm onSubmit={vi.fn()} />);
    expect(screen.getByTestId("btn-submit-preferences")).toBeInTheDocument();
  });

  it("calls onSubmit with valid preferences on form submit", async () => {
    const onSubmit = vi.fn();
    render(<WorkoutPreferencesForm onSubmit={onSubmit} />);

    fireEvent.submit(screen.getByTestId("workout-preferences-form"));

    expect(onSubmit).toHaveBeenCalledOnce();
    const prefs: WorkoutPreferences = onSubmit.mock.calls[0][0];
    expect(prefs.goal).toBe("strength");
    expect(prefs.level).toBe("intermediate");
    expect(prefs.daysPerWeek).toBe(3);
    expect(prefs.focusGroups.length).toBeGreaterThan(0);
    expect(prefs.equipment.length).toBeGreaterThan(0);
  });

  it("shows error when no focus groups selected", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<WorkoutPreferencesForm onSubmit={onSubmit} />);

    // Deselect all focus groups (default: legs, back, chest)
    await user.click(screen.getByTestId("focus-legs"));
    await user.click(screen.getByTestId("focus-back"));
    await user.click(screen.getByTestId("focus-chest"));

    fireEvent.submit(screen.getByTestId("workout-preferences-form"));

    expect(screen.getByTestId("form-error")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows error when no equipment selected", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<WorkoutPreferencesForm onSubmit={onSubmit} />);

    // Deselect default equipment (gym)
    await user.click(screen.getByTestId("equipment-gym"));

    fireEvent.submit(screen.getByTestId("workout-preferences-form"));

    expect(screen.getByTestId("form-error")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("renders back button when onBack is provided", () => {
    render(<WorkoutPreferencesForm onSubmit={vi.fn()} onBack={vi.fn()} />);
    // Back button renders from translation key "wizard.back"
    expect(screen.getByText(/wizard.back/)).toBeInTheDocument();
  });

  it("does not render back button when onBack is not provided", () => {
    render(<WorkoutPreferencesForm onSubmit={vi.fn()} />);
    expect(screen.queryByText(/wizard.back/)).not.toBeInTheDocument();
  });

  it("calls onBack when back button is clicked", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<WorkoutPreferencesForm onSubmit={vi.fn()} onBack={onBack} />);

    await user.click(screen.getByText(/wizard.back/));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("uses initial values when provided", () => {
    render(
      <WorkoutPreferencesForm
        onSubmit={vi.fn()}
        initialValues={{ name: "Plan personalizado", goal: "hypertrophy", level: "advanced" }}
      />
    );
    const nameInput = screen.getByTestId("input-plan-name") as HTMLInputElement;
    expect(nameInput.value).toBe("Plan personalizado");
  });
});
