# Proposal: Fix Meal Plan 404 Error

## Intent

Users clicking "Ver plan completo" on `/planes` are redirected to `/meal-plans/{planId}` which returns 404 because the route handler doesn't exist. This blocks users from viewing individual meal plans.

## Scope

### In Scope
- Create `/app/(dashboard)/meal-plans/[id]/page.tsx` route handler
- Fetch specific meal plan by ID from database
- Render existing `MealPlanView` component with fetched data
- Handle 404 case when plan doesn't exist or user lacks permission

### Out of Scope
- Modifying existing `/meal-plans/page.tsx` (active plan only view)
- Changes to `MealPlanView` component
- API endpoint modifications

## Capabilities

### New Capabilities
- `meal-plan-detail`: View individual meal plan by ID with authz check

### Modified Capabilities
- None

## Approach

1. Create Server Component at `/app/(dashboard)/meal-plans/[id]/page.tsx`
2. Use `params.id` to fetch plan via Prisma with auth check (same pattern as `/planes/page.tsx`)
3. Pass fetched plan to existing `MealPlanView` component
4. Add proper error handling for missing/unauthorized plans

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `app/(dashboard)/meal-plans/[id]/page.tsx` | New | Server Component for individual plan view |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Authz bypass (viewing other users' plans) | Low | Include `userId` filter in Prisma query |
| Missing plan returns confusing error | Low | Explicit 404 handling with user-friendly message |

## Rollback Plan

Delete the new file: `rm app/(dashboard)/meal-plans/[id]/page.tsx`. No existing files are modified.

## Dependencies

- None (uses existing Prisma schema and `MealPlanView` component)

## Success Criteria

- [ ] Clicking "Ver plan completo" on `/planes` loads the specific plan without 404
- [ ] Plan data matches what's shown on `/planes` for active plan
- [ ] Past plans (from `/planes` list) are viewable by ID
- [ ] Attempting to view another user's plan returns 404 or redirect
- [ ] Non-existent plan ID shows appropriate error message
