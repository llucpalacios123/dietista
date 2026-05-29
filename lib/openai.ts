import OpenAI from "openai";
import { z } from "zod";
import { mealPlanResponseSchema, interpretedFoodSchema, chatMessageSchema, suggestedMealSchema, workoutPlanContentSchema, type MealItemSchema, type InterpretedFoodSchema, type ChatMessage, type WorkoutPlanContent, type WorkoutPreferences } from "./schemas";
import { GYM_EXERCISES } from "./gym-exercises";

// ─── Client ───────────────────────────────────────────────────────────────

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = "gpt-4o-mini";

// ─── Prompt Templates ─────────────────────────────────────────────────────

export const DIET_GENERATION_SYSTEM = `You are a nutritionist AI. Generate a weekly meal plan as valid JSON.
Requirements:
- 7 days (dayOfWeek: 0=Monday to 6=Sunday) × 5 meal types (breakfast, mid_morning, lunch, dinner, snack)
- Each meal: {dayOfWeek, mealType, name, description, calories, protein, carbs, fat, ingredients, instructions}
- ALL meal names and descriptions MUST be in Spanish (Spain - Castellano de España)
- Use typical Spanish dishes and ingredients (tortilla de patatas, gazpacho, paella, etc.)
- Total daily calories should match target: {targetCalories} kcal
- Daily macros: Protein {targetProtein}g, Carbs {targetCarbs}g, Fat {targetFat}g
- Avoid allergies: {allergies}
- Avoid forbidden foods: {forbiddenFoods}
- Goal: {goal}, Activity level: {activityLevel}
{optionalPreferences}- Use realistic, varied meals appropriate for the goal
- "ingredients": array of objects with {name: string (in Spanish), quantity: number, unit: string}. List EVERY ingredient needed.
- Standardized units: "g" (grams), "ml" (milliliters), "unidades" (pieces), "cucharadas" (tablespoons), "tazas" (cups).
- Quantities MUST be realistic for one serving (e.g., 150g of rice, NOT 500g).
- "instructions": brief preparation steps in Spanish (1-3 sentences).
- Return ONLY valid JSON array, no markdown, no explanation, no code blocks`;

export const MEAL_INTERPRET_SYSTEM = `You are a nutrition assistant. Interpret free-text food descriptions into structured nutritional data.
Requirements:
- Extract each food item with estimated quantity and unit
- Return: [{foodName, quantity, unit, calories, protein, carbs, fat, confidence}]
- confidence: "high" for common foods, "medium" for estimates, "low" for guesses
- Use standard units (g, ml, piece, cup, tbsp)
- Return ONLY valid JSON array, no markdown, no explanation`;

// ─── Retry with Exponential Backoff ───────────────────────────────────────

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(fn: () => Promise<T>, attempt = 1): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (attempt >= MAX_RETRIES) {
      throw error;
    }
    const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
    await sleep(delay);
    return withRetry(fn, attempt + 1);
  }
}

// ─── Diet Generation ──────────────────────────────────────────────────────

export interface DietGenerationParams {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  goal: string;
  activityLevel: string;
  allergies: string[];
  forbiddenFoods: string[];
  // Optional preference overrides — included in prompt when present
  dietType?: string;
  mealComplexity?: string;
  mealsPerDay?: number;
  includeSnacks?: boolean;
  varietyPreference?: string;
  favoriteFoods?: string[];
  budgetFriendly?: boolean;
  weeklyBudget?: number;
  eatingOutFrequency?: string;
  cookingTimeAvailable?: number;
}

function buildOptionalPreferencesBlock(params: DietGenerationParams): string {
  const lines: string[] = [];
  if (params.dietType) lines.push(`- Diet type: ${params.dietType}`);
  if (params.mealComplexity) lines.push(`- Meal complexity: ${params.mealComplexity}`);
  if (params.mealsPerDay !== undefined)
    lines.push(`- Meals per day: ${params.mealsPerDay}`);
  if (params.includeSnacks !== undefined)
    lines.push(`- Include snacks: ${params.includeSnacks ? "yes" : "no"}`);
  if (params.varietyPreference)
    lines.push(`- Variety preference: ${params.varietyPreference}`);
  if (params.favoriteFoods?.length)
    lines.push(`- Favorite foods (include when possible): ${params.favoriteFoods.join(", ")}`);
  if (params.budgetFriendly !== undefined)
    lines.push(`- Budget friendly: ${params.budgetFriendly ? "yes" : "no"}`);
  if (params.weeklyBudget !== undefined)
    lines.push(`- Weekly budget: €${params.weeklyBudget}`);
  if (params.eatingOutFrequency)
    lines.push(`- Eating out frequency: ${params.eatingOutFrequency}`);
  if (params.cookingTimeAvailable !== undefined)
    lines.push(`- Max cooking time per meal: ${params.cookingTimeAvailable} minutes`);
  return lines.length > 0 ? lines.join("\n") + "\n" : "";
}

