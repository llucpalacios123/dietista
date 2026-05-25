// ────────────── Dietista — Shared Types ──────────────

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MacroConsumed {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DayMacroData {
  date: string;
  consumed: MacroConsumed;
  targets: MacroTargets;
}

export interface WeekMacroData {
  days: DayMacroData[];
  totals: MacroConsumed;
  targets: MacroTargets;
}

export interface WeightEntry {
  id: string;
  date: string;
  weight: number;
  notes?: string;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity?: string;
  price?: number;
  confidence: "high" | "medium" | "low";
  checked: boolean;
  matchedToPlan: boolean;
  category?: string;
  order: number;
}

export interface ShoppingList {
  id: string;
  mealPlanId?: string;
  budget?: number;
  totalEstimate?: number;
  status: "draft" | "reviewed" | "purchased";
  imageUrl?: string;
  items: ShoppingListItem[];
}

export interface ShoppingListSummary {
  id: string;
  mealPlanId?: string;
  status: "draft" | "reviewed" | "purchased";
  budget?: number;
  totalEstimate?: number;
  imageUrl?: string;
  itemCount: number;
  createdAt: string;
}

export interface NutritionistMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ProgressSnapshot {
  date: string;
  totalCalories?: number;
  totalProtein?: number;
  totalCarbs?: number;
  totalFat?: number;
  adherenceScore?: number;
  mealsLogged: number;
}

export type AccentName = "emerald" | "lime" | "forest" | "teal";
export type DensityName = "cozy" | "comfortable" | "compact";
