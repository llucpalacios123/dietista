# Code Review Rules — dietista

## TypeScript
- Use strict mode, no `any`
- Prefer interfaces for public APIs, types for unions/intersections
- Explicit return types on exported functions

## Next.js App Router
- Server Components by default, 'use client' only when needed
- Server Actions for mutations, API routes for external consumers
- Auth-gate all dashboard routes via middleware

## Data Access
- Prisma only, no raw SQL unless justified
- Transactional writes for multi-entity operations

## Testing
- Table-driven unit tests for pure functions
- Integration tests require testcontainers-pg
- E2E covers critical user journeys

## Commits
- Conventional commits: feat, fix, chore, test, docs
- One work unit per commit