export async function generateDiet(
  params: DietGenerationParams
): Promise<MealItemSchema[]> {
  const prompt = DIET_GENERATION_SYSTEM
    .replace("{targetCalories}", String(params.targetCalories))
    .replace("{targetProtein}", String(params.targetProtein))
    .replace("{targetCarbs}", String(params.targetCarbs))
    .replace("{targetFat}", String(params.targetFat))
    .replace("{goal}", params.goal)
    .replace("{activityLevel}", params.activityLevel)
    .replace("{allergies}", params.allergies.join(", ") || "none")
    .replace("{forbiddenFoods}", params.forbiddenFoods.join(", ") || "none")
    .replace("{optionalPreferences}", buildOptionalPreferencesBlock(params));

  const response = await withRetry(async () => {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("La IA ha devuelto una respuesta vacía");
    }

    return content;
  });

  // Parse and validate
  let parsed: unknown;
  try {
    parsed = JSON.parse(response);
  } catch {
    throw new Error("No se ha podido parsear la respuesta de la IA como JSON");
  }

  // The response might be:
  // 1. A flat array of meals: [{dayOfWeek, mealType, name, ...}, ...]
  // 2. Wrapped in an object: { meals: [...] } or { diet: [...] }
  // 3. Array of day objects with nested meals: [{dayOfWeek, meals: [...]}, ...]
  let rawItems: unknown[] = [];

  if (Array.isArray(parsed)) {
    rawItems = parsed;
  } else if (typeof parsed === "object" && parsed !== null) {
    // Find the first array value in the object
    const found = Object.values(parsed).find(Array.isArray);
    rawItems = found ?? [];
  }

  // Flatten day-organized structure: [{dayOfWeek, meals: [...]}, ...] → flat meals
  const meals: unknown[] = [];
  for (const item of rawItems) {
    if (
      typeof item === "object" &&
      item !== null &&
      "meals" in item &&
      Array.isArray((item as Record<string, unknown>).meals)
    ) {
      const dayOfWeek = (item as Record<string, unknown>).dayOfWeek;
      for (const meal of (item as Record<string, unknown>).meals as unknown[]) {
        if (typeof meal === "object" && meal !== null) {
          const mealObj = meal as Record<string, unknown>;
          // Ensure dayOfWeek is propagated to nested meals
          if (dayOfWeek !== undefined && mealObj.dayOfWeek === undefined) {
            mealObj.dayOfWeek = dayOfWeek;
          }
          meals.push(mealObj);
        }
      }
    } else {
      meals.push(item);
    }
  }

  if (meals.length === 0) {
    throw new Error("No se han encontrado comidas en la respuesta de la IA");
  }

  const validated = mealPlanResponseSchema.safeParse(meals);
  if (!validated.success) {
    const details = validated.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("; ");
    throw new Error("Estructura del plan de comidas no válida: ${details}");
  }

  return validated.data;
}

// ─── Workout Generation ───────────────────────────────────────────────────────

