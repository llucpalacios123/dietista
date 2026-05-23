"use client";

import { useState, useEffect, useActionState, startTransition } from "react";
import type { JSX } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import type { ProfileSchema } from "@/lib/schemas";
import { profileSchema } from "@/lib/schemas";
import { createProfile, updateProfile, type ProfileActionResult } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Profile } from "@prisma/client";

// ─── Helpers ──────────────────────────────────────────────────────────────

function profileToFormValues(profile: Profile): ProfileSchema {
  return {
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
    allergies: profile.allergies,
    forbiddenFoods: profile.forbiddenFoods,
    dietType: (profile.dietType as ProfileSchema["dietType"]) ?? undefined,
    cookingTimeAvailable: profile.cookingTimeAvailable ?? undefined,
    eatingOutFrequency:
      (profile.eatingOutFrequency as ProfileSchema["eatingOutFrequency"]) ??
      undefined,
    includeSnacks: profile.includeSnacks,
    mealComplexity:
      (profile.mealComplexity as ProfileSchema["mealComplexity"]) ?? undefined,
    mealsPerDay: profile.mealsPerDay,
    varietyPreference:
      (profile.varietyPreference as ProfileSchema["varietyPreference"]) ??
      undefined,
    budgetFriendly: profile.budgetFriendly,
    weeklyBudget: profile.weeklyBudget ?? undefined,
    trainingRoutine: profile.trainingRoutine ?? undefined,
    favoriteFoods: profile.favoriteFoods,
  };
}

function arrayToString(arr: string[]): string {
  return arr.join(", ");
}

