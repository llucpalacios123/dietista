import OpenAI from "openai";
import { z } from "zod";
import { mealPlanResponseSchema, interpretedFoodSchema, chatMessageSchema, type MealItemSchema, type InterpretedFoodSchema, type ChatMessage } from "./schemas";

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
- Use realistic, varied meals appropriate for the goal
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
    .replace("{forbiddenFoods}", params.forbiddenFoods.join(", ") || "none");

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

// ─── Meal AI Suggestion ───────────────────────────────────────────────────────

export const MEAL_CHAT_SYSTEM = `You are a nutrition assistant. The user wants to eat
something now for the {mealType} slot. Respect remaining daily budget and allergies.
Return ONE JSON object with two fields:
- "message": a friendly conversational sentence in Spanish describing the suggestion
- "suggestion": {foodName, quantity:number, unit, calories, protein, carbs, fat}
Remaining today: {remaining} kcal/P/C/F. Slot target: {slotTarget}. Allergies: {allergies}.
All text in Spanish. Return ONLY valid JSON, no markdown.`;

export const suggestedMealSchema = z.object({
  foodName: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string(),
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
});

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
