// ─── parseAiSuggestion ────────────────────────────────────────────────────────
//
// Defensive helper that reads DiaryEntry.aiSuggestion regardless of whether
// the stored value is:
//  - a parsed JSON object (new format after migration)
//  - a legacy string (e.g. "Grilled chicken 200g" — stored before migration)
//  - null / undefined

export type ParsedSuggestion = Record<string, unknown> & { foodName?: string };

export function parseAiSuggestion(value: unknown): ParsedSuggestion | null {
  if (value === null || value === undefined) {
    return null;
  }

  // Legacy: plain string stored before the Json migration
  if (typeof value === "string") {
    return { foodName: value };
  }

  // New format: object from Prisma Json field
  if (typeof value === "object" && !Array.isArray(value)) {
    return value as ParsedSuggestion;
  }

  // Unexpected shape (e.g., array, number) — treat as unreadable
  return null;
}
