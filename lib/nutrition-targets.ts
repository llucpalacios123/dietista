import type { NutritionistPreferencesSchema } from "./schemas";

// ─── Types ────────────────────────────────────────────────────────────────

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface EffectivePreferences {
  allergies: string[];
  forbiddenFoods: string[];
  favoriteFoods: string[];
  dietType: string | null;
  mealComplexity: string | null;
  mealsPerDay: number;
  includeSnacks: boolean;
  varietyPreference: string | null;
  budgetFriendly: boolean;
  weeklyBudget: number | null;
  eatingOutFrequency: string | null;
  cookingTimeAvailable: number | null;
}

// ─── Profile shape accepted by these helpers ──────────────────────────────

interface ProfileInput {
  weight: number;
  height: number;
  age: number;
  sex: string;
  goal: string;
  activityLevel: string;
  targetCalories?: number | null;
  targetProtein?: number | null;
  targetCarbs?: number | null;
  targetFat?: number | null;
  allergies: string[];
  forbiddenFoods: string[];
  favoriteFoods: string[];
  dietType?: string | null;
  mealComplexity?: string | null;
  mealsPerDay: number;
  includeSnacks: boolean;
  varietyPreference?: string | null;
  budgetFriendly: boolean;
  weeklyBudget?: number | null;
  eatingOutFrequency?: string | null;
  cookingTimeAvailable?: number | null;
}

// ─── Mifflin-St Jeor ──────────────────────────────────────────────────────

function calcCaloriesFromProfile(profile: ProfileInput): number {
  // Mifflin-St Jeor BMR
  let bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age;
  bmr += profile.sex === "male" ? 5 : -161;

  // Activity multiplier
  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryActive: 1.9,
  };
  const tdee = bmr * (multipliers[profile.activityLevel] ?? 1.55);

  // Goal adjustment
  switch (profile.goal) {
    case "lose":
      return Math.round(tdee - 500);
    case "gain":
      return Math.round(tdee + 300);
    default:
      return Math.round(tdee);
  }
}

function calcProtein(profile: ProfileInput, calories: number): number {
  void calories; // calories param kept for API symmetry with original
  const multiplier =
    profile.goal === "lose" ? 2.2 : profile.goal === "gain" ? 1.8 : 1.6;
  return Math.round(profile.weight * multiplier);
}

function calcCarbs(profile: ProfileInput, calories: number): number {
  const pct = profile.goal === "lose" ? 0.35 : 0.45;
  return Math.round((calories * pct) / 4);
}

function calcFat(profile: ProfileInput, calories: number): number {
  const pct = profile.goal === "lose" ? 0.35 : 0.25;
  return Math.round((calories * pct) / 9);
}

/**
 * Calculate macro targets from a user profile using Mifflin-St Jeor.
 * Respects explicit overrides in profile (targetCalories, etc.) when set.
 */
export function calculateTargets(profile: ProfileInput): MacroTargets {
  const calories = profile.targetCalories ?? calcCaloriesFromProfile(profile);
  const protein = profile.targetProtein ?? calcProtein(profile, calories);
  const carbs = profile.targetCarbs ?? calcCarbs(profile, calories);
  const fat = profile.targetFat ?? calcFat(profile, calories);

  return { calories, protein, carbs, fat };
}

// ─── Preference Coalescence ───────────────────────────────────────────────

/**
 * Merge plan-level preference overrides with the user profile.
 * Rules:
 *   - Arrays: non-empty plan array wins; empty → fall back to profile.
 *   - Scalars: non-null plan value wins; null → fall back to profile.
 *   - `dislikedFoods` (wizard field) maps to `forbiddenFoods`.
 */
export function coalescePreferences(
  profile: ProfileInput,
  preferences?: Partial<NutritionistPreferencesSchema>
): EffectivePreferences {
  const allergies =
    preferences?.allergies?.length
      ? preferences.allergies
      : profile.allergies;

  const forbiddenFoods =
    preferences?.dislikedFoods?.length
      ? preferences.dislikedFoods
      : profile.forbiddenFoods;

  const favoriteFoods =
    preferences?.favoriteFoods?.length
      ? preferences.favoriteFoods
      : profile.favoriteFoods;

  const dietType = preferences?.dietType ?? profile.dietType ?? null;
  const mealComplexity =
    preferences?.mealComplexity ?? profile.mealComplexity ?? null;
  const mealsPerDay = preferences?.mealsPerDay ?? profile.mealsPerDay;
  const includeSnacks = preferences?.includeSnacks ?? profile.includeSnacks;
  const varietyPreference =
    preferences?.varietyPreference ?? profile.varietyPreference ?? null;
  const budgetFriendly = preferences?.budgetFriendly ?? profile.budgetFriendly;
  const weeklyBudget = preferences?.weeklyBudget ?? profile.weeklyBudget ?? null;
  const eatingOutFrequency =
    preferences?.eatingOutFrequency ?? profile.eatingOutFrequency ?? null;
  const cookingTimeAvailable =
    preferences?.cookingTimeAvailable ?? profile.cookingTimeAvailable ?? null;

  return {
    allergies,
    forbiddenFoods,
    favoriteFoods,
    dietType,
    mealComplexity,
    mealsPerDay,
    includeSnacks,
    varietyPreference,
    budgetFriendly,
    weeklyBudget,
    eatingOutFrequency,
    cookingTimeAvailable,
  };
}
