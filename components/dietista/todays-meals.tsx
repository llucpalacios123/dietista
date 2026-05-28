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
}

type SlotChatState = {
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
}: TodaysMealsProps) {
  const t = useTranslations("Journal");
  const [expandedMeals, setExpandedMeals] = useState<Record<string, boolean>>({});
  const [, startToggleTransition] = useTransition();
  const [, startAiTransition] = useTransition();

  // Singleton modal state: null = closed, string = active mealType
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);

  // Per-slot completion state
  const [completedSlots, setCompletedSlots] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const meal of meals) {
      const entry = diaryByType[meal.mealType];
      init[meal.mealType] = entry?.completed ?? false;
    }
    return init;
  });

  // Per-slot AI conversation state
  const [slotChatStates, setSlotChatStates] = useState<Record<string, SlotChatState>>({});

  const toggleMealExpand = (id: string) => {
    setExpandedMeals((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getSlotChat = (mealType: string): SlotChatState => {
    return slotChatStates[mealType] ?? {
      aiLoading: false,
      aiError: null,
      messages: [],
      pendingSuggestion: null,
      turnCount: 0,
    };
  };

  const updateSlotChat = (mealType: string, patch: Partial<SlotChatState>) => {
    setSlotChatStates((prev) => ({
      ...prev,
      [mealType]: { ...(prev[mealType] ?? getSlotChat(mealType)), ...patch },
    }));
  };

  const handleToggleDone = (meal: PlannedMeal) => {
    const wasCompleted = completedSlots[meal.mealType] ?? false;
    // Optimistic update
    setCompletedSlots((prev) => ({ ...prev, [meal.mealType]: !wasCompleted }));

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
        setCompletedSlots((prev) => ({ ...prev, [meal.mealType]: wasCompleted }));
      } else {
        setCompletedSlots((prev) => ({
          ...prev,
          [meal.mealType]: result.completed ?? !wasCompleted,
        }));
      }
    });
  };

  const handleAskAI = (mealType: string) => {
    // Reset chat state for the slot being opened
    updateSlotChat(mealType, {
      messages: [],
      pendingSuggestion: null,
      aiError: null,
      turnCount: 0,
    });
    setActiveSlotId(mealType);
  };

  const handleAiClose = () => {
    setActiveSlotId(null);
  };

  const handleAiSubmit = (mealType: string, query: string) => {
    const slot = getSlotChat(mealType);
    const historyBeforeTurn = slot.messages;
    const userMessage: ChatMessage = { role: "user", text: query };
    const updatedMessages = [...historyBeforeTurn, userMessage];

    updateSlotChat(mealType, {
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
        updateSlotChat(mealType, {
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
        updateSlotChat(mealType, {
          aiLoading: false,
          aiError: t(errorKey as any),
        });
      }
    });
  };

  const handleAiSave = (mealType: string) => {
    const slot = getSlotChat(mealType);
    if (!slot.pendingSuggestion) return;
    const suggestion = slot.pendingSuggestion;

    // Find the mealId for the active slot
    const activeMeal = meals.find((m) => m.mealType === mealType);

    startAiTransition(async () => {
      const result = await saveSuggestedMeal({
        date: new Date(dateISO),
        mealType,
        mealId: activeMeal?.id,
        suggestion,
      });
      if (result.success) {
        setActiveSlotId(null);
        updateSlotChat(mealType, {
          messages: [],
          pendingSuggestion: null,
          turnCount: 0,
        });
        setCompletedSlots((prev) => ({ ...prev, [mealType]: true }));
      } else {
        const errorKey =
          result.error === "rate_limit_exceeded" ? "rateLimitError" : "aiParseError";
        updateSlotChat(mealType, { aiError: t(errorKey as any) });
      }
    });
  };

  const mealTypeLabels = t.raw("mealTypes") as Record<string, string>;

  // Active slot chat state for the singleton modal
  const activeChat = activeSlotId ? getSlotChat(activeSlotId) : null;

  return (
    <div className="space-y-3 px-[var(--dietista-pad-card)]">
      {/* Section heading */}
      <h2 className="text-sm font-semibold text-[var(--dietista-text)]">
        {t("plannedTitle")}
      </h2>

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
          <button
            type="button"
            onClick={() => handleAskAI("breakfast")}
            className="mt-3 flex items-center gap-1 rounded-lg border border-[var(--brand-500)] px-3 py-1.5 text-xs font-semibold text-[var(--brand-500)] transition-colors hover:bg-[var(--brand-500)] hover:text-white"
          >
            <Sparkles className="h-3 w-3" />
            {t("askAI")}
          </button>
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
          const isCompleted = completedSlots[meal.mealType] ?? false;
          const hasPlannedMacros = meal.calories > 0;
          const diaryEntry = diaryByType[meal.mealType];

          // Display AI suggestion name when the slot has an accepted AI meal
          const aiSuggestionObj = diaryEntry?.aiSuggestion;
          const aiSuggestionName =
            aiSuggestionObj && typeof aiSuggestionObj === "object" && !Array.isArray(aiSuggestionObj)
              ? (aiSuggestionObj as Record<string, unknown>).foodName as string | undefined
              : typeof aiSuggestionObj === "string"
                ? aiSuggestionObj
                : undefined;

          const cardTitle = aiSuggestionName ?? meal.name;
          const cardKcal = Math.round(diaryEntry?.actualCalories ?? meal.calories);
          const hasAiSuggestion = !!aiSuggestionName;

          return (
            <div
              key={meal.id}
              className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)]"
            >
              {/* Collapsed header (always visible) */}
              <div className="flex items-start gap-2 p-[var(--dietista-pad-card)]">
                <button
                  type="button"
                  onClick={() => toggleMealExpand(meal.id)}
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

                {/* Action buttons */}
                <div className="flex items-center gap-1 mt-1">
                  {/* Done button */}
                  {hasPlannedMacros && (
                    <button
                      type="button"
                      onClick={() => handleToggleDone(meal)}
                      aria-label={isCompleted ? t("markUndone") : t("markDone")}
                      className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                        isCompleted
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
              </div>

              {/* Completed indicator */}
              {isCompleted && (
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
            </div>
          );
        })}

      {/* ─── Singleton AiChatModal (outside map) ─────────────────────────── */}
      {activeSlotId !== null && activeChat !== null && (
        <AiChatModal
          open={true}
          messages={activeChat.messages}
          pendingSuggestion={activeChat.pendingSuggestion}
          loading={activeChat.aiLoading}
          error={activeChat.aiError}
          turnCount={activeChat.turnCount}
          onSubmit={(query) => handleAiSubmit(activeSlotId, query)}
          onAccept={() => handleAiSave(activeSlotId)}
          onClose={handleAiClose}
        />
      )}
    </div>
  );
}
