# Proposal: Fix JSON Syntax Error in es.json

## Intent

The file `messages/es.json` has a JSON syntax error that breaks the Next.js build. The closing brace `}` for the `"MealLog"` section is misplaced on line 220, leaving 8 keys (lines 221-228) outside the object and creating an orphan closing brace on line 229. This causes a parse error: "Unexpected non-whitespace character after JSON at position 7995".

## Scope

### In Scope
- Fix JSON structure in `messages/es.json` — move `MealLog` closing brace after line 228
- Remove orphan `},` on line 229

### Out of Scope
- No changes to translation content or keys
- No changes to other locale files
- No code changes

## Approach

Restructure the `MealLog` section so all 8 keys (`generateAndManage`, `generatingMealPlan`, `queuedForProcessing`, `aiCreatingPlan`, `starting`, `draftStatusNote`, `confirmPlan`, `generateNewPlan`) are inside the `MealLog` object where they belong. This is a purely structural fix — no content changes.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `messages/es.json` | Modified | Move `MealLog` closing `}` from line 220 to after line 228; remove orphan `},` on line 229 |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| JSON still invalid after fix | Low | Validate with `node -e "JSON.parse(require('fs').readFileSync('messages/es.json','utf8'))"` |
| Keys belong to a different section | Low | Keys are semantically related to MealLog (meal plan generation) |

## Rollback Plan

Revert the single commit with `git revert HEAD`. The change affects only one file with a structural correction.

## Dependencies

- None

## Success Criteria

- [ ] `messages/es.json` parses as valid JSON
- [ ] Next.js build succeeds without JSON parse errors
- [ ] All 8 keys remain accessible under `MealLog` namespace in the app
