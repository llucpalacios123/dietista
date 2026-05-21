# Meal Plan Detail Specification

## Purpose

Defines the behavior for viewing individual meal plans by ID through the `/meal-plans/[id]` route. This capability enables users to view any meal plan they own (current, past, or draft) via a direct URL.

## Requirements

### Requirement: Route Existence

The system MUST expose a Server Component route at `/meal-plans/[id]` where `[id]` is a dynamic route parameter accepting meal plan identifiers.

#### Scenario: Valid route structure

- GIVEN the application is running
- WHEN a user navigates to `/meal-plans/{planId}` where `{planId}` is a valid CUID
- THEN the Next.js App Router MUST match the route to `/app/(dashboard)/meal-plans/[id]/page.tsx`

### Requirement: Plan Fetching by ID

The system MUST fetch the meal plan from the database using Prisma, filtering by both plan ID and the authenticated user's ID.

#### Scenario: Successful plan retrieval

- GIVEN an authenticated user with ID `user-123`
- WHEN the user accesses `/meal-plans/plan-456` where `plan-456` exists and belongs to `user-123`
- THEN the system MUST execute a Prisma query: `prisma.mealPlan.findUnique({ where: { id: planId, userId: user-123 }, include: { meals: true } })`
- AND MUST return the plan with all associated meals

#### Scenario: Plan belongs to different user (authorization failure)

- GIVEN an authenticated user with ID `user-123`
- WHEN the user accesses `/meal-plans/plan-789` where `plan-789` exists but belongs to `user-999`
- THEN the Prisma query MUST return `null` (due to `userId` filter)
- AND the system MUST render a 404 response

#### Scenario: Non-existent plan ID

- GIVEN an authenticated user
- WHEN the user accesses `/meal-plans/nonexistent-id` which does not exist in the database
- THEN the Prisma query MUST return `null`
- AND the system MUST render a 404 response with a user-friendly message

### Requirement: Rendering with MealPlanView Component

The system MUST render the fetched meal plan using the existing `MealPlanView` component, passing the plan data as a prop.

#### Scenario: Plan renders successfully

- GIVEN a valid meal plan with ID `plan-456` belonging to the authenticated user
- WHEN the page loads
- THEN the system MUST pass the plan object to `<MealPlanView plan={plan} />`
- AND the component MUST display weekly totals, daily breakdowns, and individual meals

### Requirement: Auth Protection

The system MUST protect the `/meal-plans/[id]` route via the existing dashboard auth middleware, requiring authentication before access.

#### Scenario: Unauthenticated user access

- GIVEN a user without an active session
- WHEN the user attempts to access `/meal-plans/{planId}`
- THEN the middleware MUST redirect to `/login?callbackUrl=/meal-plans/{planId}`

#### Scenario: Authenticated user access

- GIVEN a user with a valid session
- WHEN the user accesses `/meal-plans/{planId}`
- THEN the middleware MUST allow the request to proceed to the page component

### Requirement: Type Safety

The system MUST use TypeScript with explicit types for all exports, props, and function signatures. No `any` type is permitted.

#### Scenario: Component type compliance

- GIVEN the page component at `/meal-plans/[id]/page.tsx`
- WHEN the code is type-checked via `tsc --noEmit`
- THEN there MUST be zero TypeScript errors
- AND all function signatures MUST have explicit return types
- AND no usage of `any` type is permitted

## Coverage Summary

| Requirement | Type | Scenarios |
|-------------|------|-----------|
| Route Existence | New | 1 |
| Plan Fetching by ID | New | 3 (1 happy, 2 edge) |
| Rendering with MealPlanView | New | 1 |
| Auth Protection | New | 2 (1 happy, 1 edge) |
| Type Safety | New | 1 |

**Total**: 5 requirements, 8 scenarios
