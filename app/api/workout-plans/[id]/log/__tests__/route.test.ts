import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/auth-config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/workout-plan-service", () => ({
  getWorkoutPlanById: vi.fn(),
  createWorkoutPlanLog: vi.fn(),
}));

vi.mock("@/lib/workout-plan-days", () => ({
  getSelectableDays: vi.fn(),
}));

const { auth } = await import("@/lib/auth-config");
const { getWorkoutPlanById, createWorkoutPlanLog } = await import("@/lib/workout-plan-service");
const { getSelectableDays } = await import("@/lib/workout-plan-days");
const { POST } = await import("@/app/api/workout-plans/[id]/log/route");

const mockAuth = vi.mocked(auth);
const mockGetWorkoutPlanById = vi.mocked(getWorkoutPlanById);
const mockCreateWorkoutPlanLog = vi.mocked(createWorkoutPlanLog);
const mockGetSelectableDays = vi.mocked(getSelectableDays);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(planId: string, body: unknown): NextRequest {
  return new NextRequest(
    `http://localhost/api/workout-plans/${planId}/log`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
}

const params = { params: Promise.resolve({ id: "plan-1" }) };

const mockPlan = {
  id: "plan-1",
  userId: "user-1",
  name: "Mi plan",
  goal: "strength",
  level: "intermediate",
  daysPerWeek: 3,
  status: "active",
  content: { version: 2, days: [{}, {}, {}] }, // 3 days
  startDate: new Date("2026-01-01"),
  endDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockLog = {
  id: "log-1",
  userId: "user-1",
  planId: "plan-1",
  planDayIndex: 1,
  completedAt: new Date(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/workout-plans/[id]/log", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no active session", async () => {
    mockAuth.mockResolvedValue(null as never);

    const response = await POST(makeRequest("plan-1", { planDayIndex: 0 }), params);

    expect(response.status).toBe(401);
  });

  it("returns 404 when plan is not found or not owned by user", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" } as never);
    mockGetWorkoutPlanById.mockResolvedValue(null);

    const response = await POST(makeRequest("plan-1", { planDayIndex: 0 }), params);

    expect(response.status).toBe(404);
  });

  it("calls getWorkoutPlanById with correct userId and planId (ownership check)", async () => {
    mockAuth.mockResolvedValue({ userId: "user-abc" } as never);
    mockGetWorkoutPlanById.mockResolvedValue(null);

    await POST(makeRequest("plan-1", { planDayIndex: 0 }), params);

    expect(mockGetWorkoutPlanById).toHaveBeenCalledWith("user-abc", "plan-1");
  });

  it("returns 400 when planDayIndex is missing from body", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" } as never);
    mockGetWorkoutPlanById.mockResolvedValue(mockPlan as never);
    mockGetSelectableDays.mockReturnValue([{} as never, {} as never, {} as never]);

    const response = await POST(makeRequest("plan-1", {}), params);

    expect(response.status).toBe(400);
  });

  it("returns 400 when planDayIndex is a non-integer number (float)", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" } as never);
    mockGetWorkoutPlanById.mockResolvedValue(mockPlan as never);
    mockGetSelectableDays.mockReturnValue([{} as never, {} as never, {} as never]);

    const response = await POST(makeRequest("plan-1", { planDayIndex: 1.5 }), params);

    expect(response.status).toBe(400);
  });

  it("returns 400 when planDayIndex is a string", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" } as never);
    mockGetWorkoutPlanById.mockResolvedValue(mockPlan as never);
    mockGetSelectableDays.mockReturnValue([{} as never, {} as never, {} as never]);

    const response = await POST(makeRequest("plan-1", { planDayIndex: "1" }), params);

    expect(response.status).toBe(400);
  });

  it("returns 400 when planDayIndex is negative", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" } as never);
    mockGetWorkoutPlanById.mockResolvedValue(mockPlan as never);
    mockGetSelectableDays.mockReturnValue([{} as never, {} as never, {} as never]);

    const response = await POST(makeRequest("plan-1", { planDayIndex: -1 }), params);

    expect(response.status).toBe(400);
  });

  it("returns 400 when planDayIndex >= selectable days length", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" } as never);
    mockGetWorkoutPlanById.mockResolvedValue(mockPlan as never);
    // 3 selectable days (indexes 0, 1, 2) — index 3 is out of range
    mockGetSelectableDays.mockReturnValue([{} as never, {} as never, {} as never]);

    const response = await POST(makeRequest("plan-1", { planDayIndex: 3 }), params);

    expect(response.status).toBe(400);
  });

  it("returns 400 when plan has 0 selectable days and planDayIndex is 0", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" } as never);
    mockGetWorkoutPlanById.mockResolvedValue(mockPlan as never);
    // 0 selectable days — any index is invalid
    mockGetSelectableDays.mockReturnValue([]);

    const response = await POST(makeRequest("plan-1", { planDayIndex: 0 }), params);

    expect(response.status).toBe(400);
  });

  it("returns 201 on valid request and calls createWorkoutPlanLog with correct args", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" } as never);
    mockGetWorkoutPlanById.mockResolvedValue(mockPlan as never);
    // 3 selectable days — index 1 is valid
    mockGetSelectableDays.mockReturnValue([{} as never, {} as never, {} as never]);
    mockCreateWorkoutPlanLog.mockResolvedValue(mockLog as never);

    const response = await POST(makeRequest("plan-1", { planDayIndex: 1 }), params);

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.data.logged).toBe(true);
    expect(body.data.id).toBe("log-1");

    expect(mockCreateWorkoutPlanLog).toHaveBeenCalledWith("user-1", "plan-1", 1);
  });

  it("uses getSelectableDays bound (v1 with rest days) — not raw content.days.length", async () => {
    const v1Plan = {
      ...mockPlan,
      content: {
        version: 1,
        days: [
          { dayOfWeek: 0, isRestDay: false },  // selectable index 0
          { dayOfWeek: 1, isRestDay: true },   // rest — filtered
          { dayOfWeek: 2, isRestDay: false },  // selectable index 1
        ],
      },
    };
    mockAuth.mockResolvedValue({ userId: "user-1" } as never);
    mockGetWorkoutPlanById.mockResolvedValue(v1Plan as never);
    // Only 2 selectable days (rest day filtered) — index 2 is out of range
    mockGetSelectableDays.mockReturnValue([{} as never, {} as never]);

    const response = await POST(makeRequest("plan-1", { planDayIndex: 2 }), params);

    // Raw content.days.length is 3 but selectable is 2, so index 2 is invalid
    expect(response.status).toBe(400);
  });
});
