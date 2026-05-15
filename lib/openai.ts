import OpenAI from "openai";
import { mealPlanResponseSchema, interpretedFoodSchema, type MealItemSchema, type InterpretedFoodSchema } from "./schemas";

// ─── Client ───────────────────────────────────────────────────────────────

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = "gpt-4o-mini";

// ─── Prompt Templates ─────────────────────────────────────────────────────

export const DIET_GENERATION_SYSTEM = `You are a nutritionist AI. Generate a weekly meal plan as valid JSON.
Requirements:
- 7 days (dayOfWeek: 0=Monday to 6=Sunday) × 4 meal types (breakfast, lunch, dinner, snack)
- Each meal: {dayOfWeek, mealType, name, description, calories, protein, carbs, fat}
- Total daily calories should match target: {targetCalories} kcal
- Daily macros: Protein {targetProtein}g, Carbs {targetCarbs}g, Fat {targetFat}g
- Avoid allergies: {allergies}
- Avoid forbidden foods: {forbiddenFoods}
- Goal: {goal}, Activity level: {activityLevel}
- Use realistic, varied meals appropriate for the goal
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
      throw new Error("OpenAI returned empty response");
    }

    return content;
  });

  // Parse and validate
  let parsed: unknown;
  try {
    parsed = JSON.parse(response);
  } catch {
    throw new Error("Failed to parse OpenAI response as JSON");
  }

  // The response might be wrapped in an object with a key, or be a direct array
  const meals: unknown[] = Array.isArray(parsed)
    ? parsed
    : typeof parsed === "object" && parsed !== null
      ? Object.values(parsed).find(Array.isArray) ?? []
      : [];

  if (meals.length === 0) {
    throw new Error("No meals found in OpenAI response");
  }

  const validated = mealPlanResponseSchema.safeParse(meals);
  if (!validated.success) {
    throw new Error(
      `Invalid meal plan structure: ${validated.error.errors.map((e) => e.message).join(", ")}`
    );
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
      throw new Error("OpenAI returned empty response");
    }

    return content;
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(response);
  } catch {
    throw new Error("Failed to parse OpenAI response as JSON");
  }

  const foods: unknown[] = Array.isArray(parsed)
    ? parsed
    : typeof parsed === "object" && parsed !== null
      ? Object.values(parsed).find(Array.isArray) ?? []
      : [];

  if (foods.length === 0) {
    throw new Error("No foods found in OpenAI response");
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
    throw new Error("No valid foods in OpenAI response");
  }

  return validated;
}
