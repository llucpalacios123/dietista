import { tool } from "ai";
import { z } from "zod";
import {
  chatUserPreferencesSchema,
  chatExtractedDataSchema,
  type ChatExtractedDataSchema,
} from "./schemas";

// ─── Tool Input Schemas ──────────────────────────────────────────────────

const extractPreferencesInput = z.object({
  goal: z.enum(["lose", "maintain", "gain"]).describe("User's primary goal"),
  activityLevel: z
    .enum(["sedentary", "light", "moderate", "active", "veryActive"])
    .describe("User's activity level"),
  allergies: z
    .array(z.string())
    .describe("Food allergies mentioned by the user"),
});

const extractPdfDataInput = z.object({
  summary: z
    .string()
    .min(1)
    .describe("Summary of nutritional data extracted from the PDF"),
  goal: z
    .enum(["lose", "maintain", "gain"])
    .optional()
    .describe("Goal inferred from the PDF"),
  activityLevel: z
    .enum(["sedentary", "light", "moderate", "active", "veryActive"])
    .optional()
    .describe("Activity level inferred from the PDF"),
  allergies: z
    .array(z.string())
    .describe("Allergies identified in the PDF"),
});

const confirmGenerationInput = z.object({
  summary: z
    .string()
    .min(1)
    .describe("Summary of all collected data that will be used for generation"),
});

// ─── Store for extracted data (in-memory, session-scoped) ────────────────

interface SessionDataStore {
  preferences: z.infer<typeof chatUserPreferencesSchema>;
  pdfData?: { rawText: string; extractedAt?: string };
  confidence: "high" | "medium" | "low";
}

const sessionDataStore = new Map<string, SessionDataStore>();

/** Current session ID for tool execution context. Set by the server action. */
let currentSessionId = "default";

/**
 * Set the session ID used by tools during execution.
 * Called by the chat server action before tool execution.
 */
export function setToolSessionId(sessionId: string): void {
  currentSessionId = sessionId;
}

/**
 * Retrieve the accumulated chat-extracted data for a given session.
 * Returns a valid ChatExtractedDataSchema object or null if none stored.
 */
export function getSessionData(
  sessionId: string
): ChatExtractedDataSchema | null {
  const data = sessionDataStore.get(sessionId);
  if (!data) return null;

  const result = chatExtractedDataSchema.safeParse(data);
  if (!result.success) return null;
  return result.data;
}

/**
 * Set session data directly (used by PDF upload to pre-populate).
 */
export function setSessionData(
  sessionId: string,
  data: ChatExtractedDataSchema
): void {
  sessionDataStore.set(sessionId, {
    preferences: data.preferences ?? { allergies: [], forbiddenFoods: [] },
    pdfData: data.pdfData,
    confidence: data.confidence,
  });
}

/**
 * Clear session data from the store.
 */
export function clearSessionData(sessionId: string): void {
  sessionDataStore.delete(sessionId);
}

// ─── Generation Trigger State ────────────────────────────────────────────

const generationTriggered = new Map<string, boolean>();

/**
 * Check if generation has been triggered (confirmed) for a user.
 */
export function isGenerationTriggered(userId: string): boolean {
  return generationTriggered.get(userId) ?? false;
}

/**
 * Set the generation trigger state for a user.
 */
export function setGenerationTriggered(userId: string, value: boolean): void {
  generationTriggered.set(userId, value);
}

/**
 * Reset generation trigger state for a user.
 */
export function resetGenerationTrigger(userId: string): void {
  generationTriggered.set(userId, false);
}

/**
 * Get the collected chat data for a user session.
 */
export function getCollectedChatData(userId: string) {
  return getSessionData(userId);
}

/**
 * Get the current merged preferences for a session.
 * Falls back to empty defaults.
 */
export function getMergedPreferences(
  sessionId: string
): z.infer<typeof chatUserPreferencesSchema> {
  const data = sessionDataStore.get(sessionId);
  return (data?.preferences as z.infer<typeof chatUserPreferencesSchema>) ?? {
    allergies: [],
    forbiddenFoods: [],
  };
}

/**
 * Merge new preferences into existing session data.
 * Returns the updated ChatExtractedDataSchema.
 */
