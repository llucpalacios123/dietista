# Nutritionist Wizard Specification

## Purpose

Defines the 6-step wizard flow for creating meal plans via `/meal-plans/new` page. The wizard orchestrates profile review, modification, preferences collection, plan generation, review, and confirmation.

## Requirements

### Requirement: Wizard Page Routing and Mounting

The system MUST provide a wizard page at `/meal-plans/new` that serves as the entry point for meal plan creation.

#### Scenario: Page loads with title visible

- GIVEN user is authenticated
- WHEN user navigates to `/meal-plans/new`
- THEN page displays title containing "nuevo plan" or "new meal plan"
- AND progress bar showing "Paso 1" or "Step 1" is visible

#### Scenario: Page requires authentication

- GIVEN user is not authenticated
- WHEN user navigates to `/meal-plans/new`
- THEN user is redirected to login page

### Requirement: Step 1 - Profile Review

The system MUST display the user's current profile data for review before proceeding.

#### Scenario: Profile data displays correctly

- GIVEN user has an existing profile
- WHEN wizard loads Step 1
- THEN section with "tu perfil actual" or "your profile" is visible
- AND profile fields (weight, height, age) show correct values from database

#### Scenario: User confirms profile and continues

- GIVEN user is on Step 1
- WHEN user clicks "Todo correcto" / "All correct" / "Continuar" button
- THEN wizard advances to Step 3 (Preferences Collection)
- AND Step 2 (Profile Modification) is skipped

#### Scenario: User requests profile modification

- GIVEN user is on Step 1
- WHEN user clicks "Editar" button on any profile field
- THEN wizard advances to Step 2 (Profile Modification)

### Requirement: Step 2 - Profile Modification

The system MUST allow users to edit profile fields before continuing to preferences.

#### Scenario: Modification form displays

- GIVEN user entered Step 2 from Step 1
- WHEN modification step loads
- THEN section with "modificar" or "modify" text is visible
- AND profile modification form is rendered with current values pre-filled

#### Scenario: User saves profile changes

- GIVEN user modified profile fields (e.g., weight changed to 75)
- WHEN user clicks "Guardar cambios" / "Save changes" button
- THEN profile is updated in database
- AND wizard advances to Step 3 (Preferences Collection)

### Requirement: Step 3 - Preferences Collection

The system MUST collect food preferences and dietary constraints before generating meal plan.

#### Scenario: Preferences form displays

- GIVEN user completed Step 1 or Step 2
- WHEN Step 3 loads
- THEN section with "preferencias" or "preferences" is visible
- AND preferences form is rendered

#### Scenario: User fills allergies

- GIVEN user is on Step 3
- WHEN user enters "peanuts" in allergy input with placeholder containing "maní"
- AND clicks "Agregar" / "Add" button
- THEN allergy is added to preferences state

#### Scenario: User selects diet type

- GIVEN user is on Step 3
- WHEN user clicks diet type combobox
- AND selects "Omnívoro" / "Omnivore" option
- THEN diet type is set in preferences state

#### Scenario: User selects budget friendly option

- GIVEN user is on Step 3
- WHEN user clicks budget friendly combobox
- AND selects "Sí" / "Yes" / "true" option
- THEN budgetFriendly is set to true in preferences state

#### Scenario: User selects meal complexity

- GIVEN user is on Step 3
- WHEN user clicks complexity combobox
- AND selects "Simple" option
- THEN mealComplexity is set in preferences state

#### Scenario: User selects meals per day

- GIVEN user is on Step 3
- WHEN user clicks meals per day combobox
- AND selects "4" option
- THEN mealsPerDay is set to 4 in preferences state

#### Scenario: User submits preferences

- GIVEN user filled required preferences
- WHEN user clicks "Continuar" button
- THEN wizard advances to Step 4 (Generation)

### Requirement: Step 4 - Generation Loading

The system MUST display loading state while meal plan is being generated via AI.

#### Scenario: Loading state displays

- GIVEN user submitted preferences from Step 3
- WHEN Step 4 loads
- THEN text containing "creando" or "creating" is visible
- AND loading indicator is shown

#### Scenario: Generation completes successfully

