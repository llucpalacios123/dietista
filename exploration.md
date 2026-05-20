## Exploration: Nutritionist Chat Assistant with 6-Step Flow

### Current State

**CRITICAL FINDING: There is NO existing chat implementation in the codebase.**

The user request mentions "existing chat meal plan generation" but the codebase has:
- Zero chat components
- Zero chat API routes
- Zero conversation state management
- Zero chat hooks or actions

**Current meal plan generation flow:**
1. User clicks "Generate Meal Plan" button on `/meal-plans` page
2. POST `/api/meal-plans/generate` creates an in-memory job
3. Job calls `generateMealPlan()` from `lib/diet-service.ts`
4. Which calls `generateDiet()` from `lib/openai.ts` with a simple prompt
5. Results saved directly to database as `MealPlan` + `Meal` records
6. User sees loading spinner with basic status text ("Queued", "AI is creating...")

**Current profile data (Prisma `Profile` model):**
- ✅ age, sex, height, weight
- ✅ goal, activityLevel
- ✅ targetCalories, targetProtein, targetCarbs, targetFat (optional)
- ✅ allergies, forbiddenFoods (string arrays)
- ❌ **MISSING:** trainingRoutine, dietType, budget, mealComplexity, mealsPerDay, snacks (boolean), variety, favoriteFoods

**Current OpenAI integration (`lib/openai.ts`):**
- Single prompt template `DIET_GENERATION_SYSTEM`
- Returns JSON array of meals
- No conversation context
- No step-by-step flow
- No economic/ingredient reuse logic
- No modification/regeneration capability

### Affected Areas

- **NEW: `app/api/chat/route.ts`** — Chat API endpoint (does not exist)
- **NEW: `components/chat/`** — Chat UI components (does not exist)
- **NEW: `hooks/use-chat-conversation.ts`** — Conversation state machine (does not exist)
- **NEW: `lib/chat-tools.ts`** — Chat utility functions (does not exist)
- **`prisma/schema.prisma`** — Profile model needs new fields for food preferences
- **`lib/schemas.ts`** — Need new schemas for chat conversation, preferences, final JSON output
- **`lib/openai.ts`** — Need new prompt templates for 6-step flow, economic meal planning
- **`lib/diet-service.ts`** — Need modification logic, partial regeneration
- **`app/(dashboard)/meal-plans/page.tsx`** — May need integration with chat flow

### Approaches

#### 1. **Build Chat from Scratch with Vercel AI SDK**
- **Pros:**
  - Leverages `ai` package already in node_modules (detected `@ai-sdk/react`, `@ai-sdk/openai`)
  - Built-in streaming, state management (`useChat` hook)
  - Message persistence patterns
  - Tool/function calling support for structured outputs
- **Cons:**
  - Learning curve for AI SDK patterns
  - Need to implement entire conversation state machine
  - More complex than simple API routes
- **Effort:** High

#### 2. **Custom State Machine with Server Actions**
- **Pros:**
  - Full control over 6-step flow
  - Can use existing patterns (Server Actions like `actions/profile.ts`)
  - Easier to enforce step validation
  - No new dependencies
- **Cons:**
  - Manual state persistence (database or session)
  - Need to build loading states from scratch
  - More boilerplate for streaming responses
- **Effort:** Medium-High

#### 3. **Hybrid: AI SDK for Chat + Custom State Machine**
- **Pros:**
  - Use `useChat` for UI/message handling
  - Custom server-side state machine for 6-step flow
  - Best of both worlds
- **Cons:**
  - Most complex architecture
  - Need to coordinate two state systems
- **Effort:** High

### Recommendation

**Approach 2: Custom State Machine with Server Actions**

Reasons:
1. The 6-step flow is **highly structured** — not a free-form chat. A conversation state machine is more appropriate than generic chat.
2. Each step has **validation requirements** (e.g., can't generate meal plan without preferences)
3. The final output must be **specific JSON schema** for Spring Boot backend — easier to control with explicit state transitions
4. Economic meal planning rules (ingredient reuse, cheap foods) require **custom logic**, not just AI prompting
5. Partial modification rules need **database awareness** of what changed — state machine can track this

**Implementation strategy:**
1. Create `lib/chat-conversation.ts` — state machine with 6 states
2. Create `actions/chat.ts` — server actions for each step transition
3. Create `components/chat/chat-interface.tsx` — message list, input, step indicator
4. Create `components/chat/step-*.tsx` — step-specific UI (profile display, preference form, etc.)
5. Extend Prisma `Profile` model with new fields
6. Create `lib/schemas.ts` additions for `ChatConversationState`, `FoodPreferences`, `FinalMealPlanJson`
7. Modify `lib/openai.ts` with new prompts for economic planning, modification handling

### Risks

1. **Scope creep:** The 6-step flow is essentially a **wizard**, not a chat. Risk of over-engineering as "chat" when it's really a guided form with AI assistance.

2. **Data model mismatch:** Current `Profile` model mixes user data (age, weight) with preferences (allergies). New requirements need:
   - `trainingRoutine` (string)
   - `dietType` (enum: omnivore, vegetarian, vegan, etc.)
   - `budget` (enum: low, medium, high)
   - `mealComplexity` (enum: simple, moderate, complex)
   - `mealsPerDay` (int, 3-6)
   - `includeSnacks` (boolean)
   - `varietyLevel` (enum: low, medium, high)
   - `favoriteFoods` (string[])
   - These could go in `Profile` or a new `FoodPreferences` model

3. **JSON schema complexity:** Final output must match Spring Boot expectations. Need to define exact schema BEFORE implementation.

4. **Modification logic:** "Change specific meals, regenerate specific days" requires:
   - Tracking which meals were modified
   - Recalculating daily macros to stay coherent
   - Ensuring ingredient reuse across the week
   - This is non-trivial algorithmic work

5. **No existing chat infrastructure:** Starting from zero means building:
   - Message storage (database vs in-memory)
   - Conversation recovery (if user refreshes)
   - Loading states with dynamic messages
   - Error handling for each step

### Ready for Proposal

**Yes**, but with clarification needed:

1. **Confirm this is a wizard, not free-form chat:** The 6-step flow is a guided process. Should it still have a "chat-like" UI, or would a step-by-step wizard be more appropriate?

2. **Final JSON schema:** What is the exact schema expected by Spring Boot? Need to see the target structure before implementing.

3. **Conversation persistence:** Should conversations be saved to database (for recovery) or session-only?

4. **Economic rules specificity:** What defines "cheap foods"? Should there be a food database with prices, or AI estimates?

5. **Training routine:** What format? Free text, or structured (days per week, exercise type)?

**Next step:** Create SDD proposal with:
- Exact final JSON schema
- State machine diagram
- Data model changes
- Step-by-step UI mockups
