import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── T-06: saveSuggestedMeal — ownership check + prisma.$transaction ──────────

vi.mock("@/lib/auth-config", () => ({
  auth: vi.fn(),
}));

const {
  mockMealFindFirst,
  mockMealUpdate,
  mockDiaryEntryUpsert,
  mockDiaryEntryCount,
  mockTransaction,
} = vi.hoisted(() => ({
  mockMealFindFirst: vi.fn(),
  mockMealUpdate: vi.fn(),
  mockDiaryEntryUpsert: vi.fn(),
  mockDiaryEntryCount: vi.fn(),
  mockTransaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    meal: {
      findFirst: mockMealFindFirst,
      update: mockMealUpdate,
    },
    diaryEntry: {
      upsert: mockDiaryEntryUpsert,
      count: mockDiaryEntryCount,
    },
    $transaction: mockTransaction,
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/openai", () => ({
  suggestMeal: vi.fn(),
}));

import { auth } from "@/lib/auth-config";
import { saveSuggestedMeal } from "@/actions/diary-new";

const mockAuth = vi.mocked(auth);

const validSuggestion = {
  foodName: "Ensalada mediterránea",
  quantity: 300,
  unit: "g",
  calories: 250,
  protein: 8,
  carbs: 20,
  fat: 15,
};

const validInput = {
  date: new Date("2024-01-15"),
  mealType: "lunch",
  suggestion: validSuggestion,
};

describe("saveSuggestedMeal — T-06 (mealId ownership + $transaction)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@test.com" });
    // Default: count returns 0 (below cap)
    mockDiaryEntryCount.mockResolvedValue(0);
    // Default: $transaction executes its callback
    mockTransaction.mockImplementation(async (ops: unknown[]) => {
      return Promise.all(ops);
    });
    // Default: meal.findFirst returns null (no meal found)
    mockMealFindFirst.mockResolvedValue(null);
    // Default upsert returns a minimal entry
    mockDiaryEntryUpsert.mockResolvedValue({ id: "entry-1" });
    // Default update returns a minimal meal
    mockMealUpdate.mockResolvedValue({ id: "meal-1" });
  });

  it("calls $transaction when mealId is valid and belongs to user", async () => {
    mockMealFindFirst.mockResolvedValue({ id: "meal-abc", name: "Old name" });

    const result = await saveSuggestedMeal({
      ...validInput,
      mealId: "meal-abc",
    });

    expect(result.success).toBe(true);
    // $transaction must have been called (wraps meal.update + diaryEntry.upsert)
    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });

  it("meal.findFirst is called with userId scope to check ownership", async () => {
    mockMealFindFirst.mockResolvedValue({ id: "meal-abc", name: "Old name" });

    await saveSuggestedMeal({
      ...validInput,
      mealId: "meal-abc",
    });

    expect(mockMealFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "meal-abc",
          mealPlan: expect.objectContaining({ userId: "user-1" }),
        }),
      })
    );
  });

  it("skips meal.update when mealId belongs to different user → only upserts DiaryEntry", async () => {
    // findFirst returns null (meal not found for this user)
    mockMealFindFirst.mockResolvedValue(null);

    const result = await saveSuggestedMeal({
      ...validInput,
      mealId: "meal-other-user",
    });

    expect(result.success).toBe(true);
    // meal.update must NOT be called
    expect(mockMealUpdate).not.toHaveBeenCalled();
    // diaryEntry.upsert must still be called
    expect(mockDiaryEntryUpsert).toHaveBeenCalled();
  });

  it("skips meal.update when mealId is undefined → legacy path, only upserts DiaryEntry", async () => {
    const result = await saveSuggestedMeal(validInput);

    expect(result.success).toBe(true);
    expect(mockMealFindFirst).not.toHaveBeenCalled();
    expect(mockMealUpdate).not.toHaveBeenCalled();
    expect(mockDiaryEntryUpsert).toHaveBeenCalled();
  });

  it("persists aiSuggestion as JSON object (not string)", async () => {
    await saveSuggestedMeal(validInput);

    const upsertCall = mockDiaryEntryUpsert.mock.calls[0][0];
    const createdAiSuggestion = upsertCall.create.aiSuggestion;

    // Must be an object, not a string
    expect(typeof createdAiSuggestion).toBe("object");
    expect(createdAiSuggestion).not.toBeNull();
    expect(createdAiSuggestion.foodName).toBe("Ensalada mediterránea");
  });

  it("does not call $transaction at all if suggestion Zod parse fails", async () => {
    const result = await saveSuggestedMeal({
      date: new Date("2024-01-15"),
      mealType: "lunch",
      suggestion: {
        // foodName missing → invalid
        quantity: 200,
        unit: "g",
        calories: 330,
        protein: 62,
        // carbs missing
        fat: 7,
      },
    });

    expect(result.success).toBe(false);
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockDiaryEntryUpsert).not.toHaveBeenCalled();
  });

  it("returns rate_limit_exceeded when user has 5 accepted AI meals today", async () => {
    mockDiaryEntryCount.mockResolvedValue(5);

    const result = await saveSuggestedMeal(validInput);

    expect(result).toEqual({ success: false, error: "rate_limit_exceeded" });
    expect(mockDiaryEntryUpsert).not.toHaveBeenCalled();
    expect(mockTransaction).not.toHaveBeenCalled();
  });
});
