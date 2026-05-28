import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/auth-config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/workout-plan-service", () => ({
  listWorkoutPlans: vi.fn(),
  getActiveWorkoutPlan: vi.fn(),
}));

const { auth } = await import("@/lib/auth-config");
const { listWorkoutPlans, getActiveWorkoutPlan } = await import("@/lib/workout-plan-service");
const { GET } = await import("@/app/api/workout-plans/route");

const mockAuth = vi.mocked(auth);
const mockListWorkoutPlans = vi.mocked(listWorkoutPlans);
const mockGetActiveWorkoutPlan = vi.mocked(getActiveWorkoutPlan);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeGetRequest(): NextRequest {
  return new NextRequest("http://localhost/api/workout-plans", {
    method: "GET",
  });
}

const mockPlan = {
  id: "plan-1",
  userId: "user-1",
  name: "Mi plan",
  goal: "strength",
  level: "intermediate",
  daysPerWeek: 3,
  status: "active",
  content: { version: 1, days: [] },
  startDate: new Date("2024-01-01"),
  endDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/workout-plans", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as never);

    const response = await GET(makeGetRequest());
    expect(response.status).toBe(401);
  });

  it("returns 200 with list of plans for authenticated user", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" } as never);
    mockListWorkoutPlans.mockResolvedValue([mockPlan]);

    const response = await GET(makeGetRequest());
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(1);
  });

  it("returns only plans for the authenticated user (calls service with correct userId)", async () => {
    mockAuth.mockResolvedValue({ userId: "user-abc" } as never);
    mockListWorkoutPlans.mockResolvedValue([]);

    await GET(makeGetRequest());

    expect(mockListWorkoutPlans).toHaveBeenCalledWith("user-abc");
  });

  it("returns empty array when user has no plans", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" } as never);
    mockListWorkoutPlans.mockResolvedValue([]);

    const response = await GET(makeGetRequest());
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data).toEqual([]);
  });
});
