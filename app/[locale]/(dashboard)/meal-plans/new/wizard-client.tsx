"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { NutritionistStep } from "@/lib/schemas";
import type { UserProfileSchema, NutritionistPreferencesSchema } from "@/lib/schemas";
import type { InternalMealPlan, MealModification, ModificationReason } from "@/types/meal-plan";
import { ProfileReviewCard } from "@/components/chat/profile-review-card";
import { ProfileModificationForm } from "@/components/chat/profile-modification-form";
import { PreferencesForm } from "@/components/chat/preferences-form";
import { GenerationLoading } from "@/components/chat/generation-loading";
import { PlanReview } from "@/components/chat/plan-review";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { generateWizardPlan, updateWizardProfile } from "@/actions/wizard";
import { CheckCircle2, ChevronRight } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────

const STEP_NUMBER: Record<NutritionistStep, number> = {
  PROFILE_REVIEW: 1,
  PROFILE_MODIFICATION: 2,
  PREFERENCES_COLLECTION: 3,
  GENERATION: 4,
  REVIEW_MODIFICATION: 5,
  CONFIRMATION: 6,
};

// ─── Types ────────────────────────────────────────────────────────────────

interface WizardClientProps {
  profile: UserProfileSchema;
}

// ─── Progress Bar ─────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: NutritionistStep }): React.ReactElement {
  const t = useTranslations("Wizard");

  const STEP_LABELS: Record<NutritionistStep, string> = {
    PROFILE_REVIEW: t("step1"),
    PROFILE_MODIFICATION: t("step2"),
    PREFERENCES_COLLECTION: t("step3"),
    GENERATION: t("step4"),
    REVIEW_MODIFICATION: t("step5"),
    CONFIRMATION: t("step6"),
  };

  const currentNum = STEP_NUMBER[step];
  const totalSteps = 6;
  const pct = Math.round((currentNum / totalSteps) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{STEP_LABELS[step]}</span>
        <span className="text-muted-foreground">
          {currentNum} {t("stepOf")} {totalSteps}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Confirmation View ────────────────────────────────────────────────────

function ConfirmationView({
  springBootJson,
}: {
  springBootJson: Record<string, unknown>;
}): React.ReactElement {
  const t = useTranslations("Wizard");

  return (
    <Card className="border-green-300 bg-green-50 dark:bg-green-950/20">
      <CardContent className="py-8 space-y-4">
        <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
          <CheckCircle2 className="h-6 w-6" />
          <h3 className="text-lg font-semibold">
            {t("planConfirmed")}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("planConfirmedDescription")}
        </p>
        <div className="rounded-md bg-background border p-4 overflow-auto max-h-64">
          <pre className="text-xs whitespace-pre-wrap font-mono">
            {JSON.stringify(springBootJson, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Component ────────────────────────────────────────────────────────────

/**
 * WizardClient — 6-step nutritionist wizard state machine.
 *
 * Orchestrates the existing chat components:
 * - Step 1: ProfileReviewCard
 * - Step 2: ProfileModificationForm
 * - Step 3: PreferencesForm
 * - Step 4: GenerationLoading
 * - Step 5: PlanReview
 * - Step 6: Inline confirmation with JSON preview
 */
export function WizardClient({ profile }: WizardClientProps): React.ReactElement {
  const router = useRouter();
  const t = useTranslations("Wizard");
  const tp = useTranslations("MealPlans");

  const [step, setStep] = useState<NutritionistStep>("PROFILE_REVIEW");
  const [editingFields, setEditingFields] = useState<
    Array<keyof UserProfileSchema>
  >([]);
  const [modifiedProfile, setModifiedProfile] =
    useState<UserProfileSchema>(profile);
  const [preferences, setPreferences] =
    useState<NutritionistPreferencesSchema | null>(null);
  const [mealPlan, setMealPlan] = useState<InternalMealPlan | null>(null);
  const [modifications] = useState<MealModification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [springBootJson, setSpringBootJson] =
    useState<Record<string, unknown> | null>(null);

  // ── Step transitions ────────────────────────────────────────────────

  // Step 1 → Step 3 (skip Step 2)
  const handleAllCorrect = useCallback(() => {
    setStep("PREFERENCES_COLLECTION");
  }, []);

  // Step 1 → Step 2
  const handleEditField = useCallback(
    (field: keyof UserProfileSchema) => {
      setEditingFields([field]);
      setStep("PROFILE_MODIFICATION");
    },
    []
  );

  // Step 2 → Step 3
  const handleSaveProfile = useCallback(
    async (changes: Partial<UserProfileSchema>) => {
      setModifiedProfile((prev) => ({ ...prev, ...changes }));
      setEditingFields([]);

      // Persist to server
      try {
        await updateWizardProfile(changes as Partial<Record<string, unknown>>);
      } catch {
        // Profile update error is non-fatal for wizard flow
      }
      setStep("PREFERENCES_COLLECTION");
    },
    []
  );

  // Step 2 → Step 1 (cancel)
  const handleCancelModification = useCallback(() => {
    setEditingFields([]);
    setStep("PROFILE_REVIEW");
  }, []);

  // Step 3 → Step 4
  const handlePreferencesSubmit = useCallback(
    (prefs: NutritionistPreferencesSchema) => {
      setPreferences(prefs);
      setStep("GENERATION");
    },
    []
  );

  // ── Generation (Step 4) ─────────────────────────────────────────────

  const triggerGeneration = useCallback(async () => {
    setGenerating(true);
    setTimedOut(false);
    setError(null);

    const timeoutId = setTimeout(() => {
      setTimedOut(true);
      setGenerating(false);
    }, 120000); // 2 minutes

    try {
      const result = await generateWizardPlan();
      clearTimeout(timeoutId);
      setMealPlan(result.mealPlan);
      setSpringBootJson(result.springBootJson);
      setGenerating(false);
      setStep("REVIEW_MODIFICATION");
    } catch (err) {
      clearTimeout(timeoutId);
      setError(
        err instanceof Error ? err.message : tp("generateError")
      );
      setTimedOut(true);
      setGenerating(false);
    }
  }, [t, tp]);

  // Trigger generation when entering Step 4
  useEffect(() => {
    if (step === "GENERATION" && !generating && !timedOut) {
      triggerGeneration();
    }
  }, [step, generating, timedOut, triggerGeneration]);

  // ── Step 5 → Step 6 ─────────────────────────────────────────────────

  const handleConfirm = useCallback(() => {
    setStep("CONFIRMATION");
  }, []);

  // Step 5: Modify meal (track modification)
  const handleModifyMeal = useCallback(
    (_dayOfWeek: number, _mealType: string, _reason: ModificationReason) => {
      // In a full implementation, this would call a regeneration endpoint.
      // For now, modifications are tracked via the PlanReview component internally.
    },
    []
  );

  // Step 5: Regenerate day
  const handleRegenerateDay = useCallback((_dayOfWeek: number) => {
    // In a full implementation, this would call a regeneration endpoint.
  }, []);

  // Step 5: Undo modification
  const handleUndo = useCallback(() => {
    // Undo is handled by PlanReview component
  }, []);

  // ── Step 6: Redirect ────────────────────────────────────────────────

  useEffect(() => {
    if (step === "CONFIRMATION") {
      const timer = setTimeout(() => {
        router.push("/meal-plans");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [step, router]);

  // ── Retry after timeout ─────────────────────────────────────────────

  const handleRetry = useCallback(() => {
    if (step === "GENERATION") {
      triggerGeneration();
    } else {
      setError(null);
      setTimedOut(false);
    }
  }, [step, triggerGeneration]);

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">{t("newPlanTitle")}</h1>
        <p className="mt-1 text-muted-foreground">
          {t("newPlanSubtitle")}
        </p>
      </div>

      {/* Progress Bar */}
      <ProgressBar step={step} />

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
          {timedOut && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={handleRetry}
            >
              {t("retry")}
            </Button>
          )}
        </Alert>
      )}

      {/* Step 1: Profile Review */}
      {step === "PROFILE_REVIEW" && (
        <ProfileReviewCard
          profile={modifiedProfile}
          onEditField={handleEditField}
          onAllCorrect={handleAllCorrect}
        />
      )}

      {/* Step 2: Profile Modification */}
      {step === "PROFILE_MODIFICATION" && (
        <ProfileModificationForm
          profile={modifiedProfile}
          fieldsToEdit={editingFields}
          onSave={handleSaveProfile}
          onCancel={handleCancelModification}
        />
      )}

      {/* Step 3: Preferences Collection */}
      {step === "PREFERENCES_COLLECTION" && (
        <PreferencesForm
          initialValues={preferences ?? undefined}
          onSubmit={handlePreferencesSubmit}
        />
      )}

      {/* Step 4: Generation Loading */}
      {step === "GENERATION" && (
        <GenerationLoading timedOut={timedOut} onRetry={handleRetry} />
      )}

      {/* Step 5: Review & Modification */}
      {step === "REVIEW_MODIFICATION" && mealPlan && (
        <PlanReview
          mealPlan={mealPlan}
          modifications={modifications}
          onModifyMeal={handleModifyMeal}
          onRegenerateDay={handleRegenerateDay}
          onUndo={handleUndo}
          onConfirm={handleConfirm}
        />
      )}

      {/* Step 6: Confirmation */}
      {step === "CONFIRMATION" && springBootJson && (
        <ConfirmationView springBootJson={springBootJson} />
      )}

      {/* Step 6 fallback (no JSON yet) */}
      {step === "CONFIRMATION" && !springBootJson && (
        <Card>
          <CardContent className="py-8 text-center space-y-2">
            <CheckCircle2 className="h-6 w-6 mx-auto text-green-600" />
            <p className="font-medium">{t("planConfirmed")}</p>
            <p className="text-sm text-muted-foreground">
              {t("redirectingToPlans")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading placeholder if no mealPlan at review step */}
      {step === "REVIEW_MODIFICATION" && !mealPlan && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">{t("loadingPlan")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
