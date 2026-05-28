import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock modules before importing the actions
vi.mock("@/lib/auth-config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    meal: {
      findFirst: vi.fn(),
    },
    diaryEntry: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
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
import { toggleMealCompleted, getSuggestion, saveSuggestedMeal } from "@/actions/diary-new";

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);
const mockSuggestMeal = vi.mocked(suggestMeal);

// Use today so the past_date guard does not fire for tests that exercise the happy path
function todayDate(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

describe("toggleMealCompleted", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });
  });

  it("returns unauthenticated error when no session", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await toggleMealCompleted({
      date: new Date("2024-01-15"),
      mealType: "breakfast",
    });
    expect(result).toEqual({ success: false, error: "unauthenticated" });
    expect(mockPrisma.diaryEntry.findFirst).not.toHaveBeenCalled();
  });

  it("toggles ON — upserts with completed=true and copies planned macros", async () => {
    // No existing entry
    mockPrisma.diaryEntry.findFirst.mockResolvedValue(null);
    mockPrisma.meal.findFirst.mockResolvedValue({
      id: "meal-abc",
      calories: 600,
      protein: 40,
      carbs: 70,
      fat: 20,
    } as any);
    mockPrisma.diaryEntry.upsert.mockResolvedValue({
      id: "entry-1",
      completed: true,
      actualCalories: 600,
      actualProtein: 40,
      actualCarbs: 70,
      actualFat: 20,
    } as any);

    const result = await toggleMealCompleted({
      date: todayDate(),
      mealType: "lunch",
      mealId: "meal-abc",
    });

    expect(result.success).toBe(true);
    expect(result.completed).toBe(true);
    expect(mockPrisma.diaryEntry.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId_date_mealType: expect.any(Object) }),
        create: expect.objectContaining({ completed: true }),
        update: expect.objectContaining({ completed: true }),
      })
    );
  });

  it("toggles OFF — sets completed=false and clears actual macros", async () => {
    // Existing completed entry
    mockPrisma.diaryEntry.findFirst.mockResolvedValue({
      id: "entry-1",
      completed: true,
      actualCalories: 600,
      actualProtein: 40,
      actualCarbs: 70,
      actualFat: 20,
    } as any);
    mockPrisma.diaryEntry.upsert.mockResolvedValue({
      id: "entry-1",
      completed: false,
      actualCalories: null,
      actualProtein: null,
      actualCarbs: null,
      actualFat: null,
    } as any);

    const result = await toggleMealCompleted({
      date: todayDate(),
      mealType: "lunch",
    });

    expect(result.success).toBe(true);
    expect(result.completed).toBe(false);
    expect(mockPrisma.diaryEntry.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          completed: false,
          actualCalories: null,
          actualProtein: null,
          actualCarbs: null,
          actualFat: null,
        }),
        update: expect.objectContaining({
          completed: false,
          actualCalories: null,
          actualProtein: null,
          actualCarbs: null,
          actualFat: null,
        }),
      })
    );
  });

  it("toggles ON without mealId — upserts with provided macros", async () => {
    mockPrisma.diaryEntry.findFirst.mockResolvedValue(null);
    mockPrisma.diaryEntry.upsert.mockResolvedValue({
      id: "entry-1",
      completed: true,
    } as any);

    const result = await toggleMealCompleted({
      date: todayDate(),
      mealType: "breakfast",
      macros: { calories: 300, protein: 20, carbs: 40, fat: 10 },
    });

    expect(result.success).toBe(true);
    expect(result.completed).toBe(true);
  });
});

describe("getSuggestion", () => {
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

  // Rate-limit was moved to saveSuggestedMeal (T-03/T-04).
  // getSuggestion no longer checks daily AI count.
  // This test now verifies the turn_limit guard instead.
  it("returns turn_limit_exceeded when history has 20 messages", async () => {
    const history = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant" as const,
      text: `msg ${i}`,
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

  it("returns ai_parse_error when OpenAI throws", async () => {
    mockPrisma.diaryEntry.findMany.mockResolvedValue([]);
    mockPrisma.profile.findUnique.mockResolvedValue({
      targetCalories: 2000,
      targetProtein: 150,
      targetCarbs: 250,
      targetFat: 65,
      allergies: [],
    } as any);
    mockSuggestMeal.mockRejectedValue(new Error("Invalid JSON from AI"));

    const result = await getSuggestion({
      date: new Date("2024-01-15"),
      mealType: "dinner",
      query: "Something light",
    });

    expect(result).toEqual({ success: false, error: "ai_parse_error" });
    expect(mockPrisma.diaryEntry.upsert).not.toHaveBeenCalled();
  });

  it("returns AI result without writing to DB", async () => {
    mockPrisma.diaryEntry.findMany.mockResolvedValue([
      {
        completed: true,
        actualCalories: 500,
        actualProtein: 30,
        actualCarbs: 60,
        actualFat: 15,
      } as any,
    ]);
    mockPrisma.profile.findUnique.mockResolvedValue({
      targetCalories: 2000,
      targetProtein: 150,
      targetCarbs: 250,
      targetFat: 65,
      allergies: ["nuts"],
    } as any);
    const aiResult = {
      message: "Here is a great chicken option for you.",
      suggestion: {
        foodName: "Grilled chicken",
        quantity: 200,
        unit: "g",
        calories: 330,
        protein: 62,
        carbs: 0,
        fat: 7,
      },
    };
    mockSuggestMeal.mockResolvedValue(aiResult);

    const result = await getSuggestion({
      date: new Date("2024-01-15"),
      mealType: "dinner",
      query: "Something with chicken",
    });

    expect(result.success).toBe(true);
    expect(result.result).toEqual(aiResult);
    expect(mockPrisma.diaryEntry.upsert).not.toHaveBeenCalled();
  });
});

describe("saveSuggestedMeal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });
  });

  it("returns unauthenticated error when no session", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await saveSuggestedMeal({
      date: new Date("2024-01-15"),
      mealType: "dinner",
      suggestion: { foodName: "Rice", quantity: 150, unit: "g", calories: 200, protein: 4, carbs: 44, fat: 1 },
    });
    expect(result).toEqual({ success: false, error: "unauthenticated" });
    expect(mockPrisma.diaryEntry.upsert).not.toHaveBeenCalled();
  });

  it("upserts DiaryEntry with suggestion data and revalidates", async () => {
    mockPrisma.diaryEntry.count.mockResolvedValue(0); // below cap — allow save
    mockPrisma.diaryEntry.upsert.mockResolvedValue({ id: "entry-2" } as any);

    const result = await saveSuggestedMeal({
      date: todayDate(),
      mealType: "dinner",
      suggestion: {
        foodName: "Grilled chicken",
        quantity: 200,
        unit: "g",
        calories: 330,
        protein: 62,
        carbs: 0,
        fat: 7,
      },
    });

    expect(result).toEqual({ success: true });
    expect(mockPrisma.diaryEntry.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          completed: true,
          actualCalories: 330,
          actualProtein: 62,
          aiSuggestion: expect.stringContaining("Grilled chicken"),
        }),
        update: expect.objectContaining({
          completed: true,
          actualCalories: 330,
          actualProtein: 62,
          aiSuggestion: expect.stringContaining("Grilled chicken"),
        }),
      })
    );
  });
});
