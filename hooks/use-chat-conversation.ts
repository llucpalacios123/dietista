"use client";

import { useReducer, useCallback, useEffect } from "react";
import {
  chatConversationStateSchema,
  type ChatConversationStep,
} from "@/lib/schemas";

// ─── Types ────────────────────────────────────────────────────────────────

export interface ConversationState {
  step: ChatConversationStep;
  collectedData: {
    preferences?: {
      goal?: string;
      activityLevel?: string;
      allergies?: string[];
      forbiddenFoods?: string[];
    };
    pdfData?: {
      rawText: string;
      extractedAt?: string;
    };
    confidence: "high" | "medium" | "low";
  };
  isComplete: boolean;
}

type ConversationAction =
  | { type: "ADVANCE_STEP"; nextStep: ChatConversationStep }
  | { type: "SET_PREFERENCES"; preferences: ConversationState["collectedData"]["preferences"] }
  | { type: "SET_PDF_DATA"; pdfData: ConversationState["collectedData"]["pdfData"] }
  | { type: "SET_GENERATING" }
  | { type: "SET_COMPLETE" }
  | { type: "RESET" }
  | { type: "RESTORE"; state: ConversationState };

// ─── Constants ────────────────────────────────────────────────────────────

const STORAGE_KEY = "dietista-chat-conversation";

const STEP_ORDER: readonly ChatConversationStep[] = [
  "collect_preferences",
  "collect_dietary_restrictions",
  "collect_pdf_input",
  "confirm_generation",
  "generating",
  "complete",
] as const;

const INITIAL_STATE: ConversationState = {
  step: "collect_preferences",
  collectedData: {
    confidence: "medium",
  },
  isComplete: false,
};

// ─── Reducer ──────────────────────────────────────────────────────────────

function conversationReducer(
  state: ConversationState,
  action: ConversationAction
): ConversationState {
  switch (action.type) {
    case "ADVANCE_STEP": {
      const currentIndex = STEP_ORDER.indexOf(state.step);
      const nextIndex = STEP_ORDER.indexOf(action.nextStep);
      // Only allow advancing forward
      if (nextIndex <= currentIndex) return state;

      return {
        ...state,
        step: action.nextStep,
      };
    }

    case "SET_PREFERENCES": {
      return {
        ...state,
        collectedData: {
          ...state.collectedData,
          preferences: {
            ...state.collectedData.preferences,
            ...action.preferences,
          },
        },
      };
    }

    case "SET_PDF_DATA": {
      return {
        ...state,
        collectedData: {
          ...state.collectedData,
          pdfData: action.pdfData,
        },
      };
    }

    case "SET_GENERATING": {
      return {
        ...state,
        step: "generating",
      };
    }

    case "SET_COMPLETE": {
      return {
        ...state,
        step: "complete",
        isComplete: true,
      };
    }

    case "RESET": {
      return { ...INITIAL_STATE };
    }

    case "RESTORE": {
      const validated = chatConversationStateSchema.safeParse(action.state);
      if (!validated.success) return state;
      return { ...action.state };
    }

    default:
      return state;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────

/**
 * Conversation state machine hook for the chat meal plan flow.
 *
 * Manages the multi-step conversation with the AI nutritionist:
 * 1. collect_preferences  — user shares goal and activity level
 * 2. collect_dietary_restrictions — user shares allergies and forbidden foods
 * 3. collect_pdf_input — optional PDF upload
 * 4. confirm_generation — AI reviews collected data
 * 5. generating — meal plan is being created
 * 6. complete — meal plan is ready
 *
 * Persists state to sessionStorage so the conversation survives page refreshes
 * but does not persist across browser sessions.
 */
export function useChatConversation() {
  const [state, dispatch] = useReducer(conversationReducer, INITIAL_STATE, (initial) => {
    // Restore from sessionStorage on initial load
    if (typeof window === "undefined") return initial;

    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ConversationState;
        const validated = chatConversationStateSchema.safeParse(parsed);
        if (validated.success) {
          return validated.data;
        }
      }
    } catch {
      // Corrupted storage — start fresh
    }

    return initial;
  });

  // Persist to sessionStorage on every state change
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or unavailable — silently ignore
    }
  }, [state]);

  // ─── Actions ──────────────────────────────────────────────────────────

  const advanceStep = useCallback((nextStep: ChatConversationStep) => {
    dispatch({ type: "ADVANCE_STEP", nextStep });
  }, []);

  const setPreferences = useCallback(
    (preferences: ConversationState["collectedData"]["preferences"]) => {
      dispatch({ type: "SET_PREFERENCES", preferences });
    },
    []
  );

  const setPdfData = useCallback(
    (pdfData: ConversationState["collectedData"]["pdfData"]) => {
      dispatch({ type: "SET_PDF_DATA", pdfData });
    },
    []
  );

  const setGenerating = useCallback(() => {
    dispatch({ type: "SET_GENERATING" });
  }, []);

  const setComplete = useCallback(() => {
    dispatch({ type: "SET_COMPLETE" });
  }, []);

  const resetConversation = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  // ─── Derived State ────────────────────────────────────────────────────

  const stepIndex = STEP_ORDER.indexOf(state.step);
  const totalSteps = STEP_ORDER.length;

  const canAdvance = stepIndex < totalSteps - 1 && !state.isComplete;

  return {
    state,
    step: state.step,
    stepIndex,
    totalSteps,
    collectedData: state.collectedData,
    isComplete: state.isComplete,
    canAdvance,
    // Actions
    advanceStep,
    setPreferences,
    setPdfData,
    setGenerating,
    setComplete,
    resetConversation,
    // Step helpers
    STEP_ORDER,
  };
}
