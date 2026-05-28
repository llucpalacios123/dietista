import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// ─── T-09: TodaysMeals — singleton AiChatModal + activeSlotId state ───────────

// Polyfill scrollIntoView for jsdom
Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
  value: vi.fn(),
  writable: true,
  configurable: true,
});

const mockT = Object.assign(
  (key: string) => key,
  { raw: (key: string) => (key === "mealTypes" ? {} : {}) }
);

vi.mock("next-intl", () => ({
  useTranslations: () => mockT,
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/actions/diary-new", () => ({
  toggleMealCompleted: vi.fn().mockResolvedValue({ success: true, completed: true }),
  getSuggestion: vi.fn().mockResolvedValue({ success: false, error: "ai_parse_error" }),
  saveSuggestedMeal: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/hooks/use-visual-viewport", () => ({
  useVisualViewport: vi.fn(() => ({ height: 600, offsetTop: 0 })),
}));

import { TodaysMeals } from "@/components/dietista/todays-meals";
import type { PlannedMeal } from "@/lib/planned-meal-mapper";

const makeMeal = (overrides: Partial<PlannedMeal> = {}): PlannedMeal => ({
  id: `meal-${Math.random().toString(36).slice(2)}`,
  mealType: "lunch",
  name: "Ensalada César",
  description: "Clásica ensalada césar",
  calories: 400,
  protein: 20,
  carbs: 30,
  fat: 15,
  ingredients: [],
  instructions: "",
  ...overrides,
});

const defaultProps = {
  meals: [],
  hasActivePlan: true,
  diaryByType: {},
  dateISO: "2024-01-15T00:00:00.000Z",
  targets: { calories: 2000, protein: 150, carbs: 250, fat: 65 },
};

describe("TodaysMeals — T-09 (singleton AiChatModal)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders zero [role=dialog] when no slot is active", () => {
    const meals = [
      makeMeal({ id: "m1", mealType: "breakfast" }),
      makeMeal({ id: "m2", mealType: "lunch" }),
      makeMeal({ id: "m3", mealType: "dinner" }),
    ];

    render(<TodaysMeals {...defaultProps} meals={meals} />);

    const dialogs = screen.queryAllByRole("dialog");
    expect(dialogs).toHaveLength(0);
  });

  it("renders exactly one [role=dialog] when a slot is active", () => {
    const meals = [
      makeMeal({ id: "m1", mealType: "breakfast" }),
      makeMeal({ id: "m2", mealType: "lunch" }),
      makeMeal({ id: "m3", mealType: "dinner" }),
    ];

    render(<TodaysMeals {...defaultProps} meals={meals} />);

    // Click the AI button on the first meal card
    const aiButtons = screen.getAllByLabelText("askAI");
    fireEvent.click(aiButtons[0]);

    const dialogs = screen.queryAllByRole("dialog");
    expect(dialogs).toHaveLength(1);
  });

  it("does not multiply dialogs when multiple meals exist and one is opened", () => {
    const meals = [
      makeMeal({ id: "m1", mealType: "breakfast" }),
      makeMeal({ id: "m2", mealType: "lunch" }),
      makeMeal({ id: "m3", mealType: "dinner" }),
      makeMeal({ id: "m4", mealType: "snack" }),
    ];

    render(<TodaysMeals {...defaultProps} meals={meals} />);

    // Open AI for lunch slot
    const aiButtons = screen.getAllByLabelText("askAI");
    fireEvent.click(aiButtons[1]);

    // Must still be exactly ONE dialog, not 4
    expect(screen.queryAllByRole("dialog")).toHaveLength(1);
  });
});
