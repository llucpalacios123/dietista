import { describe, it, expect } from "vitest";
import esMessages from "@/messages/es.json";
import enMessages from "@/messages/en.json";

const REQUIRED_JOURNAL_KEYS = [
  "markDone",
  "markUndone",
  "askAI",
  "aiModalTitle",
  "aiModalPlaceholder",
  "submit",
  "save",
  "cancel",
  "rateLimitError",
  "aiParseError",
  "noPlan",
  "aiLoading",
  "completed",
  "suggestedFood",
  "dailyLimitReached",
  "aiNoPlanHint",
];

describe("Journal i18n keys — es.json", () => {
  const journal = (esMessages as Record<string, Record<string, string>>).Journal;

  it.each(REQUIRED_JOURNAL_KEYS)(
    "has key Journal.%s in es.json",
    (key) => {
      expect(journal).toBeDefined();
      expect(journal[key]).toBeDefined();
      expect(typeof journal[key]).toBe("string");
      expect(journal[key].length).toBeGreaterThan(0);
    }
  );
});

describe("Journal i18n keys — en.json", () => {
  const journal = (enMessages as Record<string, Record<string, string>>).Journal;

  it.each(REQUIRED_JOURNAL_KEYS)(
    "has key Journal.%s in en.json",
    (key) => {
      expect(journal).toBeDefined();
      expect(journal[key]).toBeDefined();
      expect(typeof journal[key]).toBe("string");
      expect(journal[key].length).toBeGreaterThan(0);
    }
  );
});
