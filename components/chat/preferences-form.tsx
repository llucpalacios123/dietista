"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import type { NutritionistPreferencesSchema } from "@/lib/schemas";
import { ChefHat, BadgeDollarSign, Apple, Clock, Heart } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────

interface PreferencesFormProps {
  /** Initial preference values (for re-editing). */
  initialValues?: Partial<NutritionistPreferencesSchema>;
  /** Callback when user submits preferences. */
  onSubmit: (preferences: NutritionistPreferencesSchema) => void;
}

// ─── Default Values ───────────────────────────────────────────────────────

const DEFAULTS: NutritionistPreferencesSchema = {
  allergies: [],
  dislikedFoods: [],
  dietType: null,
  budgetFriendly: false,
  weeklyBudget: null,
  mealComplexity: null,
  mealsPerDay: 3,
  includeSnacks: false,
  varietyPreference: null,
  favoriteFoods: [],
  eatingOutFrequency: null,
  cookingTimeAvailable: null,
};

const VARIETY_KEY_MAP: Record<string, string> = {
  low: "varietyLow",
  medium: "varietyMedium",
  high: "varietyHigh",
};

const MEAL_COUNT_OPTIONS = [2, 3, 4, 5, 6] as const;

// ─── Component ────────────────────────────────────────────────────────────

/**
 * PreferencesForm — Step 3: Preferences Collection
 *
 * Structured form to collect food preferences: allergies, diet type,
 * budget settings, meal complexity, meals per day, snacks, variety,
 * and favorite foods.
 */
