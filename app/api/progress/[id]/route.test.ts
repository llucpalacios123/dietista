import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// --- Mocks must be declared before dynamic imports ---
vi.mock("@/lib/auth-config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    weightLog: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Dynamic imports after mocks so mock is applied
const { auth } = await import("@/lib/auth-config");
const { prisma } = await import("@/lib/prisma");
const { DELETE } = await import("@/app/api/progress/[id]/route");

const mockAuth = vi.mocked(auth);
const mockFindUnique = vi.mocked(prisma.weightLog.findUnique);
const mockDelete = vi.mocked(prisma.weightLog.delete);

function makeRequest(id: string): NextRequest {
  return new NextRequest(`http://localhost/api/progress/${id}`, {
    method: "DELETE",
  });
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("DELETE /api/progress/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as never);

    const response = await DELETE(makeRequest("abc123"), makeParams("abc123"));
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  it("returns 404 when entry does not exist", async () => {
    mockAuth.mockResolvedValue({ userId: "user1" } as never);
    mockFindUnique.mockResolvedValue(null);

    const response = await DELETE(makeRequest("nonexistent"), makeParams("nonexistent"));
    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  it("returns 403 when authenticated user does not own the entry", async () => {
    mockAuth.mockResolvedValue({ userId: "userB" } as never);
    mockFindUnique.mockResolvedValue({
      id: "abc123",
      userId: "userA",
      weight: 72.5,
      date: new Date("2024-03-15T00:00:00.000Z"),
      notes: null,
      createdAt: new Date(),
    });

    const response = await DELETE(makeRequest("abc123"), makeParams("abc123"));
    expect(response.status).toBe(403);

    const body = await response.json();
    expect(body).toHaveProperty("error");

    // Entry must NOT be deleted
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("returns 200 and deletes entry when owner makes request", async () => {
    mockAuth.mockResolvedValue({ userId: "user1" } as never);
    mockFindUnique.mockResolvedValue({
      id: "abc123",
      userId: "user1",
      weight: 72.5,
      date: new Date("2024-03-15T00:00:00.000Z"),
      notes: null,
      createdAt: new Date(),
    });
    mockDelete.mockResolvedValue({
      id: "abc123",
      userId: "user1",
      weight: 72.5,
      date: new Date("2024-03-15T00:00:00.000Z"),
      notes: null,
      createdAt: new Date(),
    });

    const response = await DELETE(makeRequest("abc123"), makeParams("abc123"));
    expect(response.status).toBe(200);

    expect(mockDelete).toHaveBeenCalledWith({
      where: { id: "abc123" },
    });
  });
});
