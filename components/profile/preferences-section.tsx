"use client";

import { useActionState, startTransition, useState } from "react";
import type { JSX } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { profileSchema } from "@/lib/schemas";
import type { ProfileSchema } from "@/lib/schemas";
import { updateProfile } from "@/actions/profile";
import type { ProfileActionResult } from "@/actions/profile";
import type { Profile } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────

export interface PreferencesSectionProps {
  profile: Profile | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function arrayToString(arr: string[]): string {
  return arr.join(", ");
}

function stringToArray(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// ─── PreferencesSection ───────────────────────────────────────────────────

export function PreferencesSection({ profile }: PreferencesSectionProps): JSX.Element {
  const t = useTranslations("Profile");
  const [result, formAction] = useActionState<ProfileActionResult | null, FormData>(
    updateProfile,
    null
  );

  const form = useForm<ProfileSchema>({
    resolver: zodResolver(profileSchema),
    defaultValues: profile
      ? {
          // ── Body & Goals fields (needed for full-schema validation) ──────
          weight: profile.weight,
          height: profile.height,
          age: profile.age,
          sex: profile.sex as ProfileSchema["sex"],
          goal: profile.goal as ProfileSchema["goal"],
          activityLevel: profile.activityLevel as ProfileSchema["activityLevel"],
          targetCalories: profile.targetCalories ?? undefined,
          targetProtein: profile.targetProtein ?? undefined,
          targetCarbs: profile.targetCarbs ?? undefined,
          targetFat: profile.targetFat ?? undefined,
          trainingRoutine: profile.trainingRoutine ?? undefined,
          // ── Preferences fields ──────────────────────────────────────────
          allergies: profile.allergies,
          forbiddenFoods: profile.forbiddenFoods,
          favoriteFoods: profile.favoriteFoods,
          dietType: (profile.dietType as ProfileSchema["dietType"]) ?? undefined,
          cookingTimeAvailable: profile.cookingTimeAvailable ?? undefined,
          eatingOutFrequency:
            (profile.eatingOutFrequency as ProfileSchema["eatingOutFrequency"]) ?? undefined,
          includeSnacks: profile.includeSnacks,
          mealComplexity:
            (profile.mealComplexity as ProfileSchema["mealComplexity"]) ?? undefined,
          mealsPerDay: profile.mealsPerDay,
          varietyPreference:
            (profile.varietyPreference as ProfileSchema["varietyPreference"]) ?? undefined,
          budgetFriendly: profile.budgetFriendly,
          weeklyBudget: profile.weeklyBudget ?? undefined,
        }
      : {
          weight: undefined,
          height: undefined,
          age: undefined,
          sex: undefined,
          goal: undefined,
          activityLevel: undefined,
          targetCalories: undefined,
          targetProtein: undefined,
          targetCarbs: undefined,
          targetFat: undefined,
          trainingRoutine: undefined,
          allergies: [],
          forbiddenFoods: [],
          favoriteFoods: [],
          dietType: undefined,
          cookingTimeAvailable: undefined,
          eatingOutFrequency: undefined,
          includeSnacks: false,
          mealComplexity: undefined,
          mealsPerDay: 3,
          varietyPreference: undefined,
          budgetFriendly: false,
          weeklyBudget: undefined,
        },
    mode: "onSubmit",
  });

  // Separate controlled state for comma-separated array fields
  const [allergiesStr, setAllergiesStr] = useState(
    profile ? arrayToString(profile.allergies) : ""
  );
  const [forbiddenFoodsStr, setForbiddenFoodsStr] = useState(
    profile ? arrayToString(profile.forbiddenFoods) : ""
  );
  const [favoriteFoodsStr, setFavoriteFoodsStr] = useState(
    profile ? arrayToString(profile.favoriteFoods) : ""
  );

  const onSubmit = form.handleSubmit((data) => {
    const fd = new FormData();

    // ── Hidden Body & Goals fields (prevent data wipe) ───────────────────
    fd.set("weight", String(data.weight));
    fd.set("height", String(data.height));
    fd.set("age", String(data.age));
    fd.set("sex", data.sex);
    fd.set("goal", data.goal);
    fd.set("activityLevel", data.activityLevel);
    if (data.targetCalories) fd.set("targetCalories", String(data.targetCalories));
    if (data.targetProtein) fd.set("targetProtein", String(data.targetProtein));
    if (data.targetCarbs) fd.set("targetCarbs", String(data.targetCarbs));
    if (data.targetFat) fd.set("targetFat", String(data.targetFat));
    if (data.trainingRoutine) fd.set("trainingRoutine", data.trainingRoutine);

    // ── Visible Preferences fields ───────────────────────────────────────
    fd.set("allergies", JSON.stringify(stringToArray(allergiesStr)));
    fd.set("forbiddenFoods", JSON.stringify(stringToArray(forbiddenFoodsStr)));
    fd.set("favoriteFoods", JSON.stringify(stringToArray(favoriteFoodsStr)));
    if (data.dietType) fd.set("dietType", data.dietType);
    if (data.cookingTimeAvailable)
      fd.set("cookingTimeAvailable", String(data.cookingTimeAvailable));
    if (data.eatingOutFrequency) fd.set("eatingOutFrequency", data.eatingOutFrequency);
    fd.set("includeSnacks", String(data.includeSnacks));
    if (data.mealComplexity) fd.set("mealComplexity", data.mealComplexity);
    fd.set("mealsPerDay", String(data.mealsPerDay));
    if (data.varietyPreference) fd.set("varietyPreference", data.varietyPreference);
    fd.set("budgetFriendly", String(data.budgetFriendly));
    if (data.weeklyBudget) fd.set("weeklyBudget", String(data.weeklyBudget));

    startTransition(() => formAction(fd));
  });

  const inputClass =
    "w-full rounded-[var(--dietista-r)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] px-3 py-2 text-sm text-[var(--dietista-text)] placeholder:text-[var(--dietista-text-3)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]";
  const selectClass = inputClass;
  const labelClass = "mb-1 block text-sm font-medium text-[var(--dietista-text)]";
  const errorClass = "mt-1 text-xs text-red-600";
  const sectionTitleClass = "mb-3 text-sm font-semibold text-[var(--dietista-text-2)] pt-2 border-t border-[var(--dietista-border)] first:border-t-0 first:pt-0";

  return (
    <div className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)]">
      <h2 className="mb-4 text-base font-semibold text-[var(--dietista-text)]">
        {t("tabs.preferences")}
      </h2>

      {result?.success && (
        <div className="mb-4 rounded-[var(--dietista-r)] border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {t("updateSuccess")}
        </div>
      )}
      {result?.error && (
        <div className="mb-4 rounded-[var(--dietista-r)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {result.error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        {/* ── Diet Preferences ──────────────────────────────────────────── */}
        <h3 className={sectionTitleClass}>{t("dietPreferences")}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Diet Type */}
          <div>
            <label htmlFor="pref-dietType" className={labelClass}>
              {t("dietType")}
            </label>
            <select
              id="pref-dietType"
              {...form.register("dietType")}
              className={selectClass}
            >
              <option value="">{t("selectDietType")}</option>
              <option value="omnivore">{t("omnivore")}</option>
              <option value="vegetarian">{t("vegetarian")}</option>
              <option value="vegan">{t("vegan")}</option>
              <option value="pescatarian">{t("pescatarian")}</option>
            </select>
          </div>

          {/* Meals per Day */}
          <div>
            <label htmlFor="pref-mealsPerDay" className={labelClass}>
              {t("mealsPerDay")}
            </label>
            <input
              id="pref-mealsPerDay"
              type="number"
              min={1}
              max={6}
              placeholder="3"
              {...form.register("mealsPerDay", { valueAsNumber: true })}
              className={inputClass}
            />
            {form.formState.errors.mealsPerDay && (
              <p className={errorClass}>{form.formState.errors.mealsPerDay.message}</p>
            )}
          </div>

          {/* Include Snacks */}
          <div className="flex items-center gap-2">
            <input
              id="pref-includeSnacks"
              type="checkbox"
              {...form.register("includeSnacks")}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label
              htmlFor="pref-includeSnacks"
              className="text-sm font-medium text-[var(--dietista-text)]"
            >
              {t("includeSnacks")}
            </label>
          </div>

          {/* Variety Preference */}
          <div>
            <label htmlFor="pref-variety" className={labelClass}>
              {t("varietyPreference")}
            </label>
            <select
              id="pref-variety"
              {...form.register("varietyPreference")}
              className={selectClass}
            >
              <option value="">{t("selectVariety")}</option>
              <option value="low">{t("low")}</option>
              <option value="medium">{t("medium")}</option>
              <option value="high">{t("high")}</option>
            </select>
          </div>
        </div>

        {/* ── Cooking Habits ────────────────────────────────────────────── */}
        <h3 className={sectionTitleClass}>{t("cookingHabits")}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Cooking Time */}
          <div>
            <label htmlFor="pref-cookingTime" className={labelClass}>
              {t("cookingTime")}
            </label>
            <input
              id="pref-cookingTime"
              type="number"
              placeholder="30"
              {...form.register("cookingTimeAvailable", { valueAsNumber: true })}
              className={inputClass}
            />
          </div>

          {/* Eating Out Frequency */}
          <div>
            <label htmlFor="pref-eatingOut" className={labelClass}>
              {t("eatingOutFrequency")}
            </label>
            <select
              id="pref-eatingOut"
              {...form.register("eatingOutFrequency")}
              className={selectClass}
            >
              <option value="">{t("howOften")}</option>
              <option value="never">{t("never")}</option>
              <option value="rarely">{t("rarely")}</option>
              <option value="sometimes">{t("sometimes")}</option>
              <option value="often">{t("often")}</option>
            </select>
          </div>

          {/* Meal Complexity */}
          <div>
            <label htmlFor="pref-complexity" className={labelClass}>
              {t("mealComplexity")}
            </label>
            <select
              id="pref-complexity"
              {...form.register("mealComplexity")}
              className={selectClass}
            >
              <option value="">{t("selectComplexity")}</option>
              <option value="simple">{t("simple")}</option>
              <option value="moderate">{t("complexityModerate")}</option>
              <option value="advanced">{t("advanced")}</option>
            </select>
          </div>
        </div>

        {/* ── Budget & Training ─────────────────────────────────────────── */}
        <h3 className={sectionTitleClass}>{t("budgetTraining")}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Budget Friendly */}
          <div className="flex items-center gap-2">
            <input
              id="pref-budgetFriendly"
              type="checkbox"
              {...form.register("budgetFriendly")}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label
              htmlFor="pref-budgetFriendly"
              className="text-sm font-medium text-[var(--dietista-text)]"
            >
              {t("budgetFriendly")}
            </label>
          </div>