- GIVEN generation is in progress
- WHEN OpenAI API call completes (within 120 seconds)
- THEN wizard advances to Step 5 (Review & Modification)
- AND text containing "revisá" or "review" is visible

### Requirement: Step 5 - Review & Modification

The system MUST display generated meal plan with weekly totals and allow modifications.

#### Scenario: Weekly totals display

- GIVEN meal plan generated successfully
- WHEN Step 5 loads
- THEN text containing "calorías" or "calories" is visible
- AND weekly nutritional totals are displayed

#### Scenario: Day cards display

- GIVEN meal plan generated successfully
- WHEN Step 5 loads
- THEN day cards for each day of week are visible
- AND at least "Lunes" / "Monday" card is present

#### Scenario: User confirms plan

- GIVEN user is reviewing generated plan
- WHEN user clicks "Confirmar plan" / "Confirm plan" button
- THEN wizard advances to Step 6 (Confirmation)

#### Scenario: User modifies a meal

- GIVEN user is on Step 5
- WHEN user hovers over a meal card
- AND clicks "Modificar" button
- THEN dialog with "por qué" / "why" text appears
- AND user can select reason like "No me gusta" / "Don't like"

#### Scenario: Modification counter updates

- GIVEN user made modifications to meals
- WHEN modifications are applied
- THEN modification counter shows updated count (e.g., "1 modificación")

### Requirement: Step 6 - Confirmation

The system MUST display confirmation with JSON preview after plan is confirmed.

#### Scenario: Confirmation message displays

- GIVEN user confirmed plan in Step 5
- WHEN Step 6 loads
- THEN text containing "plan confirmado" or "confirmed" is visible within 10 seconds

#### Scenario: JSON preview displays

- GIVEN confirmation step loaded
- WHEN Step 6 renders
- THEN JSON preview containing "userProfile" text is visible

### Requirement: Progress Bar State Machine

The system MUST track and display current step in 6-step progression.

#### Scenario: Progress bar shows correct step

- GIVEN user is on Step 1
- WHEN page renders
- THEN progress bar shows "Paso 1 de 6" or "Step 1 of 6"

#### Scenario: Progress updates after skipping Step 2

- GIVEN user confirmed profile on Step 1
- WHEN user advances to preferences
- THEN progress bar shows "Paso 3 de 6" or "Step 3 of 6"

#### Scenario: Progress updates through generation

- GIVEN user submitted preferences
- WHEN generation starts
- THEN progress bar shows Step 4 state
- AND "creando" or "creating" text is visible

### Requirement: Component Integration

The system MUST use existing components from `components/chat/` directory.

#### Scenario: ProfileReviewCard used in Step 1

- GIVEN wizard is on Step 1
- WHEN step renders
- THEN ProfileReviewCard component displays profile data

#### Scenario: ProfileModificationForm used in Step 2

- GIVEN wizard is on Step 2
- WHEN step renders
- THEN ProfileModificationForm component is displayed

#### Scenario: PreferencesForm used in Step 3

- GIVEN wizard is on Step 3
- WHEN step renders
- THEN PreferencesForm component is displayed

#### Scenario: GenerationLoading used in Step 4

- GIVEN wizard is on Step 4
- WHEN step renders
- THEN GenerationLoading component displays loading state

#### Scenario: PlanReview used in Step 5

- GIVEN wizard is on Step 5
- WHEN step renders
- THEN PlanReview component displays meal plan

### Requirement: Error and Loading States

The system MUST handle errors and loading states gracefully throughout wizard flow.

#### Scenario: Profile fetch error

- GIVEN user has no profile or fetch fails
- WHEN wizard mounts
- THEN error state is displayed
- AND user can retry or navigate to profile page

#### Scenario: Generation timeout

- GIVEN generation takes longer than 120 seconds
- WHEN timeout occurs
- THEN error message is displayed
- AND user can retry generation

### Requirement: Post-Confirmation Navigation

The system MUST navigate user after plan confirmation.

#### Scenario: Navigation after confirmation

- GIVEN user confirmed meal plan in Step 6
- WHEN confirmation completes
- THEN user is navigated to meal plan detail page or dashboard
- AND newly created plan is accessible
