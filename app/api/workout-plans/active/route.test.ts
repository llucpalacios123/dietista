import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/auth-config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/workout-plan-service", () => ({
  getActiveWorkoutPlan: vi.fn(),
}));

const { auth } = await import("@/lib/auth-config");
const { getActiveWorkoutPlan } = await import("@/lib/workout-plan-service");
const { GET } = await import("@/app/api/workout-plans/active/route");

const mockAuth = vi.mocked(auth);
const mockGetActiveWorkoutPlan = vi.mocked(getActiveWorkoutPlan);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeGetRequest(): NextRequest {
  return new NextRequest("http://localhost/api/workout-plans/active", {
    method: "GET",
  });
}

const mockActivePlan = {
  id: "plan-active",
  userId: "user-1",
  name: "Plan activo",
  goal: "hypertrophy",
  level: "intermediate",
  daysPerWeek: 4,
  status: "active",
  content: { version: 1, days: [] },
  startDate: new Date("2024-01-01"),
  endDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/workout-plans/active", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as never);

    const response = await GET(makeGetRequest());
    expect(response.status).toBe(401);
  });

  it("returns 200 with the active plan", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" } as never);
    mockGetActiveWorkoutPlan.mockResolvedValue(mockActivePlan);

    const response = await GET(makeGetRequest());
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data.id).toBe("plan-active");
    expect(body.data.status).toBe("active");
  });

  it("returns 404 when no active plan exists", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" } as never);
    mockGetActiveWorkoutPlan.mockResolvedValue(null);

    const response = await GET(makeGetRequest());
    expect(response.status).toBe(404);
  });

  it("calls getActiveWorkoutPlan with the authenticated userId", async () => {
    mockAuth.mockResolvedValue({ userId: "user-xyz" } as never);
    mockGetActiveWorkoutPlan.mockResolvedValue(null);

    await GET(makeGetRequest());

    expect(mockGetActiveWorkoutPlan).toHaveBeenCalledWith("user-xyz");
  });
});
