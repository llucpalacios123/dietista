import { describe, it, expect } from "vitest";
import { macro, brand, semantic, density, accent } from "./dietista-tokens";

describe("dietista-tokens", () => {
  describe("macro colors", () => {
    it("should have foreground and background for each macro", () => {
      const macros = ["cal", "pro", "carb", "fat"] as const;
      for (const m of macros) {
        expect(macro[m]).toHaveProperty("fg");
        expect(macro[m]).toHaveProperty("bg");
        expect(typeof macro[m].fg).toBe("string");
        expect(typeof macro[m].bg).toBe("string");
      }
    });

    it("should use correct hex color format", () => {
      expect(macro.cal.fg).toMatch(/^#[0-9a-f]{6}$/i);
      expect(macro.pro.fg).toMatch(/^#[0-9a-f]{6}$/i);
      expect(macro.carb.fg).toMatch(/^#[0-9a-f]{6}$/i);
      expect(macro.fat.fg).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  describe("brand colors", () => {
    it("should have all 10 shades", () => {
      const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
      for (const s of shades) {
        expect(brand).toHaveProperty(s);
        expect(typeof brand[s]).toBe("string");
      }
    });
  });

  describe("semantic colors", () => {
    it("should have success, warning, danger", () => {
      expect(semantic).toHaveProperty("success");
      expect(semantic).toHaveProperty("warning");
      expect(semantic).toHaveProperty("danger");
    });
  });

  describe("density variants", () => {
    it("should have cozy, comfortable, compact", () => {
      expect(density).toHaveProperty("cozy");
      expect(density).toHaveProperty("comfortable");
      expect(density).toHaveProperty("compact");
    });

    it("should have padCard and gapCard for each density", () => {
      for (const [, values] of Object.entries(density)) {
        expect(values).toHaveProperty("padCard");
        expect(values).toHaveProperty("gapCard");
      }
    });
  });

  describe("accent variants", () => {
    it("should have emerald, lime, forest, teal", () => {
      expect(accent).toHaveProperty("emerald");
      expect(accent).toHaveProperty("lime");
      expect(accent).toHaveProperty("forest");
      expect(accent).toHaveProperty("teal");
    });

    it("should have ringCal matching brand for each accent", () => {
      expect(accent.emerald.ringCal).toBe("#10b981");
      expect(accent.lime.ringCal).toBe("#84cc16");
      expect(accent.forest.ringCal).toBe("#22c55e");
      expect(accent.teal.ringCal).toBe("#14b8a6");
    });
  });
});
