import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock modules before imports
vi.mock("@/lib/auth-config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn((cb: (tx: unknown) => unknown) => cb({
      workoutSet: {
        create: vi.fn(),
      },
    })),
    workoutSession: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    workoutSet: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { bulkWorkoutSetSchema, executeSetSchema } from "@/lib/schemas";
import { POST as sessionsPost } from "@/app/api/gym/sessions/route";
import { POST as setsPost } from "@/app/api/gym/sets/route";
import { DELETE as setsDelete, PATCH as setsPatch } from "@/app/api/gym/sets/[id]/route";
import { POST as bulkSetsPost } from "@/app/api/gym/sets/bulk/route";

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

function makePatchRequest(body?: unknown): Request {
  return new Request("http://localhost", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

// ─── POST /api/gym/sets/bulk ───────────────────────────────────────────────

describe("POST /api/gym/sets/bulk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await bulkSetsPost(makeRequest({
      sessionId: "session-1",
      exerciseName: "Bench Press",
      muscleGroup: "chest",
      sets: [{ setNumber: 1, plannedReps: 8, plannedWeightKg: 80 }],
    }));
    expect(response.status).toBe(401);
  });

  it("returns 400 when sets array is empty", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });

    const response = await bulkSetsPost(makeRequest({
      sessionId: "session-1",
      exerciseName: "Bench Press",
      muscleGroup: "chest",
      sets: [],
    }));
    expect(response.status).toBe(400);
  });

  it("returns 400 when sets array exceeds 20 entries", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });

    const sets = Array.from({ length: 21 }, (_, i) => ({
      setNumber: i + 1,
      plannedReps: 8,
    }));
    const response = await bulkSetsPost(makeRequest({
      sessionId: "session-1",
      exerciseName: "Bench Press",
      muscleGroup: "chest",
      sets,
    }));
    expect(response.status).toBe(400);
  });

  it("returns 403 when session belongs to a different user", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });
    mockPrisma.workoutSession.findFirst.mockResolvedValue(null); // not found for user-1

    const response = await bulkSetsPost(makeRequest({
      sessionId: "session-other",
      exerciseName: "Bench Press",
      muscleGroup: "chest",
      sets: [{ setNumber: 1, plannedReps: 8 }],
    }));
    expect(response.status).toBe(403);
  });

  it("returns 201 with {sets:[{id,setNumber}]} on success, $transaction called once", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });
    mockPrisma.workoutSession.findFirst.mockResolvedValue({
      id: "session-1",
      userId: "user-1",
      date: new Date(),
      notes: null,
      createdAt: new Date(),
    });

    const createdSets = [
      { id: "set-1", setNumber: 1 },
      { id: "set-2", setNumber: 2 },
      { id: "set-3", setNumber: 3 },
      { id: "set-4", setNumber: 4 },
    ];

    // $transaction receives an array of promises, resolve them all
    mockPrisma.$transaction.mockResolvedValue(
      createdSets.map((s) => ({
        id: s.id,
        sessionId: "session-1",
        exerciseName: "Bench Press",
        muscleGroup: "chest",
        setNumber: s.setNumber,
        plannedReps: 8,
        plannedWeightKg: 80,
        reps: null,
        weightKg: null,
        notes: null,
        createdAt: new Date(),
      })),
    );

    const sets = Array.from({ length: 4 }, (_, i) => ({
      setNumber: i + 1,
      plannedReps: 8,
      plannedWeightKg: 80,
    }));

    const response = await bulkSetsPost(makeRequest({
      sessionId: "session-1",
      exerciseName: "Bench Press",
      muscleGroup: "chest",
      sets,
    }));
    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json).toHaveProperty("sets");
    expect(json.sets).toHaveLength(4);
    expect(json.sets[0]).toHaveProperty("id");
    expect(json.sets[0]).toHaveProperty("setNumber");
    expect(mockPrisma.$transaction).toHaveBeenCalledOnce();
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

// ─── PATCH /api/gym/sets/[id] ──────────────────────────────────────────────

