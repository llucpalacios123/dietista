# Delta for User Profile Accessibility

## Purpose

Fixes label association for shadcn/ui Select components in profile form to enable Playwright's `page.getByLabel()` queries for E2E tests.

## MODIFIED Requirements

### Requirement: Profile Form Select Label Association

The system MUST associate FormLabel elements with Select components using proper `id` and `htmlFor` attributes to enable accessibility and test automation.

(Previously: Select components lacked explicit id/htmlFor association, preventing Playwright's getByLabel queries)

#### Scenario: Sex Select is label-associated

- GIVEN profile form is rendered
- WHEN form renders the Sex Select field
- THEN SelectTrigger has unique `id` attribute
- AND FormLabel has matching `htmlFor` attribute
- AND `page.getByLabel(/sex/i)` successfully finds and interacts with Select

#### Scenario: Goal Select is label-associated

- GIVEN profile form is rendered
- WHEN form renders the Goal Select field
- THEN SelectTrigger has unique `id` attribute
- AND FormLabel has matching `htmlFor` attribute
- AND `page.getByLabel(/goal/i)` successfully finds and interacts with Select

#### Scenario: Activity Level Select is label-associated

- GIVEN profile form is rendered
- WHEN form renders the Activity Level Select field
- THEN SelectTrigger has unique `id` attribute
- AND FormLabel has matching `htmlFor` attribute
- AND `page.getByLabel(/activity/i)` or `page.getByLabel(/activity level/i)` successfully finds and interacts with Select

#### Scenario: Diet Type Select is label-associated

- GIVEN profile form is rendered with advanced options expanded
- WHEN form renders the Diet Type Select field
- THEN SelectTrigger has unique `id` attribute
- AND FormLabel has matching `htmlFor` attribute
- AND `page.getByLabel(/diet type/i)` or `page.getByLabel(/tipo de dieta/i)` successfully finds and interacts with Select

#### Scenario: Variety Preference Select is label-associated

- GIVEN profile form is rendered with advanced options expanded
- WHEN form renders the Variety Preference Select field
- THEN SelectTrigger has unique `id` attribute
- AND FormLabel has matching `htmlFor` attribute
- AND `page.getByLabel(/variety/i)` successfully finds and interacts with Select

#### Scenario: Eating Out Frequency Select is label-associated

- GIVEN profile form is rendered with advanced options expanded
- WHEN form renders the Eating Out Frequency Select field
- THEN SelectTrigger has unique `id` attribute
- AND FormLabel has matching `htmlFor` attribute
- AND `page.getByLabel(/eating out/i)` or `page.getByLabel(/frequency/i)` successfully finds and interacts with Select

#### Scenario: Meal Complexity Select is label-associated

- GIVEN profile form is rendered with advanced options expanded
- WHEN form renders the Meal Complexity Select field
- THEN SelectTrigger has unique `id` attribute
- AND FormLabel has matching `htmlFor` attribute
- AND `page.getByLabel(/complexity/i)` successfully finds and interacts with Select

### Requirement: Profile Form Visual Behavior Preservation

The system MUST maintain existing visual appearance and functionality after adding label associations.

(Previously: No explicit requirement for visual preservation during accessibility fixes)

#### Scenario: Select visual appearance unchanged

- GIVEN profile form rendered before accessibility fix
- WHEN accessibility fix is applied (id/htmlFor added)
- THEN Select components maintain same visual appearance
- AND no layout shifts or styling changes occur

#### Scenario: Select functionality unchanged

- GIVEN user can interact with Select components before fix
- WHEN accessibility fix is applied
- THEN Select open/close behavior works identically
- AND option selection works identically
- AND form submission behavior unchanged

#### Scenario: Form validation unchanged

- GIVEN profile form has validation logic
- WHEN accessibility fix is applied
- THEN validation error messages display identically
- AND validation timing unchanged

## Acceptance Criteria

The following criteria MUST be met to close the 25 failing E2E tests:

### Wizard Flow Tests (nutritionist-wizard.spec.ts)
- ✅ Complete 6-step wizard flow test passes
- ✅ Profile modification flow test (Step 1 → Step 2 → Step 1) passes
- ✅ Modification + undo in review step test passes
- ✅ Progress bar updates correctly through steps test passes

### Profile Management Tests (profile-management.spec.ts)
- ✅ Create profile with valid data test passes
- ✅ Update existing profile test passes
- ✅ Validates required numeric fields test passes
- ✅ Validates numeric values are positive test passes
- ✅ Allergies and forbidden foods via advanced options test passes
- ✅ Clear allergies and forbidden foods test passes
- ✅ Activity level selection with all options test passes
- ✅ Profile persists after page reload test passes

### Technical Implementation Criteria
- ✅ All 7 Select fields in `components/profile/profile-form.tsx` have unique `id` attributes on SelectTrigger
- ✅ All 7 corresponding FormLabel elements have matching `htmlFor` attributes
- ✅ No visual regression in profile form rendering
- ✅ No functional regression in Select component behavior
- ✅ Playwright's `page.getByLabel()` successfully locates all 7 Select fields
- ✅ Wizard page at `/meal-plans/new` exists and renders
- ✅ Wizard uses all 5 existing chat components (ProfileReviewCard, ProfileModificationForm, PreferencesForm, GenerationLoading, PlanReview)
- ✅ Wizard implements 6-step state machine (PROFILE_REVIEW → PROFILE_MODIFICATION → PREFERENCES_COLLECTION → GENERATION → REVIEW_MODIFICATION → CONFIRMATION)
