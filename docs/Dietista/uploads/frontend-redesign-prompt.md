# Frontend Redesign Prompt — Dietista

## Context

You are redesigning the frontend for **Dietista**, a nutritionist AI-powered meal planning application built with Next.js 15 (App Router), React 19, TypeScript (strict), Prisma 6, PostgreSQL, NextAuth v5, OpenAI (gpt-4o-mini), and shadcn/ui + Tailwind CSS 3.4.

The app currently has functional but minimal UI pages. We need a **modern, polished, mobile-first redesign** with new pages for macro tracking, weekly diaries, objectives, and data visualization charts.

---

## Current Data Models (Prisma)

### User & Profile

```
User: id, email, passwordHash
Profile: userId (1:1), weight, height, age, sex (male/female/other),
         goal (lose/maintain/gain), activityLevel (sedentary/light/moderate/active/veryActive),
         targetCalories, targetProtein, targetCarbs, targetFat,
         allergies[], forbiddenFoods[], dietType (omnivore/vegetarian/vegan/pescatarian),
         cookingTimeAvailable, eatingOutFrequency (never/rarely/sometimes/often),
         includeSnacks, mealComplexity (simple/moderate/advanced),
         mealsPerDay, varietyPreference (low/medium/high), budgetFriendly,
         weeklyBudget, trainingRoutine, favoriteFoods[]
```

### MealPlan & Meal

```
MealPlan: userId, templateId?, startDate, endDate,
          status (draft/active/completed), totalCalories
Meal: mealPlanId, dayOfWeek (0=Mon..6=Sun), mealType (breakfast/mid_morning/lunch/dinner/snack),
      name, description, calories, protein, carbs, fat, selectedOptions (Json)
```

### MealLog (logged food entries)

```
MealLog: userId, date, mealType, rawInput (free text),
         interpretedFoods (Json: [{foodName, quantity, unit, calories, protein, carbs, fat, confidence}]),
         totalCalories
```

### Other models

```
ConversationState: userId, currentStep, profileData, preferences, generatedPlan, modifications, validatedJson
Food: name, category (carbohydrates/protein/fat/other), unit, calories/protein/carbs/fat per 100g, brand
MealPlanTemplate: name, description, objective, guidelines[]
MealTemplate, MealTemplateGroup, FoodOption — seed data for structured meal options
```

---

## Current Pages (For Reference)

| Route | Current State |
|-------|---------------|
| `/` | Redirects to dashboard |
| `/(auth)/login` | Basic card form |
| `/(auth)/register` | Basic card form |
| `/(dashboard)/dashboard` | Simple greeting, profile status, active plan card |
| `/(dashboard)/profile` | Long form (required + collapsible advanced fields), uses `useActionState` |
| `/(dashboard)/meal-plans` | List with generate button, polls async job |
| `/(dashboard)/meal-plans/new` | 6-step wizard (profile review → modification → preferences → loading → plan review → confirmation) |
| `/(dashboard)/meal-logs` | Form + list side-by-side |

**Current layout**: Simple top nav bar with links (Dashboard, Profile, Meal Plans, Meal Logs, Logout). No sidebar, no mobile hamburger, no dark mode toggle.

---

## Redesign Requirements

### Design Language

- **Modern, clean, minimal** — think Cronometer, MyFitnessPal, MacroFactor aesthetics
- **Mobile-first responsive** — bottom navigation on mobile, sidebar on desktop
- **Dark mode** — CSS variables are already in `globals.css` (`.dark` class), just need a toggle
- **Language**: Spanish (Rioplatense) for all UI copy
- **Accent color**: Green (already set as primary in Tailwind config)
- **Typography**: Inter (already configured)
- **Animations**: Subtle, purposeful (page transitions, skeleton loading, micro-interactions on macro circles)

### Navigation Architecture

**Desktop**: Collapsible sidebar with icons + labels
**Mobile**: Bottom tab bar with icons

Navigation items:
1. **Dashboard** (Home icon)
2. **Diario** (BookOpen icon) — NEW: daily macro tracking
3. **Planes** (UtensilsCrossed icon) — meal plans list
4. **Progreso** (TrendingUp icon) — NEW: weight & body charts
5. **Perfil** (User icon)

### New Pages & Features

#### 1. Diario (Daily Macro Tracker) — `/dashboard/diario`

This is the **primary daily interaction page**. Users open it every day to log meals and track their macros.

**Layout**:
- **Top section**: Circular progress rings showing daily macro targets vs. consumed (Calories, Protein, Carbs, Fat). Use SVG or Recharts for the rings. Each ring shows `consumed / target` with percentage.
- **Middle section**: "Registrar comida" card — meal type selector (Desayuno, Almuerzo, Merienda, Cena, Snack) + free-text input + AI interpretation result preview
- **Bottom section**: Chronological list of today's logged meals, grouped by meal type. Each entry expandable to show individual foods with macros and confidence score.