export function PreferencesForm({
  initialValues = {},
  onSubmit,
}: PreferencesFormProps) {
  const t = useTranslations("Preferences");
  const tc = useTranslations("Common");
  const [values, setValues] = useState<NutritionistPreferencesSchema>({
    ...DEFAULTS,
    ...initialValues,
  });
  const [allergyInput, setAllergyInput] = useState("");
  const [dislikeInput, setDislikeInput] = useState("");
  const [favoriteInput, setFavoriteInput] = useState("");

  const eatingOutLabels = t.raw("eatingOutFrequency") as unknown as Record<string, string>;

  const update = useCallback(
    <K extends keyof NutritionistPreferencesSchema>(
      key: K,
      value: NutritionistPreferencesSchema[K],
    ) => {
      setValues((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const addItem = useCallback(
    (key: "allergies" | "dislikedFoods" | "favoriteFoods", input: string, clearFn: () => void) => {
      const trimmed = input.trim();
      if (!trimmed) return;
      setValues((prev) => ({
        ...prev,
        [key]: [...prev[key], trimmed],
      }));
      clearFn();
    },
    [],
  );

  const removeItem = useCallback(
    (key: "allergies" | "dislikedFoods" | "favoriteFoods", index: number) => {
      setValues((prev) => ({
        ...prev,
        [key]: prev[key].filter((_, i) => i !== index),
      }));
    },
    [],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(values);
    },
    [values, onSubmit],
  );

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ChefHat className="h-5 w-5" />
          {t("title")}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Allergies */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Apple className="h-4 w-4" />
              {t("allergies")}
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder={t("allergiesPlaceholder")}
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addItem("allergies", allergyInput, () => setAllergyInput(""));
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addItem("allergies", allergyInput, () => setAllergyInput(""))}
              >
                {t("add")}
              </Button>
            </div>
            {values.allergies.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {values.allergies.map((a, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs"
                  >
                    {a}
                    <button
                      type="button"
                      onClick={() => removeItem("allergies", i)}
                      className="hover:text-destructive"
                      aria-label={`${t("removeLabel")} ${a}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Disliked Foods */}
          <div className="space-y-2">
            <Label>{t("dislikedFoods")}</Label>
            <div className="flex gap-2">
              <Input
                placeholder={t("dislikedPlaceholder")}
                value={dislikeInput}
                onChange={(e) => setDislikeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addItem("dislikedFoods", dislikeInput, () => setDislikeInput(""));
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addItem("dislikedFoods", dislikeInput, () => setDislikeInput(""))}
              >
                {t("add")}
              </Button>
            </div>
            {values.dislikedFoods.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {values.dislikedFoods.map((d, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs"
                  >
                    {d}
                    <button
                      type="button"
                      onClick={() => removeItem("dislikedFoods", i)}
                      className="hover:text-destructive"
                      aria-label={`${t("removeLabel")} ${d}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Diet Type */}
          <div className="space-y-1.5">
            <Label>{t("dietType")}</Label>
            <Select
              value={values.dietType ?? ""}
              onValueChange={(v) =>
                update("dietType", v as NutritionistPreferencesSchema["dietType"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectDietType")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="omnivore">{t("omnivore")}</SelectItem>
                <SelectItem value="vegetarian">{t("vegetarian")}</SelectItem>
                <SelectItem value="vegan">{t("vegan")}</SelectItem>
                <SelectItem value="pescatarian">{t("pescatarian")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Budget Friendly */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <BadgeDollarSign className="h-4 w-4" />
              {t("budgetMode")}
            </Label>
            <Select
              value={values.budgetFriendly ? "true" : "false"}
              onValueChange={(v) => update("budgetFriendly", v === "true")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">{t("budgetNo")}</SelectItem>
                <SelectItem value="true">{t("budgetYes")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Weekly Budget */}
          {values.budgetFriendly && (
            <div className="space-y-1.5">
              <Label>{t("weeklyBudget")}</Label>
              <Input
                type="number"
                placeholder={t("weeklyBudgetPlaceholder")}
                value={values.weeklyBudget ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  update("weeklyBudget", val ? Number(val) : null);
                }}
                min={0}
                step={5}
              />
            </div>
          )}

          {/* Meal Complexity */}
          <div className="space-y-1.5">
            <Label>{t("complexity")}</Label>
            <Select
              value={values.mealComplexity ?? ""}
              onValueChange={(v) =>
                update("mealComplexity", v as NutritionistPreferencesSchema["mealComplexity"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("complexityPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">{t("simple")}</SelectItem>
                <SelectItem value="moderate">{t("moderate")}</SelectItem>
                <SelectItem value="advanced">{t("advanced")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Meals Per Day */}
          <div className="space-y-1.5">
            <Label>{t("mealsPerDay")}</Label>
            <Select
              value={String(values.mealsPerDay)}
              onValueChange={(v) => update("mealsPerDay", Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEAL_COUNT_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {t("mealsCount", { count: n })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Include Snacks */}
          <div className="space-y-1.5">
            <Label>{t("includeSnacks")}</Label>
            <Select
              value={values.includeSnacks ? "true" : "false"}
              onValueChange={(v) => update("includeSnacks", v === "true")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">{tc("no")}</SelectItem>
                <SelectItem value="true">{tc("yes")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Variety Preference */}
          <div className="space-y-1.5">
            <Label>{t("variety")}</Label>
            <Select
              value={values.varietyPreference ?? ""}
              onValueChange={(v) =>
                update("varietyPreference", v as NutritionistPreferencesSchema["varietyPreference"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("varietyPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{t(VARIETY_KEY_MAP["low"])}</SelectItem>
                <SelectItem value="medium">{t(VARIETY_KEY_MAP["medium"])}</SelectItem>
                <SelectItem value="high">{t(VARIETY_KEY_MAP["high"])}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Favorite Foods */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Heart className="h-4 w-4" />
              {t("favoriteFoods")}
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder={t("favoritePlaceholder")}
                value={favoriteInput}
                onChange={(e) => setFavoriteInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addItem("favoriteFoods", favoriteInput, () => setFavoriteInput(""));
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addItem("favoriteFoods", favoriteInput, () => setFavoriteInput(""))}
              >
                {t("add")}
              </Button>
            </div>
            {values.favoriteFoods.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {values.favoriteFoods.map((f, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs"
                  >
                    {f}
                    <button
                      type="button"
                      onClick={() => removeItem("favoriteFoods", i)}
                      className="hover:text-destructive"
                      aria-label={`${t("removeLabel")} ${f}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Eating Out Frequency */}
          <div className="space-y-1.5">
            <Label>{t("eatingOut")}</Label>
            <Select
              value={values.eatingOutFrequency ?? ""}
              onValueChange={(v) =>
                update("eatingOutFrequency", v as NutritionistPreferencesSchema["eatingOutFrequency"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("eatingOutPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">{eatingOutLabels["never"]}</SelectItem>
                <SelectItem value="rarely">{eatingOutLabels["rarely"]}</SelectItem>
                <SelectItem value="sometimes">{eatingOutLabels["sometimes"]}</SelectItem>
                <SelectItem value="often">{eatingOutLabels["often"]}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cooking Time Available */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {t("cookingTime")}
            </Label>
            <Input
              type="number"
              placeholder={t("cookingTimePlaceholder")}
              value={values.cookingTimeAvailable ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                update("cookingTimeAvailable", val ? Number(val) : null);
              }}
              min={5}
              step={5}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <Button type="submit" size="lg">
              {t("continue")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
