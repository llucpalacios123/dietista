// ─── Spring Boot Output Types ────────────────────────────────────────────

/** User profile section of the Spring Boot JSON output. */
export interface SpringBootUserProfile {
  weight: number;
  height: number;
  age: number;
  sex: "male" | "female" | "other";
  goal: "lose" | "maintain" | "gain";
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "veryActive";
  trainingRoutine: string | null | undefined;
  dietType: "omnivore" | "vegetarian" | "vegan" | "pescatarian" | null | undefined;
  budgetFriendly: boolean;
  weeklyBudget: number | null;
  mealComplexity: "simple" | "moderate" | "advanced" | null;
  mealsPerDay: number;
  includeSnacks: boolean;
  varietyPreference: "low" | "medium" | "high" | null | undefined;
  favoriteFoods: string[] | null | undefined;
  eatingOutFrequency: "never" | "rarely" | "sometimes" | "often" | null | undefined;
  cookingTimeAvailable: number | null | undefined;
}

/** Preferences section of the Spring Boot JSON output. */
export interface SpringBootPreferences {
  allergies: string[];
  dislikes: string[];
  maxCookingTime: number | null;
}

/** A single meal in the Spring Boot JSON output. */
export interface SpringBootMeal {
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  instructions: string;
}

/** Macro totals for a day or week. */
export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** A single day in the weekly plan. */
export interface SpringBootDay {
  dayOfWeek: number; // 0=Monday, 6=Sunday
  meals: SpringBootMeal[];
  dailyTotals: MacroTotals;
}

/** Weekly plan section of the Spring Boot JSON output. */
export interface SpringBootWeeklyPlan {
  days: SpringBootDay[];
  weeklyTotals: MacroTotals;
  shoppingList: string[] | null;
}

/** Complete Spring Boot JSON output schema. */
export interface SpringBootMealPlanOutput {
  userProfile: SpringBootUserProfile;
  preferences: SpringBootPreferences;
  weeklyPlan: SpringBootWeeklyPlan;
}

// ─── Internal Meal Plan Types ─────────────────────────────────────────────

/** Internal meal representation used during generation and review. */
export interface InternalMeal {
  id: string;
  dayOfWeek: number;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  instructions: string;
}

/** Internal day representation with ordered meals. */
export interface InternalDay {
  dayOfWeek: number;
  meals: InternalMeal[];
  dailyTotals: MacroTotals;
}

/** Internal weekly plan used during generation and review. */
export interface InternalMealPlan {
  days: InternalDay[];
  weeklyTotals: MacroTotals;
}

// ─── Modification Tracking ────────────────────────────────────────────────

/** Reason for a meal modification. */
export type ModificationReason = "dont_like" | "allergy" | "too_complex" | "other";

/** A single modification record (tracked for undo). */
export interface MealModification {
  id: string;
  timestamp: string;
  dayOfWeek: number;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  originalMeal: InternalMeal;
  newMeal: InternalMeal;
  reason: ModificationReason;
}

// ─── Nutritionist Preferences ─────────────────────────────────────────────

/** Preferences collected during the nutritionist chat (Step 3). */
export interface NutritionistPreferences {
  allergies: string[];
  dislikedFoods: string[];
  dietType: "omnivore" | "vegetarian" | "vegan" | "pescatarian" | null;
  budgetFriendly: boolean;
  weeklyBudget: number | null;
  mealComplexity: "simple" | "moderate" | "advanced" | null;
  mealsPerDay: number;
  includeSnacks: boolean;
  varietyPreference: "low" | "medium" | "high" | null;
  favoriteFoods: string[];
  eatingOutFrequency: "never" | "rarely" | "sometimes" | "often" | null;
  cookingTimeAvailable: number | null;
}
