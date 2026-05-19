# Proposal: Chat-Based Meal Plan Generation

## Intent

Users encounter "Invalid meal plan structure: Required, Required, Required..." errors when OpenAI returns malformed JSON, causing Zod validation to fail on all required fields simultaneously. The current one-click generation provides no opportunity to provide context, review inputs, or handle failures gracefully.

We need a conversational interface that gathers user requirements progressively, validates inputs before AI generation, and provides real-time feedback through streaming responses.

## Scope

### In Scope
- Chat interface for meal plan generation with progressive question flow
- File upload support (PDF, TXT, JSON) for dietary preferences, restrictions, templates
- Vercel AI SDK integration for streaming chat responses
- Extraction of structured data from uploaded files using OpenAI
- Progressive form: asks questions only when file upload doesn't provide complete info
- Migration path: keep existing `/api/meal-plans/generate` as fallback initially
- New route: `/meal-plans/generate/chat` with dedicated chat UI component

### Out of Scope
- Multi-turn conversation history persistence beyond current session
- Voice input or image-based food recognition
- Integration with external recipe databases
- Real-time collaborative meal planning
- Mobile app adaptation (web-first approach)

## Capabilities

### New Capabilities
- `chat-meal-generation`: Conversational meal plan creation with file upload and progressive questioning
- `file-parsing`: Extract structured dietary data from uploaded files (PDF, TXT, JSON)

### Modified Capabilities
- None (existing `meal-plan-generation` remains unchanged as fallback)

## Approach

1. **Vercel AI SDK** (`ai` package) for streaming chat with `useChat` hook
2. **File Upload**: Server Action with `useActionState` + Zod validation, store temporarily in `/tmp` or memory
3. **Progressive Question Flow**: State machine tracking collected fields vs required profile data
4. **Two-Phase Generation**:
   - Phase 1: Chat collects info → extract to structured format
   - Phase 2: Call existing `generateDiet()` with validated params
5. **Fallback**: Existing generate button remains functional during transition

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `app/(dashboard)/meal-plans/page.tsx` | Modified | Add "Generate via Chat" button alongside existing |
| `app/(dashboard)/meal-plans/generate/chat/page.tsx` | New | Chat interface with file upload |
| `app/api/chat/generate-meal-plan/route.ts` | New | Vercel AI SDK streaming endpoint |
| `app/api/upload/diet-file/route.ts` | New | File upload handler with parsing |
| `lib/chat-meal-service.ts` | New | Chat orchestration, question flow logic |
| `lib/file-parser.ts` | New | PDF/TXT/JSON parsing with OpenAI extraction |
| `lib/schemas.ts` | Modified | Add chat session, file upload schemas |
| `lib/job-queue.ts` | Unchanged | Reuse for async generation phase |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| OpenAI file parsing returns incomplete data | Medium | Progressive questions fill gaps; show extracted data for user confirmation |
| Vercel AI SDK streaming timeout on large files | Low | Set reasonable file size limits (5MB); parse in chunks |
| Users confused by two generation methods | Low | Clear UI labeling; deprecate old method after validation period |
| PDF parsing complexity (scanned docs) | High | Support text-based PDFs only; show error for image-based scans |
| State management complexity in chat | Medium | Use finite state machine pattern; keep question flow simple |

## Rollback Plan

1. **Immediate**: Remove "Generate via Chat" button, users fall back to existing flow
2. **Code**: Revert chat-related files; no changes to existing `generateDiet()` or job queue
3. **Data**: Chat sessions are ephemeral; no database rollback needed
4. **Feature Flag**: Consider wrapping chat UI in feature flag for instant toggle

## Dependencies

- `ai` package (Vercel AI SDK) — new dependency
- `pdf-parse` or similar for PDF text extraction
- Existing OpenAI integration (no changes required)
- Existing Prisma schema (no changes required)

## Success Criteria

- [ ] User can upload a file and see extracted dietary preferences displayed for confirmation
- [ ] User without file answers 3-5 progressive questions max before generation starts
- [ ] Streaming chat response shows typing indicator and partial responses
- [ ] Generated meal plan passes Zod validation on first attempt (no "Required" errors)
- [ ] Existing generate button continues working throughout transition period
- [ ] End-to-end test covers: file upload flow, no-file flow, validation failure handling
