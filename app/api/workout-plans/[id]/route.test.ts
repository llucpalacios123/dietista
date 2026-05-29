import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/auth-config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/workout-plan-service", () => ({
  getWorkoutPlanById: vi.fn(),
  deleteWorkoutPlan: vi.fn(),
}));

const { auth } = await import("@/lib/auth-config");
const { getWorkoutPlanById, deleteWorkoutPlan } = await import("@/lib/workout-plan-service");
const { GET, DELETE } = await import("@/app/api/workout-plans/[id]/route");

const mockAuth = vi.mocked(auth);
const mockGetWorkoutPlanById = vi.mocked(getWorkoutPlanById);
const mockDeleteWorkoutPlan = vi.mocked(deleteWorkoutPlan);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(method: string, planId: string): NextRequest {
  return new NextRequest(`http://localhost/api/workout-plans/${planId}`, {
    method,
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
  aiModel: null,
  startDate: new Date("2024-01-01"),
  endDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const params = { params: Promise.resolve({ id: "plan-1" }) };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/workout-plans/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as never);

    const response = await GET(makeRequest("GET", "plan-1"), params);
    expect(response.status).toBe(401);
  });

  it("returns 200 with plan when found and owned by user", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" } as never);
    mockGetWorkoutPlanById.mockResolvedValue(mockPlan);

    const response = await GET(makeRequest("GET", "plan-1"), params);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data.id).toBe("plan-1");
  });

  it("returns 404 when plan not found", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" } as never);
    mockGetWorkoutPlanById.mockResolvedValue(null);

    const response = await GET(makeRequest("GET", "nonexistent"), params);
    expect(response.status).toBe(404);
  });

  it("returns 404 when plan belongs to different user (IDOR protection)", async () => {
    // Service returns null for wrong user — see getWorkoutPlanById behavior
    mockAuth.mockResolvedValue({ userId: "user-2" } as never);
    mockGetWorkoutPlanById.mockResolvedValue(null);

    const response = await GET(makeRequest("GET", "plan-1"), params);
    expect(response.status).toBe(404);
  });

  it("calls getWorkoutPlanById with correct userId and planId", async () => {
    mockAuth.mockResolvedValue({ userId: "user-abc" } as never);
    mockGetWorkoutPlanById.mockResolvedValue(null);

    await GET(makeRequest("GET", "plan-1"), params);

    expect(mockGetWorkoutPlanById).toHaveBeenCalledWith("user-abc", "plan-1");
  });
});

describe("DELETE /api/workout-plans/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as never);

    const response = await DELETE(makeRequest("DELETE", "plan-1"), params);
    expect(response.status).toBe(401);
  });

  it("returns 200 on successful delete", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" } as never);
    mockDeleteWorkoutPlan.mockResolvedValue(undefined);

    const response = await DELETE(makeRequest("DELETE", "plan-1"), params);
    expect(response.status).toBe(200);
  });

  it("returns 404 when plan not found or not owned", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" } as never);
    mockDeleteWorkoutPlan.mockRejectedValue(
      new Error("Plan de entrenamiento no encontrado o no tienes permisos para eliminarlo")
    );

    const response = await DELETE(makeRequest("DELETE", "plan-999"), params);
    expect(response.status).toBe(404);
  });

  it("calls deleteWorkoutPlan with correct userId and planId", async () => {
    mockAuth.mockResolvedValue({ userId: "user-xyz" } as never);
    mockDeleteWorkoutPlan.mockResolvedValue(undefined);

    await DELETE(makeRequest("DELETE", "plan-1"), params);

    expect(mockDeleteWorkoutPlan).toHaveBeenCalledWith("user-xyz", "plan-1");
  });
});