**Weekly diary view** (`/dashboard/diario/semanal`):
- 7-day horizontal scroll (Mon–Sun) or vertical list
- Each day shows total calories as a mini bar/sparkline
- Tap a day to see full macro breakdown
- Color coding: green (on target), yellow (slightly over/under), red (significantly off target)
- Weekly averages row at bottom

#### 2. Objetivos (Objectives) — `/dashboard/objetivos`

**Layout**:
- **Current targets card**: Calories, Protein, Carbs, Fat with editable targets (calculated from profile but manually overridable)
- **Weekly objective summary**: Bar chart showing 7 days of macro compliance (stacked: protein vs carbs vs fat vs remaining)
- **Streak tracker**: Consecutive days hitting calorie target, visual flame/chain metaphor
- **Goal progress**: Starting weight → current weight → target weight with progress bar
- **Calculated vs. Custom toggle**: Show TDEE calculation breakdown (BMR × activity factor = TDEE ± deficit/surplus = target), or allow manual override

#### 3. Progreso (Progress / Charts) — `/dashboard/progreso`

**Sub-pages with tabs**:

**Peso (Weight)** — `/dashboard/progreso/peso`:
- Line chart showing weight over time (daily or weekly aggregation toggle)
- Trend line (7-day moving average)
- Goal line (target weight)
- Hover to see exact value + date
- Tap a point to see that day's full diary entry
- "Registrar peso" floating action button — modal with date picker + weight input
- Statistics card: current weight, change this week, change this month, BMI

**Macros (Macro Trends)** — `/dashboard/progreso/macros`:
- Stacked bar chart showing daily macro breakdown (protein/carbs/fat in grams)
- Line overlay showing calorie trend
- Toggle between daily and weekly view
- Period selector: last 7 days, last 30 days, last 90 days, all time

**Adherencia (Adherence)** — `/dashboard/progreso/adherencia`:
- Calendar heat map showing daily compliance (green = within 10% of targets, yellow = within 20%, red = off, gray = no data)
- Monthly adherence percentage
- Best streak current month

#### 4. Enhanced Meal Plans — `/dashboard/planes`

- Card grid showing active and past plans
- Each card: week date range, status badge (draft/active/completed), daily calorie average
- Tap to expand → 7-day meal plan view (exists, but needs better styling)
- "Generar nuevo plan" prominent CTA
- Active plan shows "Ver plan de hoy" shortcut linking to Diario

#### 5. Enhanced Dashboard — `/dashboard`

**Redesign as an overview hub**:
- **Greeting + date** (top)
- **Today's macro rings** (calories + protein + carbs + fat) — reuse Diario component
- **Quick log button** — opens meal log modal
- **Today's meals** — summary of what's been logged so far
- **Weekly streak** — 7 circles (Mon–Sun), filled for days with logs
- **Weight trend mini-chart** — last 7 days sparkline
- **Active meal plan** — card with "Ver plan de hoy" CTA
- **Pending actions** — "Completa tu perfil", "Genera tu primer plan"

#### 6. Profile Enhancement — `/dashboard/perfil`

- Group fields into sections with cards: Datos personales, Objetivo, Preferencias alimentarias, Macros objetivo
- Avatar placeholder (initials circle)
- "Recalcular macros" button using Mifflin-St Jeor from profile data
- Clear visual separation between required and optional fields

---

## Technical Requirements

### Chart Library

Use **Recharts** (`recharts` npm package) — it's the most popular React charting library, works well with Next.js and SSR, and supports responsive containers.

Install: `npm install recharts`

### Components to Create

Break the UI into reusable components following atomic design:

**Atoms**: MacroRing, StatCard, StreakDay, DayPill, MacroBar
**Molecules**: DailyMacroSummary, MealLogEntry, WeeklyDayCard, WeightDataPoint, ProgressStat
**Organisms**: MacroRingsPanel, MealLogForm, MealTimeline, WeeklyCalendar, WeightChart, MacroTrendChart, AdherenceHeatMap, ObjectivePanel
**Templates**: DashboardTemplate, DiarioTemplate, ProgresoTemplate

### Data Hook Requirements

Create custom hooks for data fetching (React Query / SWR recommended for caching + optimistic updates):

- `useDailyMacros(date)` — aggregates MealLogs for a date, returns consumed vs target
- `useWeeklyMacros(startDate)` — 7-day macro aggregation
- `useWeightLog()` — CRUD for weight entries (new WeightLog model needed)
- `useMacroObjectives()` — get/set target macros
- `useAdherence(period)` — calculates compliance percentages

