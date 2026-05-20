# Design: Fix 25 Failing E2E Tests

## Technical Approach

Two root causes, two targeted fixes:

1. **Missing wizard page** — `app/(dashboard)/meal-plans/new/page.tsx` does not exist. The 5 step components exist in `components/chat/` but no route orchestrates them into the 6-step state machine the E2E tests expect at `/meal-plans/new`.

2. **Broken Select label association** — shadcn/ui's `SelectTrigger` uses Radix `SelectPrimitive.Trigger` which generates its own internal `id`, overriding the `id` that `FormControl`/`Slot` tries to propagate. Playwright's `getByLabel()` cannot associate `FormLabel` → `SelectTrigger` because the rendered `<button>` has Radix's internal id, not the form-item id. Fix: pass `id` explicitly to `SelectTrigger` and set `htmlFor` on the corresponding `FormLabel`.

Both fixes are additive — no existing behavior is removed or altered.

## Architecture Decisions

### Decision: Wizard as client component wrapper

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Server Component page + client wizard | Server fetches profile once, passes as initial data; client manages step state. Clean RSC boundary. | ✅ Chosen |
| Fully client-side page | Simpler but loses RSC data-fetching benefits, needs client-side auth guard. | ❌ Rejected — bypasses Next.js App Router patterns |
| Route-group per step | Each step is its own URL. Back button works but state management is complex. | ❌ Rejected — over-engineered for 6 sequential steps |

**Rationale**: Server component fetches profile via `getProfile()` action (existing, redirects on unauth). Client component receives profile as prop and manages wizard step state with `useState`. Matches existing pattern in `app/(dashboard)/meal-plans/page.tsx`.

### Decision: Explicit id/htmlFor for Select label association

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Add `id` to `SelectTrigger` + `htmlFor` to `FormLabel` | Simple, surgical fix. Requires per-field id generation in the form. | ✅ Chosen |
| Patch `SelectTrigger` in `components/ui/select.tsx` | Central fix, but introduces form-context coupling into a primitive UI component. | ❌ Rejected — violates separation of concerns |
| Use `aria-label` instead of label association | Works for tests but poor accessibility (duplicates label text). | ❌ Rejected — suboptimal a11y |

**Rationale**: Adding `id` to each `SelectTrigger` and matching `htmlFor` on `FormLabel` is the smallest fix that restores label association. It's explicit and doesn't pollute the UI primitive with form context.

## Data Flow

```
Server Component (page.tsx)
  │ getProfile() → { profile }
  │
  └─► WizardClient
        │ props: { profile: Profile | null }
        │ state: step, modifiedProfile, preferences, mealPlan, modifications, error
        │
        ├─ Step 1: PROFILE_REVIEW
        │    └─ ProfileReviewCard → onAllCorrect() → step = PREFERENCES_COLLECTION
        │                            → onEditField() → step = PROFILE_MODIFICATION
        │
        ├─ Step 2: PROFILE_MODIFICATION
        │    └─ ProfileModificationForm → onSave(changes) → updateProfile() → step = PREFERENCES_COLLECTION
        │                              → onCancel() → step = PROFILE_REVIEW
        │
        ├─ Step 3: PREFERENCES_COLLECTION
        │    └─ PreferencesForm → onSubmit(prefs) → step = GENERATION
        │
        ├─ Step 4: GENERATION
        │    └─ GenerationLoading → calls generate action → on success → step = REVIEW_MODIFICATION
        │                                              → on error → show retry
        │
        ├─ Step 5: REVIEW_MODIFICATION
        │    └─ PlanReview → onModifyMeal() → regenerate meal → modification tracked
        │                  → onUndo() → revert last modification
        │                  → onConfirm() → step = CONFIRMATION
        │
        └─ Step 6: CONFIRMATION
             └─ Inline confirmation view → build Spring Boot JSON → display + redirect
```

### Profile modification flow (Step 1 → 2 → 3)

```
ProfileReviewCard.onEditField("weight")
  → setEditingFields(["weight"])
  → setStep("PROFILE_MODIFICATION")
  → ProfileModificationForm renders with field="weight"
  → User edits, clicks "Guardar cambios"
  → onSave(changes) → call updateProfile action
  → Update local modifiedProfile state
  → setStep("PREFERENCES_COLLECTION")
```

### Generation flow (Step 3 → 4 → 5)

