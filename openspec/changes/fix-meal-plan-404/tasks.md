# Tasks: Fix Meal Plan 404

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~60-80 lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | N/A |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: N/A
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Create meal-plan-detail route with auth, Prisma fetch, and MealPlanView rendering | PR 1 | Single file, includes E2E test |

## Phase 1: Foundation

- [x] 1.1 Create `app/(dashboard)/meal-plans/[id]/page.tsx` with Server Component structure
- [x] 1.2 Add TypeScript types: `interface PageProps { params: Promise<{ id: string }> }`
- [x] 1.3 Import dependencies: `auth`, `prisma`, `notFound`, `redirect`, `MealPlanView`

## Phase 2: Core Implementation

- [x] 2.1 Implement auth guard: `const session = await auth(); if (!session?.userId) redirect("/login")`
- [x] 2.2 Extract route param: `const { id } = await params`
- [x] 2.3 Add Prisma query: `findUnique({ where: { id, userId: session.userId }, include: { meals: { orderBy: [{ dayOfWeek: "asc" }, { mealType: "asc" }] } } })`
- [x] 2.4 Add 404 handling: `if (!plan) notFound()`
- [x] 2.5 Render component: `return <MealPlanView plan={plan} />`

## Phase 3: Testing

- [x] 3.1 E2E: Navigate to `/planes`, click "Ver plan completo", verify detail page loads with correct plan data
- [x] 3.2 E2E: Access non-existent plan ID, verify 404 page renders
- [x] 3.3 E2E: Access another user's plan ID (if test data exists), verify 404 page renders
- [x] 3.4 TypeScript: Run `tsc --noEmit`, verify zero errors and no `any` usage

## Phase 4: Verification

- [ ] 4.1 Manual test: Create new meal plan, verify "Ver plan completo" link works end-to-end
- [ ] 4.2 Verify auth middleware protects route (unauthenticated → redirect to login)
- [ ] 4.3 Confirm no existing files were modified (single-file change)