### New Prisma Model Needed: WeightLog

```prisma
model WeightLog {
  id        String   @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  date      DateTime  @default(now())
  weight    Float
  notes     String?
  createdAt DateTime @default(now())

  @@unique([userId, date])
  @@index([userId, date])
}
```

### Suggested Route Structure

```
app/
  (auth)/
    login/page.tsx
    register/page.tsx
  (dashboard)/
    layout.tsx               — Sidebar (desktop) + BottomNav (mobile) + Dark mode toggle
    page.tsx                 — Redirect to /dashboard
    dashboard/page.tsx       — Overview hub
    diario/
      page.tsx               — Daily macro tracker
      semanal/page.tsx       — Weekly diary view
    objetivos/page.tsx       — Objectives & targets
    planes/
      page.tsx               — Meal plans list
      new/page.tsx           — Wizard (keep existing)
      [id]/page.tsx          — Plan detail view
    progreso/
      page.tsx               — Redirect to peso
      peso/page.tsx          — Weight charts
      macros/page.tsx        — Macro trend charts
      adherencia/page.tsx    — Adherence calendar
    perfil/page.tsx          — Profile form
    meal-logs/page.tsx       — Keep existing (or merge into diario)
```

### Color System (Already in globals.css)

Extend but don't replace existing CSS variables. Keep the green primary. Add:

- `--success` for on-target states (green-500)
- `--warning` for slightly off (yellow-500)
- `--danger` for significantly off (red-500)
- `--muted` for empty states (gray-400)
- `--ring-calories` (blue), `--ring-protein` (emerald), `--ring-carbs` (amber), `--ring-fat` (rose) — for macro ring colors

### Mobile-First Breakpoints

```
sm: 640px   — Bottom nav still visible
md: 768px   — Sidebar collapses to icons
lg: 1024px  — Sidebar expands to icons + labels
xl: 1280px  — Full layout with more chart space
```

### Accessibility

- All charts must have `aria-label` and accessible descriptions
- Color is never the only indicator — combine with icons/labels
- Keyboard navigable tabs and calendar
- Screen reader announcements for macro completion ("75% of daily calories consumed")

### Performance

- Charts lazy-loaded with `next/dynamic` + `ssr: false`
- Macro rings use SVG (lightweight, animatable)
- Week view virtualizes if >30 days rendered
- Weight data paginated (fetch 90 days initially, load more on scroll)

---

## Existing Components to Preserve

Keep these working but restyle:

- `profile/profile-form.tsx` — Group into card sections, add recalculate button
- `meal-plans/meal-plan-view.tsx` — Upgrade to card grid with better macro visualization
- `chat/*` wizard components — Restyle but keep the 6-step flow logic
- `auth/login-form.tsx` and `auth/register-form.tsx` — Minimal restyle (consistent with new design)

---

## Deliverables Expected from Claude Design

1. **Complete component library** — All atoms, molecules, organisms as `.tsx` files with proper TypeScript types
2. **Page layouts** — All new pages with responsive layouts
3. **CSS/Theme updates** — Extended `globals.css` with new color variables and dark mode support
4. **Chart components** — Weight line chart, macro stacked bars, adherence heat map, macro rings
5. **Navigation** — Sidebar + bottom nav components with dark mode toggle
6. **API route updates** — New endpoints for WeightLog CRUD, macro aggregation
7. **Server actions** — For weight log, macro objectives, adherence calculations
8. **Custom hooks** — Data fetching hooks with optimistic updates
9. **Prisma migration** — For WeightLog model addition
10. **Integration** — Wire new pages into existing Next.js App Router

### Important Constraints

- **No `any` types** — TypeScript strict mode
- **Server Components by default** — `'use client'` only when necessary (interactivity, browser APIs)
- **Server Actions for mutations** — API routes only for external consumers
- **Prisma only** — No raw SQL
- **shadcn/ui** — Use existing components, add new ones via `npx shadcn-ui@latest add`
- **Spanish UI copy** — All labels, placeholders, error messages in Rioplatense Spanish
- **Conventional commits** — One logical change per commit

---

## Reference Screenshots (Design Inspiration)

- **Macro rings**: MacroFactor app — concentric rings with gradient fills
- **Weekly diary**: Cronometer — clean 7-day rows with macro bars
- **Weight chart**: MyFitnessPal — simple line chart with goal line
- **Adherence calendar**: GitHub contribution graph style but with nutrition colors
- **Navigation**: Linear app — collapsible sidebar + clean mobile tabs