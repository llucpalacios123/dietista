-- AlterTable: convert aiSuggestion from TEXT to JSONB (non-destructive)
-- Existing string values are wrapped as JSON strings via to_jsonb()
-- NULL values remain NULL
ALTER TABLE "DiaryEntry"
  ALTER COLUMN "aiSuggestion" TYPE JSONB
  USING CASE
    WHEN "aiSuggestion" IS NULL THEN NULL
    ELSE to_jsonb("aiSuggestion")
  END;
