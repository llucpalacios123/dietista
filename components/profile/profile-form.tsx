"use client";

import { useState, useEffect, useActionState, startTransition } from "react";
import type { JSX } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
        <CardTitle>{isUpdate ? "Update Profile" : "Create Profile"}</CardTitle>
        <CardDescription>
          {isUpdate
            ? "Edit your nutritional parameters for personalized meal plans."
            : "Set up your nutritional profile to generate personalized meal plans."}
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
              Profile created successfully!
            </AlertDescription>
          </Alert>
        )}
        {result?.success && isUpdate && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              Profile updated successfully!
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
                    <FormLabel>Weight (kg)</FormLabel>
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
                    <FormLabel>Height (cm)</FormLabel>
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
                    <FormLabel>Age</FormLabel>
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
                    <FormLabel>Sex</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sex" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
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
                    <FormLabel>Goal</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select goal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="lose">Lose weight</SelectItem>
                        <SelectItem value="maintain">Maintain weight</SelectItem>
                        <SelectItem value="gain">Gain weight</SelectItem>
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
                    <FormLabel>Activity Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select activity level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sedentary">Sedentary (little or no exercise)</SelectItem>
                        <SelectItem value="light">Light (1-3 days/week)</SelectItem>
                        <SelectItem value="moderate">Moderate (3-5 days/week)</SelectItem>
                        <SelectItem value="active">Active (6-7 days/week)</SelectItem>
                        <SelectItem value="veryActive">Very Active (intense daily)</SelectItem>
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
                {showAdvanced ? "Hide" : "Show"} advanced options
              </Button>
            </div>

            {showAdvanced && (
              <div className="space-y-6 rounded-lg border p-4">
                <h3 className="text-sm font-medium">Diet Preferences</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="dietType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Diet Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select diet type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="omnivore">Omnivore</SelectItem>
                            <SelectItem value="vegetarian">Vegetarian</SelectItem>
                            <SelectItem value="vegan">Vegan</SelectItem>
                            <SelectItem value="pescatarian">Pescatarian</SelectItem>
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
                        <FormLabel>Meals per Day</FormLabel>
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
                        <FormDescription>1 to 6 meals</FormDescription>
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
                        <FormLabel className="!mt-0">Include Snacks</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="varietyPreference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Variety Preference</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select variety level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <h3 className="text-sm font-medium pt-2">Cooking &amp; Eating Habits</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="cookingTimeAvailable"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cooking Time (minutes)</FormLabel>
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
                        <FormLabel>Eating Out Frequency</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="How often?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="never">Never</SelectItem>
                            <SelectItem value="rarely">Rarely</SelectItem>
                            <SelectItem value="sometimes">Sometimes</SelectItem>
                            <SelectItem value="often">Often</SelectItem>
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
                        <FormLabel>Meal Complexity</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select complexity" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="simple">Simple (quick meals)</SelectItem>
                            <SelectItem value="moderate">Moderate</SelectItem>
                            <SelectItem value="advanced">Advanced (gourmet)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <h3 className="text-sm font-medium pt-2">Budget &amp; Training</h3>
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
                        <FormLabel className="!mt-0">Budget Friendly</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weeklyBudget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weekly Budget ($)</FormLabel>
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
                        <FormLabel>Training Routine</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., strength 4x/week, cardio 2x/week"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <h3 className="text-sm font-medium pt-2">Target Macros (optional)</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="targetCalories"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Calories (kcal)</FormLabel>
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
                        <FormLabel>Target Protein (g)</FormLabel>
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
                        <FormLabel>Target Carbs (g)</FormLabel>
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
                        <FormLabel>Target Fat (g)</FormLabel>
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

                <h3 className="text-sm font-medium pt-2">Food Preferences &amp; Restrictions</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormItem>
                    <FormLabel>Allergies</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="peanuts, shellfish, gluten"
                        value={allergiesStr}
                        onChange={(e) => setAllergiesStr(e.target.value)}
                      />
                    </FormControl>
                    <FormDescription>Comma-separated list</FormDescription>
                  </FormItem>

                  <FormItem>
                    <FormLabel>Forbidden Foods</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="pork, dairy, eggs"
                        value={forbiddenFoodsStr}
                        onChange={(e) => setForbiddenFoodsStr(e.target.value)}
                      />
                    </FormControl>
                    <FormDescription>Comma-separated list</FormDescription>
                  </FormItem>

                  <FormItem>
                    <FormLabel>Favorite Foods</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="chicken, salmon, avocado"
                        value={favoriteFoodsStr}
                        onChange={(e) => setFavoriteFoodsStr(e.target.value)}
                      />
                    </FormControl>
                    <FormDescription>Comma-separated list</FormDescription>
                  </FormItem>
                </div>
              </div>
            )}

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? "Saving..."
                : isUpdate
                  ? "Update Profile"
                  : "Create Profile"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
