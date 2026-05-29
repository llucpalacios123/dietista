import { describe, it, expect } from "vitest";
import {
  validateSpringBootOutput,
  autoFixOutput,
  buildAndValidateSpringBootOutput,
  parseAIGeneratedPlan,
  toSpringBootMeal,
  toSpringBootDay,
  toSpringBootWeeklyPlan,
} from "@/lib/meal-plan-json";
import type { UserProfileSchema, NutritionistPreferencesSchema } from "@/lib/schemas";
import type { InternalMeal, InternalDay, InternalMealPlan } from "@/types/meal-plan";

// ─── Test Helpers ─────────────────────────────────────────────────────────

const mockProfile: UserProfileSchema = {
  weight: 70,
  height: 175,
  age: 30,
  sex: "male",
  goal: "lose",
  activityLevel: "moderate",
  targetCalories: null,
  targetProtein: null,
  targetCarbs: null,
  targetFat: null,
  trainingRoutine: null,
  dietType: null,
  budgetFriendly: false,
  weeklyBudget: null,
  mealComplexity: null,
  mealsPerDay: 3,
  includeSnacks: false,
  varietyPreference: null,
  favoriteFoods: [],
  eatingOutFrequency: null,
  cookingTimeAvailable: null,
  allergies: [],
  forbiddenFoods: [],
};

const mockPreferences: NutritionistPreferencesSchema = {
  allergies: [],
  dislikedFoods: [],
  dietType: null,
  budgetFriendly: false,
  weeklyBudget: null,
  mealComplexity: null,
  mealsPerDay: 3,
  includeSnacks: false,
  varietyPreference: null,
  favoriteFoods: [],
  eatingOutFrequency: null,
  cookingTimeAvailable: null,
  model: "gpt-4o-mini",
};

function makeMockMeal(overrides?: Partial<InternalMeal>): InternalMeal {
  return {
    id: "meal-1",
    dayOfWeek: 0,
    mealType: "lunch",
    name: "Test Meal",
    description: "A test meal",
    calories: 500,
    protein: 40,
    carbs: 50,
    fat: 15,
    ingredients: [{ name: "rice" }, { name: "chicken" }],
    instructions: "Cook everything.",
    ...overrides,
  };
}

function makeMockDay(overrides?: Partial<InternalDay>): InternalDay {
  const meals = [makeMockMeal()];
  return {
    dayOfWeek: 0,
    meals,
    dailyTotals: {
      calories: 500,
      protein: 40,
      carbs: 50,
      fat: 15,
    },
    ...overrides,
  };
}

