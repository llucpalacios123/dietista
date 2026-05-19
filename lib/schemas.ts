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
  dietType: z
    .enum(["omnivore", "vegetarian", "vegan", "pescatarian"])
    .optional(),
  cookingTimeAvailable: z.coerce.number().int().positive().optional(),
  eatingOutFrequency: z
    .enum(["never", "rarely", "sometimes", "often"])
    .optional(),
  includeSnacks: z.boolean().default(false),
  mealComplexity: z
    .enum(["simple", "moderate", "advanced"])
    .optional(),
  mealsPerDay: z.coerce.number().int().min(1).max(6).default(3),
  varietyPreference: z.enum(["low", "medium", "high"]).optional(),
  budgetFriendly: z.boolean().default(false),
  weeklyBudget: z.coerce.number().positive().optional(),
  trainingRoutine: z.string().optional(),
  favoriteFoods: z.array(z.string()).default([]),
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

// ─── Backward-Compatible Alias ────────────────────────────────────────────

export const UserProfileSchema = profileSchema;
export type UserProfileSchema = z.infer<typeof profileSchema>;

// ─── Nutritionist Preferences Schema ──────────────────────────────────────

export const userPreferencesSchema = z.object({
  allergies: z.array(z.string()).default([]),
  dislikedFoods: z.array(z.string()).default([]),
  dietType: z
    .enum(["omnivore", "vegetarian", "vegan", "pescatarian"])
    .nullable()
    .default(null),
  budgetFriendly: z.boolean().default(false),
  weeklyBudget: z.number().positive().nullable().default(null),
  mealComplexity: z
    .enum(["simple", "moderate", "advanced"])
    .nullable()
    .default(null),
  mealsPerDay: z.number().int().min(1).max(6).default(3),
  includeSnacks: z.boolean().default(false),
  varietyPreference: z
    .enum(["low", "medium", "high"])
    .nullable()
    .default(null),
  favoriteFoods: z.array(z.string()).default([]),
  eatingOutFrequency: z
    .enum(["never", "rarely", "sometimes", "often"])
    .nullable()
    .default(null),
  cookingTimeAvailable: z.number().int().positive().nullable().default(null),
});

export type NutritionistPreferencesSchema = z.infer<
  typeof userPreferencesSchema
>;
// Backward compat for code using the old name
export type UserPreferencesSchema = NutritionistPreferencesSchema;

// ─── Nutritionist Chat State Schema ───────────────────────────────────────

export const nutritionistChatStateSchema = z.object({
  currentStep: z.enum([
    "PROFILE_REVIEW",
    "PROFILE_MODIFICATION",
    "PREFERENCES_COLLECTION",
    "GENERATION",
    "REVIEW_MODIFICATION",
    "CONFIRMATION",
  ]),
  profileData: profileSchema.nullable(),
  preferences: userPreferencesSchema.nullable(),
  generatedPlan: z.unknown().nullable(),
  modifications: z.array(z.unknown()).default([]),
  validatedJson: z.unknown().nullable(),
});

export type NutritionistStep = z.infer<
  typeof nutritionistChatStateSchema
>["currentStep"];
export type NutritionistChatStateSchema = z.infer<
  typeof nutritionistChatStateSchema
>;

// ─── Spring Boot Output Schemas ───────────────────────────────────────────

export const dailyTotalsSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
});

export const springBootMealSchema = z.object({
  mealType: z.string(),
  name: z.string(),
  description: z.string(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  ingredients: z.array(z.string()).default([]),
  instructions: z.string().default(""),
});

export const springBootDaySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  meals: z.array(springBootMealSchema),
  dailyTotals: dailyTotalsSchema,
});

export const springBootWeeklyPlanSchema = z.object({
  days: z.array(springBootDaySchema),
  weeklyTotals: dailyTotalsSchema,
  shoppingList: z.unknown().nullable().default(null),
});

export const springBootUserProfileSchema = z.object({
  weight: z.number().positive(),
  height: z.number().positive(),
  age: z.number().int().positive(),
  sex: z.enum(["male", "female", "other"]),
  goal: z.enum(["lose", "maintain", "gain"]),
  activityLevel: z.enum([
    "sedentary",
    "light",
    "moderate",
    "active",
    "veryActive",
  ]),
  trainingRoutine: z.string().nullable().optional().default(null),
  dietType: z
    .enum(["omnivore", "vegetarian", "vegan", "pescatarian"])
    .nullable()
    .optional()
    .default(null),
  budgetFriendly: z.boolean(),
  weeklyBudget: z.number().positive().nullable().optional().default(null),
  mealComplexity: z
    .enum(["simple", "moderate", "advanced"])
    .nullable()
    .optional()
    .default(null),
  mealsPerDay: z.number().int().min(1).max(6),
  includeSnacks: z.boolean(),
  varietyPreference: z
    .enum(["low", "medium", "high"])
    .nullable()
    .optional()
    .default(null),
  favoriteFoods: z.array(z.string()).nullable().optional().default(null),
  eatingOutFrequency: z
    .enum(["never", "rarely", "sometimes", "often"])
    .nullable()
    .optional()
    .default(null),
  cookingTimeAvailable: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional()
    .default(null),
});

export const springBootPreferencesSchema = z.object({
  allergies: z.array(z.string()),
  dislikes: z.array(z.string()),
  maxCookingTime: z.number().int().positive().nullable().default(null),
});

export const springBootOutputSchema = z.object({
  userProfile: springBootUserProfileSchema,
  preferences: springBootPreferencesSchema,
  weeklyPlan: springBootWeeklyPlanSchema,
});

export type SpringBootOutputSchema = z.infer<typeof springBootOutputSchema>;
export type SpringBootWeeklyPlanSchema = z.infer<
  typeof springBootWeeklyPlanSchema
>;