function stringToArray(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// ─── Profile Form Component ───────────────────────────────────────────────

interface ProfileFormProps {
  existingProfile?: Profile | null;
}

export function ProfileForm({ existingProfile }: ProfileFormProps): JSX.Element {
  const t = useTranslations("Profile");
  const isUpdate = !!existingProfile;
  const action = isUpdate ? updateProfile : createProfile;
  const router = useRouter();
  const [result, formAction] = useActionState<ProfileActionResult | null, FormData>(
    action,
    null
  );
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Redirect to dashboard after successful profile creation
  useEffect(() => {
    if (result?.success === true && !isUpdate) {
      router.push("/dashboard");
    }
  }, [result?.success, isUpdate, router]);

  const form = useForm<ProfileSchema>({
    resolver: zodResolver(profileSchema),
    defaultValues: existingProfile
      ? {
          ...profileToFormValues(existingProfile),
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
          favoriteFoods: [],
        },
    mode: "onSubmit",
  });

  // Separate state for comma-separated string fields
  const [allergiesStr, setAllergiesStr] = useState(
    existingProfile ? arrayToString(existingProfile.allergies) : ""
  );
  const [forbiddenFoodsStr, setForbiddenFoodsStr] = useState(
    existingProfile ? arrayToString(existingProfile.forbiddenFoods) : ""
  );
  const [favoriteFoodsStr, setFavoriteFoodsStr] = useState(
    existingProfile ? arrayToString(existingProfile.favoriteFoods) : ""
  );

  // Intercept form submission to convert comma-separated strings to arrays
  const onSubmit = form.handleSubmit((data) => {
    const fd = new FormData();
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isUpdate ? t("updateProfile") : t("createProfile")}</CardTitle>
        <CardDescription>
          {isUpdate ? t("updateDescription") : t("createDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {result?.error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{result.error}</AlertDescription>
          </Alert>
        )}
        {result?.success && !isUpdate && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              {t("createSuccess")}
            </AlertDescription>
          </Alert>
        )}
        {result?.success && isUpdate && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              {t("updateSuccess")}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Required Fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("weight")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="70"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("height")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="175"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("age")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="30"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("sex")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectSex")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">{t("male")}</SelectItem>
                        <SelectItem value="female">{t("female")}</SelectItem>
                        <SelectItem value="other">{t("other")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="goal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("goal")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectGoal")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="lose">{t("lose")}</SelectItem>
                        <SelectItem value="maintain">{t("maintain")}</SelectItem>
                        <SelectItem value="gain">{t("gain")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="activityLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("activityLevel")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectActivity")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sedentary">{t("sedentary")}</SelectItem>
                        <SelectItem value="light">{t("light")}</SelectItem>
                        <SelectItem value="moderate">{t("moderate")}</SelectItem>
                        <SelectItem value="active">{t("active")}</SelectItem>
                        <SelectItem value="veryActive">{t("veryActive")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Optional Advanced Fields */}
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? t("hide") : t("show")} {t("advancedOptions")}
              </Button>
            </div>

            {showAdvanced && (
              <div className="space-y-6 rounded-lg border p-4">
                <h3 className="text-sm font-medium">{t("dietPreferences")}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="dietType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("dietType")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("selectDietType")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="omnivore">{t("omnivore")}</SelectItem>
                            <SelectItem value="vegetarian">{t("vegetarian")}</SelectItem>
                            <SelectItem value="vegan">{t("vegan")}</SelectItem>
                            <SelectItem value="pescatarian">{t("pescatarian")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mealsPerDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("mealsPerDay")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={6}
                            placeholder="3"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? parseInt(e.target.value, 10) : undefined
                              )
                            }
                          />
                        </FormControl>
                        <FormDescription>{t("mealsPerDayHint")}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="includeSnacks"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">{t("includeSnacks")}</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="varietyPreference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("varietyPreference")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("selectVariety")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">{t("low")}</SelectItem>
                            <SelectItem value="medium">{t("medium")}</SelectItem>
                            <SelectItem value="high">{t("high")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <h3 className="text-sm font-medium pt-2">{t("cookingHabits")}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="cookingTimeAvailable"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("cookingTime")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="30"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? parseInt(e.target.value, 10) : undefined
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="eatingOutFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("eatingOutFrequency")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("howOften")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="never">{t("never")}</SelectItem>
                            <SelectItem value="rarely">{t("rarely")}</SelectItem>
                            <SelectItem value="sometimes">{t("sometimes")}</SelectItem>
                            <SelectItem value="often">{t("often")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mealComplexity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("mealComplexity")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("selectComplexity")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="simple">{t("simple")}</SelectItem>
                            <SelectItem value="moderate">{t("complexityModerate")}</SelectItem>
                            <SelectItem value="advanced">{t("advanced")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <h3 className="text-sm font-medium pt-2">{t("budgetTraining")}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="budgetFriendly"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">{t("budgetFriendly")}</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weeklyBudget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("weeklyBudget")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="100"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? parseFloat(e.target.value) : undefined
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="trainingRoutine"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>{t("trainingRoutine")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("trainingPlaceholder")}
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <h3 className="text-sm font-medium pt-2">{t("targetMacros")}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="targetCalories"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("targetCalories")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="2000"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? parseFloat(e.target.value) : undefined
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetProtein"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("targetProtein")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="150"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? parseFloat(e.target.value) : undefined
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetCarbs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("targetCarbs")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="250"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? parseFloat(e.target.value) : undefined
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetFat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("targetFat")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="65"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? parseFloat(e.target.value) : undefined
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <h3 className="text-sm font-medium pt-2">{t("foodPreferences")}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormItem>
                    <FormLabel>{t("allergies")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("allergiesPlaceholder")}
                        value={allergiesStr}
                        onChange={(e) => setAllergiesStr(e.target.value)}
                      />
                    </FormControl>
                    <FormDescription>{t("commaSeparated")}</FormDescription>
                  </FormItem>

                  <FormItem>
                    <FormLabel>{t("forbiddenFoods")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("forbiddenPlaceholder")}
                        value={forbiddenFoodsStr}
                        onChange={(e) => setForbiddenFoodsStr(e.target.value)}
                      />
                    </FormControl>
                    <FormDescription>{t("commaSeparated")}</FormDescription>
                  </FormItem>

                  <FormItem>
                    <FormLabel>{t("favoriteFoods")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("favoritesPlaceholder")}
                        value={favoriteFoodsStr}
                        onChange={(e) => setFavoriteFoodsStr(e.target.value)}
                      />
                    </FormControl>
                    <FormDescription>{t("commaSeparated")}</FormDescription>
                  </FormItem>
                </div>
              </div>
            )}

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? t("saving")
                : isUpdate
                  ? t("updateProfile")
                  : t("createProfile")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
