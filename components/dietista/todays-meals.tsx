"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, Check, Sparkles } from "lucide-react";
import type { PlannedMeal } from "@/lib/planned-meal-mapper";
import { toggleMealCompleted, getSuggestion, saveSuggestedMeal } from "@/actions/diary-new";
import type { SuggestResult } from "@/lib/openai";
import type { ChatMessage } from "@/lib/schemas";
import { AiChatModal } from "@/components/dietista/ai-chat-modal";

// ─── Types ─────────────────────────────────────────────────────────────────────

type DiaryEntryData = {
  completed: boolean;
  actualCalories: number | null;
  actualProtein: number | null;
  actualCarbs: number | null;
  actualFat: number | null;
  aiSuggestion: unknown;
};

interface TodaysMealsProps {
  meals: PlannedMeal[];
  hasActivePlan: boolean;
  diaryByType: Record<string, DiaryEntryData>;
  dateISO: string;
  targets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  isReadOnly: boolean;
}

type SlotState = {
  completed: boolean;
  aiOpen: boolean;
  aiLoading: boolean;
  aiError: string | null;
  messages: ChatMessage[];
  pendingSuggestion: SuggestResult | null;
  turnCount: number;
};

// ─── Component ─────────────────────────────────────────────────────────────────

export function TodaysMeals({
  meals,
  hasActivePlan,
  diaryByType,
  dateISO,
  isReadOnly,
}: TodaysMealsProps) {
  const t = useTranslations("Journal");
  const [expandedMeals, setExpandedMeals] = useState<Record<string, boolean>>({});
  const [, startToggleTransition] = useTransition();
  const [, startAiTransition] = useTransition();

  // Per-slot state
  const [slotStates, setSlotStates] = useState<Record<string, SlotState>>(() => {
    const init: Record<string, SlotState> = {};
    for (const meal of meals) {
      const entry = diaryByType[meal.mealType];
      init[meal.mealType] = {
        completed: entry?.completed ?? false,
        aiOpen: false,
        aiLoading: false,
        aiError: null,
        messages: [],
        pendingSuggestion: null,
        turnCount: 0,
      };
    }
    return init;
  });

  const toggleMeal = (id: string) => {
    setExpandedMeals((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getSlot = (mealType: string): SlotState => {
    return slotStates[mealType] ?? {
      completed: false,
      aiOpen: false,
      aiLoading: false,
      aiError: null,
      messages: [],
      pendingSuggestion: null,
      turnCount: 0,
    };
  };

  const updateSlot = (mealType: string, patch: Partial<SlotState>) => {
    setSlotStates((prev) => ({
      ...prev,
      [mealType]: { ...(prev[mealType] ?? getSlot(mealType)), ...patch },
    }));
  };

  const handleToggleDone = (meal: PlannedMeal) => {
    if (isReadOnly) return;
    const slot = getSlot(meal.mealType);
    // Optimistic update
    updateSlot(meal.mealType, { completed: !slot.completed });

    startToggleTransition(async () => {
      const result = await toggleMealCompleted({
        date: new Date(dateISO),
        mealType: meal.mealType,
        mealId: meal.id,
        macros: {
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
        },
      });
      if (!result.success) {
        // Revert on error
        updateSlot(meal.mealType, { completed: slot.completed });
      } else {
        updateSlot(meal.mealType, { completed: result.completed ?? !slot.completed });
      }
    });
  };

  const handleAskAI = (mealType: string) => {
    if (isReadOnly) return;
    updateSlot(mealType, {
      aiOpen: true,
      messages: [],
      pendingSuggestion: null,
      aiError: null,
      turnCount: 0,
    });
  };

  const handleAiClose = (mealType: string) => {
    updateSlot(mealType, {
      aiOpen: false,
      messages: [],
      pendingSuggestion: null,
      aiError: null,
      turnCount: 0,
    });
  };

  const handleAiSubmit = (mealType: string, query: string) => {
    const slot = getSlot(mealType);

    // Capture history before appending the new user message
    const historyBeforeTurn = slot.messages;
    const userMessage: ChatMessage = { role: "user", text: query };
    const updatedMessages = [...historyBeforeTurn, userMessage];

    updateSlot(mealType, {
      aiLoading: true,
      aiError: null,
      messages: updatedMessages,
      turnCount: slot.turnCount + 1,
    });

    startAiTransition(async () => {
      const result = await getSuggestion({
        date: new Date(dateISO),
        mealType,
        query,
        history: historyBeforeTurn,
      });

      if (result.success && result.result) {
        const assistantMessage: ChatMessage = {
          role: "assistant",
          text: result.result.message,
        };
        updateSlot(mealType, {
          aiLoading: false,
          messages: [...updatedMessages, assistantMessage],
          pendingSuggestion: result.result.suggestion,
        });
      } else {
        const errorKey =
          result.error === "turn_limit_exceeded"
            ? "aiTurnLimitError"
            : result.error === "rate_limit_exceeded"
              ? "rateLimitError"
              : "aiParseError";
        updateSlot(mealType, {
          aiLoading: false,
          aiError: t(errorKey as any),
        });
      }
    });
  };

  const handleAiSave = (mealType: string) => {
    if (isReadOnly) return;
    const slot = getSlot(mealType);
    if (!slot.pendingSuggestion) return;
    const suggestion = slot.pendingSuggestion;

    startAiTransition(async () => {
      const result = await saveSuggestedMeal({
        date: new Date(dateISO),
        mealType,
        suggestion,
      });
      if (result.success) {
        updateSlot(mealType, {
          aiOpen: false,
          messages: [],
          pendingSuggestion: null,
          turnCount: 0,
          completed: true,
        });
      } else {
        // Rate-limit or server error — keep modal open, show error
        const errorKey =
          result.error === "rate_limit_exceeded" ? "rateLimitError" : "aiParseError";
        updateSlot(mealType, { aiError: t(errorKey as any) });
      }
    });
  };

  const mealTypeLabels = t.raw("mealTypes") as Record<string, string>;

  return (
    <div className="space-y-3 px-[var(--dietista-pad-card)]">
      {/* Section heading */}
      <h2 className="text-sm font-semibold text-[var(--dietista-text)]">
        {t("plannedTitle")}
      </h2>

      {/* Read-only badge */}
      {isReadOnly && (
        <div
          role="status"
          className="inline-flex items-center gap-1 rounded-full bg-[var(--dietista-border)] px-2.5 py-1 text-xs font-medium text-[var(--dietista-text-2)]"
        >
          {t("readOnly")}
        </div>
      )}

      {/* Empty state (a): no active plan */}
      {!hasActivePlan && (
        <div className="rounded-[var(--dietista-r-lg)] border border-dashed border-[var(--dietista-border)] p-8 text-center">
          <p className="text-sm font-medium text-[var(--dietista-text)]">
            {t("noActivePlan")}
          </p>
          <p className="mt-1 text-xs text-[var(--dietista-text-3)]">
            {t("noActivePlanHint")}
          </p>
          <div className="mt-3 text-xs text-[var(--dietista-text-3)]">
            {t("noPlan")}
          </div>
          <AskAIButton
            mealType="breakfast"
            slot={getSlot("breakfast")}
            onAskAI={handleAskAI}
            onClose={handleAiClose}
            onSubmit={handleAiSubmit}
            onSave={handleAiSave}
            t={t}
          />
          <Link
            href="/planes"
            className="mt-4 inline-block rounded-lg bg-[var(--brand-500)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-600)]"
          >
            {t("goToPlans")}
          </Link>
        </div>
      )}

      {/* Empty state (b): active plan but no meals today */}
      {hasActivePlan && meals.length === 0 && (
        <div className="rounded-[var(--dietista-r-lg)] border border-dashed border-[var(--dietista-border)] p-8 text-center">
          <p className="text-sm text-[var(--dietista-text-3)]">
            {t("noPlannedMeals")}
          </p>
        </div>
      )}

      {/* Meal cards */}
      {hasActivePlan &&
        meals.map((meal) => {
          const isExpanded = !!expandedMeals[meal.id];
          const slot = getSlot(meal.mealType);
          const hasPlannedMacros = meal.calories > 0;
          const diaryEntry = diaryByType[meal.mealType];

          // T-08: display AI suggestion as title when slot has accepted an AI meal
          const rawSugg = diaryEntry?.aiSuggestion;
          const aiSuggName = typeof rawSugg === "string"
            ? rawSugg
            : rawSugg && typeof rawSugg === "object" && "foodName" in rawSugg
              ? (rawSugg as Record<string, unknown>).foodName as string
              : null;
          const cardTitle = aiSuggName ?? meal.name;
          const cardKcal = Math.round(diaryEntry?.actualCalories ?? meal.calories);
          const hasAiSuggestion = !!aiSuggName;

          return (
            <div
              key={meal.id}
              className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)]"
            >
              {/* Collapsed header (always visible) */}
              <div className="flex items-start gap-2 p-[var(--dietista-pad-card)]">
                <button
                  type="button"
                  onClick={() => toggleMeal(meal.id)}
                  aria-expanded={isExpanded}
                  className="flex flex-1 items-start justify-between text-left transition-colors hover:bg-[var(--dietista-surface-2,var(--dietista-surface))] rounded-[var(--dietista-r-lg)]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-medium uppercase tracking-wide text-[var(--dietista-text-2)]">
                        {mealTypeLabels[meal.mealType] ?? meal.mealType}
                      </p>
                      {hasAiSuggestion && (
                        <span className="rounded-full bg-[var(--brand-500)]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--brand-500)]">
                          {t("aiBadge")}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm font-semibold text-[var(--dietista-text)]">
                      {cardTitle}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--dietista-text-3)] tnum">
                      {cardKcal} kcal
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="mt-1 h-4 w-4 flex-shrink-0 text-[var(--dietista-text-3)]" />
                  ) : (
                    <ChevronDown className="mt-1 h-4 w-4 flex-shrink-0 text-[var(--dietista-text-3)]" />
                  )}
                </button>

                {/* Action buttons — hidden in read-only mode */}
                {!isReadOnly && (
                <div className="flex items-center gap-1 mt-1">
                  {/* Done button */}
                  {hasPlannedMacros && (
                    <button
                      type="button"
                      onClick={() => handleToggleDone(meal)}
                      aria-label={slot.completed ? t("markUndone") : t("markDone")}
                      className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                        slot.completed
                          ? "border-green-500 bg-green-500 text-white"
                          : "border-[var(--dietista-border)] bg-transparent text-[var(--dietista-text-3)] hover:border-green-400 hover:text-green-500"
                      }`}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}

                  {/* Ask AI button */}
                  <button
                    type="button"
                    onClick={() => handleAskAI(meal.mealType)}
                    aria-label={t("askAI")}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--dietista-border)] bg-transparent text-[var(--dietista-text-3)] transition-colors hover:border-[var(--brand-500)] hover:text-[var(--brand-500)]"
                  >
                    <Sparkles className="h-4 w-4" />
                  </button>
                </div>
                )}
              </div>

              {/* Completed indicator */}
              {slot.completed && (
                <div className="mx-[var(--dietista-pad-card)] mb-2 flex items-center gap-1 text-xs text-green-600">
                  <Check className="h-3 w-3" />
                  <span>{t("completed")}</span>
                </div>
              )}

              {/* Expanded content */}
              {isExpanded && (
                <div className="space-y-3 px-[var(--dietista-pad-card)] pb-[var(--dietista-pad-card)]">
                  {/* Description */}
                  {meal.description && (
                    <p className="text-sm text-[var(--dietista-text-2)]">
                      {meal.description}
                    </p>
                  )}

                  {/* Macro line */}
                  <p className="text-xs text-[var(--dietista-text-3)] tnum">
                    {t("abbrProtein")} {Math.round(meal.protein)}g{" "}
                    {t("abbrCarbs")} {Math.round(meal.carbs)}g{" "}
                    {t("abbrFat")} {Math.round(meal.fat)}g
                  </p>

                  {/* Ingredient table */}
                  {meal.ingredients.length > 0 ? (
                    <>
                      <p className="text-xs font-medium text-[var(--dietista-text-2)]">
                        {t("ingredients")}
                      </p>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-[var(--dietista-border)] text-left text-[var(--dietista-text-3)]">
                            <th className="py-1 pr-2">{t("ingredientName")}</th>
                            <th className="px-2 py-1">{t("quantity")}</th>
                            <th className="py-1 pl-2">{t("unit")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {meal.ingredients.map((ing, i) => (
                            <tr
                              key={i}
                              className="border-b border-[var(--dietista-border)]/50"
                            >
                              <td className="py-1 pr-2 text-[var(--dietista-text)]">
                                {ing.name}
                              </td>
                              <td className="px-2 py-1 text-[var(--dietista-text-2)] tnum">
                                {ing.quantity ?? ""}
                              </td>
                              <td className="py-1 pl-2 text-[var(--dietista-text-2)]">
                                {ing.unit ?? ""}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  ) : (
                    <p className="text-xs italic text-[var(--dietista-text-3)]">
                      {t("noIngredients")}
                    </p>
                  )}

                  {/* Instructions */}
                  {meal.instructions && (
                    <p className="text-xs italic text-[var(--dietista-text-3)]">
                      {meal.instructions}
                    </p>
                  )}
                </div>
              )}

              {/* AI Chat Modal */}
              <AiChatModal
                open={slot.aiOpen}
                messages={slot.messages}
                pendingSuggestion={slot.pendingSuggestion}
                loading={slot.aiLoading}
                error={slot.aiError}
                turnCount={slot.turnCount}
                onSubmit={(query) => handleAiSubmit(meal.mealType, query)}
                onAccept={() => handleAiSave(meal.mealType)}
                onClose={() => handleAiClose(meal.mealType)}
              />
            </div>
          );
        })}
    </div>
  );
}

// ─── AskAI Button (standalone for no-plan state) ───────────────────────────────

interface AskAIButtonProps {
  mealType: string;
  slot: SlotState;
  onAskAI: (mealType: string) => void;
  onClose: (mealType: string) => void;
  onSubmit: (mealType: string, query: string) => void;
  onSave: (mealType: string) => void;
  t: ReturnType<typeof useTranslations<"Journal">>;
}

function AskAIButton({ mealType, slot, onAskAI, onClose, onSubmit, onSave, t }: AskAIButtonProps) {
  return (
    <>
      <button
        type="button"
        onClick={() => onAskAI(mealType)}
        className="mt-3 flex items-center gap-1 rounded-lg border border-[var(--brand-500)] px-3 py-1.5 text-xs font-semibold text-[var(--brand-500)] transition-colors hover:bg-[var(--brand-500)] hover:text-white"
      >
        <Sparkles className="h-3 w-3" />
        {t("askAI")}
      </button>
      <AiChatModal
        open={slot.aiOpen}
        messages={slot.messages}
        pendingSuggestion={slot.pendingSuggestion}
        loading={slot.aiLoading}
        error={slot.aiError}
        turnCount={slot.turnCount}
        onSubmit={(query) => onSubmit(mealType, query)}
        onAccept={() => onSave(mealType)}
        onClose={() => onClose(mealType)}
      />
    </>
  );
}