describe("PATCH /api/gym/sets/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await setsPatch(makePatchRequest({ reps: 8 }), {
      params: Promise.resolve({ id: "set-1" }),
    });
    expect(response.status).toBe(401);
  });

  it("returns 404 when set is not found", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });
    mockPrisma.workoutSet.findUnique.mockResolvedValue(null);

    const response = await setsPatch(makePatchRequest({ reps: 8 }), {
      params: Promise.resolve({ id: "nonexistent" }),
    });
    expect(response.status).toBe(404);
  });

  it("returns 403 when set belongs to a different user", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });
    mockPrisma.workoutSet.findUnique.mockResolvedValue({
      id: "set-1",
      sessionId: "session-2",
      exerciseName: "Bench Press",
      muscleGroup: "chest",
      setNumber: 1,
      reps: null,
      weightKg: null,
      notes: null,
      createdAt: new Date(),
      session: {
        id: "session-2",
        userId: "user-2",
        date: new Date(),
        notes: null,
        createdAt: new Date(),
      },
    });

    const response = await setsPatch(makePatchRequest({ reps: 8 }), {
      params: Promise.resolve({ id: "set-1" }),
    });
    expect(response.status).toBe(403);
  });

  it("returns 200 with updated set when reps and weightKg provided", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });
    mockPrisma.workoutSet.findUnique.mockResolvedValue({
      id: "set-1",
      sessionId: "session-1",
      exerciseName: "Bench Press",
      muscleGroup: "chest",
      setNumber: 1,
      reps: null,
      weightKg: null,
      notes: null,
      createdAt: new Date(),
      session: {
        id: "session-1",
        userId: "user-1",
        date: new Date(),
        notes: null,
        createdAt: new Date(),
      },
    });
    mockPrisma.workoutSet.update.mockResolvedValue({
      id: "set-1",
      sessionId: "session-1",
      exerciseName: "Bench Press",
      muscleGroup: "chest",
      setNumber: 1,
      reps: 8,
      weightKg: 80,
      plannedReps: 8,
      plannedWeightKg: 80,
      notes: null,
      createdAt: new Date(),
    });

    const response = await setsPatch(makePatchRequest({ reps: 8, weightKg: 80 }), {
      params: Promise.resolve({ id: "set-1" }),
    });
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.reps).toBe(8);
    expect(json.weightKg).toBe(80);
  });

  it("returns 400 when reps is missing from execute payload", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });

    const response = await setsPatch(makePatchRequest({}), {
      params: Promise.resolve({ id: "set-1" }),
    });
    expect(response.status).toBe(400);
  });

  it("returns 200 idempotently when re-executing an already-executed set", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });
    mockPrisma.workoutSet.findUnique.mockResolvedValue({
      id: "set-1",
      sessionId: "session-1",
      exerciseName: "Bench Press",
      muscleGroup: "chest",
      setNumber: 1,
      reps: 10, // already executed
      weightKg: 75,
      notes: null,
      createdAt: new Date(),
      session: {
        id: "session-1",
        userId: "user-1",
        date: new Date(),
        notes: null,
        createdAt: new Date(),
      },
    });
    mockPrisma.workoutSet.update.mockResolvedValue({
      id: "set-1",
      sessionId: "session-1",
      exerciseName: "Bench Press",
      muscleGroup: "chest",
      setNumber: 1,
      reps: 8,
      weightKg: 75,
      plannedReps: 10,
      plannedWeightKg: null,
      notes: null,
      createdAt: new Date(),
    });

    const response = await setsPatch(makePatchRequest({ reps: 8, weightKg: 75 }), {
      params: Promise.resolve({ id: "set-1" }),
    });
    expect(response.status).toBe(200);
  });
});

// ─── Zod schema contracts ──────────────────────────────────────────────────

describe("executeSetSchema", () => {
  it("rejects payload with missing reps", () => {
    const result = executeSetSchema.safeParse({ weightKg: 80 });
    expect(result.success).toBe(false);
  });

  it("accepts payload with reps and optional weightKg", () => {
    expect(executeSetSchema.safeParse({ reps: 8 }).success).toBe(true);
    expect(executeSetSchema.safeParse({ reps: 8, weightKg: 80 }).success).toBe(true);
  });
});

describe("bulkWorkoutSetSchema", () => {
  it("accepts set items without reps field (planned state)", () => {
    const result = bulkWorkoutSetSchema.safeParse({
      sessionId: "session-1",
      exerciseName: "Bench Press",
      muscleGroup: "chest",
      sets: [{ setNumber: 1, plannedReps: 8 }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects set items with zero plannedReps", () => {
    const result = bulkWorkoutSetSchema.safeParse({
      sessionId: "session-1",
      exerciseName: "Bench Press",
      muscleGroup: "chest",
      sets: [{ setNumber: 1, plannedReps: 0 }],
    });
    expect(result.success).toBe(false);
  });
});