          {/* Weekly Budget */}
          <div>
            <label htmlFor="pref-weeklyBudget" className={labelClass}>
              {t("weeklyBudget")}
            </label>
            <input
              id="pref-weeklyBudget"
              type="number"
              step="0.01"
              placeholder="100"
              {...form.register("weeklyBudget", { valueAsNumber: true })}
              className={inputClass}
            />
          </div>

          {/* Training Routine */}
          <div className="sm:col-span-2">
            <label htmlFor="pref-trainingRoutine" className={labelClass}>
              {t("trainingRoutine")}
            </label>
            <input
              id="pref-trainingRoutine"
              type="text"
              placeholder={t("trainingPlaceholder")}
              {...form.register("trainingRoutine")}
              className={inputClass}
            />
          </div>
        </div>

        {/* ── Food Preferences ──────────────────────────────────────────── */}
        <h3 className={sectionTitleClass}>{t("foodPreferences")}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Allergies */}
          <div>
            <label htmlFor="pref-allergies" className={labelClass}>
              {t("allergies")}
            </label>
            <input
              id="pref-allergies"
              type="text"
              placeholder={t("allergiesPlaceholder")}
              value={allergiesStr}
              onChange={(e) => setAllergiesStr(e.target.value)}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-[var(--dietista-text-3)]">
              {t("commaSeparated")}
            </p>
          </div>

          {/* Forbidden Foods */}
          <div>
            <label htmlFor="pref-forbiddenFoods" className={labelClass}>
              {t("forbiddenFoods")}
            </label>
            <input
              id="pref-forbiddenFoods"
              type="text"
              placeholder={t("forbiddenPlaceholder")}
              value={forbiddenFoodsStr}
              onChange={(e) => setForbiddenFoodsStr(e.target.value)}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-[var(--dietista-text-3)]">
              {t("commaSeparated")}
            </p>
          </div>

          {/* Favorite Foods */}
          <div>
            <label htmlFor="pref-favoriteFoods" className={labelClass}>
              {t("favoriteFoods")}
            </label>
            <input
              id="pref-favoriteFoods"
              type="text"
              placeholder={t("favoritesPlaceholder")}
              value={favoriteFoodsStr}
              onChange={(e) => setFavoriteFoodsStr(e.target.value)}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-[var(--dietista-text-3)]">
              {t("commaSeparated")}
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="rounded-[var(--dietista-r)] bg-[var(--brand-500)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {form.formState.isSubmitting ? t("saving") : t("updateProfile")}
        </button>
      </form>
    </div>
  );
}
