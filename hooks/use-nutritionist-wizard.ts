"use client";

import { useReducer, useCallback, useEffect } from "react";
import {
  nutritionistChatStateSchema,
  type NutritionistStep,
  type NutritionistChatStateSchema,
  type UserProfileSchema,
  type NutritionistPreferencesSchema,
  type SpringBootWeeklyPlanSchema,
} from "@/lib/schemas";
import type { MealModification, InternalMealPlan } from "@/types/meal-plan";

// ─── Types ────────────────────────────────────────────────────────────────

export interface WizardState {
  currentStep: NutritionistStep;
  profileData: UserProfileSchema | null;
  preferences: NutritionistPreferencesSchema | null;
  generatedPlan: InternalMealPlan | null;
  modifications: MealModification[];
  validatedJson: Record<string, unknown> | null;
}

type WizardAction =
  | { type: "SET_STEP"; step: NutritionistStep }
  | { type: "SET_PROFILE"; profile: UserProfileSchema }
  | { type: "UPDATE_PROFILE"; changes: Partial<UserProfileSchema> }
  | { type: "SET_PREFERENCES"; preferences: NutritionistPreferencesSchema }
  | { type: "SET_GENERATED_PLAN"; plan: InternalMealPlan }
  | { type: "ADD_MODIFICATION"; modification: MealModification }
  | { type: "UNDO_MODIFICATION" }
  | { type: "SET_VALIDATED_JSON"; json: Record<string, unknown> }
  | { type: "RESET" }
  | { type: "RESTORE"; state: WizardState };

// ─── Constants ────────────────────────────────────────────────────────────

const STEP_ORDER: readonly NutritionistStep[] = [
  "PROFILE_REVIEW",
  "PROFILE_MODIFICATION",
  "PREFERENCES_COLLECTION",
  "GENERATION",
  "REVIEW_MODIFICATION",
  "CONFIRMATION",
] as const;

const STORAGE_KEY = "dietista-nutritionist-wizard";

const INITIAL_STATE: WizardState = {
  currentStep: "PROFILE_REVIEW",
  profileData: null,
  preferences: null,
  generatedPlan: null,
  modifications: [],
  validatedJson: null,
};

// ─── Reducer ──────────────────────────────────────────────────────────────

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_STEP": {
      const currentIndex = STEP_ORDER.indexOf(state.currentStep);
      const nextIndex = STEP_ORDER.indexOf(action.step);

      // Block navigation: only forward, and only to immediate next or same step
      // Exception: PROFILE_REVIEW can go to PREFERENCES_COLLECTION (skip modification)
      const isForward = nextIndex > currentIndex;
      const isSkipModification =
        state.currentStep === "PROFILE_REVIEW" &&
        action.step === "PREFERENCES_COLLECTION";
      const isSameStep = currentIndex === nextIndex;

      if (!isForward && !isSkipModification && !isSameStep) {
        return state;
      }

      return { ...state, currentStep: action.step };
    }

    case "SET_PROFILE": {
      return { ...state, profileData: action.profile };
    }

    case "UPDATE_PROFILE": {
      if (!state.profileData) return state;
      return {
        ...state,
        profileData: { ...state.profileData, ...action.changes },
      };
    }

    case "SET_PREFERENCES": {
      return { ...state, preferences: action.preferences };
    }

    case "SET_GENERATED_PLAN": {
      return { ...state, generatedPlan: action.plan };
    }

    case "ADD_MODIFICATION": {
      return {
        ...state,
        modifications: [...state.modifications, action.modification],
      };
    }

    case "UNDO_MODIFICATION": {
      const mods = state.modifications.slice(0, -1);
      return { ...state, modifications: mods };
    }

    case "SET_VALIDATED_JSON": {
      return { ...state, validatedJson: action.json };
    }

    case "RESET": {
      return { ...INITIAL_STATE };
    }

    case "RESTORE": {
      return { ...action.state };
    }

    default:
      return state;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────

