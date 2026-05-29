import { z } from "zod";
import { MuscleGroup } from "@prisma/client";

// ─── OpenAI Model Constants ──────────────────────────────────────────────────

export const OPENAI_MODELS = [
  "gpt-4o-mini",
  "gpt-4o",
  "gpt-4.1",
  "gpt-4.1-mini",
  "gpt-4.1-nano",
  "gpt-4-turbo",
  "gpt-3.5-turbo",
  "gpt-5",
  "gpt-5-mini",
  "gpt-5-nano",
  "gpt-5-pro",
] as const;

export type OpenAIModel = (typeof OPENAI_MODELS)[number];

export const DEFAULT_MODEL: OpenAIModel = "gpt-4o-mini";

// ─── Auth Schemas ────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().email("Email no válido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "La contraseña debe contener al menos una mayúscula")
    .regex(/[0-9]/, "La contraseña debe contener al menos un número"),
});

export const loginSchema = z.object({
  email: z.string().email("Email no válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

// ─── Profile Schema ──────────────────────────────────────────────────────

export const profileSchema = z.object({
  weight: z.coerce.number().positive("El peso debe ser positivo"),
  height: z.coerce.number().positive("La altura debe ser positiva"),
  age: z.coerce.number().int().positive("La edad debe ser un número entero positivo"),
  sex: z.enum(["male", "female", "other"], {
    required_error: "El sexo es obligatorio",
  }),
  goal: z.enum(["lose", "maintain", "gain"], {
    required_error: "El objetivo es obligatorio",
  }),
  activityLevel: z.enum(
    ["sedentary", "light", "moderate", "active", "veryActive"],
    {
      required_error: "El nivel de actividad es obligatorio",
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

// ─── Workout Schemas ─────────────────────────────────────────────────────

export const workoutSetSchema = z.object({
  sessionId: z.string().min(1),
  exerciseName: z.string().min(1),
  muscleGroup: z.nativeEnum(MuscleGroup),
  reps: z.number().int().min(1),
  weightKg: z.number().positive().optional(),
  notes: z.string().optional(),
});

export const bulkWorkoutSetSchema = z.object({
  sessionId: z.string().min(1),
  exerciseName: z.string().min(1),
  muscleGroup: z.nativeEnum(MuscleGroup),
  sets: z
    .array(
      z.object({
        setNumber: z.number().int().min(1),
        plannedReps: z.number().int().min(1),
        plannedWeightKg: z.number().positive().optional(),
      }),
    )
    .min(1)
    .max(20),
});

export const executeSetSchema = z.object({
  reps: z.number().int().min(1),
  weightKg: z.number().positive().optional(),
});

export const workoutSessionSchema = z.object({
  date: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
});

export type WorkoutSetInput = z.infer<typeof workoutSetSchema>;
export type BulkWorkoutSetInput = z.infer<typeof bulkWorkoutSetSchema>;
export type ExecuteSetInput = z.infer<typeof executeSetSchema>;
export type WorkoutSessionInput = z.infer<typeof workoutSessionSchema>;

// ─── Weight Entry Schema ─────────────────────────────────────────────────

export const weightEntrySchema = z.object({
  weight: z.number().positive().min(30).max(300),
  date: z.string().datetime().optional(),
  notes: z.string().max(280).optional(),
});

export type WeightEntrySchema = z.infer<typeof weightEntrySchema>;

// ─── Meal Log Schema ─────────────────────────────────────────────────────

export const mealLogSchema = z.object({
  date: z.string().datetime("Formato de fecha no válido"),
  mealType: z.enum(["breakfast", "mid_morning", "lunch", "dinner", "snack"], {
    required_error: "El tipo de comida es obligatorio",
  }),
  rawInput: z.string().min(1, "La descripción de la comida es obligatoria"),
});

// ─── Meal Plan Generation Schema (AI response validation) ────────────────

export const mealItemSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  mealType: z.enum(["breakfast", "mid_morning", "lunch", "dinner", "snack"]),
  name: z.string().min(1),
  description: z.string().nullish().transform((val) => val ?? ""),
  calories: z.number().positive(),
  protein: z.number().nullish().transform((val) => val ?? 0),
  carbs: z.number().nullish().transform((val) => val ?? 0),
  fat: z.number().nullish().transform((val) => val ?? 0),
  ingredients: z.array(z.object({
    name: z.string().min(1),
    quantity: z.number().positive().optional(),
    unit: z.string().optional(),
  })).default([]),
  instructions: z.string().nullish().transform((val) => val ?? ""),
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

// ─── Meal Plan Schemas ────────────────────────────────────────────────────

export const renamePlanSchema = z.object({
  name: z.string().max(60, "Name too long"),
});

export type RenamePlanInput = z.infer<typeof renamePlanSchema>;

// ─── Account Schemas ─────────────────────────────────────────────────────

export const accountNameSchema = z.object({
  name: z.string().max(100, "El nombre no puede tener más de 100 caracteres"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "La contraseña actual es obligatoria"),
    newPassword: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(/[A-Z]/, "La contraseña debe contener al menos una mayúscula")
      .regex(/[0-9]/, "La contraseña debe contener al menos un número"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type AccountNameSchema = z.infer<typeof accountNameSchema>;
export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;

// ─── Type Exports ────────────────────────────────────────────────────────

export type RegisterSchema = z.infer<typeof registerSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
export type ProfileSchema = z.infer<typeof profileSchema>;
export type MealLogSchema = z.infer<typeof mealLogSchema>;
export type MealItemSchema = z.infer<typeof mealItemSchema>;
export type InterpretedFoodSchema = z.infer<typeof interpretedFoodSchema>;

// ─── Diary Schemas ────────────────────────────────────────────────────────────

const mealTypeEnum = z.enum(["breakfast", "mid_morning", "lunch", "dinner", "snack"]);

// ─── Suggested Meal Schema (used by AI suggestion flow) ───────────────────────

export const suggestedMealSchema = z.object({
  foodName: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string(),
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  description: z.string().optional(),
  ingredients: z.array(z.object({
    name: z.string().min(1),
    quantity: z.number().positive().optional(),
    unit: z.string().optional(),
  })).optional(),
  instructions: z.string().optional(),
});

export type SuggestedMeal = z.infer<typeof suggestedMealSchema>;

// ─── Chat Message Schema ──────────────────────────────────────────────────────

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  text: z.string().min(1).max(2000),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const toggleMealCompletedSchema = z.object({
  date: z.coerce.date(),
  mealType: mealTypeEnum,
  mealId: z.string().optional(),
  macros: z
    .object({
      calories: z.number().nonnegative(),
      protein: z.number().nonnegative(),
      carbs: z.number().nonnegative(),
      fat: z.number().nonnegative(),
    })
    .optional(),
});

export const suggestMealSchema = z.object({
  date: z.coerce.date(),
  mealType: mealTypeEnum,
  query: z.string().min(1).max(280),
  history: z.array(chatMessageSchema).max(20).optional(),
});

export const saveSuggestedMealSchema = z.object({
  date: z.coerce.date(),
  mealType: mealTypeEnum,
  mealId: z.string().optional(),
  suggestion: suggestedMealSchema,
});

export type ToggleMealCompletedInput = z.infer<typeof toggleMealCompletedSchema>;
export type SuggestMealInput = z.infer<typeof suggestMealSchema>;
export type SaveSuggestedMealInput = z.infer<typeof saveSuggestedMealSchema>;

// ─── Workout Plan Content Schema (AI-generated plan stored as JSON) ───────────

export const workoutPlanSetSchema = z.object({
  reps: z.number().int().positive().nullable(),    // null = "to failure"
  weightKg: z.number().nonnegative().nullable(),   // null = bodyweight
  rir: z.number().int().min(0).max(5).optional(),  // reps in reserve
  durationSec: z.number().int().positive().optional(), // cardio/isometric
});

export const workoutPlanExerciseSchema = z.object({
  name: z.string().min(1),
  muscleGroup: z.nativeEnum(MuscleGroup),
  isFromCatalog: z.boolean(),
  sets: z.array(workoutPlanSetSchema).min(1).max(10),
  restSec: z.number().int().nonnegative().default(60),
  notes: z.string().optional(),
  tempo: z.string().optional(),
});

export const workoutPlanDaySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),       // 0=Mon..6=Sun
  focus: z.array(z.nativeEnum(MuscleGroup)),
  title: z.string().min(1),
  warmupMin: z.number().int().min(0).default(5),
  cooldownMin: z.number().int().min(0).default(5),
  exercises: z.array(workoutPlanExerciseSchema).max(15),
  isRestDay: z.boolean().default(false),
}).superRefine((day, ctx) => {
  if (!day.isRestDay && day.exercises.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_small,
      minimum: 1,
      type: "array",
      inclusive: true,
      message: "Non-rest days must have at least one exercise",
      path: ["exercises"],
    });
  }
  if (!day.isRestDay && day.focus.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_small,
      minimum: 1,
      type: "array",
      inclusive: true,
      message: "Non-rest days must have at least one focus muscle group",
      path: ["focus"],
    });
  }
});

// v1: legacy calendar-week plans (dayOfWeek = 0=Mon..6=Sun)
// v2: day-relative plans (dayOfWeek = 0-based day index, 0=Día 1)
// TODO(rename): rename `dayOfWeek` -> `dayIndex` in a future change; kept now to avoid DB content migration.

const workoutPlanContentBase = {
  days: z.array(workoutPlanDaySchema).min(1).max(7),
  weeklyVolumeNotes: z.string().optional(),
};

export const workoutPlanContentV1Schema = z.object({
  version: z.literal(1),
  ...workoutPlanContentBase,
});

export const workoutPlanContentV2Schema = z.object({
  version: z.literal(2),
  ...workoutPlanContentBase,
});

export const workoutPlanContentSchema = z.discriminatedUnion("version", [
  workoutPlanContentV1Schema,
  workoutPlanContentV2Schema,
]);

export type WorkoutPlanSet = z.infer<typeof workoutPlanSetSchema>;
export type WorkoutPlanExercise = z.infer<typeof workoutPlanExerciseSchema>;
export type WorkoutPlanDay = z.infer<typeof workoutPlanDaySchema>;
export type WorkoutPlanContent = z.infer<typeof workoutPlanContentSchema>;

// ─── Workout Preferences Schema (wizard step 3) ───────────────────────────────

export const workoutPreferencesSchema = z.object({
  goal: z.enum(["strength", "endurance", "weight_loss", "toning", "hypertrophy"]),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  daysPerWeek: z.number().int().min(1).max(7),
  focusGroups: z.array(z.nativeEnum(MuscleGroup)).min(1),
  equipment: z.array(
    z.enum(["gym", "home_basic", "dumbbells", "bands", "bodyweight"])
  ),
  sessionDurationMin: z.number().int().positive(),
  name: z.string().min(1).default("Mi plan de entrenamiento"),
  notes: z.string().optional(),
  model: z.enum(OPENAI_MODELS).default("gpt-4o-mini"),
});

export type WorkoutPreferences = z.infer<typeof workoutPreferencesSchema>;

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
  model: z.enum(OPENAI_MODELS).default("gpt-4o-mini"),
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
  ingredients: z.array(z.object({
    name: z.string(),
    quantity: z.number().optional(),
    unit: z.string().optional(),
  })).default([]),
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
