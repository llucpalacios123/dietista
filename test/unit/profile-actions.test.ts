import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock modules before imports
vi.mock("@/lib/auth-config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    profile: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { updateProfile, createProfile } from "@/actions/profile";

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);
const mockRevalidatePath = vi.mocked(revalidatePath);

// ─── Helpers ──────────────────────────────────────────────────────────────

function makeProfileFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set("weight", "70");
  fd.set("height", "175");
  fd.set("age", "30");
  fd.set("sex", "male");
  fd.set("goal", "maintain");
  fd.set("activityLevel", "moderate");
  fd.set("mealsPerDay", "3");
  fd.set("includeSnacks", "false");
  fd.set("budgetFriendly", "false");
  fd.set("allergies", "[]");
  fd.set("forbiddenFoods", "[]");
  fd.set("favoriteFoods", "[]");
  for (const [k, v] of Object.entries(overrides)) {
    fd.set(k, v);
  }
  return fd;
}

// ─── updateProfile — revalidatePath ──────────────────────────────────────

describe("updateProfile — revalidatePath", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });
    mockPrisma.user.findUnique.mockResolvedValue({ id: "user-1" } as any);
    mockPrisma.profile.upsert.mockResolvedValue({} as any);
  });

  it("calls revalidatePath with ('/', 'layout') after successful update", async () => {
    const result = await updateProfile(null, makeProfileFormData());

    expect(result.success).toBe(true);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("does NOT call revalidatePath with '/profile'", async () => {
    await updateProfile(null, makeProfileFormData());

    const calls = mockRevalidatePath.mock.calls;
    const legacyCall = calls.find((c) => c[0] === "/profile");
    expect(legacyCall).toBeUndefined();
  });

  it("does NOT call revalidatePath with '/dashboard'", async () => {
    await updateProfile(null, makeProfileFormData());

    const calls = mockRevalidatePath.mock.calls;
    const legacyCall = calls.find((c) => c[0] === "/dashboard");
    expect(legacyCall).toBeUndefined();
  });
});

// ─── createProfile — revalidatePath ──────────────────────────────────────

describe("createProfile — revalidatePath", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });
    mockPrisma.profile.findUnique.mockResolvedValue(null); // no existing profile
    mockPrisma.profile.create.mockResolvedValue({} as any);
  });

  it("calls revalidatePath with ('/', 'layout') after successful create", async () => {
    const result = await createProfile(null, makeProfileFormData());

    expect(result.success).toBe(true);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("does NOT call revalidatePath with '/profile' or '/dashboard'", async () => {
    await createProfile(null, makeProfileFormData());

    const calls = mockRevalidatePath.mock.calls;
    expect(calls.find((c) => c[0] === "/profile")).toBeUndefined();
    expect(calls.find((c) => c[0] === "/dashboard")).toBeUndefined();
  });
});

// ─── updateProfile — upsert ───────────────────────────────────────────────

describe("updateProfile — upsert", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });
    mockPrisma.user.findUnique.mockResolvedValue({ id: "user-1" } as any);
  });

  it("calls prisma.profile.upsert (not update) on happy path", async () => {
    mockPrisma.profile.upsert.mockResolvedValue({} as any);

    const result = await updateProfile(null, makeProfileFormData());

    expect(result.success).toBe(true);
    expect(mockPrisma.profile.upsert).toHaveBeenCalledOnce();
    expect(mockPrisma.profile.update).not.toHaveBeenCalled();
  });

  it("calls upsert with where: { userId } and both create and update keys", async () => {
    mockPrisma.profile.upsert.mockResolvedValue({} as any);

    await updateProfile(null, makeProfileFormData());

    const call = mockPrisma.profile.upsert.mock.calls[0][0];
    expect(call.where).toEqual({ userId: "user-1" });
    expect(call.create).toBeDefined();
    expect(call.update).toBeDefined();
  });

  it("create block includes userId", async () => {
    mockPrisma.profile.upsert.mockResolvedValue({} as any);

    await updateProfile(null, makeProfileFormData());

    const call = mockPrisma.profile.upsert.mock.calls[0][0];
    expect(call.create.userId).toBe("user-1");
  });

  it("returns { success: true } without throwing — simulates missing profile (was P2025 before)", async () => {
    // With upsert this should never throw P2025; if it did, the promise would reject
    mockPrisma.profile.upsert.mockResolvedValue({} as any);

    const result = await updateProfile(null, makeProfileFormData());

    expect(result.success).toBe(true);
  });

  it("returns { success: false } and propagates non-upsert errors", async () => {
    mockPrisma.profile.upsert.mockRejectedValue(new Error("constraint violation"));

    const result = await updateProfile(null, makeProfileFormData());

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
