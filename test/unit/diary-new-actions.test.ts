import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock modules before importing actions
vi.mock("@/lib/auth-config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    diaryEntry: {
      count: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    profile: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/openai", () => ({
  suggestMeal: vi.fn(),
}));

import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { suggestMeal } from "@/lib/openai";
import { getSuggestion, saveSuggestedMeal } from "@/actions/diary-new";

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);
const mockSuggestMeal = vi.mocked(suggestMeal);

// ─── getSuggestion — post T-03 behaviour ─────────────────────────────────────

describe("getSuggestion — T-03 (no rate-limit, history threading)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });
  });

  it("returns unauthenticated error when no session", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await getSuggestion({
      date: new Date("2024-01-15"),
      mealType: "dinner",
      query: "Something light",
    });
    expect(result).toEqual({ success: false, error: "unauthenticated" });
    expect(mockSuggestMeal).not.toHaveBeenCalled();
  });

  it("does NOT call prisma.diaryEntry.count (rate-limit removed)", async () => {
    mockPrisma.diaryEntry.findMany.mockResolvedValue([]);
    mockPrisma.profile.findUnique.mockResolvedValue({
      targetCalories: 2000,
      targetProtein: 150,
      targetCarbs: 250,
      targetFat: 65,
      allergies: [],
    } as any);
    mockSuggestMeal.mockResolvedValue({
      message: "Great choice!",
      suggestion: {
        foodName: "Chicken",
        quantity: 200,
        unit: "g",
        calories: 330,
        protein: 62,
        carbs: 0,
        fat: 7,
      },
    } as any);

    await getSuggestion({
      date: new Date("2024-01-15"),
      mealType: "dinner",
      query: "Something light",
    });

    expect(mockPrisma.diaryEntry.count).not.toHaveBeenCalled();
  });

  it("returns turn_limit_exceeded when history.length >= 20 WITHOUT calling suggestMeal", async () => {
    const history = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant" as const,
      text: `message ${i}`,
    }));

    const result = await getSuggestion({
      date: new Date("2024-01-15"),
      mealType: "dinner",
      query: "one more",
      history,
    });

    expect(result).toEqual({ success: false, error: "turn_limit_exceeded" });
    expect(mockSuggestMeal).not.toHaveBeenCalled();
    expect(mockPrisma.diaryEntry.count).not.toHaveBeenCalled();
  });

  it("passes history to suggestMeal when history is provided", async () => {
    const history = [
      { role: "user" as const, text: "I want something light" },
      { role: "assistant" as const, text: "How about a salad?" },
    ];

    mockPrisma.diaryEntry.findMany.mockResolvedValue([]);
    mockPrisma.profile.findUnique.mockResolvedValue({
      targetCalories: 2000,
      targetProtein: 150,
      targetCarbs: 250,
      targetFat: 65,
      allergies: [],
    } as any);
    mockSuggestMeal.mockResolvedValue({
      message: "Great option!",
      suggestion: {
        foodName: "Chicken",
        quantity: 200,
        unit: "g",
        calories: 330,
        protein: 62,
        carbs: 0,
        fat: 7,
      },
    } as any);

    const result = await getSuggestion({
      date: new Date("2024-01-15"),
      mealType: "dinner",
      query: "give me chicken",
      history,
    });

    expect(result.success).toBe(true);
    expect(result.result?.message).toBe("Great option!");
    expect(result.result?.suggestion.foodName).toBe("Chicken");

    // Confirm history was passed to suggestMeal
    expect(mockSuggestMeal).toHaveBeenCalledWith(
      expect.objectContaining({ history })
    );
  });

  it("succeeds even when user has 6 prior getSuggestion calls (no per-query cap)", async () => {
    // The important thing: count is never called, and suggestMeal succeeds
    mockPrisma.diaryEntry.findMany.mockResolvedValue([]);
    mockPrisma.profile.findUnique.mockResolvedValue({
      targetCalories: 2000,
      targetProtein: 150,
      targetCarbs: 250,
      targetFat: 65,
      allergies: [],
    } as any);
    mockSuggestMeal.mockResolvedValue({
      message: "Delicious!",
      suggestion: {
        foodName: "Salad",
        quantity: 300,
        unit: "g",
        calories: 200,
        protein: 10,
        carbs: 20,
        fat: 8,
      },
    } as any);

    // Call 6 times — all should succeed since rate-limit is gone
    for (let i = 0; i < 6; i++) {
      vi.clearAllMocks();
      mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });
      mockPrisma.diaryEntry.findMany.mockResolvedValue([]);
      mockPrisma.profile.findUnique.mockResolvedValue({
        targetCalories: 2000, targetProtein: 150, targetCarbs: 250, targetFat: 65, allergies: [],
      } as any);
      mockSuggestMeal.mockResolvedValue({
        message: "Delicious!",
        suggestion: { foodName: "Salad", quantity: 300, unit: "g", calories: 200, protein: 10, carbs: 20, fat: 8 },
      } as any);

      const result = await getSuggestion({
        date: new Date("2024-01-15"),
        mealType: "dinner",
        query: `call number ${i + 1}`,
      });

      expect(result.success).toBe(true);
      expect(mockPrisma.diaryEntry.count).not.toHaveBeenCalled();
    }
  });
});

// ─── saveSuggestedMeal — T-04 (rate-limit moved here) ────────────────────────

describe("saveSuggestedMeal — T-04 (rate-limit at accept)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });
  });

  const validSuggestion = {
    foodName: "Grilled chicken",
    quantity: 200,
    unit: "g",
    calories: 330,
    protein: 62,
    carbs: 0,
    fat: 7,
  };

  it("returns unauthenticated error when no session", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await saveSuggestedMeal({
      date: new Date("2024-01-15"),
      mealType: "dinner",
      suggestion: validSuggestion,
    });
    expect(result).toEqual({ success: false, error: "unauthenticated" });
    expect(mockPrisma.diaryEntry.upsert).not.toHaveBeenCalled();
  });

  it("returns rate_limit_exceeded when user has 5 accepted AI meals today", async () => {
    mockPrisma.diaryEntry.count.mockResolvedValue(5);

    const result = await saveSuggestedMeal({
      date: new Date("2024-01-15"),
      mealType: "dinner",
      suggestion: validSuggestion,
    });

    expect(result).toEqual({ success: false, error: "rate_limit_exceeded" });
    expect(mockPrisma.diaryEntry.upsert).not.toHaveBeenCalled();
  });

  it("calls upsert when user has 4 accepted AI meals today (below cap)", async () => {
    mockPrisma.diaryEntry.count.mockResolvedValue(4);
    mockPrisma.diaryEntry.upsert.mockResolvedValue({ id: "entry-1" } as any);

    const result = await saveSuggestedMeal({
      date: new Date("2024-01-15"),
      mealType: "dinner",
      suggestion: validSuggestion,
    });

    expect(result).toEqual({ success: true });
    expect(mockPrisma.diaryEntry.upsert).toHaveBeenCalled();
  });

  it("calls upsert when user has 0 accepted AI meals today", async () => {
    mockPrisma.diaryEntry.count.mockResolvedValue(0);
    mockPrisma.diaryEntry.upsert.mockResolvedValue({ id: "entry-1" } as any);

    const result = await saveSuggestedMeal({
      date: new Date("2024-01-15"),
      mealType: "dinner",
      suggestion: validSuggestion,
    });

    expect(result).toEqual({ success: true });
    expect(mockPrisma.diaryEntry.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          completed: true,
          actualCalories: 330,
          aiSuggestion: expect.stringContaining("Grilled chicken"),
        }),
      })
    );
  });
});
