import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Next.js server utilities
vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      body,
    })),
  },
}));

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    mealPlan: {
      groupBy: vi.fn(),
      count: vi.fn(),
    },
    workoutPlan: {
      groupBy: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const mockPrisma = vi.mocked(prisma);
const mockNextResponse = vi.mocked(NextResponse);

// Helper to import the route handler fresh each test (env vars may vary)
async function importGET() {
  // Re-import module for fresh env state
  const mod = await import("@/app/api/admin/ai-metrics/route");
  return mod.GET;
}

function makeRequest(headers: Record<string, string | null> = {}): Request {
  const headersMap = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (value !== null) headersMap.set(key, value);
  }
  return new Request("http://localhost/api/admin/ai-metrics", {
    method: "GET",
    headers: headersMap,
  });
}

// ─── Authentication tests ─────────────────────────────────────────────────────

describe("GET /api/admin/ai-metrics — authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("ADMIN_SECRET", "test-secret-123");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 401 when x-admin-secret header is missing", async () => {
    const GET = await importGET();
    const req = makeRequest({}); // no header

    await GET(req);

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(String) }),
      expect.objectContaining({ status: 401 })
    );
  });

  it("returns 401 when x-admin-secret header is wrong", async () => {
    const GET = await importGET();
    const req = makeRequest({ "x-admin-secret": "wrong-secret" });

    await GET(req);

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(String) }),
      expect.objectContaining({ status: 401 })
    );
  });
});

// ─── Success response shape ───────────────────────────────────────────────────

describe("GET /api/admin/ai-metrics — success response", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("ADMIN_SECRET", "test-secret-123");

    // Setup default mock data
    mockPrisma.mealPlan.groupBy.mockResolvedValue([
      { aiModel: "gpt-5-nano", _count: { _all: 10 }, _avg: { generationDurationMs: 1500 } },
    ] as any);
    mockPrisma.mealPlan.count
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(2); // regenerated

    mockPrisma.workoutPlan.groupBy.mockResolvedValue([
      { aiModel: "gpt-5-mini", _count: { _all: 5 }, _avg: { generationDurationMs: 2000 } },
    ] as any);
    mockPrisma.workoutPlan.count
      .mockResolvedValueOnce(5) // total
      .mockResolvedValueOnce(1); // regenerated
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 200 with AiMetricsResponse shape when auth is correct", async () => {
    const GET = await importGET();
    const req = makeRequest({ "x-admin-secret": "test-secret-123" });

    await GET(req);

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        diet: expect.objectContaining({
          total: expect.any(Number),
          regenerated: expect.any(Number),
          acceptanceRate: expect.any(Number),
          byModel: expect.any(Array),
        }),
        workout: expect.objectContaining({
          total: expect.any(Number),
          regenerated: expect.any(Number),
          acceptanceRate: expect.any(Number),
          byModel: expect.any(Array),
        }),
        generatedAt: expect.any(String),
      }),
      expect.objectContaining({ status: 200 })
    );
  });

  it("computes diet acceptanceRate as (total - regenerated) / total", async () => {
    const GET = await importGET();
    const req = makeRequest({ "x-admin-secret": "test-secret-123" });

    await GET(req);

    // total=10, regenerated=2 → acceptanceRate = (10-2)/10 = 0.8
    const callArg = mockNextResponse.json.mock.calls[0][0] as any;
    expect(callArg.diet.acceptanceRate).toBeCloseTo(0.8, 5);
  });

  it("computes workout acceptanceRate as (total - regenerated) / total", async () => {
    const GET = await importGET();
    const req = makeRequest({ "x-admin-secret": "test-secret-123" });

    await GET(req);

    // total=5, regenerated=1 → acceptanceRate = (5-1)/5 = 0.8
    const callArg = mockNextResponse.json.mock.calls[0][0] as any;
    expect(callArg.workout.acceptanceRate).toBeCloseTo(0.8, 5);
  });
});

// ─── Edge case: total = 0 ─────────────────────────────────────────────────────

describe("GET /api/admin/ai-metrics — zero plans edge case", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("ADMIN_SECRET", "test-secret-123");

    mockPrisma.mealPlan.groupBy.mockResolvedValue([] as any);
    mockPrisma.mealPlan.count.mockResolvedValue(0);

    mockPrisma.workoutPlan.groupBy.mockResolvedValue([] as any);
    mockPrisma.workoutPlan.count.mockResolvedValue(0);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns acceptanceRate=0 without dividing by zero when total=0", async () => {
    const GET = await importGET();
    const req = makeRequest({ "x-admin-secret": "test-secret-123" });

    await GET(req);

    const callArg = mockNextResponse.json.mock.calls[0][0] as any;
    expect(callArg.diet.total).toBe(0);
    expect(callArg.diet.acceptanceRate).toBe(0);
    expect(callArg.workout.total).toBe(0);
    expect(callArg.workout.acceptanceRate).toBe(0);
  });
});
