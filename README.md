# Dietista — AI-Powered Meal Planning

A personalized diet and nutrition application that generates weekly meal plans using OpenAI, with meal logging and nutritional profile management.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL 16 + Prisma ORM
- **Authentication**: NextAuth.js v5 (Credentials + JWT)
- **UI**: TailwindCSS + shadcn/ui
- **AI**: OpenAI GPT-4o-mini
- **Validation**: Zod + React Hook Form

## Prerequisites

- Node.js 20+ LTS
- Docker & Docker Compose
- OpenAI API key

## Quick Start

### 1. Clone and Install

```bash
git clone <repo-url> dietista
cd dietista
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Edit `.env.local` and set:
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000` for local dev
- `OPENAI_API_KEY` — Your OpenAI API key

### 3. Start PostgreSQL

```bash
docker compose up -d
```

### 4. Database Setup

```bash
npm run db:generate   # Generate Prisma client
npm run db:migrate    # Run migrations
npm run db:seed       # Seed food catalog
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed the database |
| `npm run db:studio` | Open Prisma Studio |

## Project Structure

```
dietista/
├── app/
│   ├── (auth)/          # Auth route group (login, register)
│   ├── (dashboard)/     # Protected route group
│   ├── api/             # API routes
│   │   └── auth/        # NextAuth endpoints
│   ├── layout.tsx       # Root layout
│   ├── globals.css      # Global styles
│   └── error.tsx        # Global error boundary
├── components/
│   ├── auth/            # Auth form components
│   └── ui/              # shadcn/ui base components
├── lib/
│   ├── auth.ts          # Auth helpers (hash, CRUD)
│   ├── auth-config.ts   # NextAuth configuration
│   ├── prisma.ts        # Prisma client singleton
│   ├── schemas.ts       # Zod validation schemas
│   ├── rate-limit.ts    # In-memory rate limiter
│   ├── utils.ts         # Shared utilities
│   └── api-error.ts     # API error response format
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Seed script
├── types/
│   └── next-auth.d.ts   # NextAuth type augmentation
├── middleware.ts         # Route protection middleware
├── docker-compose.yml    # PostgreSQL service
├── Dockerfile            # Production Docker image
└── .github/workflows/    # CI pipeline
```

## Architecture

- **Feature-folders** with route groups: `(auth)`, `(dashboard)`
- **Server Actions** for CRUD forms, **API routes** for AI endpoints
- **Prisma singleton** safe for Next.js dev hot-reload
- **JWT sessions** with 24-hour expiry
- **In-memory rate limiting** (single-instance, Phase 1)

## License

MIT
