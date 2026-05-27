import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock modules before imports
vi.mock("@/lib/auth-config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workoutSession: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    workoutSet: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { POST as sessionsPost } from "@/app/api/gym/sessions/route";
import { POST as setsPost } from "@/app/api/gym/sets/route";
import { DELETE as setsDelete } from "@/app/api/gym/sets/[id]/route";

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);

function makeRequest(body?: unknown): Request {
  return new Request("http://localhost", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

function makeDeleteRequest(): Request {
  return new Request("http://localhost", {
    method: "DELETE",
  });
}

// ─── POST /api/gym/sessions ────────────────────────────────────────────────

describe("POST /api/gym/sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await sessionsPost(makeRequest());
    expect(response.status).toBe(401);
  });

  it("returns 200 with { id } when a session already exists today", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });
    mockPrisma.workoutSession.findFirst.mockResolvedValue({
      id: "session-existing",
      userId: "user-1",
      date: new Date(),
      notes: null,
      createdAt: new Date(),
    });

    const response = await sessionsPost(makeRequest());
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({ id: "session-existing" });
  });

  it("returns 201 with { id } when no session exists today", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });
    mockPrisma.workoutSession.findFirst.mockResolvedValue(null);
    mockPrisma.workoutSession.create.mockResolvedValue({
      id: "session-new",
      userId: "user-1",
      date: new Date(),
      notes: null,
      createdAt: new Date(),
    });

    const response = await sessionsPost(makeRequest());
    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json).toEqual({ id: "session-new" });
  });
});

// ─── POST /api/gym/sets ────────────────────────────────────────────────────

describe("POST /api/gym/sets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await setsPost(makeRequest({
      sessionId: "session-1",
      exerciseName: "Sentadilla",
      muscleGroup: "legs",
      reps: 10,
    }));
    expect(response.status).toBe(401);
  });

  it("returns 400 when required fields are missing", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });

    // Missing exerciseName and reps
    const response = await setsPost(makeRequest({
      sessionId: "session-1",
      muscleGroup: "legs",
    }));
    expect(response.status).toBe(400);
  });

  it("returns 403 when session belongs to a different user", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });
    mockPrisma.workoutSession.findFirst.mockResolvedValue(null); // not found for user-1

    const response = await setsPost(makeRequest({
      sessionId: "session-other",
      exerciseName: "Sentadilla",
      muscleGroup: "legs",
      reps: 10,
    }));
    expect(response.status).toBe(403);
  });

  it("returns 201 with the created set on success", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });
    mockPrisma.workoutSession.findFirst.mockResolvedValue({
      id: "session-1",
      userId: "user-1",
      date: new Date(),
      notes: null,
      createdAt: new Date(),
    });
    mockPrisma.workoutSet.count.mockResolvedValue(2); // 2 existing sets → setNumber = 3
    mockPrisma.workoutSet.create.mockResolvedValue({
      id: "set-1",
      sessionId: "session-1",
      exerciseName: "Sentadilla",
      muscleGroup: "legs",
      setNumber: 3,
      reps: 10,
      weightKg: 80,
      notes: null,
      createdAt: new Date(),
    });

    const response = await setsPost(makeRequest({
      sessionId: "session-1",
      exerciseName: "Sentadilla",
      muscleGroup: "legs",
      reps: 10,
      weightKg: 80,
    }));
    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.id).toBe("set-1");
    expect(json.setNumber).toBe(3);
  });
});

// ─── DELETE /api/gym/sets/[id] ─────────────────────────────────────────────

describe("DELETE /api/gym/sets/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await setsDelete(makeDeleteRequest(), {
      params: Promise.resolve({ id: "set-1" }),
    });
    expect(response.status).toBe(401);
  });

  it("returns 404 when set is not found", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });
    mockPrisma.workoutSet.findUnique.mockResolvedValue(null);

    const response = await setsDelete(makeDeleteRequest(), {
      params: Promise.resolve({ id: "nonexistent" }),
    });
    expect(response.status).toBe(404);
  });

  it("returns 403 when set belongs to a different user", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });
    mockPrisma.workoutSet.findUnique.mockResolvedValue({
      id: "set-1",
      sessionId: "session-2",
      exerciseName: "Sentadilla",
      muscleGroup: "legs",
      setNumber: 1,
      reps: 10,
      weightKg: null,
      notes: null,
      createdAt: new Date(),
      session: {
        id: "session-2",
        userId: "user-2", // different user
        date: new Date(),
        notes: null,
        createdAt: new Date(),
      },
    });

    const response = await setsDelete(makeDeleteRequest(), {
      params: Promise.resolve({ id: "set-1" }),
    });
    expect(response.status).toBe(403);
  });

  it("returns 204 when set is deleted successfully", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });
    mockPrisma.workoutSet.findUnique.mockResolvedValue({
      id: "set-1",
      sessionId: "session-1",
      exerciseName: "Sentadilla",
      muscleGroup: "legs",
      setNumber: 1,
      reps: 10,
      weightKg: null,
      notes: null,
      createdAt: new Date(),
      session: {
        id: "session-1",
        userId: "user-1", // same user
        date: new Date(),
        notes: null,
        createdAt: new Date(),
      },
    });
    mockPrisma.workoutSet.delete.mockResolvedValue({
      id: "set-1",
      sessionId: "session-1",
      exerciseName: "Sentadilla",
      muscleGroup: "legs",
      setNumber: 1,
      reps: 10,
      weightKg: null,
      notes: null,
      createdAt: new Date(),
    });

    const response = await setsDelete(makeDeleteRequest(), {
      params: Promise.resolve({ id: "set-1" }),
    });
    expect(response.status).toBe(204);
  });
});
