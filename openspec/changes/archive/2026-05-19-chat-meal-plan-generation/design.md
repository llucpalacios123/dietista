# Design: Chat-Based Meal Plan Generation

## Technical Approach

Two-phase architecture: **Phase 1** (chat) uses Vercel AI SDK `useChat` hook with a streaming API route that orchestrates progressive data collection via a state machine. **Phase 2** (generation) reuses the existing `generateMealPlan()` pipeline. File upload uses a Server Action with `pdf-parse` for text extraction, then falls into the same chat flow for missing fields. No database changes — sessions are ephemeral.

## Architecture Decisions

### Decision: Streaming Chat Transport

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Vercel AI SDK (`useChat` + route handler) | Built-in streaming, state management, tool calls. Adds `ai` + `@ai-sdk/openai` deps | **Chosen** — matches proposal, reduces custom streaming code |
| Custom SSE with `ReadableStream` | No new deps, but rebuild streaming primitives, error handling, typing | Rejected — reinventing the wheel |

### Decision: Chat State Management

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Client-side finite state machine (useReducer) | Simple, ephemeral, no DB writes per message | **Chosen** — matches spec's "session state lost on refresh" |
| Server-side session (DB/cookie) | Persistent across refresh, but needs new model, doubles scope | Rejected — out of scope per proposal |

### Decision: AI Tool Calls for Data Extraction

| Option | Tradeoff | Decision |
|--------|----------|----------|
| AI SDK tool calls (`tools` param) | Structured extraction per message, type-safe, embedded in stream | **Chosen** — natural fit for progressive field collection |
| Free-text parsing after each response | Fragile regex/keyword matching, unreliable | Rejected — LLM tool calls are purpose-built for this |

### Decision: File Upload Mechanism

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Server Action with `useActionState` | Matches existing pattern (profile-form), Zod validation, no extra deps | **Chosen** — consistent with codebase |
| API route + `fetch` multipart | More manual, inconsistent with existing patterns | Rejected |

### Decision: PDF Text Extraction Library

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `pdf-parse` | Lightweight, pure JS, handles text-based PDFs well | **Chosen** — matches spec requirement |
| `pdfjs-dist` | More powerful, but heavier, browser-oriented | Rejected — overkill for server-side text extraction |

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Client (Browser)                              │
│                                                                 │
│  ChatPage ──→ useChat() ──→ /api/chat/generate-meal-plan       │
│       │              │                                           │
│       │              ├─ messages[] (conversation history)        │
│       │              └─ toolCall results → DietaryProfile state  │
│       │                                                          │
│       └── FileUpload ──→ uploadDietFile Server Action           │
│                               │                                  │
│                               ▼                                  │
│                    ExtractedDietaryData ←── JSON response       │
│                               │                                  │
│                               ▼                                  │
│              Inject into chat as user context                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Server (Route Handler / Action)                      │
│                                                                 │
│  POST /api/chat/generate-meal-plan                              │
│       │                                                         │
│       ├─ streamText() with tools: extractDietaryField            │
│       │       │                                                  │
│       │       ▼                                                  │
│       │   ChatMealService.determineNextQuestion()               │
│       │       │                                                  │
│       │       ▼                                                  │
│       │   Returns tool calls → client collects fields           │
│       │                                                         │
│       ├─ When all required fields collected:                     │
│       │       │                                                  │
│       │       ▼                                                  │
│       │   generateMealPlan(userId) → jobQueue                    │
│       │       │                                                  │
│       │       ▼                                                  │
│       │   Return jobId as AI message                             │
│       │                                                          │
│  uploadDietFile Action                                          │
│       │                                                         │
│       ├─ Validate file (type, size)                              │
│       ├─ Extract text (pdf-parse / raw / JSON.parse)            │
│       ├─ AI extraction via structured output                     │
│       └─ Return PartialDietaryProfile                           │
└─────────────────────────────────────────────────────────────────┘
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `app/(dashboard)/meal-plans/generate/chat/page.tsx` | Create | Chat UI page with useChat hook, file upload, and progress tracking |
| `components/chat/chat-interface.tsx` | Create | Main chat component wrapping useChat, message display, input |
| `components/chat/chat-message.tsx` | Create | Individual message bubble (user/assistant/system) |
| `components/chat/file-upload-zone.tsx` | Create | Drag-and-drop file upload component |
| `components/chat/dietary-profile-card.tsx` | Create | Displays collected dietary fields with edit capability |
| `components/chat/generation-progress.tsx` | Create | Job polling + progress UI after generation triggers |
| `app/api/chat/generate-meal-plan/route.ts` | Create | Vercel AI SDK route handler with streaming + tool calls |
| `actions/upload-diet-file.ts` | Create | Server Action for file upload, validation, text extraction |
| `lib/chat-meal-service.ts` | Create | State machine logic: field priority, next question, completeness check |
| `lib/file-parser.ts` | Create | PDF/TXT/JSON parsing, OpenAI structuring, extraction mapping |
| `lib/schemas.ts` | Modify | Add DietaryProfileSchema, FileUploadSchema, ChatSessionSchema |
| `lib/openai.ts` | Modify | Add extractDietaryData() for file content→profile extraction |
| `app/(dashboard)/meal-plans/page.tsx` | Modify | Add "Generate via Chat" button alongside existing button |
| `lib/diet-service.ts` | Modify | Add overload accepting DietaryProfile for chat-originated generation |
| `package.json` | Modify | Add `ai`, `@ai-sdk/openai`, `pdf-parse` dependencies |

