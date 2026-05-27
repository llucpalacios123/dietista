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

export interface BodyGoalsSectionProps {
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

// ─── BodyGoalsSection ─────────────────────────────────────────────────────

export function BodyGoalsSection({ profile }: BodyGoalsSectionProps): JSX.Element {
  const t = useTranslations("Profile");
  const [result, formAction] = useActionState<ProfileActionResult | null, FormData>(
    updateProfile,
    null
  );

  const form = useForm<ProfileSchema>({
    resolver: zodResolver(profileSchema),
    defaultValues: profile
      ? {
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
          // Preferences fields (needed for full-schema validation)
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
          trainingRoutine: profile.trainingRoutine ?? undefined,
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
          trainingRoutine: undefined,
        },
    mode: "onSubmit",
  });

  // These string states are for the hidden Preferences array fields —
  // they mirror what is already in the profile so submitting Body & Goals
  // doesn't wipe the Preferences tab data.
  const [allergiesStr] = useState(profile ? arrayToString(profile.allergies) : "");
  const [forbiddenFoodsStr] = useState(
    profile ? arrayToString(profile.forbiddenFoods) : ""
  );
  const [favoriteFoodsStr] = useState(
    profile ? arrayToString(profile.favoriteFoods) : ""
  );

  const onSubmit = form.handleSubmit((data) => {
    const fd = new FormData();

    // ── Visible Body & Goals fields ──────────────────────────────────────
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

    // ── Hidden Preferences fields (prevent data wipe) ────────────────────
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
    if (data.trainingRoutine) fd.set("trainingRoutine", data.trainingRoutine);

    startTransition(() => formAction(fd));
  });

  const inputClass =
    "w-full rounded-[var(--dietista-r)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] px-3 py-2 text-sm text-[var(--dietista-text)] placeholder:text-[var(--dietista-text-3)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]";
  const selectClass = inputClass;
  const labelClass = "mb-1 block text-sm font-medium text-[var(--dietista-text)]";
  const errorClass = "mt-1 text-xs text-red-600";

  return (
    <div className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)]">
      <h2 className="mb-4 text-base font-semibold text-[var(--dietista-text)]">
        {t("tabs.bodyGoals")}
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
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Weight */}
          <div>
            <label htmlFor="bg-weight" className={labelClass}>
              {t("weight")}
            </label>
            <input
              id="bg-weight"
              type="number"
              step="0.1"
              placeholder="70"
              {...form.register("weight", { valueAsNumber: true })}
              className={inputClass}
            />
            {form.formState.errors.weight && (
              <p className={errorClass}>{form.formState.errors.weight.message}</p>
            )}
          </div>

          {/* Height */}
          <div>
            <label htmlFor="bg-height" className={labelClass}>
              {t("height")}
            </label>
            <input
              id="bg-height"
              type="number"
              step="0.1"
              placeholder="175"
              {...form.register("height", { valueAsNumber: true })}
              className={inputClass}
            />
            {form.formState.errors.height && (
              <p className={errorClass}>{form.formState.errors.height.message}</p>
            )}
          </div>

          {/* Age */}
          <div>
            <label htmlFor="bg-age" className={labelClass}>
              {t("age")}
            </label>
            <input
              id="bg-age"
              type="number"
              placeholder="30"
              {...form.register("age", { valueAsNumber: true })}
              className={inputClass}
            />
            {form.formState.errors.age && (
              <p className={errorClass}>{form.formState.errors.age.message}</p>
            )}
          </div>

          {/* Sex */}
          <div>
            <label htmlFor="bg-sex" className={labelClass}>
              {t("sex")}
            </label>
            <select id="bg-sex" {...form.register("sex")} className={selectClass}>
              <option value="">{t("selectSex")}</option>
              <option value="male">{t("male")}</option>
              <option value="female">{t("female")}</option>
              <option value="other">{t("other")}</option>
            </select>
            {form.formState.errors.sex && (
              <p className={errorClass}>{form.formState.errors.sex.message}</p>
            )}
          </div>

          {/* Goal */}
          <div>
            <label htmlFor="bg-goal" className={labelClass}>
              {t("goal")}
            </label>
            <select id="bg-goal" {...form.register("goal")} className={selectClass}>
              <option value="">{t("selectGoal")}</option>
              <option value="lose">{t("lose")}</option>
              <option value="maintain">{t("maintain")}</option>
              <option value="gain">{t("gain")}</option>
            </select>
            {form.formState.errors.goal && (
              <p className={errorClass}>{form.formState.errors.goal.message}</p>
            )}
          </div>

          {/* Activity Level */}
          <div>
            <label htmlFor="bg-activity" className={labelClass}>
              {t("activityLevel")}
            </label>
            <select
              id="bg-activity"
              {...form.register("activityLevel")}
              className={selectClass}
            >
              <option value="">{t("selectActivity")}</option>
              <option value="sedentary">{t("sedentary")}</option>
              <option value="light">{t("light")}</option>
              <option value="moderate">{t("moderate")}</option>
              <option value="active">{t("active")}</option>
              <option value="veryActive">{t("veryActive")}</option>
            </select>
            {form.formState.errors.activityLevel && (
              <p className={errorClass}>
                {form.formState.errors.activityLevel.message}
              </p>
            )}
          </div>

          {/* Target Calories */}
          <div>
            <label htmlFor="bg-calories" className={labelClass}>
              {t("targetCalories")}
            </label>
            <input
              id="bg-calories"
              type="number"
              placeholder="2000"
              {...form.register("targetCalories", { valueAsNumber: true })}
              className={inputClass}
            />
            {form.formState.errors.targetCalories && (
              <p className={errorClass}>
                {form.formState.errors.targetCalories.message}
              </p>
            )}
          </div>

          {/* Target Protein */}
          <div>
            <label htmlFor="bg-protein" className={labelClass}>
              {t("targetProtein")}
            </label>
            <input
              id="bg-protein"
              type="number"
              step="0.1"
              placeholder="150"
              {...form.register("targetProtein", { valueAsNumber: true })}
              className={inputClass}
            />
            {form.formState.errors.targetProtein && (
              <p className={errorClass}>
                {form.formState.errors.targetProtein.message}
              </p>
            )}
          </div>

          {/* Target Carbs */}
          <div>
            <label htmlFor="bg-carbs" className={labelClass}>
              {t("targetCarbs")}
            </label>
            <input
              id="bg-carbs"
              type="number"
              step="0.1"
              placeholder="250"
              {...form.register("targetCarbs", { valueAsNumber: true })}
              className={inputClass}
            />
            {form.formState.errors.targetCarbs && (
              <p className={errorClass}>
                {form.formState.errors.targetCarbs.message}
              </p>
            )}
          </div>

          {/* Target Fat */}
          <div>
            <label htmlFor="bg-fat" className={labelClass}>
              {t("targetFat")}
            </label>
            <input
              id="bg-fat"
              type="number"
              step="0.1"
              placeholder="65"
              {...form.register("targetFat", { valueAsNumber: true })}
              className={inputClass}
            />
            {form.formState.errors.targetFat && (
              <p className={errorClass}>
                {form.formState.errors.targetFat.message}
              </p>
            )}
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
