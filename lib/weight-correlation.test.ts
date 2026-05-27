import { describe, it, expect } from "vitest";
import { computePlanBands } from "@/lib/weight-correlation";

// Helper to build Date objects at UTC midnight
function utcDay(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

describe("computePlanBands", () => {
  describe("no plans", () => {
    it("returns empty array when plans is empty", () => {
      const logs = [{ date: utcDay("2024-03-15"), weight: 72.5 }];
      const result = computePlanBands(logs, []);
      expect(result).toEqual([]);
    });
  });

  describe("< 2 logs in range → null delta", () => {
    it("returns null delta when only 1 log falls within plan range", () => {
      const plans = [
        {
          id: "p1",
          startDate: utcDay("2024-03-11"),
          endDate: utcDay("2024-03-17"),
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          template: { name: "Cutting Phase" },
        },
      ];
      const logs = [{ date: utcDay("2024-03-13"), weight: 72.0 }];
      const result = computePlanBands(logs, plans);
      expect(result).toHaveLength(1);
      expect(result[0].deltaKg).toBeNull();
      expect(result[0].name).toBe("Cutting Phase");
    });

    it("returns null delta when no logs fall within plan range", () => {
      const plans = [
        {
          id: "p1",
          startDate: utcDay("2024-04-01"),
          endDate: utcDay("2024-04-07"),
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          template: { name: "Bulking" },
        },
      ];
      const logs = [{ date: utcDay("2024-03-15"), weight: 72.5 }];
      const result = computePlanBands(logs, plans);
      expect(result).toHaveLength(1);
      expect(result[0].deltaKg).toBeNull();
      expect(result[0].name).toBe("Bulking");
    });
  });

  describe("exactly 2 logs → delta = last − first", () => {
    it("computes correct negative delta (weight loss)", () => {
      const plans = [
        {
          id: "p1",
          startDate: utcDay("2024-03-11"),
          endDate: utcDay("2024-03-17"),
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          template: { name: "Cutting Phase" },
        },
      ];
      const logs = [
        { date: utcDay("2024-03-11"), weight: 72.5 },
        { date: utcDay("2024-03-15"), weight: 71.8 },
      ];
      const result = computePlanBands(logs, plans);
      expect(result).toHaveLength(1);
      // delta = last - first = 71.8 - 72.5 = -0.7
      expect(result[0].deltaKg).toBeCloseTo(-0.7, 5);
      expect(result[0].name).toBe("Cutting Phase");
      expect(result[0].planId).toBe("p1");
    });

    it("computes correct positive delta (weight gain)", () => {
      const plans = [
        {
          id: "p2",
          startDate: utcDay("2024-03-11"),
          endDate: utcDay("2024-03-17"),
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          template: { name: "Bulking Phase" },
        },
      ];
      const logs = [
        { date: utcDay("2024-03-11"), weight: 70.0 },
        { date: utcDay("2024-03-17"), weight: 71.5 },
      ];
      const result = computePlanBands(logs, plans);
      expect(result).toHaveLength(1);
      expect(result[0].deltaKg).toBeCloseTo(1.5, 5);
    });
  });

  describe("overlapping plans → newest createdAt wins", () => {
    it("assigns a date to the most recently created plan when plans overlap", () => {
      const planA = {
        id: "planA",
        startDate: utcDay("2024-03-11"),
        endDate: utcDay("2024-03-17"),
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        template: { name: "Plan A" },
      };
      const planB = {
        id: "planB",
        startDate: utcDay("2024-03-11"),
        endDate: utcDay("2024-03-17"),
        createdAt: new Date("2024-02-01T00:00:00.000Z"),
        template: { name: "Plan B" },
      };
      const logs = [
        { date: utcDay("2024-03-11"), weight: 72.0 },
        { date: utcDay("2024-03-15"), weight: 71.0 },
      ];

      // Plans passed in ascending order; tie-break should pick planB (newer)
      const result = computePlanBands(logs, [planA, planB]);

      // planB is newer → gets the logs → non-null delta
      const bandB = result.find((b) => b.planId === "planB");
      const bandA = result.find((b) => b.planId === "planA");

      expect(bandB?.deltaKg).toBeCloseTo(-1.0, 5);
      // planA gets no logs for those dates (assigned to B) → null
      expect(bandA?.deltaKg).toBeNull();
    });
  });

  describe("edge cases (triangulation)", () => {
    it("returns null delta for a single log on its own date (same-day entry)", () => {
      const plans = [
        {
          id: "p1",
          startDate: utcDay("2024-03-11"),
          endDate: utcDay("2024-03-17"),
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          template: { name: "Plan" },
        },
      ];
      // Only one unique date in range
      const logs = [{ date: utcDay("2024-03-11"), weight: 72.0 }];
      const result = computePlanBands(logs, plans);
      expect(result[0].deltaKg).toBeNull();
    });

    it("includes logs on exact boundary dates (startDate and endDate inclusive)", () => {
      const plans = [
        {
          id: "p1",
          startDate: utcDay("2024-03-11"),
          endDate: utcDay("2024-03-17"),
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          template: { name: "Plan" },
        },
      ];
      const logs = [
        { date: utcDay("2024-03-11"), weight: 75.0 }, // exactly startDate
        { date: utcDay("2024-03-17"), weight: 73.0 }, // exactly endDate
      ];
      const result = computePlanBands(logs, plans);
      // delta = 73.0 - 75.0 = -2.0
      expect(result[0].deltaKg).toBeCloseTo(-2.0, 5);
    });

    it("handles multiple non-overlapping plans independently", () => {
      const planA = {
        id: "planA",
        startDate: utcDay("2024-03-01"),
        endDate: utcDay("2024-03-07"),
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        template: { name: "Plan A" },
      };
      const planB = {
        id: "planB",
        startDate: utcDay("2024-03-08"),
        endDate: utcDay("2024-03-14"),
        createdAt: new Date("2024-01-15T00:00:00.000Z"),
        template: { name: "Plan B" },
      };
      const logs = [
        { date: utcDay("2024-03-01"), weight: 80.0 },
        { date: utcDay("2024-03-07"), weight: 79.0 },
        { date: utcDay("2024-03-08"), weight: 79.5 },
        { date: utcDay("2024-03-14"), weight: 78.0 },
      ];
      const result = computePlanBands(logs, [planA, planB]);
      const bandA = result.find((b) => b.planId === "planA");
      const bandB = result.find((b) => b.planId === "planB");
      // Plan A: last - first = 79.0 - 80.0 = -1.0
      expect(bandA?.deltaKg).toBeCloseTo(-1.0, 5);
      // Plan B: last - first = 78.0 - 79.5 = -1.5
      expect(bandB?.deltaKg).toBeCloseTo(-1.5, 5);
    });
  });

  describe("band metadata", () => {
    it("includes startDate and endDate as ISO date strings", () => {
      const plans = [
        {
          id: "p1",
          startDate: utcDay("2024-03-11"),
          endDate: utcDay("2024-03-17"),
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          template: { name: "Test" },
        },
      ];
      const logs = [
        { date: utcDay("2024-03-11"), weight: 72.0 },
        { date: utcDay("2024-03-15"), weight: 71.0 },
      ];
      const result = computePlanBands(logs, plans);
      expect(result[0].startDate).toBe("2024-03-11");
      expect(result[0].endDate).toBe("2024-03-17");
    });

    it("handles plan without template (name falls back to plan id)", () => {
      const plans = [
        {
          id: "p1",
          startDate: utcDay("2024-03-11"),
          endDate: utcDay("2024-03-17"),
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          template: null,
        },
      ];
      const logs = [{ date: utcDay("2024-03-11"), weight: 72.0 }];
      const result = computePlanBands(logs, plans);
      expect(typeof result[0].name).toBe("string");
      expect(result[0].name.length).toBeGreaterThan(0);
    });
  });
});
