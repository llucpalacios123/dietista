import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockAuth = vi.fn();
vi.mock("@/lib/auth-config", () => ({
  auth: mockAuth,
}));

const mockGenerateWorkoutPlan = vi.fn();
vi.mock("@/lib/workout-plan-service", () => ({
  generateWorkoutPlan: mockGenerateWorkoutPlan,
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const validPreferences = {
  goal: "strength" as const,
  level: "intermediate" as const,
  daysPerWeek: 4,
  focusGroups: ["chest" as const, "back" as const],
  equipment: ["gym" as const],
  sessionDurationMin: 60,
  name: "Mi plan de fuerza",
};

const authenticatedSession = { userId: "user-1" };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("generateWorkoutPlanAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authenticated user", () => {
    it("returns planId on successful generation", async () => {
      mockAuth.mockResolvedValue(authenticatedSession);
      mockGenerateWorkoutPlan.mockResolvedValue({
        workoutPlanId: "plan-new-123",
        dayCount: 4,
      });

      const { generateWorkoutPlanAction } = await import("@/actions/workout-wizard");
      const result = await generateWorkoutPlanAction(validPreferences);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.planId).toBe("plan-new-123");
      }
    });

    it("calls generateWorkoutPlan with correct userId and preferences", async () => {
      mockAuth.mockResolvedValue(authenticatedSession);
      mockGenerateWorkoutPlan.mockResolvedValue({ workoutPlanId: "plan-abc", dayCount: 3 });

      const { generateWorkoutPlanAction } = await import("@/actions/workout-wizard");
      await generateWorkoutPlanAction(validPreferences);

      expect(mockGenerateWorkoutPlan).toHaveBeenCalledWith("user-1", validPreferences);
    });

    it("returns error when service throws", async () => {
      mockAuth.mockResolvedValue(authenticatedSession);
      mockGenerateWorkoutPlan.mockRejectedValue(new Error("OpenAI falló"));

      const { generateWorkoutPlanAction } = await import("@/actions/workout-wizard");
      const result = await generateWorkoutPlanAction(validPreferences);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeTruthy();
      }
    });

    it("returns user-friendly error message on service failure", async () => {
      mockAuth.mockResolvedValue(authenticatedSession);
      mockGenerateWorkoutPlan.mockRejectedValue(new Error("La IA falló"));

      const { generateWorkoutPlanAction } = await import("@/actions/workout-wizard");
      const result = await generateWorkoutPlanAction(validPreferences);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(typeof result.error).toBe("string");
        expect(result.error.length).toBeGreaterThan(0);
      }
    });

    it("does NOT create a plan when service throws (no side effects)", async () => {
      mockAuth.mockResolvedValue(authenticatedSession);
      mockGenerateWorkoutPlan.mockRejectedValue(new Error("Error"));

      const { generateWorkoutPlanAction } = await import("@/actions/workout-wizard");
      await generateWorkoutPlanAction(validPreferences);

      // generateWorkoutPlan was called once but errored — no second call
      expect(mockGenerateWorkoutPlan).toHaveBeenCalledTimes(1);
    });
  });

  describe("unauthenticated user", () => {
    it("returns auth error when no session", async () => {
      mockAuth.mockResolvedValue(null);

      const { generateWorkoutPlanAction } = await import("@/actions/workout-wizard");
      const result = await generateWorkoutPlanAction(validPreferences);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeTruthy();
      }
    });

    it("does NOT call generateWorkoutPlan without session", async () => {
      mockAuth.mockResolvedValue(null);

      const { generateWorkoutPlanAction } = await import("@/actions/workout-wizard");
      await generateWorkoutPlanAction(validPreferences);

      expect(mockGenerateWorkoutPlan).not.toHaveBeenCalled();
    });

    it("returns auth error when session has no userId", async () => {
      mockAuth.mockResolvedValue({});

      const { generateWorkoutPlanAction } = await import("@/actions/workout-wizard");
      const result = await generateWorkoutPlanAction(validPreferences);

      expect(result.success).toBe(false);
    });
  });
});
