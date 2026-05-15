"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MealPlanView } from "@/components/meal-plans/meal-plan-view";

// ─── Types ────────────────────────────────────────────────────────────────

interface Meal {
  id: string;
  dayOfWeek: number;
  mealType: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealPlan {
  id: string;
  startDate: string;
  endDate: string;
  status: "draft" | "active" | "completed";
  totalCalories: number | null;
  meals: Meal[];
}

interface GenerateResponse {
  data: {
    jobId: string;
    status: string;
  };
}

interface JobStatusResponse {
  data: {
    jobId: string;
    status: "pending" | "processing" | "completed" | "failed";
    mealPlanId?: string;
    error?: string;
  };
}

// ─── Page Component ───────────────────────────────────────────────────────

export default function MealPlansPage(): JSX.Element {
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Fetch current active plan
  const fetchPlan = useCallback(async () => {
    try {
      const res = await fetch("/api/meal-plans");
      if (res.ok) {
        const json = await res.json();
        setMealPlan(json.data);
      } else if (res.status === 404) {
        setMealPlan(null);
      }
    } catch {
      // Ignore fetch errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  // Poll job status
  useEffect(() => {
    if (!jobId || jobStatus === "completed" || jobStatus === "failed") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/meal-plans/jobs/${jobId}`);
        if (res.ok) {
          const json: JobStatusResponse = await res.json();
          setJobStatus(json.data.status);

          if (json.data.status === "completed" && json.data.mealPlanId) {
            // Refetch to get the updated plan
            await fetchPlan();
            setJobId(null);
            setGenerating(false);
          } else if (json.data.status === "failed") {
            setError(json.data.error ?? "Generation failed");
            setGenerating(false);
            setJobId(null);
          }
        }
      } catch {
        // Polling error, keep trying
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, jobStatus, fetchPlan]);

  // Generate new plan
  const handleGenerate = async () => {
    setError(null);
    setGenerating(true);
    setJobStatus("pending");

    try {
      const res = await fetch("/api/meal-plans/generate", {
        method: "POST",
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.message ?? "Failed to generate meal plan");
        setGenerating(false);
        return;
      }

      const json: GenerateResponse = await res.json();
      setJobId(json.data.jobId);
      setJobStatus("pending");
    } catch {
      setError("Network error. Please try again.");
      setGenerating(false);
    }
  };

  // Confirm plan
  const handleConfirm = async () => {
    if (!mealPlan) return;

    try {
      const res = await fetch(`/api/meal-plans/${mealPlan.id}/confirm`, {
        method: "POST",
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.message ?? "Failed to confirm plan");
        return;
      }

      await fetchPlan();
    } catch {
      setError("Network error. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Meal Plans</h1>
          <p className="mt-1 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meal Plans</h1>
          <p className="mt-1 text-muted-foreground">
            Generate and manage your weekly meal plans
          </p>
        </div>
        {!generating && !mealPlan && (
          <Button onClick={handleGenerate}>Generate Meal Plan</Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {generating && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <div className="animate-spin mx-auto h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              <div>
                <p className="font-medium">Generating your meal plan...</p>
                <p className="text-sm text-muted-foreground">
                  {jobStatus === "pending" && "Queued for processing"}
                  {jobStatus === "processing" && "AI is creating your personalized plan"}
                  {!jobStatus && "Starting..."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {mealPlan && (
        <>
          {mealPlan.status === "draft" && (
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm">
                    This plan is in <strong>draft</strong> status. Review it and confirm to activate.
                  </p>
                  <Button onClick={handleConfirm} disabled={mealPlan.meals.length === 0}>
                    Confirm Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <MealPlanView plan={mealPlan} />

          {mealPlan.status === "active" && (
            <div className="flex justify-end">
              <Button onClick={handleGenerate} variant="outline">
                Generate New Plan
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
