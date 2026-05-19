import { z } from "zod";

// ─── Auth Schemas ────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ─── Profile Schema ──────────────────────────────────────────────────────

export const profileSchema = z.object({
  weight: z.coerce.number().positive("Weight must be positive"),
  height: z.coerce.number().positive("Height must be positive"),
  age: z.coerce.number().int().positive("Age must be a positive integer"),
  sex: z.enum(["male", "female", "other"], {
    required_error: "Sex is required",
  }),
  goal: z.enum(["lose", "maintain", "gain"], {
    required_error: "Goal is required",
  }),
  activityLevel: z.enum(
    ["sedentary", "light", "moderate", "active", "veryActive"],
    {
      required_error: "Activity level is required",
    }
  ),
  targetCalories: z.coerce.number().positive().optional(),
  targetProtein: z.coerce.number().positive().optional(),
  targetCarbs: z.coerce.number().positive().optional(),
  targetFat: z.coerce.number().positive().optional(),
  allergies: z.array(z.string()).default([]),
  forbiddenFoods: z.array(z.string()).default([]),
});

// ─── Meal Log Schema ─────────────────────────────────────────────────────

export const mealLogSchema = z.object({
  date: z.string().datetime("Invalid date format"),
  mealType: z.enum(["breakfast", "mid_morning", "lunch", "dinner", "snack"], {
    required_error: "Meal type is required",
  }),
  rawInput: z.string().min(1, "Food description is required"),
});

// ─── Meal Plan Generation Schema (AI response validation) ────────────────

export const mealItemSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  mealType: z.enum(["breakfast", "mid_morning", "lunch", "dinner", "snack"]),
  name: z.string().min(1),
  description: z.string().min(1),
  calories: z.number().positive(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
});

export const mealPlanResponseSchema = z.array(mealItemSchema);

// ─── Interpreted Food Schema (AI meal interpretation) ────────────────────

export const interpretedFoodSchema = z.object({
  foodName: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string(),
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  confidence: z.enum(["high", "medium", "low"]).default("medium"),
});

// ─── Type Exports ────────────────────────────────────────────────────────

export type RegisterSchema = z.infer<typeof registerSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
export type ProfileSchema = z.infer<typeof profileSchema>;
export type MealLogSchema = z.infer<typeof mealLogSchema>;
export type MealItemSchema = z.infer<typeof mealItemSchema>;
export type InterpretedFoodSchema = z.infer<typeof interpretedFoodSchema>;

// ─── Chat Conversation Schemas ───────────────────────────────────────────

/** Nutritional and dietary preferences collected during chat conversation. */
export const chatUserPreferencesSchema = z.object({
  goal: z.enum(["lose", "maintain", "gain"]).optional(),
  activityLevel: z
    .enum(["sedentary", "light", "moderate", "active", "veryActive"])
    .optional(),
  allergies: z.array(z.string()).default([]),
  forbiddenFoods: z.array(z.string()).default([]),
  calories: z.number().positive().optional(),
  protein: z.number().nonnegative().optional(),
  carbs: z.number().nonnegative().optional(),
  fat: z.number().nonnegative().optional(),
  weight: z.number().positive().optional(),
  height: z.number().positive().optional(),
  age: z.number().int().positive().optional(),
  sex: z.enum(["male", "female", "other"]).optional(),
});

/** Data extracted during a chat conversation — preferences and/or PDF content. */
export const chatExtractedDataSchema = z.object({
  preferences: chatUserPreferencesSchema.optional(),
  pdfData: z
    .object({
      rawText: z.string().min(1, "PDF text must not be empty"),
      extractedAt: z.string().datetime().optional(),
    })
    .optional(),
  confidence: z.enum(["high", "medium", "low"]).default("medium"),
});

/** State machine step identifiers for the chat conversation flow. */
export type ChatConversationStep =
  | "collect_preferences"
  | "collect_dietary_restrictions"
  | "collect_pdf_input"
  | "confirm_generation"
  | "generating"
  | "complete";

/** Full conversation state tracked by the state machine. */
export const chatConversationStateSchema = z.object({
  step: z.enum([
    "collect_preferences",
    "collect_dietary_restrictions",
    "collect_pdf_input",
    "confirm_generation",
    "generating",
    "complete",
  ] as const satisfies readonly [string, ...string[]]),
  collectedData: chatExtractedDataSchema,
  isComplete: z.boolean(),
});

// ─── Type Exports ────────────────────────────────────────────────────────

export type ChatUserPreferencesSchema = z.infer<
  typeof chatUserPreferencesSchema
>;
export type ChatExtractedDataSchema = z.infer<
  typeof chatExtractedDataSchema
>;
export type ChatConversationStateSchema = z.infer<
  typeof chatConversationStateSchema
>;
