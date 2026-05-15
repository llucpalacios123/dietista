"use client";

import { useActionState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createMealLog, type MealLogActionResult } from "@/actions/meal-log";

const MEAL_TYPES = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
] as const;

const initialState: MealLogActionResult = { success: false };

export function MealLogForm(): JSX.Element {
  const [state, formAction, isPending] = useActionState(
    createMealLog,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  const today = new Date().toISOString().split("T")[0];

  // Compose ISO datetime from date input before submit
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    const dateInput = form.elements.namedItem("date") as HTMLInputElement;
    if (dateInput && dateInput.value) {
      // Append T12:00:00.000Z to make it a valid datetime string
      dateInput.value = new Date(dateInput.value + "T12:00:00.000Z").toISOString();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log a Meal</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          action={formAction}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <input
              type="date"
              id="date"
              name="date"
              defaultValue={today}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Meal Type */}
          <div className="space-y-2">
            <Label htmlFor="mealType">Meal Type</Label>
            <Select name="mealType" defaultValue="lunch">
              <SelectTrigger>
                <SelectValue placeholder="Select meal type" />
              </SelectTrigger>
              <SelectContent>
                {MEAL_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Free-text input */}
          <div className="space-y-2">
            <Label htmlFor="rawInput">What did you eat?</Label>
            <textarea
              id="rawInput"
              name="rawInput"
              rows={3}
              placeholder="e.g. grilled chicken breast 200g, rice 150g, salad"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          {/* Error / Success */}
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          {state?.success && (
            <p className="text-sm text-green-600">Meal logged successfully!</p>
          )}

          {/* Submit */}
          <Button type="submit" disabled={isPending}>
            {isPending ? "Interpreting..." : "Log Meal"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
