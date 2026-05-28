import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock modules before importing actions
vi.mock("@/lib/auth-config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    diaryEntry: {
      count: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    meal: {
      findFirst: vi.fn(),
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
import { toggleMealCompleted, saveSuggestedMeal } from "@/actions/diary-new";

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function yesterday(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

const validSuggestion = {
  foodName: "Grilled chicken",
  quantity: 200,
  unit: "g",
  calories: 330,
  protein: 62,
  carbs: 0,
  fat: 7,
};

// ─── toggleMealCompleted — past_date guard ────────────────────────────────────

describe("toggleMealCompleted — past_date guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });
  });

  it("fecha pasada → { success: false, error: 'past_date' } sin llamar upsert", async () => {
    const result = await toggleMealCompleted({
      date: yesterday(),
      mealType: "dinner",
      mealId: "meal-1",
      macros: { calories: 300, protein: 30, carbs: 20, fat: 10 },
    });

    expect(result).toEqual({ success: false, error: "past_date" });
    expect(mockPrisma.diaryEntry.upsert).not.toHaveBeenCalled();
  });

  it("fecha hoy → procede normalmente (regresión)", async () => {
    mockPrisma.diaryEntry.findFirst.mockResolvedValue(null);
    mockPrisma.diaryEntry.upsert.mockResolvedValue({
      id: "entry-1",
      completed: true,
    } as any);

    const result = await toggleMealCompleted({
      date: today(),
      mealType: "dinner",
      mealId: "meal-1",
      macros: { calories: 300, protein: 30, carbs: 20, fat: 10 },
    });

    expect(result.success).toBe(true);
    expect(mockPrisma.diaryEntry.upsert).toHaveBeenCalled();
  });

  it("no autenticado con fecha pasada → unauthenticated (no past_date)", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await toggleMealCompleted({
      date: yesterday(),
      mealType: "dinner",
      mealId: "meal-1",
      macros: { calories: 300, protein: 30, carbs: 20, fat: 10 },
    });

    expect(result).toEqual({ success: false, error: "unauthenticated" });
    expect(mockPrisma.diaryEntry.upsert).not.toHaveBeenCalled();
  });

  it("input inválido con fecha pasada → invalid_input (no past_date)", async () => {
    const result = await toggleMealCompleted({
      date: "not-a-date",
      mealType: "dinner",
    });

    expect(result).toEqual({ success: false, error: "invalid_input" });
    expect(mockPrisma.diaryEntry.upsert).not.toHaveBeenCalled();
  });
});

// ─── saveSuggestedMeal — past_date guard ──────────────────────────────────────

describe("saveSuggestedMeal — past_date guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });
  });

  it("fecha pasada → { success: false, error: 'past_date' } sin llamar upsert", async () => {
    const result = await saveSuggestedMeal({
      date: yesterday(),
      mealType: "dinner",
      suggestion: validSuggestion,
    });

    expect(result).toEqual({ success: false, error: "past_date" });
    expect(mockPrisma.diaryEntry.upsert).not.toHaveBeenCalled();
    expect(mockPrisma.diaryEntry.count).not.toHaveBeenCalled();
  });

  it("fecha hoy → procede normalmente (regresión)", async () => {
    mockPrisma.diaryEntry.count.mockResolvedValue(0);
    mockPrisma.diaryEntry.upsert.mockResolvedValue({ id: "entry-1" } as any);

    const result = await saveSuggestedMeal({
      date: today(),
      mealType: "dinner",
      suggestion: validSuggestion,
    });

    expect(result).toEqual({ success: true });
    expect(mockPrisma.diaryEntry.upsert).toHaveBeenCalled();
  });

  it("no autenticado con fecha pasada → unauthenticated (no past_date)", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await saveSuggestedMeal({
      date: yesterday(),
      mealType: "dinner",
      suggestion: validSuggestion,
    });

    expect(result).toEqual({ success: false, error: "unauthenticated" });
    expect(mockPrisma.diaryEntry.upsert).not.toHaveBeenCalled();
  });
});