function mergePreferences(
  sessionId: string,
  incoming: Partial<z.infer<typeof chatUserPreferencesSchema>>
): ChatExtractedDataSchema {
  const existing = sessionDataStore.get(sessionId);

  // Filter out undefined values so they don't override existing data
  const filteredIncoming = Object.fromEntries(
    Object.entries(incoming).filter(([, v]) => v !== undefined)
  );

  // Build merged preferences, ensuring required fields have defaults.
  // Spread existing first, then override with filtered incoming, then
  // ensure required fields (allergies, forbiddenFoods) are never undefined.
  const mergedPrefs = {
    ...existing?.preferences,
    ...filteredIncoming,
    allergies:
      (filteredIncoming.allergies as string[] | undefined) ??
      existing?.preferences?.allergies ??
      [],
    forbiddenFoods:
      (filteredIncoming.forbiddenFoods as string[] | undefined) ??
      existing?.preferences?.forbiddenFoods ??
      [],
  } as z.infer<typeof chatUserPreferencesSchema>;

  const merged: SessionDataStore = {
    preferences: mergedPrefs,
    pdfData: existing?.pdfData,
    confidence: existing?.confidence ?? "medium",
  };

  const validated = chatExtractedDataSchema.safeParse(merged);
  if (!validated.success) {
    throw new Error(`Invalid merged data: ${validated.error.message}`);
  }

  sessionDataStore.set(sessionId, merged);
  return validated.data;
}

// ─── Tool Definitions ────────────────────────────────────────────────────

/**
 * Tool: extractPreferences
 * Extracts goal, activity level, and allergies from user free-text input.
 * Merges results into the session data store.
 */
export const extractPreferencesTool = tool({
  description:
    "Extract nutritional preferences (goal, activity level, allergies) " +
    "from the user's free-text message and merge them into the session data.",
  inputSchema: extractPreferencesInput,
  execute: async (input) => {
    const merged = mergePreferences(currentSessionId, input);
    return {
      success: true,
      merged,
      message: `Preferences updated: goal=${merged.preferences?.goal ?? "not set"}, activity=${merged.preferences?.activityLevel ?? "not set"}, allergies=[${(merged.preferences?.allergies ?? []).join(", ") || "none"}]`,
    };
  },
});

/**
 * Tool: extractPdfData
 * Processes nutritional information extracted from an uploaded PDF.
 * Merges the extracted data into the session data store.
 */
export const extractPdfDataTool = tool({
  description:
    "Process nutritional data extracted from an uploaded PDF file. " +
    "The raw PDF text has already been extracted on the server; this tool " +
    "interprets the summarized findings and merges them into session data.",
  inputSchema: extractPdfDataInput,
  execute: async (input) => {
    const merged = mergePreferences(currentSessionId, {
      goal: input.goal,
      activityLevel: input.activityLevel,
      allergies: input.allergies,
    });

    return {
      success: true,
      merged,
      summary: input.summary,
      message:
        `PDF data processed: goal=${merged.preferences?.goal ?? "not specified"}, ` +
        `activity=${merged.preferences?.activityLevel ?? "not specified"}, ` +
        `allergies=[${(merged.preferences?.allergies ?? []).join(", ") || "none"}]`,
    };
  },
});

/**
 * Tool: confirmGeneration
 * Triggers meal plan generation when the AI determines all necessary data
 * has been collected. Returns a signal that the server action uses to
 * actually invoke diet-service.
 */
export const confirmGenerationTool = tool({
  description:
    "Confirm that all required data has been collected and signal that " +
    "meal plan generation should proceed. Call this ONLY when the user " +
    "has provided their goal, activity level, and any dietary restrictions.",
  inputSchema: confirmGenerationInput,
  execute: async ({ summary }) => {
    return {
      confirmed: true,
      summary,
      message:
        "Generation confirmed. Creating your personalized meal plan now...",
    };
  },
});

// ─── Tool Map (for streamText) ───────────────────────────────────────────

/** All chat tools combined into a single map for use with streamText. */
export const chatTools = {
  extractPreferences: extractPreferencesTool,
  extractPdfData: extractPdfDataTool,
  confirmGeneration: confirmGenerationTool,
};
