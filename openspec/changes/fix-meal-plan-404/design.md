# Design: Fix Meal Plan 404

## Technical Approach

Create a single Server Component at `app/(dashboard)/meal-plans/[id]/page.tsx` that authenticates the user, fetches the meal plan by ID with an ownership check, and renders the existing `MealPlanView` component. Follows the established pattern from `/planes/page.tsx`: `auth()` → `redirect` if unauthenticated → Prisma query with `userId` filter → `notFound()` if missing → render.

## Architecture Decisions

### Decision: Server Component with direct Prisma query

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Server Component + direct Prisma | No extra API hop, auth at edge, follows `/planes/page.tsx` pattern | ✅ Chosen |
| Client Component + `fetch` to `/api/meal-plans/[id]` | Avoids serialization but adds a round-trip and needs a new API endpoint | ❌ Rejected — unnecessary indirection for a read-only page |
| Server Component + server action | Could use `use server` action, but page is read-only — no mutation needed | ❌ Rejected — server actions are for mutations (project convention) |

**Rationale**: The `/planes/page.tsx` page already uses this exact pattern: Server Component, `auth()`, Prisma direct. The page is read-only — just fetch and render. A client fetch would require a new API endpoint we don't need.

### Decision: Authz via Prisma `where` clause (not separate check)

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `findUnique({ where: { id, userId } })` | Single query, returns `null` if plan doesn't exist OR user doesn't own it. Clean. | ✅ Chosen |
| `findUnique → check userId separately` | Two-step logic, leaks information (distinguishes "not found" from "not yours") | ❌ Rejected — IDOR protection should not differ between "doesn't exist" and "not yours" |

**Rationale**: Using `userId` in the `where` clause prevents IDOR and ensures both "not found" and "not yours" return 404 identically. Same approach used in the `/api/meal-plans/[id]/confirm` route (lines 23-34).

### Decision: `notFound()` for missing plans (not `redirect`)

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `notFound()` from `next/navigation` | Renders the nearest `not-found.tsx` or default 404. Semantic. | ✅ Chosen |
| `redirect("/planes")` with toast | Would need a client component and toast infrastructure | ❌ Rejected — no toast system exists |

**Rationale**: `notFound()` is the idiomatic Next.js App Router way to handle missing resources. No `not-found.tsx` exists yet — the default Next.js 404 page will render, which is acceptable for this small change.

## Data Flow

```
Browser: /meal-plans/{id}
    │
    ▼
Middleware: auth check → pass (route starts with /meal-plans)
    │
    ▼
Layout: auth() → redirect if unauthenticated (already handles this)
    │
    ▼
Page Server Component:
    │ auth() → session.userId
    │ prisma.mealPlan.findUnique({
    │   where: { id, userId },
    │   include: { meals: { orderBy: [{ dayOfWeek: asc }, { mealType: asc }] } }
    │ })
    │─ null → notFound()
    │─ plan → <MealPlanView plan={serializedPlan} />
    ▼
MealPlanView (presentational, receives MealPlanData)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `app/(dashboard)/meal-plans/[id]/page.tsx` | Create | Server Component: auth, fetch plan by ID with ownership, render MealPlanView or notFound() |

No existing files are modified.

## Interfaces / Contracts

### Page params (Next.js 15+)

```typescript
interface PageProps {
  params: Promise<{ id: string }>;
}
```

Next.js 15+ uses `Promise<{ id: string }>` for params — must `await params` in the component body. The existing `/api/meal-plans/[id]/confirm/route.ts` already follows this pattern (line 13).

### Prisma query result → MealPlanData mapping

The `MealPlanView` component accepts `MealPlanData`:

```typescript
interface MealPlanData {
  id: string;
  startDate: Date | string;
  endDate: Date | string;
  status: "draft" | "active" | "completed";
  totalCalories: number | null;
  meals: MealData[];
}
```

Prisma returns `MealPlan` with `meals: Meal[]` where each `Meal` has all `MealData` fields (`id`, `dayOfWeek`, `mealType`, `name`, `description`, `calories`, `protein`, `carbs`, `fat`). The Prisma result is directly compatible with `MealPlanData` — dates are `Date` objects, which `MealPlanView` already accepts via the `Date | string` union type. No manual mapping needed; the Prisma result can be passed directly as a prop after adding `orderBy: [{ dayOfWeek: "asc" }, { mealType: "asc" }]` to the include.

### Full type for the page

```typescript
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { MealPlanView } from "@/components/meal-plans/meal-plan-view";

export default async function MealPlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.userId) redirect("/login");

  const { id } = await params;

  const plan = await prisma.mealPlan.findUnique({
    where: { id, userId: session.userId },
    include: { meals: { orderBy: [{ dayOfWeek: "asc" }, { mealType: "asc" }] } },
  });

  if (!plan) notFound();

  return <MealPlanView plan={plan} />;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `notFound()` called for missing/unowned plan | Integration test with mocked Prisma — verify redirect to 404 |
| Integration | Auth guard (unauthenticated → redirect to /login) | Test with no session, verify redirect |
| E2E | Click "Ver plan completo" → plan detail loads | Playwright: navigate from `/planes`, click link, verify MealPlanView renders |

See proposal success criteria for full acceptance checklist.

## Migration / Rollout

No migration required. The route is purely additive — no existing files change. Rollback is deleting the single new file.

## Open Questions

None. The scope is minimal and all patterns are established in the codebase.