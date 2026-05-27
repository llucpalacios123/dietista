import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth-config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    weightLog: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    progressSnapshot: {
      findMany: vi.fn(),
    },
  },
}));

const { auth } = await import("@/lib/auth-config");
const { prisma } = await import("@/lib/prisma");
const { POST } = await import("@/app/api/progress/route");

const mockAuth = vi.mocked(auth);
const mockUpsert = vi.mocked(prisma.weightLog.upsert);

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/progress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as never);

    const response = await POST(makePostRequest({ weight: 72.5 }));
    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid weight (negative)", async () => {
    mockAuth.mockResolvedValue({ userId: "user1" } as never);

    const response = await POST(makePostRequest({ weight: -5 }));
    expect(response.status).toBe(400);

    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("returns 400 for weight below 30", async () => {
    mockAuth.mockResolvedValue({ userId: "user1" } as never);

    const response = await POST(makePostRequest({ weight: 10 }));
    expect(response.status).toBe(400);
  });

  describe("UTC midnight normalization (triangulation)", () => {
    it("normalizes date with time offset to UTC midnight", async () => {
      mockAuth.mockResolvedValue({ userId: "user1" } as never);
      mockUpsert.mockResolvedValue({
        id: "entry1",
        userId: "user1",
        weight: 72.5,
        date: new Date("2024-03-15T00:00:00.000Z"),
        notes: null,
        createdAt: new Date(),
      });

      // Client in UTC+2 submitting with their local time
      await POST(makePostRequest({
        weight: 72.5,
        date: "2024-03-15T14:30:00.000Z",
      }));

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_date: {
              userId: "user1",
              date: new Date("2024-03-15T00:00:00.000Z"),
            },
          },
        }),
      );
    });

    it("upserts on same-day second POST (no duplicate row)", async () => {
      mockAuth.mockResolvedValue({ userId: "user1" } as never);
      const expectedDate = new Date("2024-03-15T00:00:00.000Z");
      mockUpsert.mockResolvedValue({
        id: "entry1",
        userId: "user1",
        weight: 73.0,
        date: expectedDate,
        notes: null,
        createdAt: new Date(),
      });

      // First POST
      await POST(makePostRequest({ weight: 72.5, date: "2024-03-15T00:00:00.000Z" }));
      // Second POST same day
      await POST(makePostRequest({ weight: 73.0, date: "2024-03-15T00:00:00.000Z" }));

      // Both calls go to upsert (not create separately)
      expect(mockUpsert).toHaveBeenCalledTimes(2);
      // Both target the same userId_date key
      const calls = mockUpsert.mock.calls;
      const firstDate = (calls[0][0] as { where: { userId_date: { date: Date } } }).where.userId_date.date;
      const secondDate = (calls[1][0] as { where: { userId_date: { date: Date } } }).where.userId_date.date;
      expect(firstDate.getTime()).toBe(expectedDate.getTime());
      expect(secondDate.getTime()).toBe(expectedDate.getTime());
    });
  });
});
