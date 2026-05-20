import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock modules
vi.mock("@/lib/auth-config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    mealLog: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    profile: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { getDailyMacros, deleteMealLog } from "@/actions/diario";

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);

describe("diario server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });
  });

  describe("getDailyMacros", () => {
    it("should throw error when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);
      await expect(getDailyMacros("2024-01-01")).rejects.toThrow("No autenticado");
    });

    it("should return consumed macros and meals for a given date", async () => {
      mockPrisma.mealLog.findMany.mockResolvedValue([
        {
          id: "log-1",
          userId: "user-1",
          date: new Date("2024-01-01"),
          mealType: "breakfast",
          rawInput: "2 huevos y tostada",
          interpretedFoods: [
            { calories: 200, protein: 12, carbs: 20, fat: 10 },
          ],
          totalCalories: 200,
          createdAt: new Date("2024-01-01T08:00:00"),
        },
      ]);
      mockPrisma.profile.findUnique.mockResolvedValue({
        targetCalories: 2000,
        targetProtein: 150,
        targetCarbs: 250,
        targetFat: 65,
      } as any);

      const result = await getDailyMacros("2024-01-01");

      expect(result.consumed.calories).toBe(200);
      expect(result.consumed.protein).toBe(12);
      expect(result.targets.calories).toBe(2000);
      expect(result.meals).toHaveLength(1);
    });

    it("should use default targets when no profile exists", async () => {
      mockPrisma.mealLog.findMany.mockResolvedValue([]);
      mockPrisma.profile.findUnique.mockResolvedValue(null);

      const result = await getDailyMacros("2024-01-01");

      expect(result.targets.calories).toBe(2000);
      expect(result.targets.protein).toBe(150);
      expect(result.targets.carbs).toBe(250);
      expect(result.targets.fat).toBe(65);
    });
  });

  describe("deleteMealLog", () => {
    it("should return error when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);
      const result = await deleteMealLog("log-1");
      expect(result).toEqual({ success: false, error: "No autenticado" });
    });

    it("should return error when meal log not found", async () => {
      mockPrisma.mealLog.findFirst.mockResolvedValue(null);
      const result = await deleteMealLog("log-999");
      expect(result).toEqual({ success: false, error: "Registro no encontrado" });
    });

    it("should delete meal log when found", async () => {
      mockPrisma.mealLog.findFirst.mockResolvedValue({
        id: "log-1",
        userId: "user-1",
      } as any);
      mockPrisma.mealLog.delete.mockResolvedValue({} as any);

      const result = await deleteMealLog("log-1");

      expect(result.success).toBe(true);
      expect(mockPrisma.mealLog.delete).toHaveBeenCalledWith({
        where: { id: "log-1" },
      });
    });
  });
});
