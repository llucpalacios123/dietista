# Proposal: Fix User Data Persistence & Meal Plan Generation

## Intent

Fix blocking issues preventing users from completing profile setup and generating meal plans:
1. Missing schema type exports causing TypeScript/runtime failures
2. Schema/form mismatch with recent migration fields not being saved
3. Build error in dashboard page preventing app from running

## Scope

### In Scope
- Add missing schema exports to `lib/schemas.ts`
- Update profile form to handle or remove unused migration fields
- Fix dashboard page TypeScript error
- Add error handling/logging to profile actions
- Add tests for profile creation/update flows

### Out of Scope
- Redesigning meal plan generation algorithm
- Adding new profile fields beyond what migration added
- UI/UX redesign of profile form

## Capabilities

### New Capabilities
- None (bug fixes only, no new capabilities)

### Modified Capabilities
- `user-profile`: Fix data persistence to ensure all profile fields are saved and available for meal plan generation

## Approach

1. **Fix Schema Exports**: Add `UserProfileSchema`, `NutritionistPreferencesSchema`, `nutritionistChatStateSchema` exports to `lib/schemas.ts` (or remove imports if unused)
2. **Fix Form/Schema Mismatch**: Either:
   - Option A: Add form fields for 12 new migration fields (dietType, cookingTimeAvailable, etc.)
   - Option B: Remove unused fields from migration (simpler, faster)
3. **Fix Build Error**: Remove explicit `Promise<JSX.Element>` return type from dashboard page
4. **Add Error Handling**: Wrap profile actions with try/catch, log errors
5. **Add Tests**: Unit tests for profile actions, integration test for profile → meal plan flow

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `lib/schemas.ts` | Modified | Add missing schema exports |
| `components/profile/profile-form.tsx` | Modified | Add fields or remove unused migration fields |
| `actions/profile.ts` | Modified | Save all profile fields, add error logging |
| `app/(dashboard)/dashboard/page.tsx` | Modified | Fix TypeScript return type |
| `tests/profile.test.ts` | New | Add profile action tests |
| `tests/meal-plan-integration.test.ts` | New | Add integration test |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Breaking existing profile data | Low | Migration only adds nullable fields, backward compatible |
| Form becomes too complex with 12 new fields | Medium | Use Option B (remove unused fields) or progressive disclosure |
| Tests require database setup | Medium | Use testcontainers-pg as per project conventions |

## Rollback Plan

1. Revert git commit: `git revert HEAD`
2. If migration already applied, create rollback migration to drop new columns:
   ```sql
   ALTER TABLE "Profile" DROP COLUMN IF EXISTS "dietType", ...
   ```
3. Restore from backup if data corruption occurred (unlikely - only schema changes)

## Dependencies

- None (pure bug fixes, no external dependencies)

## Success Criteria

- [ ] TypeScript compilation succeeds with no errors
- [ ] Profile form saves all fields and data persists to database
- [ ] Meal plan generation receives required profile data
- [ ] Dashboard page builds and renders without errors
- [ ] Tests pass: profile creation, update, and integration test
- [ ] User can complete full flow: register → profile → meal plan generation
