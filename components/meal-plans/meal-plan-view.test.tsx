import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MealPlanView,
  type MealData,
  type MealPlanData,
} from "@/components/meal-plans/meal-plan-view";

// ─── Mock i18n navigation ─────────────────────────────────────────────────

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    React.createElement("a", { href, className }, children),
  usePathname: () => "/",
}));

// ─── Mock next-intl ───────────────────────────────────────────────────────

vi.mock("next-intl", () => ({
  useTranslations: (_namespace: string) => {
    return (key: string) => {
      const parts = key.split(".");
      return parts.length > 1 ? parts[parts.length - 1] : key;
    };
  },
  useLocale: () => "es",
}));

// ─── Helpers ──────────────────────────────────────────────────────────────

function createMeal(overrides: Partial<MealData> = {}): MealData {
  return {
    id: "meal-1",
    dayOfWeek: 0,
    mealType: "breakfast",
    name: "Tortilla de patatas",
    description: "Tortilla española con cebolla",
    calories: 450,
    protein: 20,
    carbs: 35,
    fat: 25,
    ingredients: [
      { name: "huevos", quantity: 3, unit: "unidades" },
      { name: "patatas", quantity: 200, unit: "g" },
    ],
    instructions: "Batir huevos, añadir patatas cortadas",
    ...overrides,
  };
}

