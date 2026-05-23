"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

// ─── Constants ────────────────────────────────────────────────────────────

const LOADING_MESSAGES: Array<{ key: string; durationMs: number }> = [
  { key: "calculating", durationMs: 3000 },
  { key: "analyzing", durationMs: 4000 },
  { key: "selectingMeals", durationMs: 5000 },
  { key: "optimizingMacros", durationMs: 4000 },
  { key: "adjustingPortions", durationMs: 4000 },
  { key: "preparingPlan", durationMs: 5000 },
  { key: "checkingBalance", durationMs: 4000 },
  { key: "almostReady", durationMs: 3000 },
];

const TOTAL_DURATION_MS = LOADING_MESSAGES.reduce((sum, m) => sum + m.durationMs, 0);

// ─── Skeleton Meal Card ───────────────────────────────────────────────────

function SkeletonMealCard() {
  return (
    <div className="rounded-lg border bg-card p-4 animate-pulse space-y-3">
      <div className="h-4 w-3/4 bg-muted rounded" />
      <div className="h-3 w-full bg-muted rounded" />
      <div className="flex gap-2">
        <div className="h-3 w-12 bg-muted rounded" />
        <div className="h-3 w-12 bg-muted rounded" />
        <div className="h-3 w-12 bg-muted rounded" />
        <div className="h-3 w-12 bg-muted rounded" />
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────

interface GenerationLoadingProps {
  /** Whether to show the timeout message. */
  timedOut?: boolean;
  /** Retry callback shown after timeout. */
  onRetry?: () => void;
}

/**
 * GenerationLoading — Step 4: Plan Generation Loading State
 *
 * Displays animated skeleton loaders and cycling progress messages
 * while the AI generates the meal plan. Message cycling is time-based:
 * each message appears for its specified duration.
 *
 * After ~30 seconds total, the user sees a near-complete UI.
 * If `timedOut` is set (60s+), a retry button appears.
 */
export function GenerationLoading({
  timedOut = false,
  onRetry,
}: GenerationLoadingProps) {
  const t = useTranslations("Chat");
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (timedOut) return;

    // Cycle through messages
    let elapsed = 0;
    const timeouts: NodeJS.Timeout[] = [];

    for (let i = 0; i < LOADING_MESSAGES.length; i++) {
      const timeout = setTimeout(() => {
        setMessageIndex(i);
      }, elapsed);
      timeouts.push(timeout);
      elapsed += LOADING_MESSAGES[i].durationMs;
    }

    // Progress bar animation
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const now = Date.now();
      const pct = Math.min((now - startTime) / TOTAL_DURATION_MS, 1);
      setProgress(pct);
    }, 200);

    return () => {
      timeouts.forEach(clearTimeout);
      clearInterval(progressInterval);
    };
  }, [timedOut]);

  const currentMessageKey = LOADING_MESSAGES[messageIndex]?.key;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {t("generating")}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t("generatingDescription")}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>

        {/* Current Message */}
        <div className="flex items-center gap-3 text-sm">
          {!timedOut ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : null}
          <span className="text-muted-foreground">
            {currentMessageKey ? t(currentMessageKey) : null}
          </span>
        </div>

        {/* Skeleton Loaders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SkeletonMealCard />
          <SkeletonMealCard />
          <SkeletonMealCard />
          <SkeletonMealCard />
        </div>

        {/* Timeout Message */}
        {timedOut && (
          <div className="text-center space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">
              {t("timeoutMessage")}
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <Loader2 className="h-4 w-4" />
                {t("retryGeneration")}
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