## Interfaces / Contracts

```typescript
// lib/schemas.ts — new schemas

export const dietaryProfileSchema = z.object({
  dietaryRestrictions: z.array(z.string()).default([]),
  calorieGoal: z.number().int().min(1000).max(4000).optional(),
  mealFrequency: z.number().int().min(2).max(6).optional(),
  foodPreferences: z.array(z.string()).default([]),
  disallowedFoods: z.array(z.string()).default([]),
});

export const fileUploadSchema = z.object({
  file: z.instanceof(File)
    .refine(f => ['application/pdf', 'text/plain', 'application/json'].includes(f.type),
      'Unsupported file type. Please upload PDF, TXT, or JSON.')
    .refine(f => f.size <= 5 * 1024 * 1024, 'File too large. Maximum size is 5MB.'),
});

export type DietaryProfile = z.infer<typeof dietaryProfileSchema>;

// lib/chat-meal-service.ts

export const REQUIRED_FIELDS: (keyof DietaryProfile)[] = [
  'dietaryRestrictions',
  'calorieGoal',
  'mealFrequency',
  'foodPreferences',
  'disallowedFoods',
];

export interface ChatMealState {
  profile: Partial<DietaryProfile>;
  confirmed: boolean;
  phase: 'collecting' | 'confirmed' | 'generating' | 'complete' | 'error';
}

export function determineNextQuestion(
  profile: Partial<DietaryProfile>
): { field: keyof DietaryProfile; question: string } | null;

export function isProfileComplete(
  profile: Partial<DietaryProfile>
): boolean;

export function mergeExtractedData(
  existing: Partial<DietaryProfile>,
  extracted: Partial<DietaryProfile>,
  source: 'chat' | 'file'
): Partial<DietaryProfile>;

// lib/file-parser.ts

export interface ParsedDietaryData {
  profile: Partial<DietaryProfile>;
  confidence: Record<string, 'high' | 'medium' | 'low'>;
  conflicts?: Array<{ field: string; values: unknown[] }>;
}

export async function parseUploadedFile(
  file: File
): Promise<ParsedDietaryData>;

export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string
): Promise<string>;

// actions/upload-diet-file.ts

export interface UploadResult {
  success: boolean;
  data?: ParsedDietaryData;
  error?: string;
}

export async function uploadDietFile(
  _prevState: UploadResult | null,
  formData: FormData
): Promise<UploadResult>;

// app/api/chat/generate-meal-plan/route.ts
// Uses Vercel AI SDK streamText with tools parameter
// Tool: extractDietaryField — called by LLM to extract structured data from user message
// Tool: triggerGeneration — called when all fields collected, invokes generateMealPlan()

// lib/diet-service.ts — new overload

export async function generateMealPlanFromProfile(
  userId: string,
  profile: DietaryProfile
): Promise<{ mealPlanId: string; mealCount: number }>;
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `determineNextQuestion()` — returns correct next field based on missing data | Table-driven tests with PartialDietaryProfile inputs |
| Unit | `isProfileComplete()` — validates required fields present | Table-driven tests for complete, partial, empty profiles |
| Unit | `mergeExtractedData()` — merges chat/file data, handles conflicts | Table-driven tests for overlap, conflicts, source priority |
| Unit | `extractTextFromFile()` — PDF, TXT, JSON parsing | Mock `pdf-parse`, test buffer handling, boundary cases |
| Unit | `dietaryProfileSchema`, `fileUploadSchema` — validation | Zod schema tests (existing pattern in schemas.test.ts) |
| Integration | `/api/chat/generate-meal-plan` route — streaming response, tool calls | Vitest + mocked OpenAI, verify stream format and tool call resolution |
| Integration | `uploadDietFile` action — file validation, parsing, extraction | testcontainers-pg not needed (no DB); mock OpenAI extraction |
| E2E | Full chat flow: new session → answer questions → generation triggers | Playwright: type messages, verify responses, check job polling |
| E2E | File upload flow: upload PDF → confirmation → missing fields questions | Playwright: upload file, verify extracted data display, continue chat |

## Migration / Rollout

No database migration required. Chat sessions are ephemeral (client state only).

**Phased rollout:**
1. Deploy chat route + UI behind existing dashboard (no feature flag needed — new route `/meal-plans/generate/chat` is additive)
2. Existing "Generate Meal Plan" button remains unchanged
3. New "Generate via Chat" button added alongside it
4. After validation period, existing one-click flow can be deprecated

**New dependencies:** `ai`, `@ai-sdk/openai`, `pdf-parse`, `@types/pdf-parse` (dev)

## Open Questions

- [ ] Should extracted dietary data from file uploads also update the user's Profile model, or stay local to the chat session only?
- [ ] DOCX support mentioned in spec summary but not in detailed specs — defer to future iteration?
- [ ] Should the chat AI model be `gpt-4o-mini` (existing) or a different model better suited for structured extraction?