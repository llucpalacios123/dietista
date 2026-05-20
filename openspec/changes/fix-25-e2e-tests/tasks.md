# Tasks: Fix 25 Failing E2E Tests

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 250-300 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Select label fix (7 fields) + Wizard page creation | PR 1 | Single PR — well under 400 lines, tests included |

## Phase 1: Select Label Fix (Prerequisite)

- [ ] 1.1 Add `id="profile-sex"` to SelectTrigger and `htmlFor="profile-sex"` to FormLabel for Sex field (line 278-280)
- [ ] 1.2 Add `id="profile-goal"` to SelectTrigger and `htmlFor="profile-goal"` to FormLabel for Goal field (line 298-300)
- [ ] 1.3 Add `id="profile-activity-level"` to SelectTrigger and `htmlFor="profile-activity-level"` to FormLabel for Activity Level field (line 318-320)
- [ ] 1.4 Add `id="profile-diet-type"` to SelectTrigger and `htmlFor="profile-diet-type"` to FormLabel for Diet Type field (line 368-370)
- [ ] 1.5 Add `id="profile-variety-preference"` to SelectTrigger and `htmlFor="profile-variety-preference"` to FormLabel for Variety Preference field (line 448-450)
- [ ] 1.6 Add `id="profile-eating-out-frequency"` to SelectTrigger and `htmlFor="profile-eating-out-frequency"` to FormLabel for Eating Out Frequency field (line 498-500)
- [ ] 1.7 Add `id="profile-meal-complexity"` to SelectTrigger and `htmlFor="profile-meal-complexity"` to FormLabel for Meal Complexity field (line 528-530)

## Phase 2: Wizard Page Infrastructure

- [ ] 2.1 Create `app/(dashboard)/meal-plans/new/page.tsx` — Server component that calls `getProfile()`, redirects if null, renders WizardClient
- [ ] 2.2 Create `app/(dashboard)/meal-plans/new/wizard-client.tsx` — Client component with 6-step state machine using `useState<NutritionistStep>`
- [ ] 2.3 Define WizardState interface with step, editingFields, modifiedProfile, preferences, mealPlan, modifications, error, generating
- [ ] 2.4 Wire Step 1: Render ProfileReviewCard with onAllCorrect → Step 3, onEditField → Step 2
- [ ] 2.5 Wire Step 2: Render ProfileModificationForm with onSave → updateProfile → Step 3, onCancel → Step 1
- [ ] 2.6 Wire Step 3: Render PreferencesForm with onSubmit → setPreferences → Step 4
- [ ] 2.7 Wire Step 4: Render GenerationLoading, call generateMealPlan action, handle success → Step 5, error → retry
- [ ] 2.8 Wire Step 5: Render PlanReview with onConfirm → Step 6, onModifyMeal → regenerate, onUndo → revert
- [ ] 2.9 Implement Step 6: Inline confirmation view, call API to persist plan, redirect to /meal-plans

## Phase 3: Error Handling & Edge Cases

- [ ] 3.1 Add error boundary for profile fetch failure — show error message with retry button
- [ ] 3.2 Add timeout handling for generation (120s max) — show timeout error with retry option
- [ ] 3.3 Add validation for required preferences before allowing Step 3 → Step 4 transition
- [ ] 3.4 Handle empty profile state — redirect to /profile if no profile exists

## Phase 4: Verification

- [ ] 4.1 Run `npm run test:e2e -- nutritionist-wizard.spec.ts` — verify all 4 wizard tests pass
- [ ] 4.2 Run `npm run test:e2e -- profile-management.spec.ts` — verify all 8 profile tests pass
- [ ] 4.3 Run `npm run test:e2e -- meal-plan-generation.spec.ts` — verify all 8 generation tests pass
- [ ] 4.4 Manual verification: Test all 7 Select fields via Playwright `getByLabel()` queries
- [ ] 4.5 Manual verification: Complete full wizard flow from /meal-plans/new to confirmation

## Phase 5: Cleanup (if needed)

- [ ] 5.1 Remove any temporary console.log statements added during debugging
- [ ] 5.2 Verify no TypeScript errors with `npm run typecheck`
- [ ] 5.3 Verify no ESLint errors with `npm run lint`