function makeMockPlan(): InternalMealPlan {
  const day = makeMockDay();
  return {
    days: [day],
    weeklyTotals: {
      calories: 500,
      protein: 40,
      carbs: 50,
      fat: 15,
    },
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe("validateSpringBootOutput", () => {
  it("validates a correct Spring Boot output", () => {
    const result = buildAndValidateSpringBootOutput({
      profile: mockProfile,
      preferences: mockPreferences,
      mealPlan: makeMockPlan(),
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.errors).toHaveLength(0);
    expect(result.fixed).toBe(false);
  });

  it("detects missing userProfile", () => {
    const result = validateSpringBootOutput({
      preferences: { allergies: [], dislikes: [], maxCookingTime: null },
      weeklyPlan: { days: [], weeklyTotals: { calories: 0, protein: 0, carbs: 0, fat: 0 }, shoppingList: null },
    });
    expect(result.valid).toBe(false);
  });

  it("detects missing required field in meal", () => {
    const result = validateSpringBootOutput({
      userProfile: {
        weight: 70,
        height: 175,
        age: 30,
        sex: "male",
        goal: "lose",
        activityLevel: "moderate",
        trainingRoutine: null,
        dietType: null,
        budgetFriendly: false,
        weeklyBudget: null,
        mealComplexity: null,
        mealsPerDay: 3,
        includeSnacks: false,
        varietyPreference: null,
        favoriteFoods: null,
        eatingOutFrequency: null,
        cookingTimeAvailable: null,
      },
      preferences: { allergies: [], dislikes: [], maxCookingTime: null },
      weeklyPlan: {
        days: [{
          dayOfWeek: 0,
          meals: [{
            mealType: "lunch",
            // Missing: name, description, calories, protein, etc.
          }],
        }],
        weeklyTotals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        shoppingList: null,
      },
    });
    expect(result.valid).toBe(false);
  });
});

describe("autoFixOutput", () => {
  it("calculates missing dailyTotals from meals", () => {
    const output = {
      userProfile: {
        weight: 70,
        height: 175,
        age: 30,
        sex: "male",
        goal: "lose",
        activityLevel: "moderate",
        trainingRoutine: null,
        dietType: null,
        budgetFriendly: false,
        weeklyBudget: null,
        mealComplexity: null,
        mealsPerDay: 3,
        includeSnacks: false,
        varietyPreference: null,
        favoriteFoods: null,
        eatingOutFrequency: null,
        cookingTimeAvailable: null,
      },
      preferences: { allergies: [], dislikes: [], maxCookingTime: null },
      weeklyPlan: {
        days: [{
          dayOfWeek: 0,
          meals: [{
            mealType: "lunch",
            name: "Meal",
            description: "Desc",
            calories: 400,
            protein: 30,
            carbs: 45,
            fat: 12,
            ingredients: [],
            instructions: "",
          }],
          // dailyTotals missing
        }],
        // weeklyTotals missing
        shoppingList: null,
      },
    };

    const fixed = autoFixOutput(output as unknown as Record<string, unknown>);
    expect(fixed).not.toBeNull();

    const weeklyPlan = fixed!.weeklyPlan as Record<string, unknown>;
    const days = weeklyPlan.days as Array<Record<string, unknown>>;
    expect(days[0].dailyTotals).toBeDefined();

    const totals = days[0].dailyTotals as Record<string, number>;
    expect(totals.calories).toBe(400);
    expect(totals.protein).toBe(30);
  });

  it("calculates missing weeklyTotals from days", () => {
    const output = {
      userProfile: {
        weight: 70, height: 175, age: 30, sex: "male",
        goal: "lose", activityLevel: "moderate",
        trainingRoutine: null, dietType: null, budgetFriendly: false,
        weeklyBudget: null, mealComplexity: null, mealsPerDay: 3,
        includeSnacks: false, varietyPreference: null,
        favoriteFoods: null, eatingOutFrequency: null,
        cookingTimeAvailable: null,
      },
      preferences: { allergies: [], dislikes: [], maxCookingTime: null },
      weeklyPlan: {
        days: [{
          dayOfWeek: 0,
          meals: [{
            mealType: "lunch", name: "M", description: "D",
            calories: 100, protein: 10, carbs: 10, fat: 5,
            ingredients: [], instructions: "",
          }],
          dailyTotals: { calories: 100, protein: 10, carbs: 10, fat: 5 },
        }],
        shoppingList: null,
        // weeklyTotals missing
      },
    };

    const fixed = autoFixOutput(output as unknown as Record<string, unknown>);
    const weeklyPlan = fixed!.weeklyPlan as Record<string, unknown>;
    expect(weeklyPlan.weeklyTotals).toBeDefined();
  });
});

describe("buildAndValidateSpringBootOutput", () => {
  it("returns success with valid data", () => {
    const result = buildAndValidateSpringBootOutput({
      profile: mockProfile,
      preferences: mockPreferences,
      mealPlan: makeMockPlan(),
    });
    expect(result.success).toBe(true);
    expect(result.fixed).toBe(false);
  });

  it("includes all userProfile fields", () => {
    const result = buildAndValidateSpringBootOutput({
      profile: {
        ...mockProfile,
        favoriteFoods: ["pizza", "sushi"],
        weeklyBudget: 60,
      },
      preferences: {
        ...mockPreferences,
        budgetFriendly: true,
        weeklyBudget: 60,
        favoriteFoods: ["pizza", "sushi"],
      },
      mealPlan: makeMockPlan(),
    });
    expect(result.success).toBe(true);
    if (result.data) {
      expect(result.data.userProfile.favoriteFoods).toEqual(["pizza", "sushi"]);
      expect(result.data.userProfile.weeklyBudget).toBe(60);
      expect(result.data.userProfile.budgetFriendly).toBe(true);
    }
  });
});

describe("parseAIGeneratedPlan", () => {
  it("returns null for non-object input", () => {
    expect(parseAIGeneratedPlan(null)).toBeNull();
    expect(parseAIGeneratedPlan("string")).toBeNull();
    expect(parseAIGeneratedPlan(undefined)).toBeNull();
  });

  it("parses Spring Boot weekly plan format", () => {
    const raw = {
      days: [{
        dayOfWeek: 0,
        meals: [{
          mealType: "breakfast",
          name: "Oatmeal",
          description: "Healthy oats",
          calories: 350,
          protein: 15,
          carbs: 55,
          fat: 8,
          ingredients: ["oats", "milk"],
          instructions: "Cook oats",
        }],
        dailyTotals: { calories: 350, protein: 15, carbs: 55, fat: 8 },
      }],
      weeklyTotals: { calories: 350, protein: 15, carbs: 55, fat: 8 },
    };

    const plan = parseAIGeneratedPlan(raw);
    expect(plan).not.toBeNull();
    expect(plan!.days).toHaveLength(1);
    expect(plan!.days[0].meals).toHaveLength(1);
    expect(plan!.days[0].meals[0].name).toBe("Oatmeal");
  });

  it("parses flat array format (legacy)", () => {
    const raw = [
      { dayOfWeek: 0, mealType: "breakfast", name: "Eggs", description: "Scrambled", calories: 300, protein: 20, carbs: 5, fat: 22 },
      { dayOfWeek: 0, mealType: "lunch", name: "Salad", description: "Fresh", calories: 400, protein: 35, carbs: 30, fat: 15 },
    ];

    const plan = parseAIGeneratedPlan(raw);
    expect(plan).not.toBeNull();
    expect(plan!.days).toHaveLength(1); // Both meals on day 0
    expect(plan!.days[0].meals).toHaveLength(2);
  });

  it("handles array in data.meals", () => {
    const raw = {
      meals: [
        { dayOfWeek: 0, mealType: "dinner", name: "Soup", description: "Warm", calories: 250, protein: 15, carbs: 30, fat: 8 },
      ],
    };

    const plan = parseAIGeneratedPlan(raw);
    expect(plan).not.toBeNull();
    expect(plan!.days[0].meals[0].name).toBe("Soup");
  });
});

describe("parseAIGeneratedPlan — ingredient extraction", () => {
  it("parses structured ingredient objects from Spring Boot format", () => {
    const raw = {
      days: [{
        dayOfWeek: 0,
        meals: [{
          mealType: "lunch",
          name: "Pollo con arroz",
          description: "Pechuga a la plancha",
          calories: 500,
          protein: 45,
          carbs: 50,
          fat: 12,
          ingredients: [
            { name: "pollo", quantity: 200, unit: "g" },
            { name: "arroz", quantity: 150, unit: "g" },
          ],
          instructions: "Cocinar pollo 8 min por lado, hervir arroz",
        }],
        dailyTotals: { calories: 500, protein: 45, carbs: 50, fat: 12 },
      }],
      weeklyTotals: { calories: 500, protein: 45, carbs: 50, fat: 12 },
    };

    const plan = parseAIGeneratedPlan(raw);
    expect(plan).not.toBeNull();
    const meal = plan!.days[0].meals[0];
    expect(meal.ingredients).toHaveLength(2);
    expect(meal.ingredients[0]).toEqual({ name: "pollo", quantity: 200, unit: "g" });
    expect(meal.ingredients[1]).toEqual({ name: "arroz", quantity: 150, unit: "g" });
    expect(meal.instructions).toBe("Cocinar pollo 8 min por lado, hervir arroz");
  });

  it("defaults ingredients to empty array when missing", () => {
    const raw = {
      days: [{
        dayOfWeek: 0,
        meals: [{
          mealType: "dinner",
          name: "Sopa",
          description: "Caldo ligero",
          calories: 200,
          protein: 10,
          carbs: 25,
          fat: 5,
        }],
        dailyTotals: { calories: 200, protein: 10, carbs: 25, fat: 5 },
      }],
      weeklyTotals: { calories: 200, protein: 10, carbs: 25, fat: 5 },
    };

    const plan = parseAIGeneratedPlan(raw);
    expect(plan).not.toBeNull();
    expect(plan!.days[0].meals[0].ingredients).toEqual([]);
  });

  it("handles null ingredients gracefully", () => {
    const raw = {
      days: [{
        dayOfWeek: 0,
        meals: [{
          mealType: "breakfast",
          name: "Tostada",
          description: "Pan integral",
          calories: 250,
          protein: 8,
          carbs: 40,
          fat: 6,
          ingredients: null,
        }],
        dailyTotals: { calories: 250, protein: 8, carbs: 40, fat: 6 },
      }],
      weeklyTotals: { calories: 250, protein: 8, carbs: 40, fat: 6 },
    };

    const plan = parseAIGeneratedPlan(raw);
    expect(plan).not.toBeNull();
    expect(plan!.days[0].meals[0].ingredients).toEqual([]);
  });

  it("parses ingredient with only name (no quantity or unit)", () => {
    const raw = {
      days: [{
        dayOfWeek: 0,
        meals: [{
          mealType: "lunch",
          name: "Ensalada",
          description: "Verde",
          calories: 150,
          protein: 5,
          carbs: 10,
          fat: 8,
          ingredients: [{ name: "sal" }, { name: "pimienta" }],
        }],
        dailyTotals: { calories: 150, protein: 5, carbs: 10, fat: 8 },
      }],
      weeklyTotals: { calories: 150, protein: 5, carbs: 10, fat: 8 },
    };

    const plan = parseAIGeneratedPlan(raw);
    expect(plan).not.toBeNull();
    expect(plan!.days[0].meals[0].ingredients).toEqual([
      { name: "sal" },
      { name: "pimienta" },
    ]);
  });

  it("parses structured ingredients from flat array format", () => {
    const raw = [
      {
        dayOfWeek: 0,
        mealType: "lunch",
        name: "Pescado",
        description: "Al horno",
        calories: 400,
        protein: 35,
        carbs: 20,
        fat: 18,
        ingredients: [
          { name: "merluza", quantity: 200, unit: "g" },
          { name: "limón", quantity: 1, unit: "unidades" },
        ],
        instructions: "Hornear a 180°C por 20 min",
      },
    ];

    const plan = parseAIGeneratedPlan(raw);
    expect(plan).not.toBeNull();
    expect(plan!.days[0].meals[0].ingredients).toHaveLength(2);
    expect(plan!.days[0].meals[0].ingredients[0]).toEqual({
      name: "merluza", quantity: 200, unit: "g",
    });
  });
});

describe("toSpringBootMeal", () => {
  it("transforms internal meal to Spring Boot format", () => {
    const meal: InternalMeal = {
      id: "meal-1",
      dayOfWeek: 0,
      mealType: "lunch",
      name: "Grilled Chicken",
      description: "Grilled chicken breast",
      calories: 450,
      protein: 42,
      carbs: 18,
      fat: 22,
      ingredients: [
        { name: "chicken breast" },
        { name: "olive oil" },
        { name: "herbs" },
      ],
      instructions: "Season and grill for 8 minutes per side.",
    };

    const result = toSpringBootMeal(meal);
    expect(result.mealType).toBe("lunch");
    expect(result.name).toBe("Grilled Chicken");
    expect(result.calories).toBe(450);
    expect(result.ingredients).toHaveLength(3);
    expect(result.instructions).toBe("Season and grill for 8 minutes per side.");
  });
});

describe("toSpringBootDay", () => {
  it("transforms internal day to Spring Boot format", () => {
    const day = makeMockDay({ dayOfWeek: 3 });
    const result = toSpringBootDay(day);

    expect(result.dayOfWeek).toBe(3);
    expect(result.meals).toHaveLength(1);
    expect(result.dailyTotals.calories).toBe(500);
  });
});

describe("toSpringBootWeeklyPlan", () => {
  it("transforms internal plan to Spring Boot format", () => {
    const plan = makeMockPlan();
    const result = toSpringBootWeeklyPlan(plan);

    expect(result.days).toHaveLength(1);
    expect(result.weeklyTotals.calories).toBe(500);
    expect(result.shoppingList).toBeNull();
  });
});

describe("full build + validate + fix pipeline", () => {
  it("produces valid output for a complete profile", () => {
    const result = buildAndValidateSpringBootOutput({
      profile: {
        ...mockProfile,
        trainingRoutine: "3x/week strength training",
        dietType: "omnivore",
        budgetFriendly: true,
        varietyPreference: "high",
      },
      preferences: {
        ...mockPreferences,
        budgetFriendly: true,
        weeklyBudget: 60,
        allergies: ["peanuts"],
        dislikedFoods: ["liver"],
        mealsPerDay: 4,
        includeSnacks: true,
        cookingTimeAvailable: 45,
        favoriteFoods: ["pasta"],
      },
      mealPlan: makeMockPlan(),
    });

    expect(result.success).toBe(true);
    if (result.data) {
      expect(result.data.userProfile.trainingRoutine).toBe("3x/week strength training");
      expect(result.data.userProfile.budgetFriendly).toBe(true);
      expect(result.data.preferences.allergies).toEqual(["peanuts"]);
      expect(result.data.preferences.maxCookingTime).toBe(45);
    }
  });
});