export const WORKOUT_GENERATION_SYSTEM = `You are an expert strength & conditioning coach. Generate a structured workout plan of {daysPerWeek} training days as valid JSON.

Profile:
- Sex: {sex}, Age: {age}, Goal: {goal}, Activity level: {activityLevel}
- Training routine: {trainingRoutine}
- Notes / injuries: {notes}

Plan parameters:
- Objective: {workoutGoal}
- Level: {level}
- Days per week: {daysPerWeek}
- Focus muscle groups: {focusGroups}
- Available equipment: {equipment}
- Target session duration: {sessionDurationMin} minutes

Exercise catalog (prefer exercises from this list; you may add others if equipment requires):
legs: {catalogLegs}
back: {catalogBack}
chest: {catalogChest}
shoulders: {catalogShoulders}
arms: {catalogArms}
core: {catalogCore}
cardio: {catalogCardio}

Requirements:
- Generate exactly {daysPerWeek} day entries (one per training day, no rest-day fillers).
- "dayOfWeek" is a 0-based DAY INDEX, not a weekday: 0 = Día 1, 1 = Día 2, ..., {daysPerWeek-1} = last day. Use consecutive indices starting at 0.
- Every entry is a training day: isRestDay=false, exercises non-empty, focus non-empty.
- Each day MUST include "focus": a JSON array of 1+ muscle-group strings from [legs, back, chest, shoulders, arms, core, cardio] reflecting that day's work.
- Each exercise MUST include "muscleGroup": exactly one string from [legs, back, chest, shoulders, arms, core, cardio], matching the catalog section it came from.
- Each training day: 4-8 exercises. Each exercise's "sets" MUST be a JSON ARRAY of 2-5 set objects, each: {"reps": number|null, "weightKg": number|null, "rir"?: number (1-3 for strength/hypertrophy), "durationSec"?: number (for cardio/isometric)}. reps=null means to-failure; weightKg=null means bodyweight.
- For strength/hypertrophy: reps 4-12, rir 1-3. For endurance: reps 12-25 or use durationSec. For weight_loss: include 1 cardio block per week.
- Set isFromCatalog=true when exercise name exactly matches catalog (case-insensitive), false otherwise.
- All exercise names, day titles and notes MUST be in Spanish (Spain).
- restSec: 60-90s for hypertrophy, 120-180s for strength, 30-60s for endurance.
- warmupMin: 5-10 for all training days. cooldownMin: 5 for all training days.
- Return ONLY valid JSON, no markdown, no code fences, no extra prose. Shape:
{
  "version": 2,
  "days": [
    {
      "dayOfWeek": 0,
      "focus": ["legs"],
      "title": "Día 1 · Piernas fuerza",
      "warmupMin": 5,
      "cooldownMin": 5,
      "isRestDay": false,
      "exercises": [{
        "name": "Sentadilla",
        "muscleGroup": "legs",
        "isFromCatalog": true,
        "restSec": 90,
        "sets": [{"reps": 10, "weightKg": 60, "rir": 2}, {"reps": 8, "weightKg": 65, "rir": 2}]
      }]
    },
    {
      "dayOfWeek": 1,
      "focus": ["back", "chest"],
      "title": "Día 2 · Empuje/Tirón",
      "warmupMin": 5,
      "cooldownMin": 5,
      "isRestDay": false,
      "exercises": []
    }
  ],
  "weeklyVolumeNotes": "Progressive overload — increase weight 2.5kg when completing all reps with rir>=2"
}`;

export interface WorkoutGenerationProfile {
  sex: string;
  age: number;
  goal: string;
  activityLevel: string;
  trainingRoutine: string | null;
  notes: string | null;
}

export interface WorkoutGenerationParams {
  profile: WorkoutGenerationProfile;
  preferences: WorkoutPreferences;
}

export async function generateWorkoutContent(
  params: WorkoutGenerationParams
): Promise<WorkoutPlanContent> {
  const { profile, preferences } = params;

  const prompt = WORKOUT_GENERATION_SYSTEM
    .replace("{sex}", profile.sex)
    .replace("{age}", String(profile.age))
    .replace("{goal}", profile.goal)
    .replace("{activityLevel}", profile.activityLevel)
    .replace("{trainingRoutine}", profile.trainingRoutine ?? "No especificada")
    .replace("{notes}", profile.notes ?? "Ninguna")
    .replace("{workoutGoal}", preferences.goal)
    .replace("{level}", preferences.level)
    .replace("{daysPerWeek}", String(preferences.daysPerWeek))
    .replace("{focusGroups}", preferences.focusGroups.join(", "))
    .replace("{equipment}", preferences.equipment.join(", "))
    .replace("{sessionDurationMin}", String(preferences.sessionDurationMin))
    .replace("{catalogLegs}", GYM_EXERCISES.legs.join(", "))
    .replace("{catalogBack}", GYM_EXERCISES.back.join(", "))
    .replace("{catalogChest}", GYM_EXERCISES.chest.join(", "))
    .replace("{catalogShoulders}", GYM_EXERCISES.shoulders.join(", "))
    .replace("{catalogArms}", GYM_EXERCISES.arms.join(", "))
    .replace("{catalogCore}", GYM_EXERCISES.core.join(", "))
    .replace("{catalogCardio}", GYM_EXERCISES.cardio.join(", "));

  const response = await withRetry(async () => {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.6,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("La IA ha devuelto una respuesta vacía para el plan de entrenamiento");
    }

    return content;
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(response);
  } catch {
    throw new Error("No se ha podido parsear la respuesta de la IA como JSON (plan de entrenamiento)");
  }

  const validated = workoutPlanContentSchema.safeParse(parsed);
  if (!validated.success) {
    const details = validated.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("; ");
    throw new Error(`Estructura del plan de entrenamiento no válida: ${details}`);
  }

  return validated.data;
}

