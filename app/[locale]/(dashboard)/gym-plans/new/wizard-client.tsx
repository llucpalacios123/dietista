"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ProfileReviewCard } from "@/components/chat/profile-review-card";
import { ProfileModificationForm } from "@/components/chat/profile-modification-form";
import { GenerationLoading } from "@/components/chat/generation-loading";
import { WorkoutPreferencesForm } from "@/components/dietista/gym-plans/workout-preferences-form";
import { WorkoutPlanReview } from "@/components/dietista/gym-plans/workout-plan-review";
import { generateWorkoutPlanAction } from "@/actions/workout-wizard";
import { updateWizardProfile } from "@/actions/wizard";
import type { UserProfileSchema } from "@/lib/schemas";
import type { WorkoutPreferences, WorkoutPlanContent } from "@/lib/schemas";

// ─── Types ────────────────────────────────────────────────────────────────────

type WorkoutWizardStep =
  | "PROFILE_REVIEW"
  | "PROFILE_MODIFICATION"
  | "PREFERENCES"
  | "GENERATION"
  | "REVIEW"
  | "CONFIRMATION";

interface WorkoutWizardClientProps {
  profile: UserProfileSchema;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEP_NUMBER: Record<WorkoutWizardStep, number> = {
  PROFILE_REVIEW: 1,
  PROFILE_MODIFICATION: 2,
  PREFERENCES: 3,
  GENERATION: 4,
  REVIEW: 5,
  CONFIRMATION: 6,
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: WorkoutWizardStep }): React.ReactElement {
  const t = useTranslations("GymPlans");

  const STEP_LABELS: Record<WorkoutWizardStep, string> = {
    PROFILE_REVIEW: t("wizard.step1"),
    PROFILE_MODIFICATION: t("wizard.step2"),
    PREFERENCES: t("wizard.step3"),
    GENERATION: t("wizard.step4"),
    REVIEW: t("wizard.step5"),
    CONFIRMATION: t("wizard.step6"),
  };

  const currentNum = STEP_NUMBER[step];
  const totalSteps = 6;
  const pct = Math.round((currentNum / totalSteps) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{STEP_LABELS[step]}</span>
        <span className="text-muted-foreground">
          {currentNum} {t("wizard.stepOf")} {totalSteps}
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

// ─── Confirmation View ────────────────────────────────────────────────────────

function ConfirmationView({ planId }: { planId: string }): React.ReactElement {
  const t = useTranslations("GymPlans");

  return (
    <Card className="border-green-300 bg-green-50 dark:bg-green-950/20">
      <CardContent className="py-8 space-y-4">
        <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
          <CheckCircle2 className="h-6 w-6" />
          <h3 className="text-lg font-semibold">
            {t("wizard.planConfirmed")}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("wizard.planConfirmedDescription")}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("wizard.redirectingToPlans")} (ID: {planId})
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * WorkoutWizardClient — 6-step workout plan wizard state machine.
 *
 * Mirrors the meal plan wizard architecture:
 * - Step 1: ProfileReviewCard (read-only)
 * - Step 2: ProfileModificationForm (optional overrides)
 * - Step 3: WorkoutPreferencesForm (goal, level, days, focus groups, equipment)
 * - Step 4: GenerationLoading (async AI call, 120s timeout)
 * - Step 5: WorkoutPlanReview (preview generated plan)
 * - Step 6: Confirmation + redirect to /gym-plans/[id]
 */
export function WorkoutWizardClient({
  profile,
}: WorkoutWizardClientProps): React.ReactElement {
  const router = useRouter();
  const t = useTranslations("GymPlans");

  const [step, setStep] = useState<WorkoutWizardStep>("PROFILE_REVIEW");
  const [editingFields, setEditingFields] = useState<Array<keyof UserProfileSchema>>([]);
  const [modifiedProfile, setModifiedProfile] = useState<UserProfileSchema>(profile);
  const [preferences, setPreferences] = useState<WorkoutPreferences | null>(null);
  const [generatedContent, setGeneratedContent] = useState<WorkoutPlanContent | null>(null);
  const [createdPlanId, setCreatedPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ── Step 1 → Step 3 (skip step 2) ───────────────────────────────────────
  const handleAllCorrect = useCallback(() => {
    setStep("PREFERENCES");
  }, []);

  // ── Step 1 → Step 2 ──────────────────────────────────────────────────────
  const handleEditField = useCallback((field: keyof UserProfileSchema) => {
    setEditingFields([field]);
    setStep("PROFILE_MODIFICATION");
  }, []);

  // ── Step 2 → Step 3 ──────────────────────────────────────────────────────
  const handleSaveProfile = useCallback(async (changes: Partial<UserProfileSchema>) => {
    setModifiedProfile((prev) => ({ ...prev, ...changes }));
    setEditingFields([]);
    try {
      await updateWizardProfile(changes as Partial<Record<string, unknown>>);
    } catch {
      // Non-fatal
    }
    setStep("PREFERENCES");
  }, []);

  const handleCancelModification = useCallback(() => {
    setEditingFields([]);
    setStep("PROFILE_REVIEW");
  }, []);

  // ── Step 3 → Step 4 ──────────────────────────────────────────────────────
  const handlePreferencesSubmit = useCallback((prefs: WorkoutPreferences) => {
    setPreferences(prefs);
    setStep("GENERATION");
  }, []);

  // ── Generation (Step 4) ──────────────────────────────────────────────────
  const triggerGeneration = useCallback(async () => {
    if (!preferences) return;

    setGenerating(true);
    setTimedOut(false);
    setError(null);

    const timeoutId = setTimeout(() => {
      setTimedOut(true);
      setGenerating(false);
    }, 120000);

    try {
      const result = await generateWorkoutPlanAction(preferences);
      clearTimeout(timeoutId);

      if (!result.success) {
        setError(result.error);
        setTimedOut(true);
        setGenerating(false);
        return;
      }

      // Fetch the generated plan content to show in review
      const res = await fetch(`/api/workout-plans/${result.planId}`);
      if (res.ok) {
        const json: { data: { content: WorkoutPlanContent } } = await res.json();
        setGeneratedContent(json.data.content);
        setCreatedPlanId(result.planId);
      }

      setGenerating(false);
      setStep("REVIEW");
    } catch (err) {
      clearTimeout(timeoutId);
      setError(err instanceof Error ? err.message : t("wizard.generationError"));
      setTimedOut(true);
      setGenerating(false);
    }
  }, [preferences, t]);

  // Trigger generation on entering step 4
  useEffect(() => {
    if (step === "GENERATION" && !generating && !timedOut) {
      triggerGeneration();
    }
  }, [step, generating, timedOut, triggerGeneration]);

  const handleRetry = useCallback(() => {
    if (step === "GENERATION") {
      triggerGeneration();
    } else {
      setError(null);
      setTimedOut(false);
    }
  }, [step, triggerGeneration]);

  // ── Step 5 → Step 6 ──────────────────────────────────────────────────────
  const handleConfirmReview = useCallback(() => {
    setIsSaving(false);
    setStep("CONFIRMATION");
  }, []);

  // ── Step 6 → redirect ────────────────────────────────────────────────────
  useEffect(() => {
    if (step === "CONFIRMATION" && createdPlanId) {
      const timer = setTimeout(() => {
        router.push(`/gym-plans/${createdPlanId}`);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step, createdPlanId, router]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">{t("wizard.newPlanTitle")}</h1>
        <p className="mt-1 text-muted-foreground">{t("wizard.newPlanSubtitle")}</p>
      </div>

      {/* Progress Bar */}
      <ProgressBar step={step} />

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
          {timedOut && (
            <Button variant="outline" size="sm" className="mt-2" onClick={handleRetry}>
              {t("wizard.retry")}
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

      {/* Step 3: Workout Preferences */}
      {step === "PREFERENCES" && (
        <WorkoutPreferencesForm
          initialValues={preferences ?? undefined}
          onSubmit={handlePreferencesSubmit}
          onBack={() => setStep("PROFILE_REVIEW")}
        />
      )}

      {/* Step 4: Generation */}
      {step === "GENERATION" && (
        <GenerationLoading timedOut={timedOut} onRetry={handleRetry} />
      )}

      {/* Step 5: Review */}
      {step === "REVIEW" && generatedContent && preferences && (
        <WorkoutPlanReview
          content={generatedContent}
          planName={preferences.name}
          onConfirm={handleConfirmReview}
          onBack={() => setStep("PREFERENCES")}
          isLoading={isSaving}
        />
      )}

      {step === "REVIEW" && !generatedContent && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">{t("wizard.loadingPlan")}</p>
          </CardContent>
        </Card>
      )}

      {/* Step 6: Confirmation */}
      {step === "CONFIRMATION" && createdPlanId && (
        <ConfirmationView planId={createdPlanId} />
      )}

      {step === "CONFIRMATION" && !createdPlanId && (
        <Card>
          <CardContent className="py-8 text-center space-y-2">
            <CheckCircle2 className="h-6 w-6 mx-auto text-green-600" />
            <p className="font-medium">{t("wizard.planConfirmed")}</p>
            <p className="text-sm text-muted-foreground">{t("wizard.redirectingToPlans")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
