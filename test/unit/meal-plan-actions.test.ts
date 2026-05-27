import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock modules before imports
vi.mock("@/lib/auth-config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    mealPlan: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { activatePlan, renamePlan } from "@/actions/meal-plan";

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);
const mockRevalidatePath = vi.mocked(revalidatePath);

// ─── activatePlan ─────────────────────────────────────────────────────────

describe("activatePlan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: $transaction invokes the callback synchronously
    mockPrisma.$transaction.mockImplementation(async (cb) => {
      return await cb(mockPrisma);
    });
  });

  it("returns { success: false, error: 'Unauthorized' } when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await activatePlan("plan-1");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Unauthorized");
    expect(mockPrisma.mealPlan.findUnique).not.toHaveBeenCalled();
  });

  it("returns { success: false, error: 'Not found' } when plan does not exist", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });
    mockPrisma.mealPlan.findUnique.mockResolvedValue(null);

    const result = await activatePlan("nonexistent-plan");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Not found");
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("returns { success: false, error: 'Not found' } when plan belongs to different user", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });
    mockPrisma.mealPlan.findUnique.mockResolvedValue({
      id: "plan-2",
      userId: "user-2", // different user
      status: "draft",
      startDate: new Date(),
      endDate: new Date(),
      name: null,
      totalCalories: null,
      templateId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await activatePlan("plan-2");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Not found");
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("runs transaction and sets target plan to active, other active plans to completed", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });
    mockPrisma.mealPlan.findUnique.mockResolvedValue({
      id: "plan-1",
      userId: "user-1",
      status: "draft",
      startDate: new Date(),
      endDate: new Date(),
      name: null,
      totalCalories: null,
      templateId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockPrisma.mealPlan.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.mealPlan.update.mockResolvedValue({} as any);

    const result = await activatePlan("plan-1");

    expect(result.success).toBe(true);
    expect(mockPrisma.$transaction).toHaveBeenCalledOnce();
    expect(mockPrisma.mealPlan.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-1", status: "active", id: { not: "plan-1" } },
      data: { status: "completed" },
    });
    expect(mockPrisma.mealPlan.update).toHaveBeenCalledWith({
      where: { id: "plan-1" },
      data: { status: "active" },
    });
  });

  it("calls revalidatePath for /planes and /diario after successful activation", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });
    mockPrisma.mealPlan.findUnique.mockResolvedValue({
      id: "plan-1",
      userId: "user-1",
      status: "completed",
      startDate: new Date(),
      endDate: new Date(),
      name: null,
      totalCalories: null,
      templateId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockPrisma.mealPlan.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.mealPlan.update.mockResolvedValue({} as any);

    await activatePlan("plan-1");

    expect(mockRevalidatePath).toHaveBeenCalledWith("/planes");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/diario");
  });
});

// ─── renamePlan ───────────────────────────────────────────────────────────

describe("renamePlan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns { success: false, error: 'Unauthorized' } when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await renamePlan("plan-1", "New Name");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Unauthorized");
    expect(mockPrisma.mealPlan.findUnique).not.toHaveBeenCalled();
  });

  it("returns { success: false, error: 'Not found' } when plan belongs to different user", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });
    mockPrisma.mealPlan.findUnique.mockResolvedValue({
      id: "plan-2",
      userId: "user-2",
      status: "active",
      startDate: new Date(),
      endDate: new Date(),
      name: null,
      totalCalories: null,
      templateId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await renamePlan("plan-2", "New Name");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Not found");
    expect(mockPrisma.mealPlan.update).not.toHaveBeenCalled();
  });

  it("saves the trimmed name and returns { success: true }", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });
    mockPrisma.mealPlan.findUnique.mockResolvedValue({
      id: "plan-1",
      userId: "user-1",
      status: "active",
      startDate: new Date(),
      endDate: new Date(),
      name: null,
      totalCalories: null,
      templateId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockPrisma.mealPlan.update.mockResolvedValue({} as any);

    const result = await renamePlan("plan-1", "  Semana de proteínas  ");

    expect(result.success).toBe(true);
    expect(mockPrisma.mealPlan.update).toHaveBeenCalledWith({
      where: { id: "plan-1" },
      data: { name: "Semana de proteínas" },
    });
  });

  it("saves name as null when empty string is provided", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });
    mockPrisma.mealPlan.findUnique.mockResolvedValue({
      id: "plan-1",
      userId: "user-1",
      status: "active",
      startDate: new Date(),
      endDate: new Date(),
      name: "Old Name",
      totalCalories: null,
      templateId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockPrisma.mealPlan.update.mockResolvedValue({} as any);

    const result = await renamePlan("plan-1", "   ");

    expect(result.success).toBe(true);
    expect(mockPrisma.mealPlan.update).toHaveBeenCalledWith({
      where: { id: "plan-1" },
      data: { name: null },
    });
  });

  it("returns { success: false, error: 'Name too long' } when name exceeds 60 chars", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });

    const result = await renamePlan("plan-1", "a".repeat(61));

    expect(result.success).toBe(false);
    expect(result.error).toBe("Name too long");
    expect(mockPrisma.mealPlan.findUnique).not.toHaveBeenCalled();
  });
});
