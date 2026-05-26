# Proposal: Meal Ingredient Detail & Expand/Collapse

## Intent

The meal plan view shows all meal data inline (name, description, macros) with no expand/collapse — cluttered and hard to scan. Users want compact meal cards (type + name) that expand to reveal full detail including per-ingredient breakdown with gram amounts. The AI generation prompt lacks ingredient-level detail, forcing the shopping-list generator to use heuristics or a second AI call.

## Scope

### In Scope
- Add `ingredients: Json` + `instructions: String?` to Prisma `Meal` model
- Update AI prompt to request `ingredients: [{name, quantity, unit}]` per meal
- Update `mealItemSchema` zod validation for new fields
- Refactor `MealPlanView`: meal cards default-collapsed (mealType + name only), expanded shows description, macros bar, ingredient table with name/quantity/unit
- Delete existing meal plans and seed an example plan with the new format
- Store ingredient data so shopping-list generation reads from it directly

### Out of Scope
- Recipe database or food composition table integration
- Ingredient costing beyond what `economic-meals.ts` already provides
- Meal editing UI (modifying ingredients after generation)
- Re-generating existing plans — users start fresh

## Approach

1. **Schema**: Add `ingredients` (Json[]) and `instructions` (String?) to `Meal` model via migration. `ingredients` stores `{name: string, quantity?: number, unit?: string}[]`.
2. **AI prompt**: Extend `DIET_GENERATION_SYSTEM` to request `ingredients` and `instructions` per meal. Update validation schema.
3. **UI**: Wrap meal cards in `Collapsible` (shadcn/ui). Collapsed state: mealType label + dish name. Expanded state: description, macros bar, ingredient table (name / quantity / unit).
4. **Data cleanup**: Delete all Meal records from DB. Seed one example weekly plan manually with ingredient data.
5. **Shopping list**: Simplify `generateFromMealPlan` to read `meal.ingredients` directly instead of parsing meal names.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modified | Add `ingredients` + `instructions` fields to `Meal` |
| `lib/openai.ts` | Modified | Extend prompt, schema, and response parsing |
| `lib/schemas.ts` | Modified | Add `ingredients` + `instructions` to `mealItemSchema` |
| `components/meal-plans/meal-plan-view.tsx` | Modified | Collapsible cards with ingredient detail table |
| `actions/shopping-list.ts` | Modified | Read ingredients from stored meal data |
| `lib/meal-plan-json.ts` | Modified | Handle new fields in transform/parse paths |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| AI prompt change increases token usage (~175 extra objects for 35 meals) | Medium | `ingredients` objects are small text; monitor costs with gpt-4o-mini |
| Existing queries unaware of new fields | Low | Fields are optional; Prisma queries unaffected |
| Seed data migration may leave stale references | Low | Delete all plans explicitly before seeding |

## Rollback Plan

1. Drop `ingredients` and `instructions` columns from `Meal`
2. Revert AI prompt to current version
3. Revert `MealPlanView` to inline display
4. Re-seed plans in old format

## Dependencies

- None (self-contained change)

## Success Criteria

- [ ] Meal cards show mealType + name collapsed; click reveals full detail
- [ ] Expanded view includes ingredient list with name, quantity, and unit
- [ ] AI generates plans with `ingredients` array per meal
- [ ] Shopping list reads ingredients from `Meal.ingredients` without extra AI call
- [ ] Example seed plan renders correctly with new format
