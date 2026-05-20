# User Profile Specification

## Purpose

Define the user profile data model, validation schemas, form handling, and persistence requirements for the dietista application. This spec covers the Profile entity and associated ConversationState for meal plan generation workflows.

## Requirements

### Requirement: Profile Schema Exports

The system MUST export all validation schemas required by the profile form and server actions from `lib/schemas.ts`.

#### Scenario: Schema availability for profile creation

- GIVEN a developer imports from `lib/schemas.ts`
- WHEN they need to validate profile data
- THEN `UserProfileSchema` MUST be available for import
- AND `NutritionistPreferencesSchema` MUST be available if nutritionist features are used
- AND `nutritionistChatStateSchema` MUST be available if chat state validation is needed

#### Scenario: Type inference from schemas

- GIVEN a schema is exported from `lib/schemas.ts`
- WHEN TypeScript infers types using `z.infer<typeof SchemaName>`
- THEN the inferred type MUST match the Prisma Profile model fields
- AND all required fields MUST be marked as required in the type

### Requirement: Profile Data Persistence

The system MUST persist all Profile fields defined in the Prisma schema when a user creates or updates their profile.

#### Scenario: Create profile with all fields

- GIVEN a logged-in user without an existing profile
- WHEN they submit the profile form with all required and optional fields
- THEN the system MUST create a Profile record with all 23 fields populated
- AND all migration-added fields (dietType, cookingTimeAvailable, etc.) MUST NOT be NULL if provided
- AND the user MUST be redirected to dashboard

#### Scenario: Update existing profile

- GIVEN a user with an existing profile
- WHEN they update any subset of profile fields
- THEN the system MUST update only the provided fields
- AND preserve existing values for fields not included in the update
- AND revalidate dashboard and profile cache paths

#### Scenario: Profile field validation

- GIVEN a user submits profile data
- WHEN the data is validated against `profileSchema`
- THEN weight, height, age MUST be positive numbers
- AND sex, goal, activityLevel MUST be valid enum values
- AND optional fields (targetCalories, targetProtein, etc.) MAY be null or undefined
- AND invalid data MUST return a descriptive error message

### Requirement: Profile Form Completeness

The system MUST provide form inputs for all user-modifiable Profile fields to prevent silent data loss.

#### Scenario: Required fields always visible

- GIVEN a user accesses the profile form
- THEN weight, height, age, sex, goal, activityLevel MUST be visible and required
- AND validation errors MUST display inline for each field

#### Scenario: Optional fields accessible

- GIVEN a user wants to configure advanced profile settings
- WHEN they expand the advanced options section
- THEN ALL migration-added fields MUST be available for input:
  - dietType (enum selector)
  - cookingTimeAvailable (number input)
  - eatingOutFrequency (enum selector)
  - includeSnacks (checkbox)
  - mealComplexity (enum selector)
  - mealsPerDay (number input)
  - varietyPreference (enum selector)
  - budgetFriendly (checkbox)
  - weeklyBudget (number input)
  - trainingRoutine (text input)
  - favoriteFoods (comma-separated text input)
- AND fields MUST persist values on save

#### Scenario: Array field handling

- GIVEN allergies, forbiddenFoods, or favoriteFoods fields
- WHEN the user enters comma-separated values
- THEN the system MUST convert to string arrays before saving
- AND display existing arrays as comma-separated strings on form load

### Requirement: Dashboard Build Compatibility

The system MUST compile without TypeScript errors on all dashboard pages.

#### Scenario: Dashboard page type inference

- GIVEN the dashboard page at `app/(dashboard)/dashboard/page.tsx`
- WHEN TypeScript compiles the file
- THEN the return type MUST be inferred correctly from the JSX
- AND explicit `Promise<JSX.Element>` return type annotations MUST be removed or corrected
- AND the build MUST succeed with zero errors

### Requirement: Error Handling and Logging

The system MUST provide clear error feedback and logging for profile operations.

#### Scenario: Profile creation failure

- GIVEN a profile creation attempt fails
- WHEN the error occurs in `createProfile` action
- THEN the error MUST be logged with context (userId, validation errors)
- AND the user MUST see a user-friendly error message in an Alert component
- AND the form MUST remain populated for retry

#### Scenario: Profile update failure

- GIVEN a profile update attempt fails
- WHEN the error occurs in `updateProfile` action
- THEN the error MUST be logged with context (userId, field that failed)
- AND unsaved changes MUST NOT be lost
- AND the user MUST be informed of the specific validation error

#### Scenario: Unauthorized access

- GIVEN an unauthenticated user attempts profile operations
- WHEN they call `createProfile`, `updateProfile`, or `deleteProfile`
- THEN the action MUST return `{ success: false, error: "You must be logged in..." }`
- AND redirect to login if called from a protected route

### Requirement: Profile-Dependent Features

The system MUST ensure profile data is complete before allowing meal plan generation.

#### Scenario: Meal plan generation prerequisite

- GIVEN a user attempts to generate a meal plan
- WHEN the system checks for profile existence
- THEN if no profile exists, the user MUST be prompted to complete their profile first
- AND if profile exists but has NULL values in required fields, the user MUST be warned
- AND the profile data MUST be passed to the meal plan generation service

#### Scenario: Profile data availability

- GIVEN a meal plan generation request
- WHEN the system retrieves the user's profile
- THEN ALL non-null profile fields MUST be available to the generation algorithm
- AND dietType, activityLevel, goal MUST influence meal selection
- AND allergies, forbiddenFoods MUST exclude matching ingredients

## Test Requirements

### Unit Tests

The system MUST have unit tests for:
- Schema validation (valid and invalid inputs)
- Profile action functions (create, update, delete)
- Form helper functions (arrayToString, stringToArray)

### Integration Tests

The system MUST have integration tests for:
- Full profile creation → database persistence → retrieval flow
- Profile update with partial field updates
- Profile → meal plan generation end-to-end flow

### Test Coverage

- Happy path: Profile creation with all fields
- Edge case: Profile update with only required fields
- Error case: Profile creation with invalid data
- Error case: Duplicate profile creation attempt
- Edge case: Empty array fields (allergies, forbiddenFoods)