/**
 * Nutritionist Wizard state machine hook for the 6-step meal plan wizard.
 *
 * Manages the structured 6-step flow:
 * 1. PROFILE_REVIEW       — show current profile, offer edits
 * 2. PROFILE_MODIFICATION — edit specific profile fields (optional, can skip)
 * 3. PREFERENCES_COLLECTION — collect food preferences
 * 4. GENERATION           — loading state while AI creates the plan
 * 5. REVIEW_MODIFICATION  — review & modify the generated plan
 * 6. CONFIRMATION         — validate JSON and final confirmation
 *
 * Persists state to sessionStorage for refresh survival.
 * Does NOT allow backward navigation except from Step 2 to Step 1.
 */
export function useNutritionistWizard() {
  const [state, dispatch] = useReducer(wizardReducer, INITIAL_STATE, (initial) => {
    if (typeof window === "undefined") return initial;

    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as WizardState;
        if (parsed && typeof parsed.currentStep === "string") {
          return parsed;
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
      // Storage full or unavailable
    }
  }, [state]);

  // ─── Actions ──────────────────────────────────────────────────────────

  /** Advance to a specific step (forward-only, except skip from 1→3). */
  const goToStep = useCallback((step: NutritionistStep) => {
    dispatch({ type: "SET_STEP", step });
  }, []);

  /** Set the full profile data (loaded from server). */
  const setProfile = useCallback((profile: UserProfileSchema) => {
    dispatch({ type: "SET_PROFILE", profile });
  }, []);

  /** Apply partial profile changes (Step 2). */
  const updateProfile = useCallback((changes: Partial<UserProfileSchema>) => {
    dispatch({ type: "UPDATE_PROFILE", changes });
    dispatch({ type: "SET_STEP", step: "PREFERENCES_COLLECTION" });
  }, []);

  /** Save preferences and advance to generation (Step 3 → 4). */
  const savePreferences = useCallback((prefs: NutritionistPreferencesSchema) => {
    dispatch({ type: "SET_PREFERENCES", preferences: prefs });
    dispatch({ type: "SET_STEP", step: "GENERATION" });
  }, []);

  /** Store the generated plan and advance to review (Step 4 → 5). */
  const setGeneratedPlan = useCallback((plan: InternalMealPlan) => {
    dispatch({ type: "SET_GENERATED_PLAN", plan });
    dispatch({ type: "SET_STEP", step: "REVIEW_MODIFICATION" });
  }, []);

  /** Add a meal modification (Step 5). */
  const addModification = useCallback((mod: MealModification) => {
    dispatch({ type: "ADD_MODIFICATION", modification: mod });
  }, []);

  /** Undo the last modification (Step 5). */
  const undoModification = useCallback(() => {
    dispatch({ type: "UNDO_MODIFICATION" });
  }, []);

  /** Validate plan and advance to confirmation (Step 5 → 6). */
  const confirmPlan = useCallback((json: Record<string, unknown>) => {
    dispatch({ type: "SET_VALIDATED_JSON", json });
    dispatch({ type: "SET_STEP", step: "CONFIRMATION" });
  }, []);

  /** Reset the wizard to start over. */
  const resetWizard = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  // ─── Derived State ────────────────────────────────────────────────────

  const stepIndex = STEP_ORDER.indexOf(state.currentStep);
  const totalSteps = STEP_ORDER.length;
  const isComplete = state.currentStep === "CONFIRMATION";

  // What step numbers to show (skip modification if not entered)
  const effectiveStepIndex =
    state.currentStep === "PROFILE_MODIFICATION" ||
    state.currentStep === "PROFILE_REVIEW"
      ? Math.max(stepIndex, 0)
      : state.currentStep === "PREFERENCES_COLLECTION"
        ? 2
        : stepIndex;

  return {
    // State
    state,
    currentStep: state.currentStep,
    stepIndex,
    effectiveStepIndex,
    totalSteps,
    isComplete,
    profileData: state.profileData,
    preferences: state.preferences,
    generatedPlan: state.generatedPlan,
    modifications: state.modifications,
    validatedJson: state.validatedJson,

    // Actions
    goToStep,
    setProfile,
    updateProfile,
    savePreferences,
    setGeneratedPlan,
    addModification,
    undoModification,
    confirmPlan,
    resetWizard,

    // Constants
    STEP_ORDER,
  };
}