// ─── Meal AI Suggestion ───────────────────────────────────────────────────────

export const MEAL_CHAT_SYSTEM = `You are a nutrition assistant. The user wants to eat
something now for the {mealType} slot. Respect remaining daily budget and allergies.
Return ONE JSON object with two fields:
- "message": a friendly conversational sentence in Spanish describing the suggestion
- "suggestion": an object with the following fields:
    - foodName: string (name of the dish in Spanish)
    - quantity: number (amount for one serving)
    - unit: string (e.g. "g", "ml", "unidades")
    - calories: number (kcal)
    - protein: number (grams)
    - carbs: number (grams)
    - fat: number (grams)
    - description: string (1-2 sentences describing the dish, optional but recommended, in Spanish)
    - ingredients: array of {name: string, quantity?: number, unit?: string} listing every ingredient in Spanish (optional but recommended). If you cannot estimate ingredients reliably, omit the field. Never invent.
    - instructions: string with brief preparation steps (1-3 sentences, optional)
Remaining today: {remaining} kcal/P/C/F. Slot target: {slotTarget}. Allergies: {allergies}.
All text in Spanish. Return ONLY valid JSON, no markdown.`;

// Re-exported from schemas.ts to keep the client-side schema co-located
export { suggestedMealSchema };

export type SuggestResult = z.infer<typeof suggestedMealSchema>;

export const suggestMealResponseSchema = z.object({
  message: z.string().min(1),
  suggestion: suggestedMealSchema,
});

export type SuggestMealResponse = z.infer<typeof suggestMealResponseSchema>;

export interface SuggestMealParams {
  mealType: string;
  query: string;
  history?: ChatMessage[];
  remaining: { cal: number; pro: number; carb: number; fat: number };
  slotTarget?: { cal: number; pro: number; carb: number; fat: number };
  allergies: string[];
}

export async function suggestMeal(p: SuggestMealParams): Promise<SuggestMealResponse> {
  const remainingStr = `${Math.round(p.remaining.cal)} kcal / ${Math.round(p.remaining.pro)}g P / ${Math.round(p.remaining.carb)}g C / ${Math.round(p.remaining.fat)}g F`;
  const slotStr = p.slotTarget
    ? `${Math.round(p.slotTarget.cal)} kcal / ${Math.round(p.slotTarget.pro)}g P / ${Math.round(p.slotTarget.carb)}g C / ${Math.round(p.slotTarget.fat)}g F`
    : "no especificado";
  const allergiesStr = p.allergies.length > 0 ? p.allergies.join(", ") : "ninguna";

  const systemPrompt = MEAL_CHAT_SYSTEM
    .replace("{mealType}", p.mealType)
    .replace("{remaining}", remainingStr)
    .replace("{slotTarget}", slotStr)
    .replace("{allergies}", allergiesStr);

  // Build chat messages array: [system, ...history, currentUserQuery]
  const historyMessages: { role: "user" | "assistant"; content: string }[] =
    (p.history ?? []).map((m) => ({ role: m.role, content: m.text }));

  const content = await withRetry(async () => {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...historyMessages,
        { role: "user", content: p.query },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) {
      throw new Error("La IA ha devuelto una respuesta vacía");
    }
    return text;
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("No se pudo parsear la respuesta de la IA como JSON");
  }

  const validated = suggestMealResponseSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error("Estructura de sugerencia no válida");
  }

  return validated.data;
}

// ─── Meal Interpretation ──────────────────────────────────────────────────

export async function interpretMeal(rawInput: string): Promise<InterpretedFoodSchema[]> {
  const response = await withRetry(async () => {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: MEAL_INTERPRET_SYSTEM },
        { role: "user", content: rawInput },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("La IA ha devuelto una respuesta vacía");
    }

    return content;
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(response);
  } catch {
    throw new Error("No se ha podido parsear la respuesta de la IA como JSON");
  }

  const foods: unknown[] = Array.isArray(parsed)
    ? parsed
    : typeof parsed === "object" && parsed !== null
      ? Object.values(parsed).find(Array.isArray) ?? []
      : [];

  if (foods.length === 0) {
    throw new Error("No se han encontrado alimentos en la respuesta de la IA");
  }

  // Validate each item individually to allow partial results
  const validated: InterpretedFoodSchema[] = [];
  for (const food of foods) {
    const result = interpretedFoodSchema.safeParse(food);
    if (result.success) {
      validated.push(result.data);
    }
  }

  if (validated.length === 0) {
    throw new Error("No hay alimentos válidos en la respuesta de la IA");
  }

  return validated;
}