```
PreferencesForm.onSubmit(prefs)
  → setPreferences(prefs)
  → setStep("GENERATION")
  → Call generation action (server action or API route)
  → On success: setMealPlan(result), setStep("REVIEW_MODIFICATION")
  → On error: setError(msg), show retry in GenerationLoading
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `app/(dashboard)/meal-plans/new/page.tsx` | Create | Server component: fetches profile, renders WizardClient |
| `app/(dashboard)/meal-plans/new/wizard-client.tsx` | Create | Client component: 6-step state machine orchestrating chat components |
| `lib/schemas.ts` | Modify | No changes needed — `NutritionistStep` type already exists |
| `components/profile/profile-form.tsx` | Modify | Add `id` to all 7 `SelectTrigger` elements; ensure `FormLabel` `htmlFor` matches |

## Interfaces / Contracts

### WizardStep type

Already defined in `lib/schemas.ts` as `NutritionistStep`:

```typescript
export type NutritionistStep = z.infer<typeof nutritionistChatStateSchema>["currentStep"];
// ∈ "PROFILE_REVIEW" | "PROFILE_MODIFICATION" | "PREFERENCES_COLLECTION" | "GENERATION" | "REVIEW_MODIFICATION" | "CONFIRMATION"
```

### WizardClient props

```typescript
interface WizardClientProps {
  profile: NonNullable<Awaited<ReturnType<typeof getProfile>>["profile"]>;
}
```

### Wizard state shape

```typescript
type WizardState = {
  step: NutritionistStep;
  editingFields: Array<keyof UserProfileSchema>;
  modifiedProfile: UserProfileSchema;
  preferences: NutritionistPreferencesSchema;
  mealPlan: InternalMealPlan | null;
  modifications: MealModification[];
  error: string | null;
  generating: boolean;
};
```

### Page component (server)

```typescript
// app/(dashboard)/meal-plans/new/page.tsx
import { getProfile } from "@/actions/profile";
import { redirect } from "next/navigation";
import { WizardClient } from "./wizard-client";

export default async function MealPlansNewPage() {
  const { profile } = await getProfile();
  if (!profile) redirect("/profile");
  return <WizardClient profile={profile} />;
}
```

### Select label fix pattern

```tsx
// BEFORE (broken — Radix overrides id):
<FormItem>
  <FormLabel>Sex</FormLabel>
  <Select onValueChange={field.onChange} defaultValue={field.value}>
    <FormControl>
      <SelectTrigger>
        <SelectValue placeholder="Select sex" />
      </SelectTrigger>
    </FormControl>
    ...
  </Select>
</FormItem>

// AFTER (fixed — explicit id/htmlFor):
<FormItem>
  <FormLabel htmlFor="profile-sex">Sex</FormLabel>
  <Select onValueChange={field.onChange} defaultValue={field.value}>
    <FormControl>
      <SelectTrigger id="profile-sex">
        <SelectValue placeholder="Select sex" />
      </SelectTrigger>
    </FormControl>
    ...
  </Select>
</FormItem>
```

Field id mapping (all in `profile-form.tsx`):

| Field | id value |
|------|----------|
| Sex | `profile-sex` |
| Goal | `profile-goal` |
| Activity Level | `profile-activity-level` |
| Diet Type | `profile-diet-type` |
| Meals per Day | `profile-meals-per-day` (note: this is an `<Input>`, not a Select — no fix needed) |
| Variety Preference | `profile-variety-preference` |
| Eating Out Frequency | `profile-eating-out-frequency` |
| Meal Complexity | `profile-meal-complexity` |

4 Selects are always visible (Sex, Goal, Activity Level). 4 are in the advanced section (Diet Type, Variety Preference, Eating Out Frequency, Meal Complexity). Total: 7 Select fixes + 1 for the advanced-optional Meals per Day which is an `<Input>` — no fix needed.

**Why explicit ids?** React's `useId()` generates colon-containing ids (`:r0:`) that work for `htmlFor`/`id` association but are fragile. Stable, descriptive ids (`profile-sex`, `profile-goal`) are more predictable for both Playwright and debugging. Since these are the only Select fields in the app, explicit ids are sustainable.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Wizard step transitions | Test `useState` transitions: each button callback sets correct step |
| Unit | Select label association | Render `ProfileForm`, query each Select by label text, verify `<button>` is found |
| Integration | Profile → generation end-to-end | Mock `getProfile` and generation action, verify full wizard flow |
| E2E | 25 existing failing tests | Run Playwright suite — all should pass |

E2E test files that must pass:

- `e2e/nutritionist-wizard.spec.ts` — 4 tests
- `e2e/profile-management.spec.ts` — 8 tests
- `e2e/meal-plan-generation.spec.ts` — 8 tests (may already pass, but confirm)
- Remaining affected E2E tests — confirm no regressions

## Migration / Rollout

No migration required. The wizard page is a new route — no existing routes change. The Select fix is purely additive (adding `id`/`htmlFor` attributes).

## Open Questions

- [ ] Generation action: should the wizard call `generateMealPlan()` from `lib/diet-service.ts` directly as a server action, or use the `/api/meal-plans/generate` API route? The existing API route uses a job queue pattern. The wizard needs synchronous generation for the step transition. **Recommendation**: create a server action wrapping the generation logic that calls `generateDiet()` directly, bypassing the job queue for the wizard flow.
- [ ] Confirmation step redirect: the spec says "redirect to /meal-plans" but the existing meal-plans page expects a `MealPlan` object from the API. The wizard generates the plan client-side — should it persist to DB first, then redirect? **Recommendation**: yes — in Step 6, call the confirm API to persist the plan, then redirect to `/meal-plans`.