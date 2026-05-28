import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const mockT = Object.assign(
  (key: string) => key,
  {
    raw: (key: string) => {
      if (key === "mealTypes") {
        return { dinner: "Dinner", breakfast: "Breakfast", lunch: "Lunch", snack: "Snack", mid_morning: "Mid morning" };
      }
      return {};
    },
  }
);

vi.mock("next-intl", () => ({
  useTranslations: () => mockT,
}));

vi.mock("@/actions/diary-new", () => ({
  toggleMealCompleted: vi.fn(),
  getSuggestion: vi.fn(),
  saveSuggestedMeal: vi.fn(),
}));

vi.mock("@/components/dietista/ai-chat-modal", () => ({
  AiChatModal: () => null,
}));

import { TodaysMeals } from "@/components/dietista/todays-meals";
import type { PlannedMeal } from "@/lib/planned-meal-mapper";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const meal: PlannedMeal = {
  id: "meal-1",
  name: "Chicken",
  mealType: "dinner",
  calories: 350,
  protein: 30,
  carbs: 20,
  fat: 10,
  description: "",
  instructions: "",
  ingredients: [],
};

const baseProps = {
  meals: [meal],
  hasActivePlan: true,
  diaryByType: {},
  dateISO: new Date().toISOString(),
  targets: { calories: 2000, protein: 150, carbs: 250, fat: 65 },
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("TodaysMeals — isReadOnly", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("isReadOnly=false → Done button is present (markDone)", () => {
    render(<TodaysMeals {...baseProps} isReadOnly={false} />);
    // The Done button has aria-label t("markDone") which returns "markDone" in our mock
    expect(screen.getByRole("button", { name: "markDone" })).toBeInTheDocument();
  });

  it("isReadOnly=false → AI button is present (askAI)", () => {
    render(<TodaysMeals {...baseProps} isReadOnly={false} />);
    expect(screen.getByRole("button", { name: "askAI" })).toBeInTheDocument();
  });

  it("isReadOnly=true → Done button (markDone) is absent from DOM", () => {
    render(<TodaysMeals {...baseProps} isReadOnly={true} />);
    expect(screen.queryByRole("button", { name: "markDone" })).not.toBeInTheDocument();
  });

  it("isReadOnly=true → AI button (askAI) is absent from DOM", () => {
    render(<TodaysMeals {...baseProps} isReadOnly={true} />);
    expect(screen.queryByRole("button", { name: "askAI" })).not.toBeInTheDocument();
  });

  it("isReadOnly=true → read-only badge is visible (readOnly key)", () => {
    render(<TodaysMeals {...baseProps} isReadOnly={true} />);
    // Our mock returns the key as text
    expect(screen.getByText("readOnly")).toBeInTheDocument();
  });

  it("isReadOnly=false → read-only badge is absent", () => {
    render(<TodaysMeals {...baseProps} isReadOnly={false} />);
    expect(screen.queryByText("readOnly")).not.toBeInTheDocument();
  });
});
