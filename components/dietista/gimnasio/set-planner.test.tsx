import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetPlanner, type SetPlannerProps } from "./set-planner";

// ─── Mock next-intl ───────────────────────────────────────────────────────

vi.mock("next-intl", () => ({
  useTranslations: (_namespace: string) => {
    const keys: Record<string, string> = {
      setCount: "Sets",
      varied: "Varied",
      reps: "Reps",
      weight: "Weight",
      optional: "optional",
      variedSets: "Varied sets",
      confirmPlan: "Confirm Plan",
      cancel: "Cancel",
      saving: "Saving...",
    };
    return (key: string, params?: Record<string, unknown>) => {
      if (params) return key;
      return keys[key] ?? key;
    };
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────

function makeProps(overrides: Partial<SetPlannerProps> = {}): SetPlannerProps {
  return {
    exerciseName: "Bench Press",
    muscleGroup: "chest",
    sessionId: "session-1",
    onPlanned: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe("SetPlanner — setCount string state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1.1 setCount field allows empty string — Confirm Plan button is disabled", async () => {
    const user = userEvent.setup();
    render(<SetPlanner {...makeProps()} />);

    const input = screen.getByDisplayValue("3");
    await user.clear(input);

    expect(input).toHaveValue(null); // number input cleared → null in jsdom
    const button = screen.getByRole("button", { name: /confirm plan/i });
    expect(button).toBeDisabled();
  });

  it("1.2 setCount allows clearing and retyping '4' — button enabled", async () => {
    const user = userEvent.setup();
    render(<SetPlanner {...makeProps()} />);

    // Fill reps so form is valid except for setCount
    const repsInput = screen.getAllByPlaceholderText(/^8$/i)[0] ?? screen.getByLabelText(/reps/i);
    // Ensure reps input is filled
    const repsEl = repsInput;
    await user.type(repsEl, "8");

    const setCountInput = screen.getByDisplayValue("3");
    await user.clear(setCountInput);
    await user.type(setCountInput, "4");

    const button = screen.getByRole("button", { name: /confirm plan/i });
    expect(button).not.toBeDisabled();
  });

  it("1.3 setCount '0' disables Confirm Plan button", async () => {
    const user = userEvent.setup();
    render(<SetPlanner {...makeProps()} />);

    // Fill reps so form would otherwise be valid
    const allInputs = screen.getAllByRole("spinbutton");
    // setCount is first input, reps is second
    const repsInput = allInputs[1];
    await user.type(repsInput, "8");

    const setCountInput = allInputs[0];
    await user.clear(setCountInput);
    await user.type(setCountInput, "0");

    const button = screen.getByRole("button", { name: /confirm plan/i });
    expect(button).toBeDisabled();
  });

  it("1.4 setCount '20' — onPlanned called with exactly 20 sets", async () => {
    const onPlanned = vi.fn();
    const user = userEvent.setup();

    // Mock fetch for the submit
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        sets: Array.from({ length: 20 }, (_, i) => ({ id: `set-${i + 1}`, setNumber: i + 1 })),
      }),
    } as Response);

    render(<SetPlanner {...makeProps({ onPlanned })} />);

    const allInputs = screen.getAllByRole("spinbutton");
    const setCountInput = allInputs[0];
    const repsInput = allInputs[1];

    await user.clear(setCountInput);
    await user.type(setCountInput, "20");
    await user.type(repsInput, "8");

    const button = screen.getByRole("button", { name: /confirm plan/i });
    expect(button).not.toBeDisabled();
    await user.click(button);

    expect(globalThis.fetch).toHaveBeenCalledOnce();
    const body = JSON.parse((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string);
    expect(body.sets).toHaveLength(20);
  });
});