function createPlan(meals: MealData[] = []): MealPlanData {
  return {
    id: "plan-1",
    startDate: "2026-05-25",
    endDate: "2026-05-31",
    status: "active",
    totalCalories: null,
    meals,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe("MealPlanView — collapsible meal cards", () => {
  it("renders meal card in collapsed state by default", () => {
    const meal = createMeal();
    const plan = createPlan([meal]);

    render(<MealPlanView plan={plan} />);

    // There are 7 days, each has a "breakfast" label
    const breakfastLabels = screen.getAllByText("breakfast");
    expect(breakfastLabels.length).toBe(7);

    // A toggle button exists (only for actual meals, not empty slots)
    const toggles = screen.getAllByRole("button", { expanded: false });
    expect(toggles.length).toBe(1); // only one actual meal

    // Meal name is visible in the collapsed state
    expect(screen.getByText("Tortilla de patatas")).toBeInTheDocument();

    // Expanded details NOT visible
    expect(
      screen.queryByText("Tortilla española con cebolla")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("huevos")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Batir huevos, añadir patatas cortadas")
    ).not.toBeInTheDocument();
  });

  it("expands meal card on click and shows full detail", async () => {
    const meal = createMeal();
    const plan = createPlan([meal]);
    const user = userEvent.setup();

    render(<MealPlanView plan={plan} />);

    // Click the single toggle button to expand
    const toggle = screen.getByRole("button", { expanded: false });
    await user.click(toggle);

    // aria-expanded now true
    expect(screen.getByRole("button", { expanded: true })).toBeInTheDocument();

    // Description visible
    expect(
      screen.getByText("Tortilla española con cebolla")
    ).toBeInTheDocument();

    // Macros bar visible (appears in weekly card, day header, and expanded view)
    expect(screen.getAllByText(/450 kcal/).length).toBeGreaterThanOrEqual(3);

    // Ingredient rows visible
    expect(screen.getByText("huevos")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("unidades")).toBeInTheDocument();
    expect(screen.getByText("patatas")).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();
    expect(screen.getByText("g")).toBeInTheDocument();

    // Instructions visible
    expect(
      screen.getByText("Batir huevos, añadir patatas cortadas")
    ).toBeInTheDocument();
  });

  it("collapses back on second click", async () => {
    const meal = createMeal();
    const plan = createPlan([meal]);
    const user = userEvent.setup();

    render(<MealPlanView plan={plan} />);

    const toggle = screen.getByRole("button", { expanded: false });
    await user.click(toggle); // expand
    await user.click(toggle); // collapse

    // Back to collapsed
    expect(screen.getByRole("button", { expanded: false })).toBeInTheDocument();
    expect(
      screen.queryByText("Tortilla española con cebolla")
    ).not.toBeInTheDocument();
  });

  it("hides instructions section when instructions is empty", async () => {
    const meal = createMeal({ instructions: "" });
    const plan = createPlan([meal]);
    const user = userEvent.setup();

    render(<MealPlanView plan={plan} />);
    await user.click(screen.getByRole("button", { expanded: false }));

    // Description and ingredients should be visible
    expect(
      screen.getByText("Tortilla española con cebolla")
    ).toBeInTheDocument();
    expect(screen.getByText("huevos")).toBeInTheDocument();

    // The instructions text area should NOT be present
    // Since instructions="" (empty), there should be no instructions label/element
    expect(screen.queryByText("instructions")).not.toBeInTheDocument();
  });

  it("renders placeholder when ingredients array is empty", async () => {
    const meal = createMeal({ ingredients: [] });
    const plan = createPlan([meal]);
    const user = userEvent.setup();

    render(<MealPlanView plan={plan} />);
    await user.click(screen.getByRole("button", { expanded: false }));

    // Placeholder text visible (mocked i18n returns "noIngredients")
    expect(screen.getByText("noIngredients")).toBeInTheDocument();

    // No ingredient table rendered
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("handles ingredients with missing quantity and unit", async () => {
    const meal = createMeal({
      ingredients: [
        { name: "sal", quantity: undefined, unit: undefined },
        { name: "pimienta" },
      ],
    });
    const plan = createPlan([meal]);
    const user = userEvent.setup();

    render(<MealPlanView plan={plan} />);
    await user.click(screen.getByRole("button", { expanded: false }));

    // Both ingredient names visible
    expect(screen.getByText("sal")).toBeInTheDocument();
    expect(screen.getByText("pimienta")).toBeInTheDocument();

    // Table has header + 2 data rows
    const rows = screen.getAllByRole("row");
    expect(rows.length).toBe(3);

    // "sal" row: empty quantity and unit cells
    const salRow = rows[1];
    expect(salRow).toHaveTextContent("sal");
    const salCells = salRow.querySelectorAll("td");
    expect(salCells[1].textContent).toBe("");
    expect(salCells[2].textContent).toBe("");
  });

  it("no toggle button for empty meal slots", () => {
    // Plan with no meals
    const plan = createPlan([]);
    render(<MealPlanView plan={plan} />);

    // 35 empty slots (7 days × 5 meal types) rendered as "no meal planned"
    const noMealTexts = screen.getAllByText("noMealPlanned");
    expect(noMealTexts.length).toBe(35);

    // No toggle buttons for empty slots
    expect(
      screen.queryByRole("button", { expanded: false })
    ).not.toBeInTheDocument();
  });

  it("each meal has its own independent collapse state", async () => {
    const meal1 = createMeal({
      id: "meal-1",
      dayOfWeek: 0,
      mealType: "breakfast",
    });
    const meal2 = createMeal({
      id: "meal-2",
      dayOfWeek: 0,
      mealType: "lunch",
      name: "Ensalada César",
      description: "Ensalada con pollo y parmesano",
      calories: 380,
      protein: 30,
      carbs: 15,
      fat: 22,
      ingredients: [{ name: "pollo", quantity: 150, unit: "g" }],
      instructions: "Mezclar todos los ingredientes",
    });
    const plan = createPlan([meal1, meal2]);
    const user = userEvent.setup();

    render(<MealPlanView plan={plan} />);

    // Both meals collapsed
    const toggles = screen.getAllByRole("button", { expanded: false });
    expect(toggles.length).toBe(2);

    // Expand first meal
    await user.click(toggles[0]);

    // 1 expanded, 1 still collapsed
    expect(screen.getAllByRole("button", { expanded: true }).length).toBe(1);
    expect(screen.getAllByRole("button", { expanded: false }).length).toBe(1);

    // First meal details visible
    expect(
      screen.getByText("Tortilla española con cebolla")
    ).toBeInTheDocument();

    // Second meal details NOT visible
    expect(
      screen.queryByText("Ensalada con pollo y parmesano")
    ).not.toBeInTheDocument();
  });

  it("renders mid_morning meal type with correct label", () => {
    // Verifies the seed-data shape: mid_morning meal renders correctly
    const meal = createMeal({
      id: "mid-morning-meal",
      dayOfWeek: 0,
      mealType: "mid_morning",
      name: "Fruta y frutos secos",
      description: "Manzana y almendras",
      calories: 210,
      protein: 6,
      carbs: 30,
      fat: 9,
      ingredients: [
        { name: "manzana", quantity: 150, unit: "g" },
        { name: "almendras naturales", quantity: 20, unit: "g" },
      ],
      instructions: "Lavar la manzana y acompañar con almendras.",
    });
    const plan = createPlan([meal]);

    render(<MealPlanView plan={plan} />);

    // mid_morning label should appear (mocked i18n returns "mid_morning")
    const midMorningLabels = screen.getAllByText("mid_morning");
    expect(midMorningLabels.length).toBe(7);

    // Meal name visible in collapsed state
    expect(screen.getByText("Fruta y frutos secos")).toBeInTheDocument();
  });

  it("renders a complete day with 4 seed-data meals (breakfast, mid_morning, lunch, dinner)", async () => {
    // Simulates a full Monday from the seed plan
    const breakfast = createMeal({
      id: "s-breakfast",
      dayOfWeek: 0,
      mealType: "breakfast",
      name: "Tostada integral con tomate",
      ingredients: [
        { name: "pan integral", quantity: 60, unit: "g" },
        { name: "tomate", quantity: 100, unit: "g" },
        { name: "aceite de oliva", quantity: 10, unit: "ml" },
      ],
      instructions: "Tostar el pan y añadir tomate rallado.",
    });
    const midMorning = createMeal({
      id: "s-midmorning",
      dayOfWeek: 0,
      mealType: "mid_morning",
      name: "Fruta y frutos secos",
      ingredients: [
        { name: "manzana", quantity: 150, unit: "g" },
        { name: "almendras", quantity: 20, unit: "g" },
      ],
      instructions: "Lavar y cortar la fruta.",
    });
    const lunch = createMeal({
      id: "s-lunch",
      dayOfWeek: 0,
      mealType: "lunch",
      name: "Lentejas estofadas",
      ingredients: [
        { name: "lentejas", quantity: 80, unit: "g" },
        { name: "zanahoria", quantity: 80, unit: "g" },
      ],
      instructions: "Cocer las lentejas con verduras.",
    });
    const dinner = createMeal({
      id: "s-dinner",
      dayOfWeek: 0,
      mealType: "dinner",
      name: "Tortilla de patatas",
      ingredients: [
        { name: "huevos", quantity: 3, unit: "unidades" },
        { name: "patata", quantity: 200, unit: "g" },
      ],
      instructions: "Freír patatas y mezclar con huevo.",
    });

    const plan = createPlan([breakfast, midMorning, lunch, dinner]);
    const user = userEvent.setup();
    render(<MealPlanView plan={plan} />);

    // All 4 meal names visible in collapsed state
    expect(screen.getByText("Tostada integral con tomate")).toBeInTheDocument();
    expect(screen.getByText("Fruta y frutos secos")).toBeInTheDocument();
    expect(screen.getByText("Lentejas estofadas")).toBeInTheDocument();
    expect(screen.getByText("Tortilla de patatas")).toBeInTheDocument();

    // Expand the dinner card
    const toggles = screen.getAllByRole("button", { expanded: false });
    await user.click(toggles[3]); // dinner is the 4th button (0=breakfast, 1=mid_morning, 2=lunch, 3=dinner)

    // Ingredient table visible
    expect(screen.getByText("huevos")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("unidades")).toBeInTheDocument();
    expect(screen.getByText("patata")).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();
    expect(screen.getByText("g")).toBeInTheDocument();

    // Instructions visible
    expect(
      screen.getByText("Freír patatas y mezclar con huevo.")
    ).toBeInTheDocument();
  });
});
